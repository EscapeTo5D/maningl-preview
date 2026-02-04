/**
 * CheckpointPaste 命令
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { getSelectedText } from '../python/sceneDetector';
import { getConfiguration } from '../config/configuration';
import { TerminalManager } from '../terminal/terminalManager';
import type { CheckpointPasteOptions } from '../types/manim';

/**
 * 执行 CheckpointPaste
 */
export async function checkpointPaste(options: CheckpointPasteOptions = {}): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('没有活动的编辑器');
    return;
  }

  const document = editor.document;
  if (document.languageId !== 'python') {
    vscode.window.showWarningMessage('请在 Python 文件中运行此命令');
    return;
  }

  // 获取选中的文本
  const selectedText = getSelectedText(editor);
  if (!selectedText) {
    vscode.window.showWarningMessage('请先选中要粘贴的代码');
    return;
  }

  // 复制到剪贴板
  await vscode.env.clipboard.writeText(selectedText);

  // 构建 checkpoint_paste() 命令
  const terminalManager = TerminalManager.getInstance();

  // 构建命令参数
  const args: string[] = [];
  if (options.record) {
    args.push('record=True');
  }
  if (options.skip) {
    args.push('skip=True');
  }

  const argsStr = args.length > 0 ? args.join(', ') : '';
  const command = `checkpoint_paste(${argsStr})`;

  // 发送到终端（传递工作目录以复用已有终端）
  const cwd = require('path').dirname(editor.document.fileName);
  terminalManager.sendText(command, cwd);

  // 显示通知
  vscode.window.showInformationMessage('已发送代码到终端', 'hide');
}

/**
 * CheckpointPaste with Record
 */
export async function checkpointPasteRecorded(): Promise<void> {
  await checkpointPaste({ record: true });
}

/**
 * CheckpointPaste with Skip
 */
export async function checkpointPasteSkipped(): Promise<void> {
  await checkpointPaste({ skip: true });
}
