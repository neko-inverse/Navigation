---
# 自定义导航页
layout: home
features: []
---

<div id="app-mount-point"></div>

<script setup>
import { onMounted, defineComponent, h } from 'vue'
import Navigation from './.vitepress/components/Navigation.vue'

onMounted(async () => {
  // 在客户端完全接管渲染，跳过水合过程
  const appMountPoint = document.getElementById('app-mount-point')
  if (appMountPoint) {
    // 创建一个简单的应用实例
    const app = defineComponent({
      render: () => h(Navigation)
    })
    
    // 手动挂载组件
    import('vue').then(({ createApp }) => {
      createApp(app).mount(appMountPoint)
    })
  }
})
</script>

