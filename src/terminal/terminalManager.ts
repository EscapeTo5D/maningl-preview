/**
 * 终端管理器 - 简化版，使用 PYTHONPATH 配置
 */

import * as vscode from 'vscode';
import type { ManimConfig } from '../config/configuration';

/**
 * 终端管理器类
 */
export class TerminalManager {
  private static instance: TerminalManager;
  private terminal: vscode.Terminal | undefined;
  private terminalName: string = '';

  private constructor() { }

  /**
   * 获取单例实例
   */
  static getInstance(): TerminalManager {
    if (!TerminalManager.instance) {
      TerminalManager.instance = new TerminalManager();
    }
    return TerminalManager.instance;
  }

  /**
   * 发送命令到终端
   * @param command 要执行的命令
   * @param config 配置
   * @param cwd 工作目录
   */
  sendText(command: string, config: ManimConfig, cwd?: string): void {
    const { terminal, isNew } = this.getOrCreateTerminal(config, cwd);

    terminal.show(false); // 显示但不夺取焦点

    if (isNew) {
      // 新终端稍等一下再执行命令
      setTimeout(() => {
        terminal.sendText(command);
      }, 200);
    } else {
      terminal.sendText(command);
    }
  }

  /**
   * 获取或创建终端
   * @param config 配置
   * @param cwd 工作目录
   */
  private getOrCreateTerminal(config: ManimConfig, cwd?: string): { terminal: vscode.Terminal; isNew: boolean } {
    const terminalName = cwd ? `${config.terminalName} - ${cwd}` : config.terminalName;

    // 检查是否已有匹配的终端
    if (this.terminal &&
      this.terminal.exitStatus === undefined &&
      this.terminalName === terminalName) {
      return { terminal: this.terminal, isNew: false };
    }

    // 构建环境变量
    const env: { [key: string]: string } = {};

    // 如果配置了 pythonPath，设置 PYTHONPATH 环境变量
    if (config.pythonPath) {
      env['PYTHONPATH'] = config.pythonPath;
    }

    // 明确指定使用 CMD (Windows)
    const shellPath = process.platform === 'win32' ? 'cmd.exe' : undefined;

    // 创建新终端
    this.terminal = vscode.window.createTerminal({
      name: terminalName,
      cwd: cwd,
      env: Object.keys(env).length > 0 ? env : undefined,
      shellPath: shellPath,
    });
    this.terminalName = terminalName;

    return { terminal: this.terminal, isNew: true };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = undefined;
    }
  }
}
