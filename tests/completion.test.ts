import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  CompletionGenerator,
  CompletionProvider,
  CompletionInstaller,
  generateBashTemplate,
  generateZshTemplate,
  generateFishTemplate,
} from '../src/completion/index.js';
import { ConfigManager } from '../src/config/index.js';

describe('CompletionGenerator', () => {
  let generator: CompletionGenerator;

  beforeEach(() => {
    generator = new CompletionGenerator('tuniu');
  });

  describe('generate', () => {
    it('generates bash completion script', () => {
      const script = generator.generate('bash');
      expect(script).toContain('_tuniu_completion');
      expect(script).toContain('complete -F');
    });

    it('generates zsh completion script', () => {
      const script = generator.generate('zsh');
      expect(script).toContain('#compdef tuniu');
      expect(script).toContain('_tuniu()');
    });

    it('generates fish completion script', () => {
      const script = generator.generate('fish');
      expect(script).toContain('complete -c tuniu');
    });

    it('throws for unsupported shell', () => {
      expect(() => generator.generate('invalid' as never)).toThrow(
        'Unsupported shell',
      );
    });
  });

  describe('getSupportedShells', () => {
    it('returns supported shell list', () => {
      const shells = generator.getSupportedShells();
      expect(shells).toContain('bash');
      expect(shells).toContain('zsh');
      expect(shells).toContain('fish');
    });
  });

  describe('isValidShell', () => {
    it('returns true for valid shells', () => {
      expect(generator.isValidShell('bash')).toBe(true);
      expect(generator.isValidShell('zsh')).toBe(true);
      expect(generator.isValidShell('fish')).toBe(true);
    });

    it('returns false for invalid shells', () => {
      expect(generator.isValidShell('powershell')).toBe(false);
      expect(generator.isValidShell('invalid')).toBe(false);
    });
  });

  describe('getInstallHint', () => {
    it('returns bash install hint', () => {
      const hint = generator.getInstallHint('bash');
      expect(hint).toContain('Bash');
      expect(hint).toContain('source');
    });

    it('returns zsh install hint', () => {
      const hint = generator.getInstallHint('zsh');
      expect(hint).toContain('Zsh');
      expect(hint).toContain('fpath');
    });

    it('returns fish install hint', () => {
      const hint = generator.getInstallHint('fish');
      expect(hint).toContain('Fish');
      expect(hint).toContain('.fish');
    });
  });
});

