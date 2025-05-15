# A11 Tabs

<p align="center">
  <img src="icons/icon128.png" alt="A11 Tabs Logo" width="128" height="128">
</p>

<p align="center">
  <b>A Beautiful and Practical Chrome New Tab Extension</b><br>
  <i>Custom backgrounds, multi-city time display, and flexible website shortcut management</i>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#user-guide">User Guide</a> •
  <a href="#data-management">Data Management</a> •
  <a href="#privacy">Privacy</a> •
  <a href="#development">Development</a> •
  <a href="#中文说明">中文说明</a>
</p>

## ✨ Key Features

### 🖼️ Custom Backgrounds
- Support for local image uploads or network image URLs
- High-quality background display, automatically adapting to different screen sizes
- Double-click anywhere on the page to change the background

### 🕒 Multi-City Time Display
- Simultaneously display time and date for multiple cities
- Support for 100+ global cities with search in both English and Chinese
- City list can be freely sorted and managed
- Trackpad swipe to switch between different cities (macOS)

### 🔗 Smart Website Shortcuts
- Support for multi-URL shortcuts, opening multiple related websites with one click
- Free drag-and-drop arrangement for complete custom layout
- Automatically fetch website icons or customize your own
- Click an icon to open the first URL in the current window, and remaining URLs in new windows

### 🎨 User Experience Optimization
- Clean and intuitive editing interface
- Edit confirmation prompts to prevent accidental loss of changes
- City indicator dots for easy switching between different cities
- Responsive design that adapts to different screen sizes

## 📥 Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore/category/extensions) (coming soon)
2. Search for "A11 Tabs"
3. Click "Add to Chrome" button

### Developer Mode Installation
1. Download the latest [release version](https://github.com/watertang/Desktop4Chrome/releases) of this repository
2. Unzip the downloaded ZIP file to a local folder
3. Open Chrome browser and go to the extensions management page: `chrome://extensions/`
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked extension"
6. Select the unzipped folder

## 🔍 User Guide

### Basic Usage
After installation, each time you open a new tab, you'll see the customized new tab interface with:
- Top: City time display area
- Middle: Website shortcuts area
- Bottom: Settings and edit buttons

### Edit Mode
Double-click anywhere on the page to enter edit mode. In edit mode, you can:

#### Background Settings
- Double-click the background area to open the background settings panel
- Upload local images or enter network image URLs
- Adjust background display methods (fill, fit, etc.)

#### City Management
- Double-click the city information area to open the city management panel
- Search and add global cities (supports both English and Chinese search)
- Drag to adjust city order
- Enable/disable city display
- Set default cities to display

#### Shortcut Management
- Click empty grid to add new shortcuts
- Double-click existing shortcuts to edit
- Drag shortcuts to adjust position
- Set shortcut name, icon, and multiple URLs
- Right-click shortcuts to delete or duplicate

## 💾 Data Management

### Export Data
- Click the "Export Data" button in edit mode
- The exported JSON file contains all settings and shortcut information
- Regular backups are recommended

### Import Data
- Click the "Import Data" button in edit mode
- Select a previously exported JSON file
- After confirming import, all settings will be restored

## 🔒 Privacy

A11 Tabs highly values user privacy:
- All data is stored locally using Chrome's storage.local API
- No personal information or usage data is collected
- No tracking or analytics code is included
- Network permissions are only used to load website icons and background images

## 💻 Development

### Tech Stack
- Pure native JavaScript with no dependency frameworks
- Chrome Extension Manifest V3
- Modular design for easy maintenance and extension

### Contribution Guidelines
Pull Requests and Issues are welcome to improve this project:
1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### License
This project is licensed under the MIT License - see the [LICENSE](LICENSE.txt) file for details

---

# 中文说明

<p align="center">
  <b>一款美观实用的Chrome新标签页扩展</b><br>
  <i>自定义背景、多城市时间显示、灵活的网址快捷方式管理</i>
</p>

## ✨ 主要功能

### 🖼️ 自定义背景
- 支持本地图片上传或网络图片URL
- 高质量背景展示，自动适应不同屏幕尺寸
- 双击页面空白处即可更换背景

### 🕒 多城市时间显示
- 同时展示多个城市的时间和日期
- 支持全球100+城市，支持中英文搜索
- 城市列表可自由排序和管理
- 触控板滑动切换不同城市（macOS）

### 🔗 智能网址快捷方式
- 支持多URL快捷方式，一键打开多个相关网站
- 自由拖拽排列，完全自定义布局
- 自动获取网站图标，也可自定义上传
- 点击图标在当前窗口打开第一个URL，其余URL在新窗口打开

### 🎨 用户体验优化
- 简洁直观的编辑界面
- 编辑确认提示，防止意外丢失修改
- 城市指示点显示，方便切换不同城市
- 响应式设计，适应不同屏幕尺寸

## 📥 安装方法

### 从Chrome Web Store安装
1. 访问[Chrome Web Store](https://chrome.google.com/webstore/category/extensions)（即将上线）
2. 搜索"A11 Tabs"
3. 点击"添加到Chrome"按钮

### 开发者模式安装
1. 下载本仓库的最新[发布版本](https://github.com/watertang/Desktop4Chrome/releases)
2. 解压下载的ZIP文件到本地文件夹
3. 打开Chrome浏览器，进入扩展管理页面：`chrome://extensions/`
4. 开启右上角的"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择解压后的文件夹

## 🔍 使用指南

### 基本使用
安装后，每次打开新标签页时，将显示自定义的新标签页界面，包含以下元素：
- 顶部：城市时间显示区域
- 中部：网址快捷方式区域
- 底部：设置和编辑按钮

### 编辑模式
双击页面任意位置进入编辑模式，在编辑模式下可以：

#### 背景设置
- 双击背景区域打开背景设置面板
- 可上传本地图片或输入网络图片URL
- 支持调整背景显示方式（填充、适应等）

#### 城市管理
- 双击城市信息区域打开城市管理面板
- 搜索并添加全球城市（支持中英文搜索）
- 拖拽调整城市顺序
- 启用/禁用城市显示
- 设置默认显示的城市

#### 快捷方式管理
- 点击空白网格添加新的快捷方式
- 双击已有快捷方式进行编辑
- 拖拽快捷方式调整位置
- 设置快捷方式的名称、图标和多个URL
- 右键快捷方式可删除或复制

## 💾 数据管理

### 导出数据
- 在编辑模式下点击底部的"导出数据"按钮
- 导出的JSON文件包含所有设置和快捷方式信息
- 建议定期导出备份数据

### 导入数据
- 在编辑模式下点击底部的"导入数据"按钮
- 选择之前导出的JSON文件
- 确认导入后，所有设置将被恢复

## 🔒 隐私说明

A11 Tabs 高度重视用户隐私：
- 所有数据仅存储在本地，使用Chrome的storage.local API
- 不收集任何个人信息或使用数据
- 不包含任何跟踪或分析代码
- 网络权限仅用于加载网站图标和背景图片

## 💻 开发信息

### 技术栈
- 纯原生JavaScript，无依赖框架
- Chrome Extension Manifest V3
- 模块化设计，易于维护和扩展

### 贡献指南
欢迎提交Pull Request或Issue来改进这个项目：
1. Fork本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m '添加一些很棒的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个Pull Request

### 许可证
本项目采用MIT许可证 - 详见 [LICENSE](LICENSE.txt) 文件

---

<p align="center">
  Made with ❤️ © 2024 Water Tang
</p> 