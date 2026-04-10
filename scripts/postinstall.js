/**
 * npm postinstall script for tuniu-cli
 * Automatically installs SKILL.md to detected Agent directories
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBuiltinLocalMeta } from './skill-meta.mjs';

const SKILL_NAME = 'tuniu-cli';

// Agent directories to check (relative to home directory)
const AGENT_DIRS = [
  { dir: '.claude/skills', parent: '.claude' },
  { dir: '.cursor/skills', parent: '.cursor' },
  { dir: '.qoder/skills', parent: '.qoder' },
  { dir: '.codex/skills', parent: '.codex' },
  { dir: '.config/opencode/skills', parent: '.config/opencode' },
  { dir: '.openclaw/skills', parent: '.openclaw' },
  { dir: '.copaw/customized_skills', parent: '.copaw' },
];

function getSkillSourcePath() {
  const here = path.dirname(fileURLToPath(import.meta.url));

  // 仅从包内解析，避免误用 process.cwd() 下同名文件（供应链/误配置场景）
  const candidates = [path.join(here, '..', 'SKILL.md'), path.join(here, 'SKILL.md')];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

function readExpectedSkillSha256() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const manifestPath = path.join(here, '.skill.sha256');
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  return fs.readFileSync(manifestPath, 'utf8').trim();
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function getCliVersion(packageRoot) {
  const pkgPath = path.join(packageRoot, 'package.json');
  try {
    const raw = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    return typeof pkg.version === 'string' && pkg.version.trim() ? pkg.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function writeSkillMeta(destDir, skillContent, cliVersion) {
  const meta = buildBuiltinLocalMeta(skillContent, cliVersion);
  const metaPath = path.join(destDir, '_meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
}

/**
 * 发布包内应包含 scripts/.skill.sha256（由 prepack 生成）；与 SKILL.md 不一致则拒绝安装。
 * 开发克隆若未生成 manifest，仅告警并跳过校验，避免阻断本地 npm link。
 */
function verifySkillIntegrity(skillSource) {
  const expected = readExpectedSkillSha256();
  if (!expected) {
    console.warn(
      'tuniu-cli: 未找到 .skill.sha256，跳过完整性校验（常见于源码直装；发布包应包含该文件）',
    );
    return true;
  }

  const actual = sha256File(skillSource);
  if (actual !== expected) {
    console.warn(
      `tuniu-cli: SKILL.md 完整性校验失败（与发布预期不一致），已跳过 skill 安装。若你正在从源码安装，请执行: npm run generate:skill-hash`,
    );
    return false;
  }

  return true;
}

function installSkillsToHomes() {
  const homeDir = os.homedir();
  const skillSource = getSkillSourcePath();
  const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const cliVersion = getCliVersion(packageRoot);

  // Check if SKILL.md exists
  if (!fs.existsSync(skillSource)) {
    console.log('tuniu-cli: SKILL.md not found, skipping skill installation');
    return;
  }

  if (!verifySkillIntegrity(skillSource)) {
    return;
  }

  let installed = 0;

  for (const agent of AGENT_DIRS) {
    const parentGate = path.join(homeDir, agent.parent);

    // Check if the parent directory exists (indicates the Agent is installed)
    if (!fs.existsSync(parentGate)) {
      continue;
    }

    const destDir = path.join(homeDir, agent.dir, SKILL_NAME);
    const destFile = path.join(destDir, 'SKILL.md');

    try {
      // Create directory if it doesn't exist
      fs.mkdirSync(destDir, { recursive: true });

      // Copy the SKILL.md file
      fs.copyFileSync(skillSource, destFile);
      const skillContent = fs.readFileSync(destFile, 'utf8');
      writeSkillMeta(destDir, skillContent, cliVersion);
      installed++;
      console.log(`tuniu-cli: Skill installed to ${destDir}`);
    } catch (error) {
      console.warn(`tuniu-cli: Failed to install to ${destDir}: ${error.message}`);
    }
  }

  // If no Agent directory was found, fall back to ~/.agents/skills/tuniu-cli/
  if (installed === 0) {
    const defaultDir = path.join(homeDir, '.agents', 'skills', SKILL_NAME);
    const destFile = path.join(defaultDir, 'SKILL.md');

    try {
      fs.mkdirSync(defaultDir, { recursive: true });
      fs.copyFileSync(skillSource, destFile);
      const skillContent = fs.readFileSync(destFile, 'utf8');
      writeSkillMeta(defaultDir, skillContent, cliVersion);
      console.log(`tuniu-cli: Skill installed to ${defaultDir}`);
    } catch (error) {
      console.warn(`tuniu-cli: Failed to install to ${defaultDir}: ${error.message}`);
    }
  }

  // 提示用户可以更新到最新版本
  console.log('');
  console.log('tuniu-cli: Skill 安装完成（来源: 内置文件）');
  console.log('tuniu-cli: 如需更新到最新版本，请执行: tuniu skill install');
}

// Run the installation
installSkillsToHomes();