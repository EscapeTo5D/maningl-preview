/**
 * Checkpoint 状态管理器
 * 跟踪每个场景的 checkpoint 解锁和执行状态
 */

import * as vscode from 'vscode';

interface SceneCheckpointState {
    /** 场景是否已启动（执行过 Run Scene） */
    started: boolean;
    /** 已解锁的最大索引（可以点击执行，但还未执行） */
    unlockedIndex: number;
    /** 已执行的最大索引 */
    executedIndex: number;
    /** 该场景的 checkpoint 总数 */
    totalCheckpoints: number;
}

class CheckpointStateManager {
    private static instance: CheckpointStateManager;

    /** 场景名 -> 状态 */
    private states: Map<string, SceneCheckpointState> = new Map();

    /** 用于触发 CodeLens 刷新的事件 */
    private _onDidChangeState = new vscode.EventEmitter<void>();
    readonly onDidChangeState = this._onDidChangeState.event;

    private constructor() { }

    static getInstance(): CheckpointStateManager {
        if (!CheckpointStateManager.instance) {
            CheckpointStateManager.instance = new CheckpointStateManager();
        }
        return CheckpointStateManager.instance;
    }

    /**
     * 检查场景是否已启动
     */
    isSceneStarted(sceneName: string): boolean {
        return this.states.get(sceneName)?.started ?? false;
    }

    /**
     * 标记场景为已启动（执行 Run Scene 时调用）
     */
    startScene(sceneName: string): void {
        const current = this.states.get(sceneName);
        this.states.set(sceneName, {
            started: true,
            unlockedIndex: current?.unlockedIndex ?? -1,
            executedIndex: current?.executedIndex ?? -1,
            totalCheckpoints: current?.totalCheckpoints ?? 0,
        });
        this._onDidChangeState.fire();
    }

    /**
     * 获取场景的解锁索引
     */
    getUnlockedIndex(sceneName: string): number {
        return this.states.get(sceneName)?.unlockedIndex ?? -1;
    }

    /**
     * 获取场景的已执行索引
     */
    getExecutedIndex(sceneName: string): number {
        return this.states.get(sceneName)?.executedIndex ?? -1;
    }

    /**
     * 检查指定索引的 checkpoint 是否已解锁（可执行）
     */
    isUnlocked(sceneName: string, index: number): boolean {
        const unlockedIndex = this.getUnlockedIndex(sceneName);
        const executedIndex = this.getExecutedIndex(sceneName);
        // 索引 0 始终可用，或者 index <= 已执行索引 + 1，或者 index <= 已解锁索引
        return index === 0 || index <= executedIndex + 1 || index <= unlockedIndex;
    }

    /**
     * 检查指定索引的 checkpoint 是否已执行
     */
    isExecuted(sceneName: string, index: number): boolean {
        return index <= this.getExecutedIndex(sceneName);
    }

    /**
     * 解锁到指定索引（不标记为已执行）
     */
    unlockTo(sceneName: string, index: number, totalCheckpoints: number): void {
        const current = this.states.get(sceneName);

        this.states.set(sceneName, {
            started: current?.started ?? false,
            unlockedIndex: Math.max(current?.unlockedIndex ?? -1, index),
            executedIndex: current?.executedIndex ?? -1,
            totalCheckpoints,
        });

        this._onDidChangeState.fire();
    }

    /**
     * 标记为已执行（同时解锁下一个）
     */
    markExecuted(sceneName: string, index: number, totalCheckpoints: number): void {
        const current = this.states.get(sceneName);

        this.states.set(sceneName, {
            started: current?.started ?? false,
            unlockedIndex: Math.max(current?.unlockedIndex ?? -1, index),
            executedIndex: Math.max(current?.executedIndex ?? -1, index),
            totalCheckpoints,
        });

        this._onDidChangeState.fire();
    }

    /**
     * 重置指定场景的状态
     */
    resetScene(sceneName: string): void {
        this.states.delete(sceneName);
        this._onDidChangeState.fire();
    }

    /**
     * 重置所有状态（预览窗口关闭时调用）
     */
    resetAll(): void {
        this.states.clear();
        this._onDidChangeState.fire();
    }

    /**
     * 清理资源
     */
    dispose(): void {
        this._onDidChangeState.dispose();
    }
}

export const checkpointState = CheckpointStateManager.getInstance();
