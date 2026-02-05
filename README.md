# ManimGL Preview - VS Code 扩展

为 ManimGL 动画制作提供实时预览和开发工具的 VS Code 扩展。

## 功能特性

- ✅ **运行 Scene** - 自动检测并运行当前光标位置的 Scene 类
- ✅ **Checkpoint Paste** - 将选中的代码发送到 ManimGL 终端
- ✅ **多种 Checkpoint 模式** - 支持普通、录制、跳过三种模式
- ✅ **终端管理** - 自动创建和复用 ManimGL 终端
- ✅ **配置灵活** - 可配置 Python 路径、命令等

## 安装

### 从源码安装

1. 克隆仓库到本地
2. 安装依赖：`npm install`
3. 编译：`npm run compile`
4. 按 F5 启动调试（会打开新的 VS Code 窗口）

### 打包安装

运行：`npm run package`

生成的 `.vsix` 文件可以在 VS Code 中安装。

## 使用方法

### 1. 运行 Scene

在 Python 文件中：

- **快捷键**：`Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (macOS)
- **命令面板**：`Ctrl+Shift+P` → 输入 "Manim: Run Current Scene"
- **右键菜单**：在编辑器中右键 → "Manim: Run Current Scene"

**功能**：
- 自动检测光标所在的 Scene 类
- 如果光标不在 Scene 定义行，会添加 `-se` 参数从指定行开始渲染
- 自动保存文件（可配置）
- 可选复制命令到剪贴板

### 2. Checkpoint Paste

选中要测试的代码后：

- **快捷键**：`Alt+Shift+C` (Windows/Linux) 或 `Cmd+Shift+C` (macOS)
- **命令面板**：`Ctrl+Shift+P` → 输入 "Manim: Checkpoint Paste"
- **右键菜单**：选中代码后右键 → "Manim: Checkpoint Paste"

**功能**：
- 将选中的代码复制到剪贴板
- 向终端发送 `checkpoint_paste()` 命令
- ManimGL 会从剪贴板读取代码并执行

### 3. Checkpoint Paste with Record

用于需要录制的场景：

- **快捷键**：`Ctrl+Shift+Alt+R` (Windows/Linux) 或 `Cmd+Shift+Alt+R` (macOS)
- 向终端发送 `checkpoint_paste(record=True)`

### 4. Checkpoint Paste with Skip

跳过某些代码：

- **命令面板**：`Ctrl+Shift+P` → 输入 "Manim: Checkpoint Paste with Skip"
- 向终端发送 `checkpoint_paste(skip=True)`

### 5. 退出 Scene

- **快捷键**：`Ctrl+Shift+Q` (Windows/Linux) 或 `Cmd+Shift+Q` (macOS)
- **命令面板**：`Ctrl+Shift+P` → 输入 "Manim: Exit Scene"

## 配置选项

在 VS Code 设置中搜索 "ManimGL" 或在 `settings.json` 中配置：

```json
{
  // Python 可执行文件路径
  "maningl.pythonPath": "python",

  // ManimGL 命令（manimgl 或 manim）
  "maningl.command": "manimgl",

  // 终端名称
  "maningl.terminalName": "ManimGL Terminal",

  // 运行前自动保存
  "maningl.autoSave": true,

  // 复制命令到剪贴板
  "maningl.copyCommandToClipboard": true
}
```

## 工作流程示例

### 基本动画开发流程

1. **编写 Scene 代码**：
   ```python
   from manim import *

   class MyScene(Scene):
       def construct(self):
           circle = Circle()
           self.play(Create(circle))
   ```

2. **运行 Scene**：按 `Ctrl+Shift+R`

3. **迭代开发**：
   - 选中要修改的代码
   - 按 `Alt+Shift+C` 发送到终端
   - ManimGL 会重新渲染这部分

4. **录制最终版本**：
   - 选中代码
   - 按 `Ctrl+Shift+Alt+R` 使用录制模式

## Scene 检测规则

扩展会查找符合以下规则的类定义：

- 继承自 `Scene` 的类：`class MyScene(Scene):`
- 继承自 Scene 子类的类：`class MyScene(MovingCameraScene):`
- 所有包含 "Scene" 的基类

**光标位置逻辑**：
- 如果光标在 Scene 类内部，运行该 Scene
- 如果光标在多个 Scene 之间，运行光标之前最近的 Scene

## 文件结构

```
maningl-preview/
├── src/
│   ├── extension.ts              # 主入口
│   ├── commands/                 # 命令处理器
│   │   ├── runScene.ts
│   │   ├── checkpointPaste.ts
│   │   └── exitScene.ts
│   ├── python/
│   │   └── sceneDetector.ts      # Scene 检测
│   ├── terminal/
│   │   └── terminalManager.ts    # 终端管理
│   ├── config/
│   │   └── configuration.ts      # 配置管理
│   └── types/
│       └── manim.ts              # 类型定义
├── package.json
└── README.md
```

## 开发

### 编译

```bash
npm run compile
```

### 监听模式

```bash
npm run watch
```

### 运行测试

```bash
npm run test
```

## 致谢

本扩展灵感来自 3Blue1Brown (Grant Sanderson) 的 Sublime Text 自定义命令插件。

## 许可证

MIT
