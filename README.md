# Drupal 11 + React 全栈应用

[English](README_EN.md) | [中文](README.md)

基于 Drupal 11 和 React 18 构建的现代化全栈应用框架，实现内容管理与前端交互的最佳实践。
本项目的 React 主题基于 Drupal 11 默认演示数据（Umami 食谱）定制开发，提供完整的参考实现。

## 💡 功能特色

- **完整演示**：基于 Drupal 11 Umami 演示数据开发
- **多语言支持**：支持英文、中文、西班牙语
- **响应式设计**：完美适配移动端和桌面端
- **现代化交互**：SPA 体验 + 服务端渲染
- **开箱即用**：安装演示数据后可直接运行
- **全自动构建**：容器启动即完成安装并开启实时编译

## 🏗️ 架构概述

### 技术栈
- **后端**: Drupal 11 (PHP 8.4)
- **前端**: React 18 + Vite
- **主题**: 自定义 React 主题
- **数据库**: PostgreSQL 17
- **缓存**: Redis (可选)

### 架构特点
```
项目结构
├── web/                        # Drupal 根目录
│   ├── modules/custom/         # 自定义模块
│   │   └── react_api/         # React API 模块
│   └── themes/custom/react/   # React 主题
│       ├── react-src/         # React 源码
│       ├── js/                # 编译后的 JS
│       └── templates/         # Drupal 模板
├── docker/                    # Docker 配置
└── composer.json             # Drupal 依赖管理
```

## 🎯 业务场景对比

### 此架构适用场景
- 需要强大的内容管理能力 + 现代化前端体验
- 复杂的内容工作流 + 丰富的交互界面
- 多语言、多站点 + SPA 用户体验
- 企业级内容平台 + 消费级用户界面

### 对比传统架构

| 特性 | Drupal + React | 纯 Drupal | 纯 React |
|------|----------------|-----------|-----------|
| 内容管理 | ✅ 强大 | ✅ 强大 | ❌ 需自建 |
| 前端体验 | ✅ 优秀 | ⚠️ 一般 | ✅ 优秀 |
| 开发效率 | ⚠️ 需协调 | ✅ 高 | ✅ 高 |
| 可维护性 | ✅ 分离清晰 | ✅ 高 | ✅ 高 |
| SEO | ✅ 支持 | ✅ 原生 | ⚠️ 需优化 |

## 🔗 关键集成文件

### Drupal-React 集成
1. **模块集成**
   ```
   web/modules/custom/react_api/
   ├── react_api.routing.yml      # API 路由定义
   └── src/Controller/           # API 控制器
   ```

2. **主题集成**
   ```
   web/themes/custom/react/
   ├── react.libraries.yml       # 资源加载配置（自动更新）
   ├── templates/               # Drupal 模板
   └── react-src/              # React 应用
   ```

3. **数据流**
   - Drupal 提供 RESTful API
   - React 通过 ContentApiService 消费 API
   - 支持多语言内容同步

## 🚀 快速开始

1. **环境准备**
   ```bash
   # 复制并配置 docker-compose.yml
   cp docker/docker-compose.yml.example docker/docker-compose.yml
   # 根据需要修改数据库密码等配置

   # 启动所有服务
   # node-test-vite 容器会自动：
   # 1. 安装 npm 依赖
   # 2. 启动文件监听
   # 3. 检测到改动自动编译
   # 4. 更新 libraries.yml
   docker-compose up -d
   ```

