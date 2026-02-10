/**
 * 从注释行运行 CheckpointPaste
 * 锁定状态：第一次点击解锁，第二次点击执行
 */

import * as vscode from 'vscode';
import { getConfiguration } from '../config/configuration';
import { TerminalManager } from '../terminal/terminalManager';
import { checkpointState } from '../state/checkpointState';
import * as path from 'path';

/**
 * 从指定注释行运行 CheckpointPaste
 * @param startLine 注释行的行号（0-based）
 * @param endLine 代码块结束行号（0-based，包含）
 * @param sceneName 场景名称
 * @param checkpointIndex 该 checkpoint 在场景内的索引
 * @param totalCheckpoints 场景内 checkpoint 总数
 */
export async function runCheckpointFromComment(
    startLine: number,
    endLine: number,
    sceneName?: string,
    checkpointIndex?: number,
    totalCheckpoints?: number
): Promise<void> {
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

    // 检查用户是否已有选中内容
    const existingSelection = editor.selection;
    const hasSelection = !existingSelection.isEmpty;

    // 检查是否是锁定状态（需要先解锁）— 选中时跳过锁定检查
    if (!hasSelection && sceneName !== undefined && checkpointIndex !== undefined && totalCheckpoints !== undefined) {
        const isUnlocked = checkpointState.isUnlocked(sceneName, checkpointIndex);

        // 如果是锁定状态，只解锁不执行
        if (!isUnlocked) {
            // 解锁到这个 checkpoint（但不标记为已执行）
            checkpointState.unlockTo(sceneName, checkpointIndex, totalCheckpoints);
            vscode.window.showInformationMessage(`已解锁 checkpoint ${checkpointIndex + 1}，再次点击执行`);
            return;
        }
    }

    let textToSend: string;
    let clearPos: vscode.Position;
    let firstLineTrimmed: string;
    let lineCount: number;

    if (hasSelection) {
        // 用户已选中代码，使用选中的内容
        const selectedText = document.getText(existingSelection);
        const nonEmptyLines = selectedText
            .split('\n')
            .filter(line => line.trim() !== '');

        // 验证：如果包含注释，只允许在第一行
        const commentInOtherLines = nonEmptyLines.slice(1).some(line => line.trimStart().startsWith('#'));
        if (commentInOtherLines) {
            vscode.window.showWarningMessage('记录点操作错误，注释选中必须在第一行');
            return;
        }

        textToSend = nonEmptyLines.join('\n');
        firstLineTrimmed = document.lineAt(existingSelection.start.line).text.trimStart();
        lineCount = nonEmptyLines.length;
        clearPos = existingSelection.start;
    } else {
        // 使用预定义的代码块范围
        const startPos = new vscode.Position(startLine, 0);
        const endPos = new vscode.Position(endLine, document.lineAt(endLine).text.length);
        editor.selection = new vscode.Selection(startPos, endPos);

        const selectedText = document.getText(new vscode.Range(startPos, endPos));
        textToSend = selectedText
            .split('\n')
            .filter(line => line.trim() !== '')
            .join('\n');
        firstLineTrimmed = document.lineAt(startLine).text.trimStart();
        lineCount = textToSend.split('\n').length;
        clearPos = startPos;
    }

    // 复制到剪贴板
    await vscode.env.clipboard.writeText(textToSend);

    // 构建命令（与 checkpointPaste.ts 格式一致）
    const comment = firstLineTrimmed.startsWith('#') ? firstLineTrimmed : '#';
    const command = `checkpoint_paste() ${comment} (${lineCount} lines)`;

    // 发送到终端
    const terminalManager = TerminalManager.getInstance();
    const config = getConfiguration();
    const cwd = path.dirname(document.fileName);
    terminalManager.sendText(command, config, cwd);

    // 更新状态，标记为已执行（选中执行时不影响进度）
    if (!hasSelection && sceneName !== undefined && checkpointIndex !== undefined && totalCheckpoints !== undefined) {
        checkpointState.markExecuted(sceneName, checkpointIndex, totalCheckpoints);
    }

    // 清除选区
    editor.selection = new vscode.Selection(clearPos, clearPos);

    // 1 秒后把焦点切回编辑器
    setTimeout(() => {
        if (editor) {
            vscode.window.showTextDocument(editor.document, editor.viewColumn, false);
        }
    }, 1000);
}
