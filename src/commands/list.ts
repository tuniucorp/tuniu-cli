import chalk from 'chalk';
import Table from 'cli-table3';
import { ConfigManager, type ServerConfig } from '../config/index.js';
import { ConfigError, handleError } from '../errors/index.js';
import { McpClientManager } from '../mcp/index.js';

export async function executeList(options: {
  server?: string;
  outputFormat?: string;
  configManager?: ConfigManager;
  verbose?: boolean;
}): Promise<number> {
  const {
    server,
    outputFormat = 'json',
    configManager = new ConfigManager(),
    verbose = false,
  } = options;

  try {
    if (server) {
      configManager.ensureApiKey([server]);
    }

    const manager = new McpClientManager(configManager, verbose);

    if (!server) {
      // 优先使用 Discovery 获取服务列表
      const servers = configManager.isDiscoveryEnabled()
        ? await configManager.listServersAsync()
        : manager.listServers();

      const descriptions: Record<string, string> = {};
      for (const s of servers) {
        try {
          const cfg: ServerConfig = configManager.isDiscoveryEnabled()
            ? await configManager.getServerConfigAsync(s)
            : configManager.getServerConfig(s);
          descriptions[s] = cfg.description;
        } catch (e) {
          if (e instanceof ConfigError) descriptions[s] = '';
          else throw e;
        }
      }

      if (outputFormat === 'table') {
        const table = new Table({ head: ['服务名称', '描述'] });
        for (const s of servers) {
          table.push([s, descriptions[s] ?? '']);
        }
        console.error(chalk.bold('可用服务'));
        console.error(table.toString());
      } else {
        console.log(JSON.stringify({ servers }, null, 2));
      }
      return 0;
    }

    try {
      const tools = await manager.listTools(server);
      const toolList = tools.map((t) => ({
        name: t.name,
        description: (t.description as string) ?? '',
      }));

      if (outputFormat === 'table') {
        const table = new Table({ head: ['工具名称', '描述'] });
        for (const t of toolList) {
          table.push([t.name as string, t.description]);
        }
        console.error(chalk.bold(`${server} 服务工具列表`));
        console.error(table.toString());
      } else {
        console.log(JSON.stringify({ server, tools: toolList }, null, 2));
      }
      return 0;
    } catch (e) {
      if (e instanceof ConfigError) return handleError(e, outputFormat);
      throw e;
    }
  } catch (e) {
    return handleError(e, outputFormat);
  }
}
