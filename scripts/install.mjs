#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const HELP = `图萃 Skill + CLI 安装器

用法：npx --yes github:DeepPulseHQ/skills [选项]

  --agent NAME   安装到指定 Agent，可重复；例如 codex、claude-code、cursor
  --project      将 skill 安装到当前项目（默认安装到用户级目录）
  --help         查看帮助，不执行安装

指定 --agent 后自动确认；省略时在终端交互选择 Agent。
CLI 始终通过 npm install -g tucui-cli@latest 安装或更新。
要求 Node.js 22.20+、npm、Git；不需要 GitHub 登录。
`;

function parseOptions(args) {
  const options = { agents: [], project: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--agent') {
      const agent = args[++i];
      if (!agent || !/^[a-z][a-z0-9-]*$/.test(agent)) {
        throw new Error('--agent 需要 Agent 名称，例如 codex、claude-code 或 cursor。');
      }
      if (!options.agents.includes(agent)) options.agents.push(agent);
    } else if (arg === '--project') options.project = true;
    else throw new Error(`未知参数：${arg}。使用 --help 查看用法。`);
  }
  return options;
}

function run(command, args, { capture = false, shell = false } = {}) {
  const result = spawnSync(command, args, {
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8',
    shell,
    windowsHide: true,
  });
  if (result.error) throw new Error(`无法运行 ${command}：${result.error.message}`);
  if (result.status !== 0) {
    const error = new Error(`${command} 执行失败（${result.signal || `退出码 ${result.status}`}）。`);
    error.exitCode = Number.isInteger(result.status) && result.status > 0 ? result.status : 1;
    throw error;
  }
  return result.stdout?.trim();
}

function npm(args, options = {}) {
  // npx/npm provides its CLI path; invoking it with Node also works on Windows.
  const npmCli = process.env.npm_execpath;
  if (npmCli && existsSync(npmCli) && /(?:^|[/\\])npm(?:-cli)?\.js$/.test(npmCli)) {
    return run(process.execPath, [npmCli, ...args], options);
  }
  // The fallback only receives fixed arguments and validated agent slugs.
  return run(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
    ...options,
    shell: process.platform === 'win32',
  });
}

function skills(args, options = {}) {
  // Pin the tested skills CLI; tucui-cli itself uses the requested latest tag.
  return npm(['exec', '--yes', '--package=skills@1.8.1', '--', 'skills', ...args], options);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP);
    return;
  }
  const options = parseOptions(args);
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 20)) {
    throw new Error('统一安装器需要 Node.js 22.20 或更新版本，请先更新 Node.js。');
  }
  if (!options.agents.length && (!process.stdin.isTTY || !process.stdout.isTTY)) {
    throw new Error('非交互安装请指定当前 Agent，例如 --agent codex 或 --agent claude-code。');
  }

  console.log('1/3 安装或更新 tucui-cli@latest…');
  npm(['install', '-g', 'tucui-cli@latest']);

  console.log('2/3 验证 CLI…');
  const prefix = npm(['prefix', '-g'], { capture: true });
  const cli = join(prefix, ...(process.platform === 'win32' ? [] : ['lib']), 'node_modules', 'tucui-cli', 'bin', 'tucui.js');
  if (!existsSync(cli)) throw new Error(`npm 安装结束，但找不到 CLI：${cli}`);
  run(process.execPath, [cli, '--version']);
  run(process.execPath, [cli, 'help'], { capture: true });

  console.log('3/3 安装 tucui-expert skill…');
  const installArgs = ['add', 'DeepPulseHQ/skills', '--skill', 'tucui-expert'];
  if (!options.project) installArgs.push('--global');
  if (options.agents.length) installArgs.push('--agent', ...options.agents, '--yes');
  skills(installArgs);

  const paths = new Set();
  for (const agent of options.agents.length ? options.agents : [null]) {
    const listArgs = ['list', '--json'];
    if (!options.project) listArgs.push('--global');
    if (agent) listArgs.push('--agent', agent);
    const entries = JSON.parse(skills(listArgs, { capture: true }));
    const installed = Array.isArray(entries) && entries.find(entry =>
      entry.name === 'tucui-expert' && entry.scope === (options.project ? 'project' : 'global') &&
      entry.source === 'DeepPulseHQ/skills' && entry.agents?.length &&
      typeof entry.path === 'string' && existsSync(join(entry.path, 'SKILL.md')));
    if (!installed) throw new Error(`未验证到 ${agent || '所选 Agent'} 的 tucui-expert 安装，请检查 skills 输出。`);
    paths.add(installed.path);
  }

  console.log('\nCLI 与 skill 已安装，并通过版本、帮助和 skill 文件检查。');
  for (const path of paths) console.log(`Skill：${path}`);
  console.log(`skill 范围：${options.project ? '当前项目' : '当前用户'}。在 Agent 中刷新技能或新开会话。`);
  console.log('首次联网使用：在你自己的终端运行 tucui init，填写服务地址并隐藏输入 API Key，再运行 tucui doctor。');
  const version = spawnSync('tucui', ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' });
  if (version.error || version.status !== 0) {
    const bin = process.platform === 'win32' ? prefix : join(prefix, 'bin');
    console.log(`当前 PATH 还不能运行 tucui。请将以下目录加入 PATH 并重启终端：${bin}`);
    console.log(`也可用 Node 直接运行 CLI：${cli}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`\n安装未完成：${error.message}`);
  console.error('请解决上面的错误后重新执行安装命令；已完成的步骤会保留。');
  process.exitCode = error.exitCode || 1;
}
