---
name: tucui-expert
description: 当用户要求使用图萃或 tucui-cli，或需要基于图萃已授权专病知识库分析药物临床价值、治疗定位、竞争方案、患者分层与试验结果时，安装并调用 CLI 检索依据，由当前 Agent 撰写和导出带引用的本地报告。
---

# 图萃专家研究

图萃提供用户已授权知识库的检索结果与依据；当前 Agent 负责明确研究问题、核查公开资料、撰写报告。根据用户的任务使用所需命令，简单查询不必建立完整报告流程。

## 确认 CLI 可用

先运行 `node --version`、`npm --version` 和 `tucui --version`。需要 Node.js **22 或更新版本**；缺少 Node.js 或版本过旧时，先协助用户准备好这个前置环境，再继续安装 CLI。

若只有 `tucui` 找不到，先运行 `npm prefix -g` 查找 npm 全局安装位置。macOS / Linux 的 CLI 文件通常为 `<prefix>/lib/node_modules/tucui-cli/bin/tucui.js`，Windows 为 `<prefix>/node_modules/tucui-cli/bin/tucui.js`。也可用 `npm root -g` 获取实际全局包目录，再找到 `tucui-cli/bin/tucui.js`。文件存在时用 `node "/实际路径/tucui.js"` 代替下文的 `tucui`，不要假定本 Skill 旁存在 `installation.json`。

CLI 尚未安装时执行：

```sh
npm install -g tucui-cli@latest
tucui --version
tucui help
```

安装后若命令仍不在 PATH，使用上述实际文件路径验证版本和帮助，并告知用户终端的 PATH 问题。安装失败时保留 npm 的错误，解决环境问题后再继续；不要报告安装成功。

这是 **Agent 读取 Skill 后执行的缺失依赖补装流程**；`SKILL.md` 本身没有安装钩子，单独复制文件不会运行 npm。仓库的一体化安装器会同时安装 Skill 与 CLI。已经可用的 CLI 不必在每次任务开始时更新；用户要求更新时执行同一条 npm 命令。

## 接入用户的知识库

```sh
tucui doctor
tucui sources
```

`doctor` 检查连接、鉴权和资源发现，不调用回答模型；成功不表示所有检索模式均可用。若未配置或凭证失效，引导用户在自己的终端运行 `tucui init`，填写自己的图萃服务地址并隐藏输入 API Key。不要让用户把 Key 发到聊天或写进命令参数。安装 Skill 和 CLI 不会创建账号、Key 或知识库权限。

按 `sources` 实际返回的知识库 ID、说明和可用模式选择检索范围。保留 ID 原样。存在多个合理候选且会影响结果时，先确定范围。`fast` 适合具体知识点核对，`expert` 适合综合分析；仅使用所选库中 `modes.<mode>.configured` 为真的模式，缺少能力时说明情况，不擅自切换知识库或降级。

简单检索示例：

```sh
tucui search '用户的实际研究问题' --kb '<sources 返回的原始 ID>' --mode expert --stream
```

检索可能耗时较长。使用当前 Agent 的持续命令会话或后台任务，保存会话 ID 并读取同一进程；一次等待窗口结束不代表请求失败，不重新发送相同检索。流式输出是 NDJSON，以最终 `type: result`、`ok: true` 和退出码 0 为准。只有进度或增量时不能声称结果已完成。

## 研究与报告

需要多次补查、读取原文、合并公开文献或导出 HTML / Markdown 时，读取 [研究与引用工作流](references/research-workflow.md)，把同一研究中的依据放入同一任务账本。调查“最新”进展时使用当前客户端的公开搜索工具核查时效，再结合图萃结果成稿。

需要参数时运行 `tucui help <command>` 或 `tucui help task <subcommand>`；需要机器可读合同则运行 `tucui schema`。每次检查退出码及结果中的 `ok`。断线、超时或中断后先检查已有进程和保存结果，避免自动重复发送可能付费的检索。
