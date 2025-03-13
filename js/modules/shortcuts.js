/**
 * shortcuts.js - 快捷方式模块
 * 处理网址快捷方式相关的功能
 */

import { convertImageToBase64, showNotification, ModalManager } from './utils.js';
import { getStoredData, saveToStorage } from './storage.js';
import { t, applyI18nToHTML } from './i18n/index.js';
import { initImageEditor, openEditor } from './imageEditor.js';

// 快捷方式相关变量
let shortcuts = []; // 快捷方式列表
let isEditMode = false; // 是否处于编辑模式
let currentEditIndex = -1; // 当前编辑的快捷方式索引
let currentEditPosition = -1; // 当前编辑的快捷方式位置
let dragSourcePosition = -1; // 拖拽源位置
let dragTargetPosition = -1; // 拖拽目标位置
let previewTimeoutId = null; // 预览超时ID
let originalShortcutData = null; // 用于保存原始快捷方式数据，用于检测修改

// DOM元素
let shortcutsGrid;
let editModal;
let shortcutForm;
let shortcutNameInput;
let shortcutIconInput;
let urlsContainer;
let cancelBtn;
let deleteBtn;
let saveBtn;

// 图标相关元素
let iconPreview;
let uploadIconBtn;
let enterIconUrlBtn;
let resetIconBtn;
let iconFileInput;

// 图标URL对话框相关元素
let iconUrlDialog;
let iconUrlInput;
let iconUrlCancelBtn;
let iconUrlConfirmBtn;

// 初始化快捷方式模块
export async function initShortcuts() {
  // 初始化DOM元素
  initShortcutDOMElements();
  
  // 初始化默认快捷方式（如果需要）
  await initializeShortcuts();
  
  // 加载快捷方式数据
  await loadShortcuts();
  
  // 设置事件监听
  setupShortcutEventListeners();
  
  // 设置编辑模式事件监听
  setupEditModeListeners();
}

// 初始化快捷方式相关DOM元素
function initShortcutDOMElements() {
  try {
    shortcutsGrid = document.querySelector('.shortcuts-grid');
    editModal = document.querySelector('.edit-modal');
    shortcutForm = document.getElementById('shortcut-form');
    shortcutNameInput = document.getElementById('shortcut-name');
    shortcutIconInput = document.getElementById('shortcut-icon');
    urlsContainer = document.getElementById('urls-container');
    cancelBtn = document.querySelector('.cancel-btn');
    deleteBtn = document.querySelector('.delete-btn');
    saveBtn = document.querySelector('.save-btn');
    
    // 图标相关元素
    iconPreview = document.getElementById('icon-preview');
    uploadIconBtn = document.getElementById('upload-icon-btn');
    enterIconUrlBtn = document.getElementById('enter-icon-url-btn');
    resetIconBtn = document.getElementById('reset-icon-btn');
    iconFileInput = document.getElementById('icon-file-input');
    
    // 图标URL对话框相关元素
    iconUrlDialog = document.getElementById('icon-url-dialog');
    iconUrlInput = document.getElementById('icon-url-input');
    iconUrlCancelBtn = document.getElementById('icon-url-cancel-btn');
    iconUrlConfirmBtn = document.getElementById('icon-url-confirm-btn');
    
    // 检查必要的DOM元素是否存在
    if (!shortcutsGrid) {
      console.error('找不到快捷方式网格元素');
    }
    
    // 记录DOM元素初始化状态
    console.log('快捷方式DOM元素初始化状态:', {
      shortcutsGrid: !!shortcutsGrid,
      editModal: !!editModal,
      shortcutForm: !!shortcutForm,
      shortcutNameInput: !!shortcutNameInput,
      shortcutIconInput: !!shortcutIconInput,
      urlsContainer: !!urlsContainer,
      cancelBtn: !!cancelBtn,
      deleteBtn: !!deleteBtn,
      saveBtn: !!saveBtn,
      iconPreview: !!iconPreview,
      uploadIconBtn: !!uploadIconBtn,
      enterIconUrlBtn: !!enterIconUrlBtn,
      resetIconBtn: !!resetIconBtn,
      iconFileInput: !!iconFileInput,
      iconUrlDialog: !!iconUrlDialog,
      iconUrlInput: !!iconUrlInput,
      iconUrlCancelBtn: !!iconUrlCancelBtn,
      iconUrlConfirmBtn: !!iconUrlConfirmBtn
    });
  } catch (error) {
    console.error('初始化快捷方式DOM元素时出错:', error);
  }
}

// 加载快捷方式数据
async function loadShortcuts() {
  const result = await getStoredData(['shortcuts', 'isEditMode']);
  
  if (result.shortcuts) {
    shortcuts = result.shortcuts;
  }
  
  // 加载编辑模式状态，默认为false
  isEditMode = false; // 默认不进入编辑模式
  document.body.classList.remove('edit-mode');
  
  // 渲染快捷方式
  renderShortcuts();
}

