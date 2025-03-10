/**
 * 图片编辑器模块
 * 提供图片裁剪和背景透明化功能
 */

import { showNotification } from './utils.js';
import { t } from './i18n/index.js';
import { ModalManager } from './utils.js';

// 图片编辑器状态变量
let canvas = null;
let canvasContext = null;
let currentImage = null;
let imageData = null;
let selectedColor = null;
let isColorPickMode = false;
let selectionBox = null;
let isDragging = false;
let isResizing = false;
let selectionStartX = 0;
let selectionStartY = 0;
let selectionWidth = 100;
let selectionHeight = 100;
let dragStartX = 0;
let dragStartY = 0;
let initialSelectionX = 0;
let initialSelectionY = 0;
let initialSelectionWidth = 100;
let initialSelectionHeight = 100;
let colorPickerBtn = null;
let colorPreview = null;
let imageWidth = 0;
let imageHeight = 0;
let imageDrawArea = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};
let onImageProcessed = null;

// DOM元素
let editorModal;
let imageUrlInput;
let imageFileInput;
let imageUrlInputContainer;

/**
 * 初始化图片编辑器
 */
export function initImageEditor() {
  console.log('初始化图片编辑器...');
  
  // 立即初始化可以获取的DOM元素
  editorModal = document.getElementById('image-editor-modal');
  canvas = document.getElementById('image-canvas');
  selectionBox = document.querySelector('.selection-box');
  colorPreview = document.querySelector('.color-preview');
  imageUrlInput = document.getElementById('image-url-input');
  imageFileInput = document.getElementById('image-file-input');
  imageUrlInputContainer = document.querySelector('.image-url-input-container');
  colorPickerBtn = document.getElementById('color-picker-btn');
  
  if (canvas) {
    canvasContext = canvas.getContext('2d', { willReadFrequently: true });
  } else {
    console.error('找不到image-canvas元素');
  }
  
  // 设置事件监听器
  setupEventListeners();
  
  console.log('图片编辑器初始化完成');
  
  // 添加全局事件监听器，确保在任何时候都能正确处理拖拽和调整大小
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      dragSelection(e);
    } else if (isResizing) {
      resizeSelection(e);
    }
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
  });
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  console.log('设置图片编辑器事件监听器');
  
  // 添加ESC键监听，用于关闭编辑器
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editorModal && 
        (editorModal.style.display === 'block' || 
         editorModal.style.display === 'flex' || 
         window.getComputedStyle(editorModal).display !== 'none')) {
      e.preventDefault();
      e.stopPropagation();
      closeEditor();
    }
  });
  
  // 打开图片URL输入
  const loadImageUrlBtn = document.getElementById('load-image-url-btn');
  if (loadImageUrlBtn) {
    loadImageUrlBtn.addEventListener('click', () => {
      console.log('点击了输入图片网址按钮');
      
      // 确保URL输入容器存在
      const imageUrlInputContainer = document.querySelector('.image-url-input-container');
      if (imageUrlInputContainer) {
        // 确保URL输入框存在
        const imageUrlInput = document.getElementById('image-url-input');
        
        // 显示URL输入容器
        imageUrlInputContainer.style.display = 'flex';
        
        // 聚焦URL输入框
        if (imageUrlInput) {
          setTimeout(() => {
            imageUrlInput.focus();
          }, 100);
        }
      } else {
        console.error('找不到imageUrlInputContainer元素');
        showNotification(t('element_not_found'), 'error');
      }
    });
  } else {
    console.error('找不到load-image-url-btn元素');
  }
  
  // 打开本地图片
  const loadImageLocalBtn = document.getElementById('load-image-local-btn');
  if (loadImageLocalBtn) {
    loadImageLocalBtn.addEventListener('click', () => {
      console.log('点击了打开本地图片按钮');
      
      // 直接创建一个新的文件输入元素
      const tempFileInput = document.createElement('input');
      tempFileInput.type = 'file';
      tempFileInput.accept = 'image/jpeg,image/png,image/webp';
      tempFileInput.style.display = 'none';
      document.body.appendChild(tempFileInput);
      
      // 添加事件监听器
      tempFileInput.addEventListener('change', (e) => {
        console.log('选择了本地图片');
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          loadImageFromFile(file);
        }
        
        // 使用完后移除元素
        setTimeout(() => {
          document.body.removeChild(tempFileInput);
        }, 1000);
      });
      
      // 触发文件选择对话框
      tempFileInput.click();
    });
  } else {
    console.error('找不到load-image-local-btn元素');
  }
  
  // 加载URL图片
  const loadUrlImageBtn = document.getElementById('load-url-image-btn');
  if (loadUrlImageBtn) {
    loadUrlImageBtn.addEventListener('click', loadUrlImage);
  } else {
    console.error('找不到load-url-image-btn元素');
  }
  
  // 为URL输入框添加回车键支持
  const imageUrlInput = document.getElementById('image-url-input');
  if (imageUrlInput) {
    imageUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // 阻止表单提交
        loadUrlImage();
      }
    });
  } else {
    console.error('找不到image-url-input元素');
  }
  
  // 取消按钮
  const editorCancelBtn = document.getElementById('editor-cancel-btn');
  if (editorCancelBtn) {
    editorCancelBtn.addEventListener('click', closeEditor);
  } else {
    console.error('找不到editor-cancel-btn元素');
  }
  
  // 应用按钮
  const editorApplyBtn = document.getElementById('editor-apply-btn');
  if (editorApplyBtn) {
    editorApplyBtn.addEventListener('click', processImage);
  } else {
    console.error('找不到editor-apply-btn元素');
  }
  
  // 颜色选择器
  colorPickerBtn = document.getElementById('color-picker-btn');
  if (colorPickerBtn) {
    colorPickerBtn.addEventListener('click', toggleColorPickMode);
  } else {
    console.error('找不到color-picker-btn元素');
  }
  
  // 画布点击（颜色选择）
  canvas = document.getElementById('image-canvas');
  if (canvas) {
    canvas.addEventListener('click', (e) => {
      if (isColorPickMode && currentImage) {
        pickColor(e);
      }
    });
    
    // 获取Canvas上下文，设置willReadFrequently为true以优化性能
    canvasContext = canvas.getContext('2d', { willReadFrequently: true });
  } else {
    console.error('找不到image-canvas元素');
  }
  
  // 选择框拖拽和调整大小
  selectionBox = document.querySelector('.selection-box');
  if (selectionBox) {
    // 添加鼠标按下事件，开始拖拽
    selectionBox.addEventListener('mousedown', (e) => {
      // 如果是右下角的调整大小手柄
      if (e.offsetX > selectionBox.offsetWidth - 20 && e.offsetY > selectionBox.offsetHeight - 20) {
        startResizing(e);
      } else {
        startDragging(e);
      }
    });
    
    // 添加鼠标移动事件，处理拖拽和调整大小
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        dragSelection(e);
      } else if (isResizing) {
        resizeSelection(e);
      }
    });
    
    // 添加鼠标松开事件，结束拖拽和调整大小
    document.addEventListener('mouseup', () => {
      isDragging = false;
      isResizing = false;
    });
  } else {
    console.error('找不到selection-box元素');
  }
  
  console.log('图片编辑器事件监听器设置完成');
}

