import { ConfigManager } from '../config/index.js';
import { handleError } from '../errors/index.js';
import { McpClientManager } from '../mcp/index.js';

function formatTools(
  tools: Record<string, unknown>[],
  server: string,
): Record<string, unknown>[] {
  return tools.map((t) => ({
    name: t.name,
    full_name: `${server}:${t.name}`,
    description: (t.description as string) ?? '',
    inputSchema: t.inputSchema ?? {},
  }));
}

function formatToolMarkdown(tool: Record<string, unknown>): string {
  const name = (tool.name as string) ?? '';
  const fullName = (tool.full_name as string) ?? name;
  const description = (tool.description as string) ?? '';
  const schema = (tool.inputSchema as Record<string, unknown>) ?? {};

  let md = `### ${fullName}\n\n${description}\n\n`;

  if (schema && Object.keys(schema).length > 0) {
    const props = (schema.properties ?? {}) as Record<string, Record<string, unknown>>;
    const required = (schema.required ?? []) as string[];

    if (Object.keys(props).length > 0) {
      md += '**参数:**\n\n';
      md += '| 参数名 | 类型 | 必填 | 描述 |\n';
      md += '| ------ | ---- | ---- | ---- |\n';
      for (const [propName, propDef] of Object.entries(props)) {
        const propType = (propDef.type as string) ?? 'any';
        const isRequired = required.includes(propName) ? '是' : '否';
        const propDesc = (propDef.description as string) ?? '';
        md += `| ${propName} | ${propType} | ${isRequired} | ${propDesc} |\n`;
      }
      md += '\n';
    }
  }

  return md;
}

function printMarkdown(
  result: Record<string, unknown>,
  server?: string,
): void {
  let mdContent = '# MCP 工具 Schema\n\n';

  if (server) {
    mdContent += `## ${server} 服务\n\n`;
    for (const tool of (result.tools as Record<string, unknown>[]) ?? []) {
      mdContent += formatToolMarkdown(tool);
    }
  } else {
    const servers = (result.servers ?? {}) as Record<string, Record<string, unknown>>;
    for (const [srvName, srvData] of Object.entries(servers)) {
      mdContent += `## ${srvName} 服务\n\n`;
      for (const tool of (srvData.tools as Record<string, unknown>[]) ?? []) {
        mdContent += formatToolMarkdown(tool);
      }
    }
  }

  console.log(mdContent);
}

export async function executeSchema(options: {
  server?: string;
  outputFormat?: string;
  configManager?: ConfigManager;
  verbose?: boolean;
}): Promise<number> {
  const {
    server,
    outputFormat = 'json',
    configManager = new ConfigManager(),
    verbose = false,
  } = options;

  try {
    configManager.ensureApiKey(server ? [server] : undefined);

    const manager = new McpClientManager(configManager, verbose);
    let result: Record<string, unknown>;

    if (server) {
      const tools = await manager.listTools(server);
      result = { server, tools: formatTools(tools, server) };
    } else {
      const allTools = await manager.getAllTools();
      const servers: Record<string, unknown> = {};
      for (const [name, tools] of Object.entries(allTools)) {
        servers[name] = { tools: formatTools(tools, name) };
      }
      result = { servers };
    }

    if (outputFormat === 'markdown') {
      printMarkdown(result, server);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }

    return 0;
  } catch (e) {
    return handleError(e, outputFormat);
  }
}
