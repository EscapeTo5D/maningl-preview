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

  // 获取选区信息
  const selection = editor.selection;
  const hasSelection = !selection.isEmpty;

  // 获取行信息
  const startLine = selection.start.line;
  const endLine = hasSelection ? selection.end.line : startLine;
  const lineCount = endLine - startLine + 1;

  // 获取第一行的完整内容
  const firstLineText = document.lineAt(startLine).text;
  const firstLineTrimmed = firstLineText.trimStart();
  const startsWithComment = firstLineTrimmed.startsWith('#');

  // 确定要使用的文本
  let textToUse: string;
  if (hasSelection) {
    // 有选区：使用选中的文本
    textToUse = getSelectedText(editor) || firstLineTrimmed;
  } else {
    // 无选区：使用当前行完整内容
    textToUse = firstLineTrimmed;
  }

  // 复制到剪贴板
  await vscode.env.clipboard.writeText(textToUse);

  let command: string;

  if (lineCount === 1 && !startsWithComment) {
    // 单行非注释代码：发送选中的内容（如果选了部分则发送部分）
    command = textToUse;
  } else {
    // 多行或注释开头：使用 checkpoint_paste()
    // 构建命令参数
    const args: string[] = [];
    if (options.record) {
      args.push('record=True');
    }
    if (options.skip) {
      args.push('skip=True');
    }
    const argsStr = args.length > 0 ? args.join(', ') : '';

    const comment = startsWithComment ? firstLineTrimmed : '#';
    command = `checkpoint_paste(${argsStr}) ${comment} (${lineCount} lines)`;
  }
  // 清除选区并移动光标到起始位置
  const startPos = selection.start;
  editor.selection = new vscode.Selection(startPos, startPos);

  // 发送到终端（传递工作目录以复用已有终端）
  const terminalManager = TerminalManager.getInstance();
  const config = getConfiguration();
  const cwd = path.dirname(editor.document.fileName);
  terminalManager.sendText(command, config, cwd);

  // 1 秒后把焦点切回编辑器（命令已执行，可以边看动画边写代码）
  setTimeout(() => {
    if (editor) {
      vscode.window.showTextDocument(editor.document, editor.viewColumn, false);
    }
  }, 1000);
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
