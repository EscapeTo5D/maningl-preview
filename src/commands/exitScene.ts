/**
 * 退出 ManimGL Scene 命令
 */

import * as vscode from 'vscode';
import { TerminalManager } from '../terminal/terminalManager';
import { getConfiguration } from '../config/configuration';

/**
 * 退出当前运行的 Scene
 * 先发送 Ctrl+C 中断动画，再发送 quit 命令，然后关闭终端
 */
export async function exitScene(): Promise<void> {
  const terminalManager = TerminalManager.getInstance();
  const config = getConfiguration();

  // 先发送 Ctrl+C 中断当前动画，再发送 quit 命令
  // 模仿 Sublime 插件: send_terminus_command("\x03quit\n")
  terminalManager.sendText('\x03quit', config);

  // 延迟 500ms 后关闭终端，让 quit 命令有时间执行
  setTimeout(() => {
    terminalManager.closeTerminal();
  }, 500);
}

/**
 * 中断当前运行的 Scene（Ctrl+C）
 */
export async function interruptScene(): Promise<void> {
  const terminalManager = TerminalManager.getInstance();
  const config = getConfiguration();

  // 发送 Ctrl+C 信号
  terminalManager.sendCtrlC(config);

  // 显示通知
  vscode.window.showInformationMessage('已中断 Scene (Ctrl+C)', 'hide');
}

