/**
 * dateTimeFormat.js - 日期和时间格式化模块
 * 包含所有与日期和时间格式化相关的功能
 */

import { showNotification } from './utils.js';

// 获取日期格式
export function getDateFormat() {
  try {
    return localStorage.getItem('dateFormat') || 'YYYY-MM-DD';
  } catch (error) {
    console.error('获取日期格式出错:', error);
    return 'YYYY-MM-DD';
  }
}

// 设置日期格式
export function setDateFormat(format) {
  try {
    localStorage.setItem('dateFormat', format);
    return true;
  } catch (error) {
    console.error('保存日期格式出错:', error);
    return false;
  }
}

// 获取时间格式
export function getTimeFormat() {
  try {
    return localStorage.getItem('timeFormat') || 'HH:mm';
  } catch (error) {
    console.error('获取时间格式出错:', error);
    return 'HH:mm';
  }
}

// 检查是否是24小时制
export function is24HourFormat() {
  const format = getTimeFormat();
  return !format.includes('a');
}

// 设置时间格式
export function setTimeFormat(format) {
  try {
    localStorage.setItem('timeFormat', format);
    return true;
  } catch (error) {
    console.error('保存时间格式出错:', error);
    return false;
  }
}

// 格式化日期
export function formatDate(date, options = {}) {
  try {
    const timeZone = options.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // 获取时区调整后的日期对象
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(part => part.type === 'year').value;
    const month = parts.find(part => part.type === 'month').value.padStart(2, '0');
    const day = parts.find(part => part.type === 'day').value.padStart(2, '0');
    
    // 获取日期格式
    const format = getDateFormat();
    
    // 月份名称映射（英文和中文）
    const monthNames = {
      '01': { en: 'Jan', zh: '一月' },
      '02': { en: 'Feb', zh: '二月' },
      '03': { en: 'Mar', zh: '三月' },
      '04': { en: 'Apr', zh: '四月' },
      '05': { en: 'May', zh: '五月' },
      '06': { en: 'Jun', zh: '六月' },
      '07': { en: 'Jul', zh: '七月' },
      '08': { en: 'Aug', zh: '八月' },
      '09': { en: 'Sep', zh: '九月' },
      '10': { en: 'Oct', zh: '十月' },
      '11': { en: 'Nov', zh: '十一月' },
      '12': { en: 'Dec', zh: '十二月' }
    };
    
    // 替换格式字符串
    let formattedDate = format;
    
    // 处理月份名称格式
    if (format.includes('MMM')) {
      formattedDate = formattedDate.replace('MMM', monthNames[month].zh);
    }
    
    // 替换其他格式
    formattedDate = formattedDate
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day);
    
    return formattedDate;
  } catch (error) {
    console.error('格式化日期出错:', error);
    return date.toLocaleDateString('zh-CN');
  }
}

// 格式化时间
export function formatTime(date, options = {}) {
  try {
    const timeZone = options.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // 获取时间格式
    const format = getTimeFormat();
    
    // 获取时间组件
    const hours = new Date(date).toLocaleTimeString('en-US', { ...options, hour: '2-digit', hour12: false }).slice(0, 2);
    const minutes = new Date(date).toLocaleTimeString('en-US', { ...options, minute: '2-digit', hour12: false }).slice(3, 5);
    const seconds = new Date(date).toLocaleTimeString('en-US', { ...options, second: '2-digit', hour12: false }).slice(6, 8);
    
    // 获取上午/下午
    const period = new Date(date).toLocaleTimeString('en-US', { ...options, hour12: true }).includes('PM') ? 'PM' : 'AM';
    
    // 12小时制小时
    let hours12 = parseInt(hours) % 12;
    hours12 = hours12 === 0 ? 12 : hours12;
    hours12 = hours12.toString().padStart(2, '0');
    
    // 替换格式字符串
    let formattedTime = format
      .replace('HH', hours.padStart(2, '0'))
      .replace('H', hours)
      .replace('hh', hours12)
      .replace('h', hours12.toString())
      .replace('mm', minutes)
      .replace('m', parseInt(minutes).toString())
      .replace('ss', seconds)
      .replace('s', parseInt(seconds).toString());
      
    // 添加AM/PM标记 - 使用纯文本
    if (format.includes('a')) {
      formattedTime = formattedTime.replace('a', period);
    }
    
    return formattedTime;
  } catch (error) {
    console.error('格式化时间出错:', error);
    return date.toLocaleTimeString('zh-CN');
  }
}

// 创建时间元素
export function createTimeElement(date, options = {}) {
  try {
    const timeElement = document.createElement('div');
    timeElement.className = 'time';
    
    // 获取当前时间格式
    const timeFormat = getTimeFormat();
    
    // 根据时区获取小时和分钟
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: options.timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: timeFormat.includes('a')
    });
    
    const parts = formatter.formatToParts(date);
    const hour = parts.find(part => part.type === 'hour').value;
    const minute = parts.find(part => part.type === 'minute').value;
    const dayPeriod = parts.find(part => part.type === 'dayPeriod')?.value || '';
    
    // 创建时间文本元素
    const timeTextElement = document.createElement('span');
    timeTextElement.textContent = `${hour}:${minute}`;
    timeElement.appendChild(timeTextElement);
    
    // 如果是12小时制，添加AM/PM标记
    if (timeFormat.includes('a')) {
      // 添加小的AM/PM标记
      const periodSpan = document.createElement('small');
      periodSpan.className = 'period';
      periodSpan.textContent = dayPeriod;
      timeElement.appendChild(periodSpan);
    }
    
    return timeElement;
  } catch (error) {
    console.error('创建时间元素出错:', error);
    const timeElement = document.createElement('div');
    timeElement.className = 'time';
    timeElement.textContent = new Date(date).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: options.timeZone
    });
    return timeElement;
  }
}

// 打开时间格式编辑器
export function openTimeFormatEditor(timeElement) {
  // 获取当前时间格式
  const currentFormat = getTimeFormat();
  
  // 直接切换格式
  let newFormat;
  if (currentFormat.includes('a')) {
    newFormat = 'HH:mm'; // 切换到24小时制
    console.log('切换到24小时制');
  } else {
    newFormat = 'hh:mm a'; // 切换到12小时制
    console.log('切换到12小时制');
  }
  
  console.log('切换时间格式:', currentFormat, '->', newFormat);
  
  // 保存新格式
  if (setTimeFormat(newFormat)) {
    // 更新body类
    updateTimeFormatClass();
    
    // 触发自定义事件，通知其他模块时间格式已更改
    const event = new CustomEvent('timeFormatChanged', { detail: { format: newFormat } });
    document.dispatchEvent(event);
    
    // 立即更新城市时间显示
    import('./cities.js')
      .then(module => {
        if (typeof module.updateDateTime === 'function') {
          module.updateDateTime();
        }
      })
      .catch(error => {
        console.error('导入cities.js模块出错:', error);
      });
    
    // 显示通知
    showNotification(newFormat === 'HH:mm' ? 'i18n:switched_to_24h' : 'i18n:switched_to_12h');
  } else {
    showNotification('i18n:time_format_switch_error');
  }
}

// 更新时间格式类
export function updateTimeFormatClass() {
  const is24Hour = is24HourFormat();
  console.log('当前时间格式:', is24Hour ? '24小时制' : '12小时制');
  
  // 检查body元素是否存在
  if (!document.body) {
    console.error('body元素不存在，无法应用时间格式类');
    return;
  }
  
  // 检查当前body上的类
  console.log('更新前body类列表:', document.body.classList.toString());
  
  if (is24Hour) {
    document.body.classList.add('format-24h');
    console.log('添加format-24h类');
  } else {
    document.body.classList.remove('format-24h');
    console.log('移除format-24h类');
  }
  
  // 检查更新后body上的类
  console.log('更新后body类列表:', document.body.classList.toString());
}

// 打开日期格式编辑器
export function openDateFormatEditor(dateElement) {
  // 获取当前日期格式
  const currentFormat = getDateFormat();
  
  // 获取预先定义的模态框
  let dialog = document.querySelector('.format-dialog');
  
  // 如果模态框不存在，动态创建一个
  if (!dialog) {
    console.log('日期格式模态框不存在，动态创建一个');
    
    dialog = document.createElement('div');
    dialog.className = 'format-dialog';
    dialog.style.display = 'none';
    
    // 使用国际化的方式创建模态框内容
    dialog.innerHTML = `
      <div class="format-dialog-content">
        <h3 data-i18n="date_format_title">Custom Date Format</h3>
        <div class="format-options">
          <div class="format-option" data-format="YYYY-MM-DD" data-i18n="date_format_ymd">Year-Month-Day (2023-01-31)</div>
          <div class="format-option" data-format="MM/DD/YYYY" data-i18n="date_format_mdy">Month/Day/Year (01/31/2023)</div>
          <div class="format-option" data-format="DD/MM/YYYY" data-i18n="date_format_dmy">Day/Month/Year (31/01/2023)</div>
          <div class="format-option" data-format="YYYY年MM月DD日" data-i18n="date_format_chinese">Chinese Format (2023年01月31日)</div>
          <div class="format-option" data-format="MMM DD, YYYY" data-i18n="date_format_english">English Format (Jan 31, 2023)</div>
          <div class="format-option" data-format="DD MMM YYYY" data-i18n="date_format_european">European Format (31 Jan 2023)</div>
        </div>
        <div class="format-buttons">
          <button class="cancel-format-btn" data-i18n="cancel">Cancel</button>
          <button class="save-format-btn" data-i18n="save">Save</button>
        </div>
      </div>
    `;
    
    // 应用国际化
    import('./i18n/index.js').then(module => {
      if (typeof module.applyI18nToHTML === 'function') {
        dialog.innerHTML = module.applyI18nToHTML(dialog.innerHTML);
      }
    }).catch(error => {
      console.error('导入i18n模块出错:', error);
    });
    
    // 添加到文档
    document.body.appendChild(dialog);
  }
  
  // 高亮当前选中的格式
  const options = dialog.querySelectorAll('.format-option');
  options.forEach(option => {
    // 移除所有选中状态
    option.classList.remove('selected');
    
    // 添加选中状态到当前格式
    if (option.getAttribute('data-format') === currentFormat) {
      option.classList.add('selected');
    }
    
    // 移除旧的点击事件监听器（如果有）
    const oldClickListener = option.getAttribute('data-click-listener');
    if (oldClickListener === 'true') {
      option.replaceWith(option.cloneNode(true));
    }
  });
  
  // 重新获取选项（因为可能已经被替换）
  const newOptions = dialog.querySelectorAll('.format-option');
  newOptions.forEach(option => {
    // 添加点击事件
    option.addEventListener('click', () => {
      // 移除所有选中状态
      newOptions.forEach(opt => opt.classList.remove('selected'));
      // 添加选中状态
      option.classList.add('selected');
    });
    
    // 标记已添加点击事件监听器
    option.setAttribute('data-click-listener', 'true');
  });
  
  // 获取按钮
  const cancelBtn = dialog.querySelector('.cancel-format-btn');
  const saveBtn = dialog.querySelector('.save-format-btn');
  
  // 移除旧的点击事件监听器（如果有）
  if (cancelBtn.getAttribute('data-click-listener') === 'true') {
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
  }
  if (saveBtn.getAttribute('data-click-listener') === 'true') {
    saveBtn.replaceWith(saveBtn.cloneNode(true));
  }
  
  // 重新获取按钮（因为可能已经被替换）
  const newCancelBtn = dialog.querySelector('.cancel-format-btn');
  const newSaveBtn = dialog.querySelector('.save-format-btn');
  
  // 添加取消按钮事件
  newCancelBtn.addEventListener('click', () => {
    dialog.style.display = 'none';
  });
  newCancelBtn.setAttribute('data-click-listener', 'true');
  
  // 添加保存按钮事件
  newSaveBtn.addEventListener('click', () => {
    // 获取选中的格式
    const selectedOption = dialog.querySelector('.format-option.selected');
    if (selectedOption) {
      const newFormat = selectedOption.getAttribute('data-format');
      
      // 保存新格式
      if (setDateFormat(newFormat)) {
        // 触发自定义事件，通知其他模块日期格式已更改
        const event = new CustomEvent('dateFormatChanged', { detail: { format: newFormat } });
        document.dispatchEvent(event);
        
        // 立即更新城市日期显示
        import('./cities.js')
          .then(module => {
            if (typeof module.updateDateTime === 'function') {
              module.updateDateTime();
            }
          })
          .catch(error => {
            console.error('导入cities.js模块出错:', error);
          });
        
        showNotification('i18n:date_format_updated');
      } else {
        showNotification('i18n:date_format_save_error');
      }
    }
    
    // 隐藏对话框
    dialog.style.display = 'none';
  });
  newSaveBtn.setAttribute('data-click-listener', 'true');
  
  // 显示模态框
  dialog.style.display = 'block';
} 