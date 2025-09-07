/**
 * PelvicFit Mini - UI交互模块
 * 处理页面导航、组件交互和状态更新
 */

class UI {
    constructor() {
        this.currentPage = 'home';
        this.isInitialized = false;
        this.chartInstance = null;
        
        this.init();
    }

    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        // 等待i18n初始化完成
        if (window.i18n && !window.i18n.isInitialized) {
            window.addEventListener('i18nReady', () => {
                this.doInitialize();
            });
        } else {
            this.doInitialize();
        }
    }
    
    doInitialize() {
        this.setupEventListeners();
        this.setupNavigation();
        this.updateUI();
        this.isInitialized = true;
        
        // 隐藏加载屏幕
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300);
            }
        }, 1500);
    }

    setupEventListeners() {
        // 语言切换
        const langBtn = document.getElementById('lang-btn');
        if (langBtn) {
            langBtn.addEventListener('click', this.toggleLanguage.bind(this));
        }

        // 返回按钮
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', this.goBack.bind(this));
        }

        // 主页按钮
        const quickStartBtn = document.getElementById('quick-start-btn');
        if (quickStartBtn) {
            quickStartBtn.addEventListener('click', () => this.quickStartExercise());
        }

        // 首页计划选择
        const homePlanCards = document.querySelectorAll('.home-plan-card:not(.custom-plan)');
        homePlanCards.forEach(card => {
            card.addEventListener('click', () => {
                const planName = card.getAttribute('data-plan');
                this.startExerciseWithPlan(planName);
            });
        });

        // 自定义计划按钮
        const customPlanCard = document.getElementById('custom-plan-card');
        if (customPlanCard) {
            customPlanCard.addEventListener('click', () => this.showCustomPlanDialog());
        }

        const statsBtn = document.getElementById('stats-btn');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => this.navigateTo('stats'));
        }

        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.navigateTo('settings'));
        }

        // 训练计划选择
        this.setupPlanSelection();

        // 训练控制按钮
        this.setupExerciseControls();

        // 设置页面
        this.setupSettings();

        // 对话框
        this.setupDialog();

        // 监听应用事件
        this.setupAppEventListeners();
    }

    setupNavigation() {
        // 底部导航
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = btn.getAttribute('data-page');
                this.navigateTo(page);
            });
        });
    }

    setupPlanSelection() {
        const planCards = document.querySelectorAll('.plan-card');
        planCards.forEach(card => {
            card.addEventListener('click', () => {
                const planName = card.getAttribute('data-plan');
                this.startExerciseWithPlan(planName);
            });
        });

        const customPlanBtn = document.getElementById('custom-plan-btn');
        if (customPlanBtn) {
            customPlanBtn.addEventListener('click', this.showCustomPlanDialog.bind(this));
        }
    }

    setupExerciseControls() {
        // 音效控制
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', this.toggleSound.bind(this));
        }

        // 震动控制
        const vibrationToggle = document.getElementById('vibration-toggle');
        if (vibrationToggle) {
            vibrationToggle.addEventListener('click', this.toggleVibration.bind(this));
        }

        // 训练控制
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');

        if (startBtn) {
            startBtn.addEventListener('click', this.handleExerciseStart.bind(this));
        }
        if (pauseBtn) {
            pauseBtn.addEventListener('click', this.handleExercisePause.bind(this));
        }
        if (stopBtn) {
            stopBtn.addEventListener('click', this.handleExerciseStop.bind(this));
        }
    }

    setupSettings() {
        // 设置开关
        const soundSetting = document.getElementById('sound-setting');
        const vibrationSetting = document.getElementById('vibration-setting');
        const reminderTime = document.getElementById('reminder-time');

        if (soundSetting) {
            soundSetting.addEventListener('change', (e) => {
                window.storage.setSetting('soundEnabled', e.target.checked);
                this.triggerSettingsChange({ soundEnabled: e.target.checked });
            });
        }

        if (vibrationSetting) {
            vibrationSetting.addEventListener('change', (e) => {
                window.storage.setSetting('vibrationEnabled', e.target.checked);
                this.triggerSettingsChange({ vibrationEnabled: e.target.checked });
            });
        }

        if (reminderTime) {
            reminderTime.addEventListener('change', (e) => {
                window.storage.setSetting('reminderTime', e.target.value);
            });
        }

        // 数据管理按钮
        const exportDataBtn = document.getElementById('export-data-btn');
        const clearDataBtn = document.getElementById('clear-data-btn');

        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', this.exportData.bind(this));
        }
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', this.showClearDataDialog.bind(this));
        }

        // 统计周期选择
        const statsPeriod = document.getElementById('stats-period');
        if (statsPeriod) {
            statsPeriod.addEventListener('change', (e) => {
                this.updateStatsView(e.target.value);
            });
        }
    }

    setupDialog() {
        // 确认对话框
        const dialogOverlay = document.getElementById('confirm-dialog');
        const dialogCancel = document.getElementById('dialog-cancel');
        const dialogConfirm = document.getElementById('dialog-confirm');

        if (dialogCancel) {
            dialogCancel.addEventListener('click', this.hideDialog.bind(this));
        }

        if (dialogOverlay) {
            dialogOverlay.addEventListener('click', (e) => {
                if (e.target === dialogOverlay) {
                    this.hideDialog();
                }
            });
        }

        // 自定义计划对话框
        const customDialogOverlay = document.getElementById('custom-plan-dialog');
        const customDialogCancel = document.getElementById('custom-dialog-cancel');
        const customDialogStart = document.getElementById('custom-dialog-start');

        if (customDialogCancel) {
            customDialogCancel.addEventListener('click', this.hideCustomDialog.bind(this));
        }

        if (customDialogStart) {
            customDialogStart.addEventListener('click', this.startCustomExercise.bind(this));
        }

        if (customDialogOverlay) {
            customDialogOverlay.addEventListener('click', (e) => {
                if (e.target === customDialogOverlay) {
                    this.hideCustomDialog();
                }
            });
        }

        // 自定义计划参数变化监听
        const customInputs = ['custom-contract-time', 'custom-relax-time', 'custom-reps', 'custom-sets', 'custom-rest'];
        customInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', this.updateCustomDurationPreview.bind(this));
                element.addEventListener('input', this.updateCustomDurationPreview.bind(this));
            }
        });
    }

    setupAppEventListeners() {
        // 锻炼状态变化
        window.addEventListener('exerciseStateChanged', (e) => {
            this.updateExerciseUI(e.detail);
        });

        // 计时器更新
        window.addEventListener('timerUpdate', (e) => {
            this.updateTimer(e.detail);
        });

        // 语言变化
        window.addEventListener('languageChanged', () => {
            this.updateUI();
        });

        // 成就解锁
        window.addEventListener('achievementUnlocked', (e) => {
            this.showAchievementNotification(e.detail.achievements);
        });

        // 显示消息
        window.addEventListener('showMessage', (e) => {
            this.showToast(e.detail.message, e.detail.duration);
        });
    }

    // 导航相关方法
    navigateTo(page) {
        if (page === this.currentPage) {
            return;
        }

        // 隐藏所有页面
        const pages = document.querySelectorAll('.page');
        pages.forEach(p => p.classList.remove('active'));

        // 显示目标页面
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;
        }

        // 更新导航状态
        this.updateNavigation();
        
        // 更新页面标题
        this.updatePageTitle();
        
        // 更新返回按钮
        this.updateBackButton();

        // 页面特殊处理
        this.onPageChange(page);
    }

    navigateToPlans() {
        this.navigateTo('plans');
    }

    goBack() {
        if (this.currentPage === 'exercise') {
            // 如果正在锻炼，显示确认对话框
            if (window.exercise && window.exercise.isActive) {
                this.showDialog(
                    window.i18n.t('dialog.exercise_incomplete.title'),
                    window.i18n.t('dialog.exercise_incomplete.message'),
                    () => {
                        window.exercise.stop();
                        this.navigateTo('home');
                    }
                );
                return;
            }
        }
        this.navigateTo('home');
    }

    updateNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            const page = btn.getAttribute('data-page');
            if (page === this.currentPage) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updatePageTitle() {
        const titleElement = document.getElementById('page-title');
        if (!titleElement || !window.i18n) return;

        const titles = {
            home: 'PelvicFit Mini',
            plans: window.i18n.t('plans.title'),
            exercise: window.i18n.t('exercise.prepare'),
            stats: window.i18n.t('stats.title'),
            settings: window.i18n.t('settings.title')
        };

        titleElement.textContent = titles[this.currentPage] || 'PelvicFit Mini';
    }

    updateBackButton() {
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            if (this.currentPage === 'home') {
                backBtn.style.display = 'none';
            } else {
                backBtn.style.display = 'flex';
            }
        }
    }

    onPageChange(page) {
        switch (page) {
            case 'home':
                this.updatePlanDurations();
                break;
            case 'stats':
                this.loadStatsData();
                this.renderChart();
                break;
            case 'settings':
                this.loadSettingsValues();
                break;
        }
    }

    // 更新首页计划时长显示
    updatePlanDurations() {
        if (!window.exercise) return;

        const plans = ['beginner', 'intermediate', 'advanced'];
        plans.forEach(planName => {
            const planInfo = window.exercise.getPlanInfo(planName);
            if (planInfo) {
                const durationEl = document.getElementById(`${planName}-duration`);
                if (durationEl) {
                    const lang = window.i18n ? window.i18n.getCurrentLanguage() : 'zh';
                    durationEl.textContent = lang === 'zh' ? `${planInfo.duration}分钟` : `${planInfo.duration}min`;
                }
            }
        });
    }

    // 锻炼相关方法
    quickStartExercise() {
        // 快速开始使用初级计划
        this.startExerciseWithPlan('beginner');
    }

    startExerciseWithPlan(planName) {
        if (window.exercise) {
            const success = window.exercise.startExercise(planName);
            if (success) {
                this.navigateTo('exercise');
                this.showToast(window.i18n ? window.i18n.t('messages.plan_selected') : '训练计划已选择');
            }
        }
    }

    startCustomExercise() {
        const customPlan = this.getCustomPlanFromDialog();
        if (customPlan) {
            const success = window.exercise.startExercise(null, customPlan);
            if (success) {
                this.hideCustomDialog();
                this.navigateTo('exercise');
                this.showToast(window.i18n ? window.i18n.t('messages.plan_selected') : '自定义计划已开始');
            }
        }
    }

    getCustomPlanFromDialog() {
        const contractTime = parseInt(document.getElementById('custom-contract-time').value);
        const relaxTime = parseInt(document.getElementById('custom-relax-time').value);
        const repsPerSet = parseInt(document.getElementById('custom-reps').value);
        const sets = parseInt(document.getElementById('custom-sets').value);
        const restTime = parseInt(document.getElementById('custom-rest').value);

        return {
            name: 'custom',
            contractTime,
            relaxTime,
            sets,
            repsPerSet,
            restTime
        };
    }

    handleExerciseStart() {
        if (!window.exercise) return;

        if (window.exercise.isPaused) {
            window.exercise.resume();
        } else {
            // 如果没有活动的锻炼，使用默认计划
            window.exercise.startExercise('beginner');
        }
    }

    handleExercisePause() {
        if (window.exercise) {
            if (window.exercise.isPaused) {
                window.exercise.resume();
            } else {
                window.exercise.pause();
            }
        }
    }

    handleExerciseStop() {
        if (window.exercise && window.exercise.isActive) {
            this.showDialog(
                window.i18n ? window.i18n.t('dialog.exercise_incomplete.title') : '退出训练',
                window.i18n ? window.i18n.t('dialog.exercise_incomplete.message') : '训练尚未完成，确定要退出吗？',
                () => {
                    window.exercise.stop();
                    this.navigateTo('home');
                }
            );
        }
    }

    updateExerciseUI(state) {
        // 更新阶段显示
        const phaseText = document.getElementById('phase-text');
        if (phaseText && window.i18n) {
            phaseText.setAttribute('data-i18n', `exercise.${state.phase}`);
            phaseText.textContent = window.i18n.t(`exercise.${state.phase}`);
        }

        // 更新状态文本
        const statusText = document.getElementById('status-text');
        if (statusText && window.i18n) {
            const statusKey = this.getStatusKey(state.phase, state.isPaused);
            statusText.setAttribute('data-i18n', statusKey);
            statusText.textContent = window.i18n.t(statusKey);
        }

        // 更新组数信息
        const currentSetEl = document.getElementById('current-set');
        const totalSetsEl = document.getElementById('total-sets');
        if (currentSetEl) currentSetEl.textContent = state.currentSet;
        if (totalSetsEl) totalSetsEl.textContent = state.totalSets;

        // 更新按钮状态
        this.updateExerciseButtons(state);
    }

    getStatusKey(phase, isPaused) {
        if (isPaused) return 'exercise.paused';
        
        switch (phase) {
            case 'prepare': return 'exercise.ready';
            case 'contract': return 'exercise.contracting';
            case 'relax': return 'exercise.relaxing';
            case 'rest': return 'exercise.resting';
            case 'complete': return 'exercise.complete';
            default: return 'exercise.ready';
        }
    }

    updateExerciseButtons(state) {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');

        if (!startBtn || !pauseBtn) return;

        if (state.isActive) {
            if (state.isPaused) {
                startBtn.style.display = 'flex';
                pauseBtn.style.display = 'none';
                if (window.i18n) {
                    const resumeText = startBtn.querySelector('span:last-child');
                    if (resumeText) resumeText.textContent = window.i18n.t('exercise.resume');
                }
            } else {
                startBtn.style.display = 'none';
                pauseBtn.style.display = 'flex';
            }
        } else {
            startBtn.style.display = 'flex';
            pauseBtn.style.display = 'none';
            if (window.i18n) {
                const startText = startBtn.querySelector('span:last-child');
                if (startText) startText.textContent = window.i18n.t('exercise.start');
            }
        }
    }

    updateTimer(data) {
        // 更新计时器文本
        const timerText = document.getElementById('timer-text');
        const timerTotal = document.getElementById('timer-total');
        
        if (timerText) {
            timerText.textContent = `${data.timeRemaining}s`;
        }
        if (timerTotal) {
            timerTotal.textContent = `/ ${data.totalPhaseTime}s`;
        }

        // 更新进度圆圈
        this.updateProgressCircle(data.timeRemaining, data.totalPhaseTime);
    }

    updateProgressCircle(remaining, total) {
        const circle = document.getElementById('progress-circle');
        if (!circle) return;

        const radius = 85;
        const circumference = 2 * Math.PI * radius;
        const progress = total > 0 ? (total - remaining) / total : 0;
        const offset = circumference * (1 - progress);

        circle.style.strokeDashoffset = offset;
        
        // 改变颜色
        const phase = window.exercise ? window.exercise.currentPhase : 'prepare';
        const colors = {
            prepare: '#2196F3',
            contract: '#4CAF50',
            relax: '#FF9800',
            rest: '#9C27B0',
            complete: '#4CAF50'
        };
        circle.style.stroke = colors[phase] || '#2196F3';
    }

    // 设置相关方法
    loadSettingsValues() {
        if (!window.storage) return;

        const soundSetting = document.getElementById('sound-setting');
        const vibrationSetting = document.getElementById('vibration-setting');
        const reminderTime = document.getElementById('reminder-time');

        if (soundSetting) {
            soundSetting.checked = window.storage.getSetting('soundEnabled', true);
        }
        if (vibrationSetting) {
            vibrationSetting.checked = window.storage.getSetting('vibrationEnabled', true);
        }
        if (reminderTime) {
            reminderTime.value = window.storage.getSetting('reminderTime', '09:00');
        }
    }

    toggleSound() {
        const soundToggle = document.getElementById('sound-toggle');
        const currentEnabled = window.storage.getSetting('soundEnabled', true);
        const newEnabled = !currentEnabled;
        
        window.storage.setSetting('soundEnabled', newEnabled);
        this.triggerSettingsChange({ soundEnabled: newEnabled });
        
        // 更新按钮状态
        if (soundToggle) {
            soundToggle.classList.toggle('active', newEnabled);
            soundToggle.textContent = newEnabled ? '🔊' : '🔇';
        }
    }

    toggleVibration() {
        const vibrationToggle = document.getElementById('vibration-toggle');
        const currentEnabled = window.storage.getSetting('vibrationEnabled', true);
        const newEnabled = !currentEnabled;
        
        window.storage.setSetting('vibrationEnabled', newEnabled);
        this.triggerSettingsChange({ vibrationEnabled: newEnabled });
        
        // 更新按钮状态
        if (vibrationToggle) {
            vibrationToggle.classList.toggle('active', newEnabled);
            vibrationToggle.textContent = newEnabled ? '📳' : '📴';
        }
    }

    triggerSettingsChange(settings) {
        window.dispatchEvent(new CustomEvent('settingsChanged', {
            detail: settings
        }));
    }

    // 统计相关方法
    loadStatsData() {
        if (!window.storage) return;

        const stats = window.storage.getStats();
        
        // 更新统计卡片
        const sessionsCount = document.getElementById('sessions-count');
        const totalDuration = document.getElementById('total-duration');
        const streakDays = document.getElementById('streak-days');

        if (sessionsCount) {
            sessionsCount.textContent = window.i18n ? 
                window.i18n.formatNumber(stats.totalSessions || 0) : (stats.totalSessions || 0);
        }
        if (totalDuration) {
            const minutes = Math.round((stats.totalDuration || 0) / 60);
            totalDuration.textContent = window.i18n ? 
                window.i18n.formatNumber(minutes) : minutes;
        }
        if (streakDays) {
            streakDays.textContent = window.i18n ? 
                window.i18n.formatNumber(stats.currentStreak || 0) : (stats.currentStreak || 0);
        }

        // 更新成就
        this.updateAchievements(stats.achievements || []);
    }

    updateStatsView(period) {
        // 根据选择的时间段更新统计视图
        this.loadStatsData();
        this.renderChart(period);
    }

    updateAchievements(unlockedAchievements) {
        const achievementsList = document.getElementById('achievements-list');
        if (!achievementsList || !window.i18n) return;

        const allAchievements = [
            'first_session', 'week_streak', 'month_streak', 
            'sessions_50', 'sessions_100', 'total_hours_10'
        ];

        achievementsList.innerHTML = '';

        allAchievements.forEach(achievementId => {
            const isUnlocked = unlockedAchievements.includes(achievementId);
            const achievementEl = this.createAchievementElement(achievementId, isUnlocked);
            achievementsList.appendChild(achievementEl);
        });
    }

    createAchievementElement(achievementId, isUnlocked) {
        const div = document.createElement('div');
        div.className = `achievement-item ${isUnlocked ? 'unlocked' : ''}`;

        const icons = {
            first_session: '🎯',
            week_streak: '🔥',
            month_streak: '💎',
            sessions_50: '💪',
            sessions_100: '🏆',
            total_hours_10: '⏰'
        };

        div.innerHTML = `
            <div class="achievement-icon">${icons[achievementId] || '🏅'}</div>
            <div class="achievement-name" data-i18n="achievements.${achievementId}.name">
                ${window.i18n.t(`achievements.${achievementId}.name`)}
            </div>
            <div class="achievement-desc" data-i18n="achievements.${achievementId}.desc">
                ${window.i18n.t(`achievements.${achievementId}.desc`)}
            </div>
        `;

        return div;
    }

    renderChart(period = 'week') {
        const canvas = document.getElementById('progress-chart');
        if (!canvas || !window.storage) return;

        const ctx = canvas.getContext('2d');
        const sessions = window.storage.getSessions();
        
        // 简单的图表渲染（折线图）
        this.drawSimpleChart(ctx, sessions, period);
    }

    drawSimpleChart(ctx, sessions, period) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;

        // 清除画布
        ctx.clearRect(0, 0, width, height);

        // 获取数据
        const data = this.getChartData(sessions, period);
        if (data.length === 0) return;

        const maxValue = Math.max(...data.map(d => d.value), 1);
        const stepX = width / (data.length - 1 || 1);
        const stepY = height * 0.8 / maxValue;

        // 绘制网格线
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = height * 0.9 - (height * 0.8 / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // 绘制数据线
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = index * stepX;
            const y = height * 0.9 - point.value * stepY;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();

        // 绘制数据点
        ctx.fillStyle = '#2196F3';
        data.forEach((point, index) => {
            const x = index * stepX;
            const y = height * 0.9 - point.value * stepY;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    getChartData(sessions, period) {
        const now = new Date();
        const data = [];
        
        if (period === 'week') {
            // 过去7天的数据
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const daySessions = sessions.filter(s => s.date === dateStr && s.completed);
                data.push({
                    label: window.i18n ? window.i18n.getWeekday(date.getDay()) : dateStr,
                    value: daySessions.length
                });
            }
        }
        // 可以添加更多时间段的数据处理...

        return data;
    }

    // 对话框方法
    showDialog(title, message, onConfirm, onCancel = null) {
        const dialog = document.getElementById('confirm-dialog');
        const titleEl = document.getElementById('dialog-title');
        const messageEl = document.getElementById('dialog-message');
        const confirmBtn = document.getElementById('dialog-confirm');

        if (!dialog) return;

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        // 移除之前的事件监听器
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        newConfirmBtn.addEventListener('click', () => {
            this.hideDialog();
            if (onConfirm) onConfirm();
        });

        dialog.style.display = 'flex';
    }

    hideDialog() {
        const dialog = document.getElementById('confirm-dialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    }

    showClearDataDialog() {
        this.showDialog(
            window.i18n ? window.i18n.t('dialog.clear_data.title') : '清除数据',
            window.i18n ? window.i18n.t('dialog.clear_data.message') : '确定要清除所有训练数据吗？此操作不可恢复。',
            () => {
                window.storage.clear();
                window.storage.initializeData();
                this.updateUI();
                this.showToast(window.i18n ? window.i18n.t('messages.data_cleared') : '所有数据已清除');
            }
        );
    }

    // 工具方法
    exportData() {
        if (window.storage) {
            window.storage.exportToFile();
            this.showToast(window.i18n ? window.i18n.t('messages.data_exported') : '数据已导出到下载文件夹');
        }
    }

    toggleLanguage() {
        if (window.i18n) {
            const currentLang = window.i18n.getCurrentLanguage();
            const newLang = currentLang === 'zh' ? 'en' : 'zh';
            window.i18n.switchLanguage(newLang);
        }
    }

    showToast(message, duration = 3000) {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 20px;
            z-index: 10000;
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.3s;
        `;

        document.body.appendChild(toast);
        
        // 显示动画
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });

        // 自动隐藏
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }

    showAchievementNotification(achievements) {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                const message = `🎉 ${window.i18n ? window.i18n.t(`achievements.${achievement.name}.name`) : '成就解锁'}`;
                this.showToast(message, 4000);
            }, index * 1000);
        });
    }

    updateUI() {
        // 更新所有UI元素
        if (window.i18n) {
            window.i18n.applyTranslations();
        }
        
        this.updatePageTitle();
        
        if (this.currentPage === 'home') {
            this.updatePlanDurations();
        }
        if (this.currentPage === 'stats') {
            this.loadStatsData();
        }
        if (this.currentPage === 'settings') {
            this.loadSettingsValues();
        }
        
        // 更新控制按钮状态
        this.updateControlButtonStates();
    }

    updateControlButtonStates() {
        if (!window.storage) return;

        const soundToggle = document.getElementById('sound-toggle');
        const vibrationToggle = document.getElementById('vibration-toggle');

        const soundEnabled = window.storage.getSetting('soundEnabled', true);
        const vibrationEnabled = window.storage.getSetting('vibrationEnabled', true);

        if (soundToggle) {
            soundToggle.classList.toggle('active', soundEnabled);
            soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
        }
        if (vibrationToggle) {
            vibrationToggle.classList.toggle('active', vibrationEnabled);
            vibrationToggle.textContent = vibrationEnabled ? '📳' : '📴';
        }
    }

    // 自定义计划对话框方法
    showCustomPlanDialog() {
        const dialog = document.getElementById('custom-plan-dialog');
        if (dialog) {
            // 重置表单为默认值
            document.getElementById('custom-contract-time').value = '3';
            document.getElementById('custom-relax-time').value = '3';
            document.getElementById('custom-reps').value = '10';
            document.getElementById('custom-sets').value = '3';
            document.getElementById('custom-rest').value = '30';
            
            this.updateCustomDurationPreview();
            dialog.style.display = 'flex';
        }
    }

    hideCustomDialog() {
        const dialog = document.getElementById('custom-plan-dialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    }

    updateCustomDurationPreview() {
        const contractTime = parseInt(document.getElementById('custom-contract-time').value) || 3;
        const relaxTime = parseInt(document.getElementById('custom-relax-time').value) || 3;
        const repsPerSet = parseInt(document.getElementById('custom-reps').value) || 10;
        const sets = parseInt(document.getElementById('custom-sets').value) || 3;
        const restTime = parseInt(document.getElementById('custom-rest').value) || 30;

        // 使用exercise模块的计算方法
        const customPlan = {
            contractTime,
            relaxTime,
            sets,
            repsPerSet,
            restTime
        };

        const duration = window.exercise ? window.exercise.calculatePlanDuration(customPlan) : 5;
        const preview = document.getElementById('custom-duration-preview');
        if (preview) {
            const lang = window.i18n ? window.i18n.getCurrentLanguage() : 'zh';
            preview.textContent = lang === 'zh' ? `~${duration}分钟` : `~${duration}min`;
        }
    }
}

// 创建全局实例
window.ui = new UI();