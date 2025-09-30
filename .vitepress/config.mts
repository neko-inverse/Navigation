import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "智能导航页",
  description: "简洁、现代的网站导航，支持自定义分类和网站",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [],
    sidebar: false,
    socialLinks: [],
    footer: {
      message: '导航数据存储在 data/navData.json 文件中，可随时编辑更新',
      copyright: '© 2025 智能导航页'
    },
    appearance: true
  },
  
  // 自定义样式文件
  css: ['custom.css']
})
