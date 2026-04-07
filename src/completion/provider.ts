import { ConfigManager } from '../config/index.js';
import { McpClientManager } from '../mcp/index.js';

/**
 * 补全数据提供者
 * 为 shell 补全提供动态数据
 */
export class CompletionProvider {
  private configManager: ConfigManager;

  constructor(configManager?: ConfigManager) {
    this.configManager = configManager ?? new ConfigManager();
  }

  /**
   * 获取所有命令列表
   */
  getCommands(): string[] {
    return [
      'help',
      'list',
      'call',
      'health',
      'schema',
      'config',
      'skill',
      'completion',
      'discovery',
    ];
  }

  /**
   * 获取命令描述
   */
  getCommandDescriptions(): Record<string, string> {
    return {
      help: '显示帮助信息',
      list: '列出服务或工具',
      call: '调用 MCP 工具',
      health: '健康检查',
      schema: '导出工具 Schema',
      config: '配置管理',
      skill: 'Skill 管理',
      completion: '生成 shell 补全脚本',
      discovery: 'MCP 服务发现管理',
    };
  }

  /**
   * 获取所有 MCP 服务列表
   */
  getServers(): string[] {
    try {
      return this.configManager.listServers();
    } catch {
      return [];
    }
  }

  /**
   * 获取指定服务的工具列表
   */
  async getTools(server: string): Promise<string[]> {
    try {
      const manager = new McpClientManager(this.configManager, false);
      const tools = await manager.listTools(server);
      return tools.map((t) => t.name as string);
    } catch {
      return [];
    }
  }

  /**
   * 获取命令支持的选项
   */
  getOptions(command: string): string[] {
    const globalOptions = [
      '-d',
      '--detail',
      '-o',
      '--output',
      '-p',
      '--profile',
      '-c',
      '--config',
      '-t',
      '--timeout',
      '-V',
      '--version',
    ];

    const commandOptions: Record<string, string[]> = {
      list: ['-o', '--output', '-p', '--profile'],
      call: [
        '-a',
        '--args',
        '-o',
        '--output',
        '-p',
        '--profile',
        '-t',
        '--timeout',
        '--dry-run',
      ],
      health: ['--parallel', '-o', '--output', '-p', '--profile'],
      schema: ['-o', '--output', '-p', '--profile'],
      config: ['-p', '--profile', '-f', '--force'],
      skill: ['-a', '--agent', '--dir', '-f', '--force'],
      completion: ['--install'],
    };

    if (command === '__global__') {
      return globalOptions;
    }

    return commandOptions[command] ?? [];
  }

  /**
   * 获取 config 命令的动作列表
   */
  getConfigActions(): string[] {
    return ['init', 'show', 'set'];
  }

  /**
   * 获取 skill 命令动作列表
   */
  getSkillActions(): string[] {
    return ['install'];
  }

  /**
   * 获取支持的 shell 列表
   */
  getSupportedShells(): string[] {
    return ['bash', 'zsh', 'fish'];
  }

  /**
   * 根据当前命令行上下文获取补全建议
   *
   * words 参数格式：
   * - [] 或空 → 返回命令列表
   * - ['list'] → 返回 list 命令的服务补全
   * - ['call', 'server1'] → 返回 server1 的工具补全
   */
  async getSuggestions(words: string[]): Promise<string[]> {
    // 无参数时返回命令列表
    if (!words || words.length === 0) {
      return this.getCommands();
    }

    const command = words[0];

    // 如果 command 看起来像是命令前缀，过滤命令列表
    if (words.length === 1 && !this.getCommands().includes(command)) {
      const commands = this.getCommands();
      return commands.filter((c) => c.startsWith(command));
    }

    // 根据命令返回对应补全
    switch (command) {
      case 'list':
      case 'health':
      case 'schema':
        // 补全服务名
        if (words.length === 1 || (words.length === 2 && !words[1].startsWith('-'))) {
          return this.getServers();
        }
        return this.getOptions(command);

      case 'call':
        if (words.length === 1 || (words.length === 2 && !words[1].startsWith('-'))) {
          return this.getServers();
        }
        if (words.length === 2 || (words.length === 3 && !words[2].startsWith('-'))) {
          const server = words.length === 2 ? words[1] : words[2];
          // 如果当前参数是服务名，返回工具列表
          if (words.length === 2) {
            return this.getServers();
          }
          return await this.getTools(server);
        }
        return this.getOptions(command);

      case 'config':
        if (words.length === 1 || (words.length === 2 && !words[1].startsWith('-'))) {
          return this.getConfigActions();
        }
        return this.getOptions(command);

      case 'skill':
        if (words.length === 1 || (words.length === 2 && !words[1].startsWith('-'))) {
          return this.getSkillActions();
        }
        return this.getOptions(command);

      case 'completion':
        if (words.length === 1 || (words.length === 2 && !words[1].startsWith('-'))) {
          return this.getSupportedShells();
        }
        return this.getOptions(command);

      default:
        // 已知的完整命令，返回空（不需要补全）
        if (this.getCommands().includes(command)) {
          return [];
        }
        // 未知命令，返回命令列表
        return this.getCommands();
    }
  }
}