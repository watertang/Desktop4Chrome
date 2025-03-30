/**
 * newtab.js - 主入口文件
 * 导入并使用模块化的代码
 */

import { initApp } from './modules/core.js';
import { changeLanguage } from './modules/i18n/index.js';

// 当DOM加载完成后初始化应用程序
document.addEventListener('DOMContentLoaded', () => {
  console.log('新标签页DOM加载完成，初始化应用程序');
  initApp();
  
  // 设置消息监听器，用于接收语言更改消息
  setupMessageListener();
});

/**
 * 设置消息监听器
 */
function setupMessageListener() {
  console.log('设置消息监听器');
  
  // 监听来自扩展的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('新标签页收到消息:', message);
    
    // 处理语言更改消息
    if (message.action === 'changeLanguage') {
      console.log('收到语言更改消息:', message.language);
      
      // 切换语言
      changeLanguage(message.language)
        .then(success => {
          console.log('语言切换' + (success ? '成功' : '失败'));
          
          // 如果语言切换成功，刷新页面以应用新语言
          if (success) {
            console.log('刷新页面以应用新语言');
            window.location.reload();
          }
          
          sendResponse({ success });
        })
        .catch(error => {
          console.error('语言切换出错:', error);
          sendResponse({ success: false, error: error.message });
        });
      
      return true; // 保持消息通道开放
    }
    
    return false;
  });
}