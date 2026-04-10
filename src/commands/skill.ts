import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SkillDownloader,
  NetworkError,
  HttpResponseError,
  type SkillMeta,
} from '../skill/downloader.js';
import { buildBuiltinLocalMeta, nowInBeijingISOString } from '../skill/skill-meta.js';
import { ConfigManager } from '../config/index.js';
import { CLI_VERSION } from '../version.js';

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

/**
 * 本地安装后的元数据结构
 */
export interface LocalMeta extends SkillMeta {
  source: 'builtin' | 'download';
  downloadUrl?: string;
  installedAt: string;
  cliVersion: string;
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

  /**
   * 从远程下载并安装 skill
   */
  async installFromDownload(options: {
    downloadUrl: string;
    agent?: string;
    agents?: string;
    customDir?: string;
    force?: boolean;
  }): Promise<{ targets: SkillInstallTarget[]; meta: SkillMeta }> {
    const downloader = new SkillDownloader(options.downloadUrl);
    const targets = this.resolveInstallTargets(options);

    if (targets.length === 0) {
      throw new Error('未指定安装目标');
    }

    // 下载到第一个目标目录
    const primaryTarget = targets[0];
    const { meta } = await downloader.downloadAndExtract(primaryTarget.skillDir);

    // 构建本地元数据
    const localMeta: LocalMeta = {
      ...meta,
      source: 'download',
      downloadUrl: options.downloadUrl,
      installedAt: nowInBeijingISOString(),
      cliVersion: CLI_VERSION,
    };

    // 写入元数据到第一个目标目录
    const primaryMetaPath = path.join(primaryTarget.skillDir, '_meta.json');
    fs.writeFileSync(primaryMetaPath, JSON.stringify(localMeta, null, 2) + '\n');

    // 复制 SKILL.md 和元数据到其他目标目录
    const skillFile = path.join(primaryTarget.skillDir, 'SKILL.md');
    for (const target of targets.slice(1)) {
      fs.mkdirSync(target.skillDir, { recursive: true });
      if (fs.existsSync(skillFile)) {
        fs.copyFileSync(skillFile, target.skillFile);
      }
      // 写入元数据
      const targetMetaPath = path.join(target.skillDir, '_meta.json');
      fs.writeFileSync(targetMetaPath, JSON.stringify(localMeta, null, 2) + '\n');
    }

    return { targets, meta };
  }

  /**
   * 使用内置文件安装（fallback）
   */
  installBuiltin(options?: {
    agent?: string;
    agents?: string;
    customDir?: string;
    force?: boolean;
  }): SkillInstallTarget[] {
    const source = this.getSkillSourcePath();

    if (!fs.existsSync(source)) {
      throw new Error(`未找到内置 Skill 文件: ${source}`);
    }

    const targets = this.resolveInstallTargets(options);
    const skillContent = fs.readFileSync(source, 'utf8');
    const localMeta: LocalMeta = buildBuiltinLocalMeta(skillContent, CLI_VERSION);

    for (const target of targets) {
      fs.mkdirSync(target.skillDir, { recursive: true });
      fs.copyFileSync(source, target.skillFile);
      const metaPath = path.join(target.skillDir, '_meta.json');
      fs.writeFileSync(metaPath, JSON.stringify(localMeta, null, 2) + '\n');
    }

    return targets;
  }
}

export async function executeSkillInstall(options?: {
  agent?: string;
  agents?: string;
  customDir?: string;
  force?: boolean;
  configManager?: ConfigManager;
}): Promise<number> {
  const installer = new SkillInstaller();
  const configManager = options?.configManager ?? new ConfigManager();
  const downloadUrl = configManager.getSkillDownloadUrl();
  if (process.env.TUNIU_CLI_DEBUG === '1') {
    console.error(`[DEBUG] skill 下载地址: ${downloadUrl}`);
  }

  // 1. 尝试从远程下载最新 skill
  try {
    const { targets, meta } = await installer.installFromDownload({
      downloadUrl,
      agent: options?.agent,
      agents: options?.agents,
      customDir: options?.customDir,
      force: options?.force,
    });

    console.log('✓ Skill 安装完成（来源: 远程下载）');
    if (meta.version) {
      console.log(`  版本: ${meta.version}`);
    }
    console.log('');
    console.log('已写入以下目录:');
    for (const target of targets) {
      console.log(`- [${target.agent}] ${target.skillFile}`);
    }
    return 0;
  } catch (error) {
    // 2. 下载失败，根据错误类型提示用户
    if (error instanceof NetworkError) {
      console.warn('⚠ 网络异常，无法连接到下载服务器');
      console.log('  请检查网络连接后重试');
    } else if (error instanceof HttpResponseError) {
      console.warn(`⚠ 接口响应失败: HTTP ${error.statusCode}`);
      console.log('  如需最新 skill，可访问途牛开放平台手动下载:');
      console.log('  https://open.tuniu.com/mcp/');
    } else {
      console.warn(`⚠ 下载失败: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('');
    console.log('  使用内置 skill 安装...');

    // 3. Fallback 到内置文件
    try {
      const targets = installer.installBuiltin({
        agent: options?.agent,
        agents: options?.agents,
        customDir: options?.customDir,
        force: options?.force,
      });

      console.log('');
      console.log('✓ Skill 安装完成（来源: 内置文件）');
      console.log('');
      console.log('已写入以下目录:');
      for (const target of targets) {
        console.log(`- [${target.agent}] ${target.skillFile}`);
      }
      console.log('');
      console.log('可稍后重试更新: tuniu skill install');
      return 0;
    } catch (fallbackError) {
      console.error(`错误: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
      return 1;
    }
  }
}
