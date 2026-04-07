import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ShellType } from './generator.js';

export interface InstallResult {
  success: boolean;
  message: string;
  path?: string;
}

/**
 * 补全脚本安装器
 */
export class CompletionInstaller {
  private cliName: string;

  constructor(cliName: string = 'tuniu') {
    this.cliName = cliName;
  }

  /**
   * 检测当前操作系统
   */
  getOS(): 'linux' | 'macos' | 'windows' | 'unknown' {
    const platform = os.platform();
    switch (platform) {
      case 'linux':
        return 'linux';
      case 'darwin':
        return 'macos';
      case 'win32':
        return 'windows';
      default:
        return 'unknown';
    }
  }

  /**
   * 检测 brew 是否可用 (macOS)
   */
  hasBrew(): boolean {
    try {
      const result = spawnSync('which', ['brew'], { encoding: 'utf-8' });
      return result.status === 0;
    } catch {
      return false;
    }
  }

  /**
   * 获取 brew 前缀路径
   */
  getBrewPrefix(): string | null {
    try {
      const result = spawnSync('brew', ['--prefix'], { encoding: 'utf-8' });
      if (result.status === 0) {
        return result.stdout.trim();
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * 安装 Bash 补全
   */
  installBash(script: string): InstallResult {
    const osType = this.getOS();
    const homeDir = os.homedir();

    if (osType === 'windows') {
      return {
        success: false,
        message: 'Windows 系统建议使用 PowerShell 或 Git Bash，暂不支持自动安装',
      };
    }

    // macOS 优先使用 brew 路径
    if (osType === 'macos' && this.hasBrew()) {
      const brewPrefix = this.getBrewPrefix();
      if (brewPrefix) {
        const completionDir = path.join(brewPrefix, 'etc', 'bash_completion.d');
        const targetPath = path.join(completionDir, this.cliName);

        try {
          // 确保目录存在
          if (!fs.existsSync(completionDir)) {
            fs.mkdirSync(completionDir, { recursive: true });
          }

          fs.writeFileSync(targetPath, script, 'utf-8');

          return {
            success: true,
            message: `已安装到 ${targetPath}\n重新打开终端或执行: source ${targetPath}`,
            path: targetPath,
          };
        } catch (e) {
          return {
            success: false,
            message: `安装失败: ${e}`,
          };
        }
      }
    }

    // Linux 或 macOS (无 brew) - 使用用户目录
    const targetPath = path.join(homeDir, `.${this.cliName}-completion.bash`);
    const rcFile = osType === 'macos' ? '.bash_profile' : '.bashrc';
    const rcPath = path.join(homeDir, rcFile);
    const sourceLine = `source ${targetPath}`;

    try {
      // 写入补全脚本
      fs.writeFileSync(targetPath, script, 'utf-8');

      // 检查是否已添加 source 命令
      let rcContent = '';
      if (fs.existsSync(rcPath)) {
        rcContent = fs.readFileSync(rcPath, 'utf-8');
      }

      if (!rcContent.includes(sourceLine)) {
        fs.appendFileSync(
          rcPath,
          `\n# ${this.cliName} completion\n${sourceLine}\n`,
          'utf-8',
        );
      }

      return {
        success: true,
        message: `已安装到 ${targetPath}\n已在 ${rcFile} 中添加 source 命令\n重新打开终端或执行: source ${rcPath}`,
        path: targetPath,
      };
    } catch (e) {
      return {
        success: false,
        message: `安装失败: ${e}`,
      };
    }
  }

  /**
   * 卸载 Bash 补全
   */
  uninstallBash(): InstallResult {
    const osType = this.getOS();
    const homeDir = os.homedir();

    if (osType === 'windows') {
      return { success: true, message: '无需卸载' };
    }

    const filesToRemove: string[] = [];
    const rcFile = osType === 'macos' ? '.bash_profile' : '.bashrc';
    const rcPath = path.join(homeDir, rcFile);
    const sourceLine = `source ~/.${this.cliName}-completion.bash`;

    // 检查 brew 路径
    if (osType === 'macos' && this.hasBrew()) {
      const brewPrefix = this.getBrewPrefix();
      if (brewPrefix) {
        filesToRemove.push(
          path.join(brewPrefix, 'etc', 'bash_completion.d', this.cliName),
        );
      }
    }

    // 用户目录
    filesToRemove.push(path.join(homeDir, `.${this.cliName}-completion.bash`));

    let removed = false;
    for (const file of filesToRemove) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          removed = true;
        } catch {
          // ignore
        }
      }
    }

    // 从 rc 文件移除 source 命令
    if (fs.existsSync(rcPath)) {
      try {
        const content = fs.readFileSync(rcPath, 'utf-8');
        const lines = content.split('\n').filter((line) => {
          return (
            !line.includes(sourceLine) &&
            !line.includes(`# ${this.cliName} completion`)
          );
        });
        fs.writeFileSync(rcPath, lines.join('\n'), 'utf-8');
      } catch {
        // ignore
      }
    }

    if (removed) {
      return { success: true, message: '已卸载 Bash 补全脚本' };
    } else {
      return { success: true, message: '未找到已安装的 Bash 补全脚本' };
    }
  }

