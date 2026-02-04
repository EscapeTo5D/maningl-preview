/**
 * 配置管理模块
 */

import * as vscode from 'vscode';

/**
 * 配置接口
 */
export interface ManimConfig {
  manimglPath: string;
  terminalName: string;
  autoSave: boolean;
  copyCommandToClipboard: boolean;
  projectRoot: string;
  pythonPath: string;
}

/**
 * 获取配置
 */
export function getConfiguration(): ManimConfig {
  const config = vscode.workspace.getConfiguration('maningl');

  return {
    manimglPath: config.get<string>('manimglPath', 'manimgl'),
    terminalName: config.get<string>('terminalName', 'ManimGL Terminal'),
    autoSave: config.get<boolean>('autoSave', true),
    copyCommandToClipboard: config.get<boolean>('copyCommandToClipboard', true),
    projectRoot: config.get<string>('projectRoot', ''),
    pythonPath: config.get<string>('pythonPath', ''),
  };
}

