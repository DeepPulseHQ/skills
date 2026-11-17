import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const installer = fileURLToPath(new URL('../scripts/install.mjs', import.meta.url));

// The subprocess fixture writes only into its test directory. No real npm,
// network, credential files, or user-level skill directories are touched.
const npmFixture = String.raw`
const { mkdirSync, writeFileSync } = require('node:fs');
const { join, dirname } = require('node:path');
const root = process.env.EVIDOC_TEST_ROOT;
const stage = process.env.EVIDOC_TEST_STAGE;
const args = process.argv.slice(2);
const prefix = join(root, 'npm prefix with spaces');
const cli = join(prefix, ...(process.platform === 'win32' ? [] : ['lib']), 'node_modules', '@deeppulse', 'evidoc', 'bin', 'tucui.js');
writeFileSync(join(root, 'npm-touched'), 'yes');
if (args[0] === 'install') {
  if (stage === 'npm-failure') process.exit(17);
  mkdirSync(dirname(cli), { recursive: true });
  writeFileSync(cli, 'console.log(process.argv[2] === "--version" ? "0.2.0" : "evidoc help");');
} else if (args[0] === 'prefix') {
  console.log(prefix);
} else if (args[0] === 'exec') {
  const action = args[args.indexOf('skills') + 1];
  const scope = args.includes('--global') ? 'global' : 'project';
  const skillPath = scope === 'global' ? join(root, 'global-skills', 'evidoc') : join(process.cwd(), '.agents', 'skills', 'evidoc');
  if (action === 'add') {
    writeFileSync(join(root, 'skill-add-attempted'), 'yes');
    if (stage === 'skill-failure') process.exit(23);
    mkdirSync(skillPath, { recursive: true });
    writeFileSync(join(skillPath, 'SKILL.md'), '---\nname: evidoc\ndescription: test fixture\n---\n');
  } else if (action === 'list') {
    const entries = stage === 'empty-list' ? [] : [{
      name: 'evidoc', scope, source: 'DeepPulseHQ/skills', path: skillPath, agents: ['Codex']
    }];
    console.log(JSON.stringify(entries));
  } else throw new Error('Unexpected skills action: ' + action);
} else throw new Error('Unexpected npm operation: ' + args[0]);
`;

function environment(t, stage = '') {
  const root = mkdtempSync(join(tmpdir(), 'evidoc installer test '));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const project = join(root, 'project with spaces');
  mkdirSync(project);
  const npmCli = join(root, 'npm-cli.js');
  writeFileSync(npmCli, npmFixture);
  const cli = join(root, 'npm prefix with spaces', ...(process.platform === 'win32' ? [] : ['lib']), 'node_modules', '@deeppulse', 'evidoc', 'bin', 'tucui.js');
  return {
    root, cli,
    skill: join(project, '.agents', 'skills', 'evidoc', 'SKILL.md'),
    execute(args) {
      return spawnSync(process.execPath, [installer, ...args], {
        cwd: project,
        env: { ...process.env, npm_execpath: npmCli, EVIDOC_TEST_ROOT: root, EVIDOC_TEST_STAGE: stage },
        encoding: 'utf8',
        timeout: 30_000,
      });
    },
  };
}

test('project installation produces a runnable CLI and verified skill with paths containing spaces', t => {
  const env = environment(t);
  const result = env.execute(['--agent', 'codex', '--project']);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(env.cli));
  assert.match(readFileSync(env.skill, 'utf8'), /name: evidoc/);
  const version = spawnSync(process.execPath, [env.cli, '--version'], { encoding: 'utf8' });
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), '0.2.0');
  assert.ok(!existsSync(join(env.root, 'global-skills')));
});

test('default scope installs the skill at user scope, outside the project', t => {
  const env = environment(t);
  const result = env.execute(['--agent', 'codex']);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(join(env.root, 'global-skills', 'evidoc', 'SKILL.md')));
  assert.ok(!existsSync(env.skill));
});

test('npm installation failure exits without attempting skill installation', t => {
  const env = environment(t, 'npm-failure');
  const result = env.execute(['--agent', 'codex', '--project']);
  assert.equal(result.status, 17, result.stderr);
  assert.ok(!existsSync(env.cli));
  assert.ok(!existsSync(join(env.root, 'skill-add-attempted')));
  assert.ok(!existsSync(env.skill));
});

test('skill installation failure preserves the installed CLI and reports failure', t => {
  const env = environment(t, 'skill-failure');
  const result = env.execute(['--agent', 'codex', '--project']);
  assert.equal(result.status, 23, result.stderr);
  assert.ok(existsSync(env.cli));
  assert.ok(!existsSync(env.skill));
});

test('a successful installer subprocess with no listed skill is not reported as success', t => {
  const env = environment(t, 'empty-list');
  const result = env.execute(['--agent', 'codex', '--project']);
  assert.notEqual(result.status, 0);
  assert.ok(existsSync(env.cli));
  assert.ok(existsSync(env.skill));
  assert.match(result.stderr, /未验证到/);
});

for (const [name, args] of [
  ['unknown option', ['--unknown']],
  ['missing agent value', ['--agent']],
  ['unsafe agent value', ['--agent', 'codex;echo unexpected']],
  ['noninteractive run without agent', []],
]) {
  test(`${name} fails before running npm`, t => {
    const env = environment(t);
    const result = env.execute(args);
    assert.notEqual(result.status, 0);
    assert.ok(!existsSync(join(env.root, 'npm-touched')));
  });
}

test('help works without installing anything', t => {
  const env = environment(t);
  const result = env.execute(['--help']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /--agent/);
  assert.ok(!existsSync(join(env.root, 'npm-touched')));
});
