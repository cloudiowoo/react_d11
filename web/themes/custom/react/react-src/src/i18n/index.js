import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// 导入翻译文件
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import zhCNTranslations from './locales/zh-CN.json';

// React i18n 语言码与 Drupal 语言码的映射
export const languageMapping = {
  // React语言码 -> Drupal语言码
  'zh-CN': 'zh-hans',
  'en': 'en',
  'es': 'es'
};

// Drupal语言码 -> React语言码的反向映射
export const drupalToReactMapping = {
  'zh-hans': 'zh-CN',
  'en': 'en',
  'es': 'es'
};

// 支持的语言配置
export const supportedLanguages = {
  'en': {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    drupalCode: 'en',
    urlPrefix: '' // 英语无URL前缀
  },
  'zh-CN': {
    name: 'Simplified Chinese',
    nativeName: '简体中文',
    flag: '🇨🇳',
    direction: 'ltr',
    drupalCode: 'zh-hans',
    urlPrefix: 'zh-hans'
  },
  'es': {
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr',
    drupalCode: 'es',
    urlPrefix: 'es'
  }
};

// 从当前URL路径检测语言
const detectLanguageFromPath = () => {
  if (typeof window === 'undefined') return 'en';
  const path = window.location.pathname;
  if (path.startsWith('/zh-hans')) {
    return 'zh-CN';
  }
  if (path.startsWith('/es')) {
    return 'es';
  }
  return 'en';
};

// 获取默认语言（从 Drupal 或浏览器）
const getDefaultLanguage = () => {
  // 1. 优先从URL路径检测语言
  if (typeof window !== 'undefined') {
    return detectLanguageFromPath();
  }

  // 2. 从 Drupal 全局变量获取
  if (typeof window !== 'undefined' && window.drupalSettings?.path?.currentLanguage) {
    const drupalLang = window.drupalSettings.path.currentLanguage;
    return drupalToReactMapping[drupalLang] || 'en';
  }

  // 3. 从 localStorage 获取用户上次选择的语言
  const savedLang = localStorage.getItem('homtime-language');
  if (savedLang && supportedLanguages[savedLang]) {
    return savedLang;
  }

  // 4. 默认返回英语
  return 'en';
};

// 语言检测配置
const languageDetector = {
  type: 'languageDetector',
  async: false,
  detect: () => getDefaultLanguage(),
  init: () => {},
  cacheUserLanguage: (lng) => {
    localStorage.setItem('homtime-language', lng);
  }
};

// 初始化 i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      'zh-CN': { translation: zhCNTranslations },
      es: { translation: esTranslations }
    },

    lng: getDefaultLanguage(),
    fallbackLng: 'en',

    debug: false, // 禁用调试模式

    detection: {
      order: ['path', 'localStorage', 'navigator', 'htmlTag'],
      lookupFromPathIndex: 0,
      checkWhitelist: true
    },

    interpolation: {
      escapeValue: false
    },

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed'
    },

    // 禁用缺失键值警告
    saveMissing: false,
    missingKeyHandler: false,
    saveMissingPlurals: false,
    parseMissingKeyHandler: false
  });

// 监听语言变化事件
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('homtime-language', lng);
});

// 重新导出语言工具函数
export { buildLanguageUrl, initializeLanguage } from '../utils/drupalLanguageSync';

// 工具函数
export const getCurrentLanguage = () => i18n.language;
export const getSupportedLanguages = () => Object.keys(supportedLanguages);
export const getLanguageInfo = (lng) => supportedLanguages[lng];
export const changeLanguage = (lng) => {
  if (supportedLanguages[lng]) {
    return i18n.changeLanguage(lng);
  }
  console.warn(`不支持的语言: ${lng}`);
  return Promise.reject(new Error(`Unsupported language: ${lng}`));
};

// 数字和日期格式化工具
export const formatCurrency = (amount, language = i18n.language) => {
  const currencyMap = {
    'zh-CN': 'CNY',
    'zh-TW': 'TWD',
    'ja': 'JPY',
    'ko': 'KRW',
    'en': 'USD'
  };

  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: currencyMap[language] || 'CNY'
  }).format(amount);
};

export const formatDate = (date, language = i18n.language) => {
  return new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

export const formatRelativeTime = (date, language = i18n.language) => {
  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = (targetDate - now) / 1000;

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(Math.round(diffInSeconds), 'second');
  } else if (Math.abs(diffInSeconds) < 3600) {
    return rtf.format(Math.round(diffInSeconds / 60), 'minute');
  } else if (Math.abs(diffInSeconds) < 86400) {
    return rtf.format(Math.round(diffInSeconds / 3600), 'hour');
  } else {
    return rtf.format(Math.round(diffInSeconds / 86400), 'day');
  }
};

// 清除语言缓存并重置为默认语言
export const resetLanguageToDefault = () => {
  localStorage.removeItem('homtime-language');
  const defaultLang = 'en'; // 强制重置为英语
  i18n.changeLanguage(defaultLang);
  return defaultLang;
};

export default i18n;
