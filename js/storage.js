/**
 * PelvicFit Mini - 数据存储模块
 * 本地数据管理，完全匿名存储
 */

class Storage {
    constructor() {
        this.prefix = 'pelvicfit_';
        this.version = '1.0.0';
        this.init();
    }

    init() {
        // 检查是否为首次使用
        if (!this.get('initialized')) {
            this.initializeData();
        }

        // 检查数据版本并迁移（如果需要）
        this.checkVersion();
    }

    // 初始化默认数据
    initializeData() {
        const defaultSettings = {
            language: 'zh',
            soundEnabled: true,
            vibrationEnabled: true,
            reminderTime: '09:00',
            reminderEnabled: false
        };

        const defaultStats = {
            totalSessions: 0,
            totalDuration: 0, // 总时长（秒）
            currentStreak: 0, // 当前连续天数
            maxStreak: 0, // 最长连续天数
            achievements: [],
            firstSessionDate: null,
            lastSessionDate: null
        };

        this.set('settings', defaultSettings);
        this.set('stats', defaultStats);
        this.set('sessions', []);
        this.set('initialized', true);
        this.set('version', this.version);
    }

    // 检查版本并执行数据迁移
    checkVersion() {
        const storedVersion = this.get('version');
        if (storedVersion !== this.version) {
            this.migrateData(storedVersion, this.version);
            this.set('version', this.version);
        }
    }

    // 数据迁移（未来版本使用）
    migrateData(fromVersion, toVersion) {
        console.log(`Migrating data from ${fromVersion} to ${toVersion}`);
        // 这里实现数据迁移逻辑
    }

