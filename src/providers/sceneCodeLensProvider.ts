/**
 * Scene CodeLens Provider
 * 在 Scene 类定义上方显示 "▶ Run Scene" 按钮
 */

import * as vscode from 'vscode';
import { detectAllScenes } from '../python/sceneDetector';

export class SceneCodeLensProvider implements vscode.CodeLensProvider {

    /**
     * 提供 CodeLens
     */
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
        // 只处理 Python 文件
        if (document.languageId !== 'python') {
            return [];
        }

        const scenes = detectAllScenes(document);

        return scenes.map(scene => {
            // CodeLens 显示在 def construct(self): 行
            const range = new vscode.Range(scene.constructLineNumber, 0, scene.constructLineNumber, 0);

            return new vscode.CodeLens(range, {
                title: '▶ Run Scene',
                tooltip: `运行 ${scene.name} (Ctrl+Shift+R)`,
                command: 'maningl-preview.runScene',
                arguments: [scene.constructLineNumber],  // 传递 construct 行号
            });
        });
    }
}
