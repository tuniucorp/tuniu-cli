import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ConfigManager,
  expandEnvVars,
} from '../src/config/index.js';
import { ApiKeyRequiredError, ConfigError } from '../src/errors/index.js';

describe('expandEnvVars', () => {
  it('expands simple var', () => {
    process.env.TEST_VAR_XYZ = 'test_value';
    expect(expandEnvVars('prefix_${TEST_VAR_XYZ}_suffix')).toBe(
      'prefix_test_value_suffix',
    );
    delete process.env.TEST_VAR_XYZ;
  });

  it('returns empty for nonexistent var', () => {
    expect(expandEnvVars('${NON_EXISTENT_VAR_12345}')).toBe('');
  });

  it('returns unchanged when no vars', () => {
    expect(expandEnvVars('no vars here')).toBe('no vars here');
  });

  it('expands multiple vars', () => {
    process.env.EVAR1 = 'value1';
    process.env.EVAR2 = 'value2';
    expect(expandEnvVars('${EVAR1}_and_${EVAR2}')).toBe('value1_and_value2');
    delete process.env.EVAR1;
    delete process.env.EVAR2;
  });
});

describe('ConfigManager', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tuniu-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeSampleConfig(filePath: string): void {
    const config = {
      defaultProfile: 'production',
      profiles: {
        production: {
          servers: {
            ticket: {
              url: 'https://mcp.test.com/ticket',
              description: '门票服务',
              headers: { Authorization: 'Bearer test-key' },
            },
            hotel: {
              url: 'https://mcp.test.com/hotel',
              description: '酒店服务',
              headers: {},
            },
          },
          timeout: 30,
        },
        development: {
          servers: {
            ticket: {
              url: 'http://localhost:8080/ticket',
              description: '门票服务（开发）',
              headers: {},
            },
          },
          timeout: 60,
        },
      },
    };
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
  }

  it('loads default config when file missing', () => {
    const manager = new ConfigManager(path.join(tmpDir, 'nonexistent.json'));
    const config = manager.loadConfig();
    expect(config.defaultProfile).toBe('production');
  });

  it('default embedded config includes holiday MCP server (production)', () => {
    const manager = new ConfigManager(path.join(tmpDir, 'missing-default.json'));
    expect(manager.listServers()).toContain('holiday');
    const holiday = manager.getServerConfig('holiday');
    expect(holiday.url).toBe('https://openapi.tuniu.cn/mcp/holiday');
    expect(holiday.description).toBe('度假产品服务');
    // 配置加载后会展开 ${TUNIU_API_KEY}，未设置环境变量时为空字符串
    expect(Object.hasOwn(holiday.headers, 'apiKey')).toBe(true);
  });

  it('default embedded config includes holiday MCP server (development)', () => {
    const manager = new ConfigManager(
      path.join(tmpDir, 'missing-default-dev.json'),
      'development',
    );
    expect(manager.listServers()).toContain('holiday');
    const holiday = manager.getServerConfig('holiday');
    expect(holiday.url).toBe('https://openapi-p.tuniu.cn/mcp/holiday');
    expect(holiday.description).toBe('度假产品服务（开发环境）');
  });

  it('loads from file', () => {
    const filePath = path.join(tmpDir, 'config.json');
    writeSampleConfig(filePath);
    const manager = new ConfigManager(filePath);
    const config = manager.loadConfig();
    expect(config.defaultProfile).toBe('production');
  });

  it('selects profile', () => {
    const filePath = path.join(tmpDir, 'config.json');
    writeSampleConfig(filePath);
    const manager = new ConfigManager(filePath, 'development');
    expect(manager.currentProfile).toBe('development');
    expect(manager.profileConfig.timeout).toBe(60);
  });

  it('throws on invalid profile', () => {
    const filePath = path.join(tmpDir, 'config.json');
    writeSampleConfig(filePath);
    const manager = new ConfigManager(filePath, 'invalid');
    expect(() => manager.profileConfig).toThrow(ConfigError);
  });

  it('gets server config', () => {
    const filePath = path.join(tmpDir, 'config.json');
    writeSampleConfig(filePath);
    const manager = new ConfigManager(filePath);
    const sc = manager.getServerConfig('ticket');
    expect(sc.url).toBe('https://mcp.test.com/ticket');
    expect(sc.description).toBe('门票服务');
  });

  it('throws on invalid server', () => {
    const filePath = path.join(tmpDir, 'config.json');
    writeSampleConfig(filePath);
    const manager = new ConfigManager(filePath);
    expect(() => manager.getServerConfig('invalid')).toThrow(ConfigError);
  });

  it('lists servers', () => {
    const filePath = path.join(tmpDir, 'config.json');
    writeSampleConfig(filePath);
    const manager = new ConfigManager(filePath);
    const servers = manager.listServers();
    expect(servers).toContain('ticket');
    expect(servers).toContain('hotel');
  });

  it('inits config file', () => {
    const filePath = path.join(tmpDir, 'subdir', 'config.json');
    const manager = new ConfigManager(filePath);
    const resultPath = manager.initConfig();
    expect(resultPath).toBe(filePath);
    expect(fs.existsSync(filePath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(data.defaultProfile).toBeDefined();
  });

  it('throws when init config already exists', () => {
    const filePath = path.join(tmpDir, 'config.json');
    writeSampleConfig(filePath);
    const manager = new ConfigManager(filePath);
    expect(() => manager.initConfig()).toThrow(ConfigError);
  });

  it('converts to dict', () => {
    const filePath = path.join(tmpDir, 'config.json');
    writeSampleConfig(filePath);
    const manager = new ConfigManager(filePath);
    const result = manager.toDict();
    expect(result.config_path).toBeDefined();
    expect(result.current_profile).toBeDefined();
    expect(result.servers).toBeDefined();
  });

  it('throws on invalid JSON file', () => {
    const filePath = path.join(tmpDir, 'invalid.json');
    fs.writeFileSync(filePath, 'not valid json', 'utf-8');
    const manager = new ConfigManager(filePath);
    expect(() => manager.loadConfig()).toThrow(ConfigError);
  });

  it('throws on invalid config structure', () => {
    const filePath = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(
      filePath,
      '{"defaultProfile":"production","profiles":"invalid"}',
      'utf-8',
    );
    const manager = new ConfigManager(filePath);
    expect(() => manager.loadConfig()).toThrow(ConfigError);
  });
});

describe('ensureApiKey', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tuniu-apikey-'));
    // 确保测试不受本机环境变量影响（例如开发机已设置 TUNIU_API_KEY）
    delete process.env.TUNIU_API_KEY;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.TUNIU_API_KEY;
  });

  function writeApiKeyConfig(filePath: string, headerKey = 'apiKey'): void {
    const headers: Record<string, string> =
      headerKey === 'apiKey'
        ? { apiKey: '${TUNIU_API_KEY}' }
        : { Authorization: 'Bearer ${TUNIU_API_KEY}' };

    const config = {
      defaultProfile: 'production',
      profiles: {
        production: {
          servers: {
            ticket: {
              url: 'https://openapi.tuniu.cn/mcp/ticket',
              description: '门票服务',
              headers,
            },
          },
          timeout: 30,
        },
      },
    };
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
  }

  it('raises when apiKey header empty', () => {
    const filePath = path.join(tmpDir, 'config.json');
    writeApiKeyConfig(filePath);
    const manager = new ConfigManager(filePath);
    expect(() => manager.ensureApiKey(['ticket'])).toThrow(
      ApiKeyRequiredError,
    );
  });

  it('passes when apiKey header set', () => {
    process.env.TUNIU_API_KEY = 'my-api-key';
    const filePath = path.join(tmpDir, 'config.json');
    writeApiKeyConfig(filePath);
    const manager = new ConfigManager(filePath);
    expect(() => manager.ensureApiKey(['ticket'])).not.toThrow();
  });

  it('raises when Bearer token empty', () => {
    const filePath = path.join(tmpDir, 'config.json');
    writeApiKeyConfig(filePath, 'Authorization');
    const manager = new ConfigManager(filePath);
    expect(() => manager.ensureApiKey(['ticket'])).toThrow(
      ApiKeyRequiredError,
    );
  });

  it('passes when Bearer token set', () => {
    process.env.TUNIU_API_KEY = 'test-key-123';
    const filePath = path.join(tmpDir, 'config.json');
    writeApiKeyConfig(filePath, 'Authorization');
    const manager = new ConfigManager(filePath);
    expect(() => manager.ensureApiKey(['ticket'])).not.toThrow();
  });
});