/**
 * 打开图片编辑器
 * @param {Function} callback - 图片处理完成后的回调函数
 * @param {string} [initialImageUrl] - 初始图像URL，可选
 */
export function openEditor(callback, initialImageUrl) {
  console.log('打开图片编辑器');
  
  // 确保editorModal变量被正确初始化
  if (!editorModal) {
    editorModal = document.getElementById('image-editor-modal');
    if (!editorModal) {
      console.error('找不到image-editor-modal元素');
      throw new Error(t('element_not_found'));
    }
  }
  
  // 保存回调函数
  onImageProcessed = callback;
  
  // 重置编辑器
  resetEditor();
  
  // 显示编辑器模态框
  editorModal.style.display = 'flex';
  editorModal.classList.add('show');
  
  // 延迟获取DOM元素，确保它们已经加载
  setTimeout(() => {
    // 重新获取DOM元素，确保它们已经加载
    canvas = document.getElementById('image-canvas');
    selectionBox = document.querySelector('.selection-box');
    colorPreview = document.querySelector('.color-preview');
    imageUrlInput = document.getElementById('image-url-input');
    imageFileInput = document.getElementById('image-file-input');
    imageUrlInputContainer = document.querySelector('.image-url-input-container');
    colorPickerBtn = document.getElementById('color-picker-btn');
    
    console.log('图片编辑器DOM元素已重新获取');
    
    // 如果提供了初始图像URL，加载该图像
    if (initialImageUrl) {
      console.log('加载初始图像:', initialImageUrl);
      loadImageFromUrl(initialImageUrl);
    }
  }, 100);
  
  console.log('图片编辑器已打开');
}

/**
 * 关闭编辑器
 */
function closeEditor() {
  console.log('关闭图片编辑器');
  
  // 停止背景颜色切换
  stopBackgroundColorToggle();
  
  // 重置编辑器
  resetEditor();
  
  // 隐藏编辑器模态框
  if (editorModal) {
    editorModal.classList.remove('show');
    editorModal.style.display = 'none';
  } else {
    console.error('找不到editorModal元素');
  }
}

/**
 * 重置编辑器
 */
function resetEditor() {
  console.log('重置图片编辑器');
  
  // 重置Canvas
  if (canvas) {
    canvas.width = 400;
    canvas.height = 400;
    
    if (!canvasContext) {
      canvasContext = canvas.getContext('2d', { willReadFrequently: true });
    }
    
    if (canvasContext) {
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  
  // 重置选择框
  if (selectionBox) {
    selectionBox.style.display = 'none';
    selectionBox.style.width = '100px';
    selectionBox.style.height = '100px';
    selectionBox.style.left = '0px';
    selectionBox.style.top = '0px';
  }
  
  // 重置状态变量
  currentImage = null;
  imageData = null;
  selectedColor = null;
  isColorPickMode = false;
  isDragging = false;
  isResizing = false;
  selectionStartX = 0;
  selectionStartY = 0;
  selectionWidth = 100;
  selectionHeight = 100;
  dragStartX = 0;
  dragStartY = 0;
  initialSelectionX = 0;
  initialSelectionY = 0;
  initialSelectionWidth = 100;
  initialSelectionHeight = 100;
  imageWidth = 0;
  imageHeight = 0;
  
  // 初始化图片绘制区域
  imageDrawArea = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };
  
  // 停止背景颜色切换
  stopBackgroundColorToggle();
  
  // 重置颜色选择按钮
  if (colorPickerBtn) {
    colorPickerBtn.disabled = true;
    colorPickerBtn.title = t('no_image_loaded');
    colorPickerBtn.style.opacity = '0.5';
    colorPickerBtn.style.cursor = 'not-allowed';
  }
  
  // 重置颜色预览
  updateColorPreview();
  
  // 隐藏URL输入容器
  if (imageUrlInputContainer) {
    imageUrlInputContainer.style.display = 'none';
  }
  
  // 清空URL输入框
  if (imageUrlInput) {
    imageUrlInput.value = '';
  }
  
  // 清空文件输入框
  if (imageFileInput) {
    imageFileInput.value = '';
  }
  
  // 移除颜色选择模式
  document.body.classList.remove('color-pick-mode');
  
  console.log('图片编辑器已重置');
}

/**
 * 从URL加载图片
 * @param {string} url - 图片URL
 */
function loadImageFromUrl(url) {
  console.log('从URL加载图片:', url);
  
  showNotification(t('loading_icon'), 'info');
  
  try {
    // 检查是否是跨域URL
    const isCrossDomain = url.indexOf('http') === 0 && !url.includes(location.host);
    console.log('是否跨域URL:', isCrossDomain);
    
    // 确保canvas和canvasContext已初始化
    if (!canvas) {
      canvas = document.getElementById('image-canvas');
      if (!canvas) {
        console.error('找不到canvas元素');
        showNotification(t('element_not_found'), 'error');
        return;
      }
    }
    
    if (!canvasContext) {
      canvasContext = canvas.getContext('2d', { willReadFrequently: true });
    }
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      console.log('URL图片加载成功, 尺寸:', img.width, 'x', img.height);
      loadImageToCanvas(img);
      showNotification(t('icon_loaded_successfully'), 'success');
    };
    
    img.onerror = (error) => {
      console.error('URL图片加载失败:', error);
      // 如果直接加载失败，尝试使用代理服务
      if (isCrossDomain) {
        console.log('尝试使用代理服务加载跨域图片');
        tryLoadWithProxy(url);
      } else {
        showNotification(t('icon_load_failed'), 'error');
      }
    };
    
    img.src = url;
    
    // 如果图片已经缓存，可能不会触发onload事件
    if (img.complete) {
      console.log('图片已缓存，直接加载');
      img.onload();
    }
  } catch (error) {
    console.error('加载URL图片失败:', error);
    showNotification(t('icon_load_failed'), 'error');
  }
}

