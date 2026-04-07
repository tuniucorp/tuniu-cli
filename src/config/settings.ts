import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import { ApiKeyRequiredError, ConfigError } from '../errors/index.js';
import type { DiscoveryConfig, ServiceInfo } from '../discovery/types.js';
import { DiscoveryClient } from '../discovery/client.js';

let hasWarnedInvalidDiscoveryEnabledEnv = false;

export const ServerConfigSchema = z.object({
  url: z.string(),
  description: z.string().default(''),
  headers: z.record(z.string(), z.string()).default({}),
  timeout: z.number().optional(),
});

export const DiscoveryConfigSchema = z.object({
  enabled: z.boolean().default(true),
  url: z.string(),
  refreshInterval: z.number().default(86400),
  timeout: z.number().optional(),
});

export const ProfileConfigSchema = z.object({
  servers: z.record(z.string(), ServerConfigSchema).default({}),
  timeout: z.number().default(30),
  discovery: DiscoveryConfigSchema.optional(),
});

export const AppConfigSchema = z.object({
  defaultProfile: z.string().default('production'),
  profiles: z.record(z.string(), ProfileConfigSchema).default({}),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type ProfileConfig = z.infer<typeof ProfileConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;

export const DEFAULT_CONFIG_PATH = path.join(
  os.homedir(),
  '.tuniu-mcp',
  'config.json',
);

const DEFAULT_CONFIG: AppConfig = {
  defaultProfile: 'production',
  profiles: {
    production: {
      servers: {
        ticket: {
          url: 'https://openapi.tuniu.cn/mcp/ticket',
          description: '门票服务',
          headers: { apiKey: '${TUNIU_API_KEY}' },
        },
        hotel: {
          url: 'https://openapi.tuniu.cn/mcp/hotel',
          description: '酒店服务',
          headers: { apiKey: '${TUNIU_API_KEY}' },
        },
        flight: {
          url: 'https://openapi.tuniu.cn/mcp/flight',
          description: '机票服务',
          headers: { apiKey: '${TUNIU_API_KEY}' },
        },
        train: {
          url: 'https://openapi.tuniu.cn/mcp/train',
          description: '火车票服务',
          headers: { apiKey: '${TUNIU_API_KEY}' },
        },
        cruise: {
          url: 'https://openapi.tuniu.cn/mcp/cruise',
          description: '邮轮服务',
          headers: { apiKey: '${TUNIU_API_KEY}' },
        },
        holiday: {
          url: 'https://openapi.tuniu.cn/mcp/holiday',
          description: '度假产品服务',
          headers: { apiKey: '${TUNIU_API_KEY}' },
        },
      },
      discovery: {
        enabled: true,
        url: 'https://openapi.tuniu.cn/tour/mcp/discovery',
        refreshInterval: 86400,
      },
      timeout: 30,
    },
    development: {
      servers: {
        ticket: {
          url: 'https://openapi-p.tuniu.cn/mcp/ticket',
          description: '门票服务（开发环境）',
          headers: { apiKey: '${TUNIU_API_KEY}' },
        },
        hotel: {
          url: 'https://openapi-p.tuniu.cn/mcp/hotel',
          description: '酒店服务（开发环境）',
          headers: { apiKey: '${TUNIU_API_KEY}' },
        },
        flight: {
          url: 'https://openapi-p.tuniu.cn/mcp/flight',
          description: '机票服务（开发环境）',
          headers: { apiKey: '${TUNIU_API_KEY}' },
        },
        train: {
          url: 'https://openapi-p.tuniu.cn/mcp/train',
          description: '火车票服务（开发环境）',
          headers: { apiKey: '${TUNIU_API_KEY}' },
        },
        cruise: {
          url: 'https://openapi-p.tuniu.cn/mcp/cruise',
          description: '邮轮服务（开发环境）',
          headers: { apiKey: '${TUNIU_API_KEY}' },
        },
        holiday: {
          url: 'https://openapi-p.tuniu.cn/mcp/holiday',
          description: '度假产品服务（开发环境）',
          headers: { apiKey: '${TUNIU_API_KEY}' },
        },
      },
      discovery: {
        enabled: true,
        url: 'https://openapi-p.tuniu.cn/tour/mcp/discovery',
        refreshInterval: 300,
      },
      timeout: 60,
    },
  },
};

export function expandEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, varName: string) => {
    return process.env[varName] ?? '';
  });
}

