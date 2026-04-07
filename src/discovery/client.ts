/**
 * Discovery API 客户端
 */

import type {
  DiscoveryConfig,
  DiscoveryInnerResponse,
  DiscoveryApiResponse,
  ServiceInfo,
} from './types.js';
import { DiscoveryCache, type DiscoveryCacheOptions } from './cache.js';

export interface DiscoveryLogger {
  warn(message: string, meta?: unknown): void;
}

const defaultLogger: DiscoveryLogger = {
  warn(message: string, meta?: unknown) {
    if (meta === undefined) {
      console.warn(message);
      return;
    }
    console.warn(message, meta);
  },
};

export interface DiscoveryClientOptions {
  cache?: DiscoveryCache;
  cacheOptions?: DiscoveryCacheOptions;
  logger?: DiscoveryLogger;
}

/**
 * Discovery API 客户端
 * 负责从 Discovery API 获取服务列表，并管理本地缓存
 */
export class DiscoveryClient {
  private config: DiscoveryConfig;
  private cache: DiscoveryCache;
  private timeout: number;
  private logger: DiscoveryLogger;

  constructor(config: DiscoveryConfig, options: DiscoveryClientOptions = {}) {
    this.config = config;
    this.cache = options.cache ?? new DiscoveryCache(options.cacheOptions);
    this.timeout = config.timeout ?? 10000;
    this.logger = options.logger ?? defaultLogger;
  }

  /**
   * 获取服务列表
   * @param forceRefresh 是否强制刷新缓存
   */
  async getServices(forceRefresh = false): Promise<ServiceInfo[]> {
    // 1. 非强制刷新时，优先使用有效缓存
    if (!forceRefresh) {
      const cached = await this.cache.get();
      if (cached) return cached;
    }

    // 2. 尝试请求 Discovery API
    try {
      const services = await this.fetchServices();
      await this.cache.set(services, this.config.refreshInterval);
      return services;
    } catch (error) {
      // 3. API 失败时，尝试使用缓存（忽略过期时间）
      const cached = await this.cache.getIgnoreExpiry();
      if (cached) {
        this.logger.warn('Discovery API 请求失败，使用缓存数据降级', error);
        return cached;
      }

      // 4. 无缓存，抛出异常让上层处理（使用静态配置）
      throw error;
    }
  }

  /**
   * 从 Discovery API 获取服务列表
   */
  private async fetchServices(): Promise<ServiceInfo[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      let url: URL;
      try {
        url = new URL(this.config.url);
      } catch (e) {
        throw new Error(
          `Discovery 配置的 url 非法: ${String(this.config.url)}`,
          { cause: e },
        );
      }
      url.searchParams.set('status', 'health');

      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} [${url.toString()}]`);
      }

      const outer: DiscoveryApiResponse = await response.json();
      // 实际响应为双层包装：外层 { success, data: { code, data: { services } } }
      const inner: DiscoveryInnerResponse = outer.data;

      if (inner.code !== 0) {
        throw new Error(
          `Discovery API 返回错误: code=${inner.code}, message=${inner.message}`,
        );
      }

      return inner.data.services;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 强制刷新缓存
   */
  async refresh(): Promise<ServiceInfo[]> {
    return this.getServices(true);
  }

  /**
   * 清除缓存
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * 获取缓存状态
   */
  async getCacheStatus() {
    return await this.cache.getStatus();
  }

  /**
   * 获取配置信息
   */
  getConfig(): DiscoveryConfig {
    return { ...this.config };
  }
}