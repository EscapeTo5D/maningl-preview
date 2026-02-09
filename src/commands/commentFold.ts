/**
 * 注释折叠命令
 * 基于注释标记折叠代码块
 */

import * as vscode from 'vscode';

interface FoldRegion {
    startLine: number;  // 注释行
    endLine: number;    // 下一个注释行之前
}

/**
 * 折叠选中区域中以注释为分隔的代码块
 * 模仿 Sublime Text 的 CommentFold 功能
 */
export async function commentFold(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const document = editor.document;
    const selections = editor.selections;
    const foldRegions: FoldRegion[] = [];

    for (const selection of selections) {
        if (selection.isEmpty) {
            continue;
        }

        const startLine = selection.start.line;
        const endLine = selection.end.line;

        let indentLevel: number | null = null;
        let lastCommentLine: number | null = null;
        let lastLineWasComment = false;

        for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
            const line = document.lineAt(lineNum);
            const lineText = line.text;
            const trimmedLine = lineText.trimStart();

            if (trimmedLine.startsWith('#')) {
                const currentIndent = lineText.length - trimmedLine.length;

                if (indentLevel === null) {
                    indentLevel = currentIndent;
                }

                // 同级注释且不是连续注释行
                if (currentIndent === indentLevel && !lastLineWasComment) {
                    // 如果有之前的注释行，记录折叠区域
                    if (lastCommentLine !== null && lineNum > lastCommentLine + 1) {
                        foldRegions.push({
                            startLine: lastCommentLine,
                            endLine: lineNum - 1
                        });
                    }
                    lastCommentLine = lineNum;
                }
                lastLineWasComment = true;
            } else {
                lastLineWasComment = false;
            }
        }

        // 处理最后一个注释块
        if (lastCommentLine !== null && lastCommentLine < endLine) {
            foldRegions.push({
                startLine: lastCommentLine,
                endLine: endLine
            });
        }
    }

    // 从后往前折叠（避免行号变化影响）
    foldRegions.reverse();

    for (const region of foldRegions) {
        // 确保有内容可折叠（注释之后至少有一行）
        if (region.startLine + 1 > region.endLine) {
            continue;
        }

        // 选中从注释行末尾到最后一行末尾（注释可见，之后的代码全部折叠）
        const startPos = document.lineAt(region.startLine).range.end;
        const endPos = document.lineAt(region.endLine).range.end;

        editor.selection = new vscode.Selection(startPos, endPos);
        await vscode.commands.executeCommand('editor.createFoldingRangeFromSelection');
    }

    // 清除选区
    if (selections.length > 0) {
        const pos = selections[0].start;
        editor.selection = new vscode.Selection(pos, pos);
    }
}
