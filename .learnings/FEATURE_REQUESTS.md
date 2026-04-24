# Feature Requests

## [FEAT-20260423-001] apk_naming_convention

**Logged**: 2026-04-23T18:14:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: config

### Requested Capability
APK 文件命名规则：使用 `{应用名}_v{版本号}.apk` 格式，替代默认的 `app-debug.apk`

### User Context
用户希望 APK 文件名更清晰，便于版本管理

### Complexity Estimate
simple

### Suggested Implementation
在 `android/app/build.gradle` 中添加 `applicationVariants.all` 配置：

```groovy
applicationVariants.all {
    def appName = "应用名称"
    outputs.all {
        def outputFile = it.outputFile
        if (outputFile != null && outputFile.name.endsWith('.apk')) {
            def fileName = "${appName}_v${versionName}.apk"
            outputFileName = fileName
        }
    }
}
```

### Resolution
- **Resolved**: 2026-04-23T18:14:00+08:00
- **Commit**: 已写入 android/app/build.gradle
- **Also**: 已更新 apk-packager skill 文件

### Metadata
- Frequency: first_time
- Related Features: apk-packager skill

---