/**
 * 尝试使用代理服务加载跨域图片
 * @param {string} url - 原始图片URL
 */
function tryLoadWithProxy(url) {
  console.log('使用代理服务加载图片:', url);
  
  try {
    // 方法1: 使用CORS代理
    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    console.log('代理URL:', corsProxyUrl);
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      console.log('通过代理加载图片成功');
      loadImageToCanvas(img);
      showNotification(t('icon_loaded_successfully'), 'success');
    };
    
    img.onerror = (error) => {
      console.error('通过代理加载图片失败:', error);
      // 方法2: 尝试使用内置的fetch API和canvas转换
      fetchAndConvertImage(url);
    };
    
    img.src = corsProxyUrl;
    
    // 如果图片已经缓存，可能不会触发onload事件
    if (img.complete) {
      console.log('代理图片已缓存，直接加载');
      img.onload();
    }
  } catch (error) {
    console.error('代理加载图片失败:', error);
    // 尝试使用fetch API
    fetchAndConvertImage(url);
  }
}

/**
 * 使用fetch API和canvas转换图片
 * @param {string} url - 图片URL
 */
async function fetchAndConvertImage(url) {
  console.log('使用后台脚本获取图片:', url);
  
  try {
    // 直接尝试使用fetch获取图片
    try {
      const response = await fetch(url, { 
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const imgUrl = URL.createObjectURL(blob);
        
        const img = new Image();
        img.onload = () => {
          console.log('直接fetch获取图片成功');
          loadImageToCanvas(img);
          URL.revokeObjectURL(imgUrl);
          showNotification(t('icon_loaded_successfully'), 'success');
        };
        img.onerror = () => {
          console.error('直接fetch获取的图片加载失败');
          URL.revokeObjectURL(imgUrl);
          tryBackgroundFetch();
        };
        img.src = imgUrl;
        return;
      }
    } catch (error) {
      console.error('直接fetch获取图片失败:', error);
    }
    
    // 如果直接fetch失败，尝试使用后台脚本
    tryBackgroundFetch();
    
    function tryBackgroundFetch() {
      // 创建一个后台页面请求，绕过CORS限制
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage(
          { 
            action: 'fetchImage', 
            url: url 
          },
          function(response) {
            console.log('收到后台脚本响应:', response ? '成功' : '失败');
            
            if (response && response.success && response.dataUrl) {
              console.log('后台脚本获取图片成功');
              const img = new Image();
              img.onload = () => {
                console.log('后台获取的图片加载成功');
                loadImageToCanvas(img);
                showNotification(t('icon_loaded_successfully'), 'success');
              };
              img.onerror = (error) => {
                console.error('后台获取的图片加载失败:', error);
                showNotification(t('icon_load_failed'), 'error');
              };
              img.src = response.dataUrl;
            } else {
              console.error('后台脚本获取图片失败:', response ? response.error : '未知错误');
              // 最后的备选方案：提示用户保存图片并手动上传
              showNotification(t('cors_error'), 'error');
            }
          }
        );
      } else {
        console.error('Chrome API不可用');
        showNotification(t('cors_error'), 'error');
      }
    }
  } catch (error) {
    console.error('获取图片失败:', error);
    showNotification(t('icon_load_failed'), 'error');
  }
}

/**
 * 从文件加载图片
 * @param {File} file - 图片文件
 */
