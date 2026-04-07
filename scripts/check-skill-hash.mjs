/**
 * CI / 本地校验：SKILL.md 的 SHA-256 必须与 scripts/.skill.sha256 一致。
 * 修改 SKILL.md 后请执行: npm run generate:skill-hash
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const skillPath = path.join(root, 'SKILL.md');
const manifestPath = path.join(here, '.skill.sha256');

if (!fs.existsSync(manifestPath)) {
  console.error('check-skill-hash: 缺少 scripts/.skill.sha256，请执行 npm run generate:skill-hash');
  process.exit(1);
}

if (!fs.existsSync(skillPath)) {
  console.error('check-skill-hash: 缺少 SKILL.md');
  process.exit(1);
}

const expected = fs.readFileSync(manifestPath, 'utf8').trim();
const actual = crypto.createHash('sha256').update(fs.readFileSync(skillPath)).digest('hex');

if (actual !== expected) {
  console.error('check-skill-hash: SKILL.md 与 .skill.sha256 不一致，请执行 npm run generate:skill-hash 并提交更新');
  process.exit(1);
}

console.log('check-skill-hash: OK');
