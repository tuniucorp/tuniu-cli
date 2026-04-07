/**
 * Discovery 模块单元测试
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DiscoveryCache } from '../src/discovery/cache.js';
import { DiscoveryClient } from '../src/discovery/client.js';
import type { ServiceInfo, CacheData, DiscoveryConfig } from '../src/discovery/types.js';

// Mock 数据
const mockServices: ServiceInfo[] = [
  {
    name: 'ticket',
    url: 'https://openapi.tuniu.cn/mcp/ticket',
    description: '门票服务',
    status: 'health',
    tags: ['travel', 'booking'],
  },
  {
    name: 'hotel',
    url: 'https://openapi.tuniu.cn/mcp/hotel',
    description: '酒店服务',
    status: 'health',
    tags: ['travel', 'booking'],
  },
  {
    name: 'car',
    url: 'https://openapi.tuniu.cn/mcp/car',
    description: '租车服务（维护中）',
    status: 'offline',
    tags: ['travel'],
  },
];

const mockDiscoveryResponse = {
  success: true,
  errorCode: 710000,
  msg: 'OK',
  data: {
    code: 0,
    message: 'success',
    data: {
      services: mockServices,
    },
    timestamp: Date.now(),
  },
};

describe('DiscoveryCache', () => {
  let cache: DiscoveryCache;
  let testCacheDir: string;
  let testCacheFile: string;

  beforeEach(() => {
    testCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tuniu-cli-discovery-cache-'));
    testCacheFile = path.join(testCacheDir, 'discovery.json');
    cache = new DiscoveryCache({ cacheDir: testCacheDir });
    // 清理测试缓存
    if (fs.existsSync(testCacheFile)) {
      fs.unlinkSync(testCacheFile);
    }
  });

  afterEach(() => {
    // 清理测试缓存
    if (fs.existsSync(testCacheFile)) {
      fs.unlinkSync(testCacheFile);
    }
    if (fs.existsSync(testCacheDir)) {
      fs.rmSync(testCacheDir, { recursive: true, force: true });
    }
  });

  describe('get', () => {
    it('应返回 null 当缓存不存在时', async () => {
      expect(await cache.get()).toBeNull();
    });

    it('应返回缓存数据当缓存有效时', async () => {
      const ttlSeconds = 3600;
      await cache.set(mockServices, ttlSeconds);

      const result = await cache.get();
      expect(result).not.toBeNull();
      expect(result?.length).toBe(3);
      expect(result?.[0].name).toBe('ticket');
    });

    it('应返回 null 当缓存过期时', async () => {
      // 创建已过期的缓存
      const expiredData: CacheData = {
        services: mockServices,
        fetchedAt: Date.now() - 7200000, // 2 小时前
        expiresAt: Date.now() - 3600000, // 1 小时前过期
      };

      if (!fs.existsSync(testCacheDir)) {
        fs.mkdirSync(testCacheDir, { recursive: true });
      }
      fs.writeFileSync(testCacheFile, JSON.stringify(expiredData));

      expect(await cache.get()).toBeNull();
    });
  });

  describe('getIgnoreExpiry', () => {
    it('应返回缓存数据即使已过期', async () => {
      // 创建已过期的缓存
      const expiredData: CacheData = {
        services: mockServices,
        fetchedAt: Date.now() - 7200000,
        expiresAt: Date.now() - 3600000,
      };

      if (!fs.existsSync(testCacheDir)) {
        fs.mkdirSync(testCacheDir, { recursive: true });
      }
      fs.writeFileSync(testCacheFile, JSON.stringify(expiredData));

      const result = await cache.getIgnoreExpiry();
      expect(result).not.toBeNull();
      expect(result?.length).toBe(3);
    });
  });

  describe('set', () => {
    it('应正确设置缓存', async () => {
      const ttlSeconds = 3600;
      await cache.set(mockServices, ttlSeconds);

      expect(fs.existsSync(testCacheFile)).toBe(true);

      const data: CacheData = JSON.parse(
        fs.readFileSync(testCacheFile, 'utf-8'),
      );

      expect(data.services.length).toBe(3);
      expect(data.fetchedAt).toBeLessThanOrEqual(Date.now());
      expect(data.expiresAt).toBe(data.fetchedAt + ttlSeconds * 1000);
    });

    it('应自动创建缓存目录', async () => {
      // 删除缓存目录
      if (fs.existsSync(testCacheDir)) {
        fs.rmSync(testCacheDir, { recursive: true });
      }

      const newCache = new DiscoveryCache({ cacheDir: testCacheDir });
      await newCache.set(mockServices, 3600);

      expect(fs.existsSync(testCacheDir)).toBe(true);
      expect(fs.existsSync(testCacheFile)).toBe(true);
    });
  });

  describe('clear', () => {
    it('应正确清除缓存', async () => {
      await cache.set(mockServices, 3600);
      expect(fs.existsSync(testCacheFile)).toBe(true);

      await cache.clear();
      expect(fs.existsSync(testCacheFile)).toBe(false);
    });

    it('清除不存在的缓存不应报错', async () => {
      await expect(cache.clear()).resolves.toBeUndefined();
    });
  });

  describe('getStatus', () => {
    it('应返回正确状态当缓存不存在时', async () => {
      const status = await cache.getStatus();
      expect(status.cached).toBe(false);
      expect(status.expired).toBe(false);
    });

    it('应返回正确状态当缓存有效时', async () => {
      await cache.set(mockServices, 3600);

      const status = await cache.getStatus();
      expect(status.cached).toBe(true);
      expect(status.expired).toBe(false);
      expect(status.count).toBe(3);
      expect(status.expiresAt).toBeGreaterThan(Date.now());
    });

    it('应返回正确状态当缓存过期时', async () => {
      const expiredData: CacheData = {
        services: mockServices,
        fetchedAt: Date.now() - 7200000,
        expiresAt: Date.now() - 3600000,
      };

      if (!fs.existsSync(testCacheDir)) {
        fs.mkdirSync(testCacheDir, { recursive: true });
      }
      fs.writeFileSync(testCacheFile, JSON.stringify(expiredData));

      const status = await cache.getStatus();
      expect(status.cached).toBe(true);
      expect(status.expired).toBe(true);
    });
  });
});

describe('DiscoveryClient', () => {
  const mockConfig: DiscoveryConfig = {
    enabled: true,
    url: 'https://openapi.tuniu.cn/tour/mcp/discovery',
    refreshInterval: 3600,
    timeout: 5000,
  };
  let testCacheDir: string;

  beforeEach(() => {
    testCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tuniu-cli-discovery-client-'));
  });
  afterEach(() => {
    if (fs.existsSync(testCacheDir)) {
      fs.rmSync(testCacheDir, { recursive: true, force: true });
    }
  });

  describe('getServices', () => {
    it('应使用缓存当缓存有效时', async () => {
      const cache = new DiscoveryCache({ cacheDir: testCacheDir });
      const client = new DiscoveryClient(mockConfig, { cache });

      // 先设置缓存
      await cache.set(mockServices, 3600);

      // 不应该发起新请求
      const services = await client.getServices();
      expect(services.length).toBe(3);
    });

    it('应从 API 获取数据当强制刷新时', async () => {
      // Mock fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDiscoveryResponse),
      });
      global.fetch = mockFetch;

      const client = new DiscoveryClient(mockConfig, {
        cache: new DiscoveryCache({ cacheDir: testCacheDir }),
      });
      const services = await client.getServices(true);

      expect(mockFetch).toHaveBeenCalled();
      expect(services.length).toBe(3);
    });

    it('应使用过期缓存当 API 请求失败时', async () => {
      // 设置过期缓存
      const cache = new DiscoveryCache({ cacheDir: testCacheDir });
      const expiredData: CacheData = {
        services: mockServices,
        fetchedAt: Date.now() - 7200000,
        expiresAt: Date.now() - 3600000,
      };
      const cacheFile = path.join(testCacheDir, 'discovery.json');
      const cacheDir = path.dirname(cacheFile);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(cacheFile, JSON.stringify(expiredData));

      // Mock fetch 失败
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const client = new DiscoveryClient(mockConfig, { cache });
      const services = await client.getServices(true);

      expect(services.length).toBe(3);
    });

    it('应抛出错误当 API 失败且无缓存时', async () => {
      // Mock fetch 失败
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const client = new DiscoveryClient(mockConfig, {
        cache: new DiscoveryCache({ cacheDir: testCacheDir }),
      });

      await expect(client.getServices(true)).rejects.toThrow('Network error');
    });
  });

  describe('refresh', () => {
    it('应强制刷新缓存', async () => {
      // Mock fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDiscoveryResponse),
      });
      global.fetch = mockFetch;

      const cache = new DiscoveryCache({ cacheDir: testCacheDir });
      const client = new DiscoveryClient(mockConfig, { cache });

      // 设置旧缓存
      await cache.set([{ ...mockServices[0] }], 3600);

      await client.refresh();

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('应清除缓存', () => {
      const cache = new DiscoveryCache({ cacheDir: testCacheDir });
      const client = new DiscoveryClient(mockConfig, { cache });

      return (async () => {
        await cache.set(mockServices, 3600);

        await client.clearCache();

        expect(await cache.get()).toBeNull();
      })();
    });
  });
});