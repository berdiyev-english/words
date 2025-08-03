// English Words App - Main JavaScript File

class EnglishWordsApp {
    constructor() {
        this.currentSection = 'about';
        this.currentLevel = null;
        this.learningWords = [];
        this.customWords = [];
        this.audioPlayer = document.getElementById('audioPlayer');
        this.currentAudioUrl = null;
        
        this.init();
    }

    init() {
        this.loadData();
        this.migrateExistingWords(); // Migrate existing words to new format
        this.setupEventListeners();
        this.updateUI();
        this.setupTheme();
    }

    // Data Management
    loadData() {
        try {
            const savedLearning = localStorage.getItem('learningWords');
            const savedCustom = localStorage.getItem('customWords');
            
            if (savedLearning) {
                this.learningWords = JSON.parse(savedLearning);
            }
            
            if (savedCustom) {
                this.customWords = JSON.parse(savedCustom);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    saveData() {
        try {
            const dataToSave = {
                learningWords: this.learningWords,
                customWords: this.customWords,
                lastSaved: new Date().toISOString(),
                version: '1.0'
            };
            
            localStorage.setItem('englishWordsApp', JSON.stringify(dataToSave));
            localStorage.setItem('learningWords', JSON.stringify(this.learningWords));
            localStorage.setItem('customWords', JSON.stringify(this.customWords));
            
            // Save statistics
            this.saveStatistics();
        } catch (error) {
            console.error('Error saving data:', error);
            this.showNotification('Ошибка сохранения данных', 'error');
        }
    }

    saveStatistics() {
        const stats = {
            totalWordsLearned: this.learningWords.filter(w => w.isLearned).length,
            totalWordsLearning: this.learningWords.length,
            customWordsAdded: this.customWords.length,
            lastActivity: new Date().toISOString(),
            dailyProgress: this.getDailyProgress()
        };
        
        localStorage.setItem('appStatistics', JSON.stringify(stats));
    }

    getDailyProgress() {
        const today = new Date().toDateString();
        const todayWords = this.learningWords.filter(w => 
            w.dateLearned && new Date(w.dateLearned).toDateString() === today
        );
        return todayWords.length;
    }

    exportData() {
        try {
            const exportData = {
                learningWords: this.learningWords,
                customWords: this.customWords,
                exportDate: new Date().toISOString(),
                appVersion: '1.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `english-words-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showNotification('Данные экспортированы', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Ошибка экспорта данных', 'error');
        }
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.learningWords && importData.customWords) {
                    // Merge with existing data
                    const existingLearning = new Set(this.learningWords.map(w => w.word));
                    const existingCustom = new Set(this.customWords.map(w => w.word));
                    
                    let newLearningCount = 0;
                    let newCustomCount = 0;
                    
                    importData.learningWords.forEach(word => {
                        if (!existingLearning.has(word.word)) {
                            this.learningWords.push(word);
                            newLearningCount++;
                        }
                    });
                    
                    importData.customWords.forEach(word => {
                        if (!existingCustom.has(word.word)) {
                            this.customWords.push(word);
                            newCustomCount++;
                        }
                    });
                    
                    this.saveData();
                    this.updateUI();
                    this.showNotification(`Импортировано: ${newLearningCount} изучаемых слов, ${newCustomCount} пользовательских слов`, 'success');
                } else {
                    this.showNotification('Неверный формат файла', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showNotification('Ошибка импорта данных', 'error');
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
            localStorage.removeItem('englishWordsApp');
            localStorage.removeItem('learningWords');
            localStorage.removeItem('customWords');
            localStorage.removeItem('appStatistics');
            
            this.learningWords = [];
            this.customWords = [];
            this.updateUI();
            this.renderLearningWords();
            this.renderCustomWords();
            
            this.showNotification('Все данные удалены', 'info');
        }
    }

    // Theme Management
    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Level cards
        document.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const level = e.currentTarget.dataset.level;
                this.showLevelWords(level);
            });
        });

        // Back to levels button
        document.getElementById('backToLevels').addEventListener('click', () => {
            this.hideLevelWords();
        });

        // Add word form
        document.getElementById('addWordBtn').addEventListener('click', () => {
            this.addCustomWord();
        });

        // Enter key for add word form
        document.getElementById('newWord').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('newTranslation').focus();
            }
        });

        document.getElementById('newTranslation').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCustomWord();
            }
        });
    }

    // Navigation
    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        this.currentSection = sectionName;

        // Update section-specific content
        if (sectionName === 'learning') {
            this.renderLearningWords();
        } else if (sectionName === 'new-words') {
            this.renderCustomWords();
        }
    }

    // Level Words Management
    showLevelWords(level) {
        this.currentLevel = level;
        const wordsContainer = document.getElementById('wordsContainer');
        const levelsGrid = document.querySelector('.levels-grid');
        const currentLevelTitle = document.getElementById('currentLevelTitle');
        
        // Hide levels grid and show words container
        levelsGrid.style.display = 'none';
        wordsContainer.classList.remove('hidden');
        
        // Update title
        currentLevelTitle.textContent = `Слова уровня ${level}`;
        
        // Render words
        this.renderLevelWords(level);
    }

    hideLevelWords() {
        const wordsContainer = document.getElementById('wordsContainer');
        const levelsGrid = document.querySelector('.levels-grid');
        
        // Show levels grid and hide words container
        levelsGrid.style.display = 'grid';
        wordsContainer.classList.add('hidden');
        
        this.currentLevel = null;
    }

    renderLevelWords(level) {
        const wordsList = document.getElementById('wordsList');
        const words = oxfordWordsDatabase[level] || [];
        
        if (words.length === 0) {
            wordsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book"></i>
                    <h3>Нет слов для этого уровня</h3>
                    <p>Слова для уровня ${level} пока не добавлены</p>
                </div>
            `;
            return;
        }

        wordsList.innerHTML = words.map(wordData => {
            const isLearning = this.learningWords.some(w => w.word === wordData.word);
            
            return `
                <div class="word-card">
                    <div class="word-header">
                        <span class="word-text">${wordData.word}</span>
                        <div class="word-actions">
                            <button class="action-btn play-btn" onclick="app.playAudio('${wordData.word}')" title="Прослушать произношение">
                                <i class="fas fa-play"></i>
                            </button>
                            ${!isLearning ? `
                                <button class="action-btn add-btn" onclick="app.addToLearning('${wordData.word}', '${wordData.translation}', '${level}')" title="Добавить в изучение">
                                    <i class="fas fa-plus"></i>
                                </button>
                            ` : `
                                <button class="action-btn remove-btn" onclick="app.removeFromLearning('${wordData.word}')" title="Убрать из изучения">
                                    <i class="fas fa-minus"></i>
                                </button>
                            `}
                        </div>
                    </div>
                    <div class="word-translation">${wordData.translation}</div>
                    <div class="word-level">${level} • ${wordData.category}</div>
                </div>
            `;
        }).join('');
    }

    // Learning Words Management
    addToLearning(word, translation, level) {
        const existingWord = this.learningWords.find(w => w.word === word);
        if (existingWord) {
            this.showNotification('Слово уже добавлено в изучение', 'warning');
            return;
        }

        const newWord = {
            id: Date.now().toString(),
            word: word,
            translation: translation,
            level: level,
            dateAdded: new Date().toISOString(),
            isLearned: false,
            // Spaced repetition data
            repetitionData: {
                easeFactor: 2.5,
                interval: 1,
                repetitions: 0,
                nextReview: new Date().toISOString(),
                lastReview: null,
                correctAnswers: 0,
                totalAnswers: 0,
                difficulty: 0 // 0 = easy, 1 = medium, 2 = hard
            }
        };

        this.learningWords.push(newWord);
        this.saveData();
        this.updateUI();
        this.showNotification('Слово добавлено в изучение', 'success');

        // Update current view if showing level words
        if (this.currentLevel) {
            this.renderLevelWords(this.currentLevel);
        }
    }

    removeFromLearning(word) {
        this.learningWords = this.learningWords.filter(w => w.word !== word);
        this.saveData();
        this.updateUI();
        this.showNotification('Слово убрано из изучения', 'info');

        // Update current view
        if (this.currentSection === 'learning') {
            this.renderLearningWords();
        } else if (this.currentLevel) {
            this.renderLevelWords(this.currentLevel);
        }
    }

    markAsLearned(word) {
        const wordObj = this.learningWords.find(w => w.word === word);
        if (wordObj) {
            wordObj.isLearned = true;
            wordObj.dateLearned = new Date().toISOString();
            this.saveData();
            this.updateUI();
            this.showNotification('Слово отмечено как изученное', 'success');
            this.renderLearningWords();
        }
    }

    renderLearningWords() {
        const learningWordsList = document.getElementById('learningWordsList');
        const learningCount = document.getElementById('learningCount');
        
        // Get words that need review
        const wordsForReview = this.getWordsForReview();
        learningCount.textContent = `${this.learningWords.length} слов (${wordsForReview.length} для повторения)`;

        if (this.learningWords.length === 0) {
            learningWordsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>Пока нет слов для изучения</h3>
                    <p>Добавьте слова из списка по уровням или создайте новые</p>
                </div>
            `;
            return;
        }

        if (wordsForReview.length === 0) {
            learningWordsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock"></i>
                    <h3>Все слова изучены на сегодня!</h3>
                    <p>Возвращайтесь позже для повторения</p>
                    <button class="show-all-words-btn" onclick="app.showAllLearningWords()">
                        <i class="fas fa-list"></i>
                        Показать все слова
                    </button>
                </div>
            `;
            return;
        }

        // Show current word for review
        this.currentReviewIndex = 0;
        this.currentReviewWords = wordsForReview;
        this.showReviewCard();
    }

    getWordsForReview() {
        const now = new Date();
        return this.learningWords.filter(word => {
            if (word.isLearned) return false;
            const nextReview = new Date(word.repetitionData.nextReview);
            return nextReview <= now;
        }).sort((a, b) => {
            // Sort by difficulty (harder words first) and then by next review date
            if (a.repetitionData.difficulty !== b.repetitionData.difficulty) {
                return b.repetitionData.difficulty - a.repetition
(Content truncated due to size limit. Use page ranges or line ranges to read remaining content)