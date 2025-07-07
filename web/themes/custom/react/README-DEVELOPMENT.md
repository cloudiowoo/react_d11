
# React Theme 开发指南

## 📋 可用的 npm 脚本

### 基础命令

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览构建后的版本

### 部署相关命令

- `npm run deploy` - 手动执行一次编译和部署
- `npm run watch-deploy` - 监听文件变化并自动编译（使用 chokidar）
- `npm run watch-simple` - 监听文件变化并自动编译（使用 nodemon，推荐）

## 🐳 Docker Compose 配置

### 自动监听模式（推荐）

Docker Compose 已配置为自动启动文件监听：

```bash
# 启动所有服务（包括自动监听）
docker-compose -f docker-compose-d11.yml up -d

# 查看 node-vite 容器日志
docker logs -f node-vite

# 重启 node 容器（如果需要）
docker restart node-vite
```

### 手动控制模式

如果您想手动控制编译过程：

```bash
# 停止 node 容器的自动监听
docker stop node-vite

# 手动执行编译
docker exec -it node-vite npm run deploy

# 手动启动监听
docker exec -it node-vite npm run watch-simple
```

## 🔄 自动监听工作流程

### 启动自动监听
```bash
# 方式1: Docker Compose 自动启动（推荐）
docker-compose -f docker-compose-d11.yml up -d

# 方式2: 手动进入容器启动
docker exec -it node-vite sh -c "cd /var/www/webs/cloudio/test_d11/web/themes/custom/react/react-src && npm run watch-simple"
```

### 工作流程
1. 监听 `src` 目录下的所有文件变化
2. 当检测到文件变化时，自动执行：
   - `npm run build` - 编译 React 应用
   - 生成带 hash 的文件名（如：`react-app-xyz123.js`）
   - 自动更新 `react.libraries.yml` 文件
   - 生成新的版本号（时间戳）

### 手动清除 Drupal 缓存
监听脚本只处理 React 编译，Drupal 缓存需要手动清除：

```bash
# 1. 清除 Drupal 缓存
docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/cloudio/test_d11 && vendor/bin/drush cr"

# 2. 重新编译 Twig 模板（可选）
docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/cloudio/test_d11 && vendor/bin/drush twig:compile"

# 3. 最终缓存清除
docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/cloudio/test_d11 && vendor/bin/drush cr"
```

## 🛠️ 脚本说明

### `watch-deploy` vs `watch-simple`

**watch-deploy (chokidar)**
- 使用 `chokidar-cli`
- 需要设置 `SHELL` 环境变量
- 更精确的文件监听

**watch-simple (nodemon)** ⭐ 推荐
- 使用 `nodemon`
- 配置简单，容器兼容性好
- 监听 `js`, `jsx`, `ts`, `tsx`, `css` 文件
- Docker Compose 默认使用此模式

### 缓存破坏机制

每次编译都会：
1. 生成带 hash 的文件名
2. 更新 `react.libraries.yml` 中的文件路径
3. 生成新的版本号（基于时间戳）

这确保浏览器不会使用缓存的旧文件。

## 🚀 开发建议

1. **开发时**：使用 Docker Compose 自动监听模式
2. **测试时**：手动清除 Drupal 缓存查看效果
3. **部署时**：确保所有缓存都已清除
4. **调试时**：查看 `docker logs -f node-vite` 了解编译状态

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
├── auto-compile.sh     # 自动编译脚本
├── deploy.sh          # 部署脚本
└── homtime.libraries.yml  # Drupal 库配置
```

## 🐳 Docker 容器说明

- **node-test-vite**: 负责 React 文件监听和自动编译
- **php8-4-fpm-xdebug**: 运行 Drupal 和 Drush 命令
- **nginx**: Web 服务器

## 🌐 访问地址

开发完成后访问：http://local.test.d11.com/