# React Theme 开发指南

## 📋 可用的 npm 脚本

### 基础命令
- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览构建后的版本

### 自动构建命令
- `npm run build:auto` - 自动监听并构建（推荐）
  - 监听文件变化
  - 自动编译
  - 更新 libraries.yml
  - 生成带 hash 的文件名

## 🐳 Docker Compose 配置

### 自动监听模式（推荐）

Docker Compose 已配置为自动启动文件监听：

```bash
# 启动所有服务（包括自动监听）
docker-compose up -d

# 查看 node-vite 容器日志
docker logs -f node-test-vite

# 重启 node 容器（如果需要）
docker restart node-test-vite
```

### 手动控制模式

如果您想手动控制编译过程：

```bash
# 停止 node 容器的自动监听
docker stop node-test-vite

# 手动执行编译
docker exec -it node-test-vite npm run build

# 手动启动监听
docker exec -it node-test-vite npm run build:auto
```

## 🔄 自动监听工作流程

### 启动自动监听
```bash
# 方式1: Docker Compose 自动启动（推荐）
docker-compose up -d

# 方式2: 手动进入容器启动
docker exec -it node-test-vite npm run build:auto
```

### 工作流程
1. 监听 `src` 目录下的所有文件变化
2. 当检测到文件变化时，自动执行：
   - 编译 React 应用
   - 生成带 hash 的文件名（如：`react-app-xyz123.js`）
   - 自动更新 `react.libraries.yml` 文件
   - 生成新的版本号（时间戳）

### 手动清除 Drupal 缓存
监听脚本只处理 React 编译，Drupal 缓存需要手动清除：

```bash
# 1. 清除 Drupal 缓存
docker exec -it php8-4-fpm-xdebug drush cr

# 2. 重新编译 Twig 模板（可选）
docker exec -it php8-4-fpm-xdebug drush twig:compile

# 3. 最终缓存清除
docker exec -it php8-4-fpm-xdebug drush cr
```

## 🛠️ 构建说明

### 缓存破坏机制

每次构建都会：
1. 生成带 hash 的文件名
2. 更新 `react.libraries.yml` 中的文件路径
3. 生成新的版本号（基于时间戳）

这确保浏览器不会使用缓存的旧文件。

## 🚀 开发建议

1. **开发时**：使用 Docker Compose 自动监听模式
2. **测试时**：手动清除 Drupal 缓存查看效果
3. **部署时**：确保所有缓存都已清除
4. **调试时**：查看 `docker logs -f node-test-vite` 了解编译状态

## 📁 文件结构

```
web/themes/custom/react/
├── react-src/          # React 源码
│   ├── src/            # React 组件
│   ├── package.json    # npm 脚本配置
│   └── vite.config.js  # Vite 构建配置
├── js/                 # 编译输出目录
│   ├── react-app-[hash].js  # 主应用文件
│   └── assets/         # CSS 和其他资源
├── templates/          # Drupal 模板目录
│   └── layout/        # 布局模板
│       ├── html.html.twig          # 基础 HTML 模板
│       ├── html--front.html.twig   # 首页模板
│       ├── html--article.html.twig # 文章页模板
│       ├── html--recipe.html.twig  # 食谱页模板
│       ├── page.html.twig          # 基础页面模板
│       └── page--*.html.twig       # 各类型页面模板
├── react.info.yml     # 主题信息和库配置
├── react.theme        # 主题 PHP 函数
└── react.libraries.yml # 资源库配置
```

## 🎨 主题配置说明

### 主题基础配置 (react.info.yml)
```yaml
name: react
type: theme
base theme: stable9          # 基于 Drupal 稳定版主题
version: 1.0.0
description: 'Drupal 11 + React Theme'
core_version_requirement: ^11
generator: 'starterkit_theme:11.1.8'  # 基于 Starterkit 主题生成

# 默认加载的库
libraries:
  - react/base              # React 基础库
  - react/messages         # 消息提示库
  - core/normalize         # 样式标准化

# 扩展核心库
libraries-extend:
  user/drupal.user: [react/user]
  core/drupal.dialog: [react/dialog]
  # ... 其他扩展库
```

### 模板系统 (templates/layout)

1. **HTML 模板层级**：
   ```
   html.html.twig             # 基础 HTML 结构
   ├── html--front.html.twig  # 首页专用
   ├── html--article.html.twig # 文章页专用
   ├── html--articles.html.twig # 文章列表页
   ├── html--recipe.html.twig  # 食谱页专用
   └── html--recipes.html.twig # 食谱列表页
   ```

2. **页面模板层级**：
   ```
   page.html.twig            # 基础页面结构
   ├── page--front.html.twig # 首页布局
   ├── page--article.html.twig # 文章页布局
   ├── page--articles.html.twig # 文章列表布局
   ├── page--recipe.html.twig  # 食谱页布局
   └── page--recipes.html.twig # 食谱列表布局
   ```

### 主题函数 (react.theme)

1. **模板建议系统**：
   ```php
   // 基于内容类型自动选择模板
   function react_theme_suggestions_html_alter()
   function react_theme_suggestions_page_alter()
   ```

2. **模板处理流程**：
   - 检测当前节点类型（文章/食谱）
   - 生成对应的模板建议
   - 支持路径别名的模板映射
   - 自动记录模板选择日志

### 开发建议

1. **模板开发**：
   - 保持基础模板（html.html.twig, page.html.twig）的通用性
   - 在特定类型模板中添加自定义标记和类
   - 使用 Twig 调试工具查看模板选择过程

2. **主题调试**：
   ```bash
   # 重新编译 Twig 模板
   docker exec -it php8-4-fpm-xdebug drush twig:compile

   # 清除主题缓存
   docker exec -it php8-4-fpm-xdebug drush cr
   ```

3. **React 集成**：
   - 确保 React 组件与 Drupal 模板结构匹配
   - 使用 data-* 属性传递模板变量
   - 保持模板结构简洁，业务逻辑放在 React 中

## 🐳 Docker 容器说明

- **node-test-vite**: 负责 React 文件监听和自动编译
- **php8-4-fpm-xdebug**: 运行 Drupal 和 Drush 命令
- **nginx**: Web 服务器

## 🌐 访问地址

开发完成后访问：http://local.test.d11.com/
