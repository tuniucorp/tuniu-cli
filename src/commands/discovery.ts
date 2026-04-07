/**
 * Discovery 命令实现
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { ConfigManager } from '../config/index.js';
import { handleError } from '../errors/index.js';

export interface DiscoveryOptions {
  configManager?: ConfigManager;
  outputFormat?: string;
}

/**
 * 刷新 Discovery 缓存
 */
export async function executeDiscoveryRefresh(
  options: DiscoveryOptions,
): Promise<number> {
  const { configManager = new ConfigManager() } = options;

  const discoveryConfig = configManager.getDiscoveryConfig();

  if (!discoveryConfig?.enabled) {
    console.log(
      '服务发现未启用，请在配置中设置 discovery.enabled = true',
    );
    return 1;
  }

  try {
    const client = configManager.getDiscoveryClient();
    if (!client) {
      console.log('Discovery 客户端未初始化');
      return 1;
    }

    const services = await client.refresh();
    console.log(chalk.green(`已刷新 ${services.length} 个服务`));
    return 0;
  } catch (e) {
    return handleError(e, 'json');
  }
}

/**
 * 显示 Discovery 状态
 */
export async function executeDiscoveryStatus(
  options: DiscoveryOptions,
): Promise<number> {
  const { configManager = new ConfigManager() } = options;

  const discoveryConfig = configManager.getDiscoveryConfig();
  const discoveryEnabled = configManager.isDiscoveryEnabled();

  console.log(chalk.bold('服务发现状态:'));
  console.log(`  启用: ${discoveryEnabled ? chalk.green('是') : chalk.gray('否')}`);
  console.log(`  URL: ${discoveryConfig?.url ?? chalk.gray('未配置')}`);

  if (discoveryEnabled) {
    const client = configManager.getDiscoveryClient();
    if (client) {
      const cacheStatus = await client.getCacheStatus();

      console.log(`  缓存存在: ${cacheStatus.cached ? chalk.green('是') : chalk.gray('否')}`);

      if (cacheStatus.cached) {
        const expired = cacheStatus.expired;
        console.log(
          `  缓存状态: ${expired ? chalk.yellow('已过期') : chalk.green('有效')}`,
        );
        if (cacheStatus.expiresAt) {
          const expiresDate = new Date(cacheStatus.expiresAt);
          console.log(`  过期时间: ${expiresDate.toLocaleString()}`);
        }
        if (cacheStatus.count !== undefined) {
          console.log(`  服务数量: ${cacheStatus.count}`);
        }
      }

      console.log(
        `  刷新间隔: ${discoveryConfig?.refreshInterval ?? 86400} 秒 (${Math.floor((discoveryConfig?.refreshInterval ?? 86400) / 3600)} 小时)`,
      );
      console.log(
        `  请求超时: ${discoveryConfig?.timeout ?? 10000} 毫秒`,
      );
    }
  }

  return 0;
}

/**
 * 列出 Discovery 服务
 */
export async function executeDiscoveryList(
  options: DiscoveryOptions & { all?: boolean },
): Promise<number> {
  const { configManager = new ConfigManager(), outputFormat = 'json', all = false } = options;

  const discoveryConfig = configManager.getDiscoveryConfig();

  if (!discoveryConfig?.enabled) {
    console.log('服务发现未启用');
    return 1;
  }

  try {
    const services = await configManager.getDiscoveryServices();

    // 默认只显示 health 状态的服务
    const filteredServices = all
      ? services
      : services.filter((s) => s.status === 'health');

    if (outputFormat === 'table') {
      const table = new Table({
        head: ['服务名称', '状态', '描述', '标签'],
      });

      for (const s of filteredServices) {
        table.push([
          s.name,
          s.status === 'health'
            ? chalk.green('health')
            : chalk.red('offline'),
          s.description ?? '',
          s.tags?.join(', ') ?? '',
        ]);
      }

      console.error(chalk.bold('Discovery 服务列表'));
      console.error(table.toString());
    } else {
      console.log(JSON.stringify({ services: filteredServices }, null, 2));
    }

    return 0;
  } catch (e) {
    return handleError(e, outputFormat);
  }
}