# DeepPulse Skills · 图萃

让你的 Agent 通过 **tucui-cli** 调用图萃授权知识库：检索依据、补充研究、管理引用，并生成本地 HTML / Markdown 报告。

本仓库提供 `tucui-expert` skill，以及**同时安装 skill 和最新 tucui-cli** 的统一安装器。适用于具有本地命令执行能力的 Codex、Claude Code、Cursor 等 Agent。

## 复制这一句话给你的 Agent

```text
请读取 https://raw.githubusercontent.com/DeepPulseHQ/skills/main/INSTALL.md，按其中说明为你当前使用的 Agent 安装 tucui-expert skill，并自动安装最新版 tucui-cli，完成后验证安装；需要 API Key 时让我在自己的终端运行 tucui init，不要让我把 Key 发到聊天里。
```

## 一条命令安装

准备 **Node.js 22.20+、npm、Git**。统一安装器默认将 skill 安装到用户级目录，CLI 安装到 npm 全局目录。无需 GitHub 账号，也无需先填写图萃 Key。

在终端执行，按提示选择你的 Agent：

```sh
npx --yes github:DeepPulseHQ/skills
```

Agent 自动执行或不需要交互时，明确指定目标：

```sh
# Codex
npx --yes github:DeepPulseHQ/skills --agent codex

# Claude Code
npx --yes github:DeepPulseHQ/skills --agent claude-code

# Cursor
npx --yes github:DeepPulseHQ/skills --agent cursor
```

多个 Agent 可重复传入 `--agent`。只想在当前项目使用 skill，进入项目后加 `--project`；CLI 仍全局安装。

安装器依次执行：

1. `npm install -g tucui-cli@latest`。
2. 验证 CLI 的版本与帮助命令。
3. 使用已验证版本的 `skills` CLI，从本仓库安装 `tucui-expert` 到指定 Agent，并核对安装列表与 skill 文件。

安装命令源码见 [scripts/install.mjs](scripts/install.mjs)。安装不会自动发起知识库检索。

### 已有自己的 skill 安装方式

也可直接使用两条标准命令，以 Codex 为例：

```sh
npm install -g tucui-cli@latest
npx --yes skills@1.8.1 add DeepPulseHQ/skills --skill tucui-expert --agent codex --global --yes
```

**单独运行 `skills add` 只安装 skill 文件，不会执行 npm 安装。** 想一次装好两者，请用上面的统一安装器。Skill 在首次使用时也会检查 CLI，缺失时引导 Agent 安装。`SKILL.md` 本身没有安装时自动执行脚本的能力。

## 第一次连接图萃

安装完成后，在你自己的终端运行：

```sh
tucui --version
tucui init
tucui doctor
tucui sources
```

`tucui init` 需要图萃服务地址和已有 API Key，并隐藏输入 Key。公共 npm 包没有预置服务地址。已有配置可沿用；安装器不替你创建账号或开通知识库。

API Key 不要发给 Agent、不写进仓库。缺少配置时，skill 和 CLI 仍可完成安装；联网检索需在初始化成功后进行。

刷新 Agent 的技能列表或新开会话，然后说：

> 用图萃检索某药的临床价值，分析治疗定位、竞争方案、患者分层和研究局限，附引用，保存为 HTML 和 Markdown 报告。

也可以明确说“使用 tucui-expert skill”。完整执行规则见 [SKILL.md](skills/tucui-expert/SKILL.md)。

## 更新、卸载与常见问题

**更新：** 重新运行相同的一条安装命令，会更新全局 CLI 并重新安装本仓库 skill；若本地改过 skill，请先保存自己的修改。已有图萃连接配置保留。

**卸载：** 以 Codex 用户级安装为例：

```sh
npx --yes skills@1.8.1 remove tucui-expert --agent codex --global --yes
npm uninstall -g tucui-cli
```

项目安装移除 `--global`，在原项目中运行；其他 Agent 替换 `--agent`。卸载 CLI 不清除图萃配置；确需清除时，在卸载前自行运行 `tucui config --clear`。

**找不到 `tucui`：** 重新打开终端，检查 `npm prefix -g`。macOS / Linux 将该目录下的 `bin` 加入 PATH；Windows 将该目录本身加入 PATH。安装器也会输出提示。

**npm 全局安装权限不足：** 使用用户可写的 Node/npm 安装位置或全局 prefix，修复后重跑安装命令。

**GitHub 或 npm 访问失败：** 在 Agent 实际执行命令的环境中检查网络与 Git。云端 Agent、容器和本机各自需要安装与配置。

**已有 `tucui install --client ...` 安装：** CLI 内建安装器会在项目中创建独立 CLI 副本及同名 skill；不要在同一项目混用两套安装方式。内建项目副本需要按它自身的更新说明维护，更新全局 CLI 不会替换该副本。

**WorkBuddy：** 本仓库的统一安装入口未验证 WorkBuddy 的 UI 导入。可使用 CLI 自带的 `tucui install --client workbuddy --project /绝对路径/项目` 生成 ZIP（需要 Python 3），再在 WorkBuddy 导入。

## 仓库内容

| 文件 | 用途 |
| --- | --- |
| [INSTALL.md](INSTALL.md) | 给 Agent 的安装、验证与初始化说明 |
| [skills/tucui-expert/SKILL.md](skills/tucui-expert/SKILL.md) | 图萃 skill 入口 |
| [scripts/install.mjs](scripts/install.mjs) | CLI 与 skill 统一安装器 |

统一安装器使用 `skills@1.8.1`，要求 Node.js 22.20+；`tucui-cli` 本身要求 Node.js 22+。`tucui-cli@latest` 始终从 npm 获取当前最新发布版本。许可证：[MIT](LICENSE)。
