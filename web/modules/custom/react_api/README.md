# React API 模块

这个模块为 React 前端提供统一的 API 接口，支持多语言内容获取。

## 功能特性

- 🌐 多语言支持（中文、英文、西班牙语）
- 🔍 内容搜索功能
- 📊 内容统计信息
- 🚀 高性能缓存机制
- 🛡️ 完整的权限控制
- 📱 RESTful API 设计

## 支持的语言

- `zh-hans` - 简体中文（默认）
- `en` - English
- `es` - Español（西班牙语）

## API 端点

### 1. 通过页面路径获取内容
```
GET /api/page/{page_path}?lang={language}
```

**参数：**
- `page_path` - 页面路径（如：home, about, contact）
- `lang` - 语言代码（可选，默认：zh-hans）

**示例：**
```bash
curl "http://your-site.com/api/page/home?lang=en"
```

### 2. 通过内容类型获取内容列表
```
GET /api/content/{content_type}?lang={language}&limit={limit}&offset={offset}
```

**参数：**
- `content_type` - 内容类型（如：recipe, article, product）
- `lang` - 语言代码（可选）
- `limit` - 每页数量（可选，默认：20，最大：100）
- `offset` - 偏移量（可选，默认：0）
- `sort` - 排序字段（可选，默认：created）
- `order` - 排序方向（可选，ASC/DESC，默认：DESC）

**示例：**
```bash
curl "http://your-site.com/api/content/recipe?lang=es&limit=10&offset=0"
```

### 3. 获取单个内容项
```
GET /api/content/{content_type}/{node_id}?lang={language}
```

**参数：**
- `content_type` - 内容类型
- `node_id` - 节点ID
- `lang` - 语言代码（可选）

**示例：**
```bash
curl "http://your-site.com/api/content/recipe/123?lang=en"
```

### 4. 获取可用语言列表
```
GET /api/languages
```

**示例：**
```bash
curl "http://your-site.com/api/languages"
```

### 5. 搜索内容
```
GET /api/search?q={query}&type={content_type}&lang={language}
```

**参数：**
- `q` - 搜索关键词（必填）
- `type` - 内容类型（可选）
- `lang` - 语言代码（可选）
- `limit` - 每页数量（可选，默认：20，最大：50）
- `offset` - 偏移量（可选，默认：0）

**示例：**
```bash
curl "http://your-site.com/api/search?q=pasta&type=recipe&lang=en"
```

### 6. 获取内容统计信息
```
GET /api/stats?lang={language}
```

**参数：**
- `lang` - 语言代码（可选）

**示例：**
```bash
curl "http://your-site.com/api/stats?lang=zh-hans"
```

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    // 实际数据内容
  },
  "timestamp": 1640995200
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "message": "错误信息",
    "code": 400
  },
  "timestamp": 1640995200
}
```

## 内容类型字段映射

### 食谱 (recipe)
- `id` - 节点ID
- `title` - 标题
- `body` - 内容主体
- `field_recipe_summary` - 食谱摘要
- `field_prep_time` - 准备时间（分钟）
- `field_cook_time` - 烹饪时间（分钟）
- `field_servings` - 份数
- `field_difficulty` - 难度
- `field_recipe_image` - 食谱图片
- `field_recipe_category` - 食谱分类
- `field_recipe_ingredients` - 食材列表（仅详情页）
- `field_recipe_instructions` - 制作步骤（仅详情页）

### 文章 (article)
- `id` - 节点ID
- `title` - 标题
- `body` - 内容主体
- `field_summary` - 文章摘要
- `field_image` - 文章图片
- `field_tags` - 文章标签

## 缓存机制

- 页面内容：1小时缓存
- 内容列表：30分钟缓存
- 语言列表：24小时缓存
- 搜索结果：10分钟缓存
- 统计信息：1小时缓存

## 过滤器支持

在获取内容列表时，支持以下过滤器：

- `category` - 按分类过滤
- `difficulty` - 按难度过滤
- `featured` - 按推荐状态过滤
- `author` - 按作者过滤
- `field_*` - 按自定义字段过滤

**示例：**
```bash
curl "http://your-site.com/api/content/recipe?category=123&difficulty=easy&featured=1"
```

## 权限控制

- 所有 API 端点都会检查内容的访问权限
- 只返回已发布的内容
- 支持基于用户角色的访问控制

## 安装和配置

1. 启用模块：
```bash
drush en react_api
```

2. 清除缓存：
```bash
drush cr
```

3. 配置语言（如果需要）：
   - 进入 `/admin/config/regional/language`
   - 添加所需的语言
   - 配置内容翻译

## 开发和调试

### 清除 API 缓存
```bash
drush cc react_api
```

### 查看 API 日志
```bash
drush watchdog-show --type=react_api
```

## 前端集成

### React 中使用示例

```javascript
import contentApiService from './services/ContentApiService';

// 获取食谱列表
const recipes = await contentApiService.getRecipes({
  'page[limit]': 10,
  'filter[field_recipe_category.id]': 123
});

// 搜索内容
const searchResults = await contentApiService.searchContent('pasta', 'recipe');

// 获取统计信息
const stats = await contentApiService.getContentStats();
```

## 性能优化建议

1. 使用适当的缓存策略
2. 限制 API 请求频率
3. 使用分页避免大量数据传输
4. 在前端实现数据缓存
5. 使用 CDN 加速静态资源

## 故障排除

### 常见问题

1. **404 错误**
   - 检查路由配置
   - 确认模块已启用
   - 清除缓存

2. **权限错误**
   - 检查内容发布状态
   - 确认用户访问权限
   - 检查内容类型配置

3. **语言问题**
   - 确认语言已启用
   - 检查内容翻译状态
   - 验证语言代码正确性

### 调试模式

在开发环境中，可以在 `settings.php` 中添加：

```php
$config['react_api.settings']['debug'] = TRUE;
```

这将启用详细的错误日志和调试信息。
