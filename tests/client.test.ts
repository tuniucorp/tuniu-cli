import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseSseOrJson, maskApiKey, buildCurlDebug, HttpTransport } from '../src/mcp/transport.js';
import { McpClient } from '../src/mcp/client.js';
import { McpClientManager } from '../src/mcp/manager.js';
import { ConfigManager } from '../src/config/index.js';
import { ServerError } from '../src/errors/index.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('parseSseOrJson', () => {
  it('parses plain JSON', () => {
    const result = parseSseOrJson('{"jsonrpc":"2.0","id":1,"result":{"tools":[]}}');
    expect(result.jsonrpc).toBe('2.0');
  });

  it('parses SSE format', () => {
    const sse = 'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"tools":[]}}';
    const result = parseSseOrJson(sse);
    expect(result.jsonrpc).toBe('2.0');
  });

  it('returns empty for empty string', () => {
    expect(parseSseOrJson('')).toEqual({});
  });

  it('throws on invalid format', () => {
    expect(() => parseSseOrJson('not json or sse')).toThrow();
  });
});

describe('maskApiKey', () => {
  it('masks long keys', () => {
    expect(maskApiKey('sk-abcdef1234567890')).toBe('sk-a...90');
  });

  it('returns *** for short keys', () => {
    expect(maskApiKey('short')).toBe('***');
    expect(maskApiKey('')).toBe('***');
  });
});

describe('buildCurlDebug', () => {
  it('builds curl command', () => {
    const result = buildCurlDebug(
      'https://api.test.com',
      'POST',
      { 'Content-Type': 'application/json', apiKey: 'secret12345678' },
      '{"test":true}',
    );
    expect(result).toContain('curl -X POST');
    expect(result).toContain('https://api.test.com');
    expect(result).not.toContain('secret12345678');
  });
});

describe('HttpTransport', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends JSON-RPC request', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      url: 'https://api.test.com',
      text: () =>
        Promise.resolve(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { tools: [{ name: 'test_tool', description: 'A test' }] },
          }),
        ),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse as unknown as Response,
    );

    const transport = new HttpTransport('https://api.test.com');
    const result = await transport.sendRequest('tools/list', undefined, 'test');
    expect(result).toBeDefined();
  });

  it('handles JSON-RPC error', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      url: 'https://api.test.com',
      text: () =>
        Promise.resolve(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            error: { code: -32600, message: 'Invalid Request' },
          }),
        ),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse as unknown as Response,
    );

    const transport = new HttpTransport('https://api.test.com');
    await expect(
      transport.sendRequest('tools/list', undefined, 'test'),
    ).rejects.toThrow(ServerError);
  });

  it('handles 401 error', async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      url: 'https://api.test.com',
      text: () => Promise.resolve('Unauthorized'),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse as unknown as Response,
    );

    const transport = new HttpTransport('https://api.test.com');
    await expect(
      transport.sendRequest('tools/list', undefined, 'test'),
    ).rejects.toThrow('认证失败');
  });

  it('lists tools', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      url: 'https://api.test.com',
      text: () =>
        Promise.resolve(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { tools: [{ name: 'tool1' }, { name: 'tool2' }] },
          }),
        ),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse as unknown as Response,
    );

    const transport = new HttpTransport('https://api.test.com');
    const tools = await transport.listTools('test');
    expect(tools).toHaveLength(2);
    expect(tools[0].name).toBe('tool1');
  });

  it('performs health check', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      url: 'https://api.test.com',
      text: () =>
        Promise.resolve(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { tools: [] },
          }),
        ),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse as unknown as Response,
    );

    const transport = new HttpTransport('https://api.test.com');
    const result = await transport.healthCheck('test');
    expect(result.status).toBe('healthy');
    expect(result.latency_ms).toBeDefined();
  });
});

describe('McpClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const config = {
    url: 'https://api.test.com',
    description: 'Test',
    headers: {},
    timeout: 30,
  };

  function mockFetch(tools: Record<string, unknown>[]) {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      url: 'https://api.test.com',
      text: () =>
        Promise.resolve(
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { tools },
          }),
        ),
    } as unknown as Response);
  }

  it('lists tools with caching', async () => {
    mockFetch([{ name: 'tool1' }]);
    const client = new McpClient('test', config);
    const tools1 = await client.listTools();
    const tools2 = await client.listTools();
    expect(tools1).toEqual(tools2);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('refreshes tools', async () => {
    mockFetch([{ name: 'tool1' }]);
    const client = new McpClient('test', config);
    await client.listTools();
    await client.listTools(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('gets specific tool', async () => {
    mockFetch([{ name: 'tool1' }, { name: 'tool2' }]);
    const client = new McpClient('test', config);
    const tool = await client.getTool('tool1');
    expect(tool?.name).toBe('tool1');
  });

  it('returns undefined for missing tool', async () => {
    mockFetch([{ name: 'tool1' }]);
    const client = new McpClient('test', config);
    const tool = await client.getTool('nonexistent');
    expect(tool).toBeUndefined();
  });
});

describe('McpClientManager', () => {
  let tmpDir: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tuniu-mgr-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeTestConfig(filePath: string): ConfigManager {
    const config = {
      defaultProfile: 'production',
      profiles: {
        production: {
          servers: {
            ticket: {
              url: 'https://api.test.com/ticket',
              description: '门票',
              headers: { apiKey: 'test-key' },
            },
            hotel: {
              url: 'https://api.test.com/hotel',
              description: '酒店',
              headers: { apiKey: 'test-key' },
            },
          },
          timeout: 30,
        },
      },
    };
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
    return new ConfigManager(filePath);
  }

  it('lists servers', () => {
    const configPath = path.join(tmpDir, 'config.json');
    const cm = writeTestConfig(configPath);
    const manager = new McpClientManager(cm);
    expect(manager.listServers()).toContain('ticket');
    expect(manager.listServers()).toContain('hotel');
  });

  it('creates and caches clients', () => {
    const configPath = path.join(tmpDir, 'config.json');
    const cm = writeTestConfig(configPath);
    const manager = new McpClientManager(cm);
    const client1 = manager.getClient('ticket');
    const client2 = manager.getClient('ticket');
    expect(client1).toBe(client2);
  });
});