2. **安装 Drupal**
   ```bash
   # 安装依赖
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && composer install"

   # 初始化数据库
   # 1. 连接到 PostgreSQL
   docker exec -it pg17 sh -c "psql -h localhost -U postgres -d postgres"

    -- 创建数据库和用户
    create database db_test_d11;
    create user usr_test with encrypted password 'test-123';
    \c db_test_d11


    -- 基础权限
    GRANT ALL PRIVILEGES ON DATABASE db_test_d11 TO usr_test;
    GRANT ALL ON SCHEMA public TO usr_test;
    GRANT USAGE ON SCHEMA public TO usr_test;
    GRANT CREATE ON SCHEMA public TO usr_test;

    -- 对象权限
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO usr_test;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO usr_test;
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO usr_test;

    -- 默认权限
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO usr_test;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO usr_test;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO usr_test;

    -- 用户级权限
    ALTER USER usr_test CREATEDB;
    GRANT TEMPORARY ON DATABASE db_test_d11 TO usr_test;
    GRANT CONNECT ON DATABASE db_test_d11 TO usr_test;

    -- 数据库更新格式
    ALTER DATABASE "db_test_d11" SET bytea_output = 'escape';

    \q


   # 安装 Drupal（选择 Demo: Umami Food Magazine (Experimental)）
   docker exec -it php8-4-fpm-xdebug sh -c 'cd /var/www/webs/test_d11 && vendor/bin/drush site:install demo_umami \
    --db-url="pgsql://usr_test:test-123@pg17:5432/db_test_d11" \
    --account-name=admin \
    --account-pass=admin \
    --site-name="Drupal 11 + React Demo" \
    -y'
   ```

   安装完成后，您可以通过以下两种方式进行系统配置：

   ### A. 通过管理后台配置（推荐）

   1. **启用必要模块**
      - 访问 `http://local.test.d11.com/admin/modules`
      - 勾选并启用以下模块：
        - React API（自定义模块）
        - JSON:API（API 依赖）
        - RESTful Web Services（API 依赖）
      - 点击"安装"按钮

   2. **多语言设置**
      - 访问 `http://local.test.d11.com/admin/config/regional/language`
      - 添加中文（简体）和西班牙语
      - 将英语设置为默认语言
      - 在"Detection and Selection"设置中：
        - 访问 `http://local.test.d11.com/admin/config/regional/language/detection`
        - 将"URL 语言检测"拖动到最顶部
        - 保存配置

   3. **启用 React 主题**
      - 访问 `http://local.test.d11.com/admin/appearance`
      - 找到"React Theme"点击"设置为默认主题"
      - 访问 `http://local.test.d11.com/admin/structure/block`
      - 仅保留"Main page content"区块，禁用其他所有区块

   ### B. 通过命令行配置

   ```bash
   # 启用必要的模块
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush en react_api jsonapi rest -y"

   # 多语言设置优化
   # 启用多语言支持并添加语言
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush en locale -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush language-add zh-hans"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush language-add es"

   # 设置英语为默认语言
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush language-default en"

   # 设置语言检测顺序，将 URL 检测方式设为首选
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set language.types.negotiation.language_interface.enabled path 1 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set language.types.negotiation.language_interface.enabled language-browser 2 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set language.types.negotiation.language_interface.enabled user 3 -y"

   # 启用 React 主题
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush theme:enable react -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set system.theme default react -y"

   # 清理区块设置（仅保留页面内容）
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_content status 1 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_breadcrumbs status 0 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_help status 0 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_messages status 0 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_page_title status 0 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_primary_local_tasks status 0 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_secondary_local_tasks status 0 -y"

   # 清除缓存以应用更改
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush cr"
   ```

3. **开发自动化**
   ```bash
   # 查看 React 自动构建状态
   docker logs -f node-test-vite

   # 所有 React 源码改动会自动：
   # - 触发重新编译
   # - 生成新的文件 hash
   # - 更新 libraries.yml
   # - 实时预览变更

   # 需要时清除 Drupal 缓存
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush cr"
   ```

## 📱 演示功能

### 已实现功能
- ✅ 响应式首页展示
- ✅ 食谱列表与详情
- ✅ 文章列表与详情
- ✅ 多语言切换
- ✅ 实时搜索
- ✅ 分类过滤
- ✅ 标签云展示

### 页面预览
- 首页：`http://local.test.d11.com/`
- 食谱列表：`http://local.test.d11.com/recipes`
- 文章列表：`http://local.test.d11.com/articles`
- 后台管理：`http://local.test.d11.com/admin`
  - 用户名：`your+name`
  - 密码：`your+password`

## 🔄 开发工作流

### React 自动化开发
1. **容器自动化**
   - 容器启动自动安装 npm 依赖
   - 自动启动文件监听服务
   - 自动检测源码改动
   - 自动执行编译流程

2. **编译自动化**
   - 改动检测自动触发构建
   - 自动生成带 hash 的文件名
   - 自动更新 Drupal 库配置
   - 支持热更新和实时预览

3. **调试方式**
   - 实时查看构建日志：`docker logs -f node-test-vite`
   - 监控编译输出：`web/themes/custom/react/js/`
   - 检查库配置：`web/themes/custom/react/react.libraries.yml`

### 开发提示
- 无需手动运行 npm install
- 无需手动启动构建服务
- 保存文件自动触发编译
- 浏览器自动加载最新版本

## 📚 更多文档

- [React 主题开发指南](web/themes/custom/react/README-DEVELOPMENT.md)
- [Docker 环境配置](docker/README.md)
- [API 文档](web/modules/custom/react_api/README.md)