describe('CompletionProvider', () => {
  let provider: CompletionProvider;
  let tmpDir: string;
  let configPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tuniu-completion-'));
    configPath = path.join(tmpDir, 'config.json');

    const config = {
      defaultProfile: 'production',
      profiles: {
        production: {
          servers: {
            ticket: {
              url: 'https://mcp.test.com/ticket',
              description: '门票服务',
              headers: {},
            },
            hotel: {
              url: 'https://mcp.test.com/hotel',
              description: '酒店服务',
              headers: {},
            },
          },
          timeout: 30,
        },
      },
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    const configManager = new ConfigManager(configPath);
    provider = new CompletionProvider(configManager);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('getCommands', () => {
    it('returns all commands', () => {
      const commands = provider.getCommands();
      expect(commands).toContain('help');
      expect(commands).toContain('list');
      expect(commands).toContain('call');
      expect(commands).toContain('health');
      expect(commands).toContain('schema');
      expect(commands).toContain('config');
      expect(commands).toContain('skill');
      expect(commands).toContain('completion');
    });
  });

  describe('getCommandDescriptions', () => {
    it('returns command descriptions', () => {
      const descriptions = provider.getCommandDescriptions();
      expect(descriptions['help']).toBe('显示帮助信息');
      expect(descriptions['list']).toBe('列出服务或工具');
      expect(descriptions['call']).toBe('调用 MCP 工具');
      expect(descriptions['skill']).toBe('Skill 管理');
    });
  });

  describe('getServers', () => {
    it('returns server list from config', () => {
      const servers = provider.getServers();
      expect(servers).toContain('ticket');
      expect(servers).toContain('hotel');
    });
  });

  describe('getOptions', () => {
    it('returns options for list command', () => {
      const options = provider.getOptions('list');
      expect(options).toContain('-o');
      expect(options).toContain('--output');
    });

    it('returns options for call command', () => {
      const options = provider.getOptions('call');
      expect(options).toContain('-a');
      expect(options).toContain('--args');
      expect(options).toContain('--dry-run');
    });

    it('returns empty array for unknown command', () => {
      const options = provider.getOptions('unknown');
      expect(options).toEqual([]);
    });
  });

  describe('getConfigActions', () => {
    it('returns config actions', () => {
      const actions = provider.getConfigActions();
      expect(actions).toContain('init');
      expect(actions).toContain('show');
      expect(actions).toContain('set');
    });
  });

  describe('getSkillActions', () => {
    it('returns skill actions', () => {
      const actions = provider.getSkillActions();
      expect(actions).toContain('install');
    });
  });

  describe('getSupportedShells', () => {
    it('returns supported shells', () => {
      const shells = provider.getSupportedShells();
      expect(shells).toContain('bash');
      expect(shells).toContain('zsh');
      expect(shells).toContain('fish');
    });
  });

  describe('getSuggestions', () => {
    it('returns commands when no argument given', async () => {
      const suggestions = await provider.getSuggestions([]);
      expect(suggestions).toContain('list');
      expect(suggestions).toContain('call');
    });

    it('returns filtered commands with prefix', async () => {
      const suggestions = await provider.getSuggestions(['li']);
      expect(suggestions).toContain('list');
      expect(suggestions).not.toContain('call');
    });

    it('returns servers for list command', async () => {
      const suggestions = await provider.getSuggestions(['list']);
      expect(suggestions).toContain('ticket');
      expect(suggestions).toContain('hotel');
    });

    it('returns servers for call command', async () => {
      const suggestions = await provider.getSuggestions(['call']);
      expect(suggestions).toContain('ticket');
      expect(suggestions).toContain('hotel');
    });

    it('returns config actions for config command', async () => {
      const suggestions = await provider.getSuggestions(['config']);
      expect(suggestions).toContain('init');
      expect(suggestions).toContain('show');
      expect(suggestions).toContain('set');
    });

    it('returns skill actions for skill command', async () => {
      const suggestions = await provider.getSuggestions(['skill']);
      expect(suggestions).toContain('install');
    });

    it('returns shells for completion command', async () => {
      const suggestions = await provider.getSuggestions(['completion']);
      expect(suggestions).toContain('bash');
      expect(suggestions).toContain('zsh');
      expect(suggestions).toContain('fish');
    });
  });
});

describe('Templates', () => {
  describe('generateBashTemplate', () => {
    it('generates bash template with CLI name', () => {
      const template = generateBashTemplate('mycli');
      expect(template).toContain('_mycli_completion');
      expect(template).toContain('complete -F _mycli_completion mycli');
    });
  });

  describe('generateZshTemplate', () => {
    it('generates zsh template with CLI name', () => {
      const template = generateZshTemplate('mycli');
      expect(template).toContain('#compdef mycli');
      expect(template).toContain('_mycli()');
    });

    it('contains command descriptions', () => {
      const template = generateZshTemplate('tuniu');
      expect(template).toContain('help:显示帮助信息');
      expect(template).toContain('list:列出服务或工具');
      expect(template).toContain('skill:Skill 管理');
    });
  });

  describe('generateFishTemplate', () => {
    it('generates fish template with CLI name', () => {
      const template = generateFishTemplate('mycli');
      expect(template).toContain('complete -c mycli');
    });

    it('contains command definitions', () => {
      const template = generateFishTemplate('tuniu');
      expect(template).toContain("-a help -d '显示帮助信息'");
      expect(template).toContain("-a list -d '列出服务或工具'");
      expect(template).toContain("-a skill -d 'Skill 管理'");
    });
  });
});

describe('CompletionInstaller', () => {
  let installer: CompletionInstaller;
  let tmpDir: string;
  let originalHome: string | undefined;

  beforeEach(() => {
    installer = new CompletionInstaller('tuniu-test');
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tuniu-installer-'));
    originalHome = process.env.HOME;
    process.env.HOME = tmpDir;
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('getOS', () => {
    it('returns current OS type', () => {
      const osType = installer.getOS();
      expect(['linux', 'macos', 'windows', 'unknown']).toContain(osType);
    });
  });

  describe('installFish', () => {
    it('installs fish completion to user directory', () => {
      const script = '# test fish completion';
      const result = installer.installFish(script);

      expect(result.success).toBe(true);
      expect(result.path).toContain('.config/fish/completions/tuniu-test.fish');
      expect(fs.existsSync(result.path!)).toBe(true);
    });

    it('creates completions directory if not exists', () => {
      const script = '# test';
      const result = installer.installFish(script);

      expect(result.success).toBe(true);
      const completionsDir = path.join(
        tmpDir,
        '.config',
        'fish',
        'completions',
      );
      expect(fs.existsSync(completionsDir)).toBe(true);
    });
  });

  describe('uninstallFish', () => {
    it('uninstalls fish completion', () => {
      // First install
      const script = '# test';
      installer.installFish(script);

      // Then uninstall
      const result = installer.uninstallFish();
      expect(result.success).toBe(true);
      expect(result.message).toContain('已卸载');
    });

    it('handles already uninstalled case', () => {
      const result = installer.uninstallFish();
      expect(result.success).toBe(true);
      expect(result.message).toContain('未找到');
    });
  });

  describe('install', () => {
    it('installs fish completion via generic install method', () => {
      const script = '# test fish completion';
      const result = installer.install('fish', script);

      expect(result.success).toBe(true);
      expect(result.path).toBeDefined();
    });
  });

  describe('uninstall', () => {
    it('uninstalls fish completion via generic uninstall method', () => {
      const script = '# test';
      installer.install('fish', script);

      const result = installer.uninstall('fish');
      expect(result.success).toBe(true);
    });
  });

  describe('isInstalled', () => {
    it('returns false when not installed', () => {
      expect(installer.isInstalled('fish')).toBe(false);
    });

    it('returns true after installation', () => {
      installer.install('fish', '# test');
      expect(installer.isInstalled('fish')).toBe(true);
    });

    it('returns false after uninstallation', () => {
      installer.install('fish', '# test');
      installer.uninstall('fish');
      expect(installer.isInstalled('fish')).toBe(false);
    });
  });
});