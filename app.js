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
        // Removed: this.migrateExistingWords(); // This method does not exist and caused an error
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
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
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
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Level cards
        document.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const level = e.currentTarget.dataset.level;
                this.showLevelWords(level);
            });
        });

        // Back to levels button
        const backToLevels = document.getElementById('backToLevels');
        if (backToLevels) {
            backToLevels.addEventListener('click', () => {
                this.hideLevelWords();
            });
        }

        // Add word form
        const addWordBtn = document.getElementById('addWordBtn');
        if (addWordBtn) {
            addWordBtn.addEventListener('click', () => {
                this.addCustomWord();
            });
        }

        // Enter key for add word form
        const newWordInput = document.getElementById('newWord');
        if (newWordInput) {
            newWordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const newTranslationInput = document.getElementById('newTranslation');
                    if (newTranslationInput) {
                        newTranslationInput.focus();
                    }
                }
            });
        }

        const newTranslationInput = document.getElementById('newTranslation');
        if (newTranslationInput) {
            newTranslationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addCustomWord();
                }
            });
        }
    }

    // Navigation
    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const navItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        const contentSection = document.getElementById(sectionName);
        if (contentSection) {
            contentSection.classList.add('active');
        }

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
        
        if (levelsGrid) {
            levelsGrid.style.display = 'none';
        }
        if (wordsContainer) {
            wordsContainer.classList.remove('hidden');
        }
        
        // Update title
        if (currentLevelTitle) {
            currentLevelTitle.textContent = `Слова уровня ${level}`;
        }
        
        // Render words
        this.renderLevelWords(level);
    }

    hideLevelWords() {
        const wordsContainer = document.getElementById('wordsContainer');
        const levelsGrid = document.querySelector('.levels-grid');
        
        if (levelsGrid) {
            levelsGrid.style.display = 'grid';
        }
        if (wordsContainer) {
            wordsContainer.classList.add('hidden');
        }
        
        this.currentLevel = null;
    }

    renderLevelWords(level) {
        const wordsList = document.getElementById('wordsList');
        // Check if oxfordWordsDatabase is defined and has the level
        const words = (typeof oxfordWordsDatabase !== 'undefined' && oxfordWordsDatabase[level]) ? oxfordWordsDatabase[level] : [];
        
        if (!wordsList) return;

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
        
        if (!learningWordsList || !learningCount) return;

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
                return b.repetitionData.difficulty - a.repetitionData.difficulty;
            }
            return new Date(a.repetitionData.nextReview).getTime() - new Date(b.repetitionData.nextReview).getTime();
        });
    }

    showReviewCard() {
        const learningWordsList = document.getElementById('learningWordsList');
        if (!learningWordsList) return;

        if (this.currentReviewWords.length === 0) {
            this.renderLearningWords(); // Go back to empty state or all learned message
            return;
        }

        const wordData = this.currentReviewWords[this.currentReviewIndex];
        learningWordsList.innerHTML = `
            <div class="review-card">
                <div class="review-word">${wordData.word}</div>
                <div class="review-translation hidden" id="reviewTranslation">${wordData.translation}</div>
                <div class="review-actions">
                    <button class="show-translation-btn" onclick="app.showTranslation()">Показать перевод</button>
                    <div class="review-feedback hidden" id="reviewFeedback">
                        <button class="feedback-btn easy" onclick="app.processReview(5)">Легко</button>
                        <button class="feedback-btn good" onclick="app.processReview(3)">Хорошо</button>
                        <button class="feedback-btn hard" onclick="app.processReview(1)">Сложно</button>
                    </div>
                </div>
            </div>
        `;
    }

    showTranslation() {
        const reviewTranslation = document.getElementById('reviewTranslation');
        const reviewFeedback = document.getElementById('reviewFeedback');
        if (reviewTranslation) {
            reviewTranslation.classList.remove('hidden');
        }
        if (reviewFeedback) {
            reviewFeedback.classList.remove('hidden');
        }
    }

    processReview(grade) {
        const wordObj = this.currentReviewWords[this.currentReviewIndex];
        if (!wordObj) return;

        const { repetitionData } = wordObj;
        const now = new Date();

        // Update repetition data based on SM-2 algorithm
        if (grade >= 3) {
            if (repetitionData.repetitions === 0) {
                repetitionData.interval = 1;
            } else if (repetitionData.repetitions === 1) {
                repetitionData.interval = 6;
            } else {
                repetitionData.interval = Math.round(repetitionData.interval * repetitionData.easeFactor);
            }
            repetitionData.repetitions++;
            repetitionData.correctAnswers++;
            repetitionData.difficulty = 0; // Reset difficulty on correct answer
        } else {
            repetitionData.repetitions = 0;
            repetitionData.interval = 1;
            repetitionData.difficulty = Math.min(2, repetitionData.difficulty + 1); // Increase difficulty
        }

        repetitionData.easeFactor = repetitionData.easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
        if (repetitionData.easeFactor < 1.3) repetitionData.easeFactor = 1.3;

        repetitionData.nextReview = new Date(now.getTime() + repetitionData.interval * 24 * 60 * 60 * 1000).toISOString();
        repetitionData.lastReview = now.toISOString();
        repetitionData.totalAnswers++;

        this.saveData();

        // Move to next word or finish review session
        this.currentReviewIndex++;
        if (this.currentReviewIndex < this.currentReviewWords.length) {
            this.showReviewCard();
        } else {
            this.showNotification('Сессия повторения завершена!', 'success');
            this.renderLearningWords(); // Re-render to show updated counts or empty state
        }
    }

    showAllLearningWords() {
        const learningWordsList = document.getElementById('learningWordsList');
        if (!learningWordsList) return;

        if (this.learningWords.length === 0) {
            this.renderLearningWords();
            return;
        }

        learningWordsList.innerHTML = this.learningWords.map(wordData => {
            const isLearnedClass = wordData.isLearned ? 'learned' : '';
            const nextReviewDate = wordData.repetitionData.nextReview ? new Date(wordData.repetitionData.nextReview).toLocaleDateString() : 'N/A';
            
            return `
                <div class="word-card ${isLearnedClass}">
                    <div class="word-header">
                        <span class="word-text">${wordData.word}</span>
                        <div class="word-actions">
                            <button class="action-btn play-btn" onclick="app.playAudio('${wordData.word}')" title="Прослушать произношение">
                                <i class="fas fa-play"></i>
                            </button>
                            ${!wordData.isLearned ? `
                                <button class="action-btn learn-btn" onclick="app.markAsLearned('${wordData.word}')" title="Отметить как изученное">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                            <button class="action-btn remove-btn" onclick="app.removeFromLearning('${wordData.word}')" title="Убрать из изучения">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="word-translation">${wordData.translation}</div>
                    <div class="word-level">${wordData.level}</div>
                    <div class="word-details">
                        <span>Повторений: ${wordData.repetitionData.repetitions}</span>
                        <span>След. повторение: ${nextReviewDate}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Custom Words Management
    addCustomWord() {
        const newWordInput = document.getElementById('newWord');
        const newTranslationInput = document.getElementById('newTranslation');
        const newLevelSelect = document.getElementById('newLevel');

        if (!newWordInput || !newTranslationInput || !newLevelSelect) {
            this.showNotification('Не удалось найти элементы формы', 'error');
            return;
        }

        const word = newWordInput.value.trim();
        const translation = newTranslationInput.value.trim();
        const level = newLevelSelect.value;

        if (!word || !translation) {
            this.showNotification('Пожалуйста, заполните все поля', 'warning');
            return;
        }

        const existingWord = this.customWords.find(w => w.word === word);
        if (existingWord) {
            this.showNotification('Это слово уже добавлено', 'warning');
            return;
        }

        const newWord = {
            id: Date.now().toString(),
            word: word,
            translation: translation,
            level: level,
            dateAdded: new Date().toISOString()
        };

        this.customWords.push(newWord);
        this.saveData();
        this.updateUI();
        this.showNotification('Слово добавлено!', 'success');

        newWordInput.value = '';
        newTranslationInput.value = '';
        newWordInput.focus();

        this.renderCustomWords();
    }

    removeCustomWord(id) {
        this.customWords = this.customWords.filter(word => word.id !== id);
        this.saveData();
        this.updateUI();
        this.showNotification('Слово удалено', 'info');
        this.renderCustomWords();
    }

    renderCustomWords() {
        const customWordsDiv = document.getElementById('customWords');
        if (!customWordsDiv) return;

        if (this.customWords.length === 0) {
            customWordsDiv.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <h3>Нет добавленных слов</h3>
                    <p>Используйте форму выше для добавления новых слов</p>
                </div>
            `;
            return;
        }

        customWordsDiv.innerHTML = this.customWords.map(wordData => `
            <div class="word-card">
                <div class="word-header">
                    <span class="word-text">${wordData.word}</span>
                    <div class="word-actions">
                        <button class="action-btn play-btn" onclick="app.playAudio('${wordData.word}')" title="Прослушать произношение">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="action-btn remove-btn" onclick="app.removeCustomWord('${wordData.id}')" title="Удалить слово">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="word-translation">${wordData.translation}</div>
                <div class="word-level">${wordData.level}</div>
            </div>
        `).join('');
    }

    // Audio Playback
    playAudio(word) {
        const audioUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
        
        fetch(audioUrl)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0 && data[0].phonetics && data[0].phonetics.length > 0) {
                    const phonetic = data[0].phonetics.find(p => p.audio);
                    if (phonetic && phonetic.audio) {
                        this.audioPlayer.src = phonetic.audio;
                        this.audioPlayer.play();
                    } else {
                        this.showNotification('Аудио для этого слова не найдено.', 'warning');
                    }
                } else {
                    this.showNotification('Аудио для этого слова не найдено.', 'warning');
                }
            })
            .catch(error => {
                console.error('Error fetching audio:', error);
                this.showNotification('Ошибка при загрузке аудио.', 'error');
            });
    }

    // UI Updates
    updateUI() {
        // Update learning words count
        const learningCountElement = document.getElementById('learningCount');
        if (learningCountElement) {
            learningCountElement.textContent = `${this.learningWords.length} слов`;
        }

        // Update level word counts (if applicable)
        document.querySelectorAll('.level-card').forEach(card => {
            const level = card.dataset.level;
            const wordCountSpan = card.querySelector('.word-count');
            if (wordCountSpan) {
                // Check if oxfordWordsDatabase is defined and has the level
                const count = (typeof oxfordWordsDatabase !== 'undefined' && oxfordWordsDatabase[level]) ? oxfordWordsDatabase[level].length : 0;
                wordCountSpan.textContent = `${count} слов`;
            }
        });
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => {
                notification.remove();
            });
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new EnglishWordsApp();
});


