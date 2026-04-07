import chalk from 'chalk';
import Table from 'cli-table3';
import yaml from 'js-yaml';

export class OutputFormatter {
  readonly formatType: string;

  constructor(formatType = 'json') {
    this.formatType = formatType;
  }

  format(data: unknown, metadata?: Record<string, unknown>): string {
    if (this.formatType === 'yaml') return this.formatYaml(data, metadata);
    return this.formatJson(data, metadata);
  }

  private formatJson(
    data: unknown,
    metadata?: Record<string, unknown>,
  ): string {
    const result: Record<string, unknown> = { success: true, data };
    if (metadata) result.metadata = metadata;
    return JSON.stringify(result, null, 2);
  }

  private formatYaml(
    data: unknown,
    metadata?: Record<string, unknown>,
  ): string {
    const result: Record<string, unknown> = { success: true, data };
    if (metadata) result.metadata = metadata;
    return yaml.dump(result, { noCompatMode: true });
  }

  print(data: unknown, metadata?: Record<string, unknown>): void {
    console.log(this.format(data, metadata));
  }

  printError(message: string): void {
    console.error(chalk.red('错误:'), message);
  }

  printInfo(message: string): void {
    console.error(chalk.blue('信息:'), message);
  }

  printTable(title: string, columns: string[], rows: string[][]): void {
    console.log(chalk.bold(title));
    const table = new Table({ head: columns });
    for (const row of rows) {
      table.push(row);
    }
    console.log(table.toString());
  }

  formatServersList(
    servers: string[],
    descriptions?: Record<string, string>,
  ): string {
    if (this.formatType === 'table') {
      return this.formatServersTable(servers, descriptions ?? {});
    }
    if (this.formatType === 'yaml') {
      return yaml.dump({ servers }, { noCompatMode: true });
    }
    return JSON.stringify({ servers }, null, 2);
  }

  private formatServersTable(
    servers: string[],
    descriptions: Record<string, string>,
  ): string {
    const table = new Table({
      head: ['服务名称', '描述'],
    });
    for (const server of servers) {
      table.push([server, descriptions[server] ?? '']);
    }
    return `${chalk.bold('可用服务')}\n${table.toString()}`;
  }

  formatToolsList(
    server: string,
    tools: Record<string, unknown>[],
  ): string {
    if (this.formatType === 'table') {
      return this.formatToolsTable(server, tools);
    }
    if (this.formatType === 'yaml') {
      return yaml.dump({ server, tools }, { noCompatMode: true });
    }
    return JSON.stringify({ server, tools }, null, 2);
  }

  private formatToolsTable(
    server: string,
    tools: Record<string, unknown>[],
  ): string {
    const table = new Table({
      head: ['工具名称', '描述'],
    });
    for (const tool of tools) {
      table.push([
        (tool.name as string) ?? '',
        (tool.description as string) ?? '',
      ]);
    }
    return `${chalk.bold(`${server} 服务工具列表`)}\n${table.toString()}`;
  }

  formatHealthCheck(
    results: Record<string, Record<string, unknown>>,
  ): string {
    if (this.formatType === 'table') {
      return this.formatHealthTable(results);
    }
    if (this.formatType === 'yaml') {
      return yaml.dump(results, { noCompatMode: true });
    }
    return JSON.stringify(results, null, 2);
  }

  private formatHealthTable(
    results: Record<string, Record<string, unknown>>,
  ): string {
    const table = new Table({
      head: ['服务', '状态', '延迟(ms)', '错误'],
    });
    for (const [server, result] of Object.entries(results)) {
      const status = result.status as string;
      const latency = result.latency_ms ?? '-';
      const error = result.error ?? '-';
      const statusStr =
        status === 'healthy'
          ? chalk.green('健康')
          : chalk.red('不健康');
      table.push([server, statusStr, String(latency), String(error)]);
    }
    return `${chalk.bold('服务健康状态')}\n${table.toString()}`;
  }
}
