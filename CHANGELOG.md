# Change Log

All notable changes to the "maningl-preview" extension will be documented in this file.

## [0.1.0] - 2025-02-12

### Added
- **CodeLens 可视化** - 在 `construct` 方法和注释行上方显示操作按钮
- **Checkpoint 顺序执行** - 支持 🔒 → ▶ → ✅ 的顺序解锁执行流程
- **选中执行** - 选中部分代码后点击 Checkpoint 按钮执行选中内容
- **Checkpoint 状态管理** - 独立的状态管理模块跟踪 checkpoint 进度
- **从 Checkpoint 位置启动** - 从记录点启动 Scene 时自动添加 `-se` 参数并解锁到该位置
- **退出自动关闭终端** - 退出 Scene 时自动关闭终端并重置所有 checkpoint 状态
- **空行剔除** - 执行 checkpoint 时自动剔除空行
- **注释验证** - 选中执行时验证注释只允许出现在第一行
- **插件图标** - 添加 Logo.png 作为扩展图标

### Changed
- Checkpoint Paste 命令格式改为 `checkpoint_paste() # comment (N lines)`

## [0.0.2] - 2025-02-05

### Added
- 复制相机状态功能
- ManimGL 路径自动检测

## [0.0.1] - 初始版本

### Added
- 运行 Scene 命令
- Checkpoint Paste 基本功能
- 终端管理
- 配置选项