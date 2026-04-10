/**
 * Skill 元数据生成
 * 与 scripts/skill-meta.mjs 逻辑须保持一致（postinstall 使用该脚本）
 */
import crypto from 'node:crypto';
import type { SkillMeta } from './downloader.js';

/**
 * 格式化为北京时间（UTC+8）ISO 字符串，例如 2026-04-10T20:00:00.000+08:00
 */
export function nowInBeijingISOString(): string {
  const now = new Date();
  const beijingMs = now.getTime() + 8 * 60 * 60 * 1000;
  const beijing = new Date(beijingMs);
  return `${beijing.toISOString().slice(0, -1)}+08:00`;
}

/**
 * 从 SKILL.md 头部 YAML 解析版本
 */
export function parseSkillFrontmatter(content: string): {
  version: string;
  minCliVersion: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return { version: '1.0.0', minCliVersion: '1.0.4' };
  }

  const yaml = match[1];
  const versionMatch = yaml.match(/version:\s*['"]?([\d.]+)['"]?/);
  const version = versionMatch ? versionMatch[1] : '1.0.0';

  const minCliMatch = yaml.match(/minCliVersion:\s*['"]?([\d.]+)['"]?/);
  const minCliVersion = minCliMatch ? minCliMatch[1] : '1.0.4';

  return { version, minCliVersion };
}

export function skillContentSha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * 内置安装写入 _meta.json 的完整结构（含 LocalMeta 扩展字段）
 */
export function buildBuiltinLocalMeta(
  skillContent: string,
  cliVersion: string,
): SkillMeta & {
  source: 'builtin';
  installedAt: string;
  cliVersion: string;
} {
  const { version, minCliVersion } = parseSkillFrontmatter(skillContent);
  const sha256 = skillContentSha256(skillContent);
  const now = nowInBeijingISOString();
  return {
    version,
    releasedAt: now,
    sha256,
    minCliVersion,
    source: 'builtin',
    installedAt: now,
    cliVersion,
  };
}
