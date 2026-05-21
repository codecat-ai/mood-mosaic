# Mood Mosaic

[English](README.md) | [简体中文](README-zh.md) | [日本語](README-ja.md)

Mood Mosaic 是一个本地优先的情绪、精力和专注度日志，适合学生、创作者、远程工作者和引导师在不注册账号、不使用云同步的情况下进行私人反思。

## 问题

许多情绪应用依赖账号、云存储，或带有诊断导向的表达。习惯追踪器常常过于数字化，而电子表格又不适合快速记录每日背景。Mood Mosaic 将数据保存在浏览器中，并把简短的每日记录变成易读的日历马赛克和摘要。

## 功能

- 每个日期添加或更新一条记录，包含情绪、精力、专注度和短备注。
- 查看按日期排序的彩色马赛克、类似每周回顾的平均值、情绪计数和连续记录天数。
- 复制简洁的反思摘要，用于日志、教练沟通或例行检查。
- 从浏览器导出和导入 JSON 备份。
- 校验记录和导入内容，遇到无效或旧版数据时不会崩溃。
- 生产构建后完全在客户端运行。

## 从源码安装

Mood Mosaic 未发布到包注册表。请使用源码检出：

```bash
git clone <repository-url>
cd mood-mosaic
npm ci
```

## 快速开始

```bash
npm run dev
```

打开 Vite 输出的本地地址。填写今天的情绪、精力、专注度和备注，然后通过马赛克和摘要面板查看近期模式。

## 示例

记录示例：

```json
{
  "date": "2026-05-21",
  "mood": "focused",
  "energy": 4,
  "focus": 5,
  "note": "Finished the project draft",
  "schemaVersion": 1
}
```

备份示例：

```json
{
  "schemaVersion": 1,
  "entries": []
}
```

## 配置

项目没有账号、服务器或云端配置。数据存储在浏览器 LocalStorage 的 `mood-mosaic:journal` 键下。如果需要便携备份或迁移浏览器，请定期导出 JSON。

## 开发

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

核心模型在 `src/journal.ts`，分析逻辑在 `src/summary.ts`，存储适配器在 `src/storage.ts`，React UI 在 `src/App.tsx`。

## 测试

测试覆盖校验和 upsert 行为、分析和马赛克排序、存储导入导出处理、旧版 schema 规范化，以及 UI 冒烟流程。修改行为前应先写测试。

## 路线图

见 [ROADMAP.md](ROADMAP.md)。发布初期状态为活跃开发，优先做小而本地优先的改进，不做同步或医疗功能。

## 贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。贡献应保留本地优先的隐私模型，并避免诊断、危机指导、跟踪或包注册表安装说明。

## 许可证

MIT。见 [LICENSE](LICENSE)。

## AI 辅助维护

本项目可能使用 AI 工具辅助维护、审查和文档草稿。维护者仍负责验证变更、测试、许可和项目方向。
