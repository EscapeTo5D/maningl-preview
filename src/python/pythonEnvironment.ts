/**
 * Python 环境服务 - 使用 VS Code Python Extension API 自动检测环境
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PythonExtension, ResolvedEnvironment } from '@vscode/python-extension';

// Windows: Scripts, Unix: bin
const PYTHON_SCRIPTS_FOLDER: Record<string, string> = {
    win32: 'Scripts',
    darwin: 'bin',
    linux: 'bin',
};

/**
 * Python 环境服务类
 */
export class PythonEnvironmentService {
    private static instance: PythonEnvironmentService;
    private pythonApi: PythonExtension | undefined;
    private initialized = false;

    private constructor() { }

    /**
     * 获取单例实例
     */
    static getInstance(): PythonEnvironmentService {
        if (!PythonEnvironmentService.instance) {
            PythonEnvironmentService.instance = new PythonEnvironmentService();
        }
        return PythonEnvironmentService.instance;
    }

    /**
     * 初始化 Python Extension API
     */
    private async initialize(): Promise<boolean> {
        if (this.initialized) {
            return this.pythonApi !== undefined;
        }

        try {
            this.pythonApi = await PythonExtension.api();
            this.initialized = true;
            return true;
        } catch (error) {
            console.warn('无法加载 Python Extension API:', error);
            this.initialized = true;
            return false;
        }
    }

    /**
     * 获取当前活动的 Python 环境
     */
    private async getActiveEnvironment(): Promise<ResolvedEnvironment | undefined> {
        const hasApi = await this.initialize();
        console.log('[ManimGL] Python Extension API 可用:', hasApi);

        if (!hasApi || !this.pythonApi) {
            console.log('[ManimGL] Python Extension API 未加载');
            return undefined;
        }

        try {
            const environmentPath = this.pythonApi.environments.getActiveEnvironmentPath();
            console.log('[ManimGL] 活动环境路径:', JSON.stringify(environmentPath));

            const environment = await this.pythonApi.environments.resolveEnvironment(environmentPath);
            console.log('[ManimGL] 解析后的环境:', environment ? '成功' : '失败');

            if (environment?.environment?.folderUri) {
                console.log('[ManimGL] 环境目录:', environment.environment.folderUri.fsPath);
            } else {
                console.log('[ManimGL] 环境目录: 未找到 (folderUri 为空)');
            }

            return environment;
        } catch (error) {
            console.warn('[ManimGL] 获取 Python 环境失败:', error);
            return undefined;
        }
    }

    /**
     * 检查 VS Code 是否会在终端中自动激活 Python 环境
     */
    private isTerminalAutoActivateEnabled(): boolean {
        const pythonConfig = vscode.workspace.getConfiguration('python');
        // 默认为 true
        return pythonConfig.get<boolean>('terminal.activateEnvironment', true);
    }

    /**
     * 获取 ManimGL 可执行文件路径
     * 优先级: 用户配置绝对路径 > 终端自动激活 (manimgl) > Python Extension API (完整路径)
     * @returns { path: string, mode: string, needsConfig: boolean } 路径、检测模式、是否需要配置
     */
    async getManimglPath(configManimglPath: string): Promise<{ path: string; mode: string; needsConfig: boolean }> {
        // 1. 如果用户配置了绝对路径，直接使用
        if (path.isAbsolute(configManimglPath)) {
            console.log('[ManimGL] 使用模式: 用户配置');
            return { path: configManimglPath, mode: '用户配置', needsConfig: false };
        }

        // 2. 检查 VS Code 是否会自动激活环境
        if (this.isTerminalAutoActivateEnabled()) {
            console.log('[ManimGL] 使用模式: 终端激活 (VS Code 自动激活已启用)');
            return { path: configManimglPath, mode: '终端激活', needsConfig: false };
        }

        // 3. VS Code 不会自动激活，使用 Python Extension API 获取完整路径
        console.log('[ManimGL] 终端自动激活未启用，尝试 Python Extension API...');
        const environment = await this.getActiveEnvironment();

        if (environment?.executable?.uri) {
            const pythonExePath = environment.executable.uri.fsPath;
            const scriptsDir = path.dirname(pythonExePath);
            const manimglPath = path.join(scriptsDir, configManimglPath);
            const fullPath = process.platform === 'win32' && !manimglPath.endsWith('.exe')
                ? manimglPath + '.exe'
                : manimglPath;

            if (fs.existsSync(fullPath)) {
                const envName = environment.environment?.name || path.basename(path.dirname(scriptsDir));
                console.log('[ManimGL] 使用模式: API (' + envName + ')');
                return { path: fullPath, mode: `API (${envName})`, needsConfig: false };
            }
        }

        // 4. 都找不到，提示用户配置
        console.log('[ManimGL] 未找到 manimgl，需要配置');
        return { path: configManimglPath, mode: '未找到', needsConfig: true };
    }
}
