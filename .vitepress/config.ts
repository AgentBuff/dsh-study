/**
 * VitePress 配置：DeepSeek Harness 渐进式学习文档站。
 *
 * 跟随主仓 website/ 的 VitePress 版本与 Mermaid 插件用法，仅中文、
 * 本地搜索、代码复制、行号、Mermaid 图表支持。
 */

import { withMermaid } from 'vitepress-plugin-mermaid'
import type { DefaultTheme } from 'vitepress'

/** 侧边栏分组项。 */
interface SidebarGroup {
  text: string
  items: { text: string; link: string }[]
}

/** 一个学习阶段的侧边栏分组定义。 */
interface StageGroup {
  /** 阶段标题。 */
  text: string
  /** 该阶段包含的文档条目，按学习顺序排列。 */
  items: { text: string; link: string }[]
}

/** 全部学习阶段，顺序即侧边栏自上而下的展示顺序。 */
const stages: StageGroup[] = [
  {
    text: '第一阶段 · 基础认知',
    items: [
      { text: '00 · 项目总览', link: '/00-overview' },
      { text: '01 · Cordis 框架基础', link: '/01-cordis-foundation' },
      { text: '02 · 仓库布局与构建体系', link: '/02-project-layout' },
      { text: '03 · 启动与组合体系', link: '/03-boot-and-composition' },
    ],
  },
  {
    text: '第二阶段 · 核心架构',
    items: [
      { text: '04 · 会话事件溯源', link: '/04-session-event-sourcing' },
      { text: '05 · Agent 与循环', link: '/05-agent-and-loop' },
      { text: '06 · 系统提示装配', link: '/06-system-prompt-assembly' },
      { text: '07 · 工具注册表与执行管道', link: '/07-tool-registry-and-pipeline' },
      { text: '08 · Code Mode 机制', link: '/08-code-mode' },
    ],
  },
  {
    text: '第三阶段 · 能力接缝',
    items: [
      { text: '09 · 能力接缝模式', link: '/09-capability-seams-pattern' },
      { text: '10 · LLM 与 DeepSeek 适配器', link: '/10-llm-and-deepseek-adapter' },
      { text: '11 · Shell 与 Subprocess 能力', link: '/11-shell-and-subprocess' },
      { text: '12 · FS 能力与策略', link: '/12-fs-and-policy' },
    ],
  },
  {
    text: '第四阶段 · 高级能力',
    items: [
      { text: '13 · Web 与 LSP 能力', link: '/13-web-and-lsp' },
      { text: '14 · Compaction 与 Subagent 能力', link: '/14-compaction-and-subagent' },
      { text: '15 · Workflow 与 Skill 能力', link: '/15-workflow-and-skill' },
    ],
  },
  {
    text: '第五阶段 · 持久化与组合',
    items: [
      { text: '16 · Session 持久化与投影', link: '/16-session-persistence' },
      { text: '17 · Preset 与 Profile 组合', link: '/17-preset-and-profile' },
      { text: '18 · Bundle 与 Patch 层', link: '/18-bundle-and-patch' },
      { text: '19 · Web GUI 与 ACP', link: '/19-web-gui-and-acp' },
      { text: '20 · SDK 与 JSON-RPC 协议', link: '/20-sdk-and-json-rpc' },
    ],
  },
  {
    text: '第六阶段 · 扩展实战',
    items: [
      { text: '21 · 添加新包与工具', link: '/21-adding-package-and-tool' },
      { text: '22 · 添加 LLM 适配器与 Chat 节点', link: '/22-adding-llm-and-node' },
      { text: '23 · 测试与门禁', link: '/23-testing-and-gates' },
    ],
  },
  {
    text: '附录',
    items: [
      { text: '术语表', link: '/appendix-glossary' },
      { text: '源码速查', link: '/appendix-source-map' },
    ],
  },
]

/** 顶部导航栏条目。 */
const nav: DefaultTheme.NavItem[] = [
  { text: '学习路径', link: '/' },
  { text: '为什么做这个站', link: '/why-this-site' },
  { text: '术语表', link: '/appendix-glossary' },
  { text: '源码速查', link: '/appendix-source-map' },
  { text: '主仓', link: 'https://github.com/deepseek-ai/deepseek-harness' },
]

/** 侧边栏：所有页面共享同一分组结构。 */
const sidebar: DefaultTheme.Sidebar = stages.map(group => ({
  text: group.text,
  collapsed: false,
  items: group.items,
})) as DefaultTheme.Sidebar

export default withMermaid({
  title: 'DeepSeek Harness 学习站',
  description: '渐进式二次开发学习文档',
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  ],

  markdown: {
    lineNumbers: true,
    theme: { light: 'github-light', dark: 'github-dark' },
  },

  mermaid: {
    // Mermaid 图表使用主仓同款主题
    theme: 'default',
  },

  themeConfig: {
    outline: {
      label: '本页目录',
      level: [2, 3],
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色主题',
    darkModeSwitchTitle: '切换到深色主题',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '返回顶部',
    skipToContentLabel: '跳至内容',

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            displayDetails: '显示详细列表',
            resetButtonTitle: '清除搜索',
            backButtonTitle: '关闭搜索',
            noResultsText: '未找到相关结果',
            footer: {
              selectText: '选择',
              selectKeyAriaLabel: '回车键',
              navigateText: '切换',
              navigateUpKeyAriaLabel: '上方向键',
              navigateDownKeyAriaLabel: '下方向键',
              closeText: '关闭',
              closeKeyAriaLabel: 'Esc 键',
            },
          },
        },
      },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/deepseek-ai/deepseek-harness' },
    ],

    nav,

    sidebar: {
      '/': sidebar,
    },

    footer: {
      message: '基于 DeepSeek Harness 源码整理的渐进式学习文档',
      copyright: 'MIT License · 仅供学习交流',
    },
  },
})
