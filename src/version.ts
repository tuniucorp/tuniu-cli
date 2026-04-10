import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function readPackageVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkgPath = join(here, '..', 'package.json');
  const raw = readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(raw) as { version?: unknown };
  return typeof pkg.version === 'string' && pkg.version.trim()
    ? pkg.version
    : '0.0.0';
}

export const VERSION = readPackageVersion();
/** CLI 版本号（别名，语义更明确） */
export const CLI_VERSION = VERSION;
