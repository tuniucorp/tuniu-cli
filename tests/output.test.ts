import { describe, it, expect } from 'vitest';
import { OutputFormatter } from '../src/output/index.js';

describe('OutputFormatter', () => {
  it('formats as JSON by default', () => {
    const formatter = new OutputFormatter('json');
    const result = formatter.format({ key: 'value' });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.data.key).toBe('value');
  });

  it('formats with metadata', () => {
    const formatter = new OutputFormatter('json');
    const result = formatter.format({ key: 'value' }, { latency: 100 });
    const parsed = JSON.parse(result);
    expect(parsed.metadata.latency).toBe(100);
  });

  it('formats as YAML', () => {
    const formatter = new OutputFormatter('yaml');
    const result = formatter.format({ key: 'value' });
    expect(result).toContain('success: true');
    expect(result).toContain('key: value');
  });

  it('formats servers list as JSON', () => {
    const formatter = new OutputFormatter('json');
    const result = formatter.formatServersList(['ticket', 'hotel']);
    const parsed = JSON.parse(result);
    expect(parsed.servers).toEqual(['ticket', 'hotel']);
  });

  it('formats servers list as table', () => {
    const formatter = new OutputFormatter('table');
    const result = formatter.formatServersList(['ticket'], {
      ticket: '门票服务',
    });
    expect(result).toContain('ticket');
    expect(result).toContain('门票服务');
  });

  it('formats tools list as JSON', () => {
    const formatter = new OutputFormatter('json');
    const tools = [{ name: 'tool1', description: '工具1' }];
    const result = formatter.formatToolsList('ticket', tools);
    const parsed = JSON.parse(result);
    expect(parsed.server).toBe('ticket');
    expect(parsed.tools).toHaveLength(1);
  });

  it('formats tools list as table', () => {
    const formatter = new OutputFormatter('table');
    const tools = [{ name: 'tool1', description: '工具1' }];
    const result = formatter.formatToolsList('ticket', tools);
    expect(result).toContain('tool1');
    expect(result).toContain('工具1');
  });

  it('formats health check as JSON', () => {
    const formatter = new OutputFormatter('json');
    const results = {
      ticket: { status: 'healthy', latency_ms: 50 },
    };
    const result = formatter.formatHealthCheck(results);
    const parsed = JSON.parse(result);
    expect(parsed.ticket.status).toBe('healthy');
  });

  it('formats health check as table', () => {
    const formatter = new OutputFormatter('table');
    const results = {
      ticket: { status: 'healthy', latency_ms: 50 },
      hotel: { status: 'unhealthy', error: 'timeout' },
    };
    const result = formatter.formatHealthCheck(results);
    expect(result).toContain('ticket');
    expect(result).toContain('hotel');
  });
});
