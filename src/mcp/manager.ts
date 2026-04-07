import type { ConfigManager } from '../config/index.js';
import { McpClient } from './client.js';

export class McpClientManager {
  readonly configManager: ConfigManager;
  readonly verbose: boolean;
  private _clients: Map<string, McpClient> = new Map();

  constructor(configManager: ConfigManager, verbose = false) {
    this.configManager = configManager;
    this.verbose = verbose;
  }

  getClient(serverName: string): McpClient {
    let client = this._clients.get(serverName);
    if (!client) {
      const serverConfig = this.configManager.getServerConfig(serverName);
      client = new McpClient(serverName, serverConfig, this.verbose);
      this._clients.set(serverName, client);
    }
    return client;
  }

  listServers(): string[] {
    return this.configManager.listServers();
  }

  async healthCheck(
    serverName?: string,
    parallel = false,
  ): Promise<Record<string, Record<string, unknown>>> {
    if (serverName) {
      const client = this.getClient(serverName);
      return { [serverName]: await client.healthCheck() };
    }

    const servers = this.listServers();
    const results: Record<string, Record<string, unknown>> = {};

    if (parallel) {
      const entries = await Promise.allSettled(
        servers.map(async (name) => ({
          name,
          result: await this.checkServer(name),
        })),
      );
      for (const entry of entries) {
        if (entry.status === 'fulfilled') {
          results[entry.value.name] = entry.value.result;
        } else {
          const name = servers[entries.indexOf(entry)];
          results[name] = {
            server: name,
            status: 'unhealthy',
            error: String(entry.reason),
          };
        }
      }
    } else {
      for (const name of servers) {
        results[name] = await this.checkServer(name);
      }
    }

    return results;
  }

  private async checkServer(
    name: string,
  ): Promise<Record<string, unknown>> {
    try {
      const client = this.getClient(name);
      return await client.healthCheck();
    } catch (e) {
      return { server: name, status: 'unhealthy', error: String(e) };
    }
  }

  async listTools(
    serverName: string,
  ): Promise<Record<string, unknown>[]> {
    const client = this.getClient(serverName);
    return client.listTools();
  }

  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const client = this.getClient(serverName);
    const result = await client.callTool(toolName, args);
    return { success: true, result };
  }

  async getAllTools(): Promise<
    Record<string, Record<string, unknown>[]>
  > {
    const result: Record<string, Record<string, unknown>[]> = {};
    for (const serverName of this.listServers()) {
      try {
        result[serverName] = await this.listTools(serverName);
      } catch {
        result[serverName] = [];
      }
    }
    return result;
  }

  closeAll(): void {
    for (const client of this._clients.values()) {
      client.close();
    }
    this._clients.clear();
  }
}
