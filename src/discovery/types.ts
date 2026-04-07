/**
 * Discovery 模块类型定义
 */

/**
 * Discovery 配置
 */
export interface DiscoveryConfig {
  /** 是否启用动态发现 */
  enabled: boolean;
  /** Discovery API 地址 */
  url: string;
  /** 缓存刷新间隔（秒），默认 86400 (24小时) */
  refreshInterval: number;
  /** 请求超时时间（毫秒），默认 10000 */
  timeout?: number;
}

/**
 * 服务状态
 */
export type ServiceStatus = 'health' | 'offline';

/**
 * 服务信息
 */
export interface ServiceInfo {
  /** 服务唯一标识 */
  name: string;
  /** 服务的完整 MCP 端点 URL */
  url: string;
  /** 服务描述 */
  description?: string;
  /** 服务状态 */
  status: ServiceStatus;
  /** 服务标签 */
  tags?: string[];
}

export interface TuniuApiResponse<T> {
  success: boolean;
  errorCode: number;
  msg: string;
  data: T;
}

/**
 * Discovery API 内层响应
 */
export interface DiscoveryInnerResponse {
  code: number;
  message: string;
  data: {
    services: ServiceInfo[];
  };
  timestamp: number;
}

/**
 * Discovery API 完整响应（外层包装 + 内层业务数据）
 */
export type DiscoveryApiResponse = TuniuApiResponse<DiscoveryInnerResponse>;

/**
 * 缓存数据结构
 */
export interface CacheData {
  services: ServiceInfo[];
  fetchedAt: number;
  expiresAt: number;
}

/**
 * 缓存状态
 */
export interface CacheStatus {
  /** 是否有缓存 */
  cached: boolean;
  /** 缓存是否过期 */
  expired: boolean;
  /** 过期时间戳 */
  expiresAt?: number;
  /** 服务数量 */
  count?: number;
}