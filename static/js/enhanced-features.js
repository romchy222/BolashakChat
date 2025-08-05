/**
 * Rating System for BolashakChat
 * Система оценки для BolashakChat
 */

class RatingSystem {
    constructor() {
        this.initializeRatingButtons();
    }

    /**
     * Initialize rating buttons for chat messages
     */
    initializeRatingButtons() {
        // Add rating buttons to existing chat messages
        document.addEventListener('DOMContentLoaded', () => {
            this.addRatingButtonsToMessages();
        });

        // Listen for new messages (if using dynamic chat)
        document.addEventListener('messageAdded', (event) => {
            this.addRatingButtonsToMessage(event.detail.messageElement, event.detail.queryId);
        });
    }

    /**
     * Add rating buttons to all existing chat messages
     */
    addRatingButtonsToMessages() {
        const chatMessages = document.querySelectorAll('.chat-message.bot');
        chatMessages.forEach(message => {
            if (!message.querySelector('.rating-buttons')) {
                const queryId = message.dataset.queryId;
                if (queryId) {
                    this.addRatingButtonsToMessage(message, queryId);
                }
            }
        });
    }

    /**
     * Add rating buttons to a specific message
     * @param {HTMLElement} messageElement - The message element
     * @param {number} queryId - The query ID
     */
    addRatingButtonsToMessage(messageElement, queryId) {
        const ratingContainer = document.createElement('div');
        ratingContainer.className = 'rating-buttons mt-2';
        ratingContainer.innerHTML = `
            <button type="button" class="btn btn-sm btn-outline-success rating-btn" 
                    data-query-id="${queryId}" data-rating="like" title="Полезный ответ">
                <i class="fas fa-thumbs-up"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger rating-btn" 
                    data-query-id="${queryId}" data-rating="dislike" title="Неполезный ответ">
                <i class="fas fa-thumbs-down"></i>
            </button>
            <span class="rating-status ms-2 text-muted" style="display: none;"></span>
        `;

        // Add event listeners
        const likeBtn = ratingContainer.querySelector('[data-rating="like"]');
        const dislikeBtn = ratingContainer.querySelector('[data-rating="dislike"]');

        likeBtn.addEventListener('click', () => this.rateMessage(queryId, 'like', ratingContainer));
        dislikeBtn.addEventListener('click', () => this.rateMessage(queryId, 'dislike', ratingContainer));

        messageElement.appendChild(ratingContainer);
    }

    /**
     * Rate a message
     * @param {number} queryId - The query ID
     * @param {string} rating - 'like' or 'dislike'
     * @param {HTMLElement} ratingContainer - The rating buttons container
     */
    async rateMessage(queryId, rating, ratingContainer) {
        const statusElement = ratingContainer.querySelector('.rating-status');
        const buttons = ratingContainer.querySelectorAll('.rating-btn');

        try {
            // Disable buttons during request
            buttons.forEach(btn => btn.disabled = true);
            
            statusElement.textContent = 'Сохранение...';
            statusElement.style.display = 'inline';

            const response = await fetch(`/api/rate/${queryId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rating: rating })
            });

            if (!response.ok) {
                throw new Error('Failed to rate message');
            }

            const result = await response.json();

            // Update UI to show rating was successful
            this.updateRatingUI(ratingContainer, rating);
            
            statusElement.textContent = 'Спасибо за оценку!';
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);

            // Fire event for analytics
            document.dispatchEvent(new CustomEvent('messageRated', {
                detail: { queryId, rating, result }
            }));

        } catch (error) {
            console.error('Error rating message:', error);
            
            statusElement.textContent = 'Ошибка при сохранении оценки';
            statusElement.className = 'rating-status ms-2 text-danger';
            
            // Re-enable buttons
            buttons.forEach(btn => btn.disabled = false);
            
            setTimeout(() => {
                statusElement.style.display = 'none';
                statusElement.className = 'rating-status ms-2 text-muted';
            }, 3000);
        }
    }

    /**
     * Update rating UI after successful rating
     * @param {HTMLElement} ratingContainer - The rating buttons container
     * @param {string} rating - The selected rating
     */
    updateRatingUI(ratingContainer, rating) {
        const buttons = ratingContainer.querySelectorAll('.rating-btn');
        
        buttons.forEach(btn => {
            btn.disabled = true;
            
            if (btn.dataset.rating === rating) {
                // Highlight the selected rating
                if (rating === 'like') {
                    btn.className = 'btn btn-sm btn-success rating-btn';
                } else {
                    btn.className = 'btn btn-sm btn-danger rating-btn';
                }
            } else {
                // Dim the other button
                btn.className = 'btn btn-sm btn-outline-secondary rating-btn';
            }
        });
    }
}

/**
 * Voice Chat System
 * Система голосового чата
 */
class VoiceChatSystem {
    constructor() {
        this.sessionId = null;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
    }

    /**
     * Start a voice chat session
     * @param {string} language - The language for the session
     */
    async startSession(language = 'ru') {
        try {
            const response = await fetch('/api/voice/start-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    language: language,
                    user_id: 'web_user_' + Date.now()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to start voice session');
            }

            const result = await response.json();
            this.sessionId = result.session_id;
            
            console.log('Voice session started:', this.sessionId);
            return result;

        } catch (error) {
            console.error('Error starting voice session:', error);
            throw error;
        }
    }

    /**
     * Process a voice message (for now, just text)
     * @param {string} textMessage - The text message to process
     */
    async processMessage(textMessage) {
        if (!this.sessionId) {
            await this.startSession();
        }

        try {
            const response = await fetch('/api/voice/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    text: textMessage
                })
            });

            if (!response.ok) {
                throw new Error('Failed to process voice message');
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('Error processing voice message:', error);
            throw error;
        }
    }

    /**
     * Start recording audio (placeholder for future implementation)
     */
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                // Here you would typically send the audio to the server
                console.log('Audio recorded:', audioBlob);
            };

            this.mediaRecorder.start();
            this.isRecording = true;

        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }

    /**
     * Stop recording audio
     */
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
        }
    }
}

// Initialize systems when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize rating system
    window.ratingSystem = new RatingSystem();
    
    // Initialize voice chat system
    window.voiceChatSystem = new VoiceChatSystem();
    
    console.log('BolashakChat enhanced features initialized');
});

// Export for global access
window.RatingSystem = RatingSystem;
window.VoiceChatSystem = VoiceChatSystem;