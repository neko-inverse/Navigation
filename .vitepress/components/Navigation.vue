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
      <button 
        v-if="isManagerMode" 
        @click="toggleManagerMode" 
        class="manager-toggle"
        title="退出管理模式"
      >
        ✖
      </button>
      <button 
        v-else 
        @click="toggleManagerMode" 
        class="manager-toggle"
        title="进入管理模式"
      >
        ⚙️
      </button>
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
          <div v-if="isManagerMode" class="category-actions">
            <button @click="editCategory(category)" class="action-btn" title="编辑分类">✏️</button>
            <button @click="deleteCategory(category.name)" class="action-btn" title="删除分类">🗑️</button>
          </div>
        </div>
        
        <div class="websites-grid">
          <a
            v-for="website in getFilteredWebsites(category)"
            :key="website.name"
            :href="isManagerMode ? '#' : website.url"
            :target="isManagerMode ? '' : '_blank'"
            :rel="isManagerMode ? '' : 'noopener noreferrer'"
            class="website-card"
            @mouseenter="showTooltip($event, website.description)"
            @mouseleave="hideTooltip"
            @click.stop="isManagerMode ? editWebsite(category.name, website) : undefined"
          >
            <div class="website-name">{{ website.name }}</div>
            <div v-if="isManagerMode" class="website-actions">
              <button @click.stop="editWebsite(category.name, website)" class="action-btn-sm" title="编辑网站">✏️</button>
              <button @click.stop="deleteWebsite(category.name, website.name)" class="action-btn-sm" title="删除网站">🗑️</button>
            </div>
          </a>
          <div v-if="isManagerMode" class="add-website-btn" @click="addWebsite(category.name)">
            <div class="add-icon">+</div>
            <div class="add-text">添加网站</div>
          </div>
        </div>
      </div>
      <div v-if="isManagerMode" class="add-category-btn" @click="addCategory">
        <div class="add-icon-large">+</div>
        <div class="add-text-large">添加分类</div>
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
    
    <!-- 模态框 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ modalTitle }}</h2>
          <button @click="closeModal" class="close-btn">✖</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitModalForm">
            <template v-if="modalType === 'addCategory' || modalType === 'editCategory'">
              <div class="form-group">
                <label for="categoryName">分类名称</label>
                <input 
                  type="text" 
                  id="categoryName" 
                  v-model="currentCategory.name" 
                  required
                  placeholder="请输入分类名称"
                >
              </div>
              <div class="form-group">
                <label for="categoryIcon">分类图标</label>
                <input 
                  type="text" 
                  id="categoryIcon" 
                  v-model="currentCategory.icon" 
                  required
                  placeholder="请输入表情图标"
                >
              </div>
            </template>
            <template v-else-if="modalType === 'addWebsite' || modalType === 'editWebsite'">
              <div class="form-group">
                <label for="websiteName">网站名称</label>
                <input 
                  type="text" 
                  id="websiteName" 
                  v-model="currentWebsite.name" 
                  required
                  placeholder="请输入网站名称"
                >
              </div>
              <div class="form-group">
                <label for="websiteUrl">网站URL</label>
                <input 
                  type="url" 
                  id="websiteUrl" 
                  v-model="currentWebsite.url" 
                  required
                  placeholder="请输入网站URL"
                >
              </div>
              <div class="form-group">
                <label for="websiteDescription">网站描述</label>
                <input 
                  type="text" 
                  id="websiteDescription" 
                  v-model="currentWebsite.description" 
                  placeholder="请输入网站描述（可选）"
                >
              </div>
            </template>
            <div class="modal-actions">
              <button type="button" @click="closeModal" class="cancel-btn">取消</button>
              <button type="submit" class="submit-btn">{{ submitButtonText }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- 成功提示 -->
    <div v-if="showSuccessMessage" class="success-message">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onBeforeUnmount } from 'vue'

const searchTerm = ref('')
const tooltipVisible = ref(false)
const tooltipText = ref('')
const tooltip = ref(null)
const isClient = typeof window !== 'undefined'
const apiBaseUrl = 'http://localhost:3000/api'

// 原始数据和过滤后的分类
const rawCategories = ref([])
const filteredCategories = ref([])

// 管理模式相关状态
const isManagerMode = ref(false)
const showModal = ref(false)
const modalTitle = ref('')
const modalType = ref('') // 'addCategory', 'editCategory', 'addWebsite', 'editWebsite'
const currentCategory = ref({ name: '', icon: '' })
const currentWebsite = ref({ name: '', url: '', description: '' })
const currentEditingCategory = ref('')
const showSuccessMessage = ref(false)
const successMessage = ref('')

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

