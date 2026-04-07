import type { ServerConfig } from '../config/index.js';
import { ServerError, ToolNotFoundError } from '../errors/index.js';
import { HttpTransport } from './transport.js';

export class McpClient {
  readonly serverName: string;
  readonly config: ServerConfig;
  readonly verbose: boolean;
  private _transport: HttpTransport | undefined;
  private _tools: Record<string, unknown>[] | undefined;

  constructor(serverName: string, config: ServerConfig, verbose = false) {
    this.serverName = serverName;
    this.config = config;
    this.verbose = verbose;
  }

  get transport(): HttpTransport {
    if (!this._transport) {
      this._transport = new HttpTransport(
        this.config.url,
        this.config.headers,
        this.config.timeout ?? 30,
        this.verbose,
      );
    }
    return this._transport;
  }

  close(): void {
    this._transport = undefined;
    this._tools = undefined;
  }

  async listTools(refresh = false): Promise<Record<string, unknown>[]> {
    if (!this._tools || refresh) {
      this._tools = await this.transport.listTools(this.serverName);
    }
    return this._tools;
  }

  async getTool(name: string): Promise<Record<string, unknown> | undefined> {
    const tools = await this.listTools();
    return tools.find((t) => t.name === name);
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const tool = await this.getTool(name);
      if (tool) {
        return await this.transport.callTool(name, args, this.serverName);
      }
      const available = (await this.listTools()).map(
        (t) => t.name as string,
      );
      throw new ToolNotFoundError(name, {
        server: this.serverName,
        availableTools: available,
      });
    } catch (e) {
      if (
        e instanceof ServerError &&
        (e.details as Record<string, unknown>).status_code === 404
      ) {
        return await this.transport.callTool(name, args, this.serverName);
      }
      throw e;
    }
  }

  async healthCheck(): Promise<Record<string, unknown>> {
    const result = await this.transport.healthCheck(this.serverName);
    result.server = this.serverName;
    return result;
  }
}
