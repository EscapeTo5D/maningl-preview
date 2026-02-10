/**
 * Scene CodeLens Provider
 * 在 Scene 类的 construct 方法显示 "▶ Run Scene" 按钮
 * 在 Scene 内的注释行显示 checkpoint_paste 按钮（带锁定状态）
 */

import * as vscode from 'vscode';
import { detectAllScenes } from '../python/sceneDetector';
import { checkpointState } from '../state/checkpointState';

export class SceneCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
    readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

    constructor() {
        // 监听状态变化，触发 CodeLens 刷新
        checkpointState.onDidChangeState(() => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    /**
     * 提供 CodeLens
     */
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        // 只处理 Python 文件
        if (document.languageId !== 'python') {
            return [];
        }

        const codeLenses: vscode.CodeLens[] = [];
        const scenes = detectAllScenes(document);
        const text = document.getText();
        const lines = text.split('\n');

        // 为每个 Scene 添加 CodeLens
        for (const scene of scenes) {
            // 1. 在 construct 方法上显示 "▶ Run Scene"
            const constructRange = new vscode.Range(scene.constructLineNumber, 0, scene.constructLineNumber, 0);
            codeLenses.push(new vscode.CodeLens(constructRange, {
                title: '▶ Run Scene',
                tooltip: `从头运行 ${scene.name}`,
                command: 'maningl-preview.runScene',
                arguments: [scene.constructLineNumber, scene.name],
            }));

            // 2. 检测 Scene 内的所有注释行
            const commentRegex = /^\s+#\s*.+/;  // 缩进的注释行（排除顶级注释）

            // 找到下一个 Scene 的起始行（用于确定当前 Scene 的范围）
            const sceneIndex = scenes.indexOf(scene);
            const nextSceneStart = sceneIndex < scenes.length - 1
                ? scenes[sceneIndex + 1].lineNumber
                : lines.length;

            // 收集所有注释行的位置
            const commentLines: number[] = [];
            for (let i = scene.constructLineNumber + 1; i < nextSceneStart; i++) {
                if (commentRegex.test(lines[i])) {
                    commentLines.push(i);
                }
            }

            const totalCheckpoints = commentLines.length;
            const isSceneStarted = checkpointState.isSceneStarted(scene.name);

            // 为每个注释行创建 CodeLens
            for (let idx = 0; idx < commentLines.length; idx++) {
                const startLine = commentLines[idx];

                // 计算代码块结束行：到下一个注释行之前，或到 Scene 结束
                let endLine: number;
                if (idx < commentLines.length - 1) {
                    // 下一个注释行的前一行
                    endLine = commentLines[idx + 1] - 1;
                } else {
                    // 最后一个注释区块：到 Scene 结束前的最后一个非空行
                    endLine = nextSceneStart - 1;
                    // 跳过末尾的空行
                    while (endLine > startLine && lines[endLine].trim() === '') {
                        endLine--;
                    }
                }

                const lineCount = endLine - startLine + 1;
                const commentText = lines[startLine].trimStart();

                // 根据状态显示不同图标
                let title: string;
                let tooltip: string;
                let command: string;
                let args: (string | number)[];

                if (!isSceneStarted) {
                    // 场景未启动，显示 RunScene
                    title = '▶ Run Scene';
                    tooltip = `运行 ${scene.name} 后解锁 checkpoint`;
                    command = 'maningl-preview.runScene';
                    // 传递 checkpoint 索引，启动后直接解锁到这里
                    args = [scene.constructLineNumber, scene.name, idx, totalCheckpoints];
                } else {
                    // 场景已启动，检查 checkpoint 状态
                    const isExecuted = checkpointState.isExecuted(scene.name, idx);
                    const isUnlocked = checkpointState.isUnlocked(scene.name, idx);

                    if (isExecuted) {
                        // 已执行
                        title = '✅ CheckpointPaste';
                        tooltip = `已执行: ${commentText} (${lineCount} lines) - 点击重新执行`;
                    } else if (isUnlocked) {
                        // 已解锁，可执行
                        title = '▶ CheckpointPaste';
                        tooltip = `checkpoint_paste: ${commentText} (${lineCount} lines)`;
                    } else {
                        // 锁定
                        title = '🔒 CheckpointPaste';
                        tooltip = `锁定: ${commentText} (${lineCount} lines) - 点击解锁`;
                    }
                    command = 'maningl-preview.runCheckpointFromComment';
                    args = [startLine, endLine, scene.name, idx, totalCheckpoints];
                }

                const range = new vscode.Range(startLine, 0, startLine, 0);
                codeLenses.push(new vscode.CodeLens(range, {
                    title,
                    tooltip,
                    command,
                    arguments: args,
                }));
            }
        }

        return codeLenses;
    }
}
