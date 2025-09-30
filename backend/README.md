# 导航页后端服务

一个简单的 Express 后端服务，提供 API 接口用于操作导航数据文件，支持前端执行新增、删除、修改等操作。

## 功能特性

- 获取所有导航数据
- 按分类获取数据
- 添加、更新、删除分类
- 在分类中添加、更新、删除网站

## 技术栈

- Node.js
- Express.js
- CORS

## 快速开始

### 安装依赖

```bash
cd d:/FTMDS/navigation/backend
npm install
```

### 启动服务

开发模式（使用 nodemon，支持热重载）：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

服务将在 http://localhost:3000 启动。

## API 接口文档

### 获取所有导航数据

```
GET /api/navigation
```

返回格式：

```json
{
  "categories": [
    {
      "name": "分类名称",
      "icon": "分类图标",
      "websites": [
        {
          "name": "网站名称",
          "url": "网站URL",
          "description": "网站描述"
        }
      ]
    }
  ]
}
```

### 获取特定分类

```
GET /api/navigation/categories/:name
```

参数：
- `name`：分类名称

返回格式：

```json
{
  "name": "分类名称",
  "icon": "分类图标",
  "websites": [
    {
      "name": "网站名称",
      "url": "网站URL",
      "description": "网站描述"
    }
  ]
}
```

### 添加新分类

```
POST /api/navigation/categories
```

请求体：

```json
{
  "name": "分类名称",
  "icon": "分类图标",
  "websites": [ // 可选
    {
      "name": "网站名称",
      "url": "网站URL",
      "description": "网站描述" // 可选
    }
  ]
}
```

返回格式：创建的分类对象

### 更新分类

```
PUT /api/navigation/categories/:name
```

参数：
- `name`：原分类名称

请求体：（可选字段）

```json
{
  "newName": "新分类名称",
  "icon": "新分类图标",
  "websites": [
    {
      "name": "网站名称",
      "url": "网站URL",
      "description": "网站描述"
    }
  ]
}
```

返回格式：更新后的分类对象

### 删除分类

```
DELETE /api/navigation/categories/:name
```

参数：
- `name`：分类名称

返回格式：

```json
{
  "message": "分类删除成功"
}
```

### 在分类中添加网站

```
POST /api/navigation/categories/:categoryName/websites
```

参数：
- `categoryName`：分类名称

请求体：

```json
{
  "name": "网站名称",
  "url": "网站URL",
  "description": "网站描述" // 可选
}
```

返回格式：创建的网站对象

### 更新网站信息

```
PUT /api/navigation/categories/:categoryName/websites/:websiteName
```

参数：
- `categoryName`：分类名称
- `websiteName`：原网站名称

请求体：（可选字段）

```json
{
  "newName": "新网站名称",
  "url": "新网站URL",
  "description": "新网站描述"
}
```

返回格式：更新后的网站对象

### 删除网站

```
DELETE /api/navigation/categories/:categoryName/websites/:websiteName
```

参数：
- `categoryName`：分类名称
- `websiteName`：网站名称

返回格式：

```json
{
  "message": "网站删除成功"
}
```

## 数据文件位置

导航数据存储在 `../data/navData.json` 文件中，后端服务会直接读取和写入该文件。

## 错误处理

所有 API 接口在出错时都会返回适当的 HTTP 状态码和错误信息。常见的错误状态码：

- 400：请求参数错误或资源已存在
- 404：请求的资源不存在
- 500：服务器内部错误

## 开发说明

1. 确保 Node.js 版本 >= 12.x
2. 修改服务器端口：可以通过环境变量 `PORT` 设置，默认端口为 3000
3. 数据文件路径：默认为 `../data/navData.json`，可以在 `server.js` 文件中修改