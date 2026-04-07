import {
  generateBashTemplate,
  generateZshTemplate,
  generateFishTemplate,
} from './templates.js';

export type ShellType = 'bash' | 'zsh' | 'fish';

/**
 * 补全脚本生成器
 */
export class CompletionGenerator {
  private cliName: string;

  constructor(cliName: string = 'tuniu') {
    this.cliName = cliName;
  }

  /**
   * 生成指定 shell 的补全脚本
   */
  generate(shell: ShellType): string {
    switch (shell) {
      case 'bash':
        return generateBashTemplate(this.cliName);
      case 'zsh':
        return generateZshTemplate(this.cliName);
      case 'fish':
        return generateFishTemplate(this.cliName);
      default:
        throw new Error(`Unsupported shell: ${shell}`);
    }
  }

  /**
   * 获取支持的 shell 列表
   */
  getSupportedShells(): ShellType[] {
    return ['bash', 'zsh', 'fish'];
  }

  /**
   * 验证 shell 类型
   */
  isValidShell(shell: string): shell is ShellType {
    return this.getSupportedShells().includes(shell as ShellType);
  }

  /**
   * 获取安装提示信息
   */
  getInstallHint(shell: ShellType): string {
    const cliName = this.cliName;

    switch (shell) {
      case 'bash':
        return `# Bash 补全安装方法:
# 临时生效 (当前终端):
source <(${cliName} completion bash)

# 永久生效 (Linux):
${cliName} completion bash > ~/.${cliName}-completion.bash
echo 'source ~/.${cliName}-completion.bash' >> ~/.bashrc

# 永久生效 (macOS):
${cliName} completion bash > $(brew --prefix)/etc/bash_completion.d/${cliName}`;

      case 'zsh':
        return `# Zsh 补全安装方法:
# 临时生效 (当前终端):
source <(${cliName} completion zsh)

# 永久生效:
${cliName} completion zsh > "\${fpath[1]}/_${cliName}"
# 然后重新打开终端或执行: exec zsh`;

      case 'fish':
        return `# Fish 补全安装方法:
# 临时生效 (当前终端):
${cliName} completion fish | source

# 永久生效:
${cliName} completion fish > ~/.config/fish/completions/${cliName}.fish`;

      default:
        return '';
    }
  }
}