export function expandConfigEnvVars(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      result[key] = expandEnvVars(value);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = expandConfigEnvVars(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export class ConfigManager {
  readonly configPath: string;
  private _profile: string | undefined;
  private _config: AppConfig | undefined;
  private _discoveryClient: DiscoveryClient | undefined;

  private isDebugEnabled(): boolean {
    return process.env.TUNIU_CLI_DEBUG === '1';
  }

  private logDiscoveryError(message: string, error: unknown): void {
    if (!this.isDebugEnabled()) return;
    const detail =
      error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(`[DEBUG][discovery] ${message}\n${detail}`);
  }

  constructor(configPath?: string, profile?: string) {
    this.configPath = configPath ?? DEFAULT_CONFIG_PATH;
    this._profile = profile;
  }

  loadConfig(): AppConfig {
    if (this._config) return this._config;

    if (!fs.existsSync(this.configPath)) {
      const expanded = expandConfigEnvVars(
        DEFAULT_CONFIG as unknown as Record<string, unknown>,
      );
      this._config = AppConfigSchema.parse(expanded);
      return this._config;
    }

    let rawText: string;
    try {
      rawText = fs.readFileSync(this.configPath, 'utf-8');
    } catch (e) {
      throw new ConfigError(`无法读取配置文件: ${e}`, {
        configPath: this.configPath,
      });
    }

    let rawConfig: unknown;
    try {
      rawConfig = JSON.parse(rawText);
    } catch (e) {
      throw new ConfigError(`配置文件格式错误: ${e}`, {
        configPath: this.configPath,
      });
    }

    const expanded = expandConfigEnvVars(
      rawConfig as Record<string, unknown>,
    );

    try {
      this._config = AppConfigSchema.parse(expanded);
    } catch (e) {
      throw new ConfigError(`配置文件内容无效: ${e}`, {
        configPath: this.configPath,
      });
    }

    return this._config;
  }

  get config(): AppConfig {
    return this.loadConfig();
  }

  get currentProfile(): string {
    return this._profile ?? this.config.defaultProfile;
  }

  set profile(value: string | undefined) {
    this._profile = value;
  }

  get profileConfig(): ProfileConfig {
    const profileName = this.currentProfile;
    const profile = this.config.profiles[profileName];
    if (!profile) {
      throw new ConfigError(`配置文件中不存在 profile '${profileName}'`, {
        configPath: this.configPath,
      });
    }
    return profile;
  }

  /**
   * 获取 Discovery 配置
   */
  getDiscoveryConfig(): DiscoveryConfig | undefined {
    return this.profileConfig.discovery;
  }

  /**
   * 检查 Discovery 是否启用
   */
  isDiscoveryEnabled(): boolean {
    const envVal = process.env.TUNIU_DISCOVERY_ENABLED;
    if (envVal !== undefined) {
      const normalized = envVal.trim().toLowerCase();
      if (['0', 'false', 'off', 'no'].includes(normalized)) {
        return false;
      }
      if (['1', 'true', 'on', 'yes'].includes(normalized)) {
        return true;
      }

      if (!hasWarnedInvalidDiscoveryEnabledEnv) {
        hasWarnedInvalidDiscoveryEnabledEnv = true;
        console.warn(
          `[WARN][discovery] 无效的环境变量 TUNIU_DISCOVERY_ENABLED=${JSON.stringify(envVal)}，将回退使用配置文件中的 discovery.enabled`,
        );
      }
    }
    return this.profileConfig.discovery?.enabled ?? false;
  }

  /**
   * 获取 Discovery 客户端（懒加载）
   */
  getDiscoveryClient(): DiscoveryClient | undefined {
    const config = this.getDiscoveryConfig();
    if (!config || !this.isDiscoveryEnabled()) {
      return undefined;
    }

    if (!this._discoveryClient) {
      this._discoveryClient = new DiscoveryClient(config);
    }
    return this._discoveryClient;
  }

  /**
   * 获取服务配置（优先 Discovery，fallback 到静态配置）
   */
  async getServerConfigAsync(serverName: string): Promise<ServerConfig> {
    // 1. 尝试从 Discovery 获取
    if (this.isDiscoveryEnabled()) {
      try {
        const client = this.getDiscoveryClient();
        if (client) {
          const services = await client.getServices();
          const service = services.find((s) => s.name === serverName);
          if (service && service.status === 'health') {
            return {
              url: service.url,
              description: service.description ?? '',
              headers: { apiKey: '${TUNIU_API_KEY}' },
            };
          }
        }
      } catch (e) {
        // Discovery 失败，继续使用静态配置
        this.logDiscoveryError(
          `getServerConfigAsync(${serverName}) 失败，回退静态配置`,
          e,
        );
      }
    }

    // 2. Fallback 到静态配置
    return this.getServerConfig(serverName);
  }

  /**
   * 获取所有服务名称（合并 Discovery 和静态配置）
   */
  async listServersAsync(): Promise<string[]> {
    const serverSet = new Set<string>();

    // 1. 从 Discovery 获取
    if (this.isDiscoveryEnabled()) {
      try {
        const client = this.getDiscoveryClient();
        if (client) {
          const services = await client.getServices();
          services.forEach((s) => serverSet.add(s.name));
        }
      } catch (e) {
        // Discovery 失败，继续使用静态配置
        this.logDiscoveryError('listServersAsync() 失败，回退静态配置', e);
      }
    }

    // 2. 合并静态配置
    Object.keys(this.profileConfig.servers).forEach((name) =>
      serverSet.add(name),
    );

    return Array.from(serverSet);
  }

  /**
   * 获取所有服务信息（仅 Discovery）
   */
  async getDiscoveryServices(): Promise<ServiceInfo[]> {
    if (!this.isDiscoveryEnabled()) {
      return [];
    }

    try {
      const client = this.getDiscoveryClient();
      if (client) {
        return await client.getServices();
      }
    } catch (e) {
      // ignore
      this.logDiscoveryError('getDiscoveryServices() 失败，返回空列表', e);
    }

    return [];
  }

  getServerConfig(serverName: string): ServerConfig {
    const servers = this.profileConfig.servers;
    const config = servers[serverName];
    if (!config) {
      throw new ConfigError(`服务 '${serverName}' 不存在于当前 profile`, {
        details: { available_servers: Object.keys(servers) },
      });
    }
    return config;
  }

  listServers(): string[] {
    return Object.keys(this.profileConfig.servers);
  }

  initConfig(force = false): string {
    if (!force && fs.existsSync(this.configPath)) {
      throw new ConfigError('配置文件已存在', {
        configPath: this.configPath,
      });
    }

    const dir = path.dirname(this.configPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      this.configPath,
      JSON.stringify(DEFAULT_CONFIG, null, 2),
      'utf-8',
    );

    return this.configPath;
  }

  toDict(): Record<string, unknown> {
    return {
      config_path: this.configPath,
      current_profile: this.currentProfile,
      servers: this.listServers(),
    };
  }

  ensureApiKey(serverNames?: string[]): void {
    const serversToCheck = serverNames ?? this.listServers();
    const affectedServers: string[] = [];

    for (const name of serversToCheck) {
      let serverConfig: ServerConfig;
      try {
        serverConfig = this.getServerConfig(name);
      } catch {
        continue;
      }

      const apiKeyVal = serverConfig.headers['apiKey'];
      if (apiKeyVal !== undefined) {
        const expanded = expandEnvVars(apiKeyVal);
        if (!expanded.trim()) {
          affectedServers.push(name);
          continue;
        }
      }

      const authHeader = serverConfig.headers['Authorization'] ?? '';
      if (!authHeader) continue;

      const expanded = expandEnvVars(authHeader);
      if (!expanded.trim().toLowerCase().startsWith('bearer')) continue;

      const token = expanded.slice(6).trim();
      if (!token) {
        affectedServers.push(name);
      }
    }

    if (affectedServers.length > 0) {
      throw new ApiKeyRequiredError(
        '未配置 API Key，无法访问 MCP 服务。请先设置 TUNIU_API_KEY 环境变量。',
        {
          hint: '获取 API Key 后执行: export TUNIU_API_KEY=your_api_key',
          profile: this.currentProfile,
          affected_servers: affectedServers,
        },
      );
    }
  }
}
