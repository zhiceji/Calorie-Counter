# Learnings Log

## [LRN-20250424-001] best_practice

**Logged**: 2026-04-24T22:37:00+08:00
**Priority**: high
**Status**: resolved
**Area**: config

### Summary
Android ColorOS/Realme UI 系统强制覆盖状态栏图标颜色，解决方案是使用 WindowInsetsControllerCompat 并移除 Capacitor StatusBar 插件冲突

### Details
在 ColorOS 16 系统上，状态栏图标（信号、电量等）始终显示为白色，无法通过常规方法改为深色。经过多次尝试，发现以下方案有效：

1. **MainActivity.java** 使用 `WindowInsetsControllerCompat`：
   ```java
   WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
   getWindow().setStatusBarColor(Color.TRANSPARENT);
   WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
   controller.setAppearanceLightStatusBars(true);
   ```

2. **styles.xml** 父主题改为 `Theme.AppCompat.NoActionBar`（不使用 Light 主题），移除 `windowLightStatusBar` 属性

3. **App.tsx** 移除 Capacitor StatusBar 插件调用，避免冲突覆盖

### Suggested Action
在 ColorOS/Realme UI 等定制 ROM 上调试状态栏时：
- 优先使用 `WindowInsetsControllerCompat` 而非旧版 API
- 确保 Capacitor StatusBar 插件不会覆盖原生代码设置
- 主题使用纯净的 NoActionBar 而非 Light 变体

### Metadata
- Source: user_feedback
- Related Files: 
  - android/app/src/main/java/com/calorie/counter/MainActivity.java
  - android/app/src/main/res/values/styles.xml
  - src/App.tsx
- Tags: android, statusbar, coloros, capacitor
- Pattern-Key: android.statusbar.coloros_light_icons

---

## [LRN-20250424-002] best_practice

**Logged**: 2026-04-24T22:37:00+08:00
**Priority**: medium
**Status**: resolved
**Area**: config

### Summary
打包 APK 时 updateChecker.ts 中的 CURRENT_VERSION 必须同步更新

### Details
每次修改代码并打包新版本 APK 后，需要同步更新 `src/lib/updateChecker.ts` 中的 `CURRENT_VERSION` 常量，否则用户看到的版本号与实际不符。

### Suggested Action
打包 APK 前，检查并更新以下两处版本号：
1. `android/app/build.gradle` - `versionName` 和 `versionCode`
2. `src/lib/updateChecker.ts` - `CURRENT_VERSION`

### Metadata
- Source: user_feedback
- Related Files: 
  - android/app/build.gradle
  - src/lib/updateChecker.ts
- Tags: version, android, build
- Pattern-Key: android.version_sync

---

