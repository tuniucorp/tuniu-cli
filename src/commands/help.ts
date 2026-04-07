import chalk from 'chalk';
import type { ConfigManager } from '../config/index.js';
import { McpClientManager } from '../mcp/index.js';
import { VERSION } from '../version.js';

const COMMAND_HELP: Record<string, Record<string, unknown>> = {
  help: {
    name: 'help',
    description: '显示帮助信息',
    usage: 'tuniu help [command|server] [server|tool] [options]',
    examples: [
      'tuniu help',
      'tuniu help call',
      'tuniu help ticket          # 服务工具列表',
      'tuniu help cruise',
      'tuniu help holiday',
      'tuniu help train searchLowestPriceTrain  # 工具参数说明',
    ],
  },
  list: {
    name: 'list',
    description: '列出服务或工具',
    usage: 'tuniu list [server] [options]',
    options: [
      '--output, -o    输出格式：json（默认）/ table',
      '--profile, -p   指定环境',
    ],
    examples: [
      'tuniu list',
      'tuniu list ticket',
      'tuniu list hotel',
      'tuniu list flight',
      'tuniu list train',
      'tuniu list cruise',
      'tuniu list holiday',
      'tuniu list --output table',
    ],
  },
  call: {
    name: 'call',
    description: '调用 MCP 工具',
    usage: "tuniu call <server> <tool> --args '<json>' [options]",
    options: [
      '--args, -a      JSON 格式的参数字符串（必填）',
      '--output, -o    输出格式：json（默认）/ table',
      '--profile, -p   指定环境',
      '--timeout, -t   请求超时时间',
      '--dry-run       模拟执行，不实际调用',
    ],
    examples: [
      'tuniu call ticket query_cheapest_tickets --args \'{"scenic_name": "中山陵"}\'',
      'tuniu call hotel tuniu_hotel_search -a \'{"cityName": "北京", "checkIn": "2026-03-01"}\'',
      'tuniu call flight searchLowestPriceFlight -a \'{"departureCityName":"北京","arrivalCityName":"上海","departureDate":"2026-03-15"}\'',
      'tuniu call train searchLowestPriceTrain -a \'{"departureCityName":"南京","arrivalCityName":"上海","departureDate":"2026-03-20"}\'',
      'tuniu call cruise searchCruiseList -a \'{"departsDateBegin":"2026-03-17","departsDateEnd":"2026-03-20"}\'',
      'tuniu call holiday searchHolidayList -a \'{"destinationName":"三亚","departsDateBegin":"2026-04-10","departsDateEnd":"2026-04-15"}\'',
    ],
  },
  health: {
    name: 'health',
    description: '健康检查',
    usage: 'tuniu health [server] [options]',
    options: [
      '--parallel      并行检查所有服务',
      '--output, -o    输出格式：json（默认）/ table',
      '--profile, -p   指定环境',
    ],
    examples: [
      'tuniu health',
      'tuniu health ticket',
      'tuniu health flight',
      'tuniu health train',
      'tuniu health cruise',
      'tuniu health holiday',
      'tuniu health --parallel',
    ],
  },
  schema: {
    name: 'schema',
    description: '导出工具 Schema',
    usage: 'tuniu schema [server] [options]',
    options: [
      '--output, -o    输出格式：json（默认）/ markdown',
      '--profile, -p   指定环境',
    ],
    examples: [
      'tuniu schema',
      'tuniu schema ticket',
      'tuniu schema flight',
      'tuniu schema train',
      'tuniu schema cruise',
      'tuniu schema holiday',
      'tuniu schema --output markdown',
    ],
  },
  config: {
    name: 'config',
    description: '配置管理',
    usage: 'tuniu config <action> [options]',
    subcommands: {
      init: '初始化配置文件',
      show: '显示当前配置',
    },
    examples: ['tuniu config init', 'tuniu config init --force', 'tuniu config show'],
  },
  skill: {
    name: 'skill',
    description: 'Skill 管理',
    usage: 'tuniu skill install [options]',
    subcommands: {
      install: '安装 tuniu-cli Skill 到主流 Agent 可识别目录',
    },
    options: [
      '--agent, -a     指定目标 Agent，逗号分隔：cursor, claude, openclaw, copaw, agents',
      '--dir           额外安装到指定 skills 根目录',
      '--force, -f     覆盖已存在的 Skill 文件',
    ],
    examples: [
      'tuniu skill install',
      'tuniu skill install --agent cursor,claude',
      'tuniu skill install --dir ~/.custom-agent/skills',
    ],
  },
};

function getGlobalHelp(): Record<string, unknown> {
  return {
    name: 'tuniu',
    version: VERSION,
    description: '途牛 MCP CLI - 企业内部 MCP 服务命令行工具',
    commands: Object.keys(COMMAND_HELP),
    global_options: [
      { name: '--version, -V', description: '显示版本号' },
      { name: '--detail, -d', description: '显示详细输出（日志输出到 stderr）' },
      { name: '--output, -o', description: '输出格式：json / table / yaml' },
      { name: '--profile, -p', description: '环境配置：development / production' },
      { name: '--config, -c', description: '配置文件路径' },
      { name: '--timeout, -t', description: '请求超时时间（秒）' },
    ],
    examples: [
      'tuniu help',
      'tuniu list',
      'tuniu call ticket query_cheapest_tickets --args \'{"scenic_name": "中山陵"}\'',
      'tuniu call flight searchLowestPriceFlight -a \'{"departureCityName":"北京","arrivalCityName":"上海","departureDate":"2026-03-15"}\'',
      'tuniu health',
      'tuniu schema',
      'tuniu skill install',
    ],
  };
}

