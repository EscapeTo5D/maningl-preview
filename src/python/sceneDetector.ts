/**
 * Python Scene 类检测器
 */

import * as vscode from 'vscode';
import type { SceneInfo } from '../types/manim';

/**
 * 检测当前光标位置的 Scene 类
 * @returns 检测到的 Scene 信息，如果未找到则返回 null
 */
export function detectCurrentScene(document: vscode.TextDocument, cursorLine: number): SceneInfo | null {
  const scenes = detectAllScenes(document);

  // 向后查找光标之前的最后一个 Scene
  for (let i = scenes.length - 1; i >= 0; i--) {
    if (scenes[i].lineNumber <= cursorLine) {
      return scenes[i];
    }
  }

  return null;
}

/**
 * 检测文件中的所有 Scene 类
 * @returns 所有 Scene 类的信息
 */
export function detectAllScenes(document: vscode.TextDocument): SceneInfo[] {
  const text = document.getText();
  const lines = text.split('\n');
  const scenes: SceneInfo[] = [];

  // 匹配 class ClassName(Scene): 或 class ClassName(MovingCameraScene):
  // 支持所有包含 "Scene" 的基类
  const regex = /^\s*class\s+(\w+)\s*\(([^)]*Scene[^)]*)\)\s*:/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(regex);
    if (match) {
      scenes.push({
        name: match[1],
        lineNumber: i,
        baseClass: match[2].trim(),
      });
    }
  }

  return scenes;
}

/**
 * 获取编辑器当前选中的文本
 * @returns 选中的文本，如果没有选中则返回空字符串
 */
export function getSelectedText(editor: vscode.TextEditor): string {
  const selection = editor.selection;
  if (selection.isEmpty) {
    return '';
  }
  return editor.document.getText(selection);
}
