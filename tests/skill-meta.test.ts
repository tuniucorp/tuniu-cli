import { describe, expect, it } from 'vitest';
import {
  buildBuiltinLocalMeta,
  nowInBeijingISOString,
  parseSkillFrontmatter,
  skillContentSha256,
} from '../src/skill/skill-meta.js';

describe('skill-meta', () => {
  it('parseSkillFrontmatter reads version and minCliVersion from YAML', () => {
    const md = `---
version: 2.1.0
minCliVersion: 1.2.3
---
body`;
    expect(parseSkillFrontmatter(md)).toEqual({
      version: '2.1.0',
      minCliVersion: '1.2.3',
    });
  });

  it('parseSkillFrontmatter uses defaults when no frontmatter', () => {
    expect(parseSkillFrontmatter('no frontmatter')).toEqual({
      version: '1.0.0',
      minCliVersion: '1.0.4',
    });
  });

  it('skillContentSha256 is stable for UTF-8', () => {
    const s = '你好\n---\n';
    const a = skillContentSha256(s);
    const b = skillContentSha256(s);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('buildBuiltinLocalMeta matches zip-like fields and builtin extensions', () => {
    const content = `---
version: 1.0.9
minCliVersion: 1.0.5
---
x`;
    const meta = buildBuiltinLocalMeta(content, '9.9.9');
    expect(meta.version).toBe('1.0.9');
    expect(meta.minCliVersion).toBe('1.0.5');
    expect(meta.sha256).toBe(skillContentSha256(content));
    expect(meta.source).toBe('builtin');
    expect(meta.cliVersion).toBe('9.9.9');
    expect(meta.releasedAt).toBe(meta.installedAt);
    expect(meta.installedAt.endsWith('+08:00')).toBe(true);
    expect(Number.isNaN(Date.parse(meta.installedAt))).toBe(false);
  });

  it('nowInBeijingISOString uses +08:00 offset', () => {
    const s = nowInBeijingISOString();
    expect(s.endsWith('+08:00')).toBe(true);
    expect(Number.isNaN(Date.parse(s))).toBe(false);
  });
});
