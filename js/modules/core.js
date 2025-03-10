/**
 * core.js - 核心模块
 * 处理应用程序的初始化和核心功能
 */

import { initStorage, exportAllData, importData } from './storage.js';
import { initShortcuts, toggleEditMode } from './shortcuts.js';
import { initCities } from './cities.js';
import { initBackground, initImportExport, selectBackgroundImage, setBackground } from './ui.js';
import { showNotification } from './utils.js';
import { initWeather } from './weather.js';
import { getStoredData, saveToStorage } from './storage.js';
import { updateTimeFormatClass, is24HourFormat } from './dateTimeFormat.js';
import { initSpecialFeatures } from './support.js';
import { initI18n, t, applyI18nToHTML } from './i18n/index.js';
import { initImageEditor } from './imageEditor.js';

// 全局变量，用于跟踪模态框状态
let isModalBeingClosed = false;

// 关闭所有模态框和菜单
function closeAllModalsAndMenus() {
  const allModals = document.querySelectorAll('.edit-modal, .city-edit-modal, .format-dialog, .image-editor-modal, .icon-url-dialog');
  const menus = document.querySelectorAll('.city-menu');
  
  allModals.forEach(modal => {
    modal.style.display = 'none';
    
    // 如果是动态创建的模态框，延迟移除DOM元素
    if (modal.classList.contains('format-dialog') && !modal.id) {
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 100);
    }
    
    // 移除show类
    modal.classList.remove('show');
  });
  
  menus.forEach(menu => {
    menu.style.display = 'none';
  });
}

// 初始化应用程序
export async function initApp() {
  try {
    console.log('开始初始化应用程序...');
    
    // 确保所有模态框在初始化时都是关闭的
    closeAllModalsAndMenus();
    
    // 初始化存储
    await initStorage();
    console.log('存储初始化完成');
    
    // 初始化国际化
    await initI18n();
    console.log('国际化初始化完成');
    
    // 初始化背景
    await initBackground();
    console.log('背景初始化完成');
    
    // 初始化快捷方式
    await initShortcuts();
    console.log('快捷方式初始化完成');
    
    // 初始化图片编辑器
    initImageEditor();
    console.log('图片编辑器初始化完成');
    
    // 初始化导入/导出功能
    initImportExport(handleExportData, handleImportData);
    console.log('导入/导出功能初始化完成');
    
    // 初始化城市模块
    await initCities();
    console.log('城市模块初始化完成');
    
    // 初始化天气模块
    await initWeather();
    console.log('天气模块初始化完成');
    
    // 设置全局点击事件
    setupGlobalEvents();
    
    // 设置时间格式类 - 确保在初始化时正确设置
    updateTimeFormatClass();
    console.log('时间格式类设置完成');
    
    // 初始化特殊功能
    initSpecialFeatures();
    
    // 添加DOMContentLoaded事件监听器，确保在DOM完全加载后设置初始间距
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM完全加载，初始化完成');
      });
    } else {
      // 如果DOM已经加载完成，立即设置
      console.log('DOM已加载，初始化完成');
    }
    
    console.log('应用程序初始化完成');
  } catch (error) {
    console.error('初始化应用程序失败:', error);
    showNotification('i18n:app_init_error', { error: error.message });
  }
}