// 设置快捷方式相关事件监听
function setupShortcutEventListeners() {
  // 快捷方式点击事件 - 只在非编辑模式下打开URL
  shortcutsGrid.addEventListener('click', function(e) {
    // 获取点击的快捷方式元素
    const shortcutItem = e.target.closest('.shortcut-item');
    if (!shortcutItem) return;
    
    // 获取快捷方式索引
    const index = parseInt(shortcutItem.dataset.index);
    if (isNaN(index) || index < 0 || index >= shortcuts.length) return;
    
    // 获取快捷方式
    const shortcut = shortcuts[index];
    
    // 如果是编辑模式，不执行任何操作
    if (isEditMode) {
      console.log('编辑模式下点击快捷方式，不执行操作');
      return;
    }
    
    // 打开快捷方式URL
    openShortcutUrls(shortcut);
  });
  
  // 快捷方式双击事件 - 只在编辑模式下编辑快捷方式
  shortcutsGrid.addEventListener('dblclick', function(e) {
    // 检查是否是编辑模式
    if (!isEditMode) {
      console.log('非编辑模式下双击快捷方式，不执行操作');
      return;
    }
    
    // 获取双击的快捷方式元素
    const shortcutItem = e.target.closest('.shortcut-item');
    if (!shortcutItem) {
      // 如果双击的是空白区域，且处于编辑模式，添加新快捷方式
      // 注意：这部分逻辑已经在单击事件中处理，这里保留是为了兼容性
      const gridCell = e.target.closest('.grid-cell');
      if (gridCell && gridCell.classList.contains('empty')) {
        const position = parseInt(gridCell.dataset.position);
        if (!isNaN(position)) {
          console.log('双击空白区域，添加新快捷方式');
          openEditModal(position, -1);
        }
      }
      return;
    }
    
    // 获取快捷方式索引
    const index = parseInt(shortcutItem.dataset.index);
    if (isNaN(index) || index < 0 || index >= shortcuts.length) return;
    
    // 打开编辑模态框
    console.log('编辑模式下双击快捷方式，打开编辑模态框');
    const position = parseInt(shortcutItem.dataset.position);
    openEditModal(position, index);
    e.stopPropagation(); // 阻止事件冒泡
  });
  
  // 右键菜单事件
  shortcutsGrid.addEventListener('contextmenu', function(e) {
    // 阻止默认右键菜单
    e.preventDefault();
    
    // 获取右键点击的快捷方式元素
    const shortcutItem = e.target.closest('.shortcut-item');
    if (!shortcutItem) return;
    
    // 获取快捷方式索引
    const index = parseInt(shortcutItem.dataset.index);
    if (isNaN(index) || index < 0 || index >= shortcuts.length) return;
    
    // 打开上下文菜单
    openContextMenu(e, index);
  });
  
  // 设置表单提交事件
  shortcutForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const success = await handleFormSubmit();
    if (success) {
      editModal.style.display = 'none';
    }
  });
  
  // 设置取消按钮事件
  cancelBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
  });
  
  // 设置删除按钮事件
  deleteBtn.addEventListener('click', handleDeleteShortcut);
  
  // 为图标URL输入框添加点击全选事件
  if (shortcutIconInput) {
    shortcutIconInput.addEventListener('click', function() {
      this.select();
    });
  }
  
  // 文件输入框变化事件
  if (iconFileInput) {
    iconFileInput.addEventListener('change', function(e) {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        // 读取文件并打开图片编辑器
        readFileAsBase64(file)
          .then(base64Data => {
            // 打开图片编辑器
            openEditor((processedImageData) => {
              console.log('图片处理完成，更新图标预览');
              // 更新图标预览
              updateIconPreview(processedImageData);
              
              // 更新隐藏输入框的值
              if (shortcutIconInput) {
                shortcutIconInput.value = processedImageData;
              } else {
                console.error('找不到shortcutIconInput元素');
              }
            }, base64Data);
          })
          .catch(error => {
            console.error('读取图片文件失败:', error);
            showNotification(t('invalid_image_file'), 'error');
          });
      }
    });
  }
  
  // 检查按钮是否存在再添加事件监听器
  if (uploadIconBtn) {
    // 上传图标按钮点击事件
    uploadIconBtn.addEventListener('click', function() {
      if (iconFileInput) {
        iconFileInput.click();
      }
    });
  }
  
  if (enterIconUrlBtn) {
    // 输入URL按钮点击事件
    enterIconUrlBtn.addEventListener('click', function() {
      openIconUrlDialog();
    });
  }
  
  if (resetIconBtn) {
    // 重置图标按钮点击事件
    resetIconBtn.addEventListener('click', function() {
      resetIconToDefault();
    });
  }
  
  if (iconUrlCancelBtn) {
    // 图标URL对话框取消按钮点击事件
    iconUrlCancelBtn.addEventListener('click', function() {
      closeIconUrlDialog();
    });
  }
  
  if (iconUrlConfirmBtn) {
    // 图标URL对话框确认按钮点击事件
    iconUrlConfirmBtn.addEventListener('click', function() {
      const url = iconUrlInput.value.trim();
      if (url) {
        handleIconUrlInput(url);
      }
      closeIconUrlDialog();
    });
  }

  // 空白区域点击事件 - 在编辑模式下添加新快捷方式
  shortcutsGrid.addEventListener('click', function(e) {
    // 如果不是编辑模式，不处理
    if (!isEditMode) return;
    
    // 如果点击的是快捷方式项，不处理
    if (e.target.closest('.shortcut-item')) return;
    
    // 检查点击的是否是空白区域
    const gridCell = e.target.closest('.grid-cell');
    if (!gridCell || !gridCell.classList.contains('empty')) return;
    
    // 获取位置
    const position = parseInt(gridCell.dataset.position);
    if (isNaN(position)) return;
    
    console.log('编辑模式下点击空白区域，添加新快捷方式');
    openEditModal(position, -1);
  });

  // 图标预览双击事件
  if (iconPreview) {
    iconPreview.addEventListener('dblclick', () => {
      console.log('图标预览双击，打开图片编辑器');
      try {
        // 获取当前图标URL
        let currentIconUrl = '';
        
        // 检查图标预览中是否有图像
        const previewImg = iconPreview.querySelector('img');
        if (previewImg && previewImg.src) {
          currentIconUrl = previewImg.src;
          console.log('从预览图像获取图标URL:', currentIconUrl);
        } else if (shortcutIconInput && shortcutIconInput.value) {
          currentIconUrl = shortcutIconInput.value;
          console.log('从输入框获取图标URL:', currentIconUrl);
        }
        
        // 确保URL是有效的
        if (!currentIconUrl || (!currentIconUrl.startsWith('data:') && !currentIconUrl.startsWith('http'))) {
          console.log('图标URL无效或为空，不传递到编辑器');
          currentIconUrl = '';
        }
        
        console.log('打开图片编辑器，传递图标URL:', currentIconUrl);
        
        // 直接使用回调函数处理编辑后的图像
        openEditor(function(processedImageData) {
          console.log('图片处理完成，更新图标预览');
          // 更新图标预览
          updateIconPreview(processedImageData);
          
          // 更新隐藏输入框的值
          if (shortcutIconInput) {
            shortcutIconInput.value = processedImageData;
          } else {
            console.error('找不到shortcutIconInput元素');
          }
        }, currentIconUrl);
      } catch (error) {
        console.error('打开图片编辑器失败:', error);
        showNotification(t('editor_open_failed'), 'error');
      }
    });
  }
}

// 设置编辑模式事件监听
function setupEditModeListeners() {
  // 移除全局双击事件，避免与core.js中的冲突
  // document.addEventListener('dblclick', function(e) {
  //   // 如果点击的是模态框内部，不处理
  //   if (editModal.contains(e.target)) {
  //     return;
  //   }
  //   
  //   // 如果不在编辑模式，双击任何地方进入编辑模式
  //   if (!isEditMode) {
  //     toggleEditMode();
  //     return;
  //   }
  // });
  
  // 添加键盘快捷键
  document.addEventListener('keydown', function(e) {
    // Command/Windows+E 进入编辑模式
    if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
      e.preventDefault();
      toggleEditMode();
      console.log('使用快捷键切换编辑模式');
    }
    
    // 注意：Esc键处理由core.js统一处理
  });
  
  // 设置URL输入事件
  setupUrlInputEvents();
}

// 切换编辑模式
export function toggleEditMode() {
  isEditMode = !isEditMode;
  
  // 更新DOM
  document.body.classList.toggle('edit-mode', isEditMode);
  
  // 更新可拖拽状态
  updateDraggable();
  
  // 保存编辑模式状态
  saveToStorage({ isEditMode });
  
  // 显示通知
  if (isEditMode) {
    showNotification('i18n:edit_mode_entered');
  } else {
    showNotification('i18n:edit_mode_exited');
  }
  
  // 触发事件
  document.dispatchEvent(new CustomEvent('editModeChanged', { detail: { isEditMode } }));
}

// 更新拖放属性
function updateDraggable() {
  // 更新快捷方式的拖放属性
  document.querySelectorAll('.shortcut-item').forEach(shortcut => {
    shortcut.setAttribute('draggable', isEditMode);
  });
  
  // 更新空网格的可见性
  document.querySelectorAll('.grid-cell.empty').forEach(cell => {
    if (isEditMode) {
      cell.style.visibility = 'visible';
      cell.style.pointerEvents = 'auto'; // 启用鼠标事件
      
      // 确保空白单元格有"+"号显示
      if (!cell.querySelector('.add-shortcut-placeholder')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'add-shortcut-placeholder';
        cell.appendChild(placeholder);
      }
      
      // 确保单击事件已绑定
      if (!cell.hasAttribute('click-handler-attached')) {
        cell.setAttribute('click-handler-attached', 'true');
        cell.addEventListener('click', () => {
          if (isEditMode) {
            const position = parseInt(cell.dataset.position);
            if (!isNaN(position)) {
              console.log('单击空白区域，添加新快捷方式');
              openEditModal(-1, position);
            }
          }
        });
      }
    } else {
      cell.style.visibility = 'hidden';
      cell.style.pointerEvents = 'none'; // 禁用鼠标事件
    }
  });
}

