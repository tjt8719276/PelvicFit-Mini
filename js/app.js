/**
 * PelvicFit Mini - 主应用入口
 * 应用初始化和全局事件管理
 */

class App {
    constructor() {
        this.version = '1.0.0';
        this.isReady = false;
        this.modules = {};
        
        this.init();
    }

    async init() {
        try {
            console.log(`PelvicFit Mini v${this.version} initializing...`);
            
            // 等待DOM加载完成
            await this.waitForDOM();
            
            // 初始化所有模块
            await this.initializeModules();
            
            // 设置全局事件监听
            this.setupGlobalEventListeners();
            
            // 应用准备就绪
            this.isReady = true;
            
            console.log('PelvicFit Mini initialized successfully');
            
            // 触发应用就绪事件
            this.dispatchEvent('appReady');
            
        } catch (error) {
            console.error('Failed to initialize PelvicFit Mini:', error);
            this.handleInitializationError(error);
        }
    }

    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    async initializeModules() {
        const moduleLoadPromises = [];
        
        // 等待核心模块初始化
        if (window.i18n) {
            moduleLoadPromises.push(this.waitForModule('i18n'));
            this.modules.i18n = window.i18n;
        }
        
        if (window.storage) {
            this.modules.storage = window.storage;
        }
        
        if (window.exercise) {
            this.modules.exercise = window.exercise;
        }
        
        if (window.ui) {
            this.modules.ui = window.ui;
        }
        
        // 等待所有模块就绪
        await Promise.all(moduleLoadPromises);
        
        // 验证模块完整性
        this.validateModules();
    }

