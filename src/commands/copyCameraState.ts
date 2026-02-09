/**
 * 复制相机状态命令
 * 将当前 ManimGL 交互界面的相机角度复制到剪贴板
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { TerminalManager } from '../terminal/terminalManager';
import { getConfiguration } from '../config/configuration';

/**
 * 发送命令到终端，获取相机状态并复制到剪贴板
 */
export async function copyCameraState(): Promise<void> {
    const terminalManager = TerminalManager.getInstance();
    const config = getConfiguration();

    // 1. 创建临时 Python 脚本
    const tempDir = os.tmpdir();
    // 使用正斜杠避免 Windows 路径转义问题
    const scriptPath = path.join(tempDir, 'manim_preview_copy_cam.py').split(path.sep).join('/');

    // 【核心魔法】清除上一行显示
    // \\033[A = 光标上移一行
    // \\033[2K = 清除整行
    const pythonScript = `
import sys
# 这会让终端里的 "exec(open(...)...)" 瞬间消失
print("\\033[A\\033[2K", end="", flush=True)

try:
    import numpy as n, pyperclip
    f = self.camera.frame
    a = f.get_euler_angles()
    c = f.get_center()
    h = f.get_height()
    
    # 计算相机参数 (reorient格式，无前缀)
    cmd = f"reorient({n.degrees(a[0]):.1f}, {n.degrees(a[1]):.1f}, {n.degrees(a[2]):.1f}, ({c[0]:.2f}, {c[1]:.2f}, {c[2]:.2f}), {h:.2f})"
    
    # 复制到剪贴板
    pyperclip.copy(cmd)
    
    # 打印结果（用 \\r 确保光标回到行首）
    print(f"\\r{cmd}")

except Exception as e:
    # 如果出错，打印错误信息
    print(f"\\r❌ Error: {e}")
`;

    try {
        fs.writeFileSync(scriptPath, pythonScript);
    } catch (error) {
        console.error('Failed to write temporary python script:', error);
        vscode.window.showErrorMessage('Failed to create temporary script for camera state copy.');
        return;
    }

    // 2. 发送命令执行该脚本
    // 使用 exec(open(...).read()) 是最通用的
    const command = `exec(open("${scriptPath}", encoding="utf-8").read())`;

    terminalManager.sendText(command, config);
}
