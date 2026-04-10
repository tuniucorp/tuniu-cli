/**
 * ⚠️ 同步警告（请勿只改此文件）：
 * 本文件是给 npm postinstall 使用的 JS 镜像实现。
 * 业务逻辑主源在 src/skill/skill-meta.ts，两个文件必须保持 1:1 同步。
 *
 * 变更步骤（必须同时执行）：
 * 1) 先修改 src/skill/skill-meta.ts
 * 2) 再将同等改动同步到本文件
 * 3) 运行 npm test 验证
 */
import crypto from 'node:crypto';

export function nowInBeijingISOString() {
  const now = new Date();
  const beijingMs = now.getTime() + 8 * 60 * 60 * 1000;
  const beijing = new Date(beijingMs);
  return `${beijing.toISOString().slice(0, -1)}+08:00`;
}

export function parseSkillFrontmatter(content) {
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

export function skillContentSha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export function buildBuiltinLocalMeta(skillContent, cliVersion) {
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
