/**
 * PelvicFit Mini - 国际化模块
 * 支持中英文切换和本地化存储
 */

class I18n {
    constructor() {
        this.currentLang = 'zh'; // 默认语言
        this.translations = {};
        this.fallbackLang = 'zh';
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            // 从localStorage获取保存的语言设置
            const savedLang = localStorage.getItem('pelvicfit_language');
            if (savedLang) {
                this.currentLang = savedLang;
            } else {
                // 自动检测浏览器语言
                this.currentLang = this.detectBrowserLanguage();
            }

            // 加载语言文件
            await this.loadLanguage(this.currentLang);
            await this.loadLanguage(this.fallbackLang); // 加载回退语言
            
            // 标记初始化完成
            this.isInitialized = true;
            
            // 应用翻译
            this.applyTranslations();
            
            // 更新语言切换按钮
            this.updateLanguageButton();
            
            // 触发初始化完成事件
            window.dispatchEvent(new CustomEvent('i18nReady'));
            
        } catch (error) {
            console.error('i18n initialization failed:', error);
            // 设置为已初始化状态，使用默认文本
            this.isInitialized = true;
        }
    }

    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage || 'zh';
        
        // 支持的语言列表
        const supportedLangs = ['zh', 'en'];
        
        // 检查是否为中文变种
        if (browserLang.startsWith('zh')) {
            return 'zh';
        }
        
        // 检查是否为英文变种
        if (browserLang.startsWith('en')) {
            return 'en';
        }
        
        // 默认返回中文
        return 'zh';
    }

    async loadLanguage(lang) {
        if (this.translations[lang]) {
            return; // 已经加载过
        }

        try {
            console.log(`Loading language file: lang/${lang}.json`);
            const response = await fetch(`lang/${lang}.json`);
            if (response.ok) {
                this.translations[lang] = await response.json();
                console.log(`Language file loaded successfully: ${lang}`);
            } else {
                console.warn(`Failed to load language file: ${lang}.json (Status: ${response.status})`);
                if (lang !== this.fallbackLang && this.translations[this.fallbackLang]) {
                    // 如果不是回退语言，使用回退语言
                    this.translations[lang] = this.translations[this.fallbackLang];
                } else {
                    // 提供基本的回退翻译
                    this.translations[lang] = this.getBasicTranslations(lang);
                }
            }
        } catch (error) {
            console.error(`Error loading language file ${lang}:`, error);
            if (lang !== this.fallbackLang && this.translations[this.fallbackLang]) {
                this.translations[lang] = this.translations[this.fallbackLang];
            } else {
                this.translations[lang] = this.getBasicTranslations(lang);
            }
        }
    }

    // 提供基本翻译作为回退
    getBasicTranslations(lang) {
        const basicTranslations = {
            'zh': {
                'welcome': { 'title': '欢迎使用盆底肌训练', 'subtitle': '专业的盆底肌锻炼指导，帮助您改善健康' },
                'exercise': { 'prepare': '准备开始', 'ready': '准备就绪', 'start': '开始', 'pause': '暂停', 'stop': '停止' }
            },
            'en': {
                'welcome': { 'title': 'Welcome to Pelvic Floor Training', 'subtitle': 'Professional pelvic floor exercise guidance' },
                'exercise': { 'prepare': 'Get Ready', 'ready': 'Ready to Start', 'start': 'Start', 'pause': 'Pause', 'stop': 'Stop' }
            }
        };
        return basicTranslations[lang] || basicTranslations['en'];
    }

    // 获取翻译文本
    t(key, params = {}) {
        let value = this.getNestedValue(this.translations[this.currentLang], key);
        
        // 如果当前语言没有找到，尝试回退语言
        if (value === undefined && this.currentLang !== this.fallbackLang) {
            value = this.getNestedValue(this.translations[this.fallbackLang], key);
        }
        
        // 如果仍然没有找到，返回key本身
        if (value === undefined) {
            console.warn(`Translation missing for key: ${key}`);
            return key;
        }

        // 替换参数
        return this.replaceParams(value, params);
    }

    // 获取嵌套对象的值
    getNestedValue(obj, key) {
        return key.split('.').reduce((o, k) => o && o[k], obj);
    }

    // 替换参数占位符
    replaceParams(text, params) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    // 应用翻译到页面
    applyTranslations() {
        if (!this.isInitialized) {
            return;
        }

        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            // 只有在翻译不等于key时才应用（避免显示key）
            if (translation && translation !== key) {
                // 根据元素类型设置文本
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    if (element.type === 'submit' || element.type === 'button') {
                        element.value = translation;
                    } else {
                        element.placeholder = translation;
                    }
                } else {
                    element.textContent = translation;
                }
            }
        });

        // 更新HTML lang属性
        document.documentElement.lang = this.currentLang === 'zh' ? 'zh-CN' : 'en-US';
    }

    // 切换语言
    async switchLanguage(lang) {
        if (lang === this.currentLang || !this.isInitialized) {
            return;
        }

        this.currentLang = lang;
        
        // 保存到localStorage
        localStorage.setItem('pelvicfit_language', lang);
        
        // 加载新语言文件（如果尚未加载）
        await this.loadLanguage(lang);
        
        // 应用翻译
        this.applyTranslations();
        
        // 更新语言按钮
        this.updateLanguageButton();
        
        // 触发语言切换事件
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang }
        }));
    }

    // 更新语言切换按钮
    updateLanguageButton() {
        const langBtn = document.getElementById('lang-text');
        if (langBtn) {
            langBtn.textContent = this.currentLang === 'zh' ? 'EN' : '中';
        }
    }

    // 获取当前语言
    getCurrentLanguage() {
        return this.currentLang;
    }

    // 获取所有支持的语言
    getSupportedLanguages() {
        return Object.keys(this.translations);
    }

    // 格式化数字（考虑本地化）
    formatNumber(number) {
        if (this.currentLang === 'zh') {
            return number.toLocaleString('zh-CN');
        } else {
            return number.toLocaleString('en-US');
        }
    }

    // 格式化时间
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (this.currentLang === 'zh') {
            if (minutes > 0) {
                return `${minutes}分${remainingSeconds}秒`;
            } else {
                return `${remainingSeconds}秒`;
            }
        } else {
            if (minutes > 0) {
                return `${minutes}m ${remainingSeconds}s`;
            } else {
                return `${remainingSeconds}s`;
            }
        }
    }

    // 格式化日期
    formatDate(date) {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        const locale = this.currentLang === 'zh' ? 'zh-CN' : 'en-US';
        return date.toLocaleDateString(locale, options);
    }

    // 获取本地化的星期几
    getWeekday(dayIndex) {
        const weekdays = {
            'zh': ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
            'en': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        };
        
        return weekdays[this.currentLang][dayIndex] || weekdays['en'][dayIndex];
    }

    // 获取本地化的月份
    getMonth(monthIndex) {
        const months = {
            'zh': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
            'en': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        };
        
        return months[this.currentLang][monthIndex] || months['en'][monthIndex];
    }
}

// 创建全局实例
window.i18n = new I18n();