function printHelpText(): void {
  console.error(chalk.bold('tuniu') + ' - 途牛 MCP CLI');
  console.error(`版本: ${VERSION}`);
  console.error(`使用: tuniu <command> [arguments] [options]\n`);

  console.error(chalk.bold('命令:'));
  for (const [cmd, info] of Object.entries(COMMAND_HELP)) {
    console.error(`  ${chalk.cyan(cmd.padEnd(10))} ${info.description}`);
  }
  console.error();

  console.error(chalk.bold('全局选项:'));
  const globalHelp = getGlobalHelp();
  for (const opt of globalHelp.global_options as { name: string; description: string }[]) {
    console.error(`  ${chalk.cyan(opt.name.padEnd(20))} ${opt.description}`);
  }
  console.error();

  console.error(chalk.bold('示例:'));
  for (const example of globalHelp.examples as string[]) {
    console.error(`  ${example}`);
  }
}

function printCommandHelp(command: string): void {
  if (!(command in COMMAND_HELP)) {
    console.error(chalk.red(`未知命令: ${command}`));
    console.error(`可用命令: ${Object.keys(COMMAND_HELP).join(', ')}`);
    return;
  }

  const info = COMMAND_HELP[command];
  console.error(`${chalk.bold(command)} - ${info.description}`);
  console.error();
  console.error(`${chalk.bold('用法:')} ${info.usage}`);
  console.error();

  if (info.options) {
    console.error(chalk.bold('选项:'));
    for (const opt of info.options as string[]) {
      console.error(`  ${opt}`);
    }
    console.error();
  }

  if (info.subcommands) {
    console.error(chalk.bold('子命令:'));
    for (const [sub, desc] of Object.entries(info.subcommands as Record<string, string>)) {
      console.error(`  ${chalk.cyan(sub)} - ${desc}`);
    }
    console.error();
  }

  console.error(chalk.bold('示例:'));
  for (const example of (info.examples as string[]) ?? []) {
    console.error(`  ${example}`);
  }
}

export async function executeHelp(options?: {
  command?: string;
  server?: string;
  tool?: string;
  outputFormat?: string;
  configManager?: ConfigManager;
}): Promise<void> {
  const { command, server, tool, outputFormat = 'text', configManager } = options ?? {};

  if (!command) {
    if (outputFormat === 'json') {
      console.log(JSON.stringify(getGlobalHelp(), null, 2));
    } else {
      printHelpText();
    }
    return;
  }

  // 支持 tuniu help <server> [tool] 简写，省略 call
  const isServerHelp =
    configManager &&
    (command === 'call'
      ? !!server
      : !(command in COMMAND_HELP) && configManager.listServers().includes(command));

  if (isServerHelp) {
    const resolvedServer = command === 'call' ? server! : command;
    const resolvedTool = command === 'call' ? tool : server;
    try {
      const manager = new McpClientManager(configManager);
      const tools = await manager.listTools(resolvedServer);

      if (!resolvedTool) {
        if (outputFormat === 'json') {
          const result = {
            server: resolvedServer,
            tools: tools.map((t) => ({
              name: t.name,
              description: t.description ?? '',
            })),
          };
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.error(`${chalk.bold(resolvedServer)} 服务可用工具:`);
          for (const t of tools) {
            console.error(`  ${chalk.cyan(t.name as string)} - ${(t.description as string) ?? ''}`);
          }
        }
        return;
      }

      const toolInfo = tools.find((t) => t.name === resolvedTool);
      if (!toolInfo) {
        console.error(chalk.red(`工具 '${resolvedTool}' 在服务 '${resolvedServer}' 中不存在`));
        return;
      }

      if (outputFormat === 'json') {
        console.log(JSON.stringify(toolInfo, null, 2));
      } else {
        console.error(chalk.bold(resolvedTool));
        console.error(`描述: ${(toolInfo.description as string) ?? ''}`);
        console.error();
        const schema = toolInfo.inputSchema as Record<string, unknown> | undefined;
        if (schema) {
          console.error(chalk.bold('参数:'));
          const props = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
          const required = (schema.required ?? []) as string[];
          for (const [name, prop] of Object.entries(props)) {
            const req = required.includes(name) ? ' (必填)' : '';
            console.error(
              `  ${chalk.cyan(name)}${req}: ${prop.type ?? 'any'} - ${prop.description ?? ''}`,
            );
          }
        }
      }
    } catch (e) {
      if (outputFormat === 'json') {
        console.log(JSON.stringify({ error: String(e) }));
      } else {
        console.error(chalk.red(`错误: ${e}`));
      }
    }
    return;
  }

  if (outputFormat === 'json') {
    console.log(
      JSON.stringify(COMMAND_HELP[command] ?? { error: `未知命令: ${command}` }, null, 2),
    );
  } else {
    printCommandHelp(command);
  }
}
