# Learnings

## [LRN-20260423-001] user_preference_simplicity

**Logged**: 2026-04-23T18:16:00+08:00
**Priority**: medium
**Status**: pending
**Area**: frontend

### Summary
用户偏好简洁 UI，不需要的功能应及时移除

### Details
在 Calorie Counter 项目中，用户多次要求移除功能：
1. 拍照识别功能（DeepSeek OCR）- 用户认为环境不支持，要求完全移除
2. "结构平衡: 已优化"文字 - 用户认为占用空间，要求移除
3. UI 紧凑化 - 热量统计行（目标/摄入/运动/体重）需要强制单行显示，字号缩小

### Suggested Action
在开始新功能前，先确认用户是否真的需要该功能，避免添加后又被移除。

### Metadata
- Source: user_feedback
- Related Files: src/components/InputBar.tsx, src/components/Dashboard.tsx, src/lib/gemini.ts
- Tags: ui, user_preference, simplification

---
