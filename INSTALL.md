# 给 Agent 的安装说明

目标：为用户当前使用的 Agent 安装 `evidoc`，同时安装公共 npm 包 `@deeppulse/evidoc@latest`。可执行命令叫 `evidoc`。

## 1. 检查执行环境

在 Agent 实际执行任务的机器、容器或云端环境中运行：

```sh
node --version
npm --version
git --version
```

统一安装器需要 Node.js **22.20+**、npm、Git，以及 GitHub/npm 网络访问。缺失时先根据用户环境补齐；无法安装系统依赖时说明缺失项。不要把本机安装结果当成云端已安装。

## 2. 一次安装 CLI 和 skill

按当前 Agent 选择对应命令，不要无理由安装到其他客户端：

```sh
# Codex
npx --yes github:DeepPulseHQ/skills --agent codex

# Claude Code
npx --yes github:DeepPulseHQ/skills --agent claude-code

# Cursor
npx --yes github:DeepPulseHQ/skills --agent cursor
```

默认安装到用户级 skill 目录；用户要求项目级时，在目标项目目录运行并追加 `--project`。多个明确指定的客户端可重复传入 `--agent`。其他 Agent 名称参考 [skills 上游支持列表](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)，以安装器实际接受的名称为准。无法确定当前客户端时先确认目标，避免随意写入所有客户端目录。

安装器先执行 **`npm install -g @deeppulse/evidoc@latest`**，验证 CLI 后，通过 `skills@1.8.1` 安装本仓库 skill。非交互环境必须指定 `--agent`。

也可分步执行，以下以 Codex 为例，效果相同：

```sh
npm install -g @deeppulse/evidoc@latest
npx --yes skills@1.8.1 add DeepPulseHQ/skills --skill evidoc --agent codex --global --yes
```

不要只执行 `skills add` 就声称 CLI 已安装。不要再调用 `evidoc install --client ...` 覆盖同一位置的同名 skill。重新安装会更新 skill；本地有修改时先保留修改。

## 3. 验证并报告结果

```sh
evidoc --version
evidoc help
npx --yes skills@1.8.1 list --global --agent codex
```

将 `codex` 替换为实际目标；项目安装去掉 `--global`。确认列表包含 `evidoc`，并核对安装输出中的实际文件位置。发现 skill 文件不等于当前会话已加载；提示用户刷新技能或新开会话。

如果 PATH 找不到 `evidoc`，用 `npm prefix -g` 定位 npm 全局目录：macOS/Linux 的命令目录是 `<prefix>/bin`，Windows 是 `<prefix>`。先修复当前环境 PATH；也可通过 Node 运行 `<prefix>/lib/node_modules/@deeppulse/evidoc/bin/tucui.js`（Windows 去掉 `lib/`）验证。

报告 CLI 版本、skill 目标客户端与安装范围。若任何一步失败，如实说明哪一步未完成；已安装 CLI 而 skill 失败时，解决网络或目标问题后重跑即可。

## 4. 首次使用时配置连接

安装无需 API Key。已有配置时可运行 `evidoc doctor` 检查连接；未配置或权限不足时请用户在自己的终端运行：

```sh
evidoc init
```

`evidoc init` 默认使用 `https://tucui.evidoc.cn`，也可用 `evidoc init --base-url https://你的服务地址` 连接其他部署；Key 在终端中隐藏输入。不要让用户把 Key 发到聊天中，也不要读取、展示或提交本机配置文件中的 Key。用户完成后运行 `evidoc doctor` 和 `evidoc sources`，再开始用户要求的研究。

`doctor` 失败不等于安装失败：区分“CLI/skill 已安装”与“服务连接尚未配置”。安装任务本身不需要发起付费知识检索。
