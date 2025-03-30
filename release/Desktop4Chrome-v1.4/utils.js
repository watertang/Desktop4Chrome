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
    
    // 设置超时处理
    let timeoutId = setTimeout(() => {
      console.warn('图片加载超时:', url);
      callback(null);
    }, 10000); // 10秒超时
    
    // 创建一个新的图片对象
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = function() {
      clearTimeout(timeoutId);
      try {
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
      } catch (error) {
        console.error('转换图像失败:', error);
        callback(null);
      }
    };
    
    img.onerror = function(error) {
      clearTimeout(timeoutId);
      console.error('加载图像失败:', url, error);
      
      // 如果是favicon请求，尝试使用Google的favicon服务
      if (url.includes('favicon.ico')) {
        try {
          // 提取域名
          let domain = url;
          if (url.startsWith('http')) {
            try {
              const urlObj = new URL(url);
              domain = urlObj.hostname;
            } catch (e) {
              // 尝试从URL字符串中提取域名
              const match = url.match(/https?:\/\/([^\/]+)/);
              if (match && match[1]) {
                domain = match[1];
              }
            }
          }
          
          // 使用Google的favicon服务
          const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
          console.log('尝试使用Google的favicon服务:', googleFaviconUrl);
          
          // 重新加载图像
          const googleImg = new Image();
          googleImg.crossOrigin = 'Anonymous';
          
          // 设置新的超时
          const newTimeoutId = setTimeout(() => {
            console.warn('Google图标加载超时');
            callback(null);
          }, 5000);
          
          googleImg.onload = function() {
            clearTimeout(newTimeoutId);
            try {
              const canvas = document.createElement('canvas');
              canvas.width = googleImg.width;
              canvas.height = googleImg.height;
              
              const ctx = canvas.getContext('2d');
              ctx.drawImage(googleImg, 0, 0);
              
              const base64 = canvas.toDataURL('image/png');
              callback(base64);
            } catch (error) {
              console.error('转换Google图像失败:', error);
              callback(null);
            }
          };
          
          googleImg.onerror = function() {
            clearTimeout(newTimeoutId);
            console.error('加载Google图标失败');
            callback(null);
          };
          
          googleImg.src = googleFaviconUrl;
        } catch (e) {
          console.error('处理备选图标失败:', e);
          callback(null);
        }
      } else {
        callback(null);
      }
    };
    
    // 设置图片源
    try {
      img.src = url;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('设置图片源失败:', error);
      callback(null);
    }
  } else {
    // 如果没有提供回调函数，返回Promise
    return new Promise((resolve, reject) => {
      convertImageToBase64(url, (base64) => {
        if (base64) {
          resolve(base64);
        } else {
          reject(new Error('转换图像失败'));
        }
      }, makeTransparent);
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

// 压缩和调整图片大小
export async function processBackgroundImage(imageFile, maxSizeMB = 5) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function(e) {
      const img = new Image();
      img.onload = function() {
        // 获取屏幕尺寸
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        
        // 计算缩放比例
        const scaleX = screenWidth / img.width;
        const scaleY = screenHeight / img.height;
        const scale = Math.max(scaleX, scaleY); // 使用较大的缩放比例以确保覆盖
        
        // 计算新的尺寸
        const newWidth = Math.round(img.width * scale);
        const newHeight = Math.round(img.height * scale);
        
        // 创建canvas
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        
        // 绘制调整大小后的图片
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // 逐步降低质量直到文件大小合适
        let quality = 0.85;
        const minQuality = 0.5; // 最低质量限制
        
        const tryCompress = () => {
          // 转换为base64
          const base64 = canvas.toDataURL('image/jpeg', quality);
          
          // 计算大致文件大小（base64字符串长度 * 0.75）
          const fileSizeMB = (base64.length * 0.75) / (1024 * 1024);
          
          if (fileSizeMB <= maxSizeMB || quality <= minQuality) {
            // 达到目标大小或已达到最低质量
            console.log(`图片处理完成 - 质量: ${Math.round(quality * 100)}%, 大小: ${fileSizeMB.toFixed(2)}MB`);
            resolve({
              base64,
              width: newWidth,
              height: newHeight,
              quality: Math.round(quality * 100),
              size: fileSizeMB
            });
          } else {
            // 继续降低质量
            quality -= 0.05;
            setTimeout(tryCompress, 0); // 使用setTimeout避免阻塞
          }
        };
        
        tryCompress();
      };
      
      img.onerror = function() {
        reject(new Error('图片加载失败'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = function() {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsDataURL(imageFile);
  });
} 