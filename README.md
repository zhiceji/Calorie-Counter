# 卡路里计数器

一款基于 AI 的饮食管理应用，使用自然语言识别食物热量和营养成分。本地存储保护隐私，毫秒级响应。


## 功能特点

- **AI 智能识别**：输入食物名称，自动识别热量和碳水/蛋白质/脂肪
- **本地存储**：所有数据存储在本地，保护隐私
- **热量统计**：每日目标设定，追踪摄入与消耗
- **宏量营养素**：直观查看碳水、蛋白质、脂肪摄入进度
- **组间休息计时器**：健身辅助，记录组数和休息时间
- **周报统计**：查看一周的饮食和运动数据

## 技术栈

- React + TypeScript + Tailwind CSS
- Vite 构建工具
- Capacitor 打包为 Android 应用
- DeepSeek API 提供 AI 识别能力

## 运行项目

**环境要求**：Node.js

1. 安装依赖：
   ```bash
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

## 打包 APK

1. 构建 Web 应用：
   ```bash
   npm run build
   ```

2. 同步到 Android：
   ```bash
   npx cap sync android
   ```

3. 打包 APK：
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

APK 文件位于：`android/app/build/outputs/apk/debug/`

## API 配置

首次使用需要在应用内配置 DeepSeek API 密钥（点击右上角用户图标）。

获取 API Key：https://platform.deepseek.com/

## 更新日志

### v1.0.14 (2026-04-24)
- 修复系统状态栏图标颜色显示问题
- 日历条位置微调优化