// 渲染快捷方式
export function renderShortcuts() {
  // 清空快捷方式网格
  shortcutsGrid.innerHTML = '';
  
  // 创建网格数组，用于管理快捷方式位置
  const grid = Array(18).fill(null); // 3行6列，共18个位置
  
  // 将快捷方式放入网格
  shortcuts.forEach((shortcut, index) => {
    if (shortcut && shortcut.position !== undefined && shortcut.position < 18) {
      // 添加原始索引，用于后续操作
      grid[shortcut.position] = { ...shortcut, originalIndex: index };
    } else {
      // 如果没有位置信息，添加到第一个空位置
      const emptyPosition = grid.findIndex(item => item === null);
      if (emptyPosition !== -1) {
        grid[emptyPosition] = { ...shortcut, originalIndex: index, position: emptyPosition };
        // 更新快捷方式的位置
        shortcuts[index].position = emptyPosition;
      }
    }
  });
  
  // 渲染网格
  grid.forEach((item, position) => {
    const gridCell = document.createElement('div');
    gridCell.className = 'grid-cell';
    gridCell.dataset.position = position;
    
    // 添加拖放相关属性和事件
    gridCell.setAttribute('droppable', 'true');
    gridCell.addEventListener('dragover', handleDragOver);
    gridCell.addEventListener('drop', handleDrop);
    
    if (item) {
      // 有快捷方式的网格单元
      const shortcutElement = document.createElement('div');
      shortcutElement.className = 'shortcut-item';
      shortcutElement.dataset.index = item.originalIndex;
      shortcutElement.dataset.position = position;
      
      // 设置拖放相关属性
      shortcutElement.setAttribute('draggable', isEditMode);
      
      // 获取网站图标
      let iconUrl = item.icon;
      if (!iconUrl && item.urls && item.urls.length > 0) {
        // 如果没有自定义图标，使用第一个URL的网站图标
        const firstUrl = item.urls[0];
        if (firstUrl) {
          // 从URL中提取域名
          let domain = firstUrl;
          try {
            // 尝试解析URL获取域名
            const url = new URL(firstUrl);
            domain = url.hostname;
          } catch (e) {
            // 如果URL解析失败，使用原始URL
            console.warn('URL解析失败:', firstUrl);
          }
          iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        }
      }
      
      // 创建图标元素
      const iconElement = document.createElement('div');
      iconElement.className = 'shortcut-icon';
      
      // 创建默认图标的函数
      const createDefaultIcon = () => {
        // 使用网站的第一个URL获取favicon
        if (item.urls && item.urls.length > 0) {
          const firstUrl = item.urls[0];
          
          // 验证URL格式
          if (!firstUrl || typeof firstUrl !== 'string') {
            console.warn('无效的URL:', firstUrl);
            // 使用默认图标
            iconElement.innerHTML = '<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; color: white; font-size: 24px;"><i class="fas fa-link"></i></div>';
            return false;
          }
          
          // 确保URL有协议前缀
          let urlWithProtocol = firstUrl;
          if (!firstUrl.startsWith('http://') && !firstUrl.startsWith('https://')) {
            urlWithProtocol = 'https://' + firstUrl;
          }
          
          // 尝试构造URL对象
          try {
            const url = new URL(urlWithProtocol);
            const domain = url.hostname;
            
            // 检查域名是否有效
            if (!domain || domain === 'newtab' || domain.includes('chrome://') || domain.includes('chrome-extension://')) {
              console.warn('无效的域名或Chrome内部页面:', domain);
              // 使用默认图标
              iconElement.innerHTML = '<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; color: white; font-size: 24px;"><i class="fas fa-link"></i></div>';
              return false;
            }
            
            const imgElement = document.createElement('img');
            imgElement.style.width = '100%';
            imgElement.style.height = '100%';
            imgElement.style.objectFit = 'contain';
            imgElement.style.opacity = '0';
            
            imgElement.onload = function() {
              setTimeout(() => {
                this.style.opacity = '1';
              }, 50);
            };
            
            imgElement.onerror = function() {
              // 如果当前尝试的favicon加载失败，尝试下一个方法
              if (this.dataset.attempt === '1') {
                // 尝试方法2：直接访问网站根目录下的favicon.ico
                console.log(`尝试方法2：直接访问 ${domain} 的favicon.ico`);
                this.dataset.attempt = '2';
                this.src = `https://${domain}/favicon.ico`;
              } else if (this.dataset.attempt === '2') {
                // 尝试方法3：使用Google的favicon服务
                console.log(`尝试方法3：使用Google的favicon服务获取 ${domain} 的图标`);
                this.dataset.attempt = '3';
                this.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
              } else {
                // 所有方法都失败，使用默认图标
                console.log(`所有方法都失败，为 ${domain} 使用默认图标`);
                this.style.display = 'none';
                iconElement.innerHTML = '<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; color: white; font-size: 24px;"><i class="fas fa-link"></i></div>';
              }
            };
            
            // 尝试方法1：使用Chrome的favicon缓存
            console.log(`尝试方法1：从Chrome缓存获取 ${domain} 的favicon`);
            imgElement.dataset.attempt = '1';
            imgElement.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            
            iconElement.appendChild(imgElement);
            return true;
          } catch (e) {
            console.warn('URL解析失败:', firstUrl, e);
            // 使用默认图标
            iconElement.innerHTML = '<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; color: white; font-size: 24px;"><i class="fas fa-link"></i></div>';
            return false;
          }
        }
        
        // 如果没有URL或解析失败，使用默认图标
        iconElement.innerHTML = '<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; color: white; font-size: 24px;"><i class="fas fa-link"></i></div>';
        return false;
      };
      
      if (iconUrl) {
        // 检查图标URL是否有效
        const isValidUrl = (url) => {
          try {
            new URL(url);
            return true;
          } catch (e) {
            return false;
          }
        };
        
        // 创建图片元素
        const imgElement = document.createElement('img');
        imgElement.style.width = '100%';
        imgElement.style.height = '100%';
        imgElement.style.objectFit = 'contain';
        
        // 默认隐藏图片，直到加载完成
        imgElement.style.opacity = '0';
        
        // 图片加载完成后显示
        imgElement.onload = function() {
          // 延迟显示，确保渲染完成
          setTimeout(() => {
            this.style.opacity = '1';
          }, 50);
        };
        
        // 添加错误处理
        imgElement.onerror = function() {
          console.warn('图标加载失败:', this.src);
          // 移除失败的图片
          this.remove();
          // 使用默认图标
          createDefaultIcon();
        };
        
        // 如果是有效URL，直接使用；否则尝试添加https://前缀
        let finalIconUrl = '';
        if (isValidUrl(iconUrl)) {
          finalIconUrl = iconUrl;
        } else if (isValidUrl(`https://${iconUrl}`)) {
          finalIconUrl = `https://${iconUrl}`;
        } else {
          console.warn('无效的图标URL:', iconUrl);
          // 使用默认图标
          createDefaultIcon();
          return;
        }
        
        // 尝试使用代理服务来解决CORS问题
        // 注意：这些代理服务可能有使用限制，仅用于测试
        if (finalIconUrl.includes('lovepik.com') || finalIconUrl.includes('.png') || finalIconUrl.includes('.jpg') || finalIconUrl.includes('.jpeg')) {
          // 对于特定网站或图片格式，直接使用原始URL
          imgElement.src = finalIconUrl;
          
          // 如果直接加载失败，使用默认图标
          imgElement.onerror = function() {
            console.warn('图标加载失败:', finalIconUrl);
            this.remove();
            createDefaultIcon();
          };
        } else {
          // 对于其他URL，直接尝试加载
          imgElement.src = finalIconUrl;
        }
        
        // 将图片元素添加到图标容器
        iconElement.appendChild(imgElement);
      } else {
        // 如果没有提供图标URL，使用默认图标
        createDefaultIcon();
      }
      
      // 创建名称元素
      const nameElement = document.createElement('div');
      nameElement.className = 'shortcut-name';
      nameElement.textContent = item.name;
      
      // 添加图标和名称到快捷方式元素
      shortcutElement.appendChild(iconElement);
      shortcutElement.appendChild(nameElement);
      
      // 添加拖拽事件
      shortcutElement.addEventListener('dragstart', handleDragStart);
      shortcutElement.addEventListener('dragend', handleDragEnd);
      
      // 添加快捷方式元素到网格单元
      gridCell.appendChild(shortcutElement);
      
      // 添加空白类
      gridCell.classList.remove('empty');
    } else {
      // 空白网格单元
      gridCell.classList.add('empty');
      
      // 在编辑模式下，空白单元格显示"+"
      if (isEditMode) {
        gridCell.innerHTML = '<div class="add-shortcut-placeholder"></div>';
        
        // 单击空白单元格添加新快捷方式
        gridCell.addEventListener('click', () => {
          if (isEditMode) {
            openEditModal(-1, position);
          }
        });
      }
    }
    
    shortcutsGrid.appendChild(gridCell);
  });
  
  // 更新拖放属性
  updateDraggable();
  
  // 保存快捷方式数据（确保位置信息正确）
  saveToStorage({ shortcuts });
}

