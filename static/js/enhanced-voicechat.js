/**
 * Enhanced Voice Chat with Modern UI and Better TTS
 * Улучшенный голосовой чат с современным интерфейсом и качественным синтезом речи
 */

class EnhancedVoiceChat {
    constructor() {
        this.recognition = null;
        this.recognizing = false;
        this.speaking = false;
        this.muted = false;
        this.currentAudio = null;
        this.currentVoices = [];
        this.settings = {
            selectedVoice: 'baya',
            selectedAgent: 'ai_assistant',
            selectedRate: 1.0,
            selectedEmotion: 'neutral'
        };
        
        // Элементы UI
        this.elements = {
            overlay: document.getElementById('voice-overlay'),
            addBtn: document.getElementById('add-btn'),
            muteBtn: document.getElementById('mute-btn'),
            muteIcon: document.getElementById('mute-icon'),
            closeBtn: document.getElementById('close-btn'),
            hint: document.getElementById('voice-hint'),
            canvas: document.getElementById('voice-visual'),
            voiceCircle: document.getElementById('voice-circle'),
            voiceStatus: document.getElementById('voice-status'),
            voiceStatusText: document.getElementById('voice-status-text'),
            voiceSelect: document.getElementById('voice-select'),
            agentSelect: document.getElementById('agent-select'),
            rateInput: document.getElementById('rate-input'),
            rateLabel: document.getElementById('rate-label'),
            emotionSelect: document.getElementById('emotion-select')
        };
        
        this.ctx = this.elements.canvas?.getContext('2d');
        this.animationFrame = 0;
        this.waveActive = false;
        this.talking = false;
        
        this.init();
    }
    
    async init() {
        console.log('🎙️ Initializing Enhanced Voice Chat');
        
        // Загружаем доступные голоса
        await this.loadAvailableVoices();
        
        // Инициализируем Speech Recognition
        this.initSpeechRecognition();
        
        // Настраиваем UI
        this.setupUI();
        
        // Добавляем обработчики событий
        this.attachEventListeners();
        
        console.log('✅ Enhanced Voice Chat initialized successfully');
    }
    
    async loadAvailableVoices() {
        try {
            const response = await fetch('/api/tts/voices');
            if (response.ok) {
                const data = await response.json();
                this.currentVoices = data.voices || [];
                this.populateVoiceSelect();
                console.log(`📢 Loaded ${this.currentVoices.length} voices`);
            } else {
                console.warn('⚠️ Failed to load voices, using defaults');
                this.useDefaultVoices();
            }
        } catch (error) {
            console.error('❌ Error loading voices:', error);
            this.useDefaultVoices();
        }
    }
    
    useDefaultVoices() {
        this.currentVoices = [
            { id: 'baya', name: 'Бая (женский, дружелюбный)', provider: 'silero' },
            { id: 'kseniya', name: 'Ксения (женский, деловой)', provider: 'silero' },
            { id: 'xenia', name: 'Ксения-2 (женский, мягкий)', provider: 'silero' },
            { id: 'aidar', name: 'Айдар (мужской, уверенный)', provider: 'silero' }
        ];
        this.populateVoiceSelect();
    }
    
