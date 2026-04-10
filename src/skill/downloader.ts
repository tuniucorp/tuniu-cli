/**
 * Skill 下载客户端
 * 从途牛开放平台下载 skill zip 包
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Extract, Open } from 'unzipper';
import { nowInBeijingISOString } from './skill-meta.js';

/** 生产环境文档站 skill zip（默认） */
export const SKILL_DOWNLOAD_URL_PRODUCTION =
  'https://open.tuniu.com/mcp/docs/claw-hub-skills/tuniu-cli/tuniu-cli-skill.zip';

/** 预发/开发文档站（与 open-pre 一致，供 development profile 使用） */
export const SKILL_DOWNLOAD_URL_DEVELOPMENT =
  'https://open-pre.tuniu.com/mcp/docs/claw-hub-skills/tuniu-cli/tuniu-cli-skill.zip';

export const SKILL_DOWNLOAD_URL = SKILL_DOWNLOAD_URL_PRODUCTION;

export const SKILL_DOWNLOAD_TIMEOUT = 30000; // 30 秒超时

/**
 * Skill 元数据结构
 */
export interface SkillMeta {
  version: string;
  releasedAt: string;
  sha256: string;
  minCliVersion: string;
}

/**
 * 下载结果
 */
export interface DownloadResult {
  tempZipPath: string;
  meta: SkillMeta;
}

/**
 * 网络异常错误
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * HTTP 响应错误
 */
export class HttpResponseError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(`HTTP ${statusCode}: ${message}`);
    this.name = 'HttpResponseError';
    this.statusCode = statusCode;
  }
}

/**
 * Skill 下载客户端
 */
export class SkillDownloader {
  private readonly timeout: number;
  private readonly downloadUrl: string;

  constructor(
    downloadUrl: string = SKILL_DOWNLOAD_URL_PRODUCTION,
    timeout = SKILL_DOWNLOAD_TIMEOUT,
  ) {
    this.downloadUrl = downloadUrl;
    this.timeout = timeout;
  }

  /**
   * 下载 skill zip 到临时目录
   */
  async download(): Promise<string> {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tuniu-skill-'));
    const tempZipPath = path.join(tempDir, 'tuniu-cli-skill.zip');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.downloadUrl, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new HttpResponseError(response.status, response.statusText);
      }

      if (!response.body) {
        throw new NetworkError('响应体为空');
      }

      // 将 ReadableStream<Uint8Array> 转换为 Node.js Buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(tempZipPath, buffer);

      return tempZipPath;
    } catch (error) {
      // 清理临时目录
      fs.rmSync(tempDir, { recursive: true, force: true });

      if (error instanceof NetworkError || error instanceof HttpResponseError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new NetworkError('网络异常，请检查网络连接');
        }
        if ('code' in error && (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED')) {
          throw new NetworkError('网络异常，无法连接到下载服务器');
        }
      }

      throw new NetworkError(`下载失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 解压 zip 到目标目录
   */
  async extract(zipPath: string, destDir: string): Promise<void> {
    // 确保目标目录存在
    fs.mkdirSync(destDir, { recursive: true });

    return new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(Extract({ path: destDir }))
        .on('close', resolve)
        .on('error', (err: Error) => {
          reject(new Error(`解压失败: ${err.message}`));
        });
    });
  }

  /**
   * 从 zip 中读取元数据（使用 Open.file 随机读 central directory，避免流式 Extract 与 autodrain 竞态导致未读到 _meta.json）
   */
  async readMeta(zipPath: string): Promise<SkillMeta> {
    try {
      const directory = await Open.file(zipPath);
      const metaFile = directory.files.find((f) => {
        if (f.type !== 'File') return false;
        const base = path.basename(f.path.replace(/\\/g, '/'));
        return base === '_meta.json' || base === '.meta.json';
      });

      if (!metaFile) {
        return {
          version: '1.0.0',
          releasedAt: nowInBeijingISOString(),
          sha256: '',
          minCliVersion: '1.0.4',
        };
      }

      const buffer = await metaFile.buffer();
      return JSON.parse(buffer.toString('utf8')) as SkillMeta;
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error('元数据解析失败');
      }
      throw new Error(`读取元数据失败: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  /**
   * 清理临时文件
   */
  cleanup(tempZipPath: string): void {
    if (tempZipPath && fs.existsSync(tempZipPath)) {
      const tempDir = path.dirname(tempZipPath);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  /**
   * 完整的下载和解压流程
   */
  async downloadAndExtract(destDir: string): Promise<{ meta: SkillMeta; source: 'download' }> {
    let tempZipPath: string | undefined;

    try {
      // 1. 下载
      tempZipPath = await this.download();

      // 2. 读取元数据
      const meta = await this.readMeta(tempZipPath);

      // 3. 解压
      await this.extract(tempZipPath, destDir);

      // 4. 清理临时文件
      this.cleanup(tempZipPath);

      return { meta, source: 'download' };
    } catch (error) {
      // 清理临时文件
      if (tempZipPath) {
        this.cleanup(tempZipPath);
      }
      throw error;
    }
  }
}