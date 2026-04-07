#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const CORE_PKG = '@mibridge/core'
const CLI_PKG = '@mibridge/cli'

const args = process.argv.slice(2)

function getArgValue(flag) {
  const index = args.indexOf(flag)
  if (index === -1) return undefined
  return args[index + 1]
}

const version = getArgValue('--version')
const tag = getArgValue('--tag') ?? 'latest'
const shouldPublish = !args.includes('--no-publish')
const shouldPush = !args.includes('--no-push')
const dryRun = args.includes('--dry-run')

function fail(message) {
  console.error(`\n[release] ${message}`)
  process.exit(1)
}

function run(command, commandArgs, options = {}) {
  const printable = [command, ...commandArgs].join(' ')
  console.log(`[release] $ ${printable}`)
  if (dryRun) return
  execFileSync(command, commandArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    ...options,
  })
}

function runCapture(command, commandArgs) {
  if (dryRun) return ''
  return execFileSync(command, commandArgs, {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim()
}

if (!version) {
  fail('Missing --version (example: npm run release:automate -- --version 1.0.0)')
}

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  fail(`Invalid semver version "${version}"`)
}

const currentBranch = runCapture('git', ['branch', '--show-current'])
if (currentBranch !== 'main') {
  fail(`Releases must be made from main (current branch: ${currentBranch})`)
}

const gitStatus = runCapture('git', ['status', '--porcelain'])
if (gitStatus) {
  fail('Working tree is not clean. Commit/stash changes before releasing.')
}

run('npm', ['whoami'])

console.log('\n[release] Running quality checks...')
run('npm', ['run', 'build'])
run('npm', ['run', 'typecheck'])
run('npm', ['test'])

console.log('\n[release] Bumping package versions...')
run('npm', ['version', version, '-w', CORE_PKG, '--no-git-tag-version'])
run('npm', ['version', version, '-w', CLI_PKG, '--no-git-tag-version'])

const cliPackagePath = join(ROOT, 'packages', 'cli', 'package.json')
const cliPackage = JSON.parse(readFileSync(cliPackagePath, 'utf8'))
if (!cliPackage.dependencies || !cliPackage.dependencies[CORE_PKG]) {
  fail(`Unable to find ${CORE_PKG} in packages/cli/package.json`)
}
cliPackage.dependencies[CORE_PKG] = version
writeFileSync(cliPackagePath, `${JSON.stringify(cliPackage, null, 2)}\n`, 'utf8')

run('npm', ['install', '--package-lock-only'])

console.log('\n[release] Creating commit and tag...')
run('git', ['add', '-A'])
run('git', ['commit', '-m', `chore(release): v${version}`])
run('git', ['tag', '-a', `v${version}`, '-m', `Release v${version}`])

if (shouldPush) {
  console.log('\n[release] Pushing branch and tag...')
  run('git', ['push', 'origin', currentBranch])
  run('git', ['push', 'origin', `v${version}`])
}

if (shouldPublish) {
  console.log('\n[release] Publishing packages to npm...')
  run('npm', ['publish', '-w', CORE_PKG, '--access', 'public', '--tag', tag])
  run('npm', ['publish', '-w', CLI_PKG, '--access', 'public', '--tag', tag])
}

console.log(`\n[release] Done. Release v${version} completed${dryRun ? ' (dry-run)' : ''}.`)