function loadImageFromFile(file) {
  console.log('加载本地图片:', file.name, file.type);
  
  if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/webp')) {
    showNotification(t('invalid_image_file'), 'error');
    return;
  }
  
  showNotification(t('loading_icon'), 'info');
  
  try {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      console.log('图片文件读取成功');
      
      const img = new Image();
      
      img.onload = () => {
        console.log('图片加载成功，尺寸:', img.width, 'x', img.height);
        
        // 确保canvas和canvasContext已初始化
        if (!canvas) {
          canvas = document.getElementById('image-canvas');
          if (!canvas) {
            console.error('找不到canvas元素');
            showNotification(t('element_not_found'), 'error');
            return;
          }
        }
        
        if (!canvasContext) {
          canvasContext = canvas.getContext('2d', { willReadFrequently: true });
        }
        
        loadImageToCanvas(img);
        showNotification(t('icon_loaded_successfully'), 'success');
      };
      
      img.onerror = (error) => {
        console.error('图片加载失败:', error);
        showNotification(t('icon_load_failed'), 'error');
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = (error) => {
      console.error('文件读取失败:', error);
      showNotification(t('icon_upload_failed'), 'error');
    };
    
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('加载本地图片失败:', error);
    showNotification(t('icon_upload_failed'), 'error');
  }
}

/**
 * 加载图片到Canvas
 * @param {HTMLImageElement} img - 要加载的图片
 */
function loadImageToCanvas(img) {
  console.log('加载图片到Canvas, 原始尺寸:', img.width, 'x', img.height);
  
  if (!canvas || !canvasContext) {
    console.error('Canvas未初始化');
    return;
  }
  
  try {
    // 保存图片尺寸
    imageWidth = img.width;
    imageHeight = img.height;
    
    // 获取容器尺寸
    const containerWidth = canvas.parentElement ? canvas.parentElement.clientWidth : 400;
    const containerHeight = canvas.parentElement ? canvas.parentElement.clientHeight : 400;
    
    console.log('Canvas容器尺寸:', containerWidth, 'x', containerHeight);
    
    // 设置Canvas尺寸为容器尺寸
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // 计算图片在画布上的位置和尺寸，保持宽高比并填满画布
    let drawWidth, drawHeight, drawX, drawY;
    
    // 计算图片的宽高比
    const imageRatio = imageWidth / imageHeight;
    const containerRatio = containerWidth / containerHeight;
    
    // 对于正方形图片（或接近正方形的图片），特殊处理
    const isSquareImage = Math.abs(imageRatio - 1) < 0.01; // 如果宽高比接近1，认为是正方形
    
    if (isSquareImage) {
      // 正方形图片，使用容器的较小边作为基准
      const minDimension = Math.min(containerWidth, containerHeight);
      drawWidth = minDimension;
      drawHeight = minDimension;
      drawX = Math.floor((containerWidth - drawWidth) / 2);
      drawY = Math.floor((containerHeight - drawHeight) / 2);
    } else if (imageRatio >= containerRatio) {
      // 图片比容器更宽，以宽度为基准
      drawWidth = containerWidth;
      drawHeight = Math.floor(containerWidth / imageRatio);
      drawX = 0;
      drawY = Math.floor((containerHeight - drawHeight) / 2);
    } else {
      // 图片比容器更高，以高度为基准
      drawHeight = containerHeight;
      drawWidth = Math.floor(containerHeight * imageRatio);
      drawX = Math.floor((containerWidth - drawWidth) / 2);
      drawY = 0;
    }
    
    // 确保绘制区域的坐标和尺寸是整数
    drawX = Math.floor(drawX);
    drawY = Math.floor(drawY);
    drawWidth = Math.floor(drawWidth);
    drawHeight = Math.floor(drawHeight);
    
    console.log('图片绘制区域:', drawX, drawY, drawWidth, drawHeight);
    console.log('是否为正方形图片:', isSquareImage);
    
    // 清除Canvas
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制图片
    canvasContext.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    
    // 保存图片数据
    imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
    currentImage = img;
    
    // 保存图片绘制区域信息
    imageDrawArea = {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight
    };
    
    // 启用颜色选择按钮
    if (!colorPickerBtn) {
      colorPickerBtn = document.getElementById('color-picker-btn');
    }
    
    if (colorPickerBtn) {
      colorPickerBtn.disabled = false;
      colorPickerBtn.title = t('pick_color');
      colorPickerBtn.style.opacity = '1';
      colorPickerBtn.style.cursor = 'pointer';
    }
    
    // 检查透明背景
    checkTransparentBackground();
    
    // 初始化选择框
    if (selectionBox) {
      // 计算选择框的大小（正方形，使用图片绘制区域的较小边作为边长）
      const minDimension = Math.min(drawWidth, drawHeight);
      selectionWidth = minDimension;
      selectionHeight = minDimension;
      
      // 计算选择框位置（居中于图片绘制区域）
      selectionStartX = Math.floor(drawX + (drawWidth - selectionWidth) / 2);
      selectionStartY = Math.floor(drawY + (drawHeight - selectionHeight) / 2);
      
      // 确保选择框的坐标和尺寸是整数
      selectionStartX = Math.floor(selectionStartX);
      selectionStartY = Math.floor(selectionStartY);
      selectionWidth = Math.floor(selectionWidth);
      selectionHeight = Math.floor(selectionHeight);
      
      // 设置选择框的位置和大小
      selectionBox.style.width = `${selectionWidth}px`;
      selectionBox.style.height = `${selectionHeight}px`;
      selectionBox.style.left = `${selectionStartX}px`;
      selectionBox.style.top = `${selectionStartY}px`;
      selectionBox.style.display = 'block';
      
      console.log(`选择框初始化: 位置(${selectionStartX}, ${selectionStartY}), 尺寸${selectionWidth}x${selectionHeight}`);
      console.log(`选择框边界: X(${drawX}-${drawX + drawWidth - selectionWidth}), Y(${drawY}-${drawY + drawHeight - selectionHeight})`);
      
      // 添加背景颜色切换效果
      startBackgroundColorToggle();
    }
  } catch (error) {
    console.error('加载图片到Canvas失败:', error);
    showNotification(t('image_load_failed'), 'error');
  }
}

/**
 * 检测图片是否已有透明背景
 */
