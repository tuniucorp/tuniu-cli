import chalk from 'chalk';
import { ConfigManager } from '../config/index.js';
import { InvalidParamsError, handleError } from '../errors/index.js';
import { McpClientManager } from '../mcp/index.js';

export async function executeCall(options: {
  server: string;
  tool: string;
  argsJson?: string;
  outputFormat?: string;
  configManager?: ConfigManager;
  dryRun?: boolean;
  verbose?: boolean;
}): Promise<number> {
  const {
    server,
    tool,
    argsJson,
    outputFormat = 'json',
    configManager = new ConfigManager(),
    dryRun = false,
    verbose = false,
  } = options;

  let args: Record<string, unknown> = {};
  if (argsJson) {
    try {
      const parsed: unknown = JSON.parse(argsJson);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new InvalidParamsError('参数必须是 JSON 对象', {
          details: { args: argsJson },
        });
      }
      args = parsed as Record<string, unknown>;
    } catch (e) {
      if (e instanceof InvalidParamsError) throw e;
      throw new InvalidParamsError(`JSON 解析失败: ${e}`, {
        details: { args: argsJson },
      });
    }
  }

  if (verbose) {
    console.error(chalk.dim(`调用服务: ${server}`));
    console.error(chalk.dim(`调用工具: ${tool}`));
    console.error(chalk.dim(`参数: ${JSON.stringify(args)}`));
  }

  if (!dryRun) {
    configManager.ensureApiKey([server]);
  }

  if (dryRun) {
    const result = {
      success: true,
      result: { dry_run: true, message: '模拟执行，未实际调用' },
      metadata: { server, tool, arguments: args },
    };
    console.log(JSON.stringify(result, null, 2));
    return 0;
  }

  try {
    const manager = new McpClientManager(configManager, verbose);

    const startTime = performance.now();
    const response = await manager.callTool(server, tool, args);
    const latencyMs = Math.round(performance.now() - startTime);

    if (verbose) {
      console.error(chalk.dim(`耗时: ${latencyMs}ms`));
    }

    const result = {
      success: true,
      result: response.result,
      metadata: { server, tool, latency_ms: latencyMs },
    };
    console.log(JSON.stringify(result, null, 2));
    return 0;
  } catch (e) {
    return handleError(e, outputFormat, verbose);
  }
}
