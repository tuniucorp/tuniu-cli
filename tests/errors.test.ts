import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ExitCode,
  McpCliError,
  McpConnectionError,
  ToolNotFoundError,
  InvalidParamsError,
  AuthFailedError,
  McpTimeoutError,
  ServerError,
  ConfigError,
  ApiKeyRequiredError,
  handleError,
  formatSuccess,
} from '../src/errors/index.js';

describe('ExitCodes', () => {
  it('has correct values', () => {
    expect(ExitCode.SUCCESS).toBe(0);
    expect(ExitCode.CONNECTION_FAILED).toBe(101);
    expect(ExitCode.TOOL_NOT_FOUND).toBe(102);
    expect(ExitCode.INVALID_PARAMS).toBe(103);
    expect(ExitCode.AUTH_FAILED).toBe(104);
    expect(ExitCode.TIMEOUT).toBe(105);
    expect(ExitCode.SERVER_ERROR).toBe(106);
    expect(ExitCode.CONFIG_ERROR).toBe(107);
    expect(ExitCode.API_KEY_REQUIRED).toBe(108);
    expect(ExitCode.UNKNOWN_ERROR).toBe(199);
  });
});

describe('McpCliError', () => {
  it('creates basic error', () => {
    const error = new McpCliError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.details).toEqual({});
    expect(error.exitCode).toBe(ExitCode.UNKNOWN_ERROR);
  });

  it('creates error with details', () => {
    const error = new McpCliError('Test error', { key: 'value' });
    expect(error.details).toEqual({ key: 'value' });
  });

  it('converts to dict', () => {
    const error = new McpCliError('Test error', { key: 'value' });
    const result = error.toDict();
    expect(result.type).toBe('UnknownError');
    expect(result.message).toBe('Test error');
    expect(result.code).toBe(199);
    expect(result.details).toEqual({ key: 'value' });
  });
});

describe('McpConnectionError', () => {
  it('has correct exit code', () => {
    const error = new McpConnectionError('连接失败');
    expect(error.exitCode).toBe(ExitCode.CONNECTION_FAILED);
    expect(error.errorType).toBe('ConnectionError');
  });

  it('includes server in details', () => {
    const error = new McpConnectionError('连接失败', { server: 'test_server' });
    expect(error.details.server).toBe('test_server');
  });
});

describe('ToolNotFoundError', () => {
  it('has correct exit code', () => {
    const error = new ToolNotFoundError('invalid_tool');
    expect(error.exitCode).toBe(ExitCode.TOOL_NOT_FOUND);
    expect(error.message).toContain('invalid_tool');
  });

  it('includes context in details', () => {
    const error = new ToolNotFoundError('invalid_tool', {
      server: 'test',
      availableTools: ['tool1', 'tool2'],
    });
    expect(error.details.tool).toBe('invalid_tool');
    expect(error.details.server).toBe('test');
    expect(error.details.available_tools).toEqual(['tool1', 'tool2']);
  });
});

describe('InvalidParamsError', () => {
  it('has correct exit code', () => {
    const error = new InvalidParamsError('参数缺失');
    expect(error.exitCode).toBe(ExitCode.INVALID_PARAMS);
  });

  it('includes param info', () => {
    const error = new InvalidParamsError('参数缺失', {
      paramName: 'scenic_name',
      expectedType: 'string',
    });
    expect(error.details.param_name).toBe('scenic_name');
    expect(error.details.expected_type).toBe('string');
  });
});

describe('AuthFailedError', () => {
  it('has correct defaults', () => {
    const error = new AuthFailedError();
    expect(error.exitCode).toBe(ExitCode.AUTH_FAILED);
    expect(error.message).toContain('API Key');
  });

  it('includes server', () => {
    const error = new AuthFailedError(undefined, 'test');
    expect(error.details.server).toBe('test');
  });
});

describe('McpTimeoutError', () => {
  it('has correct exit code', () => {
    const error = new McpTimeoutError();
    expect(error.exitCode).toBe(ExitCode.TIMEOUT);
  });

  it('includes timeout info', () => {
    const error = new McpTimeoutError(undefined, {
      timeoutSeconds: 30,
      server: 'test',
    });
    expect(error.details.timeout_seconds).toBe(30);
    expect(error.details.server).toBe('test');
  });
});

describe('ServerError', () => {
  it('has correct exit code', () => {
    const error = new ServerError('服务器错误');
    expect(error.exitCode).toBe(ExitCode.SERVER_ERROR);
  });

  it('includes status code', () => {
    const error = new ServerError('Internal Server Error', {
      statusCode: 500,
      server: 'test',
    });
    expect(error.details.status_code).toBe(500);
    expect(error.details.server).toBe('test');
  });
});

describe('ConfigError', () => {
  it('has correct exit code', () => {
    const error = new ConfigError('配置错误');
    expect(error.exitCode).toBe(ExitCode.CONFIG_ERROR);
  });

  it('includes config path', () => {
    const error = new ConfigError('配置文件不存在', {
      configPath: '/path/to/config.json',
    });
    expect(error.details.config_path).toBe('/path/to/config.json');
  });
});

describe('ApiKeyRequiredError', () => {
  it('has correct exit code', () => {
    const error = new ApiKeyRequiredError('需要配置 API Key');
    expect(error.exitCode).toBe(ExitCode.API_KEY_REQUIRED);
    expect(error.errorType).toBe('ApiKeyRequiredError');
  });

  it('includes hint', () => {
    const error = new ApiKeyRequiredError('未配置 API Key', {
      hint: 'export TUNIU_API_KEY=xxx',
      affected_servers: ['ticket'],
    });
    expect(error.details.hint).toContain('TUNIU_API_KEY');
  });
});

describe('handleError', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles McpCliError in json format', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = new ToolNotFoundError('test_tool', { server: 'test' });
    const exitCode = handleError(error, 'json');
    expect(exitCode).toBe(ExitCode.TOOL_NOT_FOUND);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('"success": false');
    expect(output).toContain('ToolNotFoundError');
  });

  it('handles generic error in json format', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = new Error('Some error');
    const exitCode = handleError(error, 'json');
    expect(exitCode).toBe(ExitCode.UNKNOWN_ERROR);

    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('"success": false');
    expect(output).toContain('UnknownError');
  });

  it('handles error in text format', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new McpConnectionError('连接失败', { server: 'test' });
    const exitCode = handleError(error, 'text');
    expect(exitCode).toBe(ExitCode.CONNECTION_FAILED);
  });
});

describe('formatSuccess', () => {
  it('formats basic data', () => {
    const result = formatSuccess({ key: 'value' });
    expect(result).toContain('"success": true');
    expect(result).toContain('"key": "value"');
  });

  it('formats with metadata', () => {
    const result = formatSuccess({ key: 'value' }, { latency_ms: 100 });
    expect(result).toContain('"success": true');
    expect(result).toContain('"latency_ms": 100');
  });

  it('formats empty data', () => {
    const result = formatSuccess({});
    expect(result).toContain('"success": true');
    expect(result).toContain('"data": {}');
  });
});