function checkTransparentBackground() {
  if (!imageData) {
    console.error('没有图像数据');
    return;
  }
  
  const data = imageData.data;
  let transparentPixels = 0;
  let totalPixels = data.length / 4;
  
  // 检查边缘像素的透明度
  const width = imageData.width;
  const height = imageData.height;
  const edgePixels = [];
  
  // 收集边缘像素
  // 上边缘
  for (let x = 0; x < width; x++) {
    edgePixels.push(x * 4 + 3); // alpha通道索引
  }
  
  // 下边缘
  for (let x = 0; x < width; x++) {
    edgePixels.push(((height - 1) * width + x) * 4 + 3);
  }
  
  // 左边缘
  for (let y = 1; y < height - 1; y++) {
    edgePixels.push((y * width) * 4 + 3);
  }
  
  // 右边缘
  for (let y = 1; y < height - 1; y++) {
    edgePixels.push((y * width + width - 1) * 4 + 3);
  }
  
  // 检查边缘像素的透明度
  let transparentEdges = 0;
  for (const pixelIndex of edgePixels) {
    if (data[pixelIndex] < 250) { // 不完全不透明
      transparentEdges++;
    }
  }
  
  // 检查整个图像的透明像素
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) { // 不完全不透明
      transparentPixels++;
    }
  }
  
  const transparentRatio = transparentPixels / totalPixels;
  const edgeTransparentRatio = transparentEdges / edgePixels.length;
  
  console.log(`透明像素比例: ${(transparentRatio * 100).toFixed(2)}%, 边缘透明比例: ${(edgeTransparentRatio * 100).toFixed(2)}%`);
  
  // 如果图片已经有足够的透明度，直接禁用颜色选择器按钮
  if (transparentRatio > 0.1 || edgeTransparentRatio > 0.3) {
    console.log('检测到图片已有透明背景，禁用颜色选择器');
    
    // 禁用颜色选择器按钮
    const colorPickerBtn = document.getElementById('color-picker-btn');
    if (colorPickerBtn) {
      colorPickerBtn.disabled = true;
      colorPickerBtn.title = '图片已有透明背景，无需选择背景色';
      colorPickerBtn.style.opacity = '0.5';
      colorPickerBtn.style.cursor = 'not-allowed';
    }
    
    // 直接使用透明背景
    selectedColor = { r: 0, g: 0, b: 0, a: 0 };
    
    // 更新颜色预览
    if (colorPreview) {
      colorPreview.style.backgroundColor = 'transparent';
      colorPreview.style.backgroundImage = 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)';
      colorPreview.style.backgroundSize = '10px 10px';
      colorPreview.style.backgroundPosition = '0 0, 5px 5px';
    }
  }
}

/**
 * 更新选择框的位置和大小
 */
function updateSelectionBox() {
  if (!selectionBox || !canvas) return;
  
  // 确保选择框尺寸不超过Canvas
  selectionWidth = Math.min(selectionWidth, canvas.width);
  selectionHeight = Math.min(selectionHeight, canvas.height);
  
  // 确保选择框不超出Canvas边界
  selectionStartX = Math.max(0, Math.min(canvas.width - selectionWidth, selectionStartX));
  selectionStartY = Math.max(0, Math.min(canvas.height - selectionHeight, selectionStartY));
  
  // 更新选择框位置和大小
  selectionBox.style.width = `${selectionWidth}px`;
  selectionBox.style.height = `${selectionHeight}px`;
  selectionBox.style.left = `${selectionStartX}px`;
  selectionBox.style.top = `${selectionStartY}px`;
  
  console.log(`更新选择框: 位置(${selectionStartX}, ${selectionStartY}), 尺寸${selectionWidth}x${selectionHeight}`);
  console.log(`Canvas尺寸: ${canvas.width}x${canvas.height}`);
  console.log(`选择框边界: X(0-${canvas.width - selectionWidth}), Y(0-${canvas.height - selectionHeight})`);
}

/**
 * 开始拖动选择框
 * @param {MouseEvent} e - 鼠标事件
 */
function startDragging(e) {
  if (!canvas || !selectionBox) return;
  
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  initialSelectionX = parseInt(selectionBox.style.left) || 0;
  initialSelectionY = parseInt(selectionBox.style.top) || 0;
  
  // 确保初始位置在Canvas内
  initialSelectionX = Math.max(0, Math.min(canvas.width - selectionWidth, initialSelectionX));
  initialSelectionY = Math.max(0, Math.min(canvas.height - selectionHeight, initialSelectionY));
  
  // 防止事件冒泡和默认行为
  e.preventDefault();
  e.stopPropagation();
  
  console.log(`开始拖动选择框: 初始位置(${initialSelectionX}, ${initialSelectionY}), Canvas尺寸: ${canvas.width}x${canvas.height}`);
  console.log(`鼠标位置: (${e.clientX}, ${e.clientY}), 选择框尺寸: ${selectionWidth}x${selectionHeight}`);
}

/**
 * 拖动选择框
 * @param {MouseEvent} e - 鼠标事件
 */
