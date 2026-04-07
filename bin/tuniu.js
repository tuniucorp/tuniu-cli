#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distPath = join(root, 'dist', 'index.js');
const srcPath = join(root, 'src', 'index.ts');

const useBuild = process.env.TUNIU_USE_SOURCE !== '1';

let result;
if (useBuild && existsSync(distPath)) {
  result = spawnSync('node', [distPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
    cwd: root,
  });
} else {
  if (existsSync(distPath)) {
    result = spawnSync('node', [distPath, ...process.argv.slice(2)], {
      stdio: 'inherit',
      cwd: root,
    });
  } else if (process.env.TUNIU_USE_SOURCE === '1') {
    // 开发模式：使用本地依赖的 tsx 运行源码（不使用 npx，避免运行时隐式下载/不确定性）
    result = spawnSync('node', ['--import', 'tsx', srcPath, ...process.argv.slice(2)], {
      stdio: 'inherit',
      cwd: root,
      env: process.env,
    });
  } else {
    console.error(
      [
        '错误：安装包缺少 dist 构建产物，CLI 无法启动。',
        '',
        '可能原因：发布/打包流程未在 npm pack/publish 前执行构建。',
        '',
        '修复建议：',
        '- 重新安装官方发布包；或',
        '- 若在源码仓库中运行：先执行 `npm run build`，或设置 `TUNIU_USE_SOURCE=1` 并安装依赖后运行。',
      ].join('\n'),
    );
    process.exit(1);
  }
}

process.exit(result.status ?? 1);
