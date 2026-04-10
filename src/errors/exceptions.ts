import { ExitCode } from './codes.js';

export class McpCliError extends Error {
  readonly exitCode: ExitCode = ExitCode.UNKNOWN_ERROR;
  readonly errorType: string = 'UnknownError';
  readonly details: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details ?? {};
  }

  toDict(): Record<string, unknown> {
    const result: Record<string, unknown> = {
      type: this.errorType,
      message: this.message,
      code: this.exitCode,
    };
    if (Object.keys(this.details).length > 0) {
      result.details = this.details;
    }
    return result;
  }
}

export class McpConnectionError extends McpCliError {
  override readonly exitCode = ExitCode.CONNECTION_FAILED;
  override readonly errorType = 'ConnectionError';

  constructor(
    message = '连接 MCP 服务器失败',
    options?: { server?: string; details?: Record<string, unknown> },
  ) {
    const errorDetails = { ...options?.details };
    if (options?.server) errorDetails.server = options.server;
    super(message, errorDetails);
  }
}

export class ToolNotFoundError extends McpCliError {
  override readonly exitCode = ExitCode.TOOL_NOT_FOUND;
  override readonly errorType = 'ToolNotFoundError';

  constructor(
    tool: string,
    options?: { server?: string; availableTools?: string[] },
  ) {
    const details: Record<string, unknown> = { tool };
    if (options?.server) details.server = options.server;
    if (options?.availableTools) details.available_tools = options.availableTools;
    super(`工具 '${tool}' 不存在`, details);
  }
}

export class InvalidParamsError extends McpCliError {
  override readonly exitCode = ExitCode.INVALID_PARAMS;
  override readonly errorType = 'InvalidParamsError';

  constructor(
    message = '参数错误',
    options?: {
      paramName?: string;
      paramValue?: unknown;
      expectedType?: string;
      details?: Record<string, unknown>;
    },
  ) {
    const errorDetails = { ...options?.details };
    if (options?.paramName) errorDetails.param_name = options.paramName;
    if (options?.paramValue !== undefined)
      errorDetails.param_value = String(options.paramValue);
    if (options?.expectedType) errorDetails.expected_type = options.expectedType;
    super(message, errorDetails);
  }
}

export class AuthFailedError extends McpCliError {
  override readonly exitCode = ExitCode.AUTH_FAILED;
  override readonly errorType = 'AuthFailedError';

  constructor(message = '认证失败，请检查 API Key', server?: string) {
    const details: Record<string, unknown> = {};
    if (server) details.server = server;
    super(message, details);
  }
}

export class McpTimeoutError extends McpCliError {
  override readonly exitCode = ExitCode.TIMEOUT;
  override readonly errorType = 'TimeoutError';

  constructor(
    message = '请求超时',
    options?: { timeoutSeconds?: number; server?: string },
  ) {
    const details: Record<string, unknown> = {};
    if (options?.timeoutSeconds !== undefined)
      details.timeout_seconds = options.timeoutSeconds;
    if (options?.server) details.server = options.server;
    super(message, details);
  }
}

export class ServerError extends McpCliError {
  override readonly exitCode = ExitCode.SERVER_ERROR;
  override readonly errorType = 'ServerError';

  constructor(
    message = 'MCP 服务器错误',
    options?: {
      statusCode?: number;
      server?: string;
      details?: Record<string, unknown>;
    },
  ) {
    const errorDetails = { ...options?.details };
    if (options?.statusCode !== undefined)
      errorDetails.status_code = options.statusCode;
    if (options?.server) errorDetails.server = options.server;
    super(message, errorDetails);
  }
}

export class ConfigError extends McpCliError {
  override readonly exitCode = ExitCode.CONFIG_ERROR;
  override readonly errorType = 'ConfigError';

  constructor(
    message = '配置错误',
    options?: { configPath?: string; details?: Record<string, unknown> },
  ) {
    const errorDetails = { ...options?.details };
    if (options?.configPath) errorDetails.config_path = options.configPath;
    super(message, errorDetails);
  }
}

export class ApiKeyRequiredError extends McpCliError {
  override readonly exitCode = ExitCode.API_KEY_REQUIRED;
  override readonly errorType = 'ApiKeyRequiredError';

  constructor(
    message = '需要配置 API Key 才能访问途牛 MCP 服务，可以前往途牛开放平台 https://open.tuniu.com/mcp/login 获取 API Key',
    details?: Record<string, unknown>,
  ) {
    const errorDetails = { ...details };
    if (!errorDetails.hint) {
      errorDetails.hint =
        '请设置 TUNIU_API_KEY 环境变量获取 API Key，例如: export TUNIU_API_KEY=your_api_key，可以前往途牛开放平台 https://open.tuniu.com/mcp/login 注册登录获取 API Key';
    }
    super(message, errorDetails);
  }
}
