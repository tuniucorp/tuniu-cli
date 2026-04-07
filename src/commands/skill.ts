import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SKILL_NAME = 'tuniu-cli';

export const SUPPORTED_SKILL_AGENTS = [
  'agents',
  'claude',
  'copaw',
  'cursor',
  'qoder',
  'codex',
  'opencode',
  'openclaw',
] as const;

export type SkillAgent = (typeof SUPPORTED_SKILL_AGENTS)[number];

type ResolvedAgent = SkillAgent;

export interface SkillInstallTarget {
  agent: ResolvedAgent | 'custom';
  skillDir: string;
  skillFile: string;
}

function getSkillSourcePath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(here, '..', '..', 'SKILL.md'),
    path.join(here, '..', 'SKILL.md'),
    path.join(process.cwd(), 'SKILL.md'),
  ];

  const existing = candidates.find((candidate) => fs.existsSync(candidate));
  return existing ?? candidates[0];
}

export class SkillInstaller {
  private readonly homeDir: string;
  private readonly cwd: string;

  constructor(homeDir = os.homedir(), cwd = process.cwd()) {
    this.homeDir = homeDir;
    this.cwd = cwd;
  }

  getSkillSourcePath(): string {
    return getSkillSourcePath();
  }

  getSupportedAgents(): SkillAgent[] {
    return [...SUPPORTED_SKILL_AGENTS];
  }

  parseAgents(input?: string): ResolvedAgent[] {
    // 默认只安装到 agents 目录
    if (!input || input.trim() === '') {
      return ['agents'];
    }

    // 'all' 才安装到所有支持的目录
    if (input.trim() === 'all') {
      return ['cursor', 'claude', 'qoder', 'codex', 'opencode', 'openclaw', 'copaw', 'agents'];
    }

    const values = input
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const invalid = values.filter(
      (value) => !this.getSupportedAgents().includes(value as SkillAgent),
    );
    if (invalid.length > 0) {
      throw new Error(
        `不支持的 Agent 类型: ${invalid.join(', ')}。支持: ${this.getSupportedAgents().join(', ')}, all`,
      );
    }

    const resolved = new Set<ResolvedAgent>();
    for (const value of values as SkillAgent[]) {
      resolved.add(value);
    }

    return [...resolved];
  }

  resolveInstallTargets(options?: {
    agent?: string;       // 位置参数（单个 agent）
    agents?: string;      // --agent 选项（多个 agent 或 all）
    customDir?: string;
  }): SkillInstallTarget[] {
    const {
      agent,
      agents,
      customDir,
    } = options ?? {};

    // 合并位置参数和选项参数，选项参数优先
    const agentInput = agents || agent;
    const targets: SkillInstallTarget[] = [];
    const resolvedAgents = this.parseAgents(agentInput);

    for (const agent of resolvedAgents) {
      targets.push(this.createTarget(agent));
    }

    if (customDir) {
      const skillDir = path.resolve(customDir, SKILL_NAME);
      targets.push({
        agent: 'custom',
        skillDir,
        skillFile: path.join(skillDir, 'SKILL.md'),
      });
    }

    return this.deduplicateTargets(targets);
  }

  install(options?: {
    agent?: string;
    agents?: string;
    customDir?: string;
    force?: boolean;
    includeLobsterAiByDefault?: boolean;
  }): SkillInstallTarget[] {
    const {
      force = true,
    } = options ?? {};
    const source = this.getSkillSourcePath();

    if (!fs.existsSync(source)) {
      throw new Error(`未找到内置 Skill 文件: ${source}`);
    }

    const targets = this.resolveInstallTargets(options);
    for (const target of targets) {
      fs.mkdirSync(target.skillDir, { recursive: true });
      if (!force && fs.existsSync(target.skillFile)) {
        continue;
      }
      fs.copyFileSync(source, target.skillFile);
    }

    return targets;
  }

  private createTarget(agent: ResolvedAgent): SkillInstallTarget {
    const baseDir = this.getAgentBaseDir(agent);
    const skillDir = path.join(baseDir, SKILL_NAME);
    return {
      agent,
      skillDir,
      skillFile: path.join(skillDir, 'SKILL.md'),
    };
  }

  private getAgentBaseDir(agent: ResolvedAgent): string {
    switch (agent) {
      case 'cursor':
        return path.join(this.homeDir, '.cursor', 'skills');
      case 'claude':
        return path.join(this.homeDir, '.claude', 'skills');
      case 'openclaw':
        return path.join(this.homeDir, '.openclaw', 'skills');
      case 'copaw':
        return path.join(this.homeDir, '.copaw', 'customized_skills');
      case 'agents':
        return path.join(this.homeDir, '.agents', 'skills');
      case 'qoder':
        return path.join(this.homeDir, '.qoder', 'skills');
      case 'codex':
        return path.join(this.homeDir, '.codex', 'skills');
      case 'opencode':
        return path.join(this.homeDir, '.config', 'opencode', 'skills');
    }
  }

  private deduplicateTargets(targets: SkillInstallTarget[]): SkillInstallTarget[] {
    const seen = new Set<string>();
    return targets.filter((target) => {
      if (seen.has(target.skillFile)) {
        return false;
      }
      seen.add(target.skillFile);
      return true;
    });
  }
}

export async function executeSkillInstall(options?: {
  agent?: string;
  agents?: string;
  customDir?: string;
  force?: boolean;
}): Promise<number> {
  const installer = new SkillInstaller();

  try {
    const targets = installer.install({
      agent: options?.agent,
      agents: options?.agents,
      customDir: options?.customDir,
      force: options?.force,
    });

    console.log('✓ Skill 安装完成');
    console.log('');
    console.log('已写入以下目录:');
    for (const target of targets) {
      console.log(`- [${target.agent}] ${target.skillFile}`);
    }

    console.log('');
    console.log('说明:');
    console.log(
      '- 若通过 npm 全局安装（npm install -g tuniu-cli@latest），通常会在 postinstall 阶段自动检测并注册 skill。',
    );
    console.log('- 若通过 npx/源码方式使用，或需手动更新/定向安装，请显式执行本命令。');
    console.log('- 如需安装到其他目录，可使用: tuniu skill install --dir <path>');
    console.log(
      '- 内置 Agent: agents,claude,cursor,qoder,codex,opencode,openclaw,copaw',
    );
    console.log(
      '- 如需只安装到指定 Agent，可使用: tuniu skill install --agent cursor,claude 或 tuniu skill install cursor',
    );
    console.log(
      '- 如需安装到全部内置 Agent，可使用: tuniu skill install --agent all',
    );
    return 0;
  } catch (error) {
    console.error(`错误: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
