/**
 * Drupal 语言同步工具
 * 处理 Drupal 11 多语言配置与 React i18n 的集成
 */

import { drupalToReactMapping, languageMapping, supportedLanguages } from '../i18n';

/**
 * 从 Drupal 设置中获取当前语言
 * @returns {string} React 语言码
 */
export const getDrupalCurrentLanguage = () => {
  if (typeof window !== 'undefined' && window.drupalSettings?.path?.currentLanguage) {
    const drupalLang = window.drupalSettings.path.currentLanguage;
    return drupalToReactMapping[drupalLang] || 'zh-CN';
  }
  return null;
};

/**
 * 从当前URL路径中检测语言
 * @returns {string|null} React 语言码
 */
export const detectLanguageFromUrl = () => {
  if (typeof window === 'undefined') return null;

  const path = window.location.pathname;

  // 检查是否有语言前缀
  for (const [reactLang, config] of Object.entries(supportedLanguages)) {
    if (config.urlPrefix) {
      // 检查路径是否以语言前缀开头（完整匹配或后跟 /）
      if (path === `/${config.urlPrefix}` || path.startsWith(`/${config.urlPrefix}/`)) {
        return reactLang;
      }
    }
  }

  // 没有前缀默认为英语
  return 'en';
};

/**
 * 初始化语言设置
 * 在React应用启动时调用，确保语言设置的一致性
 */
export const initializeLanguage = () => {
  // 优先级：Drupal设置 > URL路径 > localStorage > 默认
  const drupalLang = getDrupalCurrentLanguage();
  const urlLang = detectLanguageFromUrl();
  const savedLang = localStorage.getItem('homtime-language');

  let targetLang = 'zh-CN'; // 默认语言

  if (drupalLang && supportedLanguages[drupalLang]) {
    targetLang = drupalLang;
  } else if (urlLang && supportedLanguages[urlLang]) {
    targetLang = urlLang;
  } else if (savedLang && supportedLanguages[savedLang]) {
    targetLang = savedLang;
  }

  console.log('Language initialization:', {
    drupalLang,
    urlLang,
    savedLang,
    targetLang
  });

  return targetLang;
};

/**
 * 构建语言切换URL
 * @param {string} targetLanguage React语言码
 * @returns {string} 新的URL
 */
export const buildLanguageUrl = (targetLanguage) => {
  if (typeof window === 'undefined') return '';

  const currentPath = window.location.pathname;
  const search = window.location.search;
  const hash = window.location.hash;

  console.log('构建语言URL - 输入:', {
    targetLanguage,
    currentPath,
    search,
    hash
  });

  // 移除现有的语言前缀（如果有）
  let newPath = currentPath.replace(/^\/zh-hans\/?/, '/');

  // 确保路径以 / 开头
  if (!newPath.startsWith('/')) {
    newPath = '/' + newPath;
  }

  // 如果是中文，添加 zh-hans 前缀
  if (targetLanguage === 'zh-CN') {
    // 如果是根路径，直接使用语言前缀
    if (newPath === '/') {
      newPath = '/zh-hans';
    } else {
      newPath = '/zh-hans' + newPath;
    }
  }

  // 移除重复的斜杠
  newPath = newPath.replace(/\/+/g, '/');

  // 确保路径不以 / 结尾（除非是根路径）
  if (newPath !== '/' && newPath.endsWith('/')) {
    newPath = newPath.slice(0, -1);
  }

  console.log('构建语言URL - 输出:', {
    newPath,
    finalUrl: `${newPath}${search}${hash}`
  });

  return `${newPath}${search}${hash}`;
};

/**
 * 检查当前页面是否是首页
 * @returns {boolean}
 */
export const isHomePage = () => {
  if (typeof window === 'undefined') return false;

  const path = window.location.pathname;

  // 检查是否是根路径或者只有语言前缀的路径
  if (path === '/') return true;

  for (const config of Object.values(supportedLanguages)) {
    if (config.urlPrefix && (path === `/${config.urlPrefix}` || path === `/${config.urlPrefix}/`)) {
      return true;
    }
  }

  return false;
};

/**
 * 获取语言切换的完整配置信息
 * @returns {Object} 语言配置对象
 */
export const getLanguageConfig = () => {
  return {
    supportedLanguages,
    languageMapping,
    drupalToReactMapping,
    currentLanguage: detectLanguageFromUrl(),
    isHomePage: isHomePage()
  };
};

/**
 * 构建特定页面的URL
 * @param {string} page 页面名称 ('about-us', 'partner-hotels', 'home' 等)
 * @param {string} targetLanguage 目标语言（可选，默认使用当前语言）
 * @returns {string} 新的URL
 */
export const buildPageUrl = (page, targetLanguage) => {
  if (typeof window === 'undefined') return '';

  const currentLang = targetLanguage || detectLanguageFromUrl();
  const langConfig = supportedLanguages[currentLang];

  let basePath = '';

  // 添加语言前缀（英语除外）
  if (langConfig && langConfig.urlPrefix) {
    basePath = `/${langConfig.urlPrefix}`;
  }

  let pagePath = '';
  if (page === 'about-us') {
    pagePath = '/about-us';
  } else if (page === 'partner-hotels') {
    pagePath = '/partner-hotels';
  } else if (page === 'mui-demo') {
    pagePath = '/mui-demo';
  } else if (page === 'products' || page === 'products-listing') {
    pagePath = '/products-listing';
  } else if (page.startsWith('product/')) {
    // 对于产品页面，直接使用页面名称作为路径
    pagePath = '/' + page;
  } else {
    // 默认为首页
    pagePath = '';
  }

  const fullPath = basePath + pagePath || '/';

  console.log('Build page URL:', {
    page,
    currentLang,
    basePath,
    pagePath,
    fullPath
  });

  return fullPath;
};

/**
 * 从URL路径中提取页面名称
 * @param {string} path URL路径（可选，默认使用当前路径）
 * @returns {string} 页面名称
 */
export const extractPageFromUrl = (path) => {
  const targetPath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');

  // 移除语言前缀
  let cleanPath = targetPath;
  for (const config of Object.values(supportedLanguages)) {
    if (config.urlPrefix && targetPath.startsWith(`/${config.urlPrefix}`)) {
      cleanPath = targetPath.substring(`/${config.urlPrefix}`.length) || '/';
      break;
    }
  }

  // 路由映射
  if (cleanPath === '/partner-hotels' || cleanPath === '/partner-hotels/') {
    return 'partner-hotels';
  } else if (cleanPath === '/about-us' || cleanPath === '/about-us/') {
    return 'about-us';
  } else if (cleanPath === '/mui-demo' || cleanPath === '/mui-demo/') {
    return 'mui-demo';
  } else if (cleanPath === '/products-listing' || cleanPath === '/products-listing/') {
    return 'products';
  } else if (cleanPath.startsWith('/product/')) {
    // 对于产品页面，返回完整的路径（去掉开头的斜杠）
    return cleanPath.substring(1);
  }

  return 'home';
};

export default {
  getDrupalCurrentLanguage,
  detectLanguageFromUrl,
  initializeLanguage,
  buildLanguageUrl,
  buildPageUrl,
  extractPageFromUrl,
  isHomePage,
  getLanguageConfig
};