function dragSelection(e) {
  if (!isDragging || !canvas || !selectionBox || !imageDrawArea) return;
  
  // 计算鼠标移动的距离
  const deltaX = e.clientX - dragStartX;
  const deltaY = e.clientY - dragStartY;
  
  // 更新选择框位置
  const newX = initialSelectionX + deltaX;
  const newY = initialSelectionY + deltaY;
  
  // 计算图片绘制区域的边界
  const minX = imageDrawArea.x;
  const maxX = imageDrawArea.x + imageDrawArea.width - selectionWidth;
  const minY = imageDrawArea.y;
  const maxY = imageDrawArea.y + imageDrawArea.height - selectionHeight;
  
  // 确保边界值有效（不小于minX/minY）
  const validMaxX = Math.max(minX, maxX);
  const validMaxY = Math.max(minY, maxY);
  
  // 严格限制选择框在图片绘制区域内
  selectionStartX = Math.max(minX, Math.min(validMaxX, newX));
  selectionStartY = Math.max(minY, Math.min(validMaxY, newY));
  
  // 确保选择框的坐标是整数
  selectionStartX = Math.floor(selectionStartX);
  selectionStartY = Math.floor(selectionStartY);
  
  // 更新选择框位置 - 直接设置像素值
  selectionBox.style.left = `${selectionStartX}px`;
  selectionBox.style.top = `${selectionStartY}px`;
  
  // 记录当前位置（用于调试）
  console.log(`选择框拖动: 位置(${selectionStartX}, ${selectionStartY})`);
  console.log(`图片区域: x=${imageDrawArea.x}, y=${imageDrawArea.y}, w=${imageDrawArea.width}, h=${imageDrawArea.height}`);
  console.log(`选择框边界: X(${minX}-${validMaxX}), Y(${minY}-${validMaxY})`);
  
  // 防止事件冒泡和默认行为
  e.preventDefault();
  e.stopPropagation();
}

/**
 * 开始调整选择框大小
 * @param {MouseEvent} e - 鼠标事件
 */
function startResizing(e) {
  if (!canvas || !selectionBox) return;
  
  isResizing = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  initialSelectionWidth = selectionWidth;
  initialSelectionHeight = selectionHeight;
  
  e.preventDefault();
  e.stopPropagation();
  
  console.log(`开始调整选择框大小: 初始尺寸${initialSelectionWidth}x${initialSelectionHeight}, Canvas尺寸: ${canvas.width}x${canvas.height}`);
  console.log(`鼠标位置: (${e.clientX}, ${e.clientY}), 选择框位置: (${selectionStartX}, ${selectionStartY})`);
}

/**
 * 调整选择框大小
 * @param {MouseEvent} e - 鼠标事件
 */
function resizeSelection(e) {
  if (!isResizing || !canvas || !selectionBox || !imageDrawArea) return;
  
  // 计算鼠标移动的距离
  const deltaX = e.clientX - dragStartX;
  const deltaY = e.clientY - dragStartY;
  
  // 使用较大的变化值，确保保持正方形
  const delta = Math.max(deltaX, deltaY);
  
  // 计算新的尺寸（保持正方形）
  const newSize = Math.max(20, initialSelectionWidth + delta);
  
  // 计算当前位置下的最大允许尺寸
  const maxAllowedWidth = imageDrawArea.x + imageDrawArea.width - selectionStartX;
  const maxAllowedHeight = imageDrawArea.y + imageDrawArea.height - selectionStartY;
  
  // 确保最大允许尺寸不小于1像素
  const maxAllowedSize = Math.max(1, Math.min(maxAllowedWidth, maxAllowedHeight));
  
  // 设置新的尺寸，确保不超出图片绘制区域
  selectionWidth = Math.min(newSize, maxAllowedSize);
  selectionHeight = selectionWidth; // 保持正方形
  
  // 确保选择框的尺寸是整数
  selectionWidth = Math.floor(selectionWidth);
  selectionHeight = Math.floor(selectionHeight);
  
  // 确保选择框尺寸至少为1像素
  selectionWidth = Math.max(1, selectionWidth);
  selectionHeight = Math.max(1, selectionHeight);
  
  // 更新选择框大小
  selectionBox.style.width = `${selectionWidth}px`;
  selectionBox.style.height = `${selectionHeight}px`;
  
  // 确保调整手柄可见
  const resizeHandle = selectionBox.querySelector('::after') || selectionBox;
  if (resizeHandle) {
    resizeHandle.style.display = 'block';
    resizeHandle.style.visibility = 'visible';
  }
  
  // 记录当前尺寸（用于调试）
  console.log(`选择框调整大小: 尺寸${selectionWidth}x${selectionHeight}`);
  console.log(`最大允许尺寸: ${maxAllowedSize}, 新尺寸: ${newSize}`);
  console.log(`图片绘制区域: x=${imageDrawArea.x}, y=${imageDrawArea.y}, w=${imageDrawArea.width}, h=${imageDrawArea.height}`);
  console.log(`选择框位置: (${selectionStartX}, ${selectionStartY})`);
  
  // 防止事件冒泡和默认行为
  e.preventDefault();
  e.stopPropagation();
}

/**
 * 切换颜色选择模式
 */
function toggleColorPickMode() {
  isColorPickMode = !isColorPickMode;
  
  if (isColorPickMode) {
    // 进入颜色选择模式
    document.body.classList.add('color-pick-mode');
    
    // 隐藏选择框
    if (selectionBox) {
      selectionBox.style.display = 'none';
    }
    
    // 更改鼠标样式
    if (canvas) {
      canvas.style.cursor = 'crosshair';
    }
    
    // 显示提示
    showNotification(t('pick_color_hint'), 'info');
    
    console.log('进入颜色选择模式');
  } else {
    // 退出颜色选择模式
    document.body.classList.remove('color-pick-mode');
    
    // 显示选择框
    if (selectionBox) {
      selectionBox.style.display = 'block';
    }
    
    // 恢复鼠标样式
    if (canvas) {
      canvas.style.cursor = 'default';
    }
    
    console.log('退出颜色选择模式');
  }
}

/**
 * 选择颜色
 * @param {MouseEvent} e - 鼠标事件
 */
