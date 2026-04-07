export { CompletionGenerator, type ShellType } from './generator.js';
export { CompletionProvider } from './provider.js';
export { CompletionInstaller, type InstallResult } from './installer.js';
export {
  generateBashTemplate,
  generateZshTemplate,
  generateFishTemplate,
} from './templates.js';