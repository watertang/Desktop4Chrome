/**
 * popup.js - 扩展弹出窗口的逻辑
 */

import { initI18n, changeLanguage, getCurrentLanguage, t } from './modules/i18n/index.js';

// 当DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化国际化
  await initI18n();
  
  // 更新UI
  updateUI();
  
  // 设置事件监听器
  setupEventListeners();
});

/**
 * 更新UI
 */
function updateUI() {
  // 获取当前语言
  const currentLanguage = getCurrentLanguage();
  
  // 更新单选按钮
  document.querySelectorAll('.language-option').forEach(option => {
    const lang = option.getAttribute('data-lang');
    const radio = option.querySelector('input[type="radio"]');
    
    if (lang === currentLanguage) {
      radio.checked = true;
      option.classList.add('active');
    } else {
      radio.checked = false;
      option.classList.remove('active');
    }
  });
  
  // 更新所有带有 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      element.textContent = t(key);
    }
  });
  
  // 更新页面标题
  document.title = t('settings');
  
  // 更新HTML语言属性
  document.documentElement.lang = currentLanguage;
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // 语言选项点击事件
  document.querySelectorAll('.language-option').forEach(option => {
    option.addEventListener('click', async () => {
      const lang = option.getAttribute('data-lang');
      const radio = option.querySelector('input[type="radio"]');
      
      // 如果已经是当前语言，不做任何操作
      if (lang === getCurrentLanguage()) {
        return;
      }
      
      // 更新单选按钮
      radio.checked = true;
      
      // 切换语言
      await changeLanguage(lang);
      
      // 更新UI
      updateUI();
      
      // 通知后台脚本语言已更改
      chrome.runtime.sendMessage(
        { action: 'changeLanguage', language: lang },
        (response) => {
          console.log('语言更改消息已发送，响应:', response);
        }
      );
    });
  });
} 