function pickColor(e) {
  if (!isColorPickMode || !canvas || !canvasContext || !imageData) return;
  
  // 获取鼠标在Canvas上的位置
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(e.clientX - rect.left);
  const y = Math.floor(e.clientY - rect.top);
  
  // 确保坐标在Canvas范围内
  if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
    // 获取点击位置的像素数据
    const pixelData = canvasContext.getImageData(x, y, 1, 1).data;
    
    // 创建颜色对象
    selectedColor = {
      r: pixelData[0],
      g: pixelData[1],
      b: pixelData[2],
      a: pixelData[3] < 128 ? 0 : 255 // 如果透明度小于128，则视为完全透明
    };
    
    console.log('选择的颜色:', selectedColor);
    
    // 更新颜色预览
    updateColorPreview();
    
    // 如果选择了透明色，显示透明效果预览
    if (selectedColor.a === 0) {
      previewTransparency();
    }
    
    // 退出颜色选择模式
    toggleColorPickMode();
    
    // 显示成功提示
    showNotification(t('color_selected'), 'success');
  }
}

/**
 * 更新颜色预览
 */
function updateColorPreview() {
  const colorPreview = document.querySelector('.color-preview');
  if (colorPreview && selectedColor) {
    // 如果是透明色
    if (selectedColor.a === 0) {
      colorPreview.style.backgroundColor = 'transparent';
      colorPreview.classList.add('transparent');
      
      // 添加棋盘格背景
      colorPreview.style.backgroundImage = `
        linear-gradient(45deg, #ccc 25%, transparent 25%), 
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%)
      `;
      colorPreview.style.backgroundSize = '10px 10px';
      colorPreview.style.backgroundPosition = '0 0, 0 5px, 5px -5px, -5px 0px';
    } else {
      colorPreview.style.backgroundColor = `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`;
      colorPreview.classList.remove('transparent');
      colorPreview.style.backgroundImage = 'none';
    }
  }
}

/**
 * 在Canvas上预览透明效果
 */
function previewTransparency() {
  if (!canvas || !canvasContext || !selectedColor || !imageData) return;
  
  // 创建临时Canvas用于预览
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  // 复制原始图像数据
  const tempImageData = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
  
  // 设置背景色为透明
  const data = tempImageData.data;
  const tolerance = 30; // 颜色容差
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // 检查像素是否接近选定的背景色
    if (
      Math.abs(r - selectedColor.r) <= tolerance &&
      Math.abs(g - selectedColor.g) <= tolerance &&
      Math.abs(b - selectedColor.b) <= tolerance
    ) {
      // 设置为透明
      data[i + 3] = 0;
    }
  }
  
  // 更新Canvas
  tempCtx.putImageData(tempImageData, 0, 0);
  
  // 绘制到原始Canvas
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制棋盘格背景
  drawCheckerboard();
  
  // 绘制预览图像
  canvasContext.drawImage(tempCanvas, 0, 0);
  
  // 5秒后恢复原始图像
  setTimeout(() => {
    if (canvas && canvasContext && imageData) {
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      canvasContext.putImageData(imageData, 0, 0);
    }
  }, 5000);
}

/**
 * 绘制棋盘格背景
 */
function drawCheckerboard() {
  if (!canvas || !canvasContext) return;
  
  const tileSize = 10;
  const width = canvas.width;
  const height = canvas.height;
  
  canvasContext.fillStyle = '#f0f0f0';
  canvasContext.fillRect(0, 0, width, height);
  
  canvasContext.fillStyle = '#e0e0e0';
  
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      if ((x / tileSize + y / tileSize) % 2 === 0) {
        canvasContext.fillRect(x, y, tileSize, tileSize);
      }
    }
  }
}

/**
 * 处理图片
 */