// 更新过滤结果
function updateFilter() {
  const term = searchTerm.value.toLowerCase()
  
  if (!term) {
    filteredCategories.value = [...rawCategories.value]
    return
  }
  
  // 过滤分类和网站
  filteredCategories.value = rawCategories.value
    .map(category => ({
      ...category,
      websites: getFilteredWebsites(category)
    }))
    .filter(category => category.websites.length > 0)
}

// 从后端API获取导航数据
async function fetchNavigationData() {
  if (!isClient) return
  
  try {
    const response = await fetch(`${apiBaseUrl}/navigation`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    rawCategories.value = data.categories || []
    updateFilter()
  } catch (error) {
    console.error('获取导航数据失败:', error)
    // 错误情况下使用本地备份数据
    try {
      const response = await fetch('/data/navData.json')
      if (response.ok) {
        const data = await response.json()
        rawCategories.value = data.categories || []
        updateFilter()
      }
    } catch (backupError) {
      console.error('获取备份数据也失败:', backupError)
    }
  }
}

// 切换管理模式
function toggleManagerMode() {
  isManagerMode.value = !isManagerMode.value
  // 进入管理模式时清空搜索
  if (isManagerMode.value) {
    searchTerm.value = ''
  }
}

// 显示成功消息
function showSuccess(text) {
  successMessage.value = text
  showSuccessMessage.value = true
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 3000)
}

// 打开模态框
function openModal(type, data = null) {
  modalType.value = type
  
  switch (type) {
    case 'addCategory':
      modalTitle.value = '添加分类'
      currentCategory.value = { name: '', icon: '' }
      break
    case 'editCategory':
      modalTitle.value = '编辑分类'
      currentCategory.value = { ...data }
      break
    case 'addWebsite':
      modalTitle.value = '添加网站'
      currentWebsite.value = { name: '', url: '', description: '' }
      currentEditingCategory.value = data
      break
    case 'editWebsite':
      modalTitle.value = '编辑网站'
      currentWebsite.value = { ...data }
      break
  }
  
  showModal.value = true
}

// 关闭模态框
function closeModal() {
  showModal.value = false
}

// 获取提交按钮文本
const submitButtonText = computed(() => {
  switch (modalType.value) {
    case 'addCategory':
    case 'addWebsite':
      return '添加'
    case 'editCategory':
    case 'editWebsite':
      return '保存'
    default:
      return '确认'
  }
})

// 提交模态框表单
async function submitModalForm() {
  try {
    switch (modalType.value) {
      case 'addCategory':
        await addCategoryToAPI(currentCategory.value)
        showSuccess('分类添加成功')
        break
      case 'editCategory':
        await updateCategoryToAPI(currentCategory.value)
        showSuccess('分类更新成功')
        break
      case 'addWebsite':
        await addWebsiteToAPI(currentEditingCategory.value, currentWebsite.value)
        showSuccess('网站添加成功')
        break
      case 'editWebsite':
        await updateWebsiteToAPI(currentEditingCategory.value, currentWebsite.value)
        showSuccess('网站更新成功')
        break
    }
    
    closeModal()
    // 重新加载数据
    await fetchNavigationData()
  } catch (error) {
    console.error('操作失败:', error)
    alert('操作失败，请稍后重试')
  }
}

// 添加分类
function addCategory() {
  openModal('addCategory')
}

// 编辑分类
function editCategory(category) {
  openModal('editCategory', category)
}

// 删除分类
async function deleteCategory(categoryName) {
  if (!confirm(`确定要删除分类「${categoryName}」吗？这将删除该分类下的所有网站。`)) {
    return
  }
  
  try {
    await deleteCategoryFromAPI(categoryName)
    showSuccess('分类删除成功')
    // 重新加载数据
    await fetchNavigationData()
  } catch (error) {
    console.error('删除分类失败:', error)
    alert('删除失败，请稍后重试')
  }
}

// 添加网站
function addWebsite(categoryName) {
  openModal('addWebsite', categoryName)
}

// 编辑网站
function editWebsite(categoryName, website) {
  currentEditingCategory.value = categoryName
  openModal('editWebsite', website)
}

// 删除网站
async function deleteWebsite(categoryName, websiteName) {
  if (!confirm(`确定要删除网站「${websiteName}」吗？`)) {
    return
  }
  
  try {
    await deleteWebsiteFromAPI(categoryName, websiteName)
    showSuccess('网站删除成功')
    // 重新加载数据
    await fetchNavigationData()
  } catch (error) {
    console.error('删除网站失败:', error)
    alert('删除失败，请稍后重试')
  }
}

