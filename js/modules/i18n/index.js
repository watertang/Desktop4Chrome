/**
 * 国际化模块 - 管理多语言支持
 */

import { getStoredData, saveToStorage } from '../storage.js';
import zhCN from './zh-CN.js';
import zhTW from './zh-TW.js';
import en from './en.js';

// 支持的语言
export const SUPPORTED_LANGUAGES = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en': 'English'
};

// 语言包
const LANGUAGE_PACKS = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en': en
};

// 当前语言
let currentLanguage = 'zh-CN';
let translations = LANGUAGE_PACKS['zh-CN'];

/**
 * 初始化国际化模块
 */
export async function initI18n() {
  try {
    // 从存储中获取语言设置
    const data = await getStoredData(['language']);
    console.log('从存储中获取的语言设置:', data);
    
    // 如果有存储的语言设置，使用它
    if (data.language && LANGUAGE_PACKS[data.language]) {
      currentLanguage = data.language;
      translations = LANGUAGE_PACKS[currentLanguage];
      console.log('使用存储的语言设置:', currentLanguage);
    } else {
      console.log('没有找到存储的语言设置，使用默认语言:', currentLanguage);
    }
    
    console.log('国际化模块初始化完成，当前语言:', currentLanguage);
    
    // 更新页面语言
    updatePageLanguage();
    
    return currentLanguage;
  } catch (error) {
    console.error('初始化国际化模块失败:', error);
    return currentLanguage;
  }
}

/**
 * 切换语言
 * @param {string} language - 语言代码
 */
export async function changeLanguage(language) {
  try {
    // 检查是否支持该语言
    if (!LANGUAGE_PACKS[language]) {
      console.error('不支持的语言:', language);
      return false;
    }
    
    console.log('切换语言:', language);
    
    // 更新当前语言
    currentLanguage = language;
    translations = LANGUAGE_PACKS[language];
    
    // 保存语言设置
    await saveToStorage({ language });
    console.log('语言设置已保存到存储:', language);
    
    // 验证保存是否成功
    const data = await getStoredData(['language']);
    console.log('验证保存的语言设置:', data);
    
    // 更新页面语言
    updatePageLanguage();
    
    console.log('语言已切换为:', language);
    return true;
  } catch (error) {
    console.error('切换语言失败:', error);
    return false;
  }
}

/**
 * 获取翻译文本
 * @param {string} key - 翻译键
 * @param {Object} params - 替换参数
 * @returns {string} - 翻译后的文本
 */
export function t(key, params = {}) {
  // 获取翻译文本
  let text = translations[key] || key;
  
  // 替换参数
  if (params) {
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    });
  }
  
  return text;
}

/**
 * 获取当前语言
 * @returns {string} - 当前语言代码
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * 更新页面语言
 */
function updatePageLanguage() {
  // 更新页面标题
  document.title = t('new_tab');
  
  // 更新所有带有 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      element.textContent = t(key);
    }
  });
  
  // 更新所有带有 data-i18n-placeholder 属性的元素
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (key) {
      element.placeholder = t(key);
    }
  });
  
  // 更新所有带有 data-i18n-title 属性的元素
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    if (key) {
      element.title = t(key);
    }
  });
  
  // 触发语言更新事件
  document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: currentLanguage } }));
}

/**
 * 在HTML字符串中应用国际化
 * @param {string} html - 原始HTML字符串
 * @returns {string} - 应用国际化后的HTML字符串
 */
export function applyI18nToHTML(html) {
  // 替换所有 data-i18n="key" 的文本
  const regex = /data-i18n="([^"]+)">([^<]+)</g;
  const result = html.replace(regex, (match, key, text) => {
    return `data-i18n="${key}">${t(key)}<`;
  });
  
  // 替换所有 data-i18n-placeholder="key" 的占位符
  const placeholderRegex = /data-i18n-placeholder="([^"]+)" placeholder="([^"]+)"/g;
  return result.replace(placeholderRegex, (match, key, placeholder) => {
    return `data-i18n-placeholder="${key}" placeholder="${t(key)}"`;
  });
} 