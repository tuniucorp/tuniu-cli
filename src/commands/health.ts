import chalk from 'chalk';
import Table from 'cli-table3';
import { ConfigManager } from '../config/index.js';
import { handleError } from '../errors/index.js';
import { McpClientManager } from '../mcp/index.js';

export async function executeHealth(options: {
  server?: string;
  parallel?: boolean;
  outputFormat?: string;
  configManager?: ConfigManager;
  verbose?: boolean;
}): Promise<number> {
  const {
    server,
    parallel = false,
    outputFormat = 'json',
    configManager = new ConfigManager(),
    verbose = false,
  } = options;

  try {
    configManager.ensureApiKey(server ? [server] : undefined);

    const manager = new McpClientManager(configManager, verbose);
    const results = await manager.healthCheck(server, parallel);

    if (outputFormat === 'table') {
      const table = new Table({
        head: ['服务', '状态', '延迟(ms)', '错误'],
      });

      for (const [srv, result] of Object.entries(results)) {
        const status = result.status as string;
        const latency = result.latency_ms ?? '-';
        const error = result.error ?? '-';
        const statusStr =
          status === 'healthy' ? chalk.green('健康') : chalk.red('不健康');
        table.push([srv, statusStr, String(latency), String(error)]);
      }

      console.error(chalk.bold('服务健康状态'));
      console.error(table.toString());
    } else {
      console.log(JSON.stringify(results, null, 2));
    }

    return 0;
  } catch (e) {
    return handleError(e, outputFormat);
  }
}
