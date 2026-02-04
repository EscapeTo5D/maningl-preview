/**
 * 运行 ManimGL Scene 命令
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { detectCurrentScene } from '../python/sceneDetector';
import { getConfiguration } from '../config/configuration';
import { TerminalManager } from '../terminal/terminalManager';
import { PythonEnvironmentService } from '../python/pythonEnvironment';
import type { RunSceneOptions } from '../types/manim';

/**
 * 在工作区内查找包含 custom_config.yml 的目录
 * 如果找不到，返回工作区根目录
 */
function findProjectRoot(fileDir: string): string {
  // 获取工作区根目录
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fileDir));
  const workspaceRoot = workspaceFolder?.uri.fsPath;

  // 如果没有工作区，返回文件所在目录
  if (!workspaceRoot) {
    return fileDir;
  }

  // 从文件目录向上搜索，但不超过工作区根目录
  let currentDir = fileDir;

  while (currentDir.startsWith(workspaceRoot)) {
    const configPath = path.join(currentDir, 'custom_config.yml');
    if (fs.existsSync(configPath)) {
      return currentDir;  // 找到 custom_config.yml，返回该目录
    }

    // 如果已到达工作区根目录，停止搜索
    if (currentDir === workspaceRoot) {
      break;
    }

    // 向上一级目录
    currentDir = path.dirname(currentDir);
  }

  // 没找到 custom_config.yml，返回工作区根目录
  return workspaceRoot;
}

/**
 * 运行当前 Scene
 */
export async function runScene(): Promise<void> {
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

  // 获取光标位置
  const cursorLine = editor.selection.active.line;

  // 检测 Scene
  const scene = detectCurrentScene(document, cursorLine);
  if (!scene) {
    vscode.window.showErrorMessage('未找到有效的 Scene 定义');
    return;
  }

  // 自动保存
  const config = getConfiguration();
  if (config.autoSave) {
    await document.save();
  }

  // 构建命令选项
  const options: RunSceneOptions = {
    filePath: document.fileName,
    sceneName: scene.name,
  };

  // 如果光标不在 Scene 定义行，添加 -se 参数
  if (cursorLine !== scene.lineNumber) {
    options.fromLine = cursorLine + 1; // manimgl 的行号从 1 开始
  }

  // 获取文件所在目录
  const fileDir = path.dirname(document.fileName);

  // 获取项目根目录：优先使用配置，否则自动搜索
  const projectRoot = config.projectRoot || findProjectRoot(fileDir);

  // 获取 manimgl 路径（自动检测或使用配置）
  const pythonEnvService = PythonEnvironmentService.getInstance();
  const manimglResult = await pythonEnvService.getManimglPath(config.manimglPath);

  // 如果未找到 manimgl，提示用户配置
  if (manimglResult.needsConfig) {
    const action = await vscode.window.showWarningMessage(
      '未找到 manimgl，请配置路径或启用终端自动激活环境',
      '打开设置',
      '选择 Python 环境'
    );
    if (action === '打开设置') {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'maningl.manimglPath');
    } else if (action === '选择 Python 环境') {
      await vscode.commands.executeCommand('python.setInterpreter');
    }
    return;
  }

  // 构建命令
  const command = buildManimCommand(options, manimglResult.path);

  // 复制到剪贴板
  if (config.copyCommandToClipboard) {
    await vscode.env.clipboard.writeText(command);
  }

  // 发送到终端（使用项目根目录作为工作目录，传递配置用于 PYTHONPATH）
  const terminalManager = TerminalManager.getInstance();
  terminalManager.sendText(command, config, projectRoot);

  // 显示简短通知（包含检测模式）
  vscode.window.showInformationMessage(`[${manimglResult.mode}] 运行: ${scene.name}`, 'hide');
}

/**
 * 构建 manimgl 命令
 * 直接使用 manimgl 可执行文件
 */
function buildManimCommand(options: RunSceneOptions, manimglPath: string): string {
  const parts: string[] = [];

  // manimgl 可执行文件路径（如果包含空格则加引号）
  if (manimglPath.includes(' ')) {
    parts.push(`"${manimglPath}"`);
  } else {
    parts.push(manimglPath);
  }

  // 文件路径（始终用引号包裹）
  parts.push(`"${options.filePath}"`);

  // Scene 名称
  parts.push(options.sceneName);

  // -se 参数（如果指定了起始行）
  if (options.fromLine) {
    parts.push(`-se ${options.fromLine}`);
  }

  // 添加进入交互模式的参数
  parts.push('--prerun');

  return parts.join(' ');
}

