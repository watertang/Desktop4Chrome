/**
 * 背景图片编辑器模块
 * 提供背景图片裁剪和调整功能
 */

import { showNotification } from './utils.js';
import { t } from './i18n/index.js';
import { processBackgroundImage } from './utils.js';

// 编辑器状态变量
let canvas = null;
let canvasContext = null;
let currentImage = null;
let selectionBox = null;
let isDragging = false;
let isResizing = false;
let selectionStartX = 0;
let selectionStartY = 0;
let selectionWidth = 100;
let selectionHeight = 100;
let dragStartX = 0;
let dragStartY = 0;
let imageDrawArea = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};
let onImageProcessed = null;

// DOM元素
let editorModal = null;

/**
 * 初始化背景图片编辑器
 */
export function initBackgroundEditor() {
  console.log('初始化背景图片编辑器...');
  
  // 获取DOM元素
  editorModal = document.getElementById('background-editor-modal');
  canvas = document.getElementById('background-canvas');
  selectionBox = document.querySelector('#background-editor-modal .selection-box');
  
  if (canvas) {
    canvasContext = canvas.getContext('2d');
  }
  
  // 设置事件监听器
  setupEventListeners();
  
  console.log('背景图片编辑器初始化完成');
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // ESC键关闭编辑器
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editorModal && editorModal.classList.contains('show')) {
      closeEditor();
    }
  });
  
  // 取消按钮
  const cancelBtn = document.getElementById('background-editor-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEditor);
  }
  
  // 应用按钮
  const applyBtn = document.getElementById('background-editor-apply-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', processImage);
  }
  
  // 重置选择框按钮
  const resetBtn = document.getElementById('reset-selection-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetSelection);
  }
  
  // 适应屏幕按钮
  const fitBtn = document.getElementById('fit-screen-btn');
  if (fitBtn) {
    fitBtn.addEventListener('click', fitToScreen);
  }
  
  // 选择框拖拽和调整大小
  if (selectionBox) {
    selectionBox.addEventListener('mousedown', (e) => {
      const handle = e.target.classList.contains('selection-handle');
      if (handle) {
        startResizing(e);
      } else {
        startDragging(e);
      }
    });
  }
  
  // 全局鼠标事件
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
 * 打开编辑器
 * @param {File} imageFile - 图片文件
 * @param {Function} callback - 处理完成的回调函数
 */
export function openEditor(imageFile, callback) {
  console.log('打开背景图片编辑器');
  
  // 保存回调函数
  onImageProcessed = callback;
  
  // 重置编辑器
  resetEditor();
  
  // 显示编辑器
  editorModal.style.display = 'flex';
  setTimeout(() => {
    editorModal.classList.add('show');
  }, 10);
  
  // 加载图片
  loadImage(imageFile);
}

/**
 * 关闭编辑器
 */
function closeEditor() {
  editorModal.classList.remove('show');
  setTimeout(() => {
    editorModal.style.display = 'none';
    resetEditor();
  }, 300);
}

/**
 * 重置编辑器
 */
function resetEditor() {
  currentImage = null;
  if (canvas) {
    canvas.width = 400;
    canvas.height = 400;
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  }
  if (selectionBox) {
    selectionBox.style.display = 'none';
  }
  updateDimensions(0, 0);
}

/**
 * 加载图片
 * @param {File} file - 图片文件
 */
function loadImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      fitImageToCanvas(img);
      initializeSelection();
      updateDimensions(img.width, img.height);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/**
 * 调整图片以适应画布
 * @param {HTMLImageElement} img - 图片元素
 */
function fitImageToCanvas(img) {
  // 获取画布容器的尺寸
  const container = canvas.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  // 计算图片缩放比例
  const scaleX = containerWidth / img.width;
  const scaleY = containerHeight / img.height;
  const scale = Math.min(scaleX, scaleY, 1); // 不要放大图片
  
  // 计算绘制区域
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const drawX = (containerWidth - drawWidth) / 2;
  const drawY = (containerHeight - drawHeight) / 2;
  
  // 调整画布大小
  canvas.width = containerWidth;
  canvas.height = containerHeight;
  
  // 清除画布
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制图片
  canvasContext.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  
  // 保存绘制区域信息
  imageDrawArea = {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight
  };
}

/**
 * 初始化选择框
 */
function initializeSelection() {
  if (!selectionBox || !imageDrawArea) return;
  
  // 获取屏幕尺寸
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight - 80; // 减去Chrome的标题栏高度
  
  // 计算选择框的初始大小
  const aspectRatio = screenWidth / screenHeight;
  let width = imageDrawArea.width;
  let height = width / aspectRatio;
  
  // 如果高度超出图片范围，按高度计算
  if (height > imageDrawArea.height) {
    height = imageDrawArea.height;
    width = height * aspectRatio;
  }
  
  // 确保选择框不超出图片范围
  width = Math.min(width, imageDrawArea.width);
  height = Math.min(height, imageDrawArea.height);
  
  // 计算选择框位置（居中）
  const x = imageDrawArea.x + (imageDrawArea.width - width) / 2;
  const y = imageDrawArea.y + (imageDrawArea.height - height) / 2;
  
  // 更新选择框
  selectionBox.style.display = 'block';
  selectionBox.style.left = `${x}px`;
  selectionBox.style.top = `${y}px`;
  selectionBox.style.width = `${width}px`;
  selectionBox.style.height = `${height}px`;
  
  // 更新状态变量
  selectionStartX = x;
  selectionStartY = y;
  selectionWidth = width;
  selectionHeight = height;
}

