/**
 * 终端管理器 - 简化版，使用 PYTHONPATH 配置
 */

import * as vscode from 'vscode';
import type { ManimConfig } from '../config/configuration';
import { checkpointState } from '../state/checkpointState';

/**
 * 终端管理器类
 */
export class TerminalManager {
  private static instance: TerminalManager;
  private terminal: vscode.Terminal | undefined;
  private terminalName: string = '';
  private disposable: vscode.Disposable | undefined;

  private constructor() {
    // 监听终端关闭事件
    this.disposable = vscode.window.onDidCloseTerminal((closedTerminal) => {
      if (this.terminal === closedTerminal) {
        this.terminal = undefined;
        this.terminalName = '';
        // 预览窗口（终端）关闭时重置所有 checkpoint 状态
        checkpointState.resetAll();
      }
    });
  }

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
      }, 300);
    } else {
      terminal.sendText(command);
    }
  }

  /**
   * 发送 Ctrl+C 信号到终端（中断当前运行）
   * @param config 配置
   */
  sendCtrlC(config: ManimConfig): void {
    const { terminal } = this.getOrCreateTerminal(config);

    terminal.show(false); // 显示但不夺取焦点

    // 发送 Ctrl+C (在 Windows 上使用 ^C)
    if (process.platform === 'win32') {
      // Windows: 先发送 Ctrl+C
      terminal.sendText('\x03');
    } else {
      // Unix/Linux/Mac: 发送 SIGINT
      terminal.sendText('\x03');
    }
  }

  /**
   * 获取或创建终端
   * @param config 配置
   * @param cwd 工作目录
   */
  private getOrCreateTerminal(config: ManimConfig, cwd?: string): { terminal: vscode.Terminal; isNew: boolean } {
    // 使用固定的终端名称，不再包含目录（避免每次创建新终端）
    const terminalName = config.terminalName;

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
   * 关闭终端
   */
  closeTerminal(): void {
    if (this.terminal) {
      this.terminal.dispose();
      // 注意：onDidCloseTerminal 回调会自动清理 this.terminal 和重置状态
    }
  }

  /**
   * 清理资源
   */
  dispose(): void {
    if (this.disposable) {
      this.disposable.dispose();
      this.disposable = undefined;
    }
    if (this.terminal) {
      this.terminal.dispose();
      this.terminal = undefined;
    }
  }
}