    // 通用存储方法
    set(key, value) {
        try {
            const fullKey = this.prefix + key;
            const data = {
                value: value,
                timestamp: Date.now()
            };
            localStorage.setItem(fullKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    // 通用读取方法
    get(key, defaultValue = null) {
        try {
            const fullKey = this.prefix + key;
            const data = localStorage.getItem(fullKey);
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.value;
            }
            return defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    // 删除数据
    remove(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    // 清除所有数据
    clear() {
        try {
            const keys = Object.keys(localStorage).filter(key => 
                key.startsWith(this.prefix)
            );
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    // === 设置相关方法 ===

    getSettings() {
        return this.get('settings', {});
    }

    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        return this.set('settings', updatedSettings);
    }

    getSetting(key, defaultValue = null) {
        const settings = this.getSettings();
        return settings[key] !== undefined ? settings[key] : defaultValue;
    }

    setSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        return this.set('settings', settings);
    }

    // === 训练记录相关方法 ===

    // 保存训练记录
    saveSession(sessionData) {
        const sessions = this.getSessions();
        const session = {
            id: this.generateId(),
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            timestamp: Date.now(),
            plan: sessionData.plan || 'custom',
            duration: sessionData.duration || 0, // 秒
            contractTime: sessionData.contractTime || 3,
            relaxTime: sessionData.relaxTime || 3,
            sets: sessionData.sets || 1,
            repetitions: sessionData.repetitions || 1,
            completed: sessionData.completed || false,
            completedSets: sessionData.completedSets || 0,
            completedReps: sessionData.completedReps || 0
        };

        sessions.push(session);
        this.set('sessions', sessions);

        // 更新统计数据
        this.updateStats(session);

        return session;
    }

    // 获取所有训练记录
    getSessions() {
        return this.get('sessions', []);
    }

    // 获取指定日期的训练记录
    getSessionsByDate(date) {
        const sessions = this.getSessions();
        return sessions.filter(session => session.date === date);
    }

    // 获取日期范围内的训练记录
    getSessionsInRange(startDate, endDate) {
        const sessions = this.getSessions();
        return sessions.filter(session => {
            return session.date >= startDate && session.date <= endDate;
        });
    }

    // 删除训练记录
    deleteSession(sessionId) {
        const sessions = this.getSessions();
        const filteredSessions = sessions.filter(session => session.id !== sessionId);
        this.set('sessions', filteredSessions);
        
        // 重新计算统计数据
        this.recalculateStats();
        return true;
    }

    // === 统计数据相关方法 ===

    getStats() {
        return this.get('stats', {});
    }

    updateStats(session) {
        const stats = this.getStats();
        const today = new Date().toISOString().split('T')[0];

        // 更新基本统计
        if (session.completed) {
            stats.totalSessions = (stats.totalSessions || 0) + 1;
            stats.totalDuration = (stats.totalDuration || 0) + session.duration;

            // 更新日期
            if (!stats.firstSessionDate) {
                stats.firstSessionDate = today;
            }
            stats.lastSessionDate = today;

            // 更新连续天数
            this.updateStreakDays(stats, today);

            // 检查成就
            this.checkAchievements(stats);
        }

        this.set('stats', stats);
    }

    // 更新连续训练天数
    updateStreakDays(stats, today) {
        const lastDate = stats.lastSessionDate;
        
        if (!lastDate) {
            // 第一次训练
            stats.currentStreak = 1;
            stats.maxStreak = 1;
        } else {
            const lastDateTime = new Date(lastDate);
            const todayTime = new Date(today);
            const diffDays = Math.floor((todayTime - lastDateTime) / (24 * 60 * 60 * 1000));

            if (diffDays === 1) {
                // 连续的下一天
                stats.currentStreak = (stats.currentStreak || 0) + 1;
            } else if (diffDays === 0) {
                // 同一天，不变
                // stats.currentStreak 保持不变
            } else {
                // 中断了，重新开始
                stats.currentStreak = 1;
            }

            // 更新最长连续记录
            stats.maxStreak = Math.max(stats.maxStreak || 0, stats.currentStreak);
        }
    }

    // 重新计算统计数据
    recalculateStats() {
        const sessions = this.getSessions();
        const completedSessions = sessions.filter(s => s.completed);

        const stats = {
            totalSessions: completedSessions.length,
            totalDuration: completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
            currentStreak: 0,
            maxStreak: 0,
            achievements: this.get('stats', {}).achievements || [],
            firstSessionDate: null,
            lastSessionDate: null
        };

        if (completedSessions.length > 0) {
            const dates = completedSessions.map(s => s.date).sort();
            stats.firstSessionDate = dates[0];
            stats.lastSessionDate = dates[dates.length - 1];

            // 重新计算连续天数
            this.recalculateStreak(stats, dates);
        }

        // 重新检查成就
        this.checkAchievements(stats);

        this.set('stats', stats);
        return stats;
    }

    // 重新计算连续天数
    recalculateStreak(stats, dates) {
        if (dates.length === 0) return;

        // 获取唯一日期
        const uniqueDates = [...new Set(dates)].sort();
        
        let currentStreak = 1;
        let maxStreak = 1;
        let tempStreak = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i - 1]);
            const currentDate = new Date(uniqueDates[i]);
            const diffDays = Math.floor((currentDate - prevDate) / (24 * 60 * 60 * 1000));

            if (diffDays === 1) {
                tempStreak++;
            } else {
                maxStreak = Math.max(maxStreak, tempStreak);
                tempStreak = 1;
            }
        }

        maxStreak = Math.max(maxStreak, tempStreak);

        // 计算当前连续天数（从最后一天往前计算）
        const today = new Date().toISOString().split('T')[0];
        const lastDate = uniqueDates[uniqueDates.length - 1];
        const daysSinceLastSession = Math.floor((new Date(today) - new Date(lastDate)) / (24 * 60 * 60 * 1000));

        if (daysSinceLastSession <= 1) {
            // 计算到最后一天的连续天数
            let streak = 1;
            for (let i = uniqueDates.length - 2; i >= 0; i--) {
                const prevDate = new Date(uniqueDates[i]);
                const nextDate = new Date(uniqueDates[i + 1]);
                const diffDays = Math.floor((nextDate - prevDate) / (24 * 60 * 60 * 1000));
                if (diffDays === 1) {
                    streak++;
                } else {
                    break;
                }
            }
            currentStreak = streak;
        } else {
            currentStreak = 0; // 连续记录已中断
        }

        stats.currentStreak = currentStreak;
        stats.maxStreak = maxStreak;
    }

    // 检查成就
    checkAchievements(stats) {
        const achievements = stats.achievements || [];
        const newAchievements = [];

        const achievementChecks = [
            {
                id: 'first_session',
                condition: stats.totalSessions >= 1,
                name: 'first_session'
            },
            {
                id: 'week_streak',
                condition: stats.maxStreak >= 7,
                name: 'week_streak'
            },
            {
                id: 'month_streak',
                condition: stats.maxStreak >= 30,
                name: 'month_streak'
            },
            {
                id: 'sessions_50',
                condition: stats.totalSessions >= 50,
                name: 'sessions_50'
            },
            {
                id: 'sessions_100',
                condition: stats.totalSessions >= 100,
                name: 'sessions_100'
            },
            {
                id: 'total_hours_10',
                condition: stats.totalDuration >= 36000, // 10小时 = 36000秒
                name: 'total_hours_10'
            }
        ];

        achievementChecks.forEach(check => {
            if (check.condition && !achievements.includes(check.id)) {
                achievements.push(check.id);
                newAchievements.push(check);
            }
        });

        stats.achievements = achievements;

        // 触发成就解锁事件
        if (newAchievements.length > 0) {
            window.dispatchEvent(new CustomEvent('achievementUnlocked', {
                detail: { achievements: newAchievements }
            }));
        }
    }

    // === 数据导出和备份 ===

    // 导出所有数据
    exportData() {
        const data = {
            version: this.version,
            exportDate: new Date().toISOString(),
            settings: this.getSettings(),
            stats: this.getStats(),
            sessions: this.getSessions()
        };

        return data;
    }

    // 导出为JSON文件
    exportToFile() {
        const data = this.exportData();
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `pelvicfit_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        return true;
    }

    // 导入数据（未来功能）
    importData(data) {
        try {
            if (data.version && data.settings && data.sessions) {
                this.set('settings', data.settings);
                this.set('sessions', data.sessions);
                this.set('stats', data.stats || {});
                
                // 重新计算统计数据
                this.recalculateStats();
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Import data error:', error);
            return false;
        }
    }

    // === 工具方法 ===

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 获取存储大小（估算）
    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (key.startsWith(this.prefix)) {
                total += localStorage[key].length;
            }
        }
        return total; // 返回字符数
    }

    // 格式化存储大小
    formatStorageSize() {
        const size = this.getStorageSize();
        if (size < 1024) {
            return size + ' bytes';
        } else if (size < 1024 * 1024) {
            return Math.round(size / 1024 * 100) / 100 + ' KB';
        } else {
            return Math.round(size / (1024 * 1024) * 100) / 100 + ' MB';
        }
    }
}

// 创建全局实例
window.storage = new Storage();