# React 开发指南

## 🚀 快速开始

### 1. 安装依赖
```bash
cd web/themes/custom/react/react-src
npm install
```

### 2. 开发模式（推荐）
启动实时编译，修改源码后自动重新编译：
```bash
npm run watch
```

### 3. 生产构建
一次性编译：
```bash
npm run build
```

### 4. 开发服务器（可选）
启动本地开发服务器：
```bash
npm run dev
```

## 📁 目录结构

```
react-src/
├── src/
│   ├── App.jsx          # 主应用组件
│   ├── App.css          # 应用样式
│   ├── main.jsx         # 入口文件
│   └── index.css        # 全局样式
├── package.json         # 项目配置
├── vite.config.js       # Vite 构建配置
└── index.html           # HTML 模板
```

## 🔧 自动编译工作流程

1. **启动监视模式**：
   ```bash
   npm run watch
   ```

2. **修改源码**：编辑 `src/` 目录下的任何文件

3. **自动编译**：Vite 自动检测变化并重新编译到 `../js/` 目录

4. **刷新页面**：清除 Drupal 缓存后刷新页面查看效果
   ```bash
   vendor/bin/drush cr
   ```

## 📦 编译输出

编译后的文件会输出到 `../js/` 目录：
- `react-app.js` - 主 JavaScript 文件
- `assets/main-[hash].css` - 样式文件

## 🎯 开发建议

1. **保持监视模式运行**：在开发过程中始终保持 `npm run watch` 运行
2. **及时清除缓存**：修改后记得清除 Drupal 缓存
3. **组件化开发**：将复杂功能拆分为独立组件
4. **CSS 模块化**：使用 CSS 类名避免样式冲突

## 🐛 故障排除

### 编译失败
1. 检查控制台错误信息
2. 确保语法正确
3. 重新安装依赖：`npm install`

### 页面不更新
1. 清除 Drupal 缓存：`vendor/bin/drush cr`
2. 强制刷新浏览器：Ctrl+F5
3. 检查网络选项卡中的文件加载情况

### 监视模式停止
1. 重新启动：`npm run watch`
2. 检查文件权限
3. 重启终端会话