  /**
   * 安装 Zsh 补全
   */
  installZsh(script: string): InstallResult {
    const homeDir = os.homedir();

    // 查找 zsh fpath
    let fpathDir: string | null = null;

    // 尝试获取 fpath
    try {
      const result = spawnSync(
        'zsh',
        ['-c', 'echo ${fpath[1]}'],
        { encoding: 'utf-8' },
      );
      if (result.status === 0 && result.stdout.trim()) {
        fpathDir = result.stdout.trim();
      }
    } catch {
      // ignore
    }

    // 如果无法获取 fpath，使用默认位置
    if (!fpathDir || !fs.existsSync(fpathDir)) {
      fpathDir = path.join(homeDir, '.zsh', 'completions');
    }

    const targetPath = path.join(fpathDir, `_${this.cliName}`);

    try {
      // 确保目录存在
      if (!fs.existsSync(fpathDir)) {
        fs.mkdirSync(fpathDir, { recursive: true });
      }

      fs.writeFileSync(targetPath, script, 'utf-8');

      // 检查 .zshrc 是否需要配置
      const zshrcPath = path.join(homeDir, '.zshrc');
      const fpathLine = `fpath=(${fpathDir} $fpath)`;
      const compinitLine = 'autoload -U compinit && compinit';

      if (fs.existsSync(zshrcPath)) {
        const zshrcContent = fs.readFileSync(zshrcPath, 'utf-8');

        // 检查是否需要添加 fpath
        if (!zshrcContent.includes(fpathLine)) {
          fs.appendFileSync(
            zshrcPath,
            `\n# ${this.cliName} completion\n${fpathLine}\n`,
            'utf-8',
          );
        }

        // 检查是否需要添加 compinit
        if (!zshrcContent.includes('compinit')) {
          fs.appendFileSync(zshrcPath, `\n${compinitLine}\n`, 'utf-8');
        }
      }

      return {
        success: true,
        message: `已安装到 ${targetPath}\n重新打开终端或执行: exec zsh`,
        path: targetPath,
      };
    } catch (e) {
      return {
        success: false,
        message: `安装失败: ${e}`,
      };
    }
  }

