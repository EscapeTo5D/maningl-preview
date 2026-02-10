/**
 * VS Code 扩展主入口
 */

import * as vscode from 'vscode';
import { TerminalManager } from './terminal/terminalManager';
import { runScene } from './commands/runScene';
import { checkpointPaste, checkpointPasteRecorded, checkpointPasteSkipped } from './commands/checkpointPaste';
import { runCheckpointFromComment } from './commands/runCheckpointFromComment';
import { exitScene, interruptScene } from './commands/exitScene';
import { commentFold } from './commands/commentFold';
import { copyCameraState } from './commands/copyCameraState';
import { SceneCodeLensProvider } from './providers/sceneCodeLensProvider';

/**
 * 扩展激活
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('ManimGL Preview 扩展已激活');

  // 注册 CodeLens Provider
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { language: 'python' },
      new SceneCodeLensProvider()
    )
  );

  // 注册命令
  const disposables = [
    // 运行当前 Scene
    vscode.commands.registerCommand('maningl-preview.runScene', runScene),

    // CheckpointPaste 系列
    vscode.commands.registerCommand('maningl-preview.checkpointPaste', checkpointPaste),
    vscode.commands.registerCommand('maningl-preview.checkpointPasteRecorded', checkpointPasteRecorded),
    vscode.commands.registerCommand('maningl-preview.checkpointPasteSkipped', checkpointPasteSkipped),
    vscode.commands.registerCommand('maningl-preview.runCheckpointFromComment', runCheckpointFromComment),

    // 退出/中断 Scene
    vscode.commands.registerCommand('maningl-preview.exitScene', exitScene),
    vscode.commands.registerCommand('maningl-preview.interruptScene', interruptScene),

    // 注释折叠
    vscode.commands.registerCommand('maningl-preview.commentFold', commentFold),

    // 复制相机状态
    vscode.commands.registerCommand('maningl-preview.copyCameraState', copyCameraState),
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
