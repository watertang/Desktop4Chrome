/**
 * storage.js - 存储模块
 * 处理所有与Chrome存储相关的操作
 */

// 默认背景图片（仅作为备用）
export const DEFAULT_BACKGROUND = 'https://source.unsplash.com/random/1920x1080/?nature,water';

// 从initialization.json导入默认数据
let INITIALIZATION_DATA = null;

// 加载初始化数据
async function loadInitializationData() {
  if (INITIALIZATION_DATA) return INITIALIZATION_DATA;
  
  try {
    const response = await fetch('/initialization.json');
    if (!response.ok) {
      throw new Error(`加载初始化数据失败: ${response.status}`);
    }
    INITIALIZATION_DATA = await response.json();
    return INITIALIZATION_DATA;
  } catch (error) {
    console.error('加载初始化数据失败:', error);
    // 使用备用默认值（最小化）
    return {
      shortcuts: [],
      cities: [],
      displayedCityIndices: [0, 1],
      showWeather: true,
      backgroundUrl: DEFAULT_BACKGROUND
    };
  }
}

// 获取存储的数据
export function getStoredData(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => {
      resolve(result);
    });
  });
}

// 保存数据到存储
export function saveToStorage(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}

// 初始化存储
export async function initStorage() {
  const result = await getStoredData(['backgroundUrl', 'shortcuts', 'cities', 'displayedCityIndices', 'showWeather']);
  const initData = await loadInitializationData();
  
  // 初始化背景图片
  if (!result.backgroundUrl) {
    await saveToStorage({ backgroundUrl: initData.backgroundUrl || DEFAULT_BACKGROUND });
  }
  
  // 初始化快捷方式
  if (!result.shortcuts) {
    await saveToStorage({ shortcuts: initData.shortcuts || [] });
  }
  
  // 初始化城市数据
  if (!result.cities) {
    await saveToStorage({ cities: initData.cities || [] });
  }
  
  // 初始化显示的城市索引
  if (!result.displayedCityIndices) {
    await saveToStorage({ displayedCityIndices: initData.displayedCityIndices || [0, 1] });
  }
  
  // 初始化天气显示设置
  if (result.showWeather === undefined) {
    await saveToStorage({ showWeather: initData.showWeather !== undefined ? initData.showWeather : true });
  }
  
  return result;
}

// 导出数据
export async function exportAllData() {
  try {
    const data = await getStoredData([
      'shortcuts', 
      'backgroundUrl', 
      'cities', 
      'displayedCityIndices',
      'showWeather',
      'weatherCache',
      'lastUpdateTime'
    ]);
    
    const initData = await loadInitializationData();
    
    // 创建导出对象
    const exportData = {
      shortcuts: data.shortcuts || [],
      backgroundUrl: data.backgroundUrl || initData.backgroundUrl || DEFAULT_BACKGROUND,
      cities: data.cities || initData.cities || [],
      displayedCityIndices: data.displayedCityIndices || initData.displayedCityIndices || [0, 1],
      showWeather: data.showWeather !== undefined ? data.showWeather : true,
      weatherCache: data.weatherCache || {},
      lastUpdateTime: data.lastUpdateTime || {},
      version: '1.1'
    };
    
    // 转换为JSON字符串
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // 创建Blob对象
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    
    // 创建下载元素
    const a = document.createElement('a');
    a.href = url;
    a.download = 'desktop4chrome_backup_' + new Date().toISOString().slice(0, 10) + '.json';
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
    
    // 返回成功标志
    return true;
  } catch (error) {
    console.error('导出数据失败:', error);
    throw error; // 重新抛出错误，让调用者处理
  }
}

// 导入数据
export async function importData(jsonData) {
  try {
    // 解析JSON数据
    const data = JSON.parse(jsonData);
    const initData = await loadInitializationData();
    
    // 验证数据格式
    if (!data.shortcuts || !Array.isArray(data.shortcuts)) {
      throw new Error('无效的快捷方式数据');
    }
    
    // 保存数据到存储
    await saveToStorage({
      shortcuts: data.shortcuts,
      backgroundUrl: data.backgroundUrl || initData.backgroundUrl || DEFAULT_BACKGROUND,
      cities: data.cities || initData.cities || [],
      displayedCityIndices: data.displayedCityIndices || initData.displayedCityIndices || [0, 1],
      showWeather: data.showWeather !== undefined ? data.showWeather : true,
      weatherCache: data.weatherCache || {},
      lastUpdateTime: data.lastUpdateTime || {}
    });
    
    return true;
  } catch (error) {
    console.error('导入数据失败:', error);
    return false;
  }
} 