// API 调用函数

// 添加分类到API
async function addCategoryToAPI(category) {
  const response = await fetch(`${apiBaseUrl}/navigation/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: category.name,
      icon: category.icon,
      websites: []
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || '添加分类失败')
  }
}

// 更新分类到API
async function updateCategoryToAPI(category) {
  const response = await fetch(`${apiBaseUrl}/navigation/categories/${encodeURIComponent(category.originalName || category.name)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      newName: category.name,
      icon: category.icon
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || '更新分类失败')
  }
}

// 从API删除分类
async function deleteCategoryFromAPI(categoryName) {
  const response = await fetch(`${apiBaseUrl}/navigation/categories/${encodeURIComponent(categoryName)}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || '删除分类失败')
  }
}

// 添加网站到API
async function addWebsiteToAPI(categoryName, website) {
  const response = await fetch(`${apiBaseUrl}/navigation/categories/${encodeURIComponent(categoryName)}/websites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: website.name,
      url: website.url,
      description: website.description
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || '添加网站失败')
  }
}

// 更新网站到API
async function updateWebsiteToAPI(categoryName, website) {
  const response = await fetch(`${apiBaseUrl}/navigation/categories/${encodeURIComponent(categoryName)}/websites/${encodeURIComponent(website.originalName || website.name)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      newName: website.name,
      url: website.url,
      description: website.description
    })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || '更新网站失败')
  }
}

// 从API删除网站
async function deleteWebsiteFromAPI(categoryName, websiteName) {
  const response = await fetch(`${apiBaseUrl}/navigation/categories/${encodeURIComponent(categoryName)}/websites/${encodeURIComponent(websiteName)}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || '删除网站失败')
  }
}

// 显示提示框 - 只在客户端执行
function showTooltip(event, description) {
  if (!isClient || !description) return
  
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

// 计算属性（自定义实现）
function customComputed(fn) {
  return {
    get: fn
  }
}

// 监听搜索词变化 - 使用单独的onBeforeUnmount钩子
let unwatch
onMounted(() => {
  if (isClient) {
    // 初始加载数据
    fetchNavigationData()
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

/* 管理模式切换按钮 */
.manager-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.manager-toggle:hover {
  background: rgba(0, 0, 0, 0.1);
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
  justify-content: space-between;
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
  flex: 1;
}

/* 分类操作按钮 */
.category-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.3rem;
  border-radius: 0.3rem;
  transition: background-color 0.2s ease;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
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

/* 网站操作按钮 */
.website-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.2rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.website-card:hover .website-actions {
  opacity: 1;
}

.action-btn-sm {
  background: rgba(255, 255, 255, 0.8);
  border: none;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0.2rem 0.3rem;
  border-radius: 0.2rem;
  transition: background-color 0.2s ease;
}

.action-btn-sm:hover {
  background: rgba(255, 255, 255, 1);
}

/* 添加网站按钮 */
.add-website-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(145deg, #e3f2fd, #bbdefb);
  border-radius: 0.75rem;
  cursor: pointer;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.05),
              -4px -4px 8px rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
  min-height: 80px;
  color: #1976d2;
}

.add-website-btn:hover {
  transform: translateY(-3px);
  background: linear-gradient(145deg, #bbdefb, #90caf9);
}

.add-icon {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.3rem;
}

.add-text {
  font-size: 0.8rem;
  text-align: center;
}

/* 添加分类按钮 */
.add-category-btn {
  background: linear-gradient(145deg, #e8f5e9, #c8e6c9);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.05),
              -8px -8px 16px rgba(255, 255, 255, 0.9);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #2e7d32;
}

.add-category-btn:hover {
  transform: translateY(-5px);
  box-shadow: 10px 10px 20px rgba(0, 0, 0, 0.08),
              -10px -10px 20px rgba(255, 255, 255, 0.95);
  background: linear-gradient(145deg, #c8e6c9, #a5d6a7);
}

.add-icon-large {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.add-text-large {
  font-size: 1.2rem;
  text-align: center;
  font-weight: 500;
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

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #343a40;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.3rem;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-body {
  padding: 1.5rem;
}

/* 表单样式 */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #6c757d;
  background: white;
  color: #6c757d;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #6c757d;
  color: white;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: #007bff;
  color: white;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.submit-btn:hover {
  background: #0056b3;
}

/* 成功提示 */
.success-message {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: #28a745;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 3000;
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
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
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .success-message {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    text-align: center;
  }
}
</style>