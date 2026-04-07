/**
 * CLI exit codes.
 *
 * Agent 处理建议:
 * - 0: 继续下一步
 * - 101: 重试或检查网络
 * - 102: 检查工具名，运行 `tuniu list <server>`
 * - 103: 检查参数格式，运行 `tuniu help <server> <tool>`
 * - 104: 检查 API Key
 * - 105: 增加超时时间或重试
 * - 106: 联系服务提供方
 * - 107: 检查配置文件，运行 `tuniu config show`
 * - 108: 设置 TUNIU_API_KEY 环境变量
 * - 199: 查看 --detail 输出
 */
export enum ExitCode {
  SUCCESS = 0,
  CONNECTION_FAILED = 101,
  TOOL_NOT_FOUND = 102,
  INVALID_PARAMS = 103,
  AUTH_FAILED = 104,
  TIMEOUT = 105,
  SERVER_ERROR = 106,
  CONFIG_ERROR = 107,
  API_KEY_REQUIRED = 108,
  UNKNOWN_ERROR = 199,
}