/**
 * 开始拖拽选择框
 * @param {MouseEvent} e - 鼠标事件
 */
function startDragging(e) {
  isDragging = true;
  dragStartX = e.clientX - selectionStartX;
  dragStartY = e.clientY - selectionStartY;
}

/**
 * 拖拽选择框
 * @param {MouseEvent} e - 鼠标事件
 */
function dragSelection(e) {
  if (!isDragging) return;
  
  let newX = e.clientX - dragStartX;
  let newY = e.clientY - dragStartY;
  
  // 限制在图片范围内
  newX = Math.max(imageDrawArea.x, Math.min(newX, imageDrawArea.x + imageDrawArea.width - selectionWidth));
  newY = Math.max(imageDrawArea.y, Math.min(newY, imageDrawArea.y + imageDrawArea.height - selectionHeight));
  
  selectionBox.style.left = `${newX}px`;
  selectionBox.style.top = `${newY}px`;
  
  selectionStartX = newX;
  selectionStartY = newY;
}

/**
 * 开始调整选择框大小
 * @param {MouseEvent} e - 鼠标事件
 */
function startResizing(e) {
  isResizing = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
}

/**
 * 调整选择框大小
 * @param {MouseEvent} e - 鼠标事件
 */
function resizeSelection(e) {
  if (!isResizing) return;
  
  // 计算新的宽度和高度
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  
  // 保持屏幕比例
  const screenRatio = window.innerWidth / (window.innerHeight - 80);
  let newWidth = selectionWidth + dx;
  let newHeight = newWidth / screenRatio;
  
  // 限制在图片范围内
  newWidth = Math.min(newWidth, imageDrawArea.x + imageDrawArea.width - selectionStartX);
  newHeight = Math.min(newHeight, imageDrawArea.y + imageDrawArea.height - selectionStartY);
  
  // 更新选择框
  selectionBox.style.width = `${newWidth}px`;
  selectionBox.style.height = `${newHeight}px`;
  
  // 更新状态
  selectionWidth = newWidth;
  selectionHeight = newHeight;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
}

/**
 * 重置选择框到初始状态
 */
function resetSelection() {
  initializeSelection();
}

/**
 * 适应屏幕
 */
function fitToScreen() {
  if (!currentImage) return;
  
  // 获取屏幕尺寸
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight - 80;
  
  // 计算缩放比例
  const scaleX = screenWidth / currentImage.width;
  const scaleY = screenHeight / currentImage.height;
  const scale = Math.max(scaleX, scaleY);
  
  // 重新加载图片并设置选择框
  fitImageToCanvas(currentImage);
  initializeSelection();
}

/**
 * 更新尺寸显示
 * @param {number} imageWidth - 图片宽度
 * @param {number} imageHeight - 图片高度
 */
function updateDimensions(imageWidth, imageHeight) {
  const imageDimensions = document.getElementById('image-dimensions');
  const screenDimensions = document.getElementById('screen-dimensions');
  
  if (imageDimensions) {
    imageDimensions.textContent = `${imageWidth} x ${imageHeight}`;
  }
  
  if (screenDimensions) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - 80;
    screenDimensions.textContent = `${screenWidth} x ${screenHeight}`;
  }
}

/**
 * 处理图片
 */
async function processImage() {
  if (!currentImage || !selectionBox) return;
  
  try {
    // 创建离屏Canvas
    const offscreenCanvas = document.createElement('canvas');
    
    // 获取选择框相对于原始图片的位置和大小
    const scaleX = currentImage.width / imageDrawArea.width;
    const scaleY = currentImage.height / imageDrawArea.height;
    
    // 计算在原始图片上的裁剪区域
    const cropX = (selectionStartX - imageDrawArea.x) * scaleX;
    const cropY = (selectionStartY - imageDrawArea.y) * scaleY;
    const cropWidth = selectionWidth * scaleX;
    const cropHeight = selectionHeight * scaleY;
    
    // 设置Canvas大小为裁剪区域大小
    offscreenCanvas.width = cropWidth;
    offscreenCanvas.height = cropHeight;
    
    // 绘制裁剪区域
    const ctx = offscreenCanvas.getContext('2d');
    ctx.drawImage(currentImage, 
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    
    // 转换为Blob
    const blob = await new Promise(resolve => {
      offscreenCanvas.toBlob(resolve, 'image/jpeg', 0.85);
    });
    
    // 转换为File对象
    const file = new File([blob], 'background.jpg', { type: 'image/jpeg' });
    
    // 处理图片（压缩等）
    const result = await processBackgroundImage(file);
    
    // 调用回调函数
    if (onImageProcessed) {
      onImageProcessed(result);
    }
    
    // 关闭编辑器
    closeEditor();
    
  } catch (error) {
    console.error('处理图片失败:', error);
    showNotification('处理图片失败，请重试。');
  }
} 