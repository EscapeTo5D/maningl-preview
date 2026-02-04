/**
 * VS Code 扩展主入口
 */

import * as vscode from 'vscode';
import { TerminalManager } from './terminal/terminalManager';
import { runScene } from './commands/runScene';
import { checkpointPaste, checkpointPasteRecorded, checkpointPasteSkipped } from './commands/checkpointPaste';
import { exitScene } from './commands/exitScene';

/**
 * 扩展激活
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('ManimGL Preview 扩展已激活');

  // 注册命令
  const disposables = [
    // 运行当前 Scene
    vscode.commands.registerCommand('maningl-preview.runScene', runScene),

    // CheckpointPaste 系列
    vscode.commands.registerCommand('maningl-preview.checkpointPaste', checkpointPaste),
    vscode.commands.registerCommand('maningl-preview.checkpointPasteRecorded', checkpointPasteRecorded),
    vscode.commands.registerCommand('maningl-preview.checkpointPasteSkipped', checkpointPasteSkipped),

    // 退出 Scene
    vscode.commands.registerCommand('maningl-preview.exitScene', exitScene),
  ];

  context.subscriptions.push(...disposables);
}

/**
 * 扩展停用
 */
export function deactivate() {
  // 清理终端资源
  const terminalManager = TerminalManager.getInstance();
  terminalManager.dispose();
}
