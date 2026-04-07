import chalk from 'chalk';
import { ConfigManager } from '../config/index.js';
import { handleError } from '../errors/index.js';

function configInit(
  configManager: ConfigManager,
  outputFormat: string,
  force = false,
): number {
  try {
    const configPath = configManager.initConfig(force);
    const result = {
      success: true,
      message: force ? '配置文件已覆盖' : '配置文件已创建',
      config_path: configPath,
    };
    console.log(JSON.stringify(result, null, 2));
    return 0;
  } catch (e) {
    return handleError(e, outputFormat);
  }
}

function configShow(configManager: ConfigManager): number {
  const result = configManager.toDict();
  console.log(JSON.stringify(result, null, 2));
  return 0;
}

function configSet(
  configManager: ConfigManager,
  key: string | undefined,
  value: string | undefined,
): number {
  if (!key || !value) {
    console.error(chalk.red('用法: tuniu config set <key> <value>'));
    return 1;
  }

  let result: Record<string, unknown>;

  if (key === 'defaultProfile') {
    result = {
      success: true,
      message: `配置项 '${key}' 设置成功（需要实现文件写入）`,
      key,
      value,
    };
  } else {
    result = {
      success: false,
      message: `暂不支持设置配置项 '${key}'`,
      supported_keys: ['defaultProfile'],
    };
  }

  console.log(JSON.stringify(result, null, 2));
  return result.success ? 0 : 1;
}

export function executeConfig(options: {
  action: string;
  configManager?: ConfigManager;
  key?: string;
  value?: string;
  outputFormat?: string;
  force?: boolean;
}): number {
  const {
    action,
    configManager = new ConfigManager(),
    key,
    value,
    outputFormat = 'json',
    force = false,
  } = options;

  try {
    if (action === 'init') return configInit(configManager, outputFormat, force);
    if (action === 'show') return configShow(configManager);
    if (action === 'set') return configSet(configManager, key, value);

    console.error(chalk.red(`未知操作: ${action}`));
    console.error('可用操作: init, show, set');
    return 1;
  } catch (e) {
    return handleError(e, outputFormat);
  }
}