function processImage() {
  if (!currentImage) {
    showNotification(t('no_image_loaded'), 'error');
    return;
  }
  
  if (!selectedColor) {
    showNotification(t('pick_color'), 'warning');
    return;
  }
  
  showNotification(t('image_processing'), 'info');
  
  try {
    // 创建离屏Canvas
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = currentImage.width;
    offscreenCanvas.height = currentImage.height;
    const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    
    // 绘制原始图片到离屏Canvas
    offscreenCtx.drawImage(currentImage, 0, 0, currentImage.width, currentImage.height);
    
    // 获取原始图片数据
    const originalImageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    
    // 检查图片绘制区域是否有效
    if (!imageDrawArea || imageDrawArea.width === 0 || imageDrawArea.height === 0) {
      console.error('图片绘制区域未定义或尺寸为0');
      showNotification(t('image_process_error'), 'error');
      return null;
    }
    
    // 计算选择框在原始图片上对应的位置和尺寸
    const scaleX = currentImage.width / imageDrawArea.width;
    const scaleY = currentImage.height / imageDrawArea.height;
    
    // 计算选择框相对于图片绘制区域的位置
    const relativeX = selectionStartX - imageDrawArea.x;
    const relativeY = selectionStartY - imageDrawArea.y;
    
    // 计算在原始图片上的对应位置和尺寸
    const sourceX = Math.floor(relativeX * scaleX);
    const sourceY = Math.floor(relativeY * scaleY);
    const sourceWidth = Math.floor(selectionWidth * scaleX);
    const sourceHeight = Math.floor(selectionHeight * scaleY);
    
    console.log(`处理图像区域: 源坐标(${sourceX}, ${sourceY}), 源尺寸${sourceWidth}x${sourceHeight}`);
    console.log(`选择框: (${selectionStartX}, ${selectionStartY}), 尺寸${selectionWidth}x${selectionHeight}`);
    console.log(`图片绘制区域: x=${imageDrawArea.x}, y=${imageDrawArea.y}, w=${imageDrawArea.width}, h=${imageDrawArea.height}`);
    console.log(`缩放比例: ${scaleX}x${scaleY}`);
    
    // 确保源坐标和尺寸在有效范围内
    const validSourceX = Math.max(0, sourceX);
    const validSourceY = Math.max(0, sourceY);
    const validSourceWidth = Math.min(sourceWidth, originalImageData.width - validSourceX);
    const validSourceHeight = Math.min(sourceHeight, originalImageData.height - validSourceY);
    
    // 确保有效尺寸至少为1像素
    const finalSourceWidth = Math.max(1, validSourceWidth);
    const finalSourceHeight = Math.max(1, validSourceHeight);
    
    console.log(`有效处理区域: 源坐标(${validSourceX}, ${validSourceY}), 源尺寸${finalSourceWidth}x${finalSourceHeight}`);
    
    // 创建一个新的Canvas，只包含选择区域
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = finalSourceWidth;
    croppedCanvas.height = finalSourceHeight;
    const croppedCtx = croppedCanvas.getContext('2d');
    
    // 将选择区域绘制到新Canvas
    croppedCtx.drawImage(
      currentImage,
      validSourceX, validSourceY, finalSourceWidth, finalSourceHeight,
      0, 0, finalSourceWidth, finalSourceHeight
    );
    
    // 如果选择了透明色，处理透明度
    if (selectedColor.a === 0) {
      // 获取裁剪区域的图像数据
      const croppedImageData = croppedCtx.getImageData(0, 0, finalSourceWidth, finalSourceHeight);
      
      // 处理选择区域内的像素
      for (let y = 0; y < finalSourceHeight; y++) {
        for (let x = 0; x < finalSourceWidth; x++) {
          const index = (y * finalSourceWidth + x) * 4;
          
          // 检查像素颜色是否接近选定的颜色
          const r = croppedImageData.data[index];
          const g = croppedImageData.data[index + 1];
          const b = croppedImageData.data[index + 2];
          
          // 计算颜色差异
          const colorDiff = Math.sqrt(
            Math.pow(r - selectedColor.r, 2) +
            Math.pow(g - selectedColor.g, 2) +
            Math.pow(b - selectedColor.b, 2)
          );
          
          // 如果颜色接近选定的颜色，设置为透明
          if (colorDiff < 30) { // 容差值，可以调整
            croppedImageData.data[index + 3] = 0; // 设置alpha为0
          }
        }
      }
      
      // 将处理后的图像数据放回裁剪Canvas
      croppedCtx.putImageData(croppedImageData, 0, 0);
    }
    
    // 获取处理后的图片URL
    const processedImageUrl = croppedCanvas.toDataURL('image/png');
    
    // 创建新图片对象并加载
    const processedImage = new Image();
    processedImage.onload = function() {
      // 更新当前图片
      currentImage = processedImage;
      
      // 重新加载到Canvas
      loadImageToCanvas(processedImage);
      
      showNotification(t('image_processed'), 'success');
      
      // 关闭编辑器并返回处理后的图片
      if (onImageProcessed) {
        onImageProcessed(processedImageUrl);
        closeEditor();
      }
    };
    
    // 加载处理后的图片
    processedImage.src = processedImageUrl;
    
  } catch (error) {
    console.error('处理图片时出错:', error);
    showNotification(t('image_process_error'), 'error');
  }
}

/**
 * 开始背景颜色切换效果
 */
let backgroundToggleInterval = null;
function startBackgroundColorToggle() {
  // 清除之前的定时器
  if (backgroundToggleInterval) {
    clearInterval(backgroundToggleInterval);
  }
  
  // 获取Canvas容器
  const canvasContainer = canvas.parentElement;
  if (!canvasContainer) return;
  
  // 设置初始背景色
  canvasContainer.style.backgroundColor = '#f5f5f5'; // 白色背景
  
  // 设置定时器，每2秒切换一次背景色
  let isWhite = true;
  backgroundToggleInterval = setInterval(() => {
    if (isWhite) {
      // 切换到网格背景色
      canvasContainer.style.backgroundColor = '#f0f0f0'; // 网格背景色
      canvasContainer.style.backgroundImage = 'linear-gradient(45deg, #e8e8e8 25%, transparent 25%, transparent 75%, #e8e8e8 75%, #e8e8e8), linear-gradient(45deg, #e8e8e8 25%, transparent 25%, transparent 75%, #e8e8e8 75%, #e8e8e8)';
      canvasContainer.style.backgroundSize = '20px 20px';
      canvasContainer.style.backgroundPosition = '0 0, 10px 10px';
    } else {
      // 切换到白色背景
      canvasContainer.style.backgroundColor = '#f5f5f5';
      canvasContainer.style.backgroundImage = 'none';
    }
    isWhite = !isWhite;
  }, 2000);
}

/**
 * 停止背景颜色切换效果
 */
function stopBackgroundColorToggle() {
  if (backgroundToggleInterval) {
    clearInterval(backgroundToggleInterval);
    backgroundToggleInterval = null;
    
    // 恢复默认背景
    const canvasContainer = canvas.parentElement;
    if (canvasContainer) {
      canvasContainer.style.backgroundColor = '#f5f5f5';
      canvasContainer.style.backgroundImage = 'none';
    }
  }
}

// 加载URL图片的函数
function loadUrlImage() {
  console.log('加载URL图片');
  
  // 获取URL输入框的值
  const urlInput = document.getElementById('image-url-input');
  if (urlInput) {
    const url = urlInput.value.trim();
    if (url) {
      console.log('加载URL图片:', url);
      loadImageFromUrl(url);
    } else {
      showNotification(t('invalid_url'), 'error');
    }
  } else {
    console.error('找不到image-url-input元素');
    showNotification(t('element_not_found'), 'error');
  }
} 