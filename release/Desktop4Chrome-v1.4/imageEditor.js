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
let imageDrawArea = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};
let onImageProcessed = null;

// DOM元素
let editorModal;

/**
 * 初始化图片编辑器
 */
export function initImageEditor() {
  // 初始化DOM元素
  editorModal = document.getElementById('image-editor-modal');
  canvas = document.getElementById('image-canvas');
  selectionBox = document.querySelector('.selection-box');
  colorPreview = document.querySelector('.color-preview');
  colorPickerBtn = document.getElementById('color-picker-btn');
  
  if (!canvas) {
    console.error('找不到image-canvas元素');
    return;
  }
  
  // 初始化Canvas上下文
  canvasContext = canvas.getContext('2d', { willReadFrequently: true });
  
  // 设置Canvas尺寸
  canvas.width = 400;
  canvas.height = 400;
  
  // 设置事件监听器
  setupEventListeners();
  
  // 添加全局事件监听器
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
  
  // 取消按钮
  const editorCancelBtn = document.getElementById('editor-cancel-btn');
  if (editorCancelBtn) {
    editorCancelBtn.addEventListener('click', closeEditor);
  }
  
  // 应用按钮
  const editorApplyBtn = document.getElementById('editor-apply-btn');
  if (editorApplyBtn) {
    editorApplyBtn.addEventListener('click', processImage);
  }
  
  // 颜色选择器
  colorPickerBtn = document.getElementById('color-picker-btn');
  if (colorPickerBtn) {
    colorPickerBtn.addEventListener('click', toggleColorPickMode);
  }
  
  // 画布点击（颜色选择）
  canvas = document.getElementById('image-canvas');
  if (canvas) {
    canvas.addEventListener('click', (e) => {
      if (isColorPickMode && currentImage) {
        pickColor(e);
      }
    });
    canvasContext = canvas.getContext('2d', { willReadFrequently: true });
  }
  
  // 选择框拖拽和调整大小
  selectionBox = document.querySelector('.selection-box');
  if (selectionBox) {
    selectionBox.addEventListener('mousedown', (e) => {
      if (e.offsetX > selectionBox.offsetWidth - 20 && e.offsetY > selectionBox.offsetHeight - 20) {
        startResizing(e);
      } else {
        startDragging(e);
      }
    });
  }
}

/**
 * 打开编辑器
 */
export function openEditor(callback) {
  // 确保editorModal变量被正确初始化
  if (!editorModal) {
    editorModal = document.getElementById('image-editor-modal');
    if (!editorModal) {
      console.error('找不到image-editor-modal元素');
      showNotification(t('editor_open_failed'), 'error');
      return;
    }
  }
  
  // 保存回调函数
  onImageProcessed = callback;
  
  // 重置编辑器
  resetEditor();
  
  // 显示编辑器模态框
  editorModal.style.display = 'flex';
  setTimeout(() => {
    editorModal.classList.add('show');
  }, 10);
  
  // 确保Canvas和选择框被正确初始化
  if (!canvas || !canvasContext) {
    canvas = document.getElementById('image-canvas');
    if (canvas) {
      canvasContext = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = 400;
      canvas.height = 400;
    }
  }
  
  if (!selectionBox) {
    selectionBox = document.querySelector('.selection-box');
  }
  
  if (!colorPreview) {
    colorPreview = document.querySelector('.color-preview');
  }
  
  if (!colorPickerBtn) {
    colorPickerBtn = document.getElementById('color-picker-btn');
  }
}

/**
 * 关闭编辑器
 */
function closeEditor() {
  stopBackgroundColorToggle();
  resetEditor();
  
  if (editorModal) {
    editorModal.classList.remove('show');
    editorModal.style.display = 'none';
  }
}

/**
 * 重置编辑器
 */
function resetEditor() {
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
  
  // 移除颜色选择模式
  document.body.classList.remove('color-pick-mode');
}

/**
 * 加载图片到画布
 */