// 设置全局事件
function setupGlobalEvents() {
  // 添加单击事件变量
  let clickTimer = null;
  
  // 添加单击事件监听器
  document.addEventListener('click', function(e) {
    // 如果不是编辑模式，不处理
    if (!document.body.classList.contains('edit-mode')) {
      return;
    }
    
    // 如果正在选择背景图片，不处理
    if (window.isSelectingBackground) {
      console.log('正在选择背景图片，忽略单击事件');
      return;
    }
    
    // 如果刚刚处理了双击事件，不处理
    if (window.justHandledDblClick) {
      console.log('刚刚处理了双击事件，忽略单击事件');
      return;
    }
    
    // 检查是否点击了快捷方式、城市、时间、日期等元素
    if (e.target.closest('.shortcut-item, .city, .time, .date-text, .edit-modal, .city-edit-modal, .format-dialog, .image-editor-modal, .icon-url-dialog, .city-menu, .edit-btn, .add-btn, .settings-btn')) {
      return; // 如果点击了这些元素，不处理
    }
    
    // 检查是否点击了背景
    const isBackground = e.target === document.body || 
                         e.target === document.documentElement || 
                         e.target.classList.contains('container');
    
    if (isBackground) {
      // 设置延迟，避免与双击事件冲突
      clickTimer = setTimeout(() => {
        console.log('单击背景，退出编辑模式');
        import('./shortcuts.js')
          .then(module => {
            if (typeof module.toggleEditMode === 'function') {
              module.toggleEditMode();
            }
          })
          .catch(error => {
            console.error('导入shortcuts.js模块出错:', error);
          });
      }, 300); // 300毫秒延迟，小于双击间隔
    }
  });
  
  // 添加ESC键事件监听
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      // 重置模态框关闭状态
      isModalBeingClosed = false;
      
      // 优先检查图片编辑器模态框
      const imageEditorModal = document.getElementById('image-editor-modal');
      if (imageEditorModal && 
          (imageEditorModal.style.display === 'block' || 
           imageEditorModal.style.display === 'flex' || 
           window.getComputedStyle(imageEditorModal).display !== 'none')) {
        // 标记模态框正在被关闭
        isModalBeingClosed = true;
        // 关闭模态框
        imageEditorModal.style.display = 'none';
        // 阻止事件继续传播
        e.preventDefault();
        e.stopPropagation();
        // 立即返回，不执行后续代码
        return;
      }
      
      // 检查图标URL对话框
      const iconUrlDialog = document.getElementById('icon-url-dialog');
      if (iconUrlDialog && 
          (iconUrlDialog.style.display === 'block' || 
           iconUrlDialog.style.display === 'flex' || 
           window.getComputedStyle(iconUrlDialog).display !== 'none')) {
        // 标记模态框正在被关闭
        isModalBeingClosed = true;
        // 关闭模态框
        iconUrlDialog.style.display = 'none';
        // 阻止事件继续传播
        e.preventDefault();
        e.stopPropagation();
        // 立即返回，不执行后续代码
        return;
      }
      
      // 检查其他模态框
      const allModals = document.querySelectorAll('.edit-modal, .city-edit-modal, .format-dialog');
      
      for (const modal of allModals) {
        if (modal.style.display === 'block' || modal.style.display === 'flex' || 
            (window.getComputedStyle(modal).display !== 'none')) {
          // 标记模态框正在被关闭
          isModalBeingClosed = true;
          // 关闭模态框
          modal.style.display = 'none';
          // 阻止事件继续传播
          e.preventDefault();
          e.stopPropagation();
          // 立即返回，不执行后续代码
          return;
        }
      }
      
      // 检查是否有打开的菜单
      const menus = document.querySelectorAll('.city-menu');
      
      for (const menu of menus) {
        if (menu.style.display === 'block' || 
            (window.getComputedStyle(menu).display !== 'none')) {
          // 标记模态框正在被关闭
          isModalBeingClosed = true;
          // 关闭菜单
          menu.style.display = 'none';
          // 阻止事件继续传播
          e.preventDefault();
          e.stopPropagation();
          // 立即返回，不执行后续代码
          return;
        }
      }
      
      // 如果没有模态框或菜单被关闭，并且处于编辑模式，则退出编辑模式
      if (!isModalBeingClosed && document.body.classList.contains('edit-mode')) {
        import('./shortcuts.js')
          .then(module => {
            if (typeof module.toggleEditMode === 'function') {
              module.toggleEditMode();
            }
          })
          .catch(error => {
            console.error('导入shortcuts.js模块出错:', error);
          });
      }
    }
  }, true); // 使用捕获阶段，确保全局处理器先于其他处理器执行
  
  // 移除旧的双击事件监听器
  const oldDblClickListeners = getEventListeners(document, 'dblclick');
  if (oldDblClickListeners && oldDblClickListeners.length > 0) {
    oldDblClickListeners.forEach(listener => {
      document.removeEventListener('dblclick', listener.listener);
    });
  }
  
  // 添加新的双击事件监听器
  document.addEventListener('dblclick', function(event) {
    // 清除单击定时器，防止单击事件被触发
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
    
    // 设置一个标记，表示已经处理了双击事件
    window.justHandledDblClick = true;
    
    // 延迟清除标记
    setTimeout(() => {
      window.justHandledDblClick = false;
    }, 500);
    
    // 调用原有的双击处理函数
    handleGlobalDblClick(event);
  }, true); // 使用捕获阶段，确保全局处理器先于其他处理器执行
  
  // 监听时间格式变化事件
  document.addEventListener('timeFormatChanged', function(e) {
    console.log('检测到时间格式变化:', e.detail.format);
  });
  
  // 添加单独的背景编辑事件
  document.addEventListener('contextmenu', (event) => {
    // 检查是否是编辑模式
    const isEditMode = document.body.classList.contains('edit-mode');
    
    if (isEditMode && 
        (event.target === document.body || 
         event.target === document.documentElement || 
         event.target.classList.contains('container'))) {
      event.preventDefault(); // 阻止默认右键菜单
      console.log('编辑模式下右键背景，选择背景图片');
      selectBackgroundImage();
    }
  });
}

// 获取元素上的事件监听器（这是一个模拟函数，实际上浏览器不提供直接访问）
function getEventListeners(element, eventType) {
  // 在实际环境中无法获取事件监听器列表
  // 这里返回空数组，实际使用时会被忽略
  return [];
}

