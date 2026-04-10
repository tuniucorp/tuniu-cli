import { Command } from 'commander';
import { ConfigManager } from './config/index.js';
import {
  executeCall,
  executeCompleteServers,
  executeCompleteTools,
  executeCompletion,
  executeConfig,
  executeDiscoveryList,
  executeDiscoveryRefresh,
  executeDiscoveryStatus,
  executeHealth,
  executeHelp,
  executeInternalComplete,
  executeList,
  executeSchema,
  executeSkillInstall,
} from './commands/index.js';
import { executeSkillVersion } from './skill/index.js';
import { McpCliError, handleError } from './errors/index.js';
import { VERSION } from './version.js';

function createProgram(): Command {
  const program = new Command();

  program
    .name('tuniu')
    .description('途牛 MCP CLI - 企业开放平台 MCP 服务命令行工具')
    .version(`tuniu version ${VERSION}`, '-V, --version', '显示版本号')
    .option('-d, --detail', '显示详细输出', false)
    .option('-o, --output <format>', '输出格式', 'json')
    .option('-p, --profile <name>', '环境配置')
    .option('-c, --config <path>', '配置文件路径')
    .option('-t, --timeout <seconds>', '请求超时时间（秒）', parseInt)
    .action(async () => {
      const opts = program.opts();
      await executeHelp({ outputFormat: opts.output });
    });

  program
    .command('help')
    .description('显示帮助信息')
    .argument('[command]', '命令名称')
    .argument('[server]', '服务名称')
    .argument('[tool]', '工具名称')
    .option('-o, --output <format>', '输出格式', 'text')
    .action(async (command, server, tool, cmdOpts) => {
      const globalOpts = program.opts();
      const configManager = buildConfigManager(globalOpts);
      await executeHelp({
        command,
        server,
        tool,
        outputFormat: cmdOpts.output,
        configManager,
      });
    });

  program
    .command('list')
    .description('列出服务或工具')
    .argument('[server]', '服务名称')
    .option('-o, --output <format>', '输出格式', 'json')
    .option('-p, --profile <name>', '指定环境')
    .action(async (server, cmdOpts) => {
      const globalOpts = program.opts();
      const configManager = buildConfigManager(globalOpts, cmdOpts.profile);
      const exitCode = await executeList({
        server,
        outputFormat: cmdOpts.output,
        configManager,
        verbose: globalOpts.detail,
      });
      process.exit(exitCode);
    });

  program
    .command('call')
    .description('调用 MCP 工具')
    .argument('<server>', '服务名称')
    .argument('<tool>', '工具名称')
    .requiredOption('-a, --args <json>', 'JSON 格式的参数字符串')
    .option('-o, --output <format>', '输出格式', 'json')
    .option('-p, --profile <name>', '指定环境')
    .option('-t, --timeout <seconds>', '请求超时时间', parseInt)
    .option('--dry-run', '模拟执行', false)
    .action(async (server, tool, cmdOpts) => {
      const globalOpts = program.opts();
      const configManager = buildConfigManager(globalOpts, cmdOpts.profile);
      if (cmdOpts.timeout) {
        configManager.profileConfig.timeout = cmdOpts.timeout;
      }
      try {
        const exitCode = await executeCall({
          server,
          tool,
          argsJson: cmdOpts.args,
          outputFormat: cmdOpts.output,
          configManager,
          dryRun: cmdOpts.dryRun,
          verbose: globalOpts.detail,
        });
        process.exit(exitCode);
      } catch (e) {
        const exitCode = handleError(e, cmdOpts.output, globalOpts.detail);
        process.exit(exitCode);
      }
    });

  program
    .command('health')
    .description('健康检查')
    .argument('[server]', '服务名称')
    .option('--parallel', '并行检查所有服务', false)
    .option('-o, --output <format>', '输出格式', 'json')
    .option('-p, --profile <name>', '指定环境')
    .action(async (server, cmdOpts) => {
      const globalOpts = program.opts();
      const configManager = buildConfigManager(globalOpts, cmdOpts.profile);
      const exitCode = await executeHealth({
        server,
        parallel: cmdOpts.parallel,
        outputFormat: cmdOpts.output,
        configManager,
        verbose: globalOpts.detail,
      });
      process.exit(exitCode);
    });

  program
    .command('schema')
    .description('导出工具 Schema')
    .argument('[server]', '服务名称')
    .option('-o, --output <format>', '输出格式', 'json')
    .option('-p, --profile <name>', '指定环境')
    .action(async (server, cmdOpts) => {
      const globalOpts = program.opts();
      const configManager = buildConfigManager(globalOpts, cmdOpts.profile);
      const exitCode = await executeSchema({
        server,
        outputFormat: cmdOpts.output,
        configManager,
        verbose: globalOpts.detail,
      });
      process.exit(exitCode);
    });

  program
    .command('config')
    .description('配置管理')
    .argument('<action>', '操作：init / show / set')
    .argument('[key]', '配置项')
    .argument('[value]', '配置值')
    .option('-p, --profile <name>', '指定环境')
    .option('-f, --force', '覆盖已有配置文件', false)
    .action((action, key, value, cmdOpts) => {
      const globalOpts = program.opts();
      const configManager = buildConfigManager(globalOpts, cmdOpts.profile);
      const exitCode = executeConfig({
        action,
        configManager,
        key,
        value,
        outputFormat: globalOpts.output,
        force: cmdOpts.force,
      });
      process.exit(exitCode);
    });

  const skill = program
    .command('skill')
    .description('Skill 管理');

  skill
    .command('install')
    .description(`安装 tuniu-cli Skill（默认安装到 ~/.agents/skills/tuniu-cli/）

说明:
  - 优先从途牛开放平台下载最新 skill，失败则使用内置文件
  - 若通过 npm 全局安装，通常会在 postinstall 阶段自动安装
  - 若通过 npx/源码方式使用，或需手动更新，请显式执行本命令

支持的 Agent: agents, claude, cursor, qoder, codex, opencode, openclaw, copaw

示例:
  tuniu skill install                    # 默认安装到 ~/.agents/skills/
  tuniu skill install cursor             # 安装到指定 Agent
  tuniu skill install --agent cursor,claude  # 安装到多个 Agent
  tuniu skill install --agent all        # 安装到全部 Agent
  tuniu skill install --dir ~/custom     # 安装到自定义目录
  tuniu skill install -p development     # 使用预发文档站下载 zip`)
    .argument('[agent]', '目标 Agent')
    .option('-a, --agent <names>', '多个 Agent（逗号分隔）或 all')
    .option('-p, --profile <name>', '环境配置（决定 skill zip 下载地址，与 call/list 等一致）')
    .option('--dir <path>', '额外安装到指定 skills 根目录')
    .option('-f, --force', '覆盖已存在的 Skill 文件', true)
    .action(async (agent, cmdOpts) => {
      const globalOpts = program.opts();
      const configManager = buildConfigManager(globalOpts, cmdOpts.profile);
      const exitCode = await executeSkillInstall({
        agent,
        agents: cmdOpts.agent,
        customDir: cmdOpts.dir,
        force: cmdOpts.force,
        configManager,
      });
      process.exit(exitCode);
    });

  skill
    .command('version')
    .description('显示已安装的 Skill 版本信息')
    .action(() => {
      const exitCode = executeSkillVersion();
      process.exit(exitCode);
    });

  // completion 命令 - 生成 shell 补全脚本
  program
    .command('completion')
    .description('生成 shell 补全脚本')
    .argument('<shell>', 'shell 类型: bash, zsh, fish')
    .option('--install', '自动安装补全脚本')
    .option('--uninstall', '卸载补全脚本')
    .action(async (shell, cmdOpts) => {
      const exitCode = await executeCompletion({
        shell,
        install: cmdOpts.install,
        uninstall: cmdOpts.uninstall,
      });
      process.exit(exitCode);
    });

  // discovery 命令 - MCP 服务发现管理
  const discovery = program
    .command('discovery')
    .description('MCP 服务发现管理');

  discovery
    .command('refresh')
    .description('刷新服务列表缓存')
    .action(async () => {
      const globalOpts = program.opts();
      const configManager = buildConfigManager(globalOpts);
      const exitCode = await executeDiscoveryRefresh({ configManager });
      process.exit(exitCode);
    });

  discovery
    .command('status')
    .description('显示服务发现状态')
    .action(async () => {
      const globalOpts = program.opts();
      const configManager = buildConfigManager(globalOpts);
      const exitCode = await executeDiscoveryStatus({ configManager });
      process.exit(exitCode);
    });

  discovery
    .command('list')
    .description('列出已发现的服务')
    .option('-a, --all', '显示所有服务（包括 offline）')
    .option('-o, --output <format>', '输出格式', 'json')
    .action(async (cmdOpts) => {
      const globalOpts = program.opts();
      const configManager = buildConfigManager(globalOpts);
      const exitCode = await executeDiscoveryList({
        configManager,
        outputFormat: cmdOpts.output,
        all: cmdOpts.all,
      });
      process.exit(exitCode);
    });

  // __complete 内部命令 - 动态补全接口
  program
    .command('__complete', { hidden: true })
    .description('内部补全接口')
    .argument('[words...]', '命令行词语')
    .action(async (words) => {
      const exitCode = await executeInternalComplete({ words });
      process.exit(exitCode);
    });

  // __complete-servers 内部命令 - 补全服务名
  program
    .command('__complete-servers', { hidden: true })
    .description('内部补全接口 - 服务名')
    .action(() => {
      const exitCode = executeCompleteServers({});
      process.exit(exitCode);
    });

  // __complete-tools 内部命令 - 补全工具名
  program
    .command('__complete-tools', { hidden: true })
    .description('内部补全接口 - 工具名')
    .argument('<server>', '服务名称')
    .action(async (server) => {
      const exitCode = await executeCompleteTools({ server });
      process.exit(exitCode);
    });

  return program;
}

function buildConfigManager(
  globalOpts: Record<string, unknown>,
  cmdProfile?: string,
): ConfigManager {
  // 复用 -d/--detail 的调试开关，用于输出 discovery 降级等调试信息
  if (globalOpts.detail === true) {
    process.env.TUNIU_CLI_DEBUG = '1';
  }
  const configPath = globalOpts.config as string | undefined;
  const profile = cmdProfile ?? (globalOpts.profile as string | undefined);
  return new ConfigManager(configPath, profile);
}

export async function main(): Promise<void> {
  try {
    const program = createProgram();
    await program.parseAsync(process.argv);
  } catch (e) {
    if (e instanceof McpCliError) {
      const exitCode = handleError(e, 'json', false);
      process.exit(exitCode);
    }
    if (
      e instanceof Error &&
      e.message.includes('process.exit')
    ) {
      return;
    }
    const exitCode = handleError(e, 'json', false);
    process.exit(exitCode);
  }
}