// 打开快捷方式URL
function openShortcutUrls(shortcut) {
  if (!shortcut.urls || shortcut.urls.length === 0) {
    showNotification('快捷方式没有URL');
    return;
  }
  
  console.log('打开快捷方式URL:', shortcut.urls);
  
  // 如果只有一个URL，直接在当前窗口打开
  if (shortcut.urls.length === 1) {
    window.location.href = shortcut.urls[0];
    return;
  }
  
  // 如果有多个URL，打开第一个URL，其余在新标签页打开
  window.location.href = shortcut.urls[0];
  
  // 从第二个URL开始，在新标签页打开
  for (let i = 1; i < shortcut.urls.length; i++) {
    window.open(shortcut.urls[i], '_blank');
  }
}

// 打开上下文菜单
function openContextMenu(event, index) {
  // 创建上下文菜单
  const contextMenu = document.createElement('div');
  contextMenu.className = 'context-menu';
  contextMenu.style.top = `${event.clientY}px`;
  contextMenu.style.left = `${event.clientX}px`;
  
  // 添加菜单项
  contextMenu.innerHTML = `
    <div class="context-menu-item" data-action="edit">
      <i class="fas fa-edit"></i> 编辑
    </div>
    <div class="context-menu-item" data-action="delete">
      <i class="fas fa-trash"></i> 删除
    </div>
  `;
  
  // 添加菜单项点击事件
  contextMenu.addEventListener('click', (e) => {
    const menuItem = e.target.closest('.context-menu-item');
    if (!menuItem) return;
    
    const action = menuItem.dataset.action;
    
    if (action === 'edit') {
      openEditModal(index);
    } else if (action === 'delete') {
      deleteShortcut(index);
    }
    
    // 关闭菜单
    document.body.removeChild(contextMenu);
  });
  
  // 添加到文档
  document.body.appendChild(contextMenu);
  
  // 点击其他区域关闭菜单
  document.addEventListener('click', function closeMenu(e) {
    if (!contextMenu.contains(e.target)) {
      if (document.body.contains(contextMenu)) {
        document.body.removeChild(contextMenu);
      }
      document.removeEventListener('click', closeMenu);
    }
  });
}

/**
 * 打开编辑模态框
 * @param {number} position - 位置
 * @param {number} index - 快捷方式索引，-1表示新建
 */
function openEditModal(position, index = -1) {
  try {
    console.log(`打开编辑模态框: 位置=${position}, 索引=${index}`);
    
    // 保存当前编辑的快捷方式信息
    currentEditPosition = position;
    currentEditIndex = index;
    
    // 重置表单
    shortcutForm.reset();
    
    // 清空URL输入框容器
    urlsContainer.innerHTML = '';
    
    // 清空图标预览
    updateIconPreview(null);
    
    // 获取快捷方式数据
    let shortcut = null;
    if (index !== -1 && shortcuts[index]) {
      shortcut = shortcuts[index];
      originalShortcutData = JSON.stringify(shortcut);
      
      // 设置名称
      if (shortcutNameInput) {
        shortcutNameInput.value = shortcut.name || '';
      }
      
      // 设置图标
      if (shortcutIconInput) {
        shortcutIconInput.value = shortcut.icon || '';
      }
      
      // 更新图标预览
      if (shortcut.icon) {
        updateIconPreview(shortcut.icon);
      } else {
        // 尝试获取默认图标
        if (shortcut.urls && shortcut.urls.length > 0) {
          const firstUrl = shortcut.urls[0];
          try {
            const url = new URL(firstUrl);
            const domain = url.hostname;
            const defaultIconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            updateIconPreview(defaultIconUrl);
          } catch (error) {
            console.error('解析URL失败:', error);
            updateIconPreview(null);
          }
        }
      }
      
      // 设置URL
      if (shortcut.urls && shortcut.urls.length > 0) {
        shortcut.urls.forEach((url, i) => {
          addUrlInput(url);
        });
      }
    }
    
    // 确保至少有一个空的URL输入框
    ensureEmptyInputExists();
    
    // 显示/隐藏删除按钮
    if (deleteBtn) {
      deleteBtn.style.display = index !== -1 ? 'block' : 'none';
    }
    
    // 显示模态框
    if (editModal) {
      editModal.style.display = 'block';
      
      // 自动全选名称输入框的文本
      setTimeout(() => {
        if (shortcutNameInput) {
          shortcutNameInput.focus();
          shortcutNameInput.select();
        }
      }, 100);
    } else {
      console.error('找不到editModal元素');
    }
  } catch (error) {
    console.error('打开编辑模态框时出错:', error);
    showNotification(t('edit_modal_open_failed'), 'error');
  }
}

/**
 * 添加URL输入框
 * @param {string} url - URL
 */
function addUrlInput(url = '') {
  console.log('添加URL输入框:', url);
  
  // 获取当前URL输入框数量
  const urlGroups = urlsContainer.querySelectorAll('.url-group');
  const index = urlGroups.length;
  
  // 创建URL输入组
  const urlGroup = document.createElement('div');
  urlGroup.className = 'form-group url-group';
  
  // 创建标签
  const label = document.createElement('label');
  label.setAttribute('for', `shortcut-url-${index}`);
  label.textContent = `${t('shortcut_url')}${index + 1}`;
  
  // 创建URL输入容器
  const urlInputContainer = document.createElement('div');
  urlInputContainer.className = 'url-input-container';
  
  // 创建URL输入框
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.className = 'shortcut-url';
  urlInput.id = `shortcut-url-${index}`;
  urlInput.value = url;
  
  // 设置第一个输入框为必填，其他为可选
  if (index === 0) {
    urlInput.required = true;
    urlInput.placeholder = t('url_required');
  } else {
    urlInput.required = false;
    urlInput.placeholder = t('url_empty_or_fill');
  }
  
  // 创建URL按钮容器
  const urlButtons = document.createElement('div');
  urlButtons.className = 'url-buttons';
  
  // 创建删除按钮
  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'remove-url-btn';
  removeButton.title = t('remove_url');
  removeButton.innerHTML = '<i class="fas fa-minus"></i>';
  removeButton.style.display = 'none'; // 默认隐藏

  // 添加删除按钮事件
  removeButton.addEventListener('click', function() {
    urlGroup.remove();
    updateUrlLabels();
    updateRemoveButtons();
    ensureEmptyInputExists();
  });

  // 为URL输入框添加点击全选事件
  urlInput.addEventListener('click', function() {
    this.select();
  });

  // 为URL输入框添加输入事件
  urlInput.addEventListener('input', function() {
    // 如果输入框不为空，尝试获取网站图标
    if (this.value.trim() !== '') {
      // 异步获取图标并更新预览
      tryLoadIconFromUrl(this.value.trim())
        .then(base64Data => {
          if (base64Data) {
            // 更新图标预览
            updateIconPreview(base64Data);
            
            // 更新隐藏输入框的值
            shortcutIconInput.value = base64Data;
          }
        })
        .catch(error => {
          console.error('处理图标失败:', error);
        });
    }
    
    // 更新删除按钮的显示状态
    updateRemoveButtons();
    
    // 确保有一个空白输入框
    ensureEmptyInputExists();
  });

  // 添加到DOM
  urlButtons.appendChild(removeButton);
  urlInputContainer.appendChild(urlInput);
  urlInputContainer.appendChild(urlButtons);
  urlGroup.appendChild(label);
  urlGroup.appendChild(urlInputContainer);
  urlsContainer.appendChild(urlGroup);
  
  // 更新URL标签
  updateUrlLabels();
  
  // 更新删除按钮
  updateRemoveButtons();
  
  // 确保有一个空白输入框
  ensureEmptyInputExists();
  
  return urlInput;
}

