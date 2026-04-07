import chalk from 'chalk';
import { ExitCode } from './codes.js';
import { McpCliError } from './exceptions.js';

export function handleError(
  error: unknown,
  outputFormat = 'json',
  verbose = false,
): number {
  if (error instanceof McpCliError) {
    const exitCode = error.exitCode;
    const errorDict = error.toDict();

    if (outputFormat === 'json') {
      console.log(
        JSON.stringify({ success: false, error: errorDict }, null, 2),
      );
    } else {
      console.error(chalk.red('错误:'), error.message);
      if (Object.keys(error.details).length > 0 && verbose) {
        console.error(chalk.dim(`详情: ${JSON.stringify(error.details)}`));
      }
    }
    return exitCode;
  }

  const exitCode = ExitCode.UNKNOWN_ERROR;
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (outputFormat === 'json') {
    console.log(
      JSON.stringify(
        {
          success: false,
          error: {
            type: 'UnknownError',
            message: errorMessage,
            code: exitCode,
          },
        },
        null,
        2,
      ),
    );
  } else {
    console.error(chalk.red('未知错误:'), errorMessage);
  }

  if (verbose && error instanceof Error && error.stack) {
    console.error(chalk.dim('\n堆栈跟踪:'));
    console.error(error.stack);
  }

  return exitCode;
}

export function formatSuccess(
  data: unknown,
  metadata?: Record<string, unknown>,
): string {
  const result: Record<string, unknown> = { success: true, data };
  if (metadata) result.metadata = metadata;
  return JSON.stringify(result, null, 2);
}
