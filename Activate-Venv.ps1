# 智能 ManimGL 虚拟环境激活脚本
# 将此脚本添加到你的 PowerShell 配置中

function Activate-ManimVenv {
    param(
        [string]$StartPath = (Get-Location).Path
    )

    # 向上查找 .venv 目录（最多查找 5 级）
    $currentPath = $StartPath
    $venvPath = $null

    for ($i = 0; $i -lt 5; $i++) {
        $testPath = Join-Path $currentPath ".venv"

        if (Test-Path $testPath) {
            $venvPath = Join-Path $testPath "Scripts\Activate.ps1"
            break
        }

        $parentPath = Split-Path $currentPath -Parent
        if ($parentPath -eq $currentPath) {
            break
        }
        $currentPath = $parentPath
    }

    # 如果找到了虚拟环境，激活它
    if ($venvPath -and (Test-Path $venvPath)) {
        & $venvPath
        Write-Host "✅ 虚拟环境已激活" -ForegroundColor Green
    } else {
        Write-Host "❌ 未找到 .venv 目录" -ForegroundColor Red
    }
}

# 创建别名
Set-Alias venv Activate-ManimVenv

# 如果当前在 manimg 项目根目录，可以直接运行
# 检查是否在 manimg 项目中
$currentDir = (Get-Location).Path
if ($currentDir -like "*manimg*") {
    # 在项目根目录
    function Activate-ManimVenv {
        & ".\Scripts\Activate.ps1"
    }
}
