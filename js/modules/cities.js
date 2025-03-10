/**
 * cities.js - 城市模块
 * 处理城市和时间相关的功能
 */

import { showNotification } from './utils.js';
import { getStoredData, saveToStorage } from './storage.js';
import { updateCityWeatherDisplay } from './weather.js';
import { formatDate, formatTime, createTimeElement, openTimeFormatEditor, openDateFormatEditor } from './dateTimeFormat.js';
import { getCityWeather } from './weather.js';
import { t, applyI18nToHTML } from './i18n/index.js';

// 城市相关变量
let cities = []; // 城市列表
let displayedCityIndices = [0, 1]; // 当前显示的城市索引
let cityDragSource = -1; // 城市拖拽源索引
let originalCities = []; // 用于保存原始城市列表，用于检测修改
let originalAutoLocation = false; // 用于保存原始自动定位设置，用于检测修改
let showWeather = true; // 是否显示天气
let isEditMode = false; // 是否处于编辑模式

// 城市相关DOM元素
let citiesDisplay;
let cityMenu;
let cityEditModal;
let cityForm;
let autoLocationSwitch;
let citiesContainer;
let newCityInput;
let addCityBtn;
let citySearchResults;
let cityCancelBtn;
let citySaveBtn;

// 初始化城市模块
export async function initCities() {
  try {
    console.log('初始化城市模块...');
    
    // 初始化DOM元素
    initCityDOMElements();
    
    // 加载城市数据
    await loadCityData();
    
    try {
      // 设置事件监听器
      setupCityEventListeners();
    } catch (eventError) {
      console.error('设置事件监听器失败，但将继续初始化其他部分:', eventError);
      // 显示错误通知，但不中断整个初始化过程
      showNotification('部分功能可能不可用: ' + eventError.message);
    }
    
    // 检查是否有足够的城市数据
    if (!cities || cities.length === 0 || !cities.some(city => city.enabled)) {
      console.log('没有城市数据或没有启用的城市，添加默认城市');
      // 添加默认城市
      if (!cities) cities = [];
      if (!cities.some(city => city.name === '北京')) {
        cities.push({
          id: 'beijing',
          name: '北京',
          timezone: 'Asia/Shanghai',
          enabled: true
        });
      }
      displayedCityIndices = [0];
      await saveToStorage({ cities, displayedCityIndices });
    }
    
    // 渲染城市列表 - 但不显示编辑模态框
    if (cityEditModal) {
      cityEditModal.style.display = 'none';
    }
    
    // 渲染城市显示
    renderCities();
    
    // 更新日期和时间
    updateDateTime();
    
    // 设置定时器，每分钟更新一次时间
    setInterval(updateDateTime, 60000);
    
    // 监听编辑模式变化
    citiesDisplay.addEventListener('editModeChanged', function(e) {
      console.log('城市模块接收到编辑模式变化:', e.detail.isEditMode);
      isEditMode = e.detail.isEditMode;
    });
    
    console.log('城市模块初始化完成');
    return true;
  } catch (error) {
    console.error('初始化城市模块出错:', error);
    
    // 尝试恢复到最小功能状态
    try {
      // 确保至少有一个城市可以显示
      if (!cities || cities.length === 0) {
        cities = [
          {
            id: 'default',
            name: '北京',
            timezone: 'Asia/Shanghai',
            enabled: true
          }
        ];
        displayedCityIndices = [0];
        
        // 尝试渲染城市
        renderCities();
        updateDateTime();
      }
    } catch (recoveryError) {
      console.error('恢复到最小功能状态失败:', recoveryError);
    }
    
    showNotification('初始化城市模块时出错: ' + error.message);
    return false;
  }
}

// 初始化城市相关DOM元素
function initCityDOMElements() {
  citiesDisplay = document.getElementById('cities-display');
  
  // 城市编辑模态框
  cityEditModal = document.querySelector('.city-edit-modal');
  if (cityEditModal) {
    // 确保模态框默认隐藏
    cityEditModal.style.display = 'none';
  }
  
  cityForm = document.getElementById('city-form');
  citiesContainer = document.getElementById('cities-container');
  newCityInput = document.getElementById('new-city');
  addCityBtn = document.getElementById('add-city-btn');
  citySearchResults = document.getElementById('city-search-results');
  cityCancelBtn = document.querySelector('.city-cancel-btn');
  citySaveBtn = document.querySelector('.city-save-btn');
  
  // 检查并记录DOM元素状态
  console.log('DOM元素初始化状态:', {
    citiesDisplay: !!citiesDisplay,
    cityEditModal: !!cityEditModal,
    cityForm: !!cityForm,
    citiesContainer: !!citiesContainer,
    newCityInput: !!newCityInput,
    addCityBtn: !!addCityBtn,
    citySearchResults: !!citySearchResults,
    cityCancelBtn: !!cityCancelBtn,
    citySaveBtn: !!citySaveBtn
  });
}

// 加载城市数据
async function loadCityData() {
  const result = await getStoredData(['cities', 'displayedCityIndices']);
  
  if (result.cities) {
    cities = result.cities;
  }
  
  if (result.displayedCityIndices) {
    displayedCityIndices = result.displayedCityIndices;
  }
  
  // 始终显示天气
  showWeather = true;
  
  // 渲染城市信息
  renderCities();
}

// 设置城市相关事件监听
function setupCityEventListeners() {
  try {
    // 检查必要的DOM元素是否存在
    if (!citiesDisplay) {
      throw new Error('城市显示区域元素不存在');
    }
    
    // 城市显示区域点击事件
    citiesDisplay.addEventListener('click', handleCityDisplayClick);
    
    // 监听编辑模式变化
    document.body.addEventListener('editModeChange', function(e) {
      isEditMode = e.detail.isEditMode;
      
      // 更新城市显示区域的可点击状态
      if (isEditMode) {
        citiesDisplay.classList.add('edit-mode');
      } else {
        citiesDisplay.classList.remove('edit-mode');
      }
    });
    
    // 注意：Esc键处理由core.js统一处理
    
    // 监听城市编辑事件
    citiesDisplay.addEventListener('cityEdit', function(e) {
      console.log('接收到城市编辑事件');
      openCityEditModal();
    });
    
    // 城市表单提交事件
    if (cityForm) {
      cityForm.addEventListener('submit', handleCityFormSubmit);
    } else {
      console.warn('城市表单元素不存在，跳过事件绑定');
    }
    
    // 添加城市按钮点击事件
    if (addCityBtn) {
      addCityBtn.addEventListener('click', handleAddCityClick);
    } else {
      console.warn('添加城市按钮不存在，跳过事件绑定');
    }
    
    // 新城市输入框输入事件
    if (newCityInput) {
      newCityInput.addEventListener('input', handleNewCityInput);
    } else {
      console.warn('新城市输入框不存在，跳过事件绑定');
    }
    
    // 取消按钮点击事件
    if (cityCancelBtn) {
      cityCancelBtn.addEventListener('click', () => {
        cityEditModal.style.display = 'none';
      });
    } else {
      console.warn('取消按钮不存在，跳过事件绑定');
    }
    
    // 保存按钮点击事件
    if (citySaveBtn) {
      citySaveBtn.addEventListener('click', handleCityFormSubmit);
    } else {
      console.warn('保存按钮不存在，跳过事件绑定');
    }
    
    console.log('城市事件监听器设置完成');
  } catch (error) {
    console.error('设置城市事件监听器出错:', error);
    throw error; // 重新抛出错误，让调用者知道出了问题
  }
}

// 处理城市显示区域点击事件
function handleCityDisplayClick(event) {
  try {
    console.log('城市显示区域点击事件触发');
    
    // 不执行任何操作，由双击事件处理
    console.log('城市显示区域点击事件，不执行任何操作');
    
  } catch (error) {
    console.error('处理城市显示区域点击事件出错:', error);
  }
}

// 渲染城市菜单
function renderCityMenu() {
  cityMenu.innerHTML = `
    <div class="city-menu-item" data-action="edit">
      <i class="fas fa-edit"></i> 编辑城市列表
    </div>
  `;
}

// 处理城市菜单点击事件
function handleCityMenuClick(event) {
  try {
    const menuItem = event.target.closest('.city-menu-item');
    if (!menuItem) return;
    
    const action = menuItem.dataset.action;
    console.log('城市菜单点击事件:', action);
    
    // 立即关闭菜单
    if (cityMenu) {
      cityMenu.style.display = 'none';
    }
    
    // 阻止事件冒泡，防止触发document的click事件
    event.stopPropagation();
    
    // 延迟执行操作，确保菜单已关闭
    setTimeout(() => {
      if (action === 'edit') {
        // 确保其他模态框都是关闭的
        const otherModals = document.querySelectorAll('.edit-modal, .format-dialog');
        otherModals.forEach(modal => {
          modal.style.display = 'none';
        });
        
        // 打开城市编辑模态框
        openCityEditModal();
      }
    }, 10);
  } catch (error) {
    console.error('处理城市菜单点击事件出错:', error);
  }
}

// 打开城市编辑模态框
function openCityEditModal() {
  try {
    // 检查模态框是否存在
    if (!cityEditModal) {
      console.error('城市编辑模态框不存在');
      showNotification('无法打开城市编辑模态框');
      return;
    }
    
    // 保存原始城市列表，用于检测修改
    originalCities = JSON.parse(JSON.stringify(cities));
    
    // 渲染城市列表
    renderCityList();
    
    // 显示模态框
    cityEditModal.style.display = 'block';
    
    console.log('城市编辑模态框已打开');
  } catch (error) {
    console.error('打开城市编辑模态框出错:', error);
    showNotification('打开城市编辑模态框失败');
  }
}

// 渲染城市列表
function renderCityList() {
  // 检查必要的DOM元素是否存在
  if (!citiesContainer) {
    console.error('城市列表容器不存在');
    return;
  }
  
  // 清空城市列表
  citiesContainer.innerHTML = '';
  
  // 渲染城市列表
  cities.forEach((city, index) => {
    const cityItem = document.createElement('div');
    cityItem.className = 'city-item';
    cityItem.draggable = true;
    cityItem.dataset.cityId = city.id;
    cityItem.dataset.cityIndex = index;
    
    cityItem.innerHTML = `
      <div class="drag-handle">
        <i class="fas fa-grip-lines"></i>
      </div>
      <div class="city-name">${city.name}</div>
      <div class="city-controls">
        <label class="switch">
          <input type="checkbox" ${city.enabled ? 'checked' : ''}>
          <span class="slider round"></span>
        </label>
        <button type="button" class="delete-city-btn">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    // 添加拖拽事件
    cityItem.addEventListener('dragstart', handleCityDragStart);
    cityItem.addEventListener('dragover', handleCityDragOver);
    cityItem.addEventListener('drop', handleCityDrop);
    cityItem.addEventListener('dragend', handleCityDragEnd);
    
    // 添加删除按钮事件
    const deleteBtn = cityItem.querySelector('.delete-city-btn');
    deleteBtn.addEventListener('click', () => {
      cities.splice(index, 1);
      renderCityList();
    });
    
    // 添加开关事件
    const checkbox = cityItem.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      cities[index].enabled = checkbox.checked;
    });
    
    citiesContainer.appendChild(cityItem);
  });
  
  console.log('城市列表渲染完成，共', cities.length, '个城市');
}

// 处理城市拖拽开始
function handleCityDragStart(event) {
  cityDragSource = parseInt(event.currentTarget.dataset.cityIndex);
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', cityDragSource);
  event.currentTarget.classList.add('dragging');
}

// 处理城市拖拽经过
function handleCityDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  
  const target = event.currentTarget;
  const targetIndex = parseInt(target.dataset.cityIndex);
  
  if (targetIndex !== cityDragSource) {
    target.classList.add('drag-over');
  }
}

// 处理城市拖拽放置
function handleCityDrop(event) {
  event.preventDefault();
  
  const target = event.currentTarget;
  const targetIndex = parseInt(target.dataset.cityIndex);
  
  if (targetIndex !== cityDragSource && cityDragSource !== -1) {
    // 移动城市
    const [movedCity] = cities.splice(cityDragSource, 1);
    cities.splice(targetIndex, 0, movedCity);
    
    // 更新显示的城市索引
    displayedCityIndices = displayedCityIndices.map(index => {
      if (index === cityDragSource) {
        return targetIndex;
      } else if (index > cityDragSource && index <= targetIndex) {
        return index - 1;
      } else if (index < cityDragSource && index >= targetIndex) {
        return index + 1;
      }
      return index;
    });
    
    // 重新渲染城市列表
    renderCityList();
  }
  
  target.classList.remove('drag-over');
}

// 处理城市拖拽结束
function handleCityDragEnd(event) {
  event.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.city-item').forEach(item => {
    item.classList.remove('drag-over');
  });
  cityDragSource = -1;
}

// 处理添加城市按钮点击事件
function handleAddCityClick() {
  const cityName = newCityInput.value.trim();
  if (!cityName) return;
  
  // 添加城市
  addCity(cityName);
  
  // 清空输入框
  newCityInput.value = '';
  citySearchResults.innerHTML = '';
}

// 处理新城市输入事件
function handleNewCityInput() {
  const query = newCityInput.value.trim();
  if (!query) {
    citySearchResults.innerHTML = '';
    return;
  }
  
  // 搜索城市
  searchCities(query);
}

// 搜索城市
function searchCities(query) {
  // 这里可以接入实际的城市搜索API
  // 目前使用模拟数据
  const results = [
    { id: 'beijing', name: '北京', timezone: 'Asia/Shanghai' },
    { id: 'shanghai', name: '上海', timezone: 'Asia/Shanghai' },
    { id: 'guangzhou', name: '广州', timezone: 'Asia/Shanghai' },
    { id: 'shenzhen', name: '深圳', timezone: 'Asia/Shanghai' },
    { id: 'hongkong', name: '香港', timezone: 'Asia/Hong_Kong' },
    { id: 'taipei', name: '台北', timezone: 'Asia/Taipei' },
    { id: 'tokyo', name: '东京', timezone: 'Asia/Tokyo' },
    { id: 'seoul', name: '首尔', timezone: 'Asia/Seoul' },
    { id: 'singapore', name: '新加坡', timezone: 'Asia/Singapore' },
    { id: 'newyork', name: '纽约', timezone: 'America/New_York' },
    { id: 'losangeles', name: '洛杉矶', timezone: 'America/Los_Angeles' },
    { id: 'vancouver', name: '温哥华', timezone: 'America/Vancouver' },
    { id: 'toronto', name: '多伦多', timezone: 'America/Toronto' },
    { id: 'london', name: '伦敦', timezone: 'Europe/London' },
    { id: 'paris', name: '巴黎', timezone: 'Europe/Paris' },
    { id: 'berlin', name: '柏林', timezone: 'Europe/Berlin' },
    { id: 'moscow', name: '莫斯科', timezone: 'Europe/Moscow' },
    { id: 'sydney', name: '悉尼', timezone: 'Australia/Sydney' }
  ].filter(city => 
    city.name.toLowerCase().includes(query.toLowerCase()) ||
    city.id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);
  
  // 渲染搜索结果
  renderCitySearchResults(results, query);
}

// 渲染城市搜索结果
function renderCitySearchResults(results, query) {
  citySearchResults.innerHTML = '';
  
  if (results.length === 0) {
    // 如果没有找到匹配的城市，直接显示时区选择器
    const html = `
      <div class="custom-city-option">
        <div class="custom-city-title" data-i18n="custom_city">自定义城市</div>
        <div class="custom-city-name" data-i18n="custom_city_name">城市名称</div>
        <div class="timezone-selector">
          <label for="timezone-select" data-i18n="timezone">时区</label>
          <select id="timezone-select" data-i18n-title="select_timezone">
            <option value="Asia/Shanghai">亚洲/上海 (UTC+8)</option>
            <option value="Asia/Hong_Kong">亚洲/香港 (UTC+8)</option>
            <option value="Asia/Tokyo">亚洲/东京 (UTC+9)</option>
            <option value="Asia/Seoul">亚洲/首尔 (UTC+9)</option>
            <option value="Asia/Singapore">亚洲/新加坡 (UTC+8)</option>
            <option value="Europe/London">欧洲/伦敦 (UTC+0/+1)</option>
            <option value="Europe/Paris">欧洲/巴黎 (UTC+1/+2)</option>
            <option value="Europe/Berlin">欧洲/柏林 (UTC+1/+2)</option>
            <option value="America/New_York">美洲/纽约 (UTC-5/-4)</option>
            <option value="America/Los_Angeles">美洲/洛杉矶 (UTC-8/-7)</option>
            <option value="Australia/Sydney">澳洲/悉尼 (UTC+10/+11)</option>
          </select>
        </div>
        <button id="add-custom-city-btn" class="add-custom-city-btn" data-i18n="add">添加</button>
      </div>
    `;
    
    // 应用国际化
    citySearchResults.innerHTML = applyI18nToHTML(html);
    
    // 添加自定义城市按钮事件
    const timezoneSelect = document.getElementById('timezone-select');
    const addCustomCityBtn = document.getElementById('add-custom-city-btn');
    
    // 添加自定义城市按钮事件
    addCustomCityBtn.addEventListener('click', function() {
      // 获取选择的时区
      const timezone = timezoneSelect.value;
      
      // 添加城市
      addCity(query, null, timezone);
      newCityInput.value = '';
      citySearchResults.innerHTML = '';
    });
    
    return;
  }
  
  // 显示搜索结果
  results.forEach(city => {
    const resultItem = document.createElement('div');
    resultItem.className = 'search-result-item';
    resultItem.textContent = city.name;
    resultItem.addEventListener('click', () => {
      addCity(city.name, city.id);
      newCityInput.value = '';
      citySearchResults.innerHTML = '';
    });
    citySearchResults.appendChild(resultItem);
  });
}

// 添加城市
function addCity(name, id, timezone) {
  // 如果没有提供ID，使用名称生成ID
  if (!id) {
    id = name.toLowerCase().replace(/\s+/g, '');
  }
  
  // 如果没有提供时区，使用默认时区
  if (!timezone) {
    timezone = 'Asia/Shanghai';
  }
  
  // 检查城市是否已存在
  const existingCity = cities.find(city => city.id === id);
  if (existingCity) {
    showNotification('城市已存在');
    return;
  }
  
  // 添加城市
  cities.push({
    id,
    name,
    timezone,
    enabled: true
  });
  
  // 重新渲染城市列表
  renderCityList();
}

// 处理城市表单提交
function handleCityFormSubmit(event) {
  event.preventDefault();
  
  // 保存城市列表
  saveCityList().then(() => {
    // 关闭模态框
    cityEditModal.style.display = 'none';
    
    // 刷新主页的城市显示
    renderCities();
    
    // 更新所有城市的天气
    import('./weather.js')
      .then(module => {
        if (typeof module.updateAllWeather === 'function') {
          module.updateAllWeather();
        }
      })
      .catch(error => {
        console.error('导入weather.js模块出错:', error);
      });
  });
}

// 保存城市列表
async function saveCityList() {
  try {
    // 检查是否有修改
    if (JSON.stringify(cities) === JSON.stringify(originalCities)) {
      return;
    }
    
    console.log('保存城市列表:', cities);
    
    // 保存城市列表
    await saveToStorage({ cities });
    
    // 更新显示的城市索引
    const enabledCities = cities.filter(city => city.enabled);
    if (enabledCities.length > 0) {
      // 确保显示的城市索引有效
      displayedCityIndices = displayedCityIndices.filter(index => 
        index < cities.length && cities[index] && cities[index].enabled
      );
      
      // 如果没有有效的显示城市索引，使用第一个启用的城市
      if (displayedCityIndices.length === 0) {
        const firstEnabledIndex = cities.findIndex(city => city.enabled);
        if (firstEnabledIndex !== -1) {
          displayedCityIndices = [firstEnabledIndex];
        }
      }
      
      // 保存显示的城市索引
      await saveToStorage({ displayedCityIndices });
    }
    
    // 显示成功通知
    showNotification('城市列表已保存');
  } catch (error) {
    console.error('保存城市列表出错:', error);
    showNotification('保存城市列表失败: ' + error.message);
  }
}

// 渲染城市信息
export function renderCities() {
  // 清空城市显示区域
  citiesDisplay.innerHTML = '';
  
  // 获取所有启用的城市
  const enabledCities = cities.filter(city => city.enabled);
  
  // 获取要显示的城市
  const displayedCities = displayedCityIndices
    .map(index => cities[index])
    .filter(city => city && city.enabled);
  
  // 最多显示两个城市
  const citiesToShow = displayedCities.slice(0, 2);
  
  // 创建城市信息容器
  const citiesInfoContainer = document.createElement('div');
  citiesInfoContainer.className = 'cities-info-container';
  
  // 渲染城市信息
  citiesToShow.forEach((city, index) => {
    const cityElement = document.createElement('div');
    cityElement.className = 'fixed-info';
    cityElement.dataset.cityId = city.id;
    
    // 根据索引决定布局方式（左侧或右侧）
    const isLeftCity = index === 0;
    
    // 创建上部容器（时间和天气）
    const topContainer = document.createElement('div');
    topContainer.className = 'top-container';
    
    // 创建时间元素
    const timeElement = document.createElement('div');
    timeElement.className = 'time';
    
    // 添加时间到上部容器
    topContainer.appendChild(timeElement);
    
    // 创建下部容器（城市名和日期）
    const bottomContainer = document.createElement('div');
    bottomContainer.className = 'bottom-container';
    
    // 创建城市日期行
    const cityDateRow = document.createElement('div');
    cityDateRow.className = 'city-date-row';
    
    // 创建城市名元素
    const cityNameElement = document.createElement('span');
    cityNameElement.className = 'city';
    cityNameElement.textContent = city.name;
    
    // 创建日期元素
    const dateElement = document.createElement('span');
    dateElement.className = 'date-text';
    
    // 添加城市名和日期到城市日期行
    cityDateRow.appendChild(cityNameElement);
    cityDateRow.appendChild(document.createTextNode(' '));
    cityDateRow.appendChild(dateElement);
    
    // 添加城市日期行到下部容器
    bottomContainer.appendChild(cityDateRow);
    
    // 添加上部和下部容器到城市元素
    cityElement.appendChild(topContainer);
    cityElement.appendChild(bottomContainer);
    
    citiesInfoContainer.appendChild(cityElement);
    
    // 如果启用了天气显示，添加天气信息
    if (showWeather) {
      // 异步更新天气信息，并指定位置
      updateCityWeatherDisplay(city.name, topContainer, isLeftCity);
    }
  });
  
  // 将城市信息容器添加到城市显示区域
  citiesDisplay.appendChild(citiesInfoContainer);
  
  // 创建指示点容器
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'city-dots';
  
  // 为每个启用的城市创建一个指示点
  enabledCities.forEach((city, idx) => {
    const dot = document.createElement('div');
    dot.className = 'city-dot';
    dot.dataset.cityIndex = cities.findIndex(c => c.id === city.id);
    
    // 如果是当前显示的城市，添加active类
    if (displayedCityIndices.includes(parseInt(dot.dataset.cityIndex))) {
      dot.classList.add('active');
    }
    
    // 点击指示点切换城市
    dot.addEventListener('click', () => {
      const cityIndex = parseInt(dot.dataset.cityIndex);
      
      // 如果已经显示，则移除
      const existingIndex = displayedCityIndices.indexOf(cityIndex);
      if (existingIndex !== -1) {
        // 至少保留一个城市
        if (displayedCityIndices.length > 1) {
          displayedCityIndices.splice(existingIndex, 1);
        }
      } else {
        // 如果已经显示两个城市，替换第二个
        if (displayedCityIndices.length >= 2) {
          displayedCityIndices[1] = cityIndex;
        } else {
          // 否则添加到显示列表
          displayedCityIndices.push(cityIndex);
        }
      }
      
      // 保存显示的城市索引
      saveToStorage({ displayedCityIndices });
      
      // 重新渲染城市信息
      renderCities();
    });
    
    dotsContainer.appendChild(dot);
  });
  
  // 将指示点容器添加到城市显示区域
  citiesDisplay.appendChild(dotsContainer);
  
  // 立即更新日期时间
  updateDateTime();
}

// 更新日期时间
export function updateDateTime() {
  // 获取要显示的城市
  const displayedCities = displayedCityIndices
    .map(index => cities[index])
    .filter(city => city && city.enabled);
  
  console.log('更新日期时间，显示的城市:', displayedCities);
  
  // 更新每个城市的日期时间
  displayedCities.forEach(city => {
    const cityElement = document.querySelector(`.fixed-info[data-city-id="${city.id}"]`);
    if (!cityElement) return;
    
    // 获取城市的当前时间
    const now = new Date();
    
    // 更新时间
    const timeContainer = cityElement.querySelector('.time');
    if (timeContainer) {
      try {
        // 清空时间元素
        timeContainer.innerHTML = '';
        
        // 创建新的时间元素
        const newTimeElement = createTimeElement(now, { timeZone: city.timezone });
        
        // 将新元素的内容复制到现有容器
        while (newTimeElement.firstChild) {
          timeContainer.appendChild(newTimeElement.firstChild);
        }
      } catch (error) {
        console.error('更新时间出错:', error);
        timeContainer.textContent = new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: city.timezone
        });
      }
    }
    
    // 更新日期
    const dateElement = cityElement.querySelector('.date-text');
    if (dateElement) {
      try {
        dateElement.textContent = formatDate(now, { timeZone: city.timezone });
      } catch (error) {
        console.error('格式化日期出错:', error);
        dateElement.textContent = now.toLocaleDateString('zh-CN', {
          timeZone: city.timezone
        });
      }
    }
  });
}

// 注意：openTimeFormatEditor 和 openDateFormatEditor 函数已移至 dateTimeFormat.js 模块
// 这些函数仍然可以通过导入使用，但代码定义已经移除 