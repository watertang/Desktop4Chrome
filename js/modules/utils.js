/**
 * utils.js - 工具函数模块
 * 包含通用的辅助函数
 */

import { getStoredData } from './storage.js';
import { t } from './i18n/index.js';

// 全局模态框管理
const modalManager = {
  activeModals: [],
  
  // 初始化全局键盘事件监听
  init() {
    // 如果已经初始化过，不再重复添加事件监听
    if (this._initialized) return;
    
    // 添加ESC键监听，关闭最上层的模态框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModals.length > 0) {
        e.preventDefault();
        const topModal = this.activeModals[this.activeModals.length - 1];
        this.closeModal(topModal.id);
      }
    });
    
    this._initialized = true;
    console.log('模态框管理器已初始化');
  },
  
  // 打开模态框
  openModal(modalId, options = {}) {
    this.init(); // 确保初始化
    
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`找不到ID为${modalId}的模态框`);
      return false;
    }
    
    // 显示模态框
    modal.style.display = 'flex';
    modal.classList.add('show');
    
    // 记录模态框信息
    const modalInfo = {
      id: modalId,
      element: modal,
      onClose: options.onClose || null
    };
    
    // 添加到活动模态框列表
    this.activeModals.push(modalInfo);
    
    console.log(`模态框已打开: ${modalId}`);
    return true;
  },
  
  // 关闭模态框
  closeModal(modalId) {
    const index = this.activeModals.findIndex(modal => modal.id === modalId);
    if (index === -1) {
      console.error(`找不到ID为${modalId}的活动模态框`);
      return false;
    }
    
    const modalInfo = this.activeModals[index];
    const modal = modalInfo.element;
    
    // 隐藏模态框
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300); // 等待动画完成
    
    // 执行关闭回调
    if (typeof modalInfo.onClose === 'function') {
      modalInfo.onClose();
    }
    
    // 从活动列表中移除
    this.activeModals.splice(index, 1);
    
    console.log(`模态框已关闭: ${modalId}`);
    return true;
  },
  
  // 关闭所有模态框
  closeAllModals() {
    const modals = [...this.activeModals];
    modals.forEach(modal => {
      this.closeModal(modal.id);
    });
  }
};

// 导出模态框管理器
export const ModalManager = modalManager;

// 将图片转换为Base64
export function convertImageToBase64(url, callback, makeTransparent = false) {
  // 如果提供了回调函数，使用回调方式
  if (callback) {
    // 如果URL已经是Base64格式，直接返回
    if (url && url.startsWith('data:image')) {
      callback(url);
      return;
    }
    
    // 创建一个新的图片对象
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = function() {
      // 创建canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 设置canvas大小
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 如果需要透明背景
      if (makeTransparent) {
        // 绘制图像
        ctx.drawImage(img, 0, 0);
        
        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 将白色背景转换为透明
        for (let i = 0; i < data.length; i += 4) {
          // 如果是白色或接近白色
          if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
            // 设置透明度为0
            data[i + 3] = 0;
          }
        }
        
        // 将修改后的图像数据放回canvas
        ctx.putImageData(imageData, 0, 0);
      } else {
        // 直接绘制图像
        ctx.drawImage(img, 0, 0);
      }
      
      // 将canvas转换为Base64
      const base64 = canvas.toDataURL('image/png');
      callback(base64);
    };
    
    img.onerror = function() {
      console.error('图片加载失败:', url);
      callback(null);
    };
    
    // 设置图片源
    img.src = url;
  } else {
    // 如果没有提供回调函数，返回Promise
    return new Promise((resolve, reject) => {
      // 如果URL已经是Base64格式，直接返回
      if (url && url.startsWith('data:image')) {
        resolve(url);
        return;
      }
      
      // 创建一个新的图片对象
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = function() {
        // 创建canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置canvas大小
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 如果需要透明背景
        if (makeTransparent) {
          // 绘制图像
          ctx.drawImage(img, 0, 0);
          
          // 获取图像数据
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // 将白色背景转换为透明
          for (let i = 0; i < data.length; i += 4) {
            // 如果是白色或接近白色
            if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
              // 设置透明度为0
              data[i + 3] = 0;
            }
          }
          
          // 将修改后的图像数据放回canvas
          ctx.putImageData(imageData, 0, 0);
        } else {
          // 直接绘制图像
          ctx.drawImage(img, 0, 0);
        }
        
        // 将canvas转换为Base64
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      };
      
      img.onerror = function() {
        console.error('图片加载失败:', url);
        reject(new Error('图片加载失败: ' + url));
      };
      
      // 设置图片源
      img.src = url;
    });
  }
}

// 显示通知
export function showNotification(message, params = {}) {
  // 如果message是翻译键，则进行翻译
  const translatedMessage = message.startsWith('i18n:') 
    ? t(message.substring(5), params) 
    : message;
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = translatedMessage;
  
  document.body.appendChild(notification);
  
  // 添加显示类以触发动画
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // 3秒后移除通知
  setTimeout(() => {
    notification.classList.remove('show');
    
    // 动画完成后移除元素
    notification.addEventListener('transitionend', function() {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });
  }, 3000);
}

// 生成随机ID
export function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

// 深度克隆对象
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (obj instanceof Object) {
    const copy = {};
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone(obj[key]);
    });
    return copy;
  }
  
  return obj;
} 