  /**
   * 卸载 Zsh 补全
   */
  uninstallZsh(): InstallResult {
    const homeDir = os.homedir();

    // 可能的位置
    const possiblePaths = [
      path.join(homeDir, '.zsh', 'completions', `_${this.cliName}`),
    ];

    // 尝试从 fpath 获取
    try {
      const result = spawnSync(
        'zsh',
        ['-c', 'echo ${fpath[1]}'],
        { encoding: 'utf-8' },
      );
      if (result.status === 0 && result.stdout.trim()) {
        possiblePaths.push(
          path.join(result.stdout.trim(), `_${this.cliName}`),
        );
      }
    } catch {
      // ignore
    }

    // 添加常见的 zsh 补全目录
    possiblePaths.push(
      `/usr/local/share/zsh/site-functions/_${this.cliName}`,
      `/usr/share/zsh/site-functions/_${this.cliName}`,
    );

    let removed = false;
    for (const file of possiblePaths) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
          removed = true;
        } catch {
          // ignore
        }
      }
    }

    if (removed) {
      return { success: true, message: '已卸载 Zsh 补全脚本' };
    } else {
      return { success: true, message: '未找到已安装的 Zsh 补全脚本' };
    }
  }

  /**
   * 安装 Fish 补全
   */
  installFish(script: string): InstallResult {
    const homeDir = os.homedir();
    const completionDir = path.join(
      homeDir,
      '.config',
      'fish',
      'completions',
    );
    const targetPath = path.join(completionDir, `${this.cliName}.fish`);

    try {
      // 确保目录存在
      if (!fs.existsSync(completionDir)) {
        fs.mkdirSync(completionDir, { recursive: true });
      }

      fs.writeFileSync(targetPath, script, 'utf-8');

      return {
        success: true,
        message: `已安装到 ${targetPath}\nFish 会自动加载补全，无需额外操作`,
        path: targetPath,
      };
    } catch (e) {
      return {
        success: false,
        message: `安装失败: ${e}`,
      };
    }
  }

  /**
   * 卸载 Fish 补全
   */
  uninstallFish(): InstallResult {
    const homeDir = os.homedir();
    const targetPath = path.join(
      homeDir,
      '.config',
      'fish',
      'completions',
      `${this.cliName}.fish`,
    );

    if (fs.existsSync(targetPath)) {
      try {
        fs.unlinkSync(targetPath);
        return { success: true, message: '已卸载 Fish 补全脚本' };
      } catch {
        return { success: false, message: '卸载失败' };
      }
    }

    return { success: true, message: '未找到已安装的 Fish 补全脚本' };
  }

  /**
   * 安装补全脚本
   */
  install(shell: ShellType, script: string): InstallResult {
    switch (shell) {
      case 'bash':
        return this.installBash(script);
      case 'zsh':
        return this.installZsh(script);
      case 'fish':
        return this.installFish(script);
      default:
        return { success: false, message: `不支持的 shell: ${shell}` };
    }
  }

  /**
   * 卸载补全脚本
   */
  uninstall(shell: ShellType): InstallResult {
    switch (shell) {
      case 'bash':
        return this.uninstallBash();
      case 'zsh':
        return this.uninstallZsh();
      case 'fish':
        return this.uninstallFish();
      default:
        return { success: false, message: `不支持的 shell: ${shell}` };
    }
  }

  /**
   * 检查补全是否已安装
   */
  isInstalled(shell: ShellType): boolean {
    const homeDir = os.homedir();

    switch (shell) {
      case 'bash': {
        const paths = [
          path.join(homeDir, `.${this.cliName}-completion.bash`),
        ];
        if (this.getOS() === 'macos' && this.hasBrew()) {
          const brewPrefix = this.getBrewPrefix();
          if (brewPrefix) {
            paths.push(
              path.join(brewPrefix, 'etc', 'bash_completion.d', this.cliName),
            );
          }
        }
        return paths.some((p) => fs.existsSync(p));
      }
      case 'zsh': {
        const paths = [
          path.join(homeDir, '.zsh', 'completions', `_${this.cliName}`),
        ];
        return paths.some((p) => fs.existsSync(p));
      }
      case 'fish': {
        const targetPath = path.join(
          homeDir,
          '.config',
          'fish',
          'completions',
          `${this.cliName}.fish`,
        );
        return fs.existsSync(targetPath);
      }
      default:
        return false;
    }
  }
}