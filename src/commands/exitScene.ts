/**
 * 退出 ManimGL Scene 命令
 */

import * as vscode from 'vscode';
import { TerminalManager } from '../terminal/terminalManager';
import { getConfiguration } from '../config/configuration';

/**
 * 退出当前运行的 Scene
 */
export async function exitScene(): Promise<void> {
  const terminalManager = TerminalManager.getInstance();
  const config = getConfiguration();

  // 发送 quit 命令
  terminalManager.sendText('quit', config);

  // 显示通知
  vscode.window.showInformationMessage('已退出 Scene', 'hide');
}

