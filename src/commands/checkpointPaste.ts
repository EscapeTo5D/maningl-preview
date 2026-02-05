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

  // 分析选中内容（统一处理 Windows/Unix 换行符）
  const normalizedText = selectedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n');
  const firstLine = lines[0].trimStart();
  const startsWithComment = firstLine.startsWith('#');

  let command: string;

  if (lines.length === 1 && !startsWithComment) {
    // 单行非注释代码：直接发送选中的内容
    command = selectedText;
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

    const comment = startsWithComment ? firstLine : '#';
    command = `checkpoint_paste(${argsStr}) ${comment} (${lines.length} lines)`;
  }
  // 保存选区起始位置，然后清除选区并移动光标
  const selection = editor.selection;
  const startPos = selection.start;
  editor.selection = new vscode.Selection(startPos, startPos);

  // 发送到终端（传递工作目录以复用已有终端）
  const terminalManager = TerminalManager.getInstance();
  const config = getConfiguration();
  const cwd = path.dirname(editor.document.fileName);
  terminalManager.sendText(command, config, cwd);
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
