/**
 * Skill 版本管理
 * 提供 tuniu skill version 命令
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CLI_VERSION } from '../version.js';
import type { LocalMeta } from '../commands/skill.js';

const SKILL_NAME = 'tuniu-cli';

// 内置支持的 Agent 目录
const AGENT_DIRS: { agent: string; dir: string }[] = [
  { agent: 'agents', dir: '.agents/skills' },
  { agent: 'claude', dir: '.claude/skills' },
  { agent: 'cursor', dir: '.cursor/skills' },
  { agent: 'qoder', dir: '.qoder/skills' },
  { agent: 'codex', dir: '.codex/skills' },
  { agent: 'opencode', dir: '.config/opencode/skills' },
  { agent: 'openclaw', dir: '.openclaw/skills' },
  { agent: 'copaw', dir: '.copaw/customized_skills' },
];

/**
 * 已安装的 skill 信息
 */
interface InstalledSkill {
  agent: string;
  skillDir: string;
  meta: LocalMeta;
}

/**
 * 读取指定目录下的元数据
 */
function readMetaFromDir(skillDir: string): LocalMeta | null {
  const metaPath = path.join(skillDir, '_meta.json');
  if (!fs.existsSync(metaPath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(metaPath, 'utf8');
    return JSON.parse(content) as LocalMeta;
  } catch {
    return null;
  }
}

/**
 * 遍历所有内置 Agent 目录，查找已安装的 skill
 */
function findAllInstalledSkills(): InstalledSkill[] {
  const homeDir = os.homedir();
  const installed: InstalledSkill[] = [];

  for (const { agent, dir } of AGENT_DIRS) {
    const skillDir = path.join(homeDir, dir, SKILL_NAME);
    const meta = readMetaFromDir(skillDir);

    if (meta) {
      installed.push({
        agent,
        skillDir,
        meta,
      });
    }
  }

  return installed;
}

/**
 * 执行 tuniu skill version 命令
 */
export function executeSkillVersion(): number {
  const installed = findAllInstalledSkills();

  // 没有找到任何安装
  if (installed.length === 0) {
    console.log('在内置支持的 Agent 目录都未检查到已安装的 skill');
    console.log('');
    console.log('支持的 Agent: agents, claude, cursor, qoder, codex, opencode, openclaw, copaw');
    console.log('');
    console.log('请先执行: tuniu skill install');
    return 1;
  }

  // 检查 skill 是否实质不一致（仅「版本号不同」或「均有 sha256 且内容不同」才提示；来源 builtin/download 不同但同版本同内容不算不一致）
  const versions = new Set(installed.map((s) => s.meta.version));
  const shas = installed.map((s) => s.meta.sha256).filter((h): h is string => Boolean(h && h.length > 0));
  const allHaveSha = shas.length === installed.length;
  const sha256Mismatch = allHaveSha && new Set(shas).size > 1;
  const skillInconsistent = versions.size > 1 || sha256Mismatch;

  // 只有一个安装
  if (installed.length === 1) {
    const { agent, meta } = installed[0];
    const output = {
      cliVersion: CLI_VERSION,
      skillVersion: meta.version,
      source: meta.source,
      agent,
      installedAt: meta.installedAt,
    };
    console.log(JSON.stringify(output, null, 2));
    return 0;
  }

  // 多个安装，列出所有
  console.log('检测到多个安装位置:');
  console.log('');

  for (const { agent, meta } of installed) {
    console.log(`[${agent}]`);
    console.log(`  版本: ${meta.version}`);
    console.log(`  来源: ${meta.source}`);
    console.log(`  安装时间: ${meta.installedAt}`);
    console.log('');
  }

  // 版本或内容哈希不一致时提示（不因仅来源字段不同而提示）
  if (skillInconsistent) {
    console.log('⚠ 各 Agent 下 skill 版本或内容不一致，建议统一更新:');
    for (const { agent, meta } of installed) {
      console.log(`  - ${agent}: ${meta.version} (${meta.source})`);
    }
    console.log('');
    console.log('执行以下命令更新:');
    console.log('  tuniu skill install                    # 更新默认路径');
    console.log('  tuniu skill install --agent all        # 更新全部 Agent');
    console.log('  tuniu skill install --agent <agent>    # 更新指定 Agent');
    console.log('');
  }

  console.log(`CLI 版本: ${CLI_VERSION}`);
  return 0;
}