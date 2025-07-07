# Drupal 11 多语言集成说明

本文档说明如何将 React 应用的 i18n 与 Drupal 11 的多语言系统集成。

## 语言配置

### Drupal 语言设置
- **英语** (`en`): 无 URL 后缀，例如 `/`、`/about`
- **中文** (`zh-hans`): URL 后缀 `zh-hans`，例如 `/zh-hans/`、`/zh-hans/about`

### React i18n 语言码
- **英语**: `en`
- **简体中文**: `zh-CN`
- **繁体中文**: `zh-TW`
- **日语**: `ja`
- **韩语**: `ko`

## 语言映射

在 `src/i18n/index.js` 中定义了语言映射：

```javascript
// React 语言码 -> Drupal 语言码
export const languageMapping = {
  'zh-CN': 'zh-hans',
  'zh-TW': 'zh-hant',
  'en': 'en',
  'ja': 'ja',
  'ko': 'ko'
};

// Drupal 语言码 -> React 语言码
export const drupalToReactMapping = {
  'zh-hans': 'zh-CN',
  'zh-hant': 'zh-TW',
  'en': 'en',
  'ja': 'ja',
  'ko': 'ko'
};
```

## 语言检测优先级

1. **Drupal 全局变量**: `window.drupalSettings.path.currentLanguage`
2. **URL 路径检测**: 从当前 URL 的语言前缀检测
3. **URL 参数**: `?lang=zh-CN` (向后兼容)
4. **localStorage**: 用户上次选择的语言
5. **默认语言**: `zh-CN` (简体中文)

## 语言切换机制

### 当用户切换语言时:
1. 构建新的 URL (使用 Drupal 的语言前缀格式)
2. 保存用户选择到 localStorage
3. 重定向到新的 URL
4. 让 Drupal 处理语言切换和页面重载

### 示例:
- 从 `/about` (英语) 切换到中文 → `/zh-hans/about`
- 从 `/zh-hans/contact` (中文) 切换到英语 → `/contact`

## 使用方法

### 在组件中使用语言切换器:

```jsx
import LanguageSwitcher from './components/LanguageSwitcher';

function Header() {
  return (
    <nav>
      <LanguageSwitcher variant="simple" size="small" />
    </nav>
  );
}
```

### 语言切换器变体:
- `variant="button"`: 完整按钮样式
- `variant="chip"`: 芯片样式
- `variant="simple"`: 简单样式 (默认)

## 工具函数

### `buildLanguageUrl(targetLanguage)`
构建语言切换的 URL:

```javascript
import { buildLanguageUrl } from './utils/drupalLanguageSync';

const newUrl = buildLanguageUrl('zh-CN'); // "/zh-hans/current-path"
```

### `detectLanguageFromUrl()`
从当前 URL 检测语言:

```javascript
import { detectLanguageFromUrl } from './utils/drupalLanguageSync';

const currentLang = detectLanguageFromUrl(); // "zh-CN" 或 "en"
```

### `initializeLanguage()`
初始化语言设置:

```javascript
import { initializeLanguage } from './utils/drupalLanguageSync';

const initLang = initializeLanguage();
```

## Drupal 配置要求

### 1. 语言模块
确保启用以下模块:
- Language
- Content Translation
- Configuration Translation
- Interface Translation

### 2. 语言配置
在 Drupal 管理界面 (`/admin/config/regional/language`) 中:
- 添加语言: 英语 (`en`)、中文 (`zh-hans`)
- 设置 URL 前缀:
  - 英语: 无前缀
  - 中文: `zh-hans`

### 3. 检测和选择
在 `/admin/config/regional/language/detection` 中:
- 启用 "URL" 检测方法
- 设置为最高优先级

## 调试

开发模式下，控制台会显示语言初始化信息:

```javascript
console.log('Language initialization:', {
  drupalLang: 'zh-hans',    // 从 Drupal 获取
  urlLang: 'zh-CN',         // 从 URL 检测
  savedLang: 'en',          // 从 localStorage
  targetLang: 'zh-CN'       // 最终选择
});
```

## 注意事项

1. **页面重载**: 语言切换会触发页面重载，这是为了确保 Drupal 的多语言内容正确加载
2. **缓存**: 确保 Drupal 缓存配置正确，避免语言切换后内容不更新
3. **SEO**: 使用 Drupal 的 URL 结构有助于搜索引擎优化
4. **向后兼容**: 仍支持 `?lang=` URL 参数，但会优先使用 Drupal 的 URL 结构

## 故障排除

### 语言切换不生效
1. 检查 Drupal 语言配置
2. 确认 `window.drupalSettings` 可用
3. 检查控制台错误信息
4. 验证 URL 前缀配置

### 翻译内容未显示
1. 确认翻译文件存在于 `src/i18n/locales/`
2. 检查语言码映射是否正确
3. 验证 i18n 初始化设置