    waitForModule(moduleName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkModule = () => {
                if (Date.now() - startTime > timeout) {
                    reject(new Error(`Module ${moduleName} initialization timeout`));
                    return;
                }
                
                if (this.isModuleReady(moduleName)) {
                    resolve();
                } else {
                    setTimeout(checkModule, 100);
                }
            };
            
            checkModule();
        });
    }

    isModuleReady(moduleName) {
        switch (moduleName) {
            case 'i18n':
                return window.i18n && window.i18n.currentLang;
            case 'storage':
                return window.storage && window.storage.get('initialized');
            case 'exercise':
                return window.exercise && window.exercise.plans;
            case 'ui':
                return window.ui && window.ui.isInitialized;
            default:
                return true;
        }
    }

    validateModules() {
        const requiredModules = ['i18n', 'storage', 'exercise', 'ui'];
        const missingModules = [];
        
        requiredModules.forEach(moduleName => {
            if (!this.modules[moduleName]) {
                missingModules.push(moduleName);
            }
        });
        
        if (missingModules.length > 0) {
            throw new Error(`Missing required modules: ${missingModules.join(', ')}`);
        }
        
        console.log('All modules validated successfully');
    }

    setupGlobalEventListeners() {
        // 应用生命周期事件
        window.addEventListener('beforeunload', this.onBeforeUnload.bind(this));
        window.addEventListener('unload', this.onUnload.bind(this));
        
        // 网络状态监听
        window.addEventListener('online', this.onOnline.bind(this));
        window.addEventListener('offline', this.onOffline.bind(this));
        
        // 错误处理
        window.addEventListener('error', this.onError.bind(this));
        window.addEventListener('unhandledrejection', this.onUnhandledRejection.bind(this));
        
        // 设备方向变化
        window.addEventListener('orientationchange', this.onOrientationChange.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));
        
        // 应用可见性变化
        document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
        
        // 键盘事件（用于快捷键）
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        
        // 触摸设备手势
        this.setupTouchGestures();
        
        // PWA相关事件
        this.setupPWAEventListeners();
    }

    setupTouchGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            if (!e.changedTouches.length) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // 检测滑动手势
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    // 向右滑动
                    this.onSwipeRight();
                } else {
                    // 向左滑动
                    this.onSwipeLeft();
                }
            } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
                if (deltaY > 0) {
                    // 向下滑动
                    this.onSwipeDown();
                } else {
                    // 向上滑动
                    this.onSwipeUp();
                }
            }
        });
    }

    setupPWAEventListeners() {
        // Service Worker 更新检测
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', this.onServiceWorkerMessage.bind(this));
        }
        
        // PWA 安装提示
        window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt.bind(this));
        
        // PWA 安装完成
        window.addEventListener('appinstalled', this.onAppInstalled.bind(this));
    }

    // 事件处理方法
    onBeforeUnload(event) {
        // 如果正在锻炼，提醒用户
        if (this.modules.exercise && this.modules.exercise.isActive) {
            const message = this.modules.i18n ? 
                this.modules.i18n.t('dialog.exercise_incomplete.message') : 
                '训练尚未完成，确定要离开吗？';
            event.preventDefault();
            event.returnValue = message;
            return message;
        }
    }

    onUnload() {
        // 保存应用状态
        this.saveAppState();
    }

    onOnline() {
        console.log('App is online');
        this.showConnectionStatus(true);
    }

    onOffline() {
        console.log('App is offline');
        this.showConnectionStatus(false);
    }

    onError(event) {
        console.error('Global error:', event.error);
        this.handleError(event.error, 'JavaScript Error');
    }

    onUnhandledRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        this.handleError(event.reason, 'Unhandled Promise Rejection');
    }

    onOrientationChange() {
        setTimeout(() => {
            this.handleOrientationChange();
        }, 100);
    }

    onResize() {
        this.handleResize();
    }

    onVisibilityChange() {
        if (document.hidden) {
            this.onAppHidden();
        } else {
            this.onAppVisible();
        }
    }

    onKeyDown(event) {
        // 全局快捷键
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'k': // Ctrl/Cmd + K - 开始/暂停锻炼
                    event.preventDefault();
                    this.toggleExercise();
                    break;
                case 'l': // Ctrl/Cmd + L - 切换语言
                    event.preventDefault();
                    this.toggleLanguage();
                    break;
                case 'h': // Ctrl/Cmd + H - 回到主页
                    event.preventDefault();
                    this.goHome();
                    break;
            }
        }
        
        // Escape 键处理
        if (event.key === 'Escape') {
            this.handleEscape();
        }
    }

    // 手势处理
    onSwipeLeft() {
        // 向左滑动 - 下一页
        if (this.modules.ui) {
            const pages = ['home', 'plans', 'stats', 'settings'];
            const currentIndex = pages.indexOf(this.modules.ui.currentPage);
            if (currentIndex < pages.length - 1) {
                this.modules.ui.navigateTo(pages[currentIndex + 1]);
            }
        }
    }

    onSwipeRight() {
        // 向右滑动 - 上一页或返回
        if (this.modules.ui) {
            if (this.modules.ui.currentPage !== 'home') {
                this.modules.ui.goBack();
            }
        }
    }

    onSwipeDown() {
        // 向下滑动 - 刷新当前页面数据
        this.refreshCurrentPage();
    }

    onSwipeUp() {
        // 向上滑动 - 返回顶部或显示更多选项
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // PWA 事件处理
    onServiceWorkerMessage(event) {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
            this.showUpdateNotification();
        }
    }

    onBeforeInstallPrompt(event) {
        event.preventDefault();
        this.deferredPrompt = event;
        this.showInstallPrompt();
    }

    onAppInstalled() {
        console.log('PWA installed successfully');
        this.showToast('应用已成功安装到设备', 3000);
        this.deferredPrompt = null;
    }

    // 应用状态管理
    onAppHidden() {
        // 应用被隐藏时暂停计时器（如果在锻炼中）
        if (this.modules.exercise && this.modules.exercise.isActive && !this.modules.exercise.isPaused) {
            this.modules.exercise.pause();
            this.backgroundPaused = true;
        }
    }

    onAppVisible() {
        // 应用重新显示时恢复（如果之前被暂停）
        if (this.backgroundPaused && this.modules.exercise && this.modules.exercise.isPaused) {
            // 询问用户是否继续训练
            if (this.modules.ui) {
                this.modules.ui.showDialog(
                    '继续训练',
                    '检测到训练被暂停，是否继续？',
                    () => {
                        this.modules.exercise.resume();
                        this.backgroundPaused = false;
                    },
                    () => {
                        this.backgroundPaused = false;
                    }
                );
            }
        }
    }

    saveAppState() {
        if (!this.modules.storage) return;
        
        const appState = {
            currentPage: this.modules.ui ? this.modules.ui.currentPage : 'home',
            lastActive: Date.now(),
            version: this.version
        };
        
        this.modules.storage.set('appState', appState);
    }

    restoreAppState() {
        if (!this.modules.storage) return;
        
        const appState = this.modules.storage.get('appState');
        if (appState && this.modules.ui) {
            // 恢复到上次的页面（除了锻炼页面）
            if (appState.currentPage && appState.currentPage !== 'exercise') {
                this.modules.ui.navigateTo(appState.currentPage);
            }
        }
    }

    // 实用方法
    toggleExercise() {
        if (!this.modules.exercise || !this.modules.ui) return;
        
        if (this.modules.exercise.isActive) {
            if (this.modules.exercise.isPaused) {
                this.modules.exercise.resume();
            } else {
                this.modules.exercise.pause();
            }
        } else {
            // 导航到训练页面并开始默认训练
            this.modules.ui.navigateTo('plans');
        }
    }

    toggleLanguage() {
        if (this.modules.i18n) {
            const currentLang = this.modules.i18n.getCurrentLanguage();
            const newLang = currentLang === 'zh' ? 'en' : 'zh';
            this.modules.i18n.switchLanguage(newLang);
        }
    }

    goHome() {
        if (this.modules.ui) {
            this.modules.ui.navigateTo('home');
        }
    }

    handleEscape() {
        // 关闭对话框或返回上一页
        if (this.modules.ui) {
            const dialog = document.getElementById('confirm-dialog');
            if (dialog && dialog.style.display !== 'none') {
                this.modules.ui.hideDialog();
            } else {
                this.modules.ui.goBack();
            }
        }
    }

    refreshCurrentPage() {
        if (this.modules.ui) {
            this.modules.ui.onPageChange(this.modules.ui.currentPage);
            this.showToast('页面已刷新', 1500);
        }
    }

    // UI辅助方法
    showConnectionStatus(isOnline) {
        const message = isOnline ? '网络已连接' : '离线模式';
        const icon = isOnline ? '🌐' : '📴';
        this.showToast(`${icon} ${message}`, 2000);
    }

    showUpdateNotification() {
        if (this.modules.ui) {
            this.modules.ui.showDialog(
                '应用更新',
                '发现新版本，是否立即更新？',
                () => {
                    window.location.reload();
                }
            );
        }
    }

    showInstallPrompt() {
        if (this.modules.ui && this.deferredPrompt) {
            this.modules.ui.showDialog(
                '安装应用',
                '将PelvicFit Mini添加到主屏幕，获得更好的使用体验？',
                async () => {
                    this.deferredPrompt.prompt();
                    const { outcome } = await this.deferredPrompt.userChoice;
                    console.log('Install prompt outcome:', outcome);
                    this.deferredPrompt = null;
                }
            );
        }
    }

    showToast(message, duration = 3000) {
        if (this.modules.ui) {
            this.modules.ui.showToast(message, duration);
        } else {
            console.log('Toast:', message);
        }
    }

    // 错误处理
    handleInitializationError(error) {
        console.error('Initialization error:', error);
        
        // 显示错误页面
        document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center; background: #f5f5f5;">
                <h2 style="color: #d32f2f; margin-bottom: 16px;">😔 应用初始化失败</h2>
                <p style="color: #666; margin-bottom: 24px;">抱歉，应用启动时遇到了问题。</p>
                <button onclick="window.location.reload()" style="padding: 12px 24px; background: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    重新加载
                </button>
            </div>
        `;
    }

    handleError(error, type = 'Unknown Error') {
        console.error(`${type}:`, error);
        
        // 在开发环境显示错误详情，生产环境只显示友好消息
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.showToast(`错误: ${error.message}`, 5000);
        } else {
            this.showToast('遇到了一个小问题，请稍后重试', 3000);
        }
    }

    handleOrientationChange() {
        // 重新调整布局
        if (this.modules.ui) {
            this.modules.ui.updateUI();
        }
        
        // 通知用户方向变化（如果需要）
        const orientation = window.orientation;
        if (orientation === 90 || orientation === -90) {
            // 横屏模式
            this.onLandscapeMode();
        } else {
            // 竖屏模式
            this.onPortraitMode();
        }
    }

    handleResize() {
        // 调整图表和布局
        if (this.modules.ui && this.modules.ui.chartInstance) {
            this.modules.ui.renderChart();
        }
    }

    onLandscapeMode() {
        // 横屏优化
        document.body.classList.add('landscape-mode');
    }

    onPortraitMode() {
        // 竖屏优化
        document.body.classList.remove('landscape-mode');
    }

    // 公共API
    dispatchEvent(eventName, data = {}) {
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }

    getModule(moduleName) {
        return this.modules[moduleName];
    }

    getVersion() {
        return this.version;
    }

    isAppReady() {
        return this.isReady;
    }

    // 开发工具（仅在开发环境可用）
    getDebugInfo() {
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            return null;
        }
        
        return {
            version: this.version,
            isReady: this.isReady,
            modules: Object.keys(this.modules),
            currentPage: this.modules.ui ? this.modules.ui.currentPage : null,
            exerciseState: this.modules.exercise ? this.modules.exercise.getState() : null,
            storageSize: this.modules.storage ? this.modules.storage.formatStorageSize() : null
        };
    }
}

// 创建应用实例
window.app = new App();

// 导出到全局作用域（用于控制台调试）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.PelvicFitMini = {
        app: window.app,
        i18n: () => window.i18n,
        storage: () => window.storage,
        exercise: () => window.exercise,
        ui: () => window.ui,
        debug: () => window.app.getDebugInfo()
    };
    
    console.log('PelvicFit Mini 开发工具已加载。输入 PelvicFitMini.debug() 查看调试信息。');
}