// 处理全局双击事件
function handleGlobalDblClick(event) {
  console.log('全局双击事件触发', event.target);
  
  // 如果正在选择背景图片，不处理任何双击事件
  if (window.isSelectingBackground) {
    console.log('正在选择背景图片，忽略双击事件');
    return;
  }
  
  // 获取所有模态框
  const modals = document.querySelectorAll('.edit-modal, .city-edit-modal, .format-dialog');
  
  // 检查是否点击了模态框内部
  for (const modal of modals) {
    if (modal.style.display === 'block' || modal.style.display === 'flex') {
      if (modal.contains(event.target)) {
        console.log('点击了模态框内部，不处理');
        return; // 如果点击了模态框内部，不处理
      }
    }
  }
  
  // 检查是否是编辑模式
  const isEditMode = document.body.classList.contains('edit-mode');
  console.log('当前是否编辑模式:', isEditMode);
  
  // 检查是否双击了背景
  const isBackground = event.target === document.body || 
                       event.target === document.documentElement || 
                       event.target.classList.contains('container');
  
  console.log('是否双击了背景:', isBackground);
  
  // 检查是否双击了快捷方式图标或链接
  const isShortcutItem = event.target.closest('.shortcut-item') !== null;
  if (isShortcutItem) {
    console.log('双击了快捷方式，不处理');
    return; // 不处理快捷方式的双击事件
  }
  
  // 如果是背景且不是编辑模式，切换到编辑模式
  if (isBackground && !isEditMode) {
    console.log('非编辑模式下双击背景，切换到编辑模式');
    toggleEditMode();
    return;
  }
  
  // 检查是否双击了日期元素
  const dateElement = event.target.closest('.date-text');
  if (dateElement) {
    console.log('双击日期元素');
    event.preventDefault();
    event.stopPropagation();
    
    // 如果不是编辑模式，先切换到编辑模式
    if (!isEditMode) {
      console.log('非编辑模式下双击日期元素，切换到编辑模式');
      toggleEditMode();
      return;
    } else {
      // 在编辑模式下，打开日期格式编辑器
      console.log('编辑模式下双击日期元素，打开日期格式编辑器');
      import('./dateTimeFormat.js')
        .then(module => {
          if (typeof module.openDateFormatEditor === 'function') {
            module.openDateFormatEditor(dateElement);
          }
        })
        .catch(error => {
          console.error('导入dateTimeFormat.js模块出错:', error);
        });
    }
    
    return;
  }
  
  // 检查是否双击了时间元素
  const timeElement = event.target.closest('.time');
  if (timeElement) {
    console.log('双击时间元素');
    event.preventDefault();
    event.stopPropagation();
    
    // 如果不是编辑模式，先切换到编辑模式
    if (!isEditMode) {
      console.log('非编辑模式下双击时间元素，切换到编辑模式');
      toggleEditMode();
      return;
    } else {
      // 在编辑模式下，打开时间格式编辑器
      console.log('编辑模式下双击时间元素，打开时间格式编辑器');
      import('./dateTimeFormat.js')
        .then(module => {
          if (typeof module.openTimeFormatEditor === 'function') {
            module.openTimeFormatEditor(timeElement);
          }
        })
        .catch(error => {
          console.error('导入dateTimeFormat.js模块出错:', error);
        });
    }
    
    return;
  }
  
  // 检查是否双击了城市元素
  const cityElement = event.target.closest('.city');
  if (cityElement) {
    console.log('双击城市元素');
    event.preventDefault();
    event.stopPropagation();
    
    // 如果不是编辑模式，先切换到编辑模式
    if (!isEditMode) {
      toggleEditMode();
      return;
    }
    
    // 在编辑模式下，打开城市编辑模态框
    const citiesDisplay = document.getElementById('cities-display');
    if (citiesDisplay) {
      const customEvent = new CustomEvent('cityEdit');
      citiesDisplay.dispatchEvent(customEvent);
    }
    
    return;
  }
  
  // 如果是背景且是编辑模式，打开背景选择器
  if (isBackground && isEditMode) {
    console.log('编辑模式下双击背景，打开背景选择器');
    event.preventDefault();
    event.stopPropagation();
    selectBackgroundImage();
    return;
  }
  
  // 其他情况，如果不是编辑模式，切换到编辑模式
  if (!isEditMode) {
    console.log('双击其他区域，切换到编辑模式');
    toggleEditMode();
  }
}

// 处理导出数据
async function handleExportData() {
  try {
    // 导出所有数据
    await exportAllData();
    
    // 显示通知
    showNotification('i18n:data_exported');
  } catch (error) {
    console.error('导出数据失败:', error);
    showNotification('i18n:data_export_error');
  }
}

// 处理导入数据
async function handleImportData(jsonData) {
  try {
    // 导入数据
    await importData(jsonData);
    
    // 显示通知
    showNotification('i18n:data_imported');
    
    // 刷新页面以应用导入的数据
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('导入数据失败:', error);
    showNotification('i18n:data_import_error');
  }
} 