    populateVoiceSelect() {
        if (!this.elements.voiceSelect) return;
        
        this.elements.voiceSelect.innerHTML = '';
        this.currentVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.id;
            option.textContent = voice.name;
            if (voice.provider) {
                option.textContent += ` (${voice.provider})`;
            }
            this.elements.voiceSelect.appendChild(option);
        });
        this.elements.voiceSelect.value = this.settings.selectedVoice;
    }
    
    setupUI() {
        // Настройка селектора агентов
        const agentOptions = [
            { id: 'ai_assistant', label: '🎓 AI-Ассистент' },
            { id: 'ai_navigator', label: '🧭 AI-Навигатор' },
            { id: 'student_navigator', label: '📚 Студенческий навигатор' },
            { id: 'green_navigator', label: '🌱 GreenNavigator' },
            { id: 'communication', label: '💬 Коммуникации' }
        ];
        
        if (this.elements.agentSelect) {
            this.elements.agentSelect.innerHTML = '';
            agentOptions.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.label;
                this.elements.agentSelect.appendChild(option);
            });
            this.elements.agentSelect.value = this.settings.selectedAgent;
        }
        
        // Настройка слайдера скорости
        if (this.elements.rateInput && this.elements.rateLabel) {
            this.elements.rateInput.value = this.settings.selectedRate;
            this.elements.rateLabel.textContent = this.settings.selectedRate.toFixed(1);
        }
        
        // Настройка селектора эмоций
        if (this.elements.emotionSelect) {
            this.elements.emotionSelect.value = this.settings.selectedEmotion;
        }
        
        this.updateStatus('ready', '🟢 Готов к общению');
    }
    
    initSpeechRecognition() {
        if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
            this.showError('❌ Голосовой ввод не поддерживается в этом браузере');
            this.elements.muteBtn?.setAttribute('disabled', 'true');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = "ru-RU";
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        
        this.recognition.onstart = () => {
            console.log('🎤 Speech recognition started');
            this.recognizing = true;
            this.updateStatus('listening', '🎤 Слушаю...');
            this.setWaveState(true, false);
            this.elements.voiceCircle?.classList.add('active');
        };
        
        this.recognition.onend = () => {
            console.log('🔇 Speech recognition ended');
            this.recognizing = false;
            this.elements.voiceCircle?.classList.remove('active');
            if (!this.speaking && !this.muted) {
                this.updateStatus('ready', '🟢 Готов к общению');
                this.setWaveState(true, false);
                this.autoStartRecognition();
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            this.recognizing = false;
            this.elements.voiceCircle?.classList.remove('active');
            
            if (event.error !== "aborted" && event.error !== "no-speech") {
                this.showError(`❌ Ошибка микрофона: ${event.error}`);
                this.muted = true;
                this.updateMuteUI();
            }
            
            this.updateStatus('error', '❌ Ошибка распознавания');
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('💬 Recognized text:', transcript);
            this.updateStatus('processing', '⚡ Обрабатываю запрос...');
            this.handleVoiceInput(transcript);
        };
    }
    
    async handleVoiceInput(text) {
        this.setWaveState(false, false);
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    agent_type: this.settings.selectedAgent,
                    language: 'ru'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const botReply = data.response || 'Извините, не удалось получить ответ.';
            
            console.log('🤖 Bot response:', botReply);
            this.updateStatus('speaking', '🗣️ Озвучиваю ответ...');
            
            await this.speakText(botReply);
            
        } catch (error) {
            console.error('❌ Error processing voice input:', error);
            this.showError('❌ Ошибка при обработке запроса');
            this.updateStatus('error', '❌ Ошибка сети');
            this.autoStartRecognition();
        }
    }
    
    async speakText(text) {
        this.stopCurrentAudio();
        this.speaking = true;
        this.setWaveState(false, true);
        
        try {
            const payload = {
                text: text,
                speaker: this.settings.selectedVoice,
                speed: this.settings.selectedRate,
                emotion: this.settings.selectedEmotion,
                format: 'wav'
            };
            
            console.log('🎵 Synthesizing speech...', payload);
            
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'accept': 'audio/wav',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`TTS API error: ${response.status}`);
            }
            
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            this.currentAudio = new Audio(audioUrl);
            
            this.currentAudio.onended = () => {
                this.onAudioEnded();
                URL.revokeObjectURL(audioUrl);
            };
            
            this.currentAudio.onerror = () => {
                console.error('❌ Audio playback error');
                this.onAudioEnded();
                URL.revokeObjectURL(audioUrl);
                this.showError('❌ Ошибка воспроизведения аудио');
            };
            
            await this.currentAudio.play();
            console.log('▶️ Audio playback started');
            
        } catch (error) {
            console.error('❌ Text-to-speech error:', error);
            this.showError('❌ Ошибка синтеза речи');
            this.onAudioEnded();
        }
    }
    
    onAudioEnded() {
        this.speaking = false;
        this.setWaveState(true, false);
        this.updateStatus('ready', '🟢 Готов к общению');
        this.autoStartRecognition();
    }
    
    stopCurrentAudio() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.src = "";
            this.currentAudio = null;
        }
        this.speaking = false;
    }
    
    autoStartRecognition() {
        if (!this.muted && !this.recognizing && !this.speaking) {
            setTimeout(() => {
                if (!this.muted && !this.recognizing && !this.speaking) {
                    try {
                        this.recognition?.start();
                    } catch (error) {
                        console.warn('⚠️ Could not restart recognition:', error);
                    }
                }
            }, 500);
        }
    }
    
    attachEventListeners() {
        // Кнопка открытия голосового чата
        this.elements.addBtn?.addEventListener('click', () => {
            this.showOverlay();
        });
        
        // Кнопка мута/анмута
        this.elements.muteBtn?.addEventListener('click', () => {
            this.toggleMute();
        });
        
        // Кнопка закрытия
        this.elements.closeBtn?.addEventListener('click', () => {
            this.hideOverlay();
        });
        
        // Настройки голоса
        this.elements.voiceSelect?.addEventListener('change', (e) => {
            this.settings.selectedVoice = e.target.value;
            console.log('🗣️ Voice changed to:', this.settings.selectedVoice);
        });
        
        this.elements.agentSelect?.addEventListener('change', (e) => {
            this.settings.selectedAgent = e.target.value;
            console.log('🤖 Agent changed to:', this.settings.selectedAgent);
        });
        
        this.elements.rateInput?.addEventListener('input', (e) => {
            this.settings.selectedRate = parseFloat(e.target.value);
            if (this.elements.rateLabel) {
                this.elements.rateLabel.textContent = this.settings.selectedRate.toFixed(1);
            }
            console.log('⚡ Rate changed to:', this.settings.selectedRate);
        });
        
        this.elements.emotionSelect?.addEventListener('change', (e) => {
            this.settings.selectedEmotion = e.target.value;
            console.log('😊 Emotion changed to:', this.settings.selectedEmotion);
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.elements.overlay?.classList.contains('hidden')) {
                this.hideOverlay();
            }
        });
    }
    
    showOverlay() {
        console.log('🎭 Showing voice chat overlay');
        this.elements.overlay?.classList.remove('hidden');
        this.muted = false;
        this.updateMuteUI();
        this.updateStatus('ready', '🟢 Готов к общению');
        this.startVisualization();
        this.autoStartRecognition();
    }
    
    hideOverlay() {
        console.log('🚪 Hiding voice chat overlay');
        this.elements.overlay?.classList.add('hidden');
        this.muted = true;
        this.updateMuteUI();
        this.recognition?.stop();
        this.stopCurrentAudio();
        this.stopVisualization();
    }
    
    toggleMute() {
        this.muted = !this.muted;
        console.log('🔇 Mute toggled:', this.muted);
        
        this.updateMuteUI();
        
        if (this.muted && this.recognizing) {
            this.recognition?.stop();
        }
        
        if (this.muted) {
            this.updateStatus('muted', '🔇 Микрофон выключен');
        } else {
            this.updateStatus('ready', '🟢 Готов к общению');
            this.autoStartRecognition();
        }
        
        this.stopCurrentAudio();
    }
    
    updateMuteUI() {
        if (!this.elements.muteBtn || !this.elements.muteIcon) return;
        
        if (this.muted) {
            this.elements.muteBtn.classList.add('muted');
            this.elements.muteIcon.textContent = 'mic_off';
        } else {
            this.elements.muteBtn.classList.remove('muted');
            this.elements.muteIcon.textContent = 'mic';
        }
    }
    
    updateStatus(state, message) {
        if (this.elements.voiceStatusText) {
            this.elements.voiceStatusText.textContent = message;
        }
        
        if (this.elements.hint) {
            this.elements.hint.textContent = message;
        }
        
        // Обновляем класс статуса
        if (this.elements.voiceStatus) {
            this.elements.voiceStatus.className = 'voice-status';
            this.elements.voiceStatus.classList.add(state);
        }
    }
    
    setWaveState(active, talking) {
        this.waveActive = active;
        this.talking = talking;
    }
    
    startVisualization() {
        this.stopVisualization();
        this.animateVisualization();
    }
    
    stopVisualization() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = 0;
        }
    }
    
    animateVisualization() {
        if (!this.ctx || this.elements.overlay?.classList.contains('hidden')) {
            return;
        }
        
        this.drawEnhancedVisualization();
        this.animationFrame = requestAnimationFrame(() => this.animateVisualization());
    }
    
    drawEnhancedVisualization() {
        const canvas = this.elements.canvas;
        if (!canvas || !this.ctx) return;
        
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const time = Date.now() * 0.003;
        
        // Очистка канваса
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Основной градиент
        const gradient = this.ctx.createRadialGradient(cx, cy, 20, cx, cy, 90);
        gradient.addColorStop(0, '#4f46e5');
        gradient.addColorStop(0.3, '#6366f1');
        gradient.addColorStop(0.7, '#3b82f6');
        gradient.addColorStop(1, '#1e40af');
        
        // Основной круг
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 85, 0, 2 * Math.PI);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Волновые эффекты
        if (this.waveActive || this.talking) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'overlay';
            
            const numWaves = this.talking ? 4 : 3;
            const baseAmplitude = this.talking ? 15 : 8;
            
            for (let i = 0; i < numWaves; i++) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 - i * 0.08})`;
                this.ctx.lineWidth = 2;
                
                for (let angle = 0; angle <= 2 * Math.PI; angle += 0.01) {
                    const radius = 85 + Math.sin(angle * 6 + time * 2 + i * 0.5) * 
                                   (baseAmplitude - i * 3) * 
                                   (this.talking ? 1.5 : 1);
                    
                    const x = cx + radius * Math.cos(angle);
                    const y = cy + radius * Math.sin(angle);
                    
                    if (angle === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                
                this.ctx.closePath();
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
        
        // Внутренняя подсветка
        const innerGradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 50, 0, 2 * Math.PI);
        this.ctx.fillStyle = innerGradient;
        this.ctx.fill();
    }
    
    showError(message) {
        console.error('💥 Voice chat error:', message);
        
        const errorPopup = document.createElement('div');
        errorPopup.className = 'voice-error-popup';
        errorPopup.textContent = message;
        
        document.body.appendChild(errorPopup);
        
        setTimeout(() => {
            errorPopup.style.opacity = '0';
            setTimeout(() => errorPopup.remove(), 300);
        }, 3000);
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedVoiceChat = new EnhancedVoiceChat();
});