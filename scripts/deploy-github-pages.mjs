#!/usr/bin/env node
/**
 * GitHub Pages 部署脚本：构建 VitePress 站点并推送到 gh-pages 分支。
 *
 * 用法：
 *   pnpm run deploy                 # 部署到默认 <owner>/<repo>/gh-pages
 *   pnpm run deploy -- --remote url # 部署到指定 remote URL
 *
 * 前置条件：
 *   - 已安装依赖（pnpm install）
 *   - git 仓库已初始化且有 remote origin
 *   - 工作目录干净（无未提交更改）
 *
 * 流程：
 *   1. 检查工作目录干净
 *   2. 运行 vitepress build
 *   3. 创建临时 gh-pages 分支（或复用现有）
 *   4. 复制 .vitepress/dist 到分支根
 *   5. 提交并强制推送到 origin/gh-pages
 *   6. 清理临时分支
 */

import { execSync } from 'node:child_process'
import { existsSync, rmSync, mkdirSync, cpSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')
const root = resolve(__dirname, '..')
const distDir = join(root, '.vitepress', 'dist')
const tempDir = resolve(root, '.deploy-temp')

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: root, ...opts })
}

function checkClean() {
  const status = execSync('git status --porcelain', { cwd: root }).toString().trim()
  if (status) {
    console.error('工作目录不干净，请先提交或 stash 更改：')
    console.error(status)
    process.exit(1)
  }
}

function getRemoteUrl() {
  const args = process.argv.slice(2)
  const remoteIdx = args.indexOf('--remote')
  if (remoteIdx !== -1 && args[remoteIdx + 1]) {
    return args[remoteIdx + 1]
  }
  try {
    return execSync('git remote get-url origin', { cwd: root }).toString().trim()
  } catch {
    console.error('无法获取 origin remote URL，请用 --remote 指定')
    process.exit(1)
  }
}

function main() {
  console.log('=== DeepSeek Harness 学习文档站部署 ===\n')

  // 1. 检查工作目录
  console.log('[1/6] 检查工作目录...')
  checkClean()

  // 2. 构建
  console.log('\n[2/6] 构建 VitePress 站点...')
  run('pnpm run build')

  if (!existsSync(distDir)) {
    console.error(`构建产物不存在：${distDir}`)
    process.exit(1)
  }

  // 3. 准备临时目录
  console.log('\n[3/6] 准备临时部署目录...')
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true })
  }
  mkdirSync(tempDir, { recursive: true })

  const remoteUrl = getRemoteUrl()
  run(`git clone --depth 1 --branch gh-pages "${remoteUrl}" "${tempDir}"`, { cwd: root })
    .catch(() => {
      console.log('gh-pages 分支不存在，将创建新分支')
      run('git init', { cwd: tempDir })
      run('git checkout --orphan gh-pages', { cwd: tempDir })
    })

  // 4. 复制构建产物
  console.log('\n[4/6] 复制构建产物...')
  // 清空临时目录内容（保留 .git）
  const items = execSync('ls -A', { cwd: tempDir }).toString().trim().split('\n')
  for (const item of items) {
    if (item === '.git') continue
    rmSync(join(tempDir, item), { recursive: true, force: true })
  }
  cpSync(distDir, tempDir, { recursive: true })

  // 添加 .nojekyll 防止 GitHub Pages 处理
  if (!existsSync(join(tempDir, '.nojekyll'))) {
    execSync('touch .nojekyll', { cwd: tempDir })
  }

  // 5. 提交并推送
  console.log('\n[5/6] 提交并推送到 gh-pages...')
  run('git add -A', { cwd: tempDir })
  const timestamp = new Date().toISOString()
  run(`git -c user.name="deploy-bot" -c user.email="deploy-bot@users.noreply.github.com" commit -m "deploy: ${timestamp}"`, { cwd: tempDir })
  run(`git remote add origin "${remoteUrl}"`, { cwd: tempDir })
  run('git push --force-with-lease origin gh-pages', { cwd: tempDir })

  // 6. 清理
  console.log('\n[6/6] 清理临时目录...')
  rmSync(tempDir, { recursive: true, force: true })

  console.log('\n=== 部署完成 ===')
  console.log(`站点已推送到 gh-pages 分支`)
  console.log(`GitHub Pages URL: 请在仓库 Settings > Pages 中确认`)
}

main()