export function loadImageToCanvas(img) {
  if (!canvas || !canvasContext) {
    console.error('Canvas或CanvasContext未初始化');
    return;
  }
  
  // 获取画布容器的尺寸
  const container = canvas.parentElement;
  if (!container) {
    console.error('找不到Canvas容器');
    return;
  }
  
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
  
  // 保存当前图片
  currentImage = img;
  
  // 保存图片绘制区域信息
  imageDrawArea = {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight
  };
  
  // 启用颜色选择器按钮
  if (colorPickerBtn) {
    colorPickerBtn.disabled = false;
    colorPickerBtn.title = t('pick_color');
    colorPickerBtn.style.opacity = '1';
    colorPickerBtn.style.cursor = 'pointer';
  }
  
  // 初始化选择框
  if (selectionBox) {
    // 根据图片比例计算选择框大小
    let selectionWidth, selectionHeight;
    
    if (img.width === img.height) {
      // 正方形图片，全选
      selectionWidth = drawWidth;
      selectionHeight = drawHeight;
    } else if (img.width > img.height) {
      // 宽大于高，选择框高度等于图片高度
      selectionHeight = drawHeight;
      selectionWidth = selectionHeight;
    } else {
      // 高大于宽，选择框宽度等于图片宽度
      selectionWidth = drawWidth;
      selectionHeight = selectionWidth;
    }
    
    // 计算选择框位置（居中）
    const selectionX = drawX + (drawWidth - selectionWidth) / 2;
    const selectionY = drawY + (drawHeight - selectionHeight) / 2;
    
    // 更新选择框状态
    selectionStartX = selectionX;
    selectionStartY = selectionY;
    selectionWidth = selectionWidth;
    selectionHeight = selectionHeight;
    
    // 显示选择框
    selectionBox.style.display = 'block';
    selectionBox.style.width = `${selectionWidth}px`;
    selectionBox.style.height = `${selectionHeight}px`;
    selectionBox.style.left = `${selectionX}px`;
    selectionBox.style.top = `${selectionY}px`;
  }
  
  // 开始背景颜色切换效果
  startBackgroundColorToggle();
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
  selectionStartX = Math.floor(Math.max(minX, Math.min(validMaxX, newX)));
  selectionStartY = Math.floor(Math.max(minY, Math.min(validMaxY, newY)));
  
  // 更新选择框位置
  selectionBox.style.left = `${selectionStartX}px`;
  selectionBox.style.top = `${selectionStartY}px`;
  
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
  
  // 使用当前选择框的实际尺寸作为初始值
  initialSelectionWidth = parseInt(selectionBox.style.width) || selectionWidth;
  initialSelectionHeight = parseInt(selectionBox.style.height) || selectionHeight;
  
  e.preventDefault();
  e.stopPropagation();
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
  
  // 更新选择框尺寸
  selectionWidth = selectionHeight = Math.min(newSize, maxAllowedSize);
  
  // 更新选择框样式
  selectionBox.style.width = `${selectionWidth}px`;
  selectionBox.style.height = `${selectionHeight}px`;
  
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
    document.body.classList.add('color-pick-mode');
    
    if (selectionBox) {
      selectionBox.style.display = 'none';
    }
    
    if (canvas) {
      canvas.style.cursor = 'crosshair';
    }
    
    showNotification(t('pick_color_hint'), 'info');
  } else {
    document.body.classList.remove('color-pick-mode');
    
    if (selectionBox) {
      selectionBox.style.display = 'block';
    }
    
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }
}

/**
 * 选择颜色
 * @param {MouseEvent} e - 鼠标事件
 */
function pickColor(e) {
  if (!isColorPickMode || !canvas || !canvasContext) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(e.clientX - rect.left);
  const y = Math.floor(e.clientY - rect.top);
  
  if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
    const pixelData = canvasContext.getImageData(x, y, 1, 1).data;
    
    selectedColor = {
      r: pixelData[0],
      g: pixelData[1],
      b: pixelData[2],
      a: pixelData[3] < 128 ? 0 : 255
    };
    
    updateColorPreview();
    previewTransparency(true);
    toggleColorPickMode();
    showNotification(t('color_selected'), 'success');
  }
}

/**
 * 更新颜色预览
 */
function updateColorPreview() {
  const colorPreview = document.querySelector('.color-preview');
  if (colorPreview && selectedColor) {
    if (selectedColor.a === 0) {
      colorPreview.style.backgroundColor = 'transparent';
      colorPreview.classList.add('transparent');
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
 * @param {boolean} isPermanent - 是否永久保持预览效果
 */
function previewTransparency(isPermanent = false) {
  if (!canvas || !canvasContext || !selectedColor) return;
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  tempCtx.drawImage(canvas, 0, 0);
  const tempImageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
  const data = tempImageData.data;
  const tolerance = 30;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    if (
      Math.abs(r - selectedColor.r) <= tolerance &&
      Math.abs(g - selectedColor.g) <= tolerance &&
      Math.abs(b - selectedColor.b) <= tolerance
    ) {
      data[i + 3] = 0;
    }
  }
  
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  drawCheckerboard();
  tempCtx.putImageData(tempImageData, 0, 0);
  canvasContext.drawImage(tempCanvas, 0, 0);
  
  if (!isPermanent) {
    setTimeout(() => {
      if (canvas && canvasContext) {
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvasContext.drawImage(currentImage, 0, 0);
      }
    }, 5000);
  }
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
  if (!currentImage || !selectedColor) {
    showNotification(t('no_image_loaded'), 'error');
    return;
  }
  
  if (!canvas || !canvasContext) {
    showNotification(t('canvas_not_found'), 'error');
    return;
  }
  
  // 创建临时Canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  // 绘制原始图片
  tempCtx.drawImage(currentImage, 0, 0);
  
  // 获取图片数据
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const data = imageData.data;
  const tolerance = 30;
  
  // 处理每个像素
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    if (
      Math.abs(r - selectedColor.r) <= tolerance &&
      Math.abs(g - selectedColor.g) <= tolerance &&
      Math.abs(b - selectedColor.b) <= tolerance
    ) {
      data[i + 3] = 0;
    }
  }
  
  // 更新画布
  tempCtx.putImageData(imageData, 0, 0);
  
  // 获取处理后的图片URL
  const processedImageUrl = tempCanvas.toDataURL('image/png');
  
  // 创建新图片对象并加载
  const processedImage = new Image();
  processedImage.onload = () => {
    currentImage = processedImage;
    loadImageToCanvas(processedImage);
    if (typeof onImageProcessed === 'function') {
      onImageProcessed(processedImageUrl);
    }
  };
  processedImage.src = processedImageUrl;
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
    
    const canvasContainer = canvas.parentElement;
    if (canvasContainer) {
      canvasContainer.style.backgroundColor = '#f5f5f5';
      canvasContainer.style.backgroundImage = 'none';
    }
  }
} 