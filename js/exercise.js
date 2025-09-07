/**
 * PelvicFit Mini - 锻炼模块
 * 核心训练逻辑和计时器功能
 */

class Exercise {
    constructor() {
        // 训练状态
        this.isActive = false;
        this.isPaused = false;
        this.currentPhase = 'prepare'; // prepare, contract, relax, rest, complete
        this.currentSet = 1;
        this.currentRep = 1;
        this.timer = null;
        this.startTime = null;
        this.pausedTime = 0;

        // 当前训练计划
        this.currentPlan = null;
        
        // 预设训练计划
        this.plans = {
            beginner: {
                name: 'beginner',
                contractTime: 3,
                relaxTime: 3,
                sets: 3,
                repsPerSet: 10,
                restTime: 30
            },
            intermediate: {
                name: 'intermediate',
                contractTime: 5,
                relaxTime: 5,
                sets: 3,
                repsPerSet: 15,
                restTime: 45
            },
            advanced: {
                name: 'advanced',
                contractTime: 8,
                relaxTime: 8,
                sets: 4,
                repsPerSet: 20,
                restTime: 60
            }
        };

        // 音频和震动设置
        this.soundEnabled = true;
        this.vibrationEnabled = true;
        
        // 绑定方法
        this.tick = this.tick.bind(this);
        
        this.init();
    }

    init() {
        // 从设置中读取音频和震动偏好
        this.loadSettings();
        
        // 设置事件监听
        this.setupEventListeners();
    }

    loadSettings() {
        if (window.storage) {
            this.soundEnabled = window.storage.getSetting('soundEnabled', true);
            this.vibrationEnabled = window.storage.getSetting('vibrationEnabled', true);
        }
    }

    setupEventListeners() {
        // 监听设置变化
        window.addEventListener('settingsChanged', (event) => {
            if (event.detail.soundEnabled !== undefined) {
                this.soundEnabled = event.detail.soundEnabled;
            }
            if (event.detail.vibrationEnabled !== undefined) {
                this.vibrationEnabled = event.detail.vibrationEnabled;
            }
        });

        // 监听页面可见性变化（防止后台计时不准）
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isActive && !this.isPaused) {
                // 页面被隐藏时记录时间
                this.backgroundTime = Date.now();
            } else if (!document.hidden && this.backgroundTime) {
                // 页面重新显示时调整计时
                const backgroundDuration = Date.now() - this.backgroundTime;
                this.adjustForBackground(backgroundDuration);
                this.backgroundTime = null;
            }
        });
    }

    // 调整后台时间
    adjustForBackground(backgroundDuration) {
        // 如果后台时间过长（超过5秒），暂停训练
        if (backgroundDuration > 5000) {
            this.pause();
            this.showMessage(window.i18n ? window.i18n.t('exercise.paused') : '训练已暂停');
        }
    }

    // 获取训练计划
    getPlan(planName) {
        return this.plans[planName] || null;
    }

    // 获取所有计划
    getAllPlans() {
        return this.plans;
    }

    // 计算训练计划总时长（分钟）
    calculatePlanDuration(plan) {
        if (!plan) return 0;
        
        // 单次重复时间 = 收缩时间 + 放松时间
        const singleRepTime = plan.contractTime + plan.relaxTime;
        
        // 单组时间 = 单次重复时间 × 每组重复次数
        const singleSetTime = singleRepTime * plan.repsPerSet;
        
        // 总训练时间 = 单组时间 × 组数
        const totalExerciseTime = singleSetTime * plan.sets;
        
        // 总休息时间 = 组间休息时间 × (组数 - 1)
        const totalRestTime = plan.restTime * (plan.sets - 1);
        
        // 准备时间
        const prepareTime = 3;
        
        // 总时长（秒）
        const totalSeconds = prepareTime + totalExerciseTime + totalRestTime;
        
        // 转换为分钟并四舍五入
        return Math.round(totalSeconds / 60);
    }

    // 获取计划显示信息
    getPlanInfo(planName) {
        const plan = this.getPlan(planName);
        if (!plan) return null;
        
        return {
            ...plan,
            duration: this.calculatePlanDuration(plan)
        };
    }

    // 开始训练
    startExercise(planName, customPlan = null) {
        if (this.isActive) {
            return false;
        }

        // 设置训练计划
        if (customPlan) {
            this.currentPlan = { ...customPlan, name: 'custom' };
        } else {
            this.currentPlan = this.getPlan(planName);
        }

        if (!this.currentPlan) {
            console.error('Invalid exercise plan');
            return false;
        }

        // 初始化状态
        this.isActive = true;
        this.isPaused = false;
        this.currentPhase = 'prepare';
        this.currentSet = 1;
        this.currentRep = 1;
        this.startTime = Date.now();
        this.pausedTime = 0;
        this.phaseStartTime = Date.now();
        this.phaseTimeRemaining = 3; // 3秒准备时间

        // 开始计时器
        this.startTimer();
        
        // 更新UI
        this.updateUI();
        
        // 播放开始音效
        this.playSound('start');
        
        return true;
    }

    // 开始计时器
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.timer = setInterval(this.tick, 100); // 每100ms更新一次
    }

    // 计时器回调
    tick() {
        if (!this.isActive || this.isPaused) {
            return;
        }

        const now = Date.now();
        this.phaseTimeRemaining = Math.max(0, 
            this.getPhaseTime() - Math.floor((now - this.phaseStartTime) / 1000)
        );

        // 更新UI
        this.updateTimer();

        // 检查阶段是否结束
        if (this.phaseTimeRemaining <= 0) {
            this.nextPhase();
        }
    }

    // 获取当前阶段的时间
    getPhaseTime() {
        switch (this.currentPhase) {
            case 'prepare':
                return 3;
            case 'contract':
                return this.currentPlan.contractTime;
            case 'relax':
                return this.currentPlan.relaxTime;
            case 'rest':
                return this.currentPlan.restTime;
            default:
                return 0;
        }
    }

    // 进入下一阶段
    nextPhase() {
        switch (this.currentPhase) {
            case 'prepare':
                this.currentPhase = 'contract';
                this.playSound('contract');
                this.vibrate(200);
                break;
                
            case 'contract':
                this.currentPhase = 'relax';
                this.playSound('relax');
                this.vibrate(100);
                break;
                
            case 'relax':
                this.currentRep++;
                if (this.currentRep <= this.currentPlan.repsPerSet) {
                    // 继续下一个重复
                    this.currentPhase = 'contract';
                    this.playSound('contract');
                    this.vibrate(200);
                } else {
                    // 完成一组
                    this.currentSet++;
                    this.currentRep = 1;
                    
                    if (this.currentSet <= this.currentPlan.sets) {
                        // 组间休息
                        this.currentPhase = 'rest';
                        this.playSound('rest');
                        this.vibrate([100, 100, 100]);
                    } else {
                        // 训练完成
                        this.completeExercise();
                        return;
                    }
                }
                break;
                
            case 'rest':
                this.currentPhase = 'contract';
                this.playSound('contract');
                this.vibrate(200);
                break;
        }

        // 重置阶段时间
        this.phaseStartTime = Date.now();
        this.phaseTimeRemaining = this.getPhaseTime();
        
        // 更新UI
        this.updateUI();
    }

    // 暂停训练
    pause() {
        if (!this.isActive || this.isPaused) {
            return false;
        }

        this.isPaused = true;
        this.pauseStartTime = Date.now();
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.updateUI();
        return true;
    }

    // 恢复训练
    resume() {
        if (!this.isActive || !this.isPaused) {
            return false;
        }

        this.isPaused = false;
        
        // 计算暂停时间
        if (this.pauseStartTime) {
            this.pausedTime += Date.now() - this.pauseStartTime;
            this.pauseStartTime = null;
        }

        // 调整阶段开始时间
        this.phaseStartTime = Date.now() - (this.getPhaseTime() - this.phaseTimeRemaining) * 1000;
        
        // 重新开始计时器
        this.startTimer();
        
        this.updateUI();
        return true;
    }

    // 停止训练
    stop() {
        if (!this.isActive) {
            return false;
        }

        // 保存未完成的训练记录
        if (this.currentSet > 1 || this.currentRep > 1) {
            this.saveSession(false);
        }

        this.reset();
        return true;
    }

    // 完成训练
    completeExercise() {
        this.currentPhase = 'complete';
        this.isActive = false;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        // 播放完成音效
        this.playSound('complete');
        this.vibrate([200, 100, 200, 100, 200]);

        // 保存训练记录
        this.saveSession(true);

        // 更新UI
        this.updateUI();
        
        // 显示完成消息
        this.showMessage(window.i18n ? window.i18n.t('exercise.exercise_completed') : '训练完成！恭喜你！');
    }

    // 重置状态
    reset() {
        this.isActive = false;
        this.isPaused = false;
        this.currentPhase = 'prepare';
        this.currentSet = 1;
        this.currentRep = 1;
        this.startTime = null;
        this.pausedTime = 0;
        this.phaseTimeRemaining = 0;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.updateUI();
    }

    // 保存训练记录
    saveSession(completed) {
        if (!this.currentPlan || !window.storage) {
            return;
        }

        const totalDuration = this.getTotalDuration();
        const sessionData = {
            plan: this.currentPlan.name,
            duration: Math.floor(totalDuration / 1000), // 转换为秒
            contractTime: this.currentPlan.contractTime,
            relaxTime: this.currentPlan.relaxTime,
            sets: this.currentPlan.sets,
            repetitions: this.currentPlan.repsPerSet,
            completed: completed,
            completedSets: completed ? this.currentPlan.sets : Math.max(0, this.currentSet - 1),
            completedReps: completed ? this.currentPlan.repsPerSet * this.currentPlan.sets : 
                          (this.currentSet - 1) * this.currentPlan.repsPerSet + Math.max(0, this.currentRep - 1)
        };

        window.storage.saveSession(sessionData);
    }

    // 获取总训练时长
    getTotalDuration() {
        if (!this.startTime) {
            return 0;
        }
        return Date.now() - this.startTime - this.pausedTime;
    }

    // 播放音效
    playSound(type) {
        if (!this.soundEnabled) {
            return;
        }

        // 使用Web Audio API或简单的beep音效
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // 根据类型设置不同频率
            const frequencies = {
                start: 800,
                contract: 1000,
                relax: 600,
                rest: 400,
                complete: [800, 1000, 1200]
            };

            const freq = frequencies[type];
            
            if (Array.isArray(freq)) {
                // 播放音序
                freq.forEach((f, index) => {
                    setTimeout(() => {
                        const osc = audioContext.createOscillator();
                        const gain = audioContext.createGain();
                        osc.connect(gain);
                        gain.connect(audioContext.destination);
                        osc.frequency.value = f;
                        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                        osc.start(audioContext.currentTime);
                        osc.stop(audioContext.currentTime + 0.2);
                    }, index * 250);
                });
            } else {
                oscillator.frequency.value = freq || 800;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }
        } catch (error) {
            console.warn('Could not play sound:', error);
        }
    }

    // 震动反馈
    vibrate(pattern) {
        if (!this.vibrationEnabled || !navigator.vibrate) {
            return;
        }

        try {
            if (Array.isArray(pattern)) {
                navigator.vibrate(pattern);
            } else {
                navigator.vibrate(pattern || 200);
            }
        } catch (error) {
            console.warn('Vibration not supported:', error);
        }
    }

    // 显示消息
    showMessage(message, duration = 3000) {
        // 触发消息事件
        window.dispatchEvent(new CustomEvent('showMessage', {
            detail: { message, duration }
        }));
    }

    // 更新UI
    updateUI() {
        // 触发UI更新事件
        window.dispatchEvent(new CustomEvent('exerciseStateChanged', {
            detail: {
                isActive: this.isActive,
                isPaused: this.isPaused,
                phase: this.currentPhase,
                currentSet: this.currentSet,
                totalSets: this.currentPlan ? this.currentPlan.sets : 0,
                currentRep: this.currentRep,
                totalReps: this.currentPlan ? this.currentPlan.repsPerSet : 0,
                timeRemaining: this.phaseTimeRemaining,
                totalPhaseTime: this.getPhaseTime()
            }
        }));
    }

    // 更新计时器显示
    updateTimer() {
        window.dispatchEvent(new CustomEvent('timerUpdate', {
            detail: {
                timeRemaining: this.phaseTimeRemaining,
                totalPhaseTime: this.getPhaseTime(),
                progress: this.getProgress()
            }
        }));
    }

    // 获取总体进度
    getProgress() {
        if (!this.currentPlan) {
            return 0;
        }

        const totalReps = this.currentPlan.sets * this.currentPlan.repsPerSet;
        const completedReps = (this.currentSet - 1) * this.currentPlan.repsPerSet + (this.currentRep - 1);
        const currentRepProgress = this.currentPhase === 'contract' || this.currentPhase === 'relax' ? 
                                   (this.getPhaseTime() - this.phaseTimeRemaining) / this.getPhaseTime() : 0;
        
        return Math.min((completedReps + currentRepProgress) / totalReps, 1);
    }

    // 获取当前状态信息
    getState() {
        return {
            isActive: this.isActive,
            isPaused: this.isPaused,
            currentPhase: this.currentPhase,
            currentSet: this.currentSet,
            currentRep: this.currentRep,
            timeRemaining: this.phaseTimeRemaining,
            totalPhaseTime: this.getPhaseTime(),
            progress: this.getProgress(),
            currentPlan: this.currentPlan
        };
    }
}

// 创建全局实例
window.exercise = new Exercise();