/**
 * 更新所有URL标签
 */
function updateUrlLabels() {
  console.log('更新URL标签');
  
  const urlGroups = urlsContainer.querySelectorAll('.url-group');
  
  urlGroups.forEach((group, index) => {
    const label = group.querySelector('label');
    if (label) {
      label.setAttribute('for', `shortcut-url-${index}`);
      label.setAttribute('data-i18n', 'shortcut_url');
      label.textContent = `${t('shortcut_url')}${index + 1}`;
    }
    
    const input = group.querySelector('.shortcut-url');
    if (input) {
      input.id = `shortcut-url-${index}`;
    }
  });
  
  console.log(`更新了${urlGroups.length}个URL标签`);
}

/**
 * 更新删除按钮的显示状态
 */
function updateRemoveButtons() {
  console.log('更新删除按钮显示状态');
  
  const urlInputs = urlsContainer.querySelectorAll('.shortcut-url');
  const removeButtons = urlsContainer.querySelectorAll('.remove-url-btn');
  
  // 计算非空输入框的数量
  let filledInputsCount = 0;
  urlInputs.forEach(input => {
    if (input.value.trim() !== '') {
      filledInputsCount++;
    }
  });
  
  console.log(`非空输入框数量: ${filledInputsCount}`);
  
  // 更新每个输入框的删除按钮
  urlInputs.forEach((input, index) => {
    const removeButton = removeButtons[index];
    if (!removeButton) return;
    
    // 如果输入框为空，始终隐藏删除按钮
    if (input.value.trim() === '') {
      removeButton.style.display = 'none';
    } 
    // 如果只有一个非空输入框，也隐藏删除按钮
    else if (filledInputsCount <= 1) {
      removeButton.style.display = 'none';
    }
    // 其他情况显示删除按钮
    else {
      removeButton.style.display = '';
    }
  });
}

/**
 * 处理表单提交
 */
async function handleFormSubmit() {
  console.log('处理表单提交');
  
  try {
    // 获取名称
    const name = shortcutNameInput.value.trim();
    if (!name) {
      showNotification(t('please_enter_name'), 'error');
      shortcutNameInput.focus();
      return false;
    }
    
    // 获取所有URL
    const urlInputs = urlsContainer.querySelectorAll('.shortcut-url');
    const urls = [];
    let hasEmptyRequired = false;
    
    urlInputs.forEach((input, index) => {
      const url = input.value.trim();
      
      // 第一个URL输入框是必填的
      if (index === 0 && !url) {
        hasEmptyRequired = true;
        input.setCustomValidity(t('url_required'));
        input.reportValidity();
      } else {
        input.setCustomValidity('');
      }
      
      if (url) {
        urls.push(url);
      }
    });
    
    if (hasEmptyRequired) {
      console.error('第一个URL输入框为空');
      return false;
    }
    
    if (urls.length === 0) {
      showNotification(t('please_enter_url'), 'error');
      urlsContainer.querySelector('.shortcut-url').focus();
      return false;
    }
    
    // 获取图标
    const icon = shortcutIconInput.value;
    
    // 创建快捷方式对象
    const shortcut = {
      name,
      urls,
      icon
    };
    
    console.log('提交的快捷方式数据:', shortcut);
    
    // 保存快捷方式
    await saveShortcut(shortcut);
    
    // 关闭模态框
    editModal.style.display = 'none';
    
    return true;
  } catch (error) {
    console.error('处理表单提交失败:', error);
    showNotification(t('form_submit_error'), 'error');
    return false;
  }
}

// 保存快捷方式
async function saveShortcut(shortcut) {
  try {
    // 如果没有自定义图标但有URL，尝试获取并保存默认图标
    if (!shortcut.icon && shortcut.urls && shortcut.urls.length > 0) {
      const firstUrl = shortcut.urls[0];
      try {
        // 从URL中提取域名
        const url = new URL(firstUrl);
        const domain = url.hostname;
        const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        
        // 尝试下载图标并转换为Base64
        try {
          console.log('尝试下载并保存默认图标:', iconUrl);
          const base64Icon = await convertImageToBase64(iconUrl);
          if (base64Icon) {
            shortcut.icon = base64Icon;
            console.log('成功保存默认图标为Base64');
          }
        } catch (iconError) {
          console.warn('下载默认图标失败:', iconError);
          // 如果下载失败，仍然保存URL，以便后续尝试加载
          shortcut.icon = iconUrl;
        }
      } catch (urlError) {
        console.warn('URL解析失败:', firstUrl);
      }
    }
    
    // 如果是编辑现有快捷方式
    if (currentEditIndex !== -1) {
      shortcuts[currentEditIndex] = shortcut;
      
      // 保持原来的位置
      if (shortcuts[currentEditIndex].position === undefined && currentEditPosition !== -1) {
        shortcuts[currentEditIndex].position = currentEditPosition;
      }
    } else {
      // 如果是添加新快捷方式
      // 设置位置
      if (currentEditPosition !== -1) {
        shortcut.position = currentEditPosition;
      }
      shortcuts.push(shortcut);
    }
    
    // 保存到存储
    await saveToStorage({ shortcuts });
    
    // 重新渲染快捷方式
    renderShortcuts();
    
    // 关闭模态框
    editModal.style.display = 'none';
    
    // 显示通知
    showNotification(currentEditIndex !== -1 ? 'i18n:shortcut_updated' : 'i18n:shortcut_added');
    
    // 重置编辑状态
    currentEditIndex = -1;
    currentEditPosition = -1;
  } catch (error) {
    console.error('保存快捷方式失败:', error);
  }
}

/**
 * 处理删除快捷方式
 */
function handleDeleteShortcut() {
  console.log('删除快捷方式:', currentEditIndex);
  
  if (currentEditIndex === -1) {
    console.warn('没有选中的快捷方式');
    return;
  }
  
  // 从数组中移除
  shortcuts.splice(currentEditIndex, 1);
  
  // 保存到存储
  saveToStorage({ shortcuts });
  
  // 关闭模态框
  editModal.style.display = 'none';
  
  // 重新渲染快捷方式
  renderShortcuts();
  
  // 显示通知
  showNotification(t('shortcut_deleted'), 'success');
}

// 处理拖拽开始
function handleDragStart(event) {
  // 获取拖拽源的位置
  dragSourcePosition = parseInt(event.currentTarget.dataset.position);
  
  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', dragSourcePosition);
  
  // 添加拖拽样式
  event.currentTarget.classList.add('dragging');
}

// 处理拖拽经过
function handleDragOver(event) {
  // 阻止默认行为，允许放置
  event.preventDefault();
  
  // 设置放置效果
  event.dataTransfer.dropEffect = 'move';
  
  // 获取目标位置
  const target = event.currentTarget;
  const targetPosition = parseInt(target.dataset.position);
  
  // 如果目标位置与源位置不同，添加拖拽目标样式
  if (targetPosition !== dragSourcePosition) {
    // 移除所有其他单元格的拖拽目标样式
    document.querySelectorAll('.grid-cell').forEach(cell => {
      if (cell !== target) {
        cell.classList.remove('drop-target');
      }
    });
    
    // 添加拖拽目标样式
    target.classList.add('drop-target');
  }
}

// 处理放置
function handleDrop(event) {
  // 阻止默认行为
  event.preventDefault();
  
  // 获取目标位置
  const target = event.currentTarget;
  const targetPosition = parseInt(target.dataset.position);
  
  // 如果源位置和目标位置相同，不做任何操作
  if (dragSourcePosition === targetPosition || dragSourcePosition === -1) {
    return;
  }
  
  console.log(`拖拽放置: 从位置 ${dragSourcePosition} 到位置 ${targetPosition}`);
  
  // 查找源快捷方式和目标快捷方式
  const sourceIndex = shortcuts.findIndex(s => s.position === dragSourcePosition);
  const targetIndex = shortcuts.findIndex(s => s.position === targetPosition);
  
  if (sourceIndex !== -1) {
    // 如果目标位置已有快捷方式，交换位置
    if (targetIndex !== -1) {
      const tempPosition = shortcuts[sourceIndex].position;
      shortcuts[sourceIndex].position = shortcuts[targetIndex].position;
      shortcuts[targetIndex].position = tempPosition;
    } else {
      // 如果目标位置没有快捷方式，直接更新位置
      shortcuts[sourceIndex].position = targetPosition;
    }
    
    // 保存到存储
    saveToStorage({ shortcuts });
    
    // 重新渲染快捷方式
    renderShortcuts();
  }
  
  // 移除拖拽目标样式
  target.classList.remove('drop-target');
}

// 处理拖拽结束
function handleDragEnd(event) {
  // 移除所有拖拽相关样式
  document.querySelectorAll('.grid-cell').forEach(cell => {
    cell.classList.remove('drop-target');
  });
  
  // 移除拖拽源样式
  event.currentTarget.classList.remove('dragging');
  
  // 重置拖拽位置
  dragSourcePosition = -1;
}

// 初始化快捷方式
export async function initializeShortcuts() {
  // 检查是否有快捷方式数据
  const result = await getStoredData(['shortcuts']);
  
  // 如果没有快捷方式数据，添加默认快捷方式
  if (!result.shortcuts || result.shortcuts.length === 0) {
    // 从storage模块获取初始化数据
    const { initStorage } = await import('./storage.js');
    await initStorage();
    
    // 重新获取快捷方式数据
    const updatedResult = await getStoredData(['shortcuts']);
    shortcuts = updatedResult.shortcuts || [];
  } else {
    // 更新快捷方式数组
    shortcuts = result.shortcuts;
  }
}

// 处理图标文件上传
async function handleIconFileUpload(file) {
  try {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      showNotification('i18n:invalid_image_file');
      return;
    }
    
    // 读取文件并转换为Base64
    const base64Data = await readFileAsBase64(file);
    
    // 更新图标预览
    updateIconPreview(base64Data);
    
    // 更新隐藏输入框的值
    shortcutIconInput.value = base64Data;
  } catch (error) {
    console.error('处理图标文件上传失败:', error);
    showNotification('i18n:icon_upload_failed');
  }
}

// 读取文件并转换为Base64
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      resolve(e.target.result);
    };
    
    reader.onerror = function(error) {
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
}

// 从URL中获取默认图标
async function getDefaultIconFromUrl(url) {
  try {
    // 验证URL格式
    if (!url || typeof url !== 'string') {
      console.warn('无效的URL:', url);
      return null;
    }
    
    // 检查URL是否为Chrome内部页面
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url === 'newtab') {
      console.warn('无法获取Chrome内部页面的图标:', url);
      return null;
    }
    
    // 移除URL中的空格和特殊字符
    url = url.trim();
    
    // 确保URL有协议前缀
    let urlWithProtocol = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlWithProtocol = 'https://' + url;
    }
    
    // 检查URL是否包含有效的域名部分 - 使用更宽松的正则表达式
    if (!urlWithProtocol.match(/^https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9.]*(\.[a-zA-Z]{2,})?(\/.*)?$/)) {
      console.warn('URL格式不正确:', urlWithProtocol);
      return null;
    }
    
    // 尝试构造URL对象
    let urlObj;
    try {
      urlObj = new URL(urlWithProtocol);
    } catch (e) {
      console.warn('无法构造URL对象:', urlWithProtocol, e);
      return null;
    }
    
    // 从URL中提取域名
    const domain = urlObj.hostname;
    
    // 检查域名是否有效
    if (!domain || domain === 'newtab' || domain.includes('chrome://') || domain.includes('chrome-extension://')) {
      console.warn('无效的域名或Chrome内部页面:', domain);
      return null;
    }
    
    // 尝试直接从网站获取favicon.ico
    try {
      const faviconUrl = `https://${domain}/favicon.ico`;
      console.log('尝试直接访问favicon.ico:', faviconUrl);
      const iconData = await loadImageAsBase64(faviconUrl);
      if (iconData) {
        console.log('成功从网站获取favicon.ico');
        return iconData;
      }
    } catch (error) {
      console.warn('直接访问favicon.ico失败:', error);
      // 继续尝试其他方法
    }
    
    // 使用Google的favicon服务
    try {
      console.log('使用Google的favicon服务获取图标');
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      return await loadImageAsBase64(googleFaviconUrl);
    } catch (error) {
      console.warn('从Google获取favicon失败:', error);
    }
    
    // 如果所有方法都失败，返回null
    return null;
  } catch (error) {
    console.error('获取网站图标失败:', error);
    return null;
  }
}

/**
 * 确保有一个空白输入框
 */
function ensureEmptyInputExists() {
  console.log('确保有一个空白输入框');
  
  // 获取所有URL输入框
  const urlInputs = urlsContainer.querySelectorAll('.shortcut-url');
  
  // 检查是否有空白输入框
  let hasEmptyInput = false;
  urlInputs.forEach(input => {
    if (input.value.trim() === '') {
      hasEmptyInput = true;
    }
  });
  
  // 如果没有空白输入框，添加一个
  if (!hasEmptyInput) {
    console.log('添加一个空白输入框');
    addUrlInput('');
  }
}

// 打开图标URL输入对话框
function openIconUrlDialog() {
  try {
    if (!iconUrlDialog) {
      console.error('找不到iconUrlDialog元素');
      return;
    }
    
    // 清空输入框
    if (iconUrlInput) {
      iconUrlInput.value = '';
    }
    
    // 显示对话框
    iconUrlDialog.style.display = 'block';
    iconUrlDialog.classList.add('show');
    
    // 添加回车键监听
    if (iconUrlInput) {
      // 移除之前的事件监听器，避免重复添加
      iconUrlInput.removeEventListener('keydown', handleIconUrlInputKeydown);
      // 添加新的事件监听器
      iconUrlInput.addEventListener('keydown', handleIconUrlInputKeydown);
    }
    
    // 聚焦输入框
    if (iconUrlInput) {
      setTimeout(() => {
        iconUrlInput.focus();
      }, 100);
    }
  } catch (error) {
    console.error('打开图标URL输入对话框失败:', error);
  }
}

// 处理图标URL输入框的回车键事件
function handleIconUrlInputKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const url = iconUrlInput.value.trim();
    if (url) {
      handleIconUrlInput(url);
    }
    closeIconUrlDialog();
  }
}

// 关闭图标URL输入对话框
function closeIconUrlDialog() {
  try {
    if (!iconUrlDialog) {
      console.error('找不到iconUrlDialog元素');
      return;
    }
    
    // 隐藏对话框
    iconUrlDialog.style.display = 'none';
    iconUrlDialog.classList.remove('show');
    
    // 移除回车键监听
    if (iconUrlInput) {
      iconUrlInput.removeEventListener('keydown', handleIconUrlInputKeydown);
    }
  } catch (error) {
    console.error('关闭图标URL输入对话框失败:', error);
  }
}

/**
 * 显示默认图标
 * @param {HTMLElement} container - 图标容器
 */
function showDefaultIcon(container) {
  const placeholder = document.createElement('div');
  placeholder.className = 'icon-placeholder';
  placeholder.innerHTML = '<i class="fas fa-image"></i>';
  container.appendChild(placeholder);
}

// 添加一个防抖函数，用于延迟执行图标加载
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// 修改URL输入事件处理
function setupUrlInputEvents() {
  // 获取所有URL输入框
  const urlInputs = document.querySelectorAll('.shortcut-url');
  
  urlInputs.forEach(input => {
    // 移除之前的事件监听器
    input.removeEventListener('input', handleUrlInput);
    input.removeEventListener('blur', handleUrlBlur);
    input.removeEventListener('keydown', handleUrlKeydown);
    
    // 添加新的事件监听器
    input.addEventListener('blur', handleUrlBlur);
    input.addEventListener('keydown', handleUrlKeydown);
  });
}

// 处理URL输入事件 - 添加这个函数的定义
function handleUrlInput(event) {
  // 这个函数实际上不需要做任何事情，因为我们不再在输入时实时验证
  // 保留这个函数只是为了在移除事件监听器时不报错
  console.log('URL输入中...');
}

// 处理URL输入框失去焦点事件
const handleUrlBlur = debounce(async function(event) {
  const input = event.target;
  const url = input.value.trim();
  
  if (url && url.length > 3) {
    // 尝试获取图标并更新预览
    try {
      const iconData = await tryLoadIconFromUrl(url);
      if (iconData && !shortcutIconInput.value) {
        // 只有在用户没有手动设置图标时才自动更新
        updateIconPreview(iconData);
        shortcutIconInput.value = iconData;
      }
    } catch (error) {
      console.warn('自动获取图标失败:', error);
    }
  }
}, 500);

// 处理URL输入框按键事件
function handleUrlKeydown(event) {
  // 如果按下回车键，触发失去焦点事件
  if (event.key === 'Enter') {
    event.preventDefault();
    event.target.blur();
  }
}

// 实时预览：尝试获取网站图标
async function tryLoadIconFromUrl(url) {
  try {
    // 验证URL格式
    if (!url || typeof url !== 'string') {
      console.warn('无效的URL:', url);
      return null;
    }
    
    // 检查URL是否为Chrome内部页面
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url === 'newtab') {
      console.warn('无法获取Chrome内部页面的图标:', url);
      return null;
    }
    
    // 移除URL中的空格和特殊字符
    url = url.trim();
    
    // 确保URL有协议前缀
    let urlWithProtocol = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlWithProtocol = 'https://' + url;
    }
    
    // 使用更宽松的URL验证
    let urlObj;
    try {
      urlObj = new URL(urlWithProtocol);
    } catch (e) {
      console.warn('无法构造URL对象:', urlWithProtocol, e);
      return null;
    }
    
    // 从URL中提取域名
    const domain = urlObj.hostname;
    
    // 检查域名是否有效
    if (!domain || domain === 'newtab' || domain.includes('chrome://') || domain.includes('chrome-extension://')) {
      console.warn('无效的域名或Chrome内部页面:', domain);
      return null;
    }
    
    // 不再尝试使用chrome://favicon/，直接尝试从网站获取favicon.ico
    try {
      const faviconUrl = `https://${domain}/favicon.ico`;
      console.log('尝试直接访问favicon.ico:', faviconUrl);
      const iconData = await loadImageAsBase64(faviconUrl);
      if (iconData) {
        console.log('成功从网站获取favicon.ico');
        return iconData;
      }
    } catch (error) {
      console.warn('直接访问favicon.ico失败:', error);
      // 继续尝试其他方法
    }
    
    // 使用Google的favicon服务
    try {
      console.log('使用Google的favicon服务获取图标');
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      return await loadImageAsBase64(googleFaviconUrl);
    } catch (error) {
      console.warn('从Google获取favicon失败:', error);
    }
    
    // 如果所有方法都失败，返回null
    return null;
  } catch (error) {
    console.error('获取网站图标失败:', error);
    return null;
  }
}

// 处理图标URL输入
async function handleIconUrlInput(url) {
  try {
    // 验证URL
    let finalUrl = url.trim();
    
    const isValidUrl = (url) => {
      // 使用更宽松的URL验证
      if (!url || url.length < 4) { // 至少需要类似 a.io 这样的最短域名
        return false;
      }
      
      // 如果不包含协议，添加https://
      let urlToCheck = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        urlToCheck = `https://${url}`;
      }
      
      try {
        new URL(urlToCheck);
        return true;
      } catch (e) {
        return false;
      }
    };
    
    // 如果URL不包含协议，添加https://
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }
    
    if (!isValidUrl(finalUrl)) {
      showNotification(t('invalid_url'), 'error');
      return;
    }
    
    // 显示加载中通知
    showNotification(t('loading_icon'));
    
    // 尝试加载图片
    try {
      // 不再尝试从Chrome缓存获取favicon，直接尝试加载URL
      let iconData = null;
      
      try {
        // 尝试直接加载URL
        iconData = await loadImageAsBase64(finalUrl);
      } catch (directError) {
        console.warn('直接加载图片失败:', directError);
      }
      
      // 如果直接加载失败，尝试获取网站默认图标
      if (!iconData) {
        iconData = await getDefaultIconFromUrl(finalUrl);
      }
      
      if (!iconData) {
        showNotification(t('icon_load_failed'), 'error');
        return;
      }
      
      // 打开图片编辑器
      openEditor(function(processedImageData) {
        console.log('图片处理完成，更新图标预览');
        // 更新图标预览
        updateIconPreview(processedImageData);
        
        // 更新隐藏输入框的值
        if (shortcutIconInput) {
          shortcutIconInput.value = processedImageData;
        } else {
          console.error('找不到shortcutIconInput元素');
        }
      }, iconData);
    } catch (error) {
      console.error('加载图标失败:', error);
      showNotification(t('icon_load_failed'), 'error');
    }
  } catch (error) {
    console.error('处理图标URL输入失败:', error);
    showNotification(t('icon_load_failed'), 'error');
  }
}

/**
 * 更新图标预览
 * @param {string} iconData - 图标数据（Base64或URL）
 */
function updateIconPreview(iconData) {
  console.log('更新图标预览:', iconData ? '有图标数据' : '无图标数据');
  
  // 获取图标预览元素
  const iconPreviewElement = document.getElementById('icon-preview');
  if (!iconPreviewElement) {
    console.error('找不到icon-preview元素');
    return;
  }
  
  // 清空预览区域
  while (iconPreviewElement.firstChild) {
    iconPreviewElement.removeChild(iconPreviewElement.firstChild);
  }
  
  // 添加title属性
  iconPreviewElement.setAttribute('title', t('icon_hint'));
  
  // 添加双击事件监听器
  iconPreviewElement.addEventListener('dblclick', () => {
    console.log('图标预览双击，打开图片编辑器');
    try {
      // 获取当前图标URL
      let currentIconUrl = '';
      
      // 检查图标预览中是否有图像
      const previewImg = iconPreviewElement.querySelector('img');
      if (previewImg && previewImg.src) {
        currentIconUrl = previewImg.src;
        console.log('从预览图像获取图标URL:', currentIconUrl);
      } else if (shortcutIconInput && shortcutIconInput.value) {
        currentIconUrl = shortcutIconInput.value;
        console.log('从输入框获取图标URL:', currentIconUrl);
      }
      
      // 确保URL是有效的
      if (!currentIconUrl || (!currentIconUrl.startsWith('data:') && !currentIconUrl.startsWith('http'))) {
        console.log('图标URL无效或为空，不传递到编辑器');
        currentIconUrl = '';
      }
      
      console.log('打开图片编辑器，传递图标URL:', currentIconUrl);
      
      // 直接使用回调函数处理编辑后的图像
      openEditor(function(processedImageData) {
        console.log('图片处理完成，更新图标预览');
        // 更新图标预览
        updateIconPreview(processedImageData);
        
        // 更新隐藏输入框的值
        if (shortcutIconInput) {
          shortcutIconInput.value = processedImageData;
        } else {
          console.error('找不到shortcutIconInput元素');
        }
      }, currentIconUrl);
    } catch (error) {
      console.error('打开图片编辑器失败:', error);
      showNotification(t('editor_open_failed'), 'error');
    }
  });
  
  if (iconData) {
    // 创建图片元素
    const img = document.createElement('img');
    img.src = iconData;
    img.alt = 'Icon';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    
    // 添加加载事件
    img.onload = () => {
      console.log('图标加载成功');
    };
    
    img.onerror = () => {
      console.error('图标加载失败:', iconData);
      // 显示默认图标
      showDefaultIcon(iconPreviewElement);
    };
    
    // 添加到预览区域
    iconPreviewElement.appendChild(img);
  } else {
    // 显示默认图标
    showDefaultIcon(iconPreviewElement);
  }
}

/**
 * 从URL加载图像为Base64
 * @param {string} url - 图像URL
 * @returns {Promise<string>} - 返回Base64编码的图像
 */
function loadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    // 检查URL是否为空或无效
    if (!url) {
      console.warn('URL为空，无法加载图像');
      reject(new Error('URL为空'));
      return;
    }
    
    // 特殊处理cleanpng.com的URL
    if (url.includes('cleanpng.com')) {
      console.log('检测到cleanpng.com的URL，尝试提取域名');
      try {
        // 尝试从URL中提取域名
        const match = url.match(/domain=([^&]+)/);
        if (match && match[1]) {
          const domain = match[1];
          console.log('从cleanpng.com的URL提取域名:', domain);
          // 使用Google的favicon服务
          const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
          
          const googleImg = new Image();
          googleImg.crossOrigin = 'Anonymous';
          
          // 设置超时
          const timeoutId = setTimeout(() => {
            console.warn('Google图标加载超时:', domain);
            reject(new Error('加载图像超时'));
          }, 5000);
          
          googleImg.onload = () => {
            clearTimeout(timeoutId);
            try {
              const canvas = document.createElement('canvas');
              canvas.width = googleImg.width || 64;
              canvas.height = googleImg.height || 64;
              
              const ctx = canvas.getContext('2d');
              ctx.drawImage(googleImg, 0, 0, canvas.width, canvas.height);
              
              const dataURL = canvas.toDataURL('image/png');
              resolve(dataURL);
            } catch (error) {
              console.error('转换Google图像失败:', error);
              reject(error);
            }
          };
          
          googleImg.onerror = () => {
            clearTimeout(timeoutId);
            console.warn('Google图标加载失败:', domain);
            // 使用默认图标
            createDefaultIcon(resolve);
          };
          
          googleImg.src = googleFaviconUrl;
          return;
        }
      } catch (e) {
        console.error('处理cleanpng.com的URL失败:', e);
      }
    }
    
    // 检查是否是跨域URL
    const isCrossDomain = url.indexOf('http') === 0 && !url.includes(location.host);
    
    // 设置超时
    const timeoutId = setTimeout(() => {
      console.warn('图片加载超时:', url);
      reject(new Error('加载图像超时'));
    }, 10000); // 10秒超时
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      clearTimeout(timeoutId);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 64; // 如果宽度为0，使用默认值
        canvas.height = img.height || 64; // 如果高度为0，使用默认值
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        try {
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (canvasError) {
          console.error('Canvas转换为DataURL失败:', canvasError);
          // 尝试使用备选方法
          createDefaultIcon(resolve);
        }
      } catch (error) {
        console.error('转换图像失败:', error);
        // 尝试使用备选方法
        createDefaultIcon(resolve);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeoutId);
      console.warn('图像加载失败:', url);
      
      // 如果是favicon请求，尝试使用Google的favicon服务
      if (url.includes('/favicon.ico')) {
        try {
          // 尝试从URL中提取域名
          let domain = '';
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
          
          if (domain) {
            console.log('尝试使用Google的favicon服务:', domain);
            const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            
            const googleImg = new Image();
            googleImg.crossOrigin = 'Anonymous';
            
            // 设置新的超时
            const newTimeoutId = setTimeout(() => {
              console.warn('Google图标加载超时');
              // 使用默认图标
              createDefaultIcon(resolve);
            }, 5000);
            
            googleImg.onload = () => {
              clearTimeout(newTimeoutId);
              try {
                const canvas = document.createElement('canvas');
                canvas.width = googleImg.width || 64;
                canvas.height = googleImg.height || 64;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(googleImg, 0, 0, canvas.width, canvas.height);
                
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
              } catch (error) {
                console.error('转换Google图像失败:', error);
                // 使用默认图标
                createDefaultIcon(resolve);
              }
            };
            
            googleImg.onerror = () => {
              clearTimeout(newTimeoutId);
              console.error('加载Google图标失败');
              // 使用默认图标
              createDefaultIcon(resolve);
            };
            
            googleImg.src = googleFaviconUrl;
            return;
          }
        } catch (e) {
          console.error('处理备选图标失败:', e);
        }
      }
      
      // 尝试使用Google的favicon服务
      try {
        // 尝试从URL中提取域名
        let domain = '';
        try {
          const urlObj = new URL(url);
          domain = urlObj.hostname;
        } catch (e) {
          // 尝试从URL字符串中提取域名
          const match = url.match(/https?:\/\/([^\/]+)/);
          if (match && match[1]) {
            domain = match[1];
          } else {
            // 如果无法提取域名，使用URL作为域名
            domain = url;
          }
        }
        
        if (domain) {
          console.log('尝试使用Google的favicon服务:', domain);
          const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
          
          const googleImg = new Image();
          googleImg.crossOrigin = 'Anonymous';
          
          // 设置新的超时
          const newTimeoutId = setTimeout(() => {
            console.warn('Google图标加载超时');
            // 使用默认图标
            createDefaultIcon(resolve);
          }, 5000);
          
          googleImg.onload = () => {
            clearTimeout(newTimeoutId);
            try {
              const canvas = document.createElement('canvas');
              canvas.width = googleImg.width || 64;
              canvas.height = googleImg.height || 64;
              
              const ctx = canvas.getContext('2d');
              ctx.drawImage(googleImg, 0, 0, canvas.width, canvas.height);
              
              const dataURL = canvas.toDataURL('image/png');
              resolve(dataURL);
            } catch (error) {
              console.error('转换Google图像失败:', error);
              // 使用默认图标
              createDefaultIcon(resolve);
            }
          };
          
          googleImg.onerror = () => {
            clearTimeout(newTimeoutId);
            console.error('加载Google图标失败');
            // 使用默认图标
            createDefaultIcon(resolve);
          };
          
          googleImg.src = googleFaviconUrl;
          return;
        }
      } catch (e) {
        console.error('处理备选图标失败:', e);
      }
      
      // 使用默认图标
      createDefaultIcon(resolve);
    };
    
    // 设置图片源
    try {
      img.src = url;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('设置图片源失败:', error);
      // 使用默认图标
      createDefaultIcon(resolve);
    }
  });
}

/**
 * 创建默认图标
 * @param {Function} resolve - Promise解析函数
 */
function createDefaultIcon(resolve) {
  try {
    // 创建一个canvas元素
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    // 获取2D上下文
    const ctx = canvas.getContext('2d');
    
    // 绘制一个圆形背景
    ctx.fillStyle = '#4285f4'; // Google蓝色
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制一个链接图标
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔗', 32, 32);
    
    // 转换为Base64
    const dataURL = canvas.toDataURL('image/png');
    resolve(dataURL);
  } catch (error) {
    console.error('创建默认图标失败:', error);
    // 如果创建默认图标失败，返回一个空白图标
    resolve('data:image/png;base64,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');
  }
}