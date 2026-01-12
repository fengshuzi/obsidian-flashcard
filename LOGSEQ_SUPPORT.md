# Logseq 闪卡格式支持

本插件已修改以支持 Logseq 的 `#flashcard` 标签格式。

## Logseq 闪卡格式

```markdown
- What is the capital of France? #flashcard
  Paris
<!--SR:!2025-12-22,4,270-->
```

### 格式说明

1. **问题行**: 以 `- ` 开头，包含 `#flashcard` 标签
2. **答案行**: 缩进的子项（比问题行缩进更深）
3. **调度信息**: `<!--SR:!日期,间隔,难度-->` 格式的 HTML 注释

## 修改的文件

### 1. `src/settings.ts`
- 在 `flashcardTags` 默认值中添加了 `#flashcard`

### 2. `src/parser.ts`
- 添加了 `hasLogseqFlashcardTag()` 函数检测 `#flashcard` 标签
- 添加了 `isLogseqListItem()` 函数检测 Logseq 列表项
- 添加了 `getLogseqIndentLevel()` 函数获取缩进级别
- 在 `parse()` 函数中添加了 Logseq 格式的解析逻辑

### 3. `src/question-type.ts`
- 修改了 `QuestionTypeMultiLineBasic` 类
- 添加了 `expandLogseqFormat()` 方法处理 Logseq 格式的问答分离

## 兼容性

- 保留了原有的 `::` 分隔符格式支持
- 保留了原有的 `?` 多行分隔符格式支持
- 新增 Logseq `#flashcard` 标签格式支持

## 构建

```bash
cd obsidian-spaced-repetition
pnpm install
pnpm run build
```

## 使用

1. 将构建后的 `main.js`、`manifest.json`、`styles.css` 复制到 Obsidian 插件目录
2. 在 Obsidian 中启用插件
3. 打开包含 `#flashcard` 标签的 Logseq 笔记
4. 使用插件的复习功能
