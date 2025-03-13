/**
 * ui.js - UI模块
 * 处理用户界面相关的功能
 */

import { showNotification } from './utils.js';
import { getStoredData, saveToStorage, DEFAULT_BACKGROUND } from './storage.js';
import { initBackgroundEditor } from './backgroundEditor.js';

// 设置背景图片
export function setBackground(url) {
  console.log('设置背景图片:', url ? '有URL' : '无URL');
  
  // 设置背景图片
  document.body.style.backgroundImage = `url(${url})`;
  
  // 保存到存储
  return saveToStorage({ backgroundUrl: url })
    .then(() => {
      console.log('背景图片URL已保存到存储');
    })
    .catch(error => {
      console.error('保存背景图片URL失败:', error);
    });
}

// 初始化背景
export async function initBackground() {
  console.log('初始化背景图片');
  
  try {
    const result = await getStoredData(['backgroundUrl']);
    
    if (result.backgroundUrl) {
      console.log('从存储加载背景图片');
      setBackground(result.backgroundUrl);
    } else {
      console.log('使用默认背景图片');
      setBackground(DEFAULT_BACKGROUND);
    }
  } catch (error) {
    console.error('初始化背景图片失败:', error);
    // 出错时使用默认背景
    setBackground(DEFAULT_BACKGROUND);
  }
}

// 初始化导入导出功能
export function initImportExport(exportCallback, importCallback) {
  const exportBtn = document.getElementById('export-data');
  const importBtn = document.getElementById('import-data');
  const fileInput = document.getElementById('file-input');
  
  // 添加导出事件监听
  exportBtn.addEventListener('click', exportCallback);
  
  // 添加导入事件监听
  importBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const jsonData = e.target.result;
      importCallback(jsonData);
    };
    reader.readAsText(file);
    
    // 重置文件输入，以便可以再次选择同一个文件
    fileInput.value = '';
  });
}

// 创建通知元素
export function createNotificationElement(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  
  return notification;
}

// 显示加载指示器
export function showLoader() {
  // 创建加载指示器元素
  const loader = document.createElement('div');
  loader.className = 'loader-container';
  loader.innerHTML = `
    <div class="loader">
      <div class="loader-spinner"></div>
      <div class="loader-text">加载中...</div>
    </div>
  `;
  
  // 添加到文档
  document.body.appendChild(loader);
  
  // 返回加载指示器元素，以便稍后移除
  return loader;
}

// 隐藏加载指示器
export function hideLoader(loader) {
  if (loader && loader.parentNode) {
    loader.parentNode.removeChild(loader);
  }
}

// 创建确认对话框
export function showConfirmDialog(message, confirmCallback, cancelCallback) {
  // 创建对话框元素
  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog';
  
  dialog.innerHTML = `
    <div class="dialog-content">
      <div class="dialog-message">${message}</div>
      <div class="dialog-buttons">
        <button class="dialog-button cancel-button">取消</button>
        <button class="dialog-button confirm-button">确认</button>
      </div>
    </div>
  `;
  
  // 添加到文档
  document.body.appendChild(dialog);
  
  // 添加按钮事件
  const confirmButton = dialog.querySelector('.confirm-button');
  const cancelButton = dialog.querySelector('.cancel-button');
  
  confirmButton.addEventListener('click', () => {
    document.body.removeChild(dialog);
    if (confirmCallback) confirmCallback();
  });
  
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(dialog);
    if (cancelCallback) cancelCallback();
  });
  
  // 点击对话框外部关闭对话框
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      document.body.removeChild(dialog);
      if (cancelCallback) cancelCallback();
    }
  });
  
  // 返回对话框元素，以便稍后操作
  return dialog;
}

// 创建输入对话框
export function showInputDialog(title, defaultValue, confirmCallback, cancelCallback) {
  // 创建对话框元素
  const dialog = document.createElement('div');
  dialog.className = 'input-dialog';
  
  dialog.innerHTML = `
    <div class="dialog-content">
      <div class="dialog-title">${title}</div>
      <input type="text" class="dialog-input" value="${defaultValue || ''}">
      <div class="dialog-buttons">
        <button class="dialog-button cancel-button">取消</button>
        <button class="dialog-button confirm-button">确认</button>
      </div>
    </div>
  `;
  
  // 添加到文档
  document.body.appendChild(dialog);
  
  // 获取输入框
  const input = dialog.querySelector('.dialog-input');
  input.focus();
  input.select();
  
  // 添加按钮事件
  const confirmButton = dialog.querySelector('.confirm-button');
  const cancelButton = dialog.querySelector('.cancel-button');
  
  confirmButton.addEventListener('click', () => {
    document.body.removeChild(dialog);
    if (confirmCallback) confirmCallback(input.value);
  });
  
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(dialog);
    if (cancelCallback) cancelCallback();
  });
  
  // 添加回车键确认
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      document.body.removeChild(dialog);
      if (confirmCallback) confirmCallback(input.value);
    }
  });
  
  // 点击对话框外部关闭对话框
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      document.body.removeChild(dialog);
      if (cancelCallback) cancelCallback();
    }
  });
  
  // 返回对话框元素，以便稍后操作
  return dialog;
}

