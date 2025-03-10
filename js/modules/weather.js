/**
 * weather.js - 天气模块
 * 处理天气数据获取和显示
 */

import { getStoredData, saveToStorage } from './storage.js';
import { showNotification } from './utils.js';

// 天气数据缓存
let weatherCache = {};
// 上次更新时间
let lastUpdateTime = {};
// 更新间隔（毫秒）- 2小时
const UPDATE_INTERVAL = 2 * 60 * 60 * 1000;

/**
 * 初始化天气模块
 */
export async function initWeather() {
  // 加载缓存的天气数据
  await loadWeatherCache();
  
  // 设置定时更新
  setInterval(updateAllWeather, UPDATE_INTERVAL);
}

/**
 * 加载缓存的天气数据
 */
async function loadWeatherCache() {
  const data = await getStoredData(['weatherCache', 'lastUpdateTime']);
  
  if (data.weatherCache) {
    weatherCache = data.weatherCache;
  }
  
  if (data.lastUpdateTime) {
    lastUpdateTime = data.lastUpdateTime;
  }
}

/**
 * 获取城市天气
 * @param {string} cityName - 城市名称
 * @param {boolean} forceUpdate - 是否强制更新
 * @returns {Promise<Object>} - 天气数据
 */
export async function getCityWeather(cityName, forceUpdate = false) {
  // 检查缓存
  if (!forceUpdate && weatherCache[cityName]) {
    const lastUpdate = lastUpdateTime[cityName] || 0;
    const now = Date.now();
    
    // 如果缓存未过期，直接返回缓存数据
    if (now - lastUpdate < UPDATE_INTERVAL) {
      return weatherCache[cityName];
    }
  }
  
  try {
    // 获取新的天气数据
    const weatherData = await fetchWeatherData(cityName);
    
    // 更新缓存
    weatherCache[cityName] = weatherData;
    lastUpdateTime[cityName] = Date.now();
    
    // 保存到存储
    await saveToStorage({
      weatherCache: weatherCache,
      lastUpdateTime: lastUpdateTime
    });
    
    return weatherData;
  } catch (error) {
    console.error('获取天气数据失败:', error);
    
    // 如果有缓存，返回缓存数据
    if (weatherCache[cityName]) {
      return weatherCache[cityName];
    }
    
    // 否则返回默认数据
    return {
      temperature: '--',
      condition: '未知',
      icon: 'question',
      error: true
    };
  }
}

/**
 * 更新所有城市的天气
 */
export async function updateAllWeather() {
  // 获取所有需要更新的城市
  const cities = Object.keys(weatherCache);
  
  for (const city of cities) {
    try {
      await getCityWeather(city, true);
    } catch (error) {
      console.error(`更新${city}天气失败:`, error);
    }
  }
}

/**
 * 从API获取天气数据
 * @param {string} cityName - 城市名称
 * @returns {Promise<Object>} - 天气数据
 */
async function fetchWeatherData(cityName) {
  // 这里使用OpenWeatherMap API作为示例
  // 实际使用时需要注册并获取API密钥
  // 免费计划每分钟可以调用60次，足够我们使用
  const API_KEY = ''; // 需要填入实际的API密钥
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&units=metric&lang=zh_cn&appid=${API_KEY}`;
  
  // 如果没有API密钥，使用模拟数据
  if (!API_KEY) {
    return getMockWeatherData(cityName);
  }
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`天气API返回错误: ${response.status}`);
  }
  
  const data = await response.json();
  
  // 解析API返回的数据
  return {
    temperature: Math.round(data.main.temp),
    condition: data.weather[0].description,
    icon: data.weather[0].icon,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    cityName: data.name
  };
}

/**
 * 获取模拟天气数据（当没有API密钥时使用）
 * @param {string} cityName - 城市名称
 * @returns {Object} - 模拟的天气数据
 */
function getMockWeatherData(cityName) {
  // 已知城市列表
  const knownCities = [
    '北京', '上海', '广州', '深圳', '香港', '台北', '东京', '首尔', '新加坡', 
    '纽约', '洛杉矶', '温哥华', '多伦多', '伦敦', '巴黎', '柏林', '莫斯科', '悉尼',
    'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'hongkong', 'taipei', 'tokyo', 
    'seoul', 'singapore', 'newyork', 'losangeles', 'vancouver', 'toronto', 'london', 
    'paris', 'berlin', 'moscow', 'sydney'
  ];
  
  // 检查城市是否在已知列表中
  const normalizedCityName = cityName.toLowerCase().replace(/\s+/g, '');
  const isKnownCity = knownCities.some(city => 
    city.toLowerCase().replace(/\s+/g, '') === normalizedCityName
  );
  
  // 如果不是已知城市，返回错误
  if (!isKnownCity) {
    return {
      temperature: null,
      condition: '未知城市',
      iconClass: 'question',
      error: true
    };
  }
  
  // 根据城市名称的哈希值生成一个伪随机数
  const hash = cityName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rand = hash % 100;
  
  // 根据伪随机数生成温度（10-35度）
  const temperature = 10 + (rand % 26);
  
  // 天气状况
  const conditions = ['晴朗', '多云', '阴天', '小雨', '大雨', '雷雨', '小雪', '大雪'];
  const condition = conditions[rand % conditions.length];
  
  // 天气图标
  let iconClass = 'sun';
  switch (rand % 8) {
    case 0: iconClass = 'sun'; break;
    case 1: iconClass = 'cloud-sun'; break;
    case 2: iconClass = 'cloud'; break;
    case 3: iconClass = 'cloud-rain'; break;
    case 4: iconClass = 'cloud-showers-heavy'; break;
    case 5: iconClass = 'bolt'; break;
    case 6: iconClass = 'snowflake'; break;
    case 7: iconClass = 'smog'; break;
  }
  
  return {
    temperature,
    condition,
    iconClass,
    humidity: 30 + (rand % 60),
    windSpeed: 1 + (rand % 10),
    cityName
  };
}

/**
 * 创建天气显示元素
 * @param {Object} weatherData - 天气数据
 * @returns {HTMLElement} - 天气显示元素
 */
export function createWeatherElement(weatherData) {
  const weatherElement = document.createElement('div');
  weatherElement.className = 'weather-info';
  
  // 如果有错误，显示简化版本
  if (weatherData.error) {
    weatherElement.innerHTML = `
      <div class="weather-icon">
        <i class="fas fa-question-circle"></i>
      </div>
      <div class="weather-temp">--°C</div>
    `;
    return weatherElement;
  }
  
  // 根据天气状况选择图标
  let iconClass = 'sun';
  switch (weatherData.icon) {
    case '01d': iconClass = 'sun'; break; // 晴天（白天）
    case '01n': iconClass = 'moon'; break; // 晴天（夜间）
    case '02d': iconClass = 'cloud-sun'; break; // 少云（白天）
    case '02n': iconClass = 'cloud-moon'; break; // 少云（夜间）
    case '03d':
    case '03n':
    case '04d':
    case '04n': iconClass = 'cloud'; break; // 多云
    case '09d':
    case '09n': iconClass = 'cloud-rain'; break; // 小雨
    case '10d': iconClass = 'cloud-sun-rain'; break; // 雨（白天）
    case '10n': iconClass = 'cloud-moon-rain'; break; // 雨（夜间）
    case '11d':
    case '11n': iconClass = 'bolt'; break; // 雷雨
    case '13d':
    case '13n': iconClass = 'snowflake'; break; // 雪
    case '50d':
    case '50n': iconClass = 'smog'; break; // 雾
    default: iconClass = weatherData.icon || 'sun'; // 使用传入的图标或默认值
  }
  
  // 创建天气显示HTML
  weatherElement.innerHTML = `
    <div class="weather-icon">
      <i class="fas fa-${iconClass}"></i>
    </div>
    <div class="weather-temp">${weatherData.temperature}°C</div>
  `;
  
  return weatherElement;
}

/**
 * 更新城市天气显示
 * @param {string} cityName - 城市名称
 * @param {HTMLElement} container - 容器元素
 * @param {boolean} isLeftCity - 是否为左侧城市
 */
export async function updateCityWeatherDisplay(cityName, container, isLeftCity = false) {
  try {
    // 获取天气数据
    const weatherData = await getCityWeather(cityName);
    
    // 如果获取天气数据出错或没有数据，隐藏天气信息
    if (weatherData.error || !weatherData.temperature) {
      console.log(`城市 ${cityName} 的天气数据获取失败或不完整，隐藏天气信息`);
      // 移除现有的天气元素
      const existingWeatherElement = container.querySelector('.weather-info');
      if (existingWeatherElement) {
        existingWeatherElement.remove();
      }
      return;
    }
    
    // 创建或更新天气元素
    let weatherElement = container.querySelector('.weather-info');
    if (!weatherElement) {
      weatherElement = createWeatherElement(weatherData);
      
      // 根据位置决定添加到容器的位置
      if (isLeftCity) {
        // 左侧城市：天气放在左边
        container.insertBefore(weatherElement, container.firstChild);
      } else {
        // 右侧城市：天气放在右边
        container.appendChild(weatherElement);
      }
    } else {
      // 更新现有天气元素
      weatherElement.innerHTML = `
        <div class="weather-icon">
          <i class="fas fa-${weatherData.iconClass || iconClass}"></i>
        </div>
        <div class="weather-temp">${weatherData.temperature}°C</div>
      `;
    }
  } catch (error) {
    console.error(`更新城市 ${cityName} 的天气显示时出错:`, error);
    // 出错时也隐藏天气信息
    const existingWeatherElement = container.querySelector('.weather-info');
    if (existingWeatherElement) {
      existingWeatherElement.remove();
    }
  }
} 