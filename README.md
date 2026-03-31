# Claude Code Visible

一个零依赖静态页面项目，用可视化方式解释 Claude Code 的运行机制，目标是做到：

- 不读还原源码，也能理解 Claude Code 的主执行链路
- 直接看清楚 MCP、Skill、Plugin、Coordinator 分别处在哪一层
- 知道如果只读少数关键文件，应该先看哪些

## 内容覆盖

页面主要围绕 `ChinaSiro/claude-code-sourcemap` 中还原出的结构做了 3 件事：

1. 把 Claude Code 的启动链路拆成可点击阶段
2. 把“一次用户请求”从输入到工具执行再到消息回流的过程串起来
3. 把扩展系统拆成 Skill / Plugin / MCP / Coordinator 四类

## 项目结构

```text
.
├── index.html
├── styles.css
├── app.js
└── LICENSE
```

## 本地打开

最简单的方法是直接打开 `index.html`。

如果你想用本地静态服务：

```bash
cd claude-code-visible
python3 -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 这份可视化聚焦的关键源码入口

- `restored-src/src/entrypoints/cli.tsx`
- `restored-src/src/main.tsx`
- `restored-src/src/replLauncher.tsx`
- `restored-src/src/screens/REPL.tsx`
- `restored-src/src/QueryEngine.ts`
- `restored-src/src/query.ts`
- `restored-src/src/Tool.ts`
- `restored-src/src/tools.ts`
- `restored-src/src/skills/loadSkillsDir.ts`
- `restored-src/src/services/mcp/client.ts`
- `restored-src/src/plugins/builtinPlugins.ts`
- `restored-src/src/coordinator/coordinatorMode.ts`

## 说明

这不是 Claude Code 官方仓库的原始可视化文档，而是基于还原版 sourcemap 仓库做的结构化讲解页面。