// 创建上下文菜单
export function createContextMenu(items, x, y) {
  // 创建上下文菜单元素
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.top = `${y}px`;
  menu.style.left = `${x}px`;
  
  // 添加菜单项
  items.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'context-menu-item';
    menuItem.dataset.action = item.action;
    
    if (item.icon) {
      menuItem.innerHTML = `<i class="${item.icon}"></i> ${item.label}`;
    } else {
      menuItem.textContent = item.label;
    }
    
    menu.appendChild(menuItem);
  });
  
  // 添加到文档
  document.body.appendChild(menu);
  
  // 点击其他区域关闭菜单
  document.addEventListener('click', function closeMenu(e) {
    if (!menu.contains(e.target)) {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
      document.removeEventListener('click', closeMenu);
    }
  });
  
  // 返回菜单元素，以便添加事件监听
  return menu;
}

// 添加拖拽功能
export function addDraggable(element, handleSelector, onDragEnd) {
  let isDragging = false;
  let startX, startY;
  let startLeft, startTop;
  
  // 获取拖拽手柄
  const handle = handleSelector ? element.querySelector(handleSelector) : element;
  
  // 鼠标按下事件
  handle.addEventListener('mousedown', (e) => {
    // 如果点击的是按钮或输入框，不启动拖拽
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
      return;
    }
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(window.getComputedStyle(element).left) || 0;
    startTop = parseInt(window.getComputedStyle(element).top) || 0;
    
    // 添加拖拽中的样式
    element.classList.add('dragging');
    
    // 阻止默认行为和冒泡
    e.preventDefault();
    e.stopPropagation();
  });
  
  // 鼠标移动事件
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    element.style.left = `${startLeft + dx}px`;
    element.style.top = `${startTop + dy}px`;
    
    // 阻止默认行为和冒泡
    e.preventDefault();
    e.stopPropagation();
  });
  
  // 鼠标松开事件
  document.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    
    isDragging = false;
    
    // 移除拖拽中的样式
    element.classList.remove('dragging');
    
    // 调用拖拽结束回调
    if (onDragEnd) {
      onDragEnd(element);
    }
    
    // 阻止默认行为和冒泡
    e.preventDefault();
    e.stopPropagation();
  });
}

// 选择背景图片
export function selectBackgroundImage() {
  console.log('打开背景图片选择器');
  
  // 先暂停0.5秒，因为单击退出编辑模式的动作已经生效
  setTimeout(() => {
    console.log('暂停0.5秒后，直接进入编辑模式并打开文件选择器');
    
    // 直接进入编辑模式
    import('./shortcuts.js').then(module => {
      if (typeof module.toggleEditMode === 'function') {
        // 直接进入编辑模式
        module.toggleEditMode();
        
        // 立即打开文件选择器
        openFileSelector();
      } else {
        // 如果无法操作编辑模式，直接打开文件选择器
        openFileSelector();
      }
    }).catch(error => {
      console.error('导入shortcuts.js模块失败:', error);
      // 出错时也打开文件选择器
      openFileSelector();
    });
  }, 500); // 暂停0.5秒
}

// 打开文件选择器
function openFileSelector() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = async function(e) {
    const file = e.target.files[0];
    
    if (file) {
      // 显示加载指示器
      const loader = showLoader();
      
      try {
        // 确保背景编辑器已初始化
        await import('./backgroundEditor.js').then(async module => {
          // 先初始化编辑器
          module.initBackgroundEditor();
          
          // 延迟一小段时间确保DOM已更新
          await new Promise(resolve => setTimeout(resolve, 100));
          
          hideLoader(loader);
          module.openEditor(file, async (result) => {
            if (result && result.base64) {
              // 设置背景图片
              setBackground(result.base64);
              showNotification(`背景图片已优化 - 质量: ${result.quality}%, 大小: ${result.size.toFixed(2)}MB`);
            } else {
              showNotification('处理图片失败，请重试。');
            }
          });
        }).catch(error => {
          hideLoader(loader);
          console.error('加载背景图片编辑器失败:', error);
          showNotification('加载图片编辑器失败，请重试。');
        });
      } catch (error) {
        hideLoader(loader);
        console.error('处理背景图片失败:', error);
        showNotification('处理图片失败，请重试。');
      }
    }
  };
  
  input.click();
}

// 处理背景图片的辅助函数
function processBackgroundImage(file) {
  // 显示加载指示器
  const loader = showLoader();
  
  const reader = new FileReader();
  
  reader.onload = function(event) {
    // 使用高质量的图片处理
    const img = new Image();
    
    img.onload = function() {
      try {
        // 获取原始尺寸
        const originalWidth = img.width;
        const originalHeight = img.height;
        
        // 获取屏幕分辨率
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        
        console.log(`图片原始尺寸: ${originalWidth}x${originalHeight}, 屏幕分辨率: ${screenWidth}x${screenHeight}`);
        
        // 检查图片是否需要调整大小
        const needsResize = originalWidth > screenWidth || originalHeight > screenHeight;
        
        // 自动处理图片（调整大小和压缩）
        autoProcessImage(img, originalWidth, originalHeight, screenWidth, screenHeight, needsResize, event.target.result, loader);
      } catch (error) {
        hideLoader(loader);
        console.error('处理背景图片失败:', error);
        showNotification('处理背景图片失败，请重试或选择其他图片。', 'error');
      }
    };
    
    img.onerror = function() {
      hideLoader(loader);
      console.error('加载图片失败');
      showNotification('加载图片失败，请重试或选择其他图片。', 'error');
    };
    
    img.src = event.target.result;
  };
  
  reader.onerror = function() {
    hideLoader(loader);
    console.error('读取文件失败');
    showNotification('读取文件失败，请重试。', 'error');
  };
  
  reader.readAsDataURL(file);
}

