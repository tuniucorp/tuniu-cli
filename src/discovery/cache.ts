/**
 * Discovery 缓存管理
 */

import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { CacheData, CacheStatus, ServiceInfo } from './types.js';

export interface DiscoveryCacheOptions {
  /**
   * 缓存目录（默认: ~/.tuniu-mcp/cache）
   * 用于测试或自定义存储位置
   */
  cacheDir?: string;
  /**
   * 缓存文件路径（默认: <cacheDir>/discovery.json）
   * 优先级高于 cacheDir
   */
  cacheFile?: string;
}

/**
 * Discovery 缓存管理器
 * 缓存存储在用户本地: ~/.tuniu-mcp/cache/discovery.json
 */
export class DiscoveryCache {
  private cacheDir: string;
  private cacheFile: string;

  constructor(options: DiscoveryCacheOptions = {}) {
    this.cacheDir =
      options.cacheDir ?? path.join(os.homedir(), '.tuniu-mcp', 'cache');
    this.cacheFile = options.cacheFile ?? path.join(this.cacheDir, 'discovery.json');
  }

  /**
   * 获取缓存（检查过期）
   */
  async get(): Promise<ServiceInfo[] | null> {
    try {
      const raw = await fsp.readFile(this.cacheFile, 'utf-8');
      const data: CacheData = JSON.parse(raw);

      // 检查是否过期
      if (Date.now() > data.expiresAt) {
        return null;
      }

      return data.services;
    } catch {
      return null;
    }
  }

  /**
   * 获取缓存（忽略过期时间，用于降级）
   */
  async getIgnoreExpiry(): Promise<ServiceInfo[] | null> {
    try {
      const raw = await fsp.readFile(this.cacheFile, 'utf-8');
      const data: CacheData = JSON.parse(raw);
      return data.services;
    } catch {
      return null;
    }
  }

  /**
   * 设置缓存
   */
  async set(services: ServiceInfo[], ttlSeconds: number): Promise<void> {
    const now = Date.now();
    const data: CacheData = {
      services,
      fetchedAt: now,
      expiresAt: now + ttlSeconds * 1000,
    };

    // 确保目录存在
    await fsp.mkdir(this.cacheDir, { recursive: true });

    await fsp.writeFile(
      this.cacheFile,
      JSON.stringify(data, null, 2),
      'utf-8',
    );
  }

  /**
   * 清除缓存
   */
  async clear(): Promise<void> {
    try {
      await fsp.unlink(this.cacheFile);
    } catch {
      // ignore
    }
  }

  /**
   * 获取缓存状态
   */
  async getStatus(): Promise<CacheStatus> {
    try {
      const raw = await fsp.readFile(this.cacheFile, 'utf-8');
      const data: CacheData = JSON.parse(raw);
      const expired = Date.now() > data.expiresAt;

      return {
        cached: true,
        expired,
        expiresAt: data.expiresAt,
        count: data.services.length,
      };
    } catch {
      return { cached: false, expired: false };
    }
  }

  /**
   * 暴露缓存文件路径（主要用于测试/诊断）
   */
  getCacheFilePath(): string {
    return this.cacheFile;
  }
}