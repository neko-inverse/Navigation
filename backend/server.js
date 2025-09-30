const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 数据文件路径
const DATA_FILE_PATH = path.resolve(__dirname, '../data/navData.json');

// 中间件配置
app.use(cors());
app.use(express.json());

// 读取数据文件的辅助函数
async function readNavData() {
    try {
        const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取导航数据失败:', error);
        throw error;
    }
}

// 写入数据文件的辅助函数
async function writeNavData(data) {
    try {
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('写入导航数据失败:', error);
        throw error;
    }
}

// API 路由

// 获取所有导航数据
app.get('/api/navigation', async (req, res) => {
    try {
        const navData = await readNavData();
        res.json(navData);
    } catch (error) {
        res.status(500).json({ error: '获取导航数据失败' });
    }
});

// 获取特定分类
app.get('/api/navigation/categories/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const navData = await readNavData();
        const category = navData.categories.find(cat => cat.name === name);
        
        if (category) {
            res.json(category);
        } else {
            res.status(404).json({ error: '分类不存在' });
        }
    } catch (error) {
        res.status(500).json({ error: '获取分类失败' });
    }
});

// 添加新分类
app.post('/api/navigation/categories', async (req, res) => {
    try {
        const { name, icon, websites = [] } = req.body;
        
        if (!name || !icon) {
            return res.status(400).json({ error: '分类名称和图标是必需的' });
        }
        
        const navData = await readNavData();
        
        // 检查分类是否已存在
        if (navData.categories.some(cat => cat.name === name)) {
            return res.status(400).json({ error: '分类已存在' });
        }
        
        const newCategory = {
            name,
            icon,
            websites: websites.map(website => ({
                name: website.name,
                url: website.url,
                description: website.description || ''
            }))
        };
        
        navData.categories.push(newCategory);
        await writeNavData(navData);
        
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ error: '添加分类失败' });
    }
});

// 更新分类
app.put('/api/navigation/categories/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const { newName, icon, websites } = req.body;
        
        const navData = await readNavData();
        const categoryIndex = navData.categories.findIndex(cat => cat.name === name);
        
        if (categoryIndex === -1) {
            return res.status(404).json({ error: '分类不存在' });
        }
        
        // 更新分类信息
        if (newName !== undefined) {
            navData.categories[categoryIndex].name = newName;
        }
        if (icon !== undefined) {
            navData.categories[categoryIndex].icon = icon;
        }
        if (websites !== undefined) {
            navData.categories[categoryIndex].websites = websites.map(website => ({
                name: website.name,
                url: website.url,
                description: website.description || ''
            }));
        }
        
        await writeNavData(navData);
        res.json(navData.categories[categoryIndex]);
    } catch (error) {
        res.status(500).json({ error: '更新分类失败' });
    }
});

// 删除分类
app.delete('/api/navigation/categories/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const navData = await readNavData();
        
        const initialLength = navData.categories.length;
        navData.categories = navData.categories.filter(cat => cat.name !== name);
        
        if (navData.categories.length === initialLength) {
            return res.status(404).json({ error: '分类不存在' });
        }
        
        await writeNavData(navData);
        res.json({ message: '分类删除成功' });
    } catch (error) {
        res.status(500).json({ error: '删除分类失败' });
    }
});

// 在分类中添加网站
app.post('/api/navigation/categories/:categoryName/websites', async (req, res) => {
    try {
        const { categoryName } = req.params;
        const { name, url, description = '' } = req.body;
        
        if (!name || !url) {
            return res.status(400).json({ error: '网站名称和URL是必需的' });
        }
        
        const navData = await readNavData();
        const category = navData.categories.find(cat => cat.name === categoryName);
        
        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }
        
        // 检查网站是否已存在
        if (category.websites.some(website => website.name === name)) {
            return res.status(400).json({ error: '网站已存在' });
        }
        
        const newWebsite = { name, url, description };
        category.websites.push(newWebsite);
        
        await writeNavData(navData);
        res.status(201).json(newWebsite);
    } catch (error) {
        res.status(500).json({ error: '添加网站失败' });
    }
});

// 更新网站信息
app.put('/api/navigation/categories/:categoryName/websites/:websiteName', async (req, res) => {
    try {
        const { categoryName, websiteName } = req.params;
        const { newName, url, description } = req.body;
        
        const navData = await readNavData();
        const category = navData.categories.find(cat => cat.name === categoryName);
        
        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }
        
        const websiteIndex = category.websites.findIndex(website => website.name === websiteName);
        
        if (websiteIndex === -1) {
            return res.status(404).json({ error: '网站不存在' });
        }
        
        // 更新网站信息
        if (newName !== undefined) {
            category.websites[websiteIndex].name = newName;
        }
        if (url !== undefined) {
            category.websites[websiteIndex].url = url;
        }
        if (description !== undefined) {
            category.websites[websiteIndex].description = description;
        }
        
        await writeNavData(navData);
        res.json(category.websites[websiteIndex]);
    } catch (error) {
        res.status(500).json({ error: '更新网站失败' });
    }
});

// 删除网站
app.delete('/api/navigation/categories/:categoryName/websites/:websiteName', async (req, res) => {
    try {
        const { categoryName, websiteName } = req.params;
        const navData = await readNavData();
        const category = navData.categories.find(cat => cat.name === categoryName);
        
        if (!category) {
            return res.status(404).json({ error: '分类不存在' });
        }
        
        const initialLength = category.websites.length;
        category.websites = category.websites.filter(website => website.name !== websiteName);
        
        if (category.websites.length === initialLength) {
            return res.status(404).json({ error: '网站不存在' });
        }
        
        await writeNavData(navData);
        res.json({ message: '网站删除成功' });
    } catch (error) {
        res.status(500).json({ error: '删除网站失败' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`导航数据后端服务已启动，监听端口 ${PORT}`);
    console.log(`API 地址: http://localhost:${PORT}/api/navigation`);
    console.log('支持的操作: 获取、添加、更新、删除分类和网站');
});