/**
 * ManimGL 相关类型定义
 */

/**
 * Scene 类信息
 */
export interface SceneInfo {
  /** Scene 类名 */
  name: string;
  /** 类定义行号（从 0 开始） */
  lineNumber: number;
  /** construct 方法行号（从 0 开始） */
  constructLineNumber: number;
  /** 基类名称（如 Scene, MovingCameraScene） */
  baseClass: string;
}

/**
 * 运行 Scene 的选项
 */
export interface RunSceneOptions {
  /** Python 文件路径 */
  filePath: string;
  /** Scene 名称 */
  sceneName: string;
  /** 起始行号（可选，用于 -se 参数） */
  fromLine?: number;
}

/**
 * Checkpoint Paste 选项
 */
export interface CheckpointPasteOptions {
  /** 是否录制 */
  record?: boolean;
  /** 是否跳过 */
  skip?: boolean;
}
