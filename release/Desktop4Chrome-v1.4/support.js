/**
 * 支持模块 - 用于显示捐赠提示
 */

import { getStoredData, saveToStorage } from './storage.js';

// 初始化函数
export async function initSpecialFeatures() {
  console.log('初始化特殊功能...');
  
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndShowCoffee);
  } else {
    // 如果DOM已经加载完成，立即执行
    await checkAndShowCoffee();
  }
}

// 检查并显示咖啡杯
async function checkAndShowCoffee() {
  try {
    console.log('检查是否显示咖啡杯...');
    
    // 检查是否存在特殊文件
    const hasSpecialFile = await checkSpecialFile();
    if (hasSpecialFile) {
      console.log('特殊文件存在，不显示咖啡杯');
      return;
    }
    
    // 获取计数器
    const data = await getStoredData(['pageViewCount']);
    let count = data.pageViewCount || 0;
    
    // 增加计数
    count++;
    console.log('页面访问计数:', count);
    
    // 保存计数
    await saveToStorage({ pageViewCount: count });
    
    // 每10次显示一次，或者在第1次时显示（用于测试）
    if (count % 10 === 0 || count === 1) {
      console.log('显示咖啡杯图标');
      showCoffeeIcon();
    }
  } catch (error) {
    console.error('检查咖啡杯显示时出错:', error);
  }
}

// 检查特殊文件
async function checkSpecialFile() {
  try {
    const response = await fetch('IloveAdaAva.ico');
    return response.ok;
  } catch (error) {
    console.log('检查特殊文件时出错:', error);
    return false;
  }
}

// 显示咖啡杯图标
function showCoffeeIcon() {
  // 创建图标容器
  const iconElement = document.createElement('div');
  iconElement.id = 'coffee-icon';
  iconElement.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 999; /* 降低z-index，确保不会覆盖模态框 */
    animation: coffeeAnimation 2s ease infinite;
  `;
  
  // 添加咖啡杯SVG
  iconElement.innerHTML = `
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8H19C20.0609 8 21.0783 8.42143 21.8284 9.17157C22.5786 9.92172 23 10.9391 23 12C23 13.0609 22.5786 14.0783 21.8284 14.8284C21.0783 15.5786 20.0609 16 19 16H18" stroke="#6F4E37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 8H18V17C18 18.0609 17.5786 19.0783 16.8284 19.8284C16.0783 20.5786 15.0609 21 14 21H6C4.93913 21 3.92172 20.5786 3.17157 19.8284C2.42143 19.0783 2 18.0609 2 17V8Z" fill="#C87D55" stroke="#6F4E37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6 1V4" stroke="#6F4E37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10 1V4" stroke="#6F4E37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 1V4" stroke="#6F4E37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <style>
      @keyframes coffeeAnimation {
        0% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-5px) scale(1.05); }
        100% { transform: translateY(0) scale(1); }
      }
      #coffee-icon:hover {
        transform: scale(1.1);
      }
    </style>
  `;
  
  // 添加点击事件
  iconElement.addEventListener('click', () => {
    window.open('https://ko-fi.com/watertang', '_blank');
    document.body.removeChild(iconElement);
  });
  
  // 添加到页面
  document.body.appendChild(iconElement);
  console.log('咖啡杯图标已添加到页面');
  
  // 确保不会影响模态框的显示
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          (mutation.target.classList.contains('edit-modal') || 
           mutation.target.classList.contains('city-edit-modal') || 
           mutation.target.classList.contains('format-dialog'))) {
        
        const modal = mutation.target;
        if (modal.style.display === 'block' || modal.style.display === 'flex') {
          // 确保模态框正确显示
          modal.style.display = 'flex';
          modal.style.alignItems = 'center';
          modal.style.justifyContent = 'center';
        }
      }
    });
  });
  
  // 观察模态框的变化
  document.querySelectorAll('.edit-modal, .city-edit-modal, .format-dialog').forEach(modal => {
    observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
  });
} 