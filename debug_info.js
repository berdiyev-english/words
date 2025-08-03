// Debug information for troubleshooting
console.log('Debug: Script loaded');

// Check if DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug: DOM loaded');
    
    // Check if app is initialized
    setTimeout(() => {
        if (window.app) {
            console.log('Debug: App initialized');
            console.log('Debug: Learning words count:', window.app.learningWords.length);
            
            // Check if learning words have translations
            window.app.learningWords.forEach((word, index) => {
                console.log(`Debug: Word ${index + 1}: "${word.word}" - Translation: "${word.translation}"`);
            });
        } else {
            console.error('Debug: App not initialized');
        }
    }, 1000);
});

// Override console.error to catch any errors
const originalError = console.error;
console.error = function(...args) {
    originalError.apply(console, ['DEBUG ERROR:'].concat(args));
};

