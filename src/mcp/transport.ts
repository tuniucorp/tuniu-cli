import {
  AuthFailedError,
  McpConnectionError,
  McpTimeoutError,
  ServerError,
} from '../errors/index.js';

export function parseSseOrJson(text: string): Record<string, unknown> {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return {};

  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    // not plain JSON, try SSE
  }

  const dataLines: string[] = [];
  for (const line of trimmed.split('\n')) {
    const stripped = line.trimEnd();
    if (stripped.startsWith('data:')) {
      const dataContent = stripped.slice(5).trim();
      if (dataContent) dataLines.push(dataContent);
    }
  }

  if (dataLines.length > 0) {
    const combined = dataLines.join('\n');
    try {
      return JSON.parse(combined) as Record<string, unknown>;
    } catch {
      // fall through
    }
  }

  throw new SyntaxError('既非有效 JSON 也非 SSE 格式');
}

export function maskApiKey(val: string): string {
  if (!val || val.length < 8) return '***';
  return val.length > 6 ? `${val.slice(0, 4)}...${val.slice(-2)}` : '***';
}

export function buildCurlDebug(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string,
  maskSecrets = true,
): string {
  const lines = [`curl -X ${method} "${url}"`];
  for (const [k, v] of Object.entries(headers)) {
    const displayV =
      maskSecrets && ['apikey', 'authorization'].includes(k.toLowerCase())
        ? maskApiKey(v)
        : v;
    const escaped = displayV.replace(/'/g, "'\"'\"'");
    lines.push(`  -H '${k}: ${escaped}'`);
  }
  const bodyEscaped = body.includes("'")
    ? body.replace(/'/g, "'\"'\"'")
    : body;
  lines.push(`  -d '${bodyEscaped}'`);
  return lines.join(' \\\n');
}

export class HttpTransport {
  readonly baseUrl: string;
  readonly headers: Record<string, string>;
  readonly timeout: number;
  readonly verbose: boolean;

  constructor(
    baseUrl: string,
    headers?: Record<string, string>,
    timeout = 30,
    verbose = false,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.headers = headers ?? {};
    this.timeout = timeout;
    this.verbose = verbose;
  }

  private handleError(error: unknown, server: string): never {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new McpTimeoutError(`请求超时 (${this.timeout}s)`, {
        timeoutSeconds: this.timeout,
        server,
      });
    }
    if (error instanceof TypeError) {
      throw new McpConnectionError(`无法连接到服务器: ${this.baseUrl}`, {
        server,
      });
    }
    throw new McpConnectionError(`网络错误: ${error}`, { server });
  }

  async sendRequest(
    method: string,
    params?: Record<string, unknown>,
    server = 'unknown',
  ): Promise<unknown> {
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method,
      params: params ?? {},
    };

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...this.headers,
    };

    const bodyStr = JSON.stringify(payload);

    if (this.verbose) {
      const curlCmd = buildCurlDebug(
        this.baseUrl,
        'POST',
        requestHeaders,
        bodyStr,
      );
      console.error('\n[DEBUG] MCP 请求 (curl 格式):');
      console.error(curlCmd);
      console.error(`[DEBUG] 完整 URL: ${this.baseUrl}`);
      console.error(`[DEBUG] method: ${method}, params: ${JSON.stringify(params)}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.timeout * 1000,
    );

    let response: Response;
    try {
      response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: bodyStr,
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      this.handleError(error, server);
    }
    clearTimeout(timeoutId);

    if (this.verbose) {
      console.error(
        `[DEBUG] 响应: status=${response.status}, url=${response.url}`,
      );
    }

    const responseText = await response.text();

    if (this.verbose) {
      try {
        const respJson = parseSseOrJson(responseText);
        let summary = JSON.stringify(respJson);
        if (summary.length > 500) summary = summary.slice(0, 500) + '...';
        console.error(`[DEBUG] 响应 body: ${summary}`);
      } catch {
        const txt = responseText ? responseText.slice(0, 500) : '(empty)';
        console.error(`[DEBUG] 响应 body (raw): ${txt}`);
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthFailedError('认证失败，请检查 API Key', server);
      }
      if (response.status === 404) {
        throw new ServerError('服务端点不存在', {
          statusCode: 404,
          server,
        });
      }
      if (response.status >= 500) {
        throw new ServerError(`服务器内部错误: ${response.status}`, {
          statusCode: response.status,
          server,
        });
      }
      throw new ServerError(`HTTP 错误: ${response.status}`, {
        statusCode: response.status,
        server,
      });
    }

    let data: Record<string, unknown>;
    try {
      data = parseSseOrJson(responseText);
    } catch {
      throw new ServerError('服务器返回无效 JSON', { server });
    }

    if ('error' in data && data.error) {
      const rpcError = data.error as Record<string, unknown>;
      throw new ServerError(
        (rpcError.message as string) ?? '未知错误',
        { details: rpcError, server },
      );
    }

    return (data as Record<string, unknown>).result;
  }

  async listTools(server = 'unknown'): Promise<Record<string, unknown>[]> {
    const result = (await this.sendRequest('tools/list', undefined, server)) as
      | Record<string, unknown>
      | undefined;
    return ((result as Record<string, unknown>)?.tools ??
      []) as Record<string, unknown>[];
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
    server = 'unknown',
  ): Promise<unknown> {
    return this.sendRequest(
      'tools/call',
      { name, arguments: args },
      server,
    );
  }

  async healthCheck(
    server = 'unknown',
  ): Promise<Record<string, unknown>> {
    try {
      const start = performance.now();
      await this.listTools(server);
      const latencyMs = Math.round(performance.now() - start);
      return { status: 'healthy', latency_ms: latencyMs };
    } catch (e) {
      return { status: 'unhealthy', error: String(e) };
    }
  }
}
