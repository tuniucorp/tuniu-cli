import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SKILL_NAME, SkillInstaller } from '../src/commands/skill.js';

describe('SkillInstaller', () => {
  let tmpDir: string;
  let originalHome: string | undefined;
  let installer: SkillInstaller;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tuniu-skill-'));
    originalHome = process.env.HOME;
    process.env.HOME = tmpDir;
    installer = new SkillInstaller(tmpDir, tmpDir);
  });

  afterEach(() => {
    process.env.HOME = originalHome;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('resolves default targets to agents directory only', () => {
    const targets = installer.resolveInstallTargets();
    const targetFiles = targets.map((item) => item.skillFile);

    // 默认只安装到 agents 目录
    expect(targetFiles).toHaveLength(1);
    expect(targetFiles).toContain(
      path.join(tmpDir, '.agents', 'skills', SKILL_NAME, 'SKILL.md'),
    );
  });

  it('resolves all targets when agent is "all"', () => {
    const targets = installer.resolveInstallTargets({ agents: 'all' });
    const targetFiles = targets.map((item) => item.skillFile);

    // 'all' 应安装到所有支持的目录
    expect(targetFiles).toContain(
      path.join(tmpDir, '.cursor', 'skills', SKILL_NAME, 'SKILL.md'),
    );
    expect(targetFiles).toContain(
      path.join(tmpDir, '.claude', 'skills', SKILL_NAME, 'SKILL.md'),
    );
    expect(targetFiles).toContain(
      path.join(tmpDir, '.openclaw', 'skills', SKILL_NAME, 'SKILL.md'),
    );
    expect(targetFiles).toContain(
      path.join(tmpDir, '.copaw', 'customized_skills', SKILL_NAME, 'SKILL.md'),
    );
    expect(targetFiles).toContain(
      path.join(tmpDir, '.agents', 'skills', SKILL_NAME, 'SKILL.md'),
    );
    // 新增的 Agent 目录
    expect(targetFiles).toContain(
      path.join(tmpDir, '.qoder', 'skills', SKILL_NAME, 'SKILL.md'),
    );
    expect(targetFiles).toContain(
      path.join(tmpDir, '.codex', 'skills', SKILL_NAME, 'SKILL.md'),
    );
    expect(targetFiles).toContain(
      path.join(tmpDir, '.config', 'opencode', 'skills', SKILL_NAME, 'SKILL.md'),
    );
  });

  it('resolves specific agent targets', () => {
    const targets = installer.resolveInstallTargets({ agents: 'cursor,claude' });
    const targetFiles = targets.map((item) => item.skillFile);

    expect(targetFiles).toHaveLength(2);
    expect(targetFiles).toContain(
      path.join(tmpDir, '.cursor', 'skills', SKILL_NAME, 'SKILL.md'),
    );
    expect(targetFiles).toContain(
      path.join(tmpDir, '.claude', 'skills', SKILL_NAME, 'SKILL.md'),
    );
  });

  it('resolves positional agent argument', () => {
    const targets = installer.resolveInstallTargets({ agent: 'cursor' });
    const targetFiles = targets.map((item) => item.skillFile);

    expect(targetFiles).toHaveLength(1);
    expect(targetFiles).toContain(
      path.join(tmpDir, '.cursor', 'skills', SKILL_NAME, 'SKILL.md'),
    );
  });

  it('supports new agents: qoder, codex, opencode', () => {
    const targets = installer.resolveInstallTargets({ agents: 'qoder,codex,opencode' });
    const targetFiles = targets.map((item) => item.skillFile);

    expect(targetFiles).toHaveLength(3);
    expect(targetFiles).toContain(
      path.join(tmpDir, '.qoder', 'skills', SKILL_NAME, 'SKILL.md'),
    );
    expect(targetFiles).toContain(
      path.join(tmpDir, '.codex', 'skills', SKILL_NAME, 'SKILL.md'),
    );
    expect(targetFiles).toContain(
      path.join(tmpDir, '.config', 'opencode', 'skills', SKILL_NAME, 'SKILL.md'),
    );
  });

  it('supports custom install directory', () => {
    const targets = installer.resolveInstallTargets({
      agents: 'cursor',
      customDir: path.join(tmpDir, 'custom-skills'),
    });

    expect(targets.map((item) => item.skillFile)).toContain(
      path.join(tmpDir, 'custom-skills', SKILL_NAME, 'SKILL.md'),
    );
  });

  it('throws for unsupported agent names', () => {
    expect(() => installer.parseAgents('unknown-agent')).toThrow('不支持的 Agent 类型');
  });

  it('installs skill file to target directories', () => {
    const targets = installer.install({ agents: 'cursor,claude' });

    for (const target of targets) {
      expect(fs.existsSync(target.skillFile)).toBe(true);
      expect(fs.readFileSync(target.skillFile, 'utf8')).toContain('name: tuniu-cli');
    }
  });

  it('installs skill file to default directory', () => {
    const targets = installer.install();

    expect(targets).toHaveLength(1);
    expect(fs.existsSync(targets[0].skillFile)).toBe(true);
    expect(fs.readFileSync(targets[0].skillFile, 'utf8')).toContain('name: tuniu-cli');
  });
});
