/**
 * background.js - 后台服务工作线程
 * 处理扩展的后台任务和消息传递
 */

// 监听来自popup或内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('后台脚本收到消息:', message);
  
  // 处理语言更改消息
  if (message.action === 'changeLanguage') {
    console.log('处理语言更改消息:', message.language);
    
    // 向所有标签页广播语言更改消息
    chrome.tabs.query({}, (tabs) => {
      console.log('找到标签页数量:', tabs.length);
      
      let messagesSent = 0;
      
      tabs.forEach((tab) => {
        // 只向我们的新标签页发送消息
        if (tab.url && tab.url.includes('chrome://newtab')) {
          console.log('向标签页发送消息:', tab.id, tab.url);
          
          try {
            chrome.tabs.sendMessage(tab.id, {
              action: 'changeLanguage',
              language: message.language
            }).then(() => {
              console.log('消息发送成功:', tab.id);
              messagesSent++;
            }).catch((error) => {
              // 忽略错误，可能是因为标签页还没有加载完成
              console.log('无法向标签页发送消息:', tab.id, error);
            });
          } catch (error) {
            console.error('发送消息时出错:', error);
          }
        } else {
          console.log('跳过非新标签页:', tab.id, tab.url);
        }
      });
      
      console.log('消息发送完成，成功发送:', messagesSent);
    });
    
    // 返回成功响应
    sendResponse({ success: true, message: '语言更改消息已处理' });
    return true; // 保持消息通道开放
  }
  
  // 处理获取图片请求
  if (message.action === 'fetchImage') {
    fetchImage(message.url)
      .then(dataUrl => {
        sendResponse({ success: true, dataUrl: dataUrl });
      })
      .catch(error => {
        console.error('获取图片失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // 返回true表示将异步发送响应
    return true;
  }
  
  return false;
});

// 安装或更新扩展时的处理
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('扩展已安装');
  } else if (details.reason === 'update') {
    console.log('扩展已更新到版本:', chrome.runtime.getManifest().version);
  }
});

/**
 * 获取图片并转换为Data URL
 * @param {string} url - 图片URL
 * @returns {Promise<string>} - 返回图片的Data URL
 */
async function fetchImage(url) {
  try {
    // 使用fetch API获取图片
    const response = await fetch(url, { 
      method: 'GET',
      // 不要使用no-cors模式，因为它会导致无法读取响应内容
      credentials: 'omit',
      headers: {
        'Origin': chrome.runtime.getURL('/')
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 将响应转换为Blob
    const blob = await response.blob();
    
    // 将Blob转换为Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('获取图片失败:', error);
    throw error;
  }
} 