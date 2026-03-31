const views = [
  { id: "startup", label: "启动链路" },
  { id: "turn", label: "一轮请求" },
  { id: "extensions", label: "扩展挂载" },
];

const flowByView = {
  startup: [
    {
      phase: "CLI Entry",
      title: "入口分流与快路径",
      summary:
        "entrypoints/cli.tsx 先判断是不是 --version、MCP 子进程、remote-control、daemon、bridge、ssh 等特殊路径，尽量避免整套 CLI 全量加载。",
      importance:
        "这一层决定 Claude Code 不只是一个聊天 CLI，而是一个多模式启动器。",
      points: [
        "对 --version 这种极简命令走零依赖快路径。",
        "对 MCP / bridge / daemon / bg session 等能力做独立分流。",
        "只有真正进入主会话时，才动态 import 后续重模块。",
      ],
      files: [
        "restored-src/src/entrypoints/cli.tsx",
        "restored-src/src/entrypoints/mcp.ts",
      ],
    },
    {
      phase: "Main",
      title: "main.tsx 做初始化和参数总装",
      summary:
        "进入 main.tsx 后，Claude Code 会完成 commander 参数解析、配置迁移、环境变量应用、身份与会话上下文初始化，并决定交互式还是 headless 模式。",
      importance:
        "如果要理解 Claude Code 的全貌，main.tsx 是最关键的“装配厂”。",
      points: [
        "会区分 interactive、print、sdk-url、remote 等模式。",
        "会提前启动一些预取动作，比如 keychain、managed settings、GrowthBook。",
        "会把 permission mode、model、session、remote、worktree 这些系统级状态统一起来。",
      ],
      files: [
        "restored-src/src/main.tsx",
        "restored-src/src/setup.ts",
        "restored-src/src/bootstrap/state.ts",
      ],
    },
    {
      phase: "Assembly",
      title: "装配工具池、commands、skills、plugins、agents",
      summary:
        "main.tsx 在 setup 之后会调用 getTools()、getCommands()、initBundledSkills()、initBuiltinPlugins()、getAgentDefinitionsWithOverrides() 组出当前会话能用的能力集合。",
      importance:
        "模型最后看到什么工具、什么 slash command，不是写死的，而是运行期组装出来的。",
      points: [
        "tools.ts 定义内建工具全集，并按 feature flag / env / permission 过滤。",
        "skills 会从 .claude/skills、用户目录、managed 路径以及 bundled skill 中装入。",
        "plugin 可以额外带 skills、hooks、MCP servers。",
      ],
      files: [
        "restored-src/src/tools.ts",
        "restored-src/src/skills/loadSkillsDir.ts",
        "restored-src/src/plugins/builtinPlugins.ts",
      ],
    },
    {
      phase: "MCP",
      title: "连接 MCP，转成工具 / 资源 / 命令",
      summary:
        "MCP client 层会把每个 server 连接起来，再把它暴露的 tools、resources、prompts 变成 Claude Code 里可以被模型或用户使用的能力。",
      importance:
        "MCP 不是外挂窗口，而是被纳入同一套工具权限和会话状态里的执行平面。",
      points: [
        "支持 stdio、SSE、streamable HTTP、WebSocket 等 transport。",
        "连接完成后，MCP tool 会被统一命名并纳入工具池。",
        "MCP resources 则通过专用工具进行列举和读取。",
      ],
      files: [
        "restored-src/src/services/mcp/client.ts",
        "restored-src/src/tools/MCPTool",
        "restored-src/src/services/mcp/config.ts",
      ],
    },
    {
      phase: "Launch",
      title: "挂载终端应用或进入 headless 引擎",
      summary:
        "交互式模式会通过 launchRepl() 把 AppStateProvider、StatsProvider、REPL 屏幕挂到 Ink 根节点上；非交互模式则走 QueryEngine。",
      importance:
        "Claude Code 的 UI 和执行引擎是分层的，REPL 只是外壳，不是全部逻辑。",
      points: [
        "launchRepl() 本身很薄，只负责把 App 和 REPL 组起来。",
        "App 负责上下文提供和状态写回。",
        "REPL 才是真正的交互控制器；headless 模式则复用 QueryEngine 核心逻辑。",
      ],
      files: [
        "restored-src/src/replLauncher.tsx",
        "restored-src/src/components/App.tsx",
        "restored-src/src/screens/REPL.tsx",
        "restored-src/src/QueryEngine.ts",
      ],
    },
  ],
  turn: [
    {
      phase: "Input",
      title: "用户输入先进入 processUserInput",
      summary:
        "用户敲下的一行文本不会直接送去模型，而是先被 processUserInput 处理 slash command、pasted content、图片、hook、权限上下文和特殊前缀。",
      importance:
        "这一层决定“看起来像文本”的输入，实际上可能变成命令、附件、提示模板或直接阻断。",
      points: [
        "slash command 可以在这里被解析成 skill / command 执行。",
        "UserPromptSubmit hooks 可以阻断或追加上下文。",
        "图片和附件会先转成模型可消费的 message blocks。",
      ],
      files: [
        "restored-src/src/utils/processUserInput/processUserInput.ts",
        "restored-src/src/commands.ts",
        "restored-src/src/history.ts",
      ],
    },
    {
      phase: "Context",
      title: "系统提示词和上下文按当前会话动态拼装",
      summary:
        "REPL 或 QueryEngine 在真正发请求前，会同步拿到 getSystemPrompt、getUserContext、getSystemContext、agent prompt addendum、coordinator context 等所有运行时上下文。",
      importance:
        "Claude Code 的 system prompt 不是静态大字符串，而是由工具、MCP、agent、目录和模式共同决定。",
      points: [
        "不同会话模式会追加不同的系统提示内容。",
        "工具池变化会改变 system prompt 中可见的 tool schema。",
        "coordinator / proactive / assistant 模式会再叠加额外上下文。",
      ],
      files: [
        "restored-src/src/constants/prompts.ts",
        "restored-src/src/utils/systemPrompt.ts",
        "restored-src/src/context.ts",
      ],
    },
    {
      phase: "Query",
      title: "query() 驱动模型流式循环",
      summary:
        "query.ts 是 Claude Code 的核心对话状态机。它负责把消息发给模型、接收流式返回、处理 compact、预算、token 限制、tool_use 和继续轮询。",
      importance:
        "如果只看一个执行核心文件，query.ts 比 UI 更接近 Claude Code 的真正大脑。",
      points: [
        "支持 streaming，边收边处理 assistant 内容。",
        "不是单次问答，而是可多轮的 agentic loop。",
        "会在 tool_use 后暂停自然语言输出，转去执行工具，再把 tool_result 回灌继续推理。",
      ],
      files: [
        "restored-src/src/query.ts",
        "restored-src/src/query/config.ts",
        "restored-src/src/query/tokenBudget.ts",
      ],
    },
    {
      phase: "Tools",
      title: "tool_use 进入工具编排器",
      summary:
        "当模型返回 tool_use block，query.ts 会把它交给 runTools() 或 StreamingToolExecutor，由工具系统决定权限检查、实际执行、进度展示和结果裁剪。",
      importance:
        "Claude Code 的 agent 能力，不是因为模型会写代码，而是因为它能稳定地把模型意图转成真实工具调用。",
      points: [
        "Tool.ts 定义了统一工具接口和 ToolUseContext。",
        "tools.ts 维护内建工具池，例如 Bash、Read、Edit、Task、Skill、MCP。",
        "权限系统和 UI 进度反馈都依赖同一份 ToolUseContext。",
      ],
      files: [
        "restored-src/src/Tool.ts",
        "restored-src/src/tools.ts",
        "restored-src/src/services/tools/toolOrchestration.ts",
      ],
    },
    {
      phase: "Return",
      title: "工具结果、消息流与 UI 一起回流",
      summary:
        "工具执行结果会转成 tool_result message，再送回 query()；同时 REPL 会根据流式事件更新消息列表、spinner、状态栏、任务列表，并把会话落盘。",
      importance:
        "Claude Code 的“回复”其实是 UI 状态更新、会话持久化和模型回路三者同时发生。",
      points: [
        "REPL.tsx 中 onQueryEvent 会把 streaming event 转成消息列表更新。",
        "sessionStorage 会记录 transcript、标题、成本、文件历史等状态。",
        "compact 或 resume 时，还能从这些持久化状态恢复会话。",
      ],
      files: [
        "restored-src/src/screens/REPL.tsx",
        "restored-src/src/utils/sessionStorage.ts",
        "restored-src/src/utils/messages.ts",
      ],
    },
  ],
  extensions: [
    {
      phase: "Skill",
      title: "Skill 是模型可调用的提示模板层",
      summary:
        "Skill 实际上是带 frontmatter 的 markdown prompt 资产。加载后会变成 Command，对用户表现为 slash command，对模型表现为 Skill Tool 可用的能力。",
      importance:
        "Skill 解决的是“提示复用”和“工作流封装”，不是执行 transport。",
      points: [
        "可来自用户目录、项目目录、managed 路径、bundled skill。",
        "frontmatter 里可以定义 allowedTools、effort、hooks、agent 等元信息。",
        "Skill Tool 会在运行时发现、选择和调用这些技能。",
      ],
      files: [
        "restored-src/src/skills/loadSkillsDir.ts",
        "restored-src/src/skills/bundled/index.ts",
        "restored-src/src/tools/SkillTool",
      ],
    },
    {
      phase: "Plugin",
      title: "Plugin 是可打包的扩展容器",
      summary:
        "Plugin 和 Skill 的区别在于，Plugin 可以一次性携带 skills、hooks、MCP servers 甚至更多组件，并且支持启用/禁用。",
      importance:
        "它像一个组合包，把多种扩展组件作为一组能力交付。",
      points: [
        "builtin plugin 会出现在 /plugin UI 中。",
        "plugin 可以改变可用 skill 列表，也可以带来新的 MCP 服务器。",
        "用户能对 plugin 做持久化开关管理。",
      ],
      files: [
        "restored-src/src/plugins/builtinPlugins.ts",
        "restored-src/src/utils/plugins",
        "restored-src/src/types/plugin.ts",
      ],
    },
    {
      phase: "MCP",
      title: "MCP 是外部能力接入平面",
      summary:
        "MCP server 连接成功后，会被折叠进 Claude Code 原有工具系统，而不是独立存在。对模型来说，它就是另一类 tool/resource/provider。",
      importance:
        "这就是 Claude Code 可扩展性的关键接口层。",
      points: [
        "可以提供 tools、resources、prompts、auth flow。",
        "连接失败、认证失效、tool timeout 都在 client 层统一处理。",
        "MCP 还能反过来生成 skill 或 command 形式的入口。",
      ],
      files: [
        "restored-src/src/services/mcp/client.ts",
        "restored-src/src/services/mcp/types.ts",
        "restored-src/src/skills/mcpSkillBuilders.ts",
      ],
    },
    {
      phase: "Coordinator",
      title: "Coordinator 在同一内核上叠加多 Agent 编排",
      summary:
        "Coordinator 不是第二套产品，而是在已有工具系统上，再加 worker 能力约束、scratchpad、任务通知协议和并发工作流规则。",
      importance:
        "你看到的多 agent，只是同一个 query/tool 框架上的调度策略升级。",
      points: [
        "worker 仍然依赖标准工具和 MCP。",
        "coordinator 会向 system prompt 注入 worker tool context。",
        "AgentTool / SendMessage / TaskStop 等成为 orchestrator 的控制面。",
      ],
      files: [
        "restored-src/src/coordinator/coordinatorMode.ts",
        "restored-src/src/tools/AgentTool",
        "restored-src/src/tasks",
      ],
    },
  ],
};

const extensions = [
  {
    type: "skill",
    title: "Skill",
    summary:
      "把 prompt 资产变成可调用的工作流单元。更像“可复用提示工程”，而不是 transport。",
    bullets: [
      "来源：项目目录、用户目录、managed 路径、bundled skill",
      "载体：markdown + frontmatter",
      "产物：Command / Skill Tool 可见能力",
    ],
  },
  {
    type: "plugin",
    title: "Plugin",
    summary:
      "把 skill、hook、MCP server 等一组能力打包交付，并交给 /plugin 管理其启停。",
    bullets: [
      "可持久化启用 / 禁用",
      "builtin plugin 直接随 CLI 分发",
      "能同时影响 skill、hook、MCP 三层",
    ],
  },
  {
    type: "mcp",
    title: "MCP",
    summary:
      "Claude Code 的外部能力平面。接好 transport 后，server 的工具和资源会进入统一的权限与消息循环。",
    bullets: [
      "支持 stdio / SSE / HTTP / WebSocket",
      "把 server tool 统一包装成 MCPTool",
      "错误、认证、输出裁剪都在 client 层处理",
    ],
  },
  {
    type: "agent",
    title: "Coordinator / Agent",
    summary:
      "多 Agent 并不是旁路系统，而是对现有 query + tool 基础设施的上层编排。",
    bullets: [
      "给 worker 注入受限工具池和 scratchpad",
      "通过任务通知协议拿回 worker 结果",
      "本质上仍依赖标准工具、MCP、Skill",
    ],
  },
];

const fileMap = [
  {
    title: "入口与模式分流",
    path: "restored-src/src/entrypoints/cli.tsx",
    summary: "CLI 真正的第一跳。先做 fast-path，再决定是否进入完整主程序。",
    bullets: [
      "特殊模式分流：MCP、bridge、daemon、bg session、ssh",
      "减少非必要 import",
      "是所有模式共用的总入口",
    ],
  },
  {
    title: "启动装配厂",
    path: "restored-src/src/main.tsx",
    summary: "最大、最关键的运行时装配文件。",
    bullets: [
      "解析选项、准备 state、装工具、连 MCP、载 commands",
      "决定 REPL 还是 headless",
      "几乎所有系统能力都在这里汇合",
    ],
  },
  {
    title: "REPL 挂载器",
    path: "restored-src/src/replLauncher.tsx",
    summary: "把 App 外壳和 REPL 屏幕组合到 Ink 根节点。",
    bullets: [
      "不是业务核心，但定义了 UI 装配关系",
      "能快速说明 App 和 REPL 的职责边界",
    ],
  },
  {
    title: "终端控制中心",
    path: "restored-src/src/screens/REPL.tsx",
    summary: "用户交互、消息流、查询触发、权限弹窗、状态展示几乎都在这里。",
    bullets: [
      "处理输入提交和 query 事件",
      "驱动消息列表和任务列表更新",
      "管理一轮会话的 UI 行为",
    ],
  },
  {
    title: "会话级查询引擎",
    path: "restored-src/src/QueryEngine.ts",
    summary: "把 query 核心逻辑抽成可复用引擎，供 headless/SDK 路径复用。",
    bullets: [
      "管理 mutableMessages、usage、permission denials",
      "负责 submitMessage 生命周期",
      "比 REPL 更接近可复用执行内核",
    ],
  },
  {
    title: "对话状态机",
    path: "restored-src/src/query.ts",
    summary: "Claude Code 真正的 agent loop：流式返回、tool_use、compact、预算、继续。",
    bullets: [
      "最值得读的核心执行文件之一",
      "串起模型流、工具回路和消息回灌",
      "说明 Claude Code 为什么能连续工作多轮",
    ],
  },
  {
    title: "统一工具协议",
    path: "restored-src/src/Tool.ts",
    summary: "定义 Tool、ToolUseContext、权限上下文、消息和进度交互接口。",
    bullets: [
      "是所有工具共享的抽象层",
      "权限、MCP、UI 进度都依赖它",
    ],
  },
  {
    title: "工具池定义",
    path: "restored-src/src/tools.ts",
    summary: "把 Bash、Read、Edit、Web、Skill、MCP、Agent 等工具收拢成同一个池。",
    bullets: [
      "按 feature flag、env、permission 决定哪些工具最终可见",
      "能一眼看出 Claude Code 支持哪些核心工具能力",
    ],
  },
  {
    title: "扩展加载",
    path: "restored-src/src/skills/loadSkillsDir.ts",
    summary: "Skill 从哪里来、如何解析 frontmatter、如何转换成 Command，都在这里。",
    bullets: [
      "是理解 Skill 系统最短路径",
      "也能看出 managed/user/project 这几层配置来源",
    ],
  },
  {
    title: "MCP 接入层",
    path: "restored-src/src/services/mcp/client.ts",
    summary: "负责连接 server、拿 tool/resource、执行调用、处理认证和错误。",
    bullets: [
      "是理解“外部能力如何变成内建能力”的关键文件",
      "把 transport 细节封装到统一客户端层",
    ],
  },
  {
    title: "Plugin 注册表",
    path: "restored-src/src/plugins/builtinPlugins.ts",
    summary: "说明 Plugin 在 Claude Code 里的真实角色：可启停、可组合、可持久化。",
    bullets: [
      "Builtin plugin 与 bundled skill 的边界在这里最清楚",
      "能看出 plugin 实际上是扩展包容器",
    ],
  },
  {
    title: "多 Agent 编排",
    path: "restored-src/src/coordinator/coordinatorMode.ts",
    summary: "给 worker 注入可用工具上下文，定义 coordinator 的运行规则。",
    bullets: [
      "多 Agent 的核心不是 UI，而是 prompt 和能力约束",
      "能直接解释 coordinator 模式为何能并发派工",
    ],
  },
];

const detailTitle = document.getElementById("detail-title");
const detailSummary = document.getElementById("detail-summary");
const detailPoints = document.getElementById("detail-points");
const detailFiles = document.getElementById("detail-files");
const detailImportance = document.getElementById("detail-importance");
const viewSwitch = document.getElementById("view-switch");
const journeyMap = document.getElementById("journey-map");
const extensionGrid = document.getElementById("extension-grid");
const fileMapEl = document.getElementById("file-map");

let currentView = "startup";
let currentIndex = 0;

function renderViewSwitch() {
  viewSwitch.innerHTML = "";

  views.forEach((view) => {
    const button = document.createElement("button");
    button.className = `view-button${view.id === currentView ? " active" : ""}`;
    button.textContent = view.label;
    button.type = "button";
    button.addEventListener("click", () => {
      currentView = view.id;
      currentIndex = 0;
      renderViewSwitch();
      renderJourney();
    });
    viewSwitch.appendChild(button);
  });
}

function updateDetail(step) {
  detailTitle.textContent = step.title;
  detailSummary.textContent = step.summary;
  detailImportance.textContent = step.importance;

  detailPoints.innerHTML = "";
  step.points.forEach((point) => {
    const item = document.createElement("li");
    item.textContent = point;
    detailPoints.appendChild(item);
  });

  detailFiles.innerHTML = "";
  step.files.forEach((file) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = file;
    detailFiles.appendChild(chip);
  });
}

function renderJourney() {
  const steps = flowByView[currentView];
  journeyMap.innerHTML = "";

  steps.forEach((step, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `flow-card${index === currentIndex ? " active" : ""}`;
    button.dataset.index = String(index + 1).padStart(2, "0");
    button.innerHTML = `
      <small>${step.phase}</small>
      <h3>${step.title}</h3>
      <p>${step.summary}</p>
    `;

    button.addEventListener("click", () => {
      currentIndex = index;
      renderJourney();
    });

    journeyMap.appendChild(button);
  });

  updateDetail(steps[currentIndex]);
}

function renderExtensions() {
  extensionGrid.innerHTML = "";

  extensions.forEach((item) => {
    const card = document.createElement("article");
    card.className = "extension-card";
    card.innerHTML = `
      <header>
        <h3>${item.title}</h3>
        <span class="tag ${item.type}">${item.type}</span>
      </header>
      <p>${item.summary}</p>
      <ul>${item.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>
    `;
    extensionGrid.appendChild(card);
  });
}

function renderFileMap() {
  fileMapEl.innerHTML = "";

  fileMap.forEach((item) => {
    const card = document.createElement("article");
    card.className = "file-card";
    card.innerHTML = `
      <header>
        <h3>${item.title}</h3>
      </header>
      <span class="file-path">${item.path}</span>
      <p>${item.summary}</p>
      <ul>${item.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>
    `;
    fileMapEl.appendChild(card);
  });
}

function wireScrollButtons() {
  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-scroll-target");
      if (!targetId) return;
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

renderViewSwitch();
renderJourney();
renderExtensions();
renderFileMap();
wireScrollButtons();
