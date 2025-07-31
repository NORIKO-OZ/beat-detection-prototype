class BeatDetector {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.audioSource = null;
        this.isPlaying = false;
        this.beats = [];
        this.onsets = [];
        this.bpm = 0;
        this.duration = 0;
        this.timeSignature = 4; // 拍子（4拍子 or 3拍子）
        this.firstDownbeatTime = 0; // 楽曲の最初の1拍目の時間
        this.offsetAdjustment = 0; // 手動オフセット調整値（秒）
        this.manualCutPositions = []; // 手動設定されたカット位置の配列
        this.lastGenerationWithMusic = true; // 最後に生成した動画に音楽が含まれているかどうか
        this.audioStartTime = 0; // 音声再生開始時間
        this.currentTime = 0; // 現在の再生位置
        
        // デバイス検出
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        this.isIPhone = /iPhone/.test(navigator.userAgent);
        this.isAndroid = /Android/.test(navigator.userAgent);
        
        if (this.isIOS) {
            console.log('🍎 iOS/iPadOS デバイスを検出しました');
        }
        if (this.isIPhone) {
            console.log('📱 iPhone デバイスを検出しました');
        }
        if (this.isAndroid) {
            console.log('🤖 Android デバイスを検出しました');
        }
        this.isPaused = false; // 一時停止状態
        this.pausedTime = 0; // 一時停止した位置
        this.playStartOffset = 0; // 再生開始オフセット（一時停止対応）
        
        // 映像関連の新しいプロパティ
        this.videoFiles = [];
        this.videoElements = [];
        this.editedVideo = null;
        this.generatedVideoBlob = null;
        this.staticPreviewBlob = null;
        this.isVideoGenerated = false;
        
        // 高度なテロップ関連のプロパティ
        this.telops = []; // テロップの配列
        this.telopIdCounter = 0;
        
        // v2新機能: 素材分類システム
        this.materialClassifications = []; // 各動画の分類情報
        this.classificationStats = {
            food: 0,
            staff: 0,
            store: 0,
            product: 0,
            other: 0
        };
        
        // 動画開始時間設定
        this.videoStartTimes = []; // 各動画の開始時間を保存
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.audioFile = document.getElementById('audioFile');
        
        // デバッグ: 要素が正しく取得できているかチェック
        console.log('音楽アップロード要素確認:');
        console.log('- uploadArea:', this.uploadArea ? '✓' : '✗');
        console.log('- audioFile:', this.audioFile ? '✓' : '✗');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.loading = document.getElementById('loading');
        this.results = document.getElementById('results');
        this.waveform = document.getElementById('waveform');
        this.beatList = document.getElementById('beatList');
        
        // 調整コントロール要素
        this.adjustmentControls = document.getElementById('adjustmentControls');
        this.currentTimeDisplay = document.getElementById('currentTimeDisplay');
        this.setCutPositionBtn = document.getElementById('setCutPosition');
        this.resetAdjustmentBtn = document.getElementById('resetAdjustment');
        
        // 映像関連要素
        this.videoUploadArea = document.getElementById('videoUploadArea');
        this.videoFilesInput = document.getElementById('videoFiles');
        this.videoPreview = document.getElementById('videoPreview');
        this.videoList = document.getElementById('videoList');
        this.autoEditSection = document.getElementById('autoEditSection');
        this.startAutoEditBtn = document.getElementById('startAutoEdit');
        this.playMusicDuringEditCheckbox = document.getElementById('playMusicDuringEdit');
        this.videoSizeSelect = document.getElementById('videoSizeSelect');
        this.framerateSelect = document.getElementById('framerateSelect');
        this.editProgress = document.getElementById('editProgress');
        this.progressText = document.getElementById('progressText');
        this.progressFill = document.getElementById('progressFill');
        
        // 結果表示要素
        this.editResult = document.getElementById('editResult');
        this.resultVideo = document.getElementById('resultVideo');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.previewBtn = document.getElementById('previewBtn');
        this.editSummary = document.getElementById('editSummary');
        this.toggleSummaryBtn = document.getElementById('toggleSummaryBtn');
        
        // v2新機能: 素材分類関連要素
        this.classificationStatsElement = document.getElementById('classificationStats');
        this.foodCount = document.getElementById('foodCount');
        this.staffCount = document.getElementById('staffCount');
        this.storeCount = document.getElementById('storeCount');
        this.productCount = document.getElementById('productCount');
        this.otherCount = document.getElementById('otherCount');
        
        // v2新機能: パターン生成関連要素
        this.generateAllPatternsBtn = document.getElementById('generateAllPatterns');
        this.patternPreview = document.getElementById('patternPreview');
        
        // 高度なテロップ関連要素
        this.newTelopText = document.getElementById('newTelopText');
        this.newTelopStartTime = document.getElementById('newTelopStartTime');
        this.newTelopEndTime = document.getElementById('newTelopEndTime');
        this.newTelopPositionX = document.getElementById('newTelopPositionX');
        this.newTelopPositionY = document.getElementById('newTelopPositionY');
        this.newTelopFont = document.getElementById('newTelopFont');
        this.newTelopFontSize = document.getElementById('newTelopFontSize');
        this.newTelopColor = document.getElementById('newTelopColor');
        this.newTelopCustomColor = document.getElementById('newTelopCustomColor');
        this.newTelopOutline = document.getElementById('newTelopOutline');
        this.newTelopBackground = document.getElementById('newTelopBackground');
        this.newTelopBold = document.getElementById('newTelopBold');
        this.addTelopBtn = document.getElementById('addTelop');
        this.previewAllTelopsBtn = document.getElementById('previewAllTelops');
        this.telopList = document.getElementById('telopList');
    }

    setupEventListeners() {
        // ファイルアップロード
        this.uploadArea.addEventListener('click', () => {
            console.log('音楽アップロードエリアがクリックされました');
            this.audioFile.click();
        });
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.audioFile.addEventListener('change', (e) => {
            console.log('音楽ファイルが選択されました:', e.target.files);
            this.handleFileSelect(e);
        });

        // 映像ファイルアップロード
        this.videoUploadArea.addEventListener('click', () => this.videoFilesInput.click());
        this.videoUploadArea.addEventListener('dragover', this.handleVideoDragOver.bind(this));
        this.videoUploadArea.addEventListener('drop', this.handleVideoDrop.bind(this));
        this.videoFilesInput.addEventListener('change', this.handleVideoSelect.bind(this));

        // コントロールボタン
        this.analyzeBtn.addEventListener('click', this.analyzeBeat.bind(this));
        this.playBtn.addEventListener('click', this.playAudio.bind(this));
        this.pauseBtn.addEventListener('click', this.pauseAudio.bind(this));
        this.stopBtn.addEventListener('click', this.stopAudio.bind(this));
        this.resetBtn.addEventListener('click', this.reset.bind(this));
        
        // 調整コントロール
        this.setCutPositionBtn.addEventListener('click', this.setCutPosition.bind(this));
        this.resetAdjustmentBtn.addEventListener('click', this.resetAdjustment.bind(this));
        
        // 自動編集
        this.startAutoEditBtn.addEventListener('click', this.startAutoEdit.bind(this));
        
        // v2新機能: パターン生成
        if (this.generateAllPatternsBtn) {
            this.generateAllPatternsBtn.addEventListener('click', this.generateAllPatterns.bind(this));
        }
        
        // パターン選択の変更を監視
        document.addEventListener('change', (e) => {
            if (e.target.name === 'videoPattern') {
                this.updatePatternPreview();
            }
        });
        
        // 音楽再生オプションの変更を監視
        if (this.playMusicDuringEditCheckbox) {
            this.playMusicDuringEditCheckbox.addEventListener('change', this.updateEditOptions.bind(this));
        }
        
        // 動画サイズ選択の変更を監視
        if (this.videoSizeSelect) {
            this.videoSizeSelect.addEventListener('change', this.updateVideoSizeOptions.bind(this));
        }
        
        // フレームレート選択の変更を監視
        if (this.framerateSelect) {
            this.framerateSelect.addEventListener('change', this.updateFramerateOptions.bind(this));
        }
        
        // 結果表示
        this.downloadBtn.addEventListener('click', this.downloadVideo.bind(this));
        this.previewBtn.addEventListener('click', this.previewVideo.bind(this));
        
        // 高度なテロップ関連
        if (this.addTelopBtn) {
            this.addTelopBtn.addEventListener('click', this.addTelop.bind(this));
        }
        if (this.previewAllTelopsBtn) {
            this.previewAllTelopsBtn.addEventListener('click', this.previewAllTelops.bind(this));
        }
    }
    
    updateEditOptions() {
        if (!this.playMusicDuringEditCheckbox) return;
        
        const isChecked = this.playMusicDuringEditCheckbox.checked;
        console.log('🎵 編集中音楽再生設定:', isChecked ? 'ON' : 'OFF');
        
        // 視覚的フィードバック
        const label = this.playMusicDuringEditCheckbox.closest('label');
        if (label) {
            label.style.opacity = isChecked ? '1' : '0.7';
        }
    }
    
    getVideoSize() {
        if (!this.videoSizeSelect) return { width: 1280, height: 720 }; // デフォルト
        
        const selectedSize = this.videoSizeSelect.value;
        
        // 「auto」が選択されている場合は、アップロードされた映像素材から自動検出
        if (selectedSize === 'auto' && this.videoElements && this.videoElements.length > 0) {
            return this.detectVideoAspectRatio();
        }
        
        const sizeMap = {
            'vertical_hd': { width: 720, height: 1280 },      // 9:16 縦長スマホ
            'square_hd': { width: 720, height: 720 },         // 1:1 正方形
            'horizontal_hd': { width: 1280, height: 720 },    // 16:9 横長HD
            'vertical_fhd': { width: 1080, height: 1920 },    // 9:16 縦長高画質
            'square_fhd': { width: 1080, height: 1080 },      // 1:1 正方形高画質
            'horizontal_fhd': { width: 1920, height: 1080 }   // 16:9 横長フルHD
        };
        
        return sizeMap[selectedSize] || { width: 1280, height: 720 };
    }
    
    detectVideoAspectRatio() {
        // 最初の映像素材のアスペクト比を基準にする
        const firstVideo = this.videoElements[0];
        if (!firstVideo || firstVideo.videoWidth === 0 || firstVideo.videoHeight === 0) {
            console.log('映像のメタデータが読み込まれていません、デフォルトサイズを使用');
            return { width: 1280, height: 720 };
        }
        
        const videoWidth = firstVideo.videoWidth;
        const videoHeight = firstVideo.videoHeight;
        const aspectRatio = videoWidth / videoHeight;
        
        console.log(`📐 映像素材のアスペクト比検出: ${videoWidth}×${videoHeight} (比率: ${aspectRatio.toFixed(2)})`);
        
        // アスペクト比に基づいて適切なサイズを決定
        if (Math.abs(aspectRatio - 1) < 0.1) {
            // 正方形 (1:1)
            return { width: 1080, height: 1080 };
        } else if (aspectRatio < 1) {
            // 縦長 (9:16など)
            const targetHeight = 1920;
            const targetWidth = Math.round(targetHeight * aspectRatio);
            return { width: targetWidth, height: targetHeight };
        } else {
            // 横長 (16:9など)
            const targetWidth = 1920;
            const targetHeight = Math.round(targetWidth / aspectRatio);
            return { width: targetWidth, height: targetHeight };
        }
    }
    
    updateVideoAspectRatioInfo(video) {
        if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
        
        const aspectRatio = video.videoWidth / video.videoHeight;
        let ratioText = '';
        let orientationText = '';
        
        if (Math.abs(aspectRatio - 1) < 0.1) {
            ratioText = '1:1';
            orientationText = '正方形';
        } else if (aspectRatio < 1) {
            ratioText = '9:16';
            orientationText = '縦長';
        } else {
            ratioText = '16:9';
            orientationText = '横長';
        }
        
        // 動画サイズ選択の下に情報を表示
        const videoSizeContainer = document.querySelector('#videoSizeSelect').parentElement;
        let infoDiv = videoSizeContainer.querySelector('.aspect-ratio-info');
        
        if (!infoDiv) {
            infoDiv = document.createElement('div');
            infoDiv.className = 'aspect-ratio-info';
            infoDiv.style.cssText = `
                margin-top: 0.5rem;
                padding: 0.5rem;
                background: var(--accent-bg);
                border-radius: 0.25rem;
                font-size: 0.8rem;
                color: var(--accent-text);
            `;
            videoSizeContainer.appendChild(infoDiv);
        }
        
        infoDiv.innerHTML = `
            📐 <strong>映像素材:</strong> ${video.videoWidth}×${video.videoHeight} (${ratioText}, ${orientationText})<br>
            💡 「自動」選択時はこのアスペクト比でプレビューされます
        `;
        
        console.log(`📐 映像アスペクト比情報更新: ${video.videoWidth}×${video.videoHeight} (${ratioText})`);
    }
    
    updateVideoSizeOptions() {
        if (!this.videoSizeSelect) return;
        
        const size = this.getVideoSize();
        const selectedText = this.videoSizeSelect.options[this.videoSizeSelect.selectedIndex].text;
        
        console.log('📱 動画サイズ変更:', selectedText);
        console.log('解像度:', `${size.width}×${size.height}`);
        
        // アスペクト比を判定
        let aspect = '';
        if (size.width === size.height) {
            aspect = '正方形 (1:1)';
        } else if (size.height > size.width) {
            aspect = '縦長 (9:16)';
        } else {
            aspect = '横長 (16:9)';
        }
        
        console.log('アスペクト比:', aspect);
    }
    
    getFramerate() {
        if (!this.framerateSelect) return 30; // デフォルト30fps
        
        const selectedFps = parseInt(this.framerateSelect.value);
        return selectedFps || 30;
    }
    
    updateFramerateOptions() {
        if (!this.framerateSelect) return;
        
        const fps = this.getFramerate();
        const selectedText = this.framerateSelect.options[this.framerateSelect.selectedIndex].text;
        
        console.log('🎬 フレームレート変更:', selectedText);
        console.log('FPS:', fps);
        
        // フレームレートによる品質とファイルサイズの目安
        let qualityInfo = '';
        if (fps === 24) {
            qualityInfo = '映画的な品質、ファイルサイズ小';
        } else if (fps === 25) {
            qualityInfo = 'ヨーロッパ標準、バランス型';
        } else if (fps === 30) {
            qualityInfo = 'SNS標準、滑らか、ファイルサイズ大';
        }
        
        console.log('品質特性:', qualityInfo);
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.loadAudioFile(files[0]);
        }
    }

    handleFileSelect(e) {
        console.log('handleFileSelect呼び出し:', e.target.files.length, 'ファイル');
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            console.log('選択されたファイル:', file.name, file.type, file.size + 'bytes');
            this.loadAudioFile(file);
        } else {
            console.warn('ファイルが選択されていません');
        }
    }

    handleVideoDragOver(e) {
        e.preventDefault();
        this.videoUploadArea.classList.add('dragover');
    }

    handleVideoDrop(e) {
        e.preventDefault();
        this.videoUploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('video/'));
        if (files.length > 0) {
            this.loadVideoFiles(files);
        }
    }

    handleVideoSelect(e) {
        const files = Array.from(e.target.files).filter(file => file.type.startsWith('video/'));
        if (files.length > 0) {
            this.loadVideoFiles(files);
        }
    }

    async loadVideoFiles(files) {
        try {
            console.log('Loading video files:', files.length);
            this.videoFiles = files;
            this.videoElements = [];
            
            // 各映像ファイルをvideo要素として準備
            await this.prepareVideoElements(files);
            
            // 映像プレビューを表示
            this.displayVideoPreview(files);
            this.videoPreview.style.display = 'block';
            
            // 音楽解析が完了していれば自動編集セクションを表示
            if (this.beats.length > 0) {
                this.autoEditSection.style.display = 'block';
                this.updateAutoEditStatus();
            }
            
        } catch (error) {
            console.error('Error loading video files:', error);
            alert('映像ファイルの読み込みに失敗しました: ' + error.message);
        }
    }

    async prepareVideoElements(files) {
        console.log('映像要素を準備中...');
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;
            video.loop = true;
            
            // ファイルをvideo要素に設定
            const url = URL.createObjectURL(file);
            video.src = url;
            
            // メタデータのロードを待つ
            await new Promise((resolve, reject) => {
                video.addEventListener('loadedmetadata', () => {
                    console.log(`映像 ${i + 1} ロード完了:`, video.videoWidth, 'x', video.videoHeight, video.duration + 's');
                    resolve();
                });
                video.addEventListener('error', reject);
                video.load();
            });
            
            this.videoElements.push(video);
        }
        
        console.log('全映像要素の準備完了:', this.videoElements.length, '個');
    }

    displayVideoPreview(files) {
        this.videoList.innerHTML = '';
        this.videoStartTimes = []; // リセット
        this.materialClassifications = []; // v2: 分類情報もリセット
        
        files.forEach((file, index) => {
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            
            const video = document.createElement('video');
            video.controls = false;
            video.muted = true;
            video.preload = 'metadata';
            
            const url = URL.createObjectURL(file);
            video.src = url;
            
            // デフォルト開始時間を設定
            this.videoStartTimes[index] = 0;
            
            video.addEventListener('loadedmetadata', () => {
                // 動画の長さに応じた適切な初期位置を設定
                const duration = video.duration;
                const initialTime = duration > 10 ? 2 : duration * 0.2; // 長い動画は2秒目、短い動画は20%地点
                video.currentTime = initialTime;
                this.videoStartTimes[index] = initialTime;
                
                // 時間コントロールの最大値を設定
                const timeSlider = videoItem.querySelector('.time-slider');
                const timeDisplay = videoItem.querySelector('.time-display');
                if (timeSlider && timeDisplay) {
                    timeSlider.max = Math.floor(duration * 10) / 10; // 0.1秒単位
                    timeSlider.value = initialTime;
                    timeDisplay.textContent = `${this.formatTime(initialTime)} / ${this.formatTime(duration)}`;
                }
                
                // 最初の映像の場合、アスペクト比情報を表示
                if (index === 0) {
                    this.updateVideoAspectRatioInfo(video);
                }
            });
            
            const filename = document.createElement('div');
            filename.className = 'filename';
            filename.textContent = file.name;
            
            // v2新機能: 素材分類セレクトボックス
            const classificationSelect = this.createMaterialClassificationSelect(index);
            
            // 動画コントロールを作成
            const controls = this.createVideoControls(video, index);
            
            videoItem.appendChild(video);
            videoItem.appendChild(filename);
            videoItem.appendChild(classificationSelect);
            videoItem.appendChild(controls);
            this.videoList.appendChild(videoItem);
            
            // 初期分類を設定
            this.materialClassifications[index] = 'other'; // デフォルトは「その他」
        });
        
        // 映像アップロードエリアのスタイルを更新
        this.updateVideoUploadArea(files.length);
        
        // 分類統計を更新
        this.updateClassificationStats();
        // パターンプレビューも更新
        this.updatePatternPreview();
    }

    updateVideoUploadArea(count) {
        this.videoUploadArea.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 10px;">✅</div>
            <div><strong>${count}個の映像ファイル</strong>が選択されました</div>
            <div style="font-size: 0.9em; margin-top: 5px; opacity: 0.8;">
                クリックして追加選択
            </div>
        `;
    }

    async loadAudioFile(file) {
        try {
            console.log('🎵 音楽ファイル読み込み開始:', file.name, file.type);
            
            // Web Audio API初期化
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // ファイル読み込み
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.duration = this.audioBuffer.duration;
            console.log('Audio loaded, duration:', this.duration, 'seconds');

            // UI更新
            this.analyzeBtn.disabled = false;
            this.resetBtn.disabled = false;
            this.uploadArea.innerHTML = `
                <div style="font-size: 2em; margin-bottom: 10px;">✅</div>
                <div><strong>${file.name}</strong></div>
                <div style="font-size: 0.9em; margin-top: 5px;">
                    ${Math.floor(this.duration / 60)}:${(this.duration % 60).toFixed(0).padStart(2, '0')}
                </div>
            `;

        } catch (error) {
            console.error('Error loading audio file:', error);
            alert('音声ファイルの読み込みに失敗しました: ' + error.message);
        }
    }

    async analyzeBeat() {
        if (!this.audioBuffer) return;

        this.loading.style.display = 'block';
        this.analyzeBtn.disabled = true;

        try {
            console.log('Starting beat analysis...');
            
            // 簡易的なビート検出実装
            await this.simpleTempoDetection();
            await this.simpleBeatDetection();
            
            this.displayResults();
            this.results.style.display = 'block';
            this.adjustmentControls.style.display = 'block';
            
            // 映像アップロードエリアを表示
            this.videoUploadArea.style.display = 'block';
            
            // 映像ファイルが既にアップロードされていれば自動編集セクションを表示
            if (this.videoFiles.length > 0) {
                this.autoEditSection.style.display = 'block';
                this.updateAutoEditStatus();
            }
            
            this.playBtn.disabled = false;
            this.pauseBtn.disabled = false;
            this.stopBtn.disabled = false;
            
            // 初期状態では先頭から再生
            this.playBtn.textContent = '▶️ 再生';

        } catch (error) {
            console.error('Beat analysis error:', error);
            alert('ビート解析に失敗しました: ' + error.message);
        } finally {
            this.loading.style.display = 'none';
            this.analyzeBtn.disabled = false;
        }
    }

    async simpleTempoDetection() {
        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        
        // より小さなウィンドウで精密に分析
        const hopSize = Math.floor(sampleRate * 0.01); // 10ms hop
        const windowSize = Math.floor(sampleRate * 0.02); // 20ms window
        const energyValues = [];
        
        // 低域フィルタ処理でドラムやベースを強調
        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            let energy = 0;
            let lowFreqEnergy = 0;
            
            for (let j = 0; j < windowSize; j++) {
                const sample = channelData[i + j];
                energy += sample * sample; // RMS energy
            }
            
            energyValues.push(Math.sqrt(energy / windowSize));
        }
        
        // 自己相関でテンポ検出
        this.bpm = this.detectTempoByAutocorrelation(energyValues, hopSize, sampleRate);
        
        // 拍子検出
        this.timeSignature = this.detectTimeSignature(energyValues, hopSize, sampleRate);
        
        console.log('Detected BPM:', this.bpm);
        console.log('Detected Time Signature:', this.timeSignature);
    }
    
    detectTempoByAutocorrelation(energyValues, hopSize, sampleRate) {
        const minBPM = 60;
        const maxBPM = 200;
        const minLag = Math.floor((60 / maxBPM) * sampleRate / hopSize);
        const maxLag = Math.floor((60 / minBPM) * sampleRate / hopSize);
        
        let maxCorrelation = 0;
        let bestLag = 0;
        
        // 自己相関計算
        for (let lag = minLag; lag < Math.min(maxLag, energyValues.length / 2); lag++) {
            let correlation = 0;
            let count = 0;
            
            for (let i = 0; i < energyValues.length - lag; i++) {
                correlation += energyValues[i] * energyValues[i + lag];
                count++;
            }
            
            correlation /= count;
            
            if (correlation > maxCorrelation) {
                maxCorrelation = correlation;
                bestLag = lag;
            }
        }
        
        if (bestLag > 0) {
            const beatInterval = (bestLag * hopSize) / sampleRate;
            return Math.round(60 / beatInterval);
        }
        
        return 120; // デフォルト
    }
    
    detectTimeSignature(energyValues, hopSize, sampleRate) {
        // まず楽曲の最初の1拍目を見つける
        const firstDownbeat = this.findFirstDownbeat(energyValues, hopSize, sampleRate);
        console.log('楽曲の最初の1拍目:', (firstDownbeat * hopSize / sampleRate).toFixed(2), '秒');
        
        // 最初の1拍目位置を保存（カット位置計算で使用）
        this.firstDownbeatTime = firstDownbeat * hopSize / sampleRate;
        
        // 基本的に4/4拍子とする（ポピュラー音楽の99%）
        const beatInterval = (60 / this.bpm) * sampleRate / hopSize;
        
        // 3/4拍子の明確な特徴がある場合のみ検出
        const is3_4 = this.detect3_4Pattern(energyValues, beatInterval, firstDownbeat);
        
        if (is3_4) {
            console.log('3/4拍子を検出');
            return 3;
        } else {
            console.log('4/4拍子として処理');
            return 4;
        }
    }
    
    detect3_4Pattern(energyValues, beatInterval, firstDownbeat) {
        // 3/4拍子の特徴：3拍で1つのパターンが繰り返される
        const measureLength = beatInterval * 3;
        let waltzPattern = 0;
        let regularPattern = 0;
        let measureCount = 0;
        
        // 楽曲の中間部分で判定（安定した部分）
        const startIndex = firstDownbeat + measureLength * 2; // 最初の2小節をスキップ
        const endIndex = Math.min(energyValues.length - measureLength, firstDownbeat + measureLength * 10);
        
        for (let i = startIndex; i < endIndex; i += measureLength) {
            if (i + measureLength < energyValues.length) {
                const beat1 = energyValues[Math.floor(i)];
                const beat2 = energyValues[Math.floor(i + beatInterval)];
                const beat3 = energyValues[Math.floor(i + beatInterval * 2)];
                
                // ワルツパターン：1拍目が強く、2・3拍目が弱い
                if (beat1 > beat2 && beat1 > beat3 && beat2 < beat1 * 0.8 && beat3 < beat1 * 0.8) {
                    waltzPattern++;
                }
                
                measureCount++;
            }
        }
        
        // 80%以上の小節でワルツパターンが見られる場合は3/4拍子
        const waltzRatio = measureCount > 0 ? waltzPattern / measureCount : 0;
        console.log('ワルツパターン率:', (waltzRatio * 100).toFixed(1) + '%');
        
        return waltzRatio > 0.8;
    }
    
    findFirstDownbeat(energyValues, hopSize, sampleRate) {
        // 楽曲開始から最初の強いビート（1拍目）を探す
        const beatInterval = (60 / this.bpm) * sampleRate / hopSize;
        const searchRange = Math.min(energyValues.length, beatInterval * 8); // 最初の8拍以内で探す
        
        let maxEnergy = 0;
        let downbeatIndex = 0;
        
        // 最初の数拍で最もエネルギーが高い点を1拍目とする
        for (let i = 0; i < searchRange; i += Math.floor(beatInterval / 4)) {
            if (i < energyValues.length) {
                // 周辺のエネルギーの平均と比較
                let localEnergy = 0;
                let count = 0;
                const windowSize = Math.floor(beatInterval / 8);
                
                for (let j = -windowSize; j <= windowSize; j++) {
                    if (i + j >= 0 && i + j < energyValues.length) {
                        localEnergy += energyValues[i + j];
                        count++;
                    }
                }
                
                const avgEnergy = localEnergy / count;
                
                if (avgEnergy > maxEnergy) {
                    maxEnergy = avgEnergy;
                    downbeatIndex = i;
                }
            }
        }
        
        return downbeatIndex;
    }

    async simpleBeatDetection() {
        // オンセット検出を先に行い、それを基準にビート位置を調整
        this.onsets = this.detectOnsets();
        
        const beatInterval = 60 / this.bpm;
        const rawBeats = [];
        
        // 理論的なビート位置を生成
        for (let time = 0; time < this.duration; time += beatInterval) {
            rawBeats.push(time);
        }
        
        // オンセットに近いビート位置を優先的に調整
        this.beats = this.alignBeatsWithOnsets(rawBeats, this.onsets);
        
        console.log('Detected beats:', this.beats.length);
        console.log('Detected onsets:', this.onsets.length);
    }
    
    alignBeatsWithOnsets(rawBeats, onsets) {
        const alignedBeats = [];
        const tolerance = 0.15; // 150ms の許容範囲
        
        rawBeats.forEach(beatTime => {
            let bestOnset = null;
            let minDistance = tolerance;
            
            // 最も近いオンセットを探す
            onsets.forEach(onsetTime => {
                const distance = Math.abs(beatTime - onsetTime);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestOnset = onsetTime;
                }
            });
            
            // 近いオンセットがあれば、それに合わせる
            if (bestOnset !== null) {
                alignedBeats.push(bestOnset);
            } else {
                alignedBeats.push(beatTime);
            }
        });
        
        return alignedBeats;
    }

    detectOnsets() {
        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        const onsets = [];
        const hopSize = Math.floor(sampleRate * 0.01); // 10ms hop
        const windowSize = Math.floor(sampleRate * 0.02); // 20ms window
        
        // スペクトラルフラックス方式でより正確なオンセット検出
        const energyHistory = [];
        const fluxThreshold = 0.02;
        
        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            let energy = 0;
            let highFreqEnergy = 0;
            
            // 高周波成分を重視（ドラムのアタック検出）
            for (let j = 0; j < windowSize; j++) {
                const sample = channelData[i + j];
                energy += sample * sample;
                
                // 高周波成分の近似（簡易ハイパスフィルタ）
                if (j > 0) {
                    const diff = sample - channelData[i + j - 1];
                    highFreqEnergy += diff * diff;
                }
            }
            
            const totalEnergy = Math.sqrt(energy / windowSize);
            const spectralFlux = Math.sqrt(highFreqEnergy / windowSize);
            
            energyHistory.push({
                time: i / sampleRate,
                energy: totalEnergy,
                flux: spectralFlux
            });
        }
        
        // 適応的閾値でオンセット検出
        for (let i = 3; i < energyHistory.length - 3; i++) {
            const current = energyHistory[i];
            
            // 前後の平均と比較
            let prevAvg = 0;
            let nextAvg = 0;
            
            for (let j = 1; j <= 3; j++) {
                prevAvg += energyHistory[i - j].flux;
                nextAvg += energyHistory[i + j].flux;
            }
            prevAvg /= 3;
            nextAvg /= 3;
            
            // スペクトラルフラックスが急激に増加する点を検出
            if (current.flux > prevAvg + fluxThreshold && 
                current.flux > current.energy * 0.3 && // エネルギーとの相関
                current.energy > 0.01) { // 最低エネルギー閾値
                
                // 重複除去（近い時間のオンセットをマージ）
                if (onsets.length === 0 || current.time - onsets[onsets.length - 1] > 0.05) {
                    onsets.push(current.time);
                }
            }
        }
        
        return onsets;
    }

    findPeaks(data, threshold) {
        const peaks = [];
        for (let i = 1; i < data.length - 1; i++) {
            if (data[i] > data[i-1] && data[i] > data[i+1] && data[i] > threshold) {
                peaks.push(i);
            }
        }
        return peaks;
    }

    displayResults() {
        document.getElementById('bpmValue').textContent = this.bpm;
        document.getElementById('beatCount').textContent = this.beats.length;
        document.getElementById('onsetCount').textContent = this.onsets.length;
        document.getElementById('duration').textContent = `${Math.floor(this.duration / 60)}:${(this.duration % 60).toFixed(0).padStart(2, '0')}`;
        document.getElementById('timeSignature').textContent = `${this.timeSignature}/4 拍子`;

        this.displayWaveform();
        this.displayBeatList();
    }

    displayWaveform() {
        const canvas = document.createElement('canvas');
        canvas.width = this.waveform.offsetWidth - 30;
        canvas.height = 70;
        canvas.style.width = '100%';
        canvas.style.height = '70px';
        
        const ctx = canvas.getContext('2d');
        const channelData = this.audioBuffer.getChannelData(0);
        const step = Math.ceil(channelData.length / canvas.width);
        
        // 波形描画
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let i = 0; i < canvas.width; i++) {
            const sample = channelData[i * step] || 0;
            const y = (sample * canvas.height / 2) + canvas.height / 2;
            
            if (i === 0) {
                ctx.moveTo(i, y);
            } else {
                ctx.lineTo(i, y);
            }
        }
        ctx.stroke();

        this.waveform.innerHTML = '';
        this.waveform.appendChild(canvas);

        // カット推奨位置マーカー追加（より目立つデザイン）
        const cutPositions = this.calculateCutPositions();
        cutPositions.forEach(cutTime => {
            const marker = document.createElement('div');
            marker.className = 'cut-marker';
            marker.style.cssText = `
                position: absolute;
                top: 0;
                bottom: 0;
                width: 3px;
                background: #ff4444;
                z-index: 15;
                left: ${(cutTime / this.duration) * 100}%;
                box-shadow: 0 0 4px #ff4444;
            `;
            marker.title = `推奨カット位置: ${cutTime.toFixed(2)}s`;
            this.waveform.appendChild(marker);
        });

        // 通常のビートマーカー追加（薄めに）
        this.beats.forEach(beatTime => {
            const marker = document.createElement('div');
            marker.className = 'beat-marker';
            marker.style.left = `${(beatTime / this.duration) * 100}%`;
            marker.style.opacity = '0.4';
            marker.title = `Beat at ${beatTime.toFixed(2)}s`;
            this.waveform.appendChild(marker);
        });

        // オンセットマーカー追加
        this.onsets.slice(0, 50).forEach(onsetTime => { // 最初の50個のみ表示
            const marker = document.createElement('div');
            marker.className = 'onset-marker';
            marker.style.left = `${(onsetTime / this.duration) * 100}%`;
            marker.title = `Onset at ${onsetTime.toFixed(2)}s`;
            this.waveform.appendChild(marker);
        });
    }

    displayBeatList() {
        // カット推奨位置を計算（4拍子で強拍を重視）
        const cutPositions = this.calculateCutPositions();
        
        let html = '<div style="margin-bottom: 15px;"><h4 style="color: #ff4444; margin: 0 0 10px 0;">🎬 推奨カット位置（動画切り替えポイント）</h4>';
        
        cutPositions.slice(0, 10).forEach((cut, index) => {
            const minutes = Math.floor(cut / 60);
            const seconds = (cut % 60).toFixed(1);
            html += `<div class="cut-position" style="background: rgba(255, 68, 68, 0.3); border: 2px solid #ff4444; padding: 8px 12px; margin: 5px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold;">カット ${index + 1}: ${minutes}:${seconds.padStart(4, '0')}</span>
                <span style="font-size: 0.9em; opacity: 0.8;">強拍</span>
            </div>`;
        });
        
        html += '</div>';
        
        // 全ビート位置も表示
        html += '<div><h4 style="margin: 10px 0;">🥁 検出された全ビート</h4>';
        html += this.beats.slice(0, 20).map(beat => 
            `<span class="beat-time">${beat.toFixed(2)}s</span>`
        ).join('');
        
        if (this.beats.length > 20) {
            html += `<div style="margin-top: 10px; font-size: 0.9em; opacity: 0.7;">...他 ${this.beats.length - 20} 個のビート</div>`;
        }
        
        html += '</div>';
        this.beatList.innerHTML = html;
    }

    calculateCutPositions() {
        const cutPositions = [];
        
        if (this.manualCutPositions.length > 0) {
            // 手動設定されたカット位置がある場合
            console.log('🎯 手動設定カット位置を使用:', this.manualCutPositions.length, '個');
            console.log('🎯 手動設定位置:', this.manualCutPositions.map(t => t.toFixed(2) + 's').join(', '));
            
            // 手動設定されたカット位置をベースにする
            cutPositions.push(...this.manualCutPositions);
            
            // 手動設定位置の間隔から推定される自動カット位置も追加
            if (this.manualCutPositions.length >= 2) {
                // 手動設定された間隔を基に追加のカット位置を生成
                const intervals = [];
                for (let i = 1; i < this.manualCutPositions.length; i++) {
                    intervals.push(this.manualCutPositions[i] - this.manualCutPositions[i-1]);
                }
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                
                // 最後の手動設定位置の後に自動カット位置を追加
                let lastManualTime = this.manualCutPositions[this.manualCutPositions.length - 1];
                for (let time = lastManualTime + avgInterval; time < this.duration; time += avgInterval) {
                    cutPositions.push(time);
                }
                
                console.log('📊 推定間隔:', avgInterval.toFixed(2), '秒で追加カット位置を生成');
            } else {
                // 手動設定が1つだけの場合は、自動検出のリズムで続ける
                const beatInterval = 60 / this.bpm;
                const measureLength = beatInterval * this.timeSignature;
                
                let startTime = this.manualCutPositions[0] + measureLength;
                for (let time = startTime; time < this.duration; time += measureLength) {
                    cutPositions.push(time);
                }
                
                console.log('📊 1つの手動設定から自動リズム（', measureLength.toFixed(2), '秒間隔）で継続');
            }
        } else {
            // 手動設定がない場合は従来の自動検出
            const beatInterval = 60 / this.bpm;
            const measureLength = beatInterval * this.timeSignature;
            
            // 最初の1拍目位置から開始（手動オフセット調整を適用）
            const startTime = (this.firstDownbeatTime || 0) + this.offsetAdjustment;
            
            // 小節の1拍目（最も強い拍）をカット位置として使用
            for (let time = startTime; time < this.duration; time += measureLength) {
                if (time >= 0) { // 負の値は除外
                    cutPositions.push(time);
                }
            }
            
            console.log('🤖 自動検出カット位置を使用');
            console.log('カット間隔:', measureLength.toFixed(2), '秒');
            console.log('手動オフセット調整値:', this.offsetAdjustment.toFixed(3), '秒');
        }
        
        // 時間順にソートして重複除去
        const uniqueCutPositions = [...new Set(cutPositions.map(t => Math.round(t * 100) / 100))]
            .sort((a, b) => a - b)
            .slice(0, 20); // 最大20カット位置に制限
        
        console.log('最終カット位置数:', uniqueCutPositions.length);
        if (uniqueCutPositions.length > 0) {
            console.log('最初のカット位置:', uniqueCutPositions[0].toFixed(3), '秒');
            console.log('最初の5つのカット位置:', uniqueCutPositions.slice(0, 5).map(t => t.toFixed(2) + 's').join(', '));
        }
        
        return uniqueCutPositions;
    }
    
    startTimeUpdater() {
        this.timeUpdateInterval = setInterval(() => {
            if (this.isPlaying && this.audioContext) {
                const elapsedTime = this.audioContext.currentTime - this.audioStartTime;
                this.currentTime = this.playStartOffset + elapsedTime;
                this.updateTimeDisplay();
            }
            // 停止後でも最後の時間を保持して表示
        }, 100); // 100ms間隔で更新
    }
    
    stopTimeUpdater() {
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }
    }
    
    updateTimeDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = (this.currentTime % 60).toFixed(1);
        this.currentTimeDisplay.textContent = `${minutes}:${seconds.padStart(4, '0')}`;
    }
    
    setCutPosition() {
        console.log('setCutPosition呼び出し - isPlaying:', this.isPlaying, 'currentTime:', this.currentTime);
        
        // 再生中でなくても、有効な時間が取得できていれば設定可能にする
        if (this.currentTime <= 0) {
            alert('有効な再生位置が検出できません。音楽を再生してからお試しください');
            return;
        }
        
        const targetTime = this.currentTime;
        
        // 既に同じ位置（0.1秒以内）にカット位置がある場合は追加しない
        const existingPosition = this.manualCutPositions.find(pos => Math.abs(pos - targetTime) < 0.1);
        if (existingPosition) {
            console.warn(`⚠️ 近い位置（${existingPosition.toFixed(2)}s）に既にカット位置が設定されています`);
            return;
        }
        
        // 手動カット位置を追加
        this.manualCutPositions.push(targetTime);
        this.manualCutPositions.sort((a, b) => a - b); // 時間順にソート
        
        // 最初のカット位置に基づいてオフセット調整値も更新
        const originalFirstBeat = this.firstDownbeatTime || 0;
        this.offsetAdjustment = this.manualCutPositions[0] - originalFirstBeat;
        
        console.log('🎯 手動カット位置設定:');
        console.log('- 現在の再生位置:', targetTime.toFixed(3), '秒を追加');
        console.log('- 設定済みカット位置数:', this.manualCutPositions.length, '個');
        console.log('- 全手動カット位置:', this.manualCutPositions.map(t => t.toFixed(2) + 's').join(', '));
        console.log('- 元の最初の1拍目:', originalFirstBeat.toFixed(3), '秒');
        console.log('- 計算されたオフセット:', this.offsetAdjustment.toFixed(3), '秒');
        
        // 確認用：新しいカット位置を計算して表示
        const newCutPositions = this.calculateCutPositions();
        console.log('- 調整後の最初のカット位置:', newCutPositions[0]?.toFixed(3), '秒');
        console.log('- 調整後の最初の5つ:', newCutPositions.slice(0, 5).map(t => t.toFixed(2) + 's').join(', '));
        
        // 検証：手動設定した位置が最初のカット位置になっているかチェック
        const expectedFirstCut = targetTime;
        const actualFirstCut = newCutPositions[0];
        const difference = Math.abs(expectedFirstCut - actualFirstCut);
        
        if (difference < 0.01) {
            console.log('✅ 手動調整成功: 設定位置が最初のカット位置になりました');
            console.log('🎬 次回の動画生成では、この調整されたタイミングが使用されます');
        } else {
            console.warn('⚠️ 手動調整に問題があります:');
            console.warn('  期待値:', expectedFirstCut.toFixed(3), '秒');
            console.warn('  実際値:', actualFirstCut.toFixed(3), '秒');
            console.warn('  差異:', difference.toFixed(3), '秒');
        }
        
        // 編集計画のプレビューも生成して確認
        const previewPlan = this.createEditPlan(newCutPositions);
        console.log('🎞️ 新しい編集計画プレビュー:');
        previewPlan.slice(0, 3).forEach((segment, index) => {
            const duration = segment.endTime - segment.startTime;
            console.log(`  セグメント${index + 1}: ${segment.startTime.toFixed(2)}s-${segment.endTime.toFixed(2)}s (${duration.toFixed(2)}s間隔)`);
        });
        
        // 表示を更新
        this.displayResults();
        
        // 自動編集セクションに手動調整状態を表示
        this.updateAutoEditStatus();
        
        // 成功メッセージ
        const originalText = this.setCutPositionBtn.textContent;
        this.setCutPositionBtn.textContent = '✅ 設定完了!';
        this.setCutPositionBtn.style.background = 'linear-gradient(45deg, #4CAF50, #2e7d32)';
        
        setTimeout(() => {
            this.setCutPositionBtn.textContent = originalText;
            this.setCutPositionBtn.style.background = 'linear-gradient(45deg, #ff4444, #cc0000)';
        }, 1500);
    }
    
    resetAdjustment() {
        this.offsetAdjustment = 0;
        this.manualCutPositions = [];
        this.lastGenerationWithMusic = true;
        this.manualCutPositions = [];
        this.displayResults();
        console.log('🔄 オフセット調整と手動カット位置をリセット');
        
        // 自動編集セクションの状態を更新
        this.updateAutoEditStatus();
        
        // 成功メッセージ
        const originalText = this.resetAdjustmentBtn.textContent;
        this.resetAdjustmentBtn.textContent = '✅ リセット完了!';
        this.resetAdjustmentBtn.style.background = 'linear-gradient(45deg, #4CAF50, #2e7d32)';
        
        setTimeout(() => {
            this.resetAdjustmentBtn.textContent = originalText;
            this.resetAdjustmentBtn.style.background = 'linear-gradient(45deg, #ff9800, #e68900)';
        }, 1000);
    }

    updateAutoEditStatus() {
        if (!this.autoEditSection || this.autoEditSection.style.display === 'none') {
            return;
        }

        // 既存の状態表示を削除
        const existingStatus = this.autoEditSection.querySelector('.adjustment-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // 手動調整状態を表示
        const statusDiv = document.createElement('div');
        statusDiv.className = 'adjustment-status';
        
        if (Math.abs(this.offsetAdjustment) > 0.01) { // 0.01秒以上の調整がある場合
            statusDiv.style.cssText = `
                background: rgba(255, 193, 7, 0.2);
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 12px;
                margin: 10px 0;
                color: #ffc107;
                font-size: 14px;
                text-align: center;
            `;
            
            const adjustmentSeconds = Math.abs(this.offsetAdjustment).toFixed(2);
            const direction = this.offsetAdjustment > 0 ? '後ろ' : '前';
            
            statusDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">⚙️ カット位置が手動調整されています</div>
                <div>調整値: ${adjustmentSeconds}秒 ${direction}にシフト</div>
                <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
                    動画生成時に調整されたカット位置が使用されます
                </div>
            `;
        } else {
            statusDiv.style.cssText = `
                background: rgba(76, 175, 80, 0.1);
                border: 1px solid #4CAF50;
                border-radius: 8px;
                padding: 8px;
                margin: 10px 0;
                color: #4CAF50;
                font-size: 14px;
                text-align: center;
            `;
            
            statusDiv.innerHTML = `
                <div>✅ 自動検出されたカット位置を使用</div>
            `;
        }

        // 自動編集ボタンの前に挿入
        this.autoEditSection.insertBefore(statusDiv, this.startAutoEditBtn.parentElement);
    }
    
    findStrongOnsets() {
        // オンセットの強度を音響エネルギーで判定
        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        const strongOnsets = [];
        
        this.onsets.forEach(onsetTime => {
            const sampleIndex = Math.floor(onsetTime * sampleRate);
            const windowSize = Math.floor(sampleRate * 0.1); // 100ms window
            
            // オンセット前後のエネルギー変化を計算
            let beforeEnergy = 0;
            let afterEnergy = 0;
            
            // オンセット前のエネルギー
            for (let i = Math.max(0, sampleIndex - windowSize); i < sampleIndex; i++) {
                beforeEnergy += Math.abs(channelData[i] || 0);
            }
            
            // オンセット後のエネルギー
            for (let i = sampleIndex; i < Math.min(channelData.length, sampleIndex + windowSize); i++) {
                afterEnergy += Math.abs(channelData[i] || 0);
            }
            
            // エネルギー変化が大きい場合は強いオンセットとして採用
            const energyRatio = afterEnergy / (beforeEnergy + 0.001); // ゼロ除算回避
            if (energyRatio > 1.5) { // 50%以上エネルギーが増加
                strongOnsets.push(onsetTime);
            }
        });
        
        // 強いオンセットが少ない場合は、通常のオンセットも含める
        if (strongOnsets.length < 5) {
            return this.onsets.filter((_, index) => index % 3 === 0).slice(0, 15);
        }
        
        return strongOnsets.slice(0, 15); // 最大15個まで
    }

    async playAudio() {
        if (this.isPlaying) return;
        
        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.audioSource = this.audioContext.createBufferSource();
            this.audioSource.buffer = this.audioBuffer;
            this.audioSource.connect(this.audioContext.destination);
            
            // 一時停止から再開の場合は、停止位置から開始
            this.playStartOffset = this.isPaused ? this.pausedTime : 0;
            console.log('🎵 再生準備:');
            console.log('  - 一時停止状態:', this.isPaused);
            console.log('  - 一時停止位置:', this.pausedTime.toFixed(2), '秒');
            console.log('  - 再生開始位置:', this.playStartOffset.toFixed(2), '秒');
            
            this.audioSource.start(0, this.playStartOffset);
            
            this.isPlaying = true;
            // isPausedはリセットしない（停止ボタンでのみリセット）
            this.audioStartTime = this.audioContext.currentTime;
            
            if (this.playStartOffset === 0) {
                console.log('✅ 先頭（0秒）から再生開始');
                this.playBtn.textContent = '▶️ 再生';
            } else {
                console.log('⏯️ 一時停止位置（', this.playStartOffset.toFixed(2), '秒）から再生再開');
                this.playBtn.textContent = '▶️ 再生';
            }
            
            // 再生時間の更新を開始
            this.startTimeUpdater();
            
            this.playBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.stopBtn.disabled = false;

            // カット位置インジケーターを開始
            this.startCutIndicator();

            this.audioSource.onended = () => {
                this.isPlaying = false;
                this.isPaused = false;
                this.pausedTime = 0;
                this.currentTime = 0;
                this.playStartOffset = 0;
                this.playBtn.disabled = false;
                this.pauseBtn.disabled = true;
                this.stopBtn.disabled = true;
                
                // 再生ボタンのテキストを先頭再生に更新
                this.playBtn.textContent = '▶️ 再生（先頭から）';
                
                // 時間表示をリセット
                this.updateTimeDisplay();
                
                this.stopCutIndicator();
                this.stopTimeUpdater();
                console.log('🏁 音楽終了 - 全状態リセット、次回は先頭から再生');
            };

        } catch (error) {
            console.error('Play audio error:', error);
        }
    }

    startCutIndicator() {
        // カット位置インジケーター用のDIVを作成
        if (!this.cutIndicator) {
            this.cutIndicator = document.createElement('div');
            this.cutIndicator.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80px;
                height: 80px;
                background: radial-gradient(circle, #ff4444, #cc0000);
                border-radius: 50%;
                display: none;
                z-index: 1000;
                box-shadow: 0 0 20px #ff4444;
                border: 4px solid white;
                font-size: 24px;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            `;
            this.cutIndicator.innerHTML = '✂️';
            document.body.appendChild(this.cutIndicator);
        }

        // カット位置での表示スケジューリング
        const cutPositions = this.calculateCutPositions();
        this.cutTimeouts = [];

        cutPositions.forEach(cutTime => {
            const timeout = setTimeout(() => {
                if (this.isPlaying) {
                    this.showCutIndicator();
                }
            }, cutTime * 1000);
            this.cutTimeouts.push(timeout);
        });
    }

    showCutIndicator() {
        if (!this.cutIndicator) return;
        
        this.cutIndicator.style.display = 'flex';
        this.cutIndicator.style.animation = 'cutPulse 0.5s ease-out';
        
        // アニメーション定義を追加
        if (!document.getElementById('cutAnimation')) {
            const style = document.createElement('style');
            style.id = 'cutAnimation';
            style.textContent = `
                @keyframes cutPulse {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            if (this.cutIndicator) {
                this.cutIndicator.style.display = 'none';
            }
        }, 500);
    }

    stopCutIndicator() {
        if (this.cutTimeouts) {
            this.cutTimeouts.forEach(timeout => clearTimeout(timeout));
            this.cutTimeouts = [];
        }
        if (this.cutIndicator) {
            this.cutIndicator.style.display = 'none';
        }
    }

    pauseAudio() {
        if (this.audioSource && this.isPlaying) {
            // 現在の再生位置を保存
            this.pausedTime = this.currentTime;
            
            // onendedイベントハンドラーを一時的に無効化
            this.audioSource.onended = null;
            this.audioSource.stop();
            this.audioSource = null;
            this.isPlaying = false;
            this.isPaused = true;
            
            this.playBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.stopBtn.disabled = false;
            
            this.stopCutIndicator();
            // 時間更新は停止するが、最後の位置は保持
            this.stopTimeUpdater();
            
            // 再生ボタンのテキストを更新
            this.playBtn.textContent = '▶️ 再生（続きから）';
            
            console.log('⏸️ 一時停止:', this.pausedTime.toFixed(2), '秒で停止');
            console.log('次回再生時は', this.pausedTime.toFixed(2), '秒から再開します');
        }
    }
    
    stopAudio() {
        if (this.audioSource) {
            // onendedイベントハンドラーを無効化
            this.audioSource.onended = null;
            this.audioSource.stop();
            this.audioSource = null;
            this.isPlaying = false;
            this.isPaused = false;
            this.pausedTime = 0;
            this.currentTime = 0;
            this.playStartOffset = 0;
            
            this.playBtn.disabled = false;
            this.pauseBtn.disabled = true;
            this.stopBtn.disabled = true;
            
            this.stopCutIndicator();
            this.stopTimeUpdater();
            
            // 時間表示をリセット
            this.updateTimeDisplay();
            
            // 再生ボタンのテキストを更新して先頭再生であることを明示
            this.playBtn.textContent = '▶️ 再生（先頭から）';
            
            console.log('🛑 完全停止 - 次回再生時は先頭（0秒）から開始します');
            console.log('状態リセット: currentTime=0, pausedTime=0, playStartOffset=0, isPaused=false');
        }
    }

    reset() {
        this.stopAudio();
        
        this.audioBuffer = null;
        this.beats = [];
        this.onsets = [];
        this.bpm = 0;
        this.duration = 0;
        this.timeSignature = 4;
        this.firstDownbeatTime = 0;
        this.offsetAdjustment = 0;
        this.manualCutPositions = [];
        this.lastGenerationWithMusic = true;
        this.audioStartTime = 0;
        this.currentTime = 0;
        this.isPaused = false;
        this.pausedTime = 0;
        this.playStartOffset = 0;
        
        this.results.style.display = 'none';
        this.adjustmentControls.style.display = 'none';
        this.uploadArea.innerHTML = `
            <div style="font-size: 3em; margin-bottom: 15px;">🎶</div>
            <div style="font-size: 1.2em; margin-bottom: 10px;">音楽ファイルをドロップまたはクリック</div>
            <div style="font-size: 0.9em; opacity: 0.8;">対応形式: MP3, WAV, M4A</div>
        `;
        
        this.analyzeBtn.disabled = true;
        this.playBtn.disabled = true;
        this.pauseBtn.disabled = true;
        this.resetBtn.disabled = true;
        this.audioFile.value = '';
        this.videoFilesInput.value = '';
        this.videoFiles = [];
        this.videoElements = [];
        this.videoUploadArea.style.display = 'none';
        this.videoPreview.style.display = 'none';
        this.autoEditSection.style.display = 'none';
        this.editResult.style.display = 'none';
        this.generatedVideoBlob = null;
        this.staticPreviewBlob = null;
        this.isVideoGenerated = false;
    }

    async startAutoEdit() {
        if (this.videoFiles.length === 0) {
            alert('映像ファイルを選択してください');
            return;
        }
        
        if (this.beats.length === 0) {
            alert('先に音楽のビート解析を実行してください');
            return;
        }
        
        // v2新機能: 選択されたパターンを取得
        const selectedPattern = document.querySelector('input[name="videoPattern"]:checked')?.value || 'food-focused';

        try {
            // 音楽再生設定を保存
            const shouldPlayMusic = this.playMusicDuringEditCheckbox && this.playMusicDuringEditCheckbox.checked;
            this.lastGenerationWithMusic = shouldPlayMusic;
            
            const videoSize = this.getVideoSize();
            const fps = this.getFramerate();
            const selectedSizeText = this.videoSizeSelect ? this.videoSizeSelect.options[this.videoSizeSelect.selectedIndex].text : 'デフォルト';
            const selectedFpsText = this.framerateSelect ? this.framerateSelect.options[this.framerateSelect.selectedIndex].text : '30fps';
            
            console.log('=== 自動編集開始 ===');
            console.log('📱 動画サイズ:', selectedSizeText, `(${videoSize.width}×${videoSize.height})`);
            console.log('🎬 フレームレート:', selectedFpsText, `(${fps}fps)`);
            console.log('🎵 音楽再生設定:', shouldPlayMusic ? 'ON（音楽付き動画生成）' : 'OFF（映像のみ動画生成）');
            console.log('✂️ 手動調整:', this.manualCutPositions.length > 0 ? `${this.manualCutPositions.length}個の手動カット位置` : 'オフセット調整値: ' + this.offsetAdjustment.toFixed(3) + '秒');
            this.startAutoEditBtn.disabled = true;
            this.editProgress.style.display = 'block';
            this.updateProgress(0, '編集を準備中...');

            // カット位置を計算（手動調整を反映）
            const cutPositions = this.calculateCutPositions();
            console.log('カット位置:', cutPositions.length, '個');
            console.log('調整後のカット位置:', cutPositions.slice(0, 3).map(t => t.toFixed(2) + 's').join(', '), '...');
            console.log('🎨 選択パターン:', selectedPattern);

            // v2新機能: パターンに基づいた映像編集計画を作成
            const basePlan = this.createEditPlan(cutPositions);
            const editPlan = selectedPattern !== 'food-focused' ? this.adjustPlanByPattern(basePlan, selectedPattern) : basePlan;
            console.log('編集計画:', editPlan.length, 'セグメント');

            this.updateProgress(10, 'Canvas準備中...');
            console.log('Canvas準備開始');

            // 実際の動画生成を実行
            const videoBlob = await this.generateVideo(editPlan);
            this.generatedVideoBlob = videoBlob;
            
            // 動画かどうかを判定
            this.isVideoGenerated = videoBlob.type.startsWith('video/');
            const musicStatus = this.lastGenerationWithMusic ? '音楽付き' : '映像のみ';
            console.log('生成完了:', videoBlob.size, 'bytes', this.isVideoGenerated ? `(${musicStatus}動画)` : '(画像)');

            this.updateProgress(100, '編集完了！');

            // 結果を表示
            setTimeout(() => {
                this.editProgress.style.display = 'none';
                this.startAutoEditBtn.disabled = false;
                this.displayEditResult(editPlan);
                console.log('=== 自動編集完了 ===');
            }, 500);

        } catch (error) {
            console.error('Auto edit error:', error);
            alert('自動編集中にエラーが発生しました: ' + error.message);
            this.editProgress.style.display = 'none';
            this.startAutoEditBtn.disabled = false;
        }
    }

    createEditPlan(cutPositions) {
        const plan = [];
        const videoCount = this.videoFiles.length;
        
        console.log(`編集計画作成: ${videoCount}個の映像ファイル, ${cutPositions.length - 1}セグメント`);
        
        for (let i = 0; i < cutPositions.length - 1; i++) {
            const startTime = cutPositions[i];
            const endTime = cutPositions[i + 1];
            const duration = endTime - startTime;
            
            // 映像を順番に割り当て（循環使用）
            const videoIndex = i % videoCount;
            
            console.log(`セグメント ${i + 1}: 映像${videoIndex + 1} (${this.videoFiles[videoIndex].name.substring(0, 20)})`);
            
            plan.push({
                videoIndex: videoIndex,
                videoFile: this.videoFiles[videoIndex],
                startTime: startTime,
                endTime: endTime,
                duration: duration,
                segmentIndex: i
            });
        }
        
        return plan;
    }

    async generateVideo(editPlan) {
        console.log('動画生成開始');
        
        // まず静的プレビューを生成
        const previewBlob = await this.generateStaticPreview(editPlan);
        this.staticPreviewBlob = previewBlob;
        
        // 次に実際の動画を生成
        try {
            const videoBlob = await this.generateActualVideo(editPlan);
            console.log('動画生成成功:', videoBlob.size, 'bytes');
            return videoBlob;
        } catch (error) {
            console.log('動画生成失敗、静的プレビューを返す:', error.message);
            // 動画生成に失敗した場合は静的プレビューを返す
            return previewBlob;
        }
    }

    async generateStaticPreview(editPlan) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 選択された動画サイズを取得
        const videoSize = this.getVideoSize();
        canvas.width = videoSize.width;
        canvas.height = videoSize.height;

        await this.renderStaticPreview(canvas, ctx, editPlan);
        
        return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png');
        });
    }

    async generateActualVideo(editPlan) {
        // 映像要素が準備されているかチェック
        if (this.videoElements.length === 0) {
            throw new Error('映像ファイルが準備されていません');
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 選択された動画サイズを取得
        const videoSize = this.getVideoSize();
        canvas.width = videoSize.width;
        canvas.height = videoSize.height;
        
        console.log(`🎬 Canvas設定: ${videoSize.width}×${videoSize.height}`);

        // 音楽用のAudio要素を準備（現在のチェックボックスの状態に応じて）
        let audioTrack = null;
        const shouldPlayMusic = this.playMusicDuringEditCheckbox?.checked ?? true; // デフォルトは音楽ありに変更
        
        console.log('🎵 音楽設定確認:', {
            audioBufferExists: !!this.audioBuffer,
            shouldPlayMusic: shouldPlayMusic,
            checkboxValue: this.playMusicDuringEditCheckbox?.checked
        });
        
        if (this.audioBuffer && shouldPlayMusic) {
            console.log('🎵 編集中に音楽を再生します');
            audioTrack = await this.prepareAudioTrack();
        } else if (this.audioBuffer && !shouldPlayMusic) {
            console.log('🔇 編集中の音楽再生をスキップします（軽量化モード）');
        }

        // ブラウザサポートをチェック（iOS/Android対応）
        let supportedTypes;
        if (this.isIOS) {
            // iOS: MP4優先
            supportedTypes = [
                'video/mp4;codecs=h264,aac',
                'video/mp4;codecs=h264',
                'video/mp4',
                'video/webm;codecs=vp8',
                'video/webm;codecs=h264',
                'video/webm'
            ];
        } else if (this.isAndroid) {
            // Android: WebM優先、MP4もサポート
            supportedTypes = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/mp4;codecs=h264,aac',
                'video/mp4;codecs=h264',
                'video/mp4',
                'video/webm'
            ];
        } else {
            // デスクトップ: WebM優先
            supportedTypes = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm;codecs=h264',
                'video/webm',
                'video/mp4;codecs=h264,aac',
                'video/mp4'
            ];
        }

        let mimeType = null;
        for (const type of supportedTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                mimeType = type;
                console.log('使用するコーデック:', type);
                break;
            }
        }

        if (!mimeType) {
            throw new Error('対応するビデオコーデックが見つかりません');
        }

        // Canvas映像ストリーム（選択されたフレームレートを使用）
        const fps = this.getFramerate();
        const videoStream = canvas.captureStream(fps);
        console.log(`🎬 Canvas FPS設定: ${fps}fps`);
        
        // 音楽がある場合は音声トラックを追加
        let combinedStream = videoStream;
        if (audioTrack && shouldPlayMusic) {
            try {
                // Web Audio APIを使用してAudioBufferから音声ストリームを作成
                const audioStream = await this.createAudioStreamFromBuffer();
                if (audioStream) {
                    combinedStream = new MediaStream([
                        ...videoStream.getVideoTracks(),
                        ...audioStream.getAudioTracks()
                    ]);
                    console.log('🎵 Web Audio API音声トラック付きストリームを作成');
                } else {
                    // フォールバック: Audio要素のcaptureStream
                    const fallbackStream = audioTrack.captureStream ? audioTrack.captureStream() : null;
                    if (fallbackStream) {
                        combinedStream = new MediaStream([
                            ...videoStream.getVideoTracks(),
                            ...fallbackStream.getAudioTracks()
                        ]);
                        console.log('🎵 Audio.captureStream() 音声トラック付きストリームを作成');
                    } else {
                        console.warn('音声ストリーム作成失敗、映像のみで録画');
                    }
                }
            } catch (error) {
                console.warn('音声ストリーム取得エラー:', error);
            }
        } else {
            console.log('🔇 映像のみのストリームで録画');
        }
        
        // 解像度とフレームレートに応じてビットレートを調整
        let baseBitrate;
        const totalPixels = videoSize.width * videoSize.height;
        
        if (totalPixels >= 1920 * 1080) {
            baseBitrate = 8000000; // 8Mbps (フルHD)
        } else if (totalPixels >= 1080 * 1080) {
            baseBitrate = 6000000; // 6Mbps (1080p正方形)
        } else if (totalPixels >= 1280 * 720) {
            baseBitrate = 4000000; // 4Mbps (HD)
        } else {
            baseBitrate = 2500000; // 2.5Mbps (低解像度)
        }
        
        // フレームレートによる調整（30fpsを基準とする）
        const fpsMultiplier = fps / 30;
        const videoBitrate = Math.floor(baseBitrate * fpsMultiplier);
        
        const recorderOptions = { 
            mimeType: mimeType,
            videoBitsPerSecond: videoBitrate
        };
        
        console.log(`📊 ビットレート設定: ${(videoBitrate/1000000).toFixed(1)}Mbps (${videoSize.width}×${videoSize.height}, ${fps}fps)`);
        
        if (audioTrack && shouldPlayMusic) {
            recorderOptions.audioBitsPerSecond = 128000; // 128kbps音声（高品質）
            console.log('🎵 音声付き録画設定:', recorderOptions);
        } else {
            console.log('🔇 映像のみ録画設定:', recorderOptions);
        }
        
        const mediaRecorder = new MediaRecorder(combinedStream, recorderOptions);

        const chunks = [];
        
        return new Promise((resolve, reject) => {
            // タイムアウト設定（2分に大幅延長）
            const timeout = setTimeout(() => {
                console.warn('⚠️ 動画生成タイムアウト（2分）- 録画を強制停止');
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
                reject(new Error('動画生成がタイムアウトしました（2分）'));
            }, 120000);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    chunks.push(event.data);
                    console.log('録画データ受信:', event.data.size, 'bytes');
                }
            };

            mediaRecorder.onstop = () => {
                clearTimeout(timeout);
                if (chunks.length > 0) {
                    const videoBlob = new Blob(chunks, { type: mimeType });
                    console.log('動画録画完了:', videoBlob.size, 'bytes');
                    resolve(videoBlob);
                } else {
                    reject(new Error('録画データが生成されませんでした'));
                }
            };

            mediaRecorder.onerror = (event) => {
                clearTimeout(timeout);
                console.error('MediaRecorder エラー:', event.error);
                reject(event.error);
            };

            // 録画開始
            mediaRecorder.start(1000);
            console.log('MediaRecorder 開始:', mimeType);

            // 音楽と動画生成を非同期で実行
            (async () => {
                try {
                    // 音楽の再生を開始（オプションに応じて）
                    if (audioTrack && shouldPlayMusic) {
                        try {
                            await audioTrack.play();
                            console.log('🎵 編集中の音楽再生開始');
                        } catch (error) {
                            console.warn('音楽再生エラー:', error);
                        }
                    } else {
                        console.log('🔇 音楽なしで動画生成を開始');
                    }

                    // 短時間で動画を生成
                    await this.renderQuickVideo(canvas, ctx, editPlan);
                    
                    // 音楽を停止
                    if (audioTrack && shouldPlayMusic) {
                        audioTrack.pause();
                        audioTrack.currentTime = 0;
                        console.log('🎵 編集中の音楽再生終了');
                    }
                    
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                } catch (error) {
                    if (audioTrack && shouldPlayMusic) {
                        audioTrack.pause();
                    }
                    clearTimeout(timeout);
                    reject(error);
                }
            })();
        });
    }

    optimizeSegmentOrder(segments, availableVideos) {
        // 各映像が最低1回は使用されるように最適化
        const result = [];
        const videoUsageCount = new Array(availableVideos).fill(0);
        
        // 第1フェーズ: まず各映像を1回ずつ使用
        const unusedVideos = Array.from({length: availableVideos}, (_, i) => i);
        
        for (let i = 0; i < Math.min(segments.length, availableVideos); i++) {
            // まだ使用していない映像から選択
            let selectedVideoIndex;
            if (unusedVideos.length > 0) {
                // 元のセグメントで指定された映像がまだ未使用なら優先使用
                const originalVideoIndex = segments[i].videoIndex;
                if (unusedVideos.includes(originalVideoIndex)) {
                    selectedVideoIndex = originalVideoIndex;
                    unusedVideos.splice(unusedVideos.indexOf(originalVideoIndex), 1);
                } else {
                    // 未使用の映像をランダムに選択
                    const randomIndex = Math.floor(Math.random() * unusedVideos.length);
                    selectedVideoIndex = unusedVideos.splice(randomIndex, 1)[0];
                }
            } else {
                // 全映像を使用済みの場合は元の映像を使用
                selectedVideoIndex = segments[i].videoIndex;
            }
            
            // セグメントを複製して映像インデックスを変更
            const optimizedSegment = {
                ...segments[i],
                videoIndex: selectedVideoIndex,
                segmentIndex: i // セグメントインデックスを更新
            };
            
            result.push(optimizedSegment);
            videoUsageCount[selectedVideoIndex]++;
        }
        
        // 第2フェーズ: 残りのセグメントを追加（使用回数が少ない映像を優先）
        for (let i = availableVideos; i < segments.length; i++) {
            // 最も使用回数が少ない映像を選択
            let minUsage = Math.min(...videoUsageCount);
            let leastUsedVideoIndex = videoUsageCount.indexOf(minUsage);
            
            const optimizedSegment = {
                ...segments[i],
                videoIndex: leastUsedVideoIndex,
                segmentIndex: i
            };
            
            result.push(optimizedSegment);
            videoUsageCount[leastUsedVideoIndex]++;
        }
        
        console.log('映像使用回数:', videoUsageCount.map((count, index) => `映像${index + 1}: ${count}回`));
        
        return result;
    }

    async prepareAudioTrack() {
        try {
            // AudioBufferをAudio要素に変換
            const audioBlob = await this.audioBufferToBlob(this.audioBuffer);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const audio = new Audio(audioUrl);
            audio.volume = 0.7; // 音量を少し下げる
            
            return new Promise((resolve, reject) => {
                audio.addEventListener('canplaythrough', () => {
                    console.log('音楽準備完了');
                    resolve(audio);
                });
                audio.addEventListener('error', reject);
                audio.load();
            });
        } catch (error) {
            console.error('音楽準備エラー:', error);
            return null;
        }
    }
    
    async createAudioStreamFromBuffer() {
        try {
            if (!this.audioBuffer || !this.audioContext) {
                console.warn('AudioBufferまたはAudioContextが利用できません');
                return null;
            }
            
            // iOS対応：AudioContextのサスペンド状態をチェック
            if (this.isIOS && this.audioContext.state === 'suspended') {
                console.log('📱 iOS: AudioContextを再開します');
                await this.audioContext.resume();
            }
            
            // Web Audio APIを使用してMediaStreamを作成
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const destination = audioContext.createMediaStreamDestination();
            
            // AudioBufferSourceNodeを作成
            const source = audioContext.createBufferSource();
            source.buffer = this.audioBuffer;
            source.loop = false;
            
            // ゲインノードを追加（音量調整）
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.7;
            
            // 接続
            source.connect(gainNode);
            gainNode.connect(destination);
            
            console.log('🎵 Web Audio API音声ストリーム作成成功');
            
            // 音声再生を開始（MediaStreamに音声を送るため）
            source.start(0);
            
            return destination.stream;
        } catch (error) {
            console.error('Web Audio API音声ストリーム作成エラー:', error);
            return null;
        }
    }

    async audioBufferToBlob(audioBuffer) {
        // AudioBufferをPCM WAVファイルに変換
        const length = audioBuffer.length;
        const sampleRate = audioBuffer.sampleRate;
        const channels = audioBuffer.numberOfChannels;
        
        const arrayBuffer = new ArrayBuffer(44 + length * channels * 2);
        const view = new DataView(arrayBuffer);
        
        // WAVヘッダー
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * channels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, channels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * channels * 2, true);
        view.setUint16(32, channels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * channels * 2, true);
        
        // PCMデータ
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < channels; channel++) {
                const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    async renderQuickVideo(canvas, ctx, editPlan) {
        console.log('🎬 手動調整を反映した動画生成を開始');
        console.log('📊 編集計画詳細:');
        editPlan.forEach((segment, index) => {
            const duration = segment.endTime - segment.startTime;
            console.log(`  セグメント${index + 1}: ${segment.startTime.toFixed(2)}s-${segment.endTime.toFixed(2)}s (${duration.toFixed(2)}s) - 映像${segment.videoIndex + 1}`);
        });
        
        // アップロードされた映像ファイル数に合わせてセグメント数を決定
        const availableVideos = this.videoElements.length;
        
        // 各映像が最低1回は使用されるように、かつ重複を最小化
        // 2分タイムアウトに合わせてセグメント数を調整
        let maxSegments;
        if (editPlan.length >= availableVideos) {
            // 十分なセグメントがある場合：映像数の2倍まで、最大8セグメント
            maxSegments = Math.min(editPlan.length, Math.min(availableVideos * 2, 8));
        } else {
            // セグメントが少ない場合：利用可能なセグメント数をすべて使用、最大8セグメント
            maxSegments = Math.min(editPlan.length, 8);
        }
        
        console.log(`${maxSegments}セグメントの動画を生成開始 (映像ファイル: ${availableVideos}個)`);
        
        // 開始時間を記録
        const startTime = Date.now();
        
        // セグメントを並び替えて映像の重複を最小化
        const optimizedSegments = this.optimizeSegmentOrder(editPlan.slice(0, maxSegments), availableVideos);
        
        // 使用される映像のリストを表示
        const usedVideos = new Set();
        optimizedSegments.forEach(segment => usedVideos.add(segment.videoIndex));
        console.log('使用される映像インデックス:', Array.from(usedVideos).sort());
        console.log('セグメント順序:', optimizedSegments.map(s => `映像${s.videoIndex + 1}`).join(' → '));
        
        // 実際のタイミングでカット切り替えを実行
        for (let i = 0; i < optimizedSegments.length; i++) {
            const segment = optimizedSegments[i];
            const originalSegment = editPlan.find(s => Math.abs(s.startTime - segment.startTime) < 0.01);
            const segmentDuration = originalSegment ? (originalSegment.endTime - originalSegment.startTime) : 1.2;
            
            const progress = 30 + (i / optimizedSegments.length) * 60;
            const timeElapsed = Date.now() - startTime;
            const avgTimePerSegment = timeElapsed / (i + 1);
            const estimatedTimeRemaining = ((optimizedSegments.length - i - 1) * avgTimePerSegment) / 1000;
            
            this.updateProgress(progress, `映像セグメント ${i + 1}/${optimizedSegments.length} を生成中... (${segmentDuration.toFixed(1)}秒, 経過: ${(timeElapsed/1000).toFixed(1)}s, 残り推定: ${estimatedTimeRemaining.toFixed(0)}s)`);
            
            console.log(`⏱️ セグメント${i + 1}: ${segmentDuration.toFixed(2)}秒間 - 映像${segment.videoIndex + 1}を使用 (経過時間: ${(timeElapsed/1000).toFixed(1)}s, 残り推定: ${estimatedTimeRemaining.toFixed(0)}s)`);
            
            // 対応する映像要素を取得
            const videoElement = this.videoElements[segment.videoIndex];
            if (!videoElement) {
                console.warn(`映像要素 ${segment.videoIndex} が見つかりません`);
                continue;
            }

            // 映像をユーザー指定位置または魅力的な位置から再生開始
            try {
                const videoDuration = videoElement.duration;
                let startTime;
                
                // ユーザーが指定した開始時間を使用（設定されている場合）
                if (this.videoStartTimes && this.videoStartTimes[segment.videoIndex] !== undefined) {
                    startTime = this.videoStartTimes[segment.videoIndex];
                    console.log(`映像${segment.videoIndex + 1}: ユーザー指定位置 ${startTime.toFixed(1)}s から開始`);
                } else {
                    // フォールバック：セグメントインデックスに基づいて異なる部分を使用
                    if (videoDuration > 10) {
                        // 長い動画の場合：開始、中間前、中間、中間後、終盤から選択
                        const sections = [0.1, 0.3, 0.5, 0.7, 0.85];
                        const sectionIndex = segment.segmentIndex % sections.length;
                        startTime = videoDuration * sections[sectionIndex];
                    } else {
                        // 短い動画の場合：ランダムな位置（ただし端は避ける）
                        const startRatio = 0.1 + Math.random() * 0.8; // 10%-90%
                        startTime = videoDuration * startRatio;
                    }
                    console.log(`映像${segment.videoIndex + 1}: 自動選択位置 ${startTime.toFixed(1)}s から開始 (全長: ${videoDuration.toFixed(1)}s)`);
                }
                
                // 映像の終端近くにならないよう調整
                const maxStartTime = Math.max(0, videoDuration - 2); // 最低2秒は残す
                startTime = Math.min(startTime, maxStartTime);
                
                videoElement.currentTime = startTime;
                await videoElement.play();
            } catch (error) {
                console.warn('映像再生エラー:', error);
            }
            
            // 実際のセグメント持続時間でレンダリング（手動調整を反映）
            const actualDuration = Math.max(0.8, Math.min(segmentDuration, 4.0)); // 0.8秒～4秒の範囲で制限
            const selectedFps = this.getFramerate();
            const frames = Math.floor(actualDuration * selectedFps); // 実際の持続時間に基づくフレーム数
            const frameInterval = 1000 / selectedFps; // FPSに基づく正確な間隔
            
            console.log(`📸 ${frames}フレーム生成 (${actualDuration.toFixed(2)}秒, ${frameInterval.toFixed(1)}ms間隔)`);
            
            for (let frame = 0; frame < frames; frame++) {
                // 映像の時間を計算（滑らかな進行のため）
                const frameProgress = frame / frames;
                const videoTargetTime = startTime + (frameProgress * actualDuration);
                
                // 映像の時間を適切に設定（滑らかな動きのため）
                if (videoElement.duration > videoTargetTime) {
                    // 時間の変更を小刻みに行い、滑らかな動きを実現
                    const currentTime = videoElement.currentTime;
                    const timeDelta = videoTargetTime - currentTime;
                    
                    // 大きな時間ジャンプを避けて滑らかに進める
                    if (Math.abs(timeDelta) < 0.1) {
                        videoElement.currentTime = videoTargetTime;
                    } else {
                        // 段階的に時間を更新
                        videoElement.currentTime = currentTime + Math.sign(timeDelta) * Math.min(Math.abs(timeDelta), 0.05);
                    }
                    
                    // 映像フレームが更新されるまで短時間待機
                    await new Promise(resolve => {
                        const checkReady = () => {
                            if (videoElement.readyState >= 2) {
                                resolve();
                            } else {
                                setTimeout(checkReady, 5); // 5ms後に再チェック
                            }
                        };
                        checkReady();
                    });
                }
                
                // Canvasをクリア
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // 映像をCanvasに描画
                if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA以上
                    this.drawVideoToCanvas(ctx, videoElement, canvas.width, canvas.height);
                } else {
                    // 映像が準備できていない場合はプレースホルダーを表示
                    ctx.fillStyle = '#333';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = 'white';
                    ctx.font = '24px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('映像読み込み中...', canvas.width / 2, canvas.height / 2);
                }
                
                // セグメント情報をオーバーレイ
                this.drawSegmentOverlay(ctx, segment, canvas.width, canvas.height, frame, frames);
                
                // 時間ベースのテロップを描画
                const currentVideoTime = segment.startTime + ((frame) / frames) * (segment.endTime - segment.startTime);
                this.drawActiveTelopsByTime(ctx, canvas.width, canvas.height, currentVideoTime);
                
                // フレーム間の適切な間隔を保つ（レンダリング時間を考慮）
                const frameStartTime = Date.now();
                await new Promise(resolve => {
                    const targetDelay = Math.max(10, frameInterval - (Date.now() - frameStartTime));
                    setTimeout(resolve, targetDelay);
                });
            }
            
            // 映像を一時停止
            videoElement.pause();
        }
    }

    drawVideoToCanvas(ctx, videoElement, canvasWidth, canvasHeight) {
        const videoWidth = videoElement.videoWidth;
        const videoHeight = videoElement.videoHeight;
        
        if (videoWidth === 0 || videoHeight === 0) return;
        
        // アスペクト比を保ってCanvasに映像を描画
        const videoAspect = videoWidth / videoHeight;
        const canvasAspect = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (videoAspect > canvasAspect) {
            // 映像が横長の場合、幅に合わせる
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / videoAspect;
            drawX = 0;
            drawY = (canvasHeight - drawHeight) / 2;
        } else {
            // 映像が縦長の場合、高さに合わせる
            drawHeight = canvasHeight;
            drawWidth = canvasHeight * videoAspect;
            drawX = (canvasWidth - drawWidth) / 2;
            drawY = 0;
        }
        
        // 背景を黒で塗りつぶし
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // 映像を描画
        ctx.drawImage(videoElement, drawX, drawY, drawWidth, drawHeight);
    }

    drawSegmentOverlay(ctx, segment, canvasWidth, canvasHeight, frame, totalFrames) {
        // 半透明の情報バー
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, canvasHeight - 60, canvasWidth, 60);
        
        // セグメント情報
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`映像 ${segment.videoIndex + 1}: ${segment.videoFile.name.substring(0, 30)}`, 10, canvasHeight - 35);
        
        ctx.font = '14px Arial';
        ctx.fillText(`${segment.startTime.toFixed(1)}s - ${segment.endTime.toFixed(1)}s`, 10, canvasHeight - 15);
        
        // プログレスバー
        const barWidth = 200;
        const barHeight = 4;
        const barX = canvasWidth - barWidth - 10;
        const barY = canvasHeight - 30;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(barX, barY, (frame / totalFrames) * barWidth, barHeight);
    }

    async renderStaticPreview(canvas, ctx, editPlan) {
        console.log('静的プレビュー生成中...');
        
        // 背景を描画
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // タイトル
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎬 自動編集プレビュー', canvas.width / 2, 50);

        // 編集サマリー情報
        const maxSegments = Math.min(editPlan.length, 8);
        const startY = 100;
        const rowHeight = 30;

        ctx.font = '18px Arial';
        ctx.fillText(`📊 ${editPlan.length} セグメント (${this.videoFiles.length} 映像使用)`, canvas.width / 2, startY);
        
        ctx.font = '14px Arial';
        ctx.fillText(`BPM: ${this.bpm} | 拍子: ${this.timeSignature}/4`, canvas.width / 2, startY + 25);

        // セグメント一覧を表示
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        for (let i = 0; i < maxSegments; i++) {
            const segment = editPlan[i];
            const y = startY + 60 + (i * rowHeight);
            
            // セグメント背景
            const hue = (i * 45) % 360;
            ctx.fillStyle = `hsla(${hue}, 60%, 50%, 0.3)`;
            ctx.fillRect(50, y - 15, canvas.width - 100, 25);
            
            // セグメント情報
            ctx.fillStyle = 'white';
            ctx.fillText(
                `${i + 1}. ${segment.startTime.toFixed(1)}s-${segment.endTime.toFixed(1)}s: 映像${segment.videoIndex + 1} (${segment.videoFile.name.substring(0, 25)})`,
                60, y
            );
            
            // 進捗更新
            const progress = 30 + (i / maxSegments) * 60;
            this.updateProgress(progress, `プレビュー生成中... ${i + 1}/${maxSegments}`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (editPlan.length > maxSegments) {
            const y = startY + 60 + (maxSegments * rowHeight);
            ctx.fillText(`...他 ${editPlan.length - maxSegments} セグメント`, 60, y);
        }

        // フッター
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('💡 実際の動画では音楽のビートに合わせて映像が切り替わります', canvas.width / 2, canvas.height - 30);
        
        this.updateProgress(90, 'プレビュー最終化中...');
        await new Promise(resolve => setTimeout(resolve, 200));
    }


    updateProgress(percent, text) {
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = text;
    }

    displayEditResult(editPlan) {
        this.resultVideo.innerHTML = '';
        
        if (this.isVideoGenerated) {
            // 動画プレビューを表示
            const video = document.createElement('video');
            video.controls = true;
            video.loop = true;
            video.style.width = '100%';
            video.style.maxWidth = '640px';
            video.style.borderRadius = '8px';
            video.style.border = '2px solid #4CAF50';
            
            const videoUrl = URL.createObjectURL(this.generatedVideoBlob);
            video.src = videoUrl;
            
            this.resultVideo.appendChild(video);
            
            // プレビューボタンのテキストを更新
            const musicIcon = this.lastGenerationWithMusic ? '🎵' : '🔇';
            this.previewBtn.textContent = `${musicIcon} プレビュー`;
            
            // 静的プレビューも追加表示
            if (this.staticPreviewBlob) {
                const img = document.createElement('img');
                img.style.width = '100%';
                img.style.maxWidth = '320px';
                img.style.borderRadius = '8px';
                img.style.border = '1px solid #ccc';
                img.style.marginTop = '15px';
                img.src = URL.createObjectURL(this.staticPreviewBlob);
                img.alt = '編集プレビュー';
                
                const caption = document.createElement('div');
                caption.style.textAlign = 'center';
                caption.style.fontSize = '14px';
                caption.style.color = 'rgba(255,255,255,0.8)';
                caption.style.marginTop = '5px';
                caption.textContent = '📊 編集計画プレビュー';
                
                this.resultVideo.appendChild(img);
                this.resultVideo.appendChild(caption);
            }
        } else {
            // 画像プレビューを表示（動画生成失敗時）
            const img = document.createElement('img');
            img.style.width = '100%';
            img.style.maxWidth = '640px';
            img.style.borderRadius = '8px';
            img.style.border = '2px solid #ff9800';
            
            const imageUrl = URL.createObjectURL(this.generatedVideoBlob);
            img.src = imageUrl;
            img.alt = '編集プレビュー';
            
            const notice = document.createElement('div');
            notice.style.textAlign = 'center';
            notice.style.color = '#ff9800';
            notice.style.marginTop = '10px';
            notice.style.fontSize = '14px';
            notice.textContent = '⚠️ 動画生成に失敗したため、静的プレビューを表示しています';
            
            this.resultVideo.appendChild(img);
            this.resultVideo.appendChild(notice);
        }

        // 編集サマリーを表示
        const totalDuration = editPlan.reduce((sum, segment) => sum + segment.duration, 0);
        const uniqueVideos = new Set(editPlan.map(segment => segment.videoIndex)).size;
        
        const musicStatusText = this.lastGenerationWithMusic ? '🎵 音楽付き' : '🔇 映像のみ';
        const videoSize = this.getVideoSize();
        const fps = this.getFramerate();
        const selectedSizeText = this.videoSizeSelect ? this.videoSizeSelect.options[this.videoSizeSelect.selectedIndex].text : '1280×720';
        const selectedFpsText = this.framerateSelect ? this.framerateSelect.options[this.framerateSelect.selectedIndex].text : '30fps';
        
        this.editSummary.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: #4CAF50;">📊 編集サマリー</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                <div><strong>セグメント数:</strong> ${editPlan.length}個</div>
                <div><strong>使用映像:</strong> ${uniqueVideos}/${this.videoFiles.length}本</div>
                <div><strong>総再生時間:</strong> ${totalDuration.toFixed(1)}秒</div>
                <div><strong>音楽BPM:</strong> ${this.bpm}</div>
                <div style="grid-column: 1/-1;"><strong>動画サイズ:</strong> ${selectedSizeText}</div>
                <div style="grid-column: 1/-1;"><strong>フレームレート:</strong> ${selectedFpsText}</div>
                <div style="grid-column: 1/-1;"><strong>動画タイプ:</strong> ${musicStatusText}</div>
            </div>
            <div style="margin-top: 15px;">
                <strong>🎵 切り替えタイミング:</strong><br>
                ${editPlan.slice(0, 5).map((segment, i) => 
                    `${i + 1}. ${segment.startTime.toFixed(1)}s - ${segment.endTime.toFixed(1)}s (映像${segment.videoIndex + 1})`
                ).join('<br>')}
                ${editPlan.length > 5 ? `<br>...他 ${editPlan.length - 5} セグメント` : ''}
            </div>
        `;

        // 結果セクションを表示
        this.editResult.style.display = 'block';
        
        // 編集詳細ボタンの状態を初期化（非表示状態）
        if (this.toggleSummaryBtn) {
            this.toggleSummaryBtn.textContent = '📊 編集詳細を表示';
            this.toggleSummaryBtn.classList.remove('btn-primary');
            this.toggleSummaryBtn.classList.add('btn-secondary');
        }
        
        this.editResult.scrollIntoView({ behavior: 'smooth' });
    }

    downloadVideo() {
        if (!this.generatedVideoBlob) {
            alert('ダウンロードするファイルがありません');
            return;
        }

        const url = URL.createObjectURL(this.generatedVideoBlob);
        const a = document.createElement('a');
        a.href = url;
        
        if (this.isVideoGenerated) {
            // 動画ファイル
            const extension = this.generatedVideoBlob.type.includes('webm') ? 'webm' : 'mp4';
            a.download = `beat-synced-video-${Date.now()}.${extension}`;
        } else {
            // 画像ファイル
            a.download = `beat-synced-preview-${Date.now()}.png`;
        }
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 成功メッセージ
        const originalText = this.downloadBtn.textContent;
        this.downloadBtn.textContent = '✅ ダウンロード開始!';
        setTimeout(() => {
            this.downloadBtn.textContent = originalText;
        }, 2000);
    }

    previewVideo() {
        if (this.isVideoGenerated) {
            // 動画の場合：再生/一時停止
            const video = this.resultVideo.querySelector('video');
            if (video) {
                if (video.paused) {
                    video.play();
                    this.previewBtn.textContent = '⏸️ 一時停止';
                } else {
                    video.pause();
                    this.previewBtn.textContent = '▶️ 再生';
                }
            }
        } else {
            // 画像の場合：新しいタブで表示
            const img = this.resultVideo.querySelector('img');
            if (img) {
                const newWindow = window.open();
                newWindow.document.write(`
                    <html>
                        <head><title>編集プレビュー</title></head>
                        <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #333;">
                            <img src="${img.src}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="編集プレビュー">
                        </body>
                    </html>
                `);
                
                // 成功メッセージ
                const originalText = this.previewBtn.textContent;
                this.previewBtn.textContent = '✅ 新しいタブで表示!';
                setTimeout(() => {
                    this.previewBtn.textContent = originalText;
                }, 2000);
            }
        }
    }
    
    // === 高度なテロップ関連メソッド ===
    
    addTelop() {
        if (!this.newTelopText?.value.trim()) {
            alert('テロップのテキストを入力してください');
            return;
        }
        
        const startTime = parseFloat(this.newTelopStartTime?.value || 0);
        const endTime = parseFloat(this.newTelopEndTime?.value || 5);
        
        if (startTime >= endTime) {
            alert('終了時間は開始時間より後に設定してください');
            return;
        }
        
        const telop = {
            id: ++this.telopIdCounter,
            text: this.newTelopText.value.trim(),
            startTime: startTime,
            endTime: endTime,
            positionX: this.newTelopPositionX?.value || 'center',
            positionY: this.newTelopPositionY?.value || 'bottom',
            font: this.newTelopFont?.value || 'Arial',
            fontSize: this.newTelopFontSize?.value || 'medium',
            color: this.newTelopColor?.value || 'white',
            customColor: this.newTelopCustomColor?.value || '#ffffff',
            outline: this.newTelopOutline?.checked || false,
            background: this.newTelopBackground?.checked || false,
            bold: this.newTelopBold?.checked || false
        };
        
        this.telops.push(telop);
        this.renderTelopList();
        this.clearTelopForm();
        
        console.log('🏷️ テロップ追加:', telop);
    }
    
    clearTelopForm() {
        if (this.newTelopText) this.newTelopText.value = '';
        if (this.newTelopStartTime) this.newTelopStartTime.value = '0';
        if (this.newTelopEndTime) this.newTelopEndTime.value = '5';
    }
    
    renderTelopList() {
        if (!this.telopList) return;
        
        if (this.telops.length === 0) {
            this.telopList.innerHTML = `
                <div style="text-align: center; color: var(--secondary-text); padding: 1rem;">
                    まだテロップが登録されていません
                </div>
            `;
            return;
        }
        
        const sortedTelops = [...this.telops].sort((a, b) => a.startTime - b.startTime);
        
        this.telopList.innerHTML = sortedTelops.map(telop => `
            <div style="background: var(--hover-bg); border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.5rem; border: 1px solid var(--border);">
                <div style="display: flex; justify-content: between; align-items: flex-start; gap: 1rem;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--primary-text); margin-bottom: 0.5rem; font-size: 1rem;">
                            "${telop.text}"
                        </div>
                        <div style="font-size: 0.8rem; color: var(--secondary-text); display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                            <div>⏰ ${telop.startTime}s - ${telop.endTime}s</div>
                            <div>📍 ${telop.positionX} / ${telop.positionY}</div>
                            <div>🔤 ${telop.font} (${telop.fontSize})</div>
                            <div style="display: flex; align-items: center; gap: 0.25rem;">
                                🎨 ${this.getColorDisplayName(telop.color, telop.customColor)}
                                ${telop.outline ? '⭕ 輪郭' : ''}
                                ${telop.background ? '🔳 背景' : ''}
                                ${telop.bold ? '💪 太字' : ''}
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <button onclick="beatDetector.editTelop(${telop.id})" class="btn-secondary" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">
                            ✏️ 編集
                        </button>
                        <button onclick="beatDetector.deleteTelop(${telop.id})" class="btn-danger" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">
                            🗑️ 削除
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    getColorDisplayName(color, customColor) {
        const colorNames = {
            white: '白', black: '黒', red: '赤', blue: '青', yellow: '黄', green: '緑',
            orange: 'オレンジ', purple: '紫', pink: 'ピンク', cyan: 'シアン',
            'gradient-red': 'グラデ(赤→黄)', 'gradient-blue': 'グラデ(青→緑)', 
            'gradient-rainbow': 'レインボー', custom: `カスタム(${customColor})`
        };
        return colorNames[color] || color;
    }
    
    deleteTelop(id) {
        this.telops = this.telops.filter(telop => telop.id !== id);
        this.renderTelopList();
        console.log('🗑️ テロップ削除:', id);
    }
    
    editTelop(id) {
        const telop = this.telops.find(t => t.id === id);
        if (!telop) return;
        
        // フォームに値を設定
        if (this.newTelopText) this.newTelopText.value = telop.text;
        if (this.newTelopStartTime) this.newTelopStartTime.value = telop.startTime;
        if (this.newTelopEndTime) this.newTelopEndTime.value = telop.endTime;
        if (this.newTelopPositionX) this.newTelopPositionX.value = telop.positionX;
        if (this.newTelopPositionY) this.newTelopPositionY.value = telop.positionY;
        if (this.newTelopFont) this.newTelopFont.value = telop.font;
        if (this.newTelopFontSize) this.newTelopFontSize.value = telop.fontSize;
        if (this.newTelopColor) this.newTelopColor.value = telop.color;
        if (this.newTelopCustomColor) this.newTelopCustomColor.value = telop.customColor;
        if (this.newTelopOutline) this.newTelopOutline.checked = telop.outline;
        if (this.newTelopBackground) this.newTelopBackground.checked = telop.background;
        if (this.newTelopBold) this.newTelopBold.checked = telop.bold;
        
        // 元のテロップを削除
        this.deleteTelop(id);
        
        // スクロールしてフォームを表示
        this.newTelopText?.scrollIntoView({ behavior: 'smooth' });
    }
    
    async previewAllTelops() {
        if (this.telops.length === 0) {
            alert('プレビューするテロップがありません。まずテロップを追加してください');
            return;
        }
        
        console.log('👁️ 全テロッププレビュー開始');
        
        // プレビュー用キャンバスを作成
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 動画サイズを取得
        const videoSize = this.getVideoSize();
        canvas.width = videoSize.width;
        canvas.height = videoSize.height;
        
        // 背景色
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 中央に「サンプル映像」テキスト
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('サンプル映像', canvas.width / 2, canvas.height / 2);
        
        // 時間0秒時点でのテロップを描画
        this.drawActiveTelopsByTime(ctx, canvas.width, canvas.height, 0);
        
        // プレビューを表示
        const previewImg = canvas.toDataURL();
        const telopSummary = this.telops.map(t => 
            `"${t.text}" (${t.startTime}s-${t.endTime}s)`
        ).join('<br>');
        
        const previewWindow = window.open('', '_blank', 'width=900,height=700');
        previewWindow.document.write(`
            <html>
                <head>
                    <title>全テロッププレビュー</title>
                    <style>
                        body { 
                            margin: 0; 
                            padding: 20px; 
                            background: #222; 
                            color: white; 
                            font-family: Arial, sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                        }
                        .preview-info {
                            margin-bottom: 20px;
                            text-align: center;
                            max-width: 800px;
                        }
                        img { 
                            max-width: 100%; 
                            height: auto; 
                            border: 2px solid #444;
                            border-radius: 8px;
                            margin-bottom: 20px;
                        }
                        .telop-list {
                            background: #333;
                            padding: 15px;
                            border-radius: 8px;
                            max-width: 800px;
                            width: 100%;
                        }
                    </style>
                </head>
                <body>
                    <div class="preview-info">
                        <h2>📺 全テロッププレビュー</h2>
                        <p>動画サイズ: ${videoSize.width}×${videoSize.height}</p>
                        <p>登録テロップ数: ${this.telops.length}個</p>
                    </div>
                    <img src="${previewImg}" alt="テロッププレビュー">
                    <div class="telop-list">
                        <h3>📋 登録されたテロップ</h3>
                        <div style="font-size: 14px; line-height: 1.5;">
                            ${telopSummary}
                        </div>
                    </div>
                </body>
            </html>
        `);
        
        // ボタンフィードバック
        const originalText = this.previewAllTelopsBtn.textContent;
        this.previewAllTelopsBtn.textContent = '✅ プレビュー表示中!';
        setTimeout(() => {
            this.previewAllTelopsBtn.textContent = originalText;
        }, 2000);
    }
    
    drawActiveTelopsByTime(ctx, canvasWidth, canvasHeight, currentTime) {
        // 現在時刻で表示すべきテロップを取得
        const activeTelops = this.telops.filter(telop => 
            currentTime >= telop.startTime && currentTime <= telop.endTime
        );
        
        if (activeTelops.length === 0) return;
        
        // 複数テロップがある場合は自動配置
        if (activeTelops.length > 1) {
            this.drawMultipleTelopsSmart(ctx, canvasWidth, canvasHeight, activeTelops);
        } else {
            // 単一テロップの場合は通常描画
            this.drawSingleTelop(ctx, canvasWidth, canvasHeight, activeTelops[0]);
        }
    }
    
    drawMultipleTelopsSmart(ctx, canvasWidth, canvasHeight, telops) {
        // 位置タイプ別にグループ化
        const groupedTelops = {
            top: telops.filter(t => t.positionY === 'top'),
            center: telops.filter(t => t.positionY === 'center'), 
            bottom: telops.filter(t => t.positionY === 'bottom')
        };
        
        // 各位置グループで配置
        Object.keys(groupedTelops).forEach(position => {
            const group = groupedTelops[position];
            if (group.length === 0) return;
            
            // 同じ位置に複数ある場合は間隔を空けて配置
            group.forEach((telop, index) => {
                const adjustedTelop = { ...telop };
                
                if (group.length > 1) {
                    // 垂直方向のオフセットを計算
                    const baseY = this.getBaseYPosition(position, canvasHeight);
                    const spacing = canvasHeight * 0.08; // 8%間隔
                    const totalHeight = (group.length - 1) * spacing;
                    const startY = baseY - totalHeight / 2;
                    
                    // Y位置を調整（パーセンテージで指定）
                    const adjustedY = (startY + index * spacing) / canvasHeight;
                    adjustedTelop.customY = Math.max(0.05, Math.min(0.95, adjustedY));
                }
                
                this.drawSingleTelop(ctx, canvasWidth, canvasHeight, adjustedTelop);
            });
        });
    }
    
    getBaseYPosition(position, canvasHeight) {
        switch (position) {
            case 'top': return canvasHeight * 0.15;
            case 'center': return canvasHeight * 0.5;
            case 'bottom': return canvasHeight * 0.85;
            default: return canvasHeight * 0.5;
        }
    }
    
    drawSingleTelop(ctx, canvasWidth, canvasHeight, telop) {
        if (!telop.text.trim()) return;
        
        // フォントサイズを計算
        const fontSizes = {
            small: Math.floor(canvasWidth * 0.03),    // 24px相当
            medium: Math.floor(canvasWidth * 0.045),  // 36px相当
            large: Math.floor(canvasWidth * 0.06),    // 48px相当
            xlarge: Math.floor(canvasWidth * 0.075),  // 60px相当
            xxlarge: Math.floor(canvasWidth * 0.1)    // 80px相当
        };
        const fontSize = fontSizes[telop.fontSize] || fontSizes.medium;
        
        // フォント設定
        const fontWeight = telop.bold ? 'bold' : 'normal';
        ctx.font = `${fontWeight} ${fontSize}px "${telop.font}", sans-serif`;
        ctx.textAlign = telop.positionX;
        
        // テキスト位置を計算
        let x;
        switch (telop.positionX) {
            case 'left':
                x = canvasWidth * 0.05;
                break;
            case 'right':
                x = canvasWidth * 0.95;
                break;
            default: // center
                x = canvasWidth / 2;
        }
        
        let y;
        // customY が設定されている場合はそれを使用（複数テロップ配置用）
        if (telop.customY !== undefined) {
            y = canvasHeight * telop.customY + fontSize / 3;
        } else {
            // 通常の位置指定
            switch (telop.positionY) {
                case 'top':
                    y = fontSize + canvasHeight * 0.05;
                    break;
                case 'middle':
                    y = canvasHeight / 2 + fontSize / 3;
                    break;
                default: // bottom
                    y = canvasHeight - canvasHeight * 0.05;
            }
        }
        
        // 背景を描画（オプション）
        if (telop.background) {
            const metrics = ctx.measureText(telop.text);
            const textWidth = metrics.width;
            const padding = fontSize * 0.2;
            
            let bgX;
            switch (telop.positionX) {
                case 'left':
                    bgX = x - padding;
                    break;
                case 'right':
                    bgX = x - textWidth - padding;
                    break;
                default: // center
                    bgX = x - textWidth / 2 - padding;
            }
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(
                bgX,
                y - fontSize + padding,
                textWidth + padding * 2,
                fontSize + padding
            );
        }
        
        // 輪郭線を描画（オプション）
        if (telop.outline) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = Math.max(2, fontSize * 0.05);
            ctx.strokeText(telop.text, x, y);
        }
        
        // メインテキストの色を設定
        ctx.fillStyle = this.getTelopColor(ctx, telop, x, y, fontSize);
        ctx.fillText(telop.text, x, y);
    }
    
    getTelopColor(ctx, telop, x, y, fontSize) {
        const colors = {
            white: '#ffffff', black: '#000000', red: '#ff4444', blue: '#4488ff',
            yellow: '#ffff44', green: '#44ff44', orange: '#ff8844', purple: '#8844ff',
            pink: '#ff44aa', cyan: '#44ffff'
        };
        
        if (telop.color === 'custom') {
            return telop.customColor;
        } else if (telop.color === 'gradient-red') {
            const gradient = ctx.createLinearGradient(x - 100, y - fontSize/2, x + 100, y + fontSize/2);
            gradient.addColorStop(0, '#ff4444');
            gradient.addColorStop(1, '#ffff44');
            return gradient;
        } else if (telop.color === 'gradient-blue') {
            const gradient = ctx.createLinearGradient(x - 100, y - fontSize/2, x + 100, y + fontSize/2);
            gradient.addColorStop(0, '#4488ff');
            gradient.addColorStop(1, '#44ff44');
            return gradient;
        } else if (telop.color === 'gradient-rainbow') {
            const gradient = ctx.createLinearGradient(x - 100, y - fontSize/2, x + 100, y + fontSize/2);
            gradient.addColorStop(0, '#ff4444');
            gradient.addColorStop(0.33, '#ffff44');
            gradient.addColorStop(0.66, '#44ff44');
            gradient.addColorStop(1, '#4488ff');
            return gradient;
        }
        
        return colors[telop.color] || colors.white;
    }

    createVideoControls(video, index) {
        const controls = document.createElement('div');
        controls.className = 'video-controls';
        
        // 時間スライダー
        const timeSlider = document.createElement('input');
        timeSlider.type = 'range';
        timeSlider.className = 'time-slider';
        timeSlider.min = 0;
        timeSlider.max = 10; // デフォルト、後でloadedmetadataで更新
        timeSlider.step = 0.01;
        timeSlider.value = 0;
        
        // 時間表示
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'time-display';
        timeDisplay.textContent = '0:00 / 0:00';
        
        // プレビューボタン
        const previewBtn = document.createElement('button');
        previewBtn.className = 'preview-btn';
        previewBtn.textContent = '▶ プレビュー';
        
        // iOS対応：タッチイベントを追加
        if (this.isIOS) {
            previewBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
            });
        }
        
        // イベントリスナー
        timeSlider.addEventListener('input', (e) => {
            const time = parseFloat(e.target.value);
            video.currentTime = time;
            this.videoStartTimes[index] = time;
            
            // 時間表示を更新
            const duration = video.duration || 0;
            timeDisplay.textContent = `${this.formatTime(time)} / ${this.formatTime(duration)}`;
        });
        
        previewBtn.addEventListener('click', () => {
            if (video.paused) {
                video.currentTime = this.videoStartTimes[index];
                video.play();
                previewBtn.textContent = '⏸ 停止';
            } else {
                video.pause();
                previewBtn.textContent = '▶ プレビュー';
            }
        });
        
        // 動画が終了したらボタンを元に戻す
        video.addEventListener('ended', () => {
            previewBtn.textContent = '▶ プレビュー';
        });
        
        // 動画が一時停止されたらボタンを元に戻す
        video.addEventListener('pause', () => {
            previewBtn.textContent = '▶ プレビュー';
        });
        
        // コントロールを組み立て
        const timeContainer = document.createElement('div');
        timeContainer.className = 'time-container';
        timeContainer.appendChild(timeSlider);
        timeContainer.appendChild(timeDisplay);
        
        controls.appendChild(timeContainer);
        controls.appendChild(previewBtn);
        
        return controls;
    }
    
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    toggleEditSummary() {
        if (!this.editSummary || !this.toggleSummaryBtn) return;
        
        const isVisible = this.editSummary.style.display !== 'none';
        
        if (isVisible) {
            // 非表示にする
            this.editSummary.style.display = 'none';
            this.toggleSummaryBtn.textContent = '📊 編集詳細を表示';
            this.toggleSummaryBtn.classList.remove('btn-primary');
            this.toggleSummaryBtn.classList.add('btn-secondary');
        } else {
            // 表示する
            this.editSummary.style.display = 'block';
            this.toggleSummaryBtn.textContent = '📊 編集詳細を非表示';
            this.toggleSummaryBtn.classList.remove('btn-secondary');
            this.toggleSummaryBtn.classList.add('btn-primary');
        }
    }
    
    // v2新機能: 素材分類システム
    createMaterialClassificationSelect(index) {
        const container = document.createElement('div');
        container.style.cssText = 'margin: 0.5rem 0;';
        
        const label = document.createElement('label');
        label.style.cssText = 'display: block; font-size: 0.8rem; color: var(--secondary-text); margin-bottom: 0.3rem;';
        label.textContent = '🏷️ 素材分類:';
        
        const select = document.createElement('select');
        select.className = 'material-tag-select';
        select.innerHTML = `
            <option value="food">🍽️ フード（料理・食べ物）</option>
            <option value="staff">👥 スタッフ（人物・接客）</option>
            <option value="store">🏪 店内（内装・雰囲気）</option>
            <option value="product">📦 商品（商品・サービス）</option>
            <option value="other" selected>📎 その他</option>
        `;
        
        // 分類変更時のイベントリスナー
        select.addEventListener('change', (e) => {
            this.updateMaterialClassification(index, e.target.value);
        });
        
        // バッジ表示用のdiv
        const badge = document.createElement('div');
        badge.className = 'classification-badge badge-other';
        badge.textContent = 'その他';
        badge.id = `badge-${index}`;
        
        container.appendChild(label);
        container.appendChild(select);
        container.appendChild(badge);
        
        return container;
    }
    
    updateMaterialClassification(index, classification) {
        // 古い分類を削除
        if (this.materialClassifications[index]) {
            this.classificationStats[this.materialClassifications[index]]--;
        }
        
        // 新しい分類を設定
        this.materialClassifications[index] = classification;
        this.classificationStats[classification]++;
        
        // バッジを更新
        const badge = document.getElementById(`badge-${index}`);
        if (badge) {
            const classificationNames = {
                food: 'フード',
                staff: 'スタッフ',
                store: '店内',
                product: '商品',
                other: 'その他'
            };
            
            badge.textContent = classificationNames[classification];
            badge.className = `classification-badge badge-${classification}`;
        }
        
        // 統計を更新
        this.updateClassificationStats();
        // パターンプレビューも更新
        this.updatePatternPreview();
        
        console.log(`📋 素材${index + 1}を「${classification}」に分類しました`);
    }
    
    updateClassificationStats() {
        // 統計表示を更新
        if (this.foodCount) this.foodCount.textContent = this.classificationStats.food;
        if (this.staffCount) this.staffCount.textContent = this.classificationStats.staff;
        if (this.storeCount) this.storeCount.textContent = this.classificationStats.store;
        if (this.productCount) this.productCount.textContent = this.classificationStats.product;
        if (this.otherCount) this.otherCount.textContent = this.classificationStats.other;
        
        // 統計パネルの表示・非表示
        const totalCount = Object.values(this.classificationStats).reduce((a, b) => a + b, 0);
        if (this.classificationStatsElement && totalCount > 0) {
            this.classificationStatsElement.style.display = 'block';
        }
        
        console.log('📊 素材分類統計:', this.classificationStats);
    }
    
    // v2新機能: パターンプレビュー更新
    updatePatternPreview() {
        if (!this.patternPreview) return;
        
        const stats = this.classificationStats;
        const total = Object.values(stats).reduce((a, b) => a + b, 0);
        
        if (total === 0) {
            this.patternPreview.innerHTML = '素材をアップロード・分類すると、各パターンでの使用比率が表示されます';
            return;
        }
        
        // 現在の分類状況を表示
        const currentStats = `
            <div style="margin-bottom: 0.5rem;">
                <strong>アップロード済み素材:</strong> 
                フード${stats.food}個 • スタッフ${stats.staff}個 • 店内${stats.store}個 • 商品${stats.product}個 • その他${stats.other}個
            </div>
            <div style="font-size: 0.8rem;">
                <strong>🍽️ フード重視:</strong> ${this.calculatePatternRatio('food-focused')}<br>
                <strong>👥 スタッフ重視:</strong> ${this.calculatePatternRatio('staff-focused')}<br>
                <strong>🏪 雰囲気重視:</strong> ${this.calculatePatternRatio('atmosphere-focused')}
            </div>
        `;
        
        this.patternPreview.innerHTML = currentStats;
    }
    
    // パターンごとの使用比率を計算
    calculatePatternRatio(patternType) {
        const stats = this.classificationStats;
        const total = Object.values(stats).reduce((a, b) => a + b, 0);
        
        if (total === 0) return '素材が不足しています';
        
        const patterns = {
            'food-focused': { food: 50, staff: 30, store: 20, product: 0, other: 0 },
            'staff-focused': { food: 35, staff: 40, store: 25, product: 0, other: 0 },
            'atmosphere-focused': { food: 35, staff: 30, store: 35, product: 0, other: 0 }
        };
        
        const pattern = patterns[patternType];
        if (!pattern) return '不明なパターン';
        
        let description = '';
        Object.keys(pattern).forEach(type => {
            if (pattern[type] > 0) {
                const available = stats[type] || 0;
                const needed = Math.ceil((pattern[type] / 100) * 10); // 10秒動画として計算
                const status = available >= needed ? '✅' : '⚠️';
                const typeName = { food: 'フード', staff: 'スタッフ', store: '店内', product: '商品', other: 'その他' }[type];
                description += `${status}${typeName}${pattern[type]}%(${available}/${needed}) `;
            }
        });
        
        return description.trim();
    }
    
    // 全パターン一括生成
    async generateAllPatterns() {
        if (!this.canGenerateVideo()) {
            alert('動画生成の準備ができていません。音楽と映像をアップロードしてください。');
            return;
        }
        
        const originalButtonText = this.generateAllPatternsBtn.textContent;
        this.generateAllPatternsBtn.disabled = true;
        this.generateAllPatternsBtn.textContent = '🎬 全パターン生成中...';
        
        try {
            console.log('🎬 全3パターンの一括生成を開始');
            
            const patterns = ['food-focused', 'staff-focused', 'atmosphere-focused'];
            const results = [];
            
            for (let i = 0; i < patterns.length; i++) {
                const pattern = patterns[i];
                const patternName = {
                    'food-focused': 'フード重視',
                    'staff-focused': 'スタッフ重視', 
                    'atmosphere-focused': '雰囲気重視'
                }[pattern];
                
                this.updateProgress((i * 33), `パターン${i + 1}/3: ${patternName}を生成中...`);
                
                // パターンに基づいた編集計画を生成
                const editPlan = this.generatePatternBasedEditPlan(pattern);
                const videoBlob = await this.generateActualVideo(editPlan);
                
                results.push({
                    pattern: pattern,
                    name: patternName,
                    blob: videoBlob,
                    plan: editPlan
                });
                
                console.log(`✅ ${patternName}パターン完成`);
            }
            
            this.updateProgress(100, '全パターン生成完了！');
            
            // 結果を表示
            this.displayMultiplePatternResults(results);
            
        } catch (error) {
            console.error('全パターン生成エラー:', error);
            alert('全パターン生成中にエラーが発生しました: ' + error.message);
        } finally {
            this.generateAllPatternsBtn.disabled = false;
            this.generateAllPatternsBtn.textContent = originalButtonText;
        }
    }
    
    // パターンに基づいた編集計画を生成
    generatePatternBasedEditPlan(patternType) {
        console.log(`📋 ${patternType}パターンの編集計画を生成中`);
        
        // 基本的な編集計画を取得
        const basePlan = this.calculateCutPositions();
        
        // パターンに応じて素材の使用比率を調整
        const adjustedPlan = this.adjustPlanByPattern(basePlan, patternType);
        
        console.log(`📊 ${patternType}パターン編集計画:`, adjustedPlan);
        return adjustedPlan;
    }
    
    // パターンに応じた編集計画調整
    adjustPlanByPattern(basePlan, patternType) {
        // 各分類の素材インデックスを取得
        const materialsByType = this.groupMaterialsByClassification();
        
        const patterns = {
            'food-focused': { food: 0.5, staff: 0.3, store: 0.2 },
            'staff-focused': { food: 0.35, staff: 0.4, store: 0.25 },
            'atmosphere-focused': { food: 0.35, staff: 0.3, store: 0.35 }
        };
        
        const targetRatio = patterns[patternType];
        if (!targetRatio) return basePlan;
        
        // 計画を調整（簡易版：既存の計画の素材選択を変更）
        const adjustedPlan = basePlan.map((segment, index) => {
            const adjustedSegment = { ...segment };
            
            // パターンに基づいて優先的に使用する素材タイプを決定
            const priorityTypes = Object.keys(targetRatio).sort((a, b) => targetRatio[b] - targetRatio[a]);
            
            // 利用可能な素材から選択
            for (const type of priorityTypes) {
                if (materialsByType[type] && materialsByType[type].length > 0) {
                    const availableMaterials = materialsByType[type];
                    adjustedSegment.videoIndex = availableMaterials[index % availableMaterials.length];
                    break;
                }
            }
            
            return adjustedSegment;
        });
        
        return adjustedPlan;
    }
    
    // 分類別に素材をグループ化
    groupMaterialsByClassification() {
        const groups = { food: [], staff: [], store: [], product: [], other: [] };
        
        this.materialClassifications.forEach((classification, index) => {
            if (groups[classification]) {
                groups[classification].push(index);
            }
        });
        
        return groups;
    }
    
    // 複数パターンの結果表示
    displayMultiplePatternResults(results) {
        // 既存の結果表示を拡張
        this.displayEditResult(results[0].plan); // 最初のパターンを基本表示
        
        // 追加のパターン選択UI要素があれば更新
        console.log('🎬 全パターン生成完了:', results.map(r => r.name));
        
        // 最初のパターンを表示用に設定
        this.generatedVideoBlob = results[0].blob;
        this.isVideoGenerated = true;
    }
    
    // 動画生成可能かチェック
    canGenerateVideo() {
        return this.audioBuffer && this.videoElements.length > 0 && this.beats.length > 0;
    }
}

// グローバル参照（テロップ編集用）
let beatDetector;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎵 Beat Detection Prototype 初期化開始');
    beatDetector = new BeatDetector();
    console.log('🎵 Beat Detection Prototype 初期化完了');
    
    // アップロードエリアの状態確認
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        console.log('✅ 音楽アップロードエリアが見つかりました');
        console.log('- エリアのスタイル:', window.getComputedStyle(uploadArea).display);
    } else {
        console.error('❌ 音楽アップロードエリアが見つかりません');
    }
});