<template>
  <div class="navigation-container">
    <div class="search-box">
      <input
        type="text"
        v-model="searchTerm"
        placeholder="搜索网站..."
        class="search-input"
      />
      <svg class="search-icon" viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
    </div>
    
    <div class="categories-container">
      <div 
        v-for="category in filteredCategories" 
        :key="category.name"
        class="category"
      >
        <div class="category-header">
          <span class="category-icon">{{ category.icon }}</span>
          <h3 class="category-title">{{ category.name }}</h3>
        </div>
        
        <div class="websites-grid">
          <a
            v-for="website in getFilteredWebsites(category)"
            :key="website.name"
            :href="website.url"
            target="_blank"
            rel="noopener noreferrer"
            class="website-card"
            @mouseenter="showTooltip($event, website.description)"
            @mouseleave="hideTooltip"
          >
            <div class="website-name">{{ website.name }}</div>
          </a>
        </div>
      </div>
    </div>
    
    <!-- Tooltip -->
    <div 
      v-if="tooltipVisible" 
      ref="tooltip"
      class="tooltip"
    >
      {{ tooltipText }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, onBeforeUnmount } from 'vue'
import navData from '../../data/navData.json'

const searchTerm = ref('')
const tooltipVisible = ref(false)
const tooltipText = ref('')
const tooltip = ref(null)
const isClient = typeof window !== 'undefined'

// 过滤后的分类
const filteredCategories = ref([])

// 获取过滤后的网站
function getFilteredWebsites(category) {
  if (!searchTerm.value.trim()) {
    return category.websites
  }
  
  const term = searchTerm.value.toLowerCase()
  return category.websites.filter(website => 
    website.name.toLowerCase().includes(term) || 
    website.description.toLowerCase().includes(term)
  )
}

// 显示提示框 - 只在客户端执行
function showTooltip(event, description) {
  if (!isClient) return
  
  tooltipText.value = description
  tooltipVisible.value = true
  
  nextTick(() => {
    const tooltipEl = tooltip.value
    if (tooltipEl) {
      const rect = event.target.getBoundingClientRect()
      const tooltipRect = tooltipEl.getBoundingClientRect()
      
      // 计算位置，确保不超出视口
      let left = rect.left + (rect.width - tooltipRect.width) / 2
      let top = rect.top - tooltipRect.height - 8
      
      // 调整位置以避免超出视口
      if (left < 0) left = 8
      if (top < 0) top = rect.bottom + 8
      
      tooltipEl.style.left = `${left}px`
      tooltipEl.style.top = `${top}px`
    }
  })
}

// 隐藏提示框
function hideTooltip() {
  tooltipVisible.value = false
}

// 更新过滤结果
function updateFilter() {
  const term = searchTerm.value.toLowerCase()
  
  if (!term) {
    filteredCategories.value = navData.categories
    return
  }
  
  // 过滤分类和网站
  filteredCategories.value = navData.categories
    .map(category => ({
      ...category,
      websites: getFilteredWebsites(category)
    }))
    .filter(category => category.websites.length > 0)
}

// 初始化数据
filteredCategories.value = navData.categories

// 监听搜索词变化 - 使用单独的onBeforeUnmount钩子
let unwatch
onMounted(() => {
  if (isClient) {
    unwatch = watch(searchTerm, updateFilter)
  }
})

// 确保在组件卸载时清除watch
onBeforeUnmount(() => {
  if (unwatch) {
    unwatch()
  }
})</script>

<style scoped>
.navigation-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* 搜索框样式 */
.search-box {
  position: relative;
  max-width: 500px;
  margin: 0 auto 3rem;
}

.search-input {
  width: 100%;
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  border: none;
  border-radius: 2rem;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.1),
              -5px -5px 10px rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  outline: none;
}

.search-input:focus {
  box-shadow: 7px 7px 14px rgba(0, 0, 0, 0.15),
              -7px -7px 14px rgba(255, 255, 255, 0.9);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

/* 分类容器 */
.categories-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

/* 分类样式 */
.category {
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.05),
              -8px -8px 16px rgba(255, 255, 255, 0.9);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.category:hover {
  transform: translateY(-5px);
  box-shadow: 10px 10px 20px rgba(0, 0, 0, 0.08),
              -10px -10px 20px rgba(255, 255, 255, 0.95);
}

.category-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.category-icon {
  font-size: 1.5rem;
  margin-right: 0.8rem;
}

.category-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  color: #343a40;
}

/* 网站网格 */
.websites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

/* 网站卡片 */
.website-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 0.75rem;
  text-decoration: none;
  color: #495057;
  font-weight: 500;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.05),
              -4px -4px 8px rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
  position: relative;
  min-height: 80px;
}

.website-card:hover {
  transform: translateY(-3px);
  box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.08),
              -6px -6px 12px rgba(255, 255, 255, 0.95);
  color: #007bff;
}

.website-name {
  text-align: center;
  font-size: 0.95rem;
  line-height: 1.3;
}

/* 提示框 */
.tooltip {
  position: fixed;
  background: rgba(33, 37, 41, 0.9);
  color: white;
  padding: 0.5rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
  max-width: 250px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .categories-container {
    grid-template-columns: 1fr;
  }
  
  .websites-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  
  .search-box {
    margin-bottom: 2rem;
  }
  
  .search-input {
    font-size: 1rem;
    padding: 0.8rem 2.2rem;
  }
}
</style>