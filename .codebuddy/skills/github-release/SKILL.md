---
name: github-release
description: |
  发布 GitHub Release 并上传 APK 文件。用于当用户说"发布"、"上传"、"更新Release"时触发。
  自动使用已保存的 GitHub Token 执行完整发布流程。
---

# GitHub Release 发布技能

## 前提条件

- GitHub Token：`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`
- gh CLI 路径：`C:\Program Files\GitHub CLI\gh.exe`（可选）

## 发布流程

### Step 1: 构建 APK

```powershell
cd "<项目路径>"
npm run build
npx cap sync android
Set-Location "android"; $env:JAVA_HOME="C:\jdk-21.0.5+11"; .\gradlew.bat assembleDebug
```

### Step 2: 提交并推送代码

```powershell
cd "<项目路径>"
git add -A
git commit -m "<版本信息>"
git push
```

### Step 3: 创建并推送 Git Tag

```powershell
cd "<项目路径>"
git tag -a v<版本号> -m "<发布说明>"
git push origin v<版本号>
```

### Step 4: 创建 Release 并上传 APK（使用 GitHub API）

```powershell
$token = "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"
$owner = "zhiceji"
$repo = "Calorie-Counter"
$version = "<版本号>"
$tag = "v$version"
$releaseNotes = "<发布说明>"
$apkPath = "<APK完整路径>"

# 创建 Release
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/releases" -Method POST -Headers @{"Authorization"="Bearer $token";"Accept"="application/vnd.github+json"} -ContentType "application/json" -Body (@{"tag_name"=$tag;"name"=$tag;"body"=$releaseNotes;"draft"=$false} | ConvertTo-Json)

# 上传 APK
$apkName = Split-Path $apkPath -Leaf
Invoke-RestMethod -Uri "https://uploads.github.com/repos/$owner/$repo/releases/$($release.id)/assets?name=$apkName" -Method POST -Headers @{"Authorization"="Bearer $token";"Accept"="application/vnd.github+json";"Content-Type"="application/octet-stream"} -ContentType "application/octet-stream" -InFile $apkPath
```

## 版本号同步

发布前确保以下文件版本号一致：
- `android/app/build.gradle` → `versionName`
- `src/lib/updateChecker.ts` → `CURRENT_VERSION`
- Git Tag → `v<版本号>`

## Calorie-Counter 项目路径

- 项目根目录：`K:\QQcodeAILib\Calorie Counter\Calorie-Counter`
- APK 输出路径：`android\app\build\outputs\apk\debug\`
- APK 文件名：`CalorieCounter_v<版本号>.apk`

## 触发词

- "发布"
- "上传"
- "更新Release"
- "发布 Release"
