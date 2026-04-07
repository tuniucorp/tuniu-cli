import { ConfigManager } from '../config/index.js';
import {
  CompletionGenerator,
  CompletionInstaller,
  CompletionProvider,
  ShellType,
} from '../completion/index.js';

/**
 * 执行 completion 命令
 */
export async function executeCompletion(options: {
  shell: string;
  install?: boolean;
  uninstall?: boolean;
  configManager?: ConfigManager;
}): Promise<number> {
  const {
    shell,
    install = false,
    uninstall = false,
  } = options;

  const generator = new CompletionGenerator();
  const installer = new CompletionInstaller();

  // 验证 shell 类型
  if (!generator.isValidShell(shell)) {
    console.error(`错误: 不支持的 shell 类型 '${shell}'`);
    console.error(`支持的 shell: ${generator.getSupportedShells().join(', ')}`);
    return 1;
  }

  const shellType = shell as ShellType;

  // 卸载模式
  if (uninstall) {
    const result = installer.uninstall(shellType);
    if (result.success) {
      console.log(`✓ ${result.message}`);
      return 0;
    } else {
      console.error(`✗ ${result.message}`);
      return 1;
    }
  }

  // 安装模式
  if (install) {
    // 检查是否已安装
    if (installer.isInstalled(shellType)) {
      console.log(`补全脚本已安装，正在更新...`);
    }

    const script = generator.generate(shellType);
    const result = installer.install(shellType, script);

    if (result.success) {
      console.log(`✓ ${result.message}`);
      return 0;
    } else {
      console.error(`✗ ${result.message}`);
      return 1;
    }
  }

  // 默认：输出补全脚本
  const script = generator.generate(shellType);
  const hint = generator.getInstallHint(shellType);

  console.log(script);
  console.log('\n# 安装提示:');
  console.log(hint);
  console.log('\n# 快捷安装:');
  console.log(`tuniu completion ${shell} --install`);

  return 0;
}

/**
 * 执行 __complete 内部命令 (用于动态补全)
 */
export async function executeInternalComplete(options: {
  words: string[];
  configManager?: ConfigManager;
}): Promise<number> {
  const { words, configManager = new ConfigManager() } = options;

  const provider = new CompletionProvider(configManager);
  const suggestions = await provider.getSuggestions(words);

  // 输出补全建议，每行一个
  for (const suggestion of suggestions) {
    console.log(suggestion);
  }

  return 0;
}

/**
 * 执行 __complete-servers 内部命令
 */
export function executeCompleteServers(options: {
  configManager?: ConfigManager;
}): number {
  const { configManager = new ConfigManager() } = options;

  const provider = new CompletionProvider(configManager);
  const servers = provider.getServers();

  for (const server of servers) {
    console.log(server);
  }

  return 0;
}

/**
 * 执行 __complete-tools 内部命令
 */
export async function executeCompleteTools(options: {
  server: string;
  configManager?: ConfigManager;
}): Promise<number> {
  const { server, configManager = new ConfigManager() } = options;

  const provider = new CompletionProvider(configManager);
  const tools = await provider.getTools(server);

  for (const tool of tools) {
    console.log(tool);
  }

  return 0;
}