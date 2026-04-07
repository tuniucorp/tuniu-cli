import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const manifestPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'agent-manifest.json',
);

describe('agent-manifest.json', () => {
  const manifest = JSON.parse(
    fs.readFileSync(manifestPath, 'utf-8'),
  ) as Record<string, unknown>;

  it('registers holiday server with intent keywords', () => {
    const servers = manifest.servers as Record<string, Record<string, unknown>>;
    expect(servers.holiday).toBeDefined();
    expect(servers.holiday.description).toBe('度假产品服务');
    const keywords = servers.holiday.intentKeywords as string[];
    expect(keywords).toContain('度假');
    expect(keywords).toContain('跟团');
  });

  it('maps 度假产品搜索 to searchHolidayList on holiday server', () => {
    const intentToTool = manifest.intentToTool as Record<
      string,
      { server: string; tool: string; requiredArgs: string[] }
    >;
    const mapping = intentToTool['度假产品搜索'];
    expect(mapping).toEqual({
      server: 'holiday',
      tool: 'searchHolidayList',
      requiredArgs: ['destinationName'],
    });
  });

  it('description mentions 度假产品 among supported capabilities', () => {
    const desc = manifest.description as string;
    expect(desc).toContain('度假');
  });
});