// 自动处理图片（调整大小和压缩）
function autoProcessImage(img, originalWidth, originalHeight, screenWidth, screenHeight, needsResize, originalDataUrl, loader) {
  // 创建画布
  const canvas = document.createElement('canvas');
  let width = originalWidth;
  let height = originalHeight;
  
  // 如果需要调整大小
  if (needsResize) {
    // 计算新的尺寸，适应屏幕
    const widthRatio = screenWidth / originalWidth;
    const heightRatio = screenHeight / originalHeight;
    
    // 使用较小的比例，确保图片完全适应屏幕
    const ratio = Math.min(widthRatio, heightRatio);
    
    // 如果图片比屏幕小，不进行缩放
    if (ratio < 1) {
      width = Math.round(originalWidth * ratio);
      height = Math.round(originalHeight * ratio);
      console.log(`调整图片尺寸为: ${width}x${height}，适应屏幕`);
    } else {
      console.log('图片尺寸小于屏幕分辨率，保持原始尺寸');
    }
  }
  
  // 设置画布尺寸
  canvas.width = width;
  canvas.height = height;
  
  // 绘制图片
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  
  // 尝试不同的压缩质量，直到找到合适的大小
  tryCompressWithQuality(canvas, 1.0, 'image/png', originalDataUrl, loader);
}

// 尝试不同的压缩质量
function tryCompressWithQuality(canvas, quality, format, originalDataUrl, loader, attempt = 0) {
  // 最大尝试次数
  const maxAttempts = 5;
  // 质量递减步长
  const qualityStep = 0.1;
  // 目标大小（2MB）
  const targetSize = 2 * 1024 * 1024;
  // 最低质量
  const minQuality = 0.5;
  
  // 生成图片URL
  let imageUrl;
  if (format === 'image/png' && quality === 1.0) {
    // 第一次尝试使用PNG格式和100%质量
    imageUrl = canvas.toDataURL('image/png', 1.0);
    console.log('尝试使用PNG格式和100%质量');
  } else {
    // 后续尝试使用JPEG格式和递减的质量
    imageUrl = canvas.toDataURL('image/jpeg', quality);
    console.log(`尝试使用JPEG格式和${Math.round(quality * 100)}%质量`);
  }
  
  // 估算大小（base64编码大约是原始数据的4/3）
  const estimatedSize = imageUrl.length * 0.75;
  console.log(`压缩后估计大小: ${(estimatedSize / (1024 * 1024)).toFixed(2)}MB`);
  
  // 如果大小合适或已达到最大尝试次数或最低质量
  if (estimatedSize <= targetSize || attempt >= maxAttempts || quality <= minQuality) {
    // 如果第一次尝试（PNG）失败且文件太大，切换到JPEG并重试
    if (format === 'image/png' && estimatedSize > targetSize) {
      console.log('PNG格式文件过大，切换到JPEG格式');
      tryCompressWithQuality(canvas, 0.9, 'image/jpeg', originalDataUrl, loader, attempt + 1);
      return;
    }
    
    // 如果所有尝试都失败且文件仍然太大，使用原始数据
    if (estimatedSize > targetSize && attempt >= maxAttempts) {
      console.log('所有压缩尝试都失败，使用原始数据');
      saveImageAndFinish(originalDataUrl, loader, true);
      return;
    }
    
    // 保存当前压缩结果
    saveImageAndFinish(imageUrl, loader, format !== 'image/png' || quality < 1.0);
  } else {
    // 继续尝试更低的质量
    const newQuality = Math.max(quality - qualityStep, minQuality);
    tryCompressWithQuality(canvas, newQuality, 'image/jpeg', originalDataUrl, loader, attempt + 1);
  }
}

// 保存图片并完成处理
function saveImageAndFinish(imageUrl, loader, wasCompressed) {
  // 设置背景图片
  setBackground(imageUrl);
  
  // 保存到存储
  saveToStorage({ backgroundUrl: imageUrl })
    .then(() => {
      hideLoader(loader);
      console.log('背景图片已保存到存储');
      showNotification(wasCompressed ? '背景图片已优化并保存' : '背景图片已更新并保存');
    })
    .catch(error => {
      hideLoader(loader);
      console.error('保存背景图片失败:', error);
      showNotification('背景图片保存失败，可能是图片太大。', 'warning');
      // 恢复默认背景
      setBackground(DEFAULT_BACKGROUND);
    });
} 