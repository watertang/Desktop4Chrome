# Ada&Ava Desktop for Chrome

<p align="center">
  <img src="icons/icon128.png" alt="Ada&Ava Desktop Logo" width="128" height="128">
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
  <a href="#development">Development</a>
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
2. Search for "Ada&Ava Desktop for Chrome"
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

Ada&Ava Desktop for Chrome highly values user privacy:
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

<p align="center">
  Made with ❤️ © 2024
</p> 