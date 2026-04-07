/**
 * Writes scripts/.skill.sha256 (SHA-256 hex of repo-root SKILL.md).
 * Run via npm run generate:skill-hash (also invoked from prepack).
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const skillPath = path.join(root, 'SKILL.md');
const outPath = path.join(here, '.skill.sha256');

if (!fs.existsSync(skillPath)) {
  console.error('generate-skill-sha: SKILL.md not found at', skillPath);
  process.exit(1);
}

const hash = crypto.createHash('sha256').update(fs.readFileSync(skillPath)).digest('hex');
fs.writeFileSync(outPath, `${hash}\n`, 'utf8');
console.log('generate-skill-sha: wrote', outPath);
