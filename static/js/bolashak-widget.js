/**
 * BolashakBot Chat Widget (улучшенные быстрые сообщения + сплэш, счетчик новых сообщений)
 */
(function() {
    'use strict';

    const WIDGET_CONFIG = {
        apiEndpoint: window.BOLASHAK_API_URL || 'https://528fd662-4a57-4316-8325-61e34f1cc119-00-ui921zil405v.janeway.replit.dev',
        position: 'bottom-right',
        language: 'ru',
        title: 'QabyldauBot',
        welcomeMessage: 'Здравствуйте! Я помогу вам с вопросами о поступлении в университет Болашак. Задавайте любые вопросы!'
    };

    // SVG иконки
    const SVG_ICONS = {
        robot: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>',
        times: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        comments: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
        paperPlane: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
        botAvatar: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"></path><rect x="2" y="14" width="20" height="8" rx="2"></rect><path d="M12 9v5"></path><path d="M8 16h.01"></path><path d="M16 16h.01"></path></svg>',
        userAvatar: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
        document: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
        info: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
        graduation: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
        thanks: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
        specialties: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
        question: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        university: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22h20V10l-10-7.5L2 10v12Z"></path><path d="M12 7v15"></path><path d="M2 10h20"></path><path d="M7 22V12h.01"></path><path d="M17 22V12h.01"></path></svg>',
        category: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
        close: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
    };

    // Стили (основные и для сплэша/бэйджа)
            const EMBEDDED_CSS = `
    /* Стили для виджета чата QabyldauBot - обновленный дизайн */
    #bolashakChatWidget {
        --primary-gradient: #0256a5;
        --secondary-gradient: #015db3;
        --accent-gradient: linear-gradient(120deg, #f093fb 0%, #f5576c 100%);
        --message-gradient: linear-gradient(90deg, #015db3 0%, #0355a1 100%);
        --primary-color: #015db3;
        --secondary-color: #003668 !important;
        --accent-color: #f5576c;
        --bg-light: #ffffff;
        --bg-dark: #1a202c;
        --bg-panel: #ffffff;
        --bg-messages: #f5f7fb;
        --border-radius-lg: 6px;
        --border-radius-md: 12px;
        --border-radius-sm: 8px;
        --box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        --box-shadow-hover: 0 12px 40px rgba(0, 0, 0, 0.2);
        --box-shadow-message: 0 2px 10px rgba(0, 0, 0, 0.06);
        --transition: all 0.3s ease;
        --color-text-dark: #1a202c;
        --color-text-muted: #718096;
        --color-text-light: #ffffff;
        --color-border: #e2e8f0;
        --color-success: #48bb78;
        --bot-message-bg: #f8f9fb;
        --bot-message-color: #1a202c;
        --user-message-bg: var(--message-gradient);
        --user-message-color: white;
        --gap: 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    #bolashakChatWidget .chat-widget {
        position: fixed;
        bottom: 20px;
        right: 80px;
        width: 360px;
        height: 520px;
        border-radius: var(--border-radius-lg);
        box-shadow: var(--box-shadow);
        display: none;
        flex-direction: column;
        z-index: 999999;
        overflow: hidden;
        border: none;
        transition: var(--transition);
        opacity: 0;
        transform: translateY(20px);
    }

    #bolashakChatWidget .chat-widget.active {
        display: flex;
        opacity: 1;
        transform: translateY(0);
    }

    #bolashakChatWidget .chat-toggle-btn {
        position: fixed;
        bottom: 20px;
        right: 80px !important;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: var(--secondary-gradient);
        color: var(--color-text-light);
        border: none;
        box-shadow: var(--box-shadow);
        cursor: pointer;
        transition: var(--transition);
        z-index: 999998;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    #bolashakChatWidget .chat-toggle-btn:hover {
        transform: scale(1.05) rotate(5deg);
        box-shadow: var(--box-shadow-hover);
    }

    /* Заголовок чата */
    #bolashakChatWidget .chat-header {
        background: var(--primary-gradient);
        color: var(--color-text-light);
        padding: 18px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        border-top-left-radius: var(--border-radius-lg);
        border-top-right-radius: var(--border-radius-lg);
    }

    #bolashakChatWidget .chat-header::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 0;
        right: 0;
        height: 10px;
        background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0));
        z-index: 1;
        pointer-events: none;
    }

    #bolashakChatWidget .chat-header-info {
        display: flex;
        align-items: center;
        font-weight: 600;
    }

    #bolashakChatWidget .chat-header-info .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        background: rgba(255, 255, 255, 0.2);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        padding: 8px;
    }

    #bolashakChatWidget .chat-header-title {
        font-size: 18px;
        letter-spacing: 0.5px;
    }

    @keyframes pulse {
        0%, 100% { opacity: 0.9; }
        50% { opacity: 0.4; }
    }

    #bolashakChatWidget .chat-header-status {
        display: flex;
        align-items: center;
        font-size: 13px;
        opacity: 0.9;
        margin-top: 4px;
        font-weight: normal;
    }

    #bolashakChatWidget .chat-header-status::before {
        content: '';
        width: 8px;
        height: 8px;
        background: var(--color-success);
        border-radius: 50%;
        margin-right: 6px;
        animation: pulse 2s infinite ease-in-out;
    }

    #bolashakChatWidget .chat-controls {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* Языковой переключатель */
    #bolashakChatWidget .language-switcher {
        position: relative;
        display: inline-flex;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 20px;
        padding: 2px;
        min-width: 90px;
        height: 32px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    #bolashakChatWidget .language-option {
        z-index: 2;
        flex: 1;
        text-align: center;
        padding: 0 8px;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.7);
        transition: color 0.3s ease;
    }

    #bolashakChatWidget .language-option.active {
        color: white;
    }

    #bolashakChatWidget .language-switcher::after {
        content: '';
        position: absolute;
        z-index: 1;
        top: 2px;
        left: 2px;
        width: calc(50% - 4px);
        height: calc(100% - 4px);
        background: rgba(255, 255, 255, 0.25);
        border-radius: 18px;
        transition: transform 0.3s ease;
    }

    #bolashakChatWidget .language-switcher.kz::after {
        transform: translateX(calc(100% + 4px));
    }

    #bolashakChatWidget .chat-close {
        background: rgba(255, 255, 255, 0.2);
        color: var(--color-text-light);
        border: none;
        width: 30px;
        height: 30px;
        border-radius: var(--border-radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: var(--transition);
    }

    #bolashakChatWidget .chat-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
    }

    /* Сообщения чата */
    #bolashakChatWidget .chat-messages {
        flex: 1;
        padding: var(--gap);
        overflow-y: auto;
        background: var(--bg-messages);
        scroll-behavior: smooth;
    }

    #bolashakChatWidget .chat-messages::-webkit-scrollbar {
        width: 6px;
    }

    #bolashakChatWidget .chat-messages::-webkit-scrollbar-thumb {
        background: rgba(0,0,0,0.1);
        border-radius: 10px;
    }

    #bolashakChatWidget .chat-messages::-webkit-scrollbar-track {
        background: transparent;
    }

    /* Стили для сообщений */
    #bolashakChatWidget .message {
        margin-bottom: 22px;
        position: relative;
        max-width: 90%;
        opacity: 0;
        animation: messageAppear 0.3s forwards;
    }

    @keyframes messageAppear {
        from {
            opacity: 0;
            transform: translateY(15px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    #bolashakChatWidget .message-wrapper {
        display: flex;
        align-items: flex-end;
        position: relative;
    }

    #bolashakChatWidget .message-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-right: 8px;
    }

    #bolashakChatWidget .bot-message .message-avatar {
        background: #e3eaff;
        color: var(--primary-color);
    }

    #bolashakChatWidget .user-message .message-avatar {
        background: #e3f2ff;
        color: var(--secondary-color);
        margin-left: 8px;
        margin-right: 0;
    }

    #bolashakChatWidget .message-container {
        position: relative;
    }

    #bolashakChatWidget .message-content {
        padding: 12px 16px;
        border-radius: 18px;
        box-shadow: var(--box-shadow-message);
        word-wrap: break-word;
        line-height: 1.6;
        font-size: 15px;
        position: relative;
        margin-bottom: 5px;
    }

    /* Бот */
    #bolashakChatWidget .bot-message {
        margin-right: auto;
    }

    #bolashakChatWidget .bot-message .message-wrapper {
        flex-direction: row;
    }

    #bolashakChatWidget .bot-message .message-content {
        background: var(--bot-message-bg);
        color: var(--bot-message-color);
        border-bottom-left-radius: 6px;
    }

    #bolashakChatWidget .bot-message .message-content strong {
        color: var(--primary-color);
        font-weight: 600;
        margin-right: 4px;
    }

    /* Пользователь */
    #bolashakChatWidget .user-message {
        margin-left: auto;
    }

    #bolashakChatWidget .user-message .message-wrapper {
        flex-direction: row-reverse;
    }

    #bolashakChatWidget .user-message .message-content {
        background: var(--user-message-bg);
        color: var(--user-message-color);
        border-bottom-right-radius: 6px;
    }

    #bolashakChatWidget .message-time {
        font-size: 10px;
        color: var(--color-text-muted);
        display: inline-block;
        padding-left: 6px;
        padding-right: 6px;
    }

    #bolashakChatWidget .bot-message .message-time {
        margin-left: 36px;
    }

    #bolashakChatWidget .user-message .message-time {
        display:block;
        text-align: right;
        margin-right: 36px;
    }

    /* Индикатор набора */
    #bolashakChatWidget .typing-indicator {
        padding: 0 var(--gap);
        margin-bottom: var(--gap);
        opacity: 0;
        animation: fadeIn 0.3s forwards;
    }

    #bolashakChatWidget .typing-indicator-wrapper {
        display: flex;
        align-items: flex-end;
    }

    #bolashakChatWidget .typing-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-right: 8px;
        background: #e3eaff;
        color: var(--primary-color);
    }

    #bolashakChatWidget .typing-dots {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
        background: var(--bot-message-bg);
        border-radius: 18px;
        border-bottom-left-radius: 6px;
        max-width: 100px;
        align-items: center;
        box-shadow: var(--box-shadow-message);
    }

    #bolashakChatWidget .typing-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--color-text-muted);
        opacity: 0.7;
        animation: typing 1.4s infinite ease-in-out both;
    }

    #bolashakChatWidget .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    #bolashakChatWidget .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes typing {
        0%, 80%, 100% {
            transform: scale(0.7);
            opacity: 0.4;
        }
        40% {
            transform: scale(1);
            opacity: 0.8;
        }
    }

    /* УЛУЧШЕННЫЕ БЫСТРЫЕ СООБЩЕНИЯ */
    #bolashakChatWidget .quick-replies-section {
        background: linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 100%);
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        padding: 12px 0 4px;
        position: relative;
        transition: all 0.3s ease;
    }

    #bolashakChatWidget .quick-replies-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px 8px;
    }

    #bolashakChatWidget .quick-replies-title h4 {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-muted);
        margin: 0;
        display: flex;
        align-items: center;
    }

    #bolashakChatWidget .quick-replies-title h4 svg {
        margin-right: 6px;
    }

    #bolashakChatWidget .quick-replies-toggle {
        color: var(--secondary-color);
        background: transparent;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
        border-radius: 50%;
        transition: all 0.3s ease;
    }

    #bolashakChatWidget .quick-replies-toggle:hover {
        transform: rotate(180deg);
        background: rgba(0, 123, 255, 0.1);
    }

    #bolashakChatWidget .category-tabs {
        display: flex;
        gap: 6px;
        padding: 0 16px 8px;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    #bolashakChatWidget .category-tabs::-webkit-scrollbar {
        display: none;
    }

    #bolashakChatWidget .category-tab {
        flex: 0 0 auto;
        padding: 6px 12px;
        background: rgba(0, 0, 0, 0.04);
        color: var(--color-text-muted);
        border: none;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s ease;
        white-space: nowrap;
    }

    #bolashakChatWidget .category-tab:hover {
        background: rgba(0, 0, 0, 0.08);
    }

    #bolashakChatWidget .category-tab.active {
        background: #003668 !important;
        color: white;
        box-shadow: 0 2px 8px rgba(3, 150, 255, 0.3);
    }

    /* Улучшенные стили для быстрых ответов */
    #bolashakChatWidget .quick-replies-container {
        display: flex;
        align-items: center;
        position: relative;
        padding: 0 12px;
        overflow: hidden;
    }

    #bolashakChatWidget .scroll-btn {
        border: none;
        background: var(--primary-color);
        color: white;
        width: 24px;
        height: 24px;
        font-size: 14px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition);
        z-index: 2;
        box-shadow: 0 2px 5px rgba(0,0,0,0.15);
        flex-shrink: 0;
    }

    #bolashakChatWidget .scroll-btn:hover {
        background: var(--secondary-color);
        transform: scale(1.1);
    }

    #bolashakChatWidget #quickReplies {
        display: flex;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        scroll-behavior: smooth;
        padding: 8px 4px;
        gap: 8px;
        flex: 1;
    }

    #bolashakChatWidget #quickReplies::-webkit-scrollbar {
        display: none;
    }

    #bolashakChatWidget .quick-reply {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 6px;
        background: white;
        color: var(--color-text-dark);
        padding: 8px 14px;
        border-radius: 18px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        user-select: none;
        transition: all 0.3s ease;
        border: 1px solid rgba(0, 0, 0, 0.06);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    }

    #bolashakChatWidget .quick-reply .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--secondary-color);
    }

    #bolashakChatWidget .quick-reply:hover {
        transform: translateY(-2px);
        border-color: rgba(3, 150, 255, 0.3);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    #bolashakChatWidget .quick-reply:active {
        transform: translateY(0);
    }


    /* Свернутое состояние быстрых ответов */
    #bolashakChatWidget .quick-replies-section.collapsed {
        max-height: 38px;
        overflow: hidden;
    }
    #bolashakChatWidget .quick-replies-section.collapsed .category-tabs,
    #bolashakChatWidget .quick-replies-section.collapsed .quick-replies-container {
        display: none;
    }
    #bolashakChatWidget .quick-replies-section.collapsed .quick-replies-toggle {
        transform: rotate(180deg);
    }

    /* Пульсирующая подсветка для новых быстрых ответов */
    @keyframes highlight {
        0% { box-shadow: 0 0 0 0 rgba(3, 150, 255, 0.4); }
        70% { box-shadow: 0 0 0 6px rgba(3, 150, 255, 0); }
        100% { box-shadow: 0 0 0 0 rgba(3, 150, 255, 0); }
    }

    #bolashakChatWidget .quick-reply.highlight {
        animation: highlight 1.5s infinite;
        border-color: var(--secondary-color);
    }

    /* Ввод сообщения */
    #bolashakChatWidget .chat-input-container {
        padding: 16px 20px;
        background: var(--bg-panel);
        border-top: 1px solid var(--color-border);
    }

    #bolashakChatWidget .chat-input-container .input-group {
        display: flex;
        align-items: center;
        background: var(--bg-messages);
        border-radius: 24px;
        overflow: hidden;
        padding-left: 16px;
    }

    #bolashakChatWidget .chat-input-container input {
        flex: 1;
        border: none;
        padding: 12px 0;
        font-size: 15px;
        outline: none;
        color: var(--color-text-dark);
        background-color: transparent;
    }

    #bolashakChatWidget .chat-input-container input::placeholder {
        color: var(--color-text-muted);
        opacity: 0.7;
    }

    #bolashakChatWidget .chat-input-container button {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--secondary-gradient);
        color: var(--color-text-light);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition);
        margin-left: 8px;
    }

    #bolashakChatWidget .chat-input-container button:hover {
        transform: rotate(15deg);
    }

    #bolashakChatWidget .chat-input-container button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Адаптивность */
    @media (max-width: 768px) {
        #bolashakChatWidget .chat-widget {
            width: calc(100% - 40px);
            height: calc(100% - 120px);
            bottom: 80px;
            right: 20px;
            left: 20px;
            border-radius: var(--border-radius-md);
            /* Improved mobile animations */
            will-change: transform, opacity;
            transform: translate3d(0, 0, 0);
        }

        #bolashakChatWidget .chat-toggle-btn {
            bottom: 20px;
            right: 20px;
            /* Improved mobile animations */
            will-change: transform;
            transform: translate3d(0, 0, 0);
        }
        
        /* Smooth mobile scrolling */
        #bolashakChatWidget .chat-messages {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
        }
        
        /* Better touch targets */
        #bolashakChatWidget .quick-reply,
        #bolashakChatWidget .category-tab,
        #bolashakChatWidget .scroll-btn {
            min-height: 44px;
            min-width: 44px;
        }
    }

    @media (max-width: 480px) {
        #bolashakChatWidget .chat-header {
            padding: 15px;
        }

        #bolashakChatWidget .chat-widget {
            bottom: 75px;
            border-radius: var(--border-radius-sm);
        }
        
        /* Reduce motion for better mobile performance */
        #bolashakChatWidget .message {
            animation-duration: 0.2s;
        }
        
        #bolashakChatWidget .typing-indicator {
            animation-duration: 0.2s;
        }
    }
    
    /* Error Alert Styles */
    #bolashakChatWidget .error-alert {
        margin: 10px 0;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-left: 4px solid #fdcb6e;
        border-radius: 8px;
        padding: 0;
        animation: slideInAlert 0.3s ease forwards;
    }
    
    #bolashakChatWidget .error-alert-content {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 16px;
    }
    
    #bolashakChatWidget .error-alert-icon {
        color: #e17055;
        flex-shrink: 0;
        margin-top: 2px;
    }
    
    #bolashakChatWidget .error-alert-text {
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
        color: #8b4513;
    }
    
    #bolashakChatWidget .error-alert-text strong {
        color: #d63031;
    }
    
    #bolashakChatWidget .error-alert-close {
        background: none;
        border: none;
        color: #636e72;
        cursor: pointer;
        padding: 2px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
        flex-shrink: 0;
    }
    
    #bolashakChatWidget .error-alert-close:hover,
    #bolashakChatWidget .error-alert-close:focus {
        background: rgba(0, 0, 0, 0.1);
    }
    
    @keyframes slideInAlert {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Enhanced focus indicators for accessibility */
    #bolashakChatWidget button:focus,
    #bolashakChatWidget .quick-reply:focus,
    #bolashakChatWidget .category-tab:focus,
    #bolashakChatWidget .language-option:focus,
    #bolashakChatWidget input:focus {
    }
    
    /* High contrast mode support */
    @media (prefers-contrast: high) {
        #bolashakChatWidget .chat-widget {
            border: 2px solid #000;
        }
        
        #bolashakChatWidget .quick-reply,
        #bolashakChatWidget .category-tab {
            border: 1px solid #000;
        }
    }
    
    /* Reduce motion for users who prefer it */
    @media (prefers-reduced-motion: reduce) {
        #bolashakChatWidget * {
            animation-duration: 0.01s !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01s !important;
        }
        
        #bolashakChatWidget .chat-widget {
            transform: none !important;
        }
        
        #bolashakChatWidget .message { }
    }
    `;
    const EXTRA_CSS = `
    #bolashakChatWidget .splash-loader {
        position: absolute; top:0; left:0; right:0; bottom:0;
        background: linear-gradient(135deg,#C850C0 0%,#FFCC70 100%);
        display: flex; align-items: center; justify-content: center;
        z-index: 1000002; animation: fadeIn 0.3s;
    }
    #bolashakChatWidget .splash-loader .spinner {
        width: 70px; height: 70px;
        border: 8px solid #fff; border-top: 8px solid #5a67d8;
        border-radius: 50%; animation: spin 1.1s linear infinite;
    }
    @keyframes spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
    #bolashakChatWidget .chat-toggle-btn .badge {
        position: absolute; top: 10px; right: 8px; min-width: 21px; height: 21px;
        background: #f5576c; color: #fff; border-radius: 50%;
        font-size: 13px; font-weight: 700; display: flex;
        align-items: center; justify-content: center; box-shadow: 0 2px 7px rgba(0,0,0,0.12);
        z-index: 2;
    }
    `;

    function injectDependencies() {
        if (!document.getElementById('bolashakWidgetStyle')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'bolashakWidgetStyle';
            styleTag.textContent = EMBEDDED_CSS;
            document.head.appendChild(styleTag);
        }
        if (!document.getElementById('bolashakExtraStyle')) {
            const styleTag2 = document.createElement('style');
            styleTag2.id = 'bolashakExtraStyle';
            styleTag2.textContent = EXTRA_CSS;
            document.head.appendChild(styleTag2);
        }
    }

    // Быстрые ответы
    const QUICK_REPLIES_DATA = {
        main: [
            { text: "Как поступить?", icon: SVG_ICONS.question },
            { text: "Документы", icon: SVG_ICONS.document },
            { text: "Специальности", icon: SVG_ICONS.specialties },
            { text: "О университете", icon: SVG_ICONS.university },
            { text: "Спасибо", icon: SVG_ICONS.thanks }
        ],
        admission: [
            { text: "Сроки поступления", icon: SVG_ICONS.graduation },
            { text: "Требования к абитуриентам", icon: SVG_ICONS.document },
            { text: "Стоимость обучения", icon: SVG_ICONS.info },
            { text: "Вступительные экзамены", icon: SVG_ICONS.graduation }
        ],
        documents: [
            { text: "Список документов", icon: SVG_ICONS.document },
            { text: "Подача онлайн", icon: SVG_ICONS.info },
            { text: "Сроки подачи", icon: SVG_ICONS.info }
        ],
        about: [
            { text: "История университета", icon: SVG_ICONS.university },
            { text: "Преподаватели", icon: SVG_ICONS.info },
            { text: "Кампус и общежития", icon: SVG_ICONS.university },
            { text: "Международные программы", icon: SVG_ICONS.graduation }
        ]
    };

    class BolashakWidget {
        constructor() {
            this.isOpen = false;
            this.language = WIDGET_CONFIG.language;
            this.currentCategory = 'main';
            this.unreadCount = 0;
            this.isSplashShown = false;
            this.init();
        }

        init() {
            injectDependencies();
            this.showSplashLoader();
            setTimeout(() => {
                this.createWidget();
                this.bindEvents();
                this.showWelcomeMessage();
                this.loadQuickReplies('main');
                this.hideSplashLoader();
            }, 950); // имитируем загрузку
        }

        showSplashLoader() {
            if (this.isSplashShown) return;
            this.splashEl = document.createElement('div');
            this.splashEl.className = 'splash-loader';
            this.splashEl.innerHTML = `<div class="spinner"></div>`;
            document.body.appendChild(this.splashEl);
            this.isSplashShown = true;
        }
        hideSplashLoader() {
            if (this.splashEl) {
                this.splashEl.style.opacity = '0';
                setTimeout(() => this.splashEl.remove(), 400);
            }
            this.isSplashShown = false;
        }

        updateUnreadBadge() {
            if (!this.toggleBtn) return;
            let badge = this.toggleBtn.querySelector('.badge');
            if (this.unreadCount > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'badge';
                    this.toggleBtn.appendChild(badge);
                }
                badge.textContent = this.unreadCount;
            } else if (badge) {
                badge.remove();
            }
        }

        createWidget() {
            this.container = document.createElement('div');
            this.container.id = 'bolashakChatWidget';

            const widget = document.createElement('div');
            widget.className = 'chat-widget';
            widget.id = 'chatWidget';
            widget.setAttribute('role', 'dialog');
            widget.setAttribute('aria-modal', 'true');
            widget.setAttribute('aria-label', 'Чат с QabyldauBot - помощником университета Болашак');

             widget.innerHTML = `
                            <div class="chat-header">
                                <div class="chat-header-info">
                                    <div class="icon">${SVG_ICONS.robot}</div>
                                    <div>
                                        <div class="chat-header-title">${WIDGET_CONFIG.title}</div>
                                        <div class="chat-header-status">онлайн</div>
                                    </div>
                                </div>
                                <div class="chat-controls">
                                    <div class="language-switcher" id="languageSwitcher" role="group" aria-label="Выбор языка">
                                        <div class="language-option ru active" data-lang="ru" role="button" tabindex="0" aria-label="Переключить на русский язык">RU</div>
                                        <div class="language-option kz" data-lang="kz" role="button" tabindex="0" aria-label="Қазақ тіліне ауысу">KZ</div>
                                    </div>
                                    <button class="chat-close" aria-label="Закрыть чат" tabindex="0">
                                        ${SVG_ICONS.times}
                                    </button>
                                </div>
                            </div>
                            <div class="chat-messages" id="chatMessages" role="log" aria-live="polite" aria-label="Сообщения чата">
                                <div id="typingIndicator" class="typing-indicator" style="display:none;" aria-live="polite">
                                    <div class="typing-indicator-wrapper">
                                        <div class="typing-avatar">
                                            ${SVG_ICONS.botAvatar}
                                        </div>
                                        <div class="typing-dots">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="quick-replies-section" id="quickRepliesSection">
                                <div class="quick-replies-title">
                                    <h4>${SVG_ICONS.category} Быстрые ответы</h4>
                                    <button class="quick-replies-toggle" id="quickRepliesToggle" aria-label="Свернуть/развернуть быстрые ответы" tabindex="0">
                                        ${SVG_ICONS.close}
                                    </button>
                                </div>
                                <div class="category-tabs" id="categoryTabs" role="tablist" aria-label="Категории быстрых ответов">
                                    <button class="category-tab active" data-category="main" role="tab" tabindex="0" aria-selected="true" aria-label="Основные вопросы">Основное</button>
                                    <button class="category-tab" data-category="admission" role="tab" tabindex="-1" aria-selected="false" aria-label="Вопросы о поступлении">Поступление</button>
                                    <button class="category-tab" data-category="documents" role="tab" tabindex="-1" aria-selected="false" aria-label="Вопросы о документах">Документы</button>
                                    <button class="category-tab" data-category="about" role="tab" tabindex="-1" aria-selected="false" aria-label="О университете">О нас</button>
                                </div>
                                <div class="quick-replies-container">
                                    <button class="scroll-btn left" aria-label="Прокрутить быстрые ответы влево" tabindex="0">&lt;</button>
                                    <div class="quick-replies" id="quickReplies" role="group" aria-label="Быстрые ответы"></div>
                                    <button class="scroll-btn right" aria-label="Прокрутить быстрые ответы вправо" tabindex="0">&gt;</button>
                                </div>
                            </div>
                            <div class="chat-input-container">
                                <div class="input-group">
                                    <input type="text" id="chatInput" placeholder="Введите ваш вопрос..." aria-label="Введите ваш вопрос" tabindex="0">
                                    <button class="chat-send" type="button" aria-label="Отправить сообщение" tabindex="0">
                                        ${SVG_ICONS.paperPlane}
                                    </button>
                                </div>
                            </div>
                        `;

                        const toggleBtn = document.createElement('button');
                        toggleBtn.id = 'chatToggle';
                        toggleBtn.className = 'chat-toggle-btn';
                        toggleBtn.innerHTML = SVG_ICONS.comments;
                        toggleBtn.setAttribute('aria-label', 'Открыть чат с QabyldauBot');
                        toggleBtn.setAttribute('tabindex', '0');

                        this.container.appendChild(toggleBtn);
                        this.container.appendChild(widget);
                        document.body.appendChild(this.container);

                        this.widget = widget;
                        this.toggleBtn = toggleBtn;
                        this.chatMessages = this.container.querySelector('#chatMessages');
                        this.inputField = this.container.querySelector('#chatInput');
                        this.sendButton = this.container.querySelector('.chat-send');
                        this.quickReplies = this.container.querySelector('#quickReplies');
                        this.quickRepliesSection = this.container.querySelector('#quickRepliesSection');
                        this.quickRepliesToggle = this.container.querySelector('#quickRepliesToggle');
                        this.categoryTabs = this.container.querySelector('#categoryTabs');
                        this.languageSwitcher = this.container.querySelector('#languageSwitcher');
                        this.languageOptions = this.container.querySelectorAll('.language-option');
                        this.typingIndicator = this.container.querySelector('#typingIndicator');
                        this.closeBtn = this.container.querySelector('.chat-close');
                        this.scrollLeft = this.container.querySelector('.scroll-btn.left');
                        this.scrollRight = this.container.querySelector('.scroll-btn.right');

                        this.widget.style[this.getHorizontalPosition()] = '20px';
                        this.toggleBtn.style[this.getHorizontalPosition()] = '20px';

                        this.setActiveLanguage(this.language);
                    }

                    bindEvents() {
                        this.toggleBtn.addEventListener('click', () => this.openChat());
                        this.closeBtn.addEventListener('click', () => this.closeChat());
                        this.quickRepliesToggle.addEventListener('click', () => this.toggleQuickReplies());
                        this.sendButton.addEventListener('click', () => this.sendMessage());
                        
                        // Keyboard navigation for main elements
                        this.toggleBtn.addEventListener('keydown', (e) => this.handleKeyDown(e, () => this.openChat()));
                        this.closeBtn.addEventListener('keydown', (e) => this.handleKeyDown(e, () => this.closeChat()));
                        this.quickRepliesToggle.addEventListener('keydown', (e) => this.handleKeyDown(e, () => this.toggleQuickReplies()));
                        this.sendButton.addEventListener('keydown', (e) => this.handleKeyDown(e, () => this.sendMessage()));
                        
                        // Global ESC key handler
                        document.addEventListener('keydown', (e) => {
                            if (e.key === 'Escape' && this.isOpen) {
                                this.closeChat();
                            }
                        });
                        
                        this.inputField.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                this.sendMessage();
                            }
                        });

                        // Category tabs navigation
                        this.categoryTabs.querySelectorAll('.category-tab').forEach((tab, index) => {
                            tab.addEventListener('click', (e) => {
                                const category = e.target.dataset.category;
                                this.setActiveCategory(category);
                                this.loadQuickReplies(category);
                            });
                            
                            tab.addEventListener('keydown', (e) => {
                                this.handleTabNavigation(e, index);
                            });
                        });

                        // Language switcher navigation
                        this.languageOptions.forEach(option => {
                            option.addEventListener('click', (e) => {
                                const lang = e.target.dataset.lang;
                                this.setActiveLanguage(lang);
                                this.language = lang;
                                this.showWelcomeMessage();
                            });
                            
                            option.addEventListener('keydown', (e) => this.handleKeyDown(e, () => {
                                const lang = e.target.dataset.lang;
                                this.setActiveLanguage(lang);
                                this.language = lang;
                                this.showWelcomeMessage();
                            }));
                        });

                        // Scroll buttons navigation
                        this.scrollLeft.addEventListener('click', () => this.quickReplies.scrollBy({ left: -120, behavior: 'smooth' }));
                        this.scrollRight.addEventListener('click', () => this.quickReplies.scrollBy({ left: 120, behavior: 'smooth' }));
                        this.scrollLeft.addEventListener('keydown', (e) => this.handleKeyDown(e, () => this.quickReplies.scrollBy({ left: -120, behavior: 'smooth' })));
                        this.scrollRight.addEventListener('keydown', (e) => this.handleKeyDown(e, () => this.quickReplies.scrollBy({ left: 120, behavior: 'smooth' })));
                    }

                    // Enhanced keyboard navigation handler
                    handleKeyDown(event, callback) {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            callback();
                        }
                    }

                    // Tab navigation for category tabs
                    handleTabNavigation(event, currentIndex) {
                        const tabs = this.categoryTabs.querySelectorAll('.category-tab');
                        let newIndex = currentIndex;
                        
                        switch(event.key) {
                            case 'ArrowLeft':
                                event.preventDefault();
                                newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                                break;
                            case 'ArrowRight':
                                event.preventDefault();
                                newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                                break;
                            case 'Enter':
                            case ' ':
                                event.preventDefault();
                                const category = tabs[currentIndex].dataset.category;
                                this.setActiveCategory(category);
                                this.loadQuickReplies(category);
                                return;
                            default:
                                return;
                        }
                        
                        // Update focus and selection
                        tabs.forEach((tab, index) => {
                            if (index === newIndex) {
                                tab.focus();
                                tab.setAttribute('tabindex', '0');
                                tab.setAttribute('aria-selected', 'true');
                            } else {
                                tab.setAttribute('tabindex', '-1');
                                tab.setAttribute('aria-selected', 'false');
                            }
                        });
                    }

                    setActiveLanguage(lang) {
                        this.languageOptions.forEach(option => {
                            option.classList.remove('active');
                        });
                        const activeOption = this.languageSwitcher.querySelector(`.language-option[data-lang="${lang}"]`);
                        if (activeOption) activeOption.classList.add('active');
                        if (lang === 'kz') {
                            this.languageSwitcher.classList.add('kz');
                        } else {
                            this.languageSwitcher.classList.remove('kz');
                        }
                    }

                    setActiveCategory(category) {
                        this.categoryTabs.querySelectorAll('.category-tab').forEach((tab, index) => {
                            tab.classList.remove('active');
                            tab.setAttribute('tabindex', '-1');
                            tab.setAttribute('aria-selected', 'false');
                        });
                        const activeTab = this.categoryTabs.querySelector(`.category-tab[data-category="${category}"]`);
                        if (activeTab) {
                            activeTab.classList.add('active');
                            activeTab.setAttribute('tabindex', '0');
                            activeTab.setAttribute('aria-selected', 'true');
                        }
                        this.currentCategory = category;
                    }

                    toggleQuickReplies() {
                        this.quickRepliesSection.classList.toggle('collapsed');
                    }

                    openChat() {
                        this.widget.classList.add('active');
                        this.isOpen = true;
                        this.toggleBtn.style.display = 'none';
                        this.unreadCount = 0;
                        this.updateUnreadBadge();
                        
                        // Set focus on input field with a slight delay for better UX
                        setTimeout(() => {
                            this.inputField.focus();
                            this.scrollToBottom();
                        }, 300);
                    }

                    closeChat() {
                        this.widget.classList.remove('active');
                        this.isOpen = false;
                        setTimeout(() => {
                            this.toggleBtn.style.display = 'flex';
                            // Return focus to the toggle button
                            this.toggleBtn.focus();
                        }, 300);
                    }

                    showWelcomeMessage() {
                        Array.from(this.chatMessages.children).forEach(child => {
                            if (child.id !== 'typingIndicator') child.remove();
                        });
                        const message = document.createElement('div');
                        message.className = 'message bot-message';
                        message.innerHTML = `
                            <div class="message-wrapper">
                                <div class="message-avatar">
                                    ${SVG_ICONS.botAvatar}
                                </div>
                                <div class="message-container">
                                    <div class="message-content">
                                        <strong>QabyldauBot:</strong> ${this.getWelcomeText()}
                                    </div>
                                </div>
                            </div>
                            <div class="message-time">Сейчас</div>
                        `;
                        this.chatMessages.insertBefore(message, this.typingIndicator);
                    }

                    getWelcomeText() {
                        if (this.language === 'kz') {
                            return 'Сәлеметсіз бе! Мен QabyldauBot боламын, Болашақ университетіне түсу мәселелері бойынша сіздің көмекшіңіз. Кез келген сұрақ қойыңыз!';
                        }
                        return WIDGET_CONFIG.welcomeMessage;
                    }

                    addMessage(sender, text, isHtml = false) {
                        const message = document.createElement('div');
                        message.className = sender === 'bot' ? 'message bot-message' : 'message user-message';
                        const avatar = sender === 'bot' ? SVG_ICONS.botAvatar : SVG_ICONS.userAvatar;
                        const namePrefix = sender === 'bot' ? '<strong>QabyldauBot:</strong> ' : '';
                        message.innerHTML = `
                            <div class="message-wrapper">
                                <div class="message-avatar">
                                    ${avatar}
                                </div>
                                <div class="message-container">
                                    <div class="message-content">
                                        ${namePrefix}${isHtml ? text : this.escapeHtml(text)}
                                    </div>
                                </div>
                            </div>
                            <div class="message-time">${this.getTime()}</div>
                        `;
                        if (this.typingIndicator && this.typingIndicator.parentNode === this.chatMessages) {
                            this.chatMessages.insertBefore(message, this.typingIndicator);
                        } else {
                            this.chatMessages.appendChild(message);
                        }
                        this.scrollToBottom();
                        if (sender === 'bot' && !this.isOpen) {
                            this.unreadCount++;
                            this.updateUnreadBadge();
                        }
                    }

                    escapeHtml(text) {
                        const div = document.createElement('div');
                        div.textContent = text;
                        return div.innerHTML;
                    }

                    getTime() {
                        const now = new Date();
                        return now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                    }

                    scrollToBottom() {
                        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
                    }

                    showTyping() {
                        if (this.typingIndicator) {
                            this.typingIndicator.style.display = 'block';
                            this.scrollToBottom();
                        }
                    }
                    hideTyping() {
                        if (this.typingIndicator) {
                            this.typingIndicator.style.display = 'none';
                        }
                    }

                    loadQuickReplies(category = 'main', highlightItems = []) {
                        const replies = QUICK_REPLIES_DATA[category] || QUICK_REPLIES_DATA.main;
                        this.quickReplies.innerHTML = '';
                        replies.forEach((item, index) => {
                            const btn = document.createElement('div');
                            btn.className = 'quick-reply';
                            btn.setAttribute('role', 'button');
                            btn.setAttribute('tabindex', '0');
                            btn.setAttribute('aria-label', `Быстрый ответ: ${item.text}`);
                            
                            if (highlightItems && highlightItems.includes(item.text)) {
                                btn.classList.add('highlight');
                            }
                            btn.innerHTML = `
                                <span class="icon">${item.icon || ''}</span>
                                <span>${item.text}</span>
                            `;
                            
                            const clickHandler = () => {
                                this.inputField.value = item.text;
                                this.sendMessage();
                                btn.classList.remove('highlight');
                            };
                            
                            btn.onclick = clickHandler;
                            btn.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    clickHandler();
                                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                                    this.handleQuickReplyNavigation(e, index, replies.length);
                                }
                            });
                            
                            this.quickReplies.appendChild(btn);
                        });
                    }

                    // Navigation for quick reply buttons
                    handleQuickReplyNavigation(event, currentIndex, totalCount) {
                        const quickReplyButtons = this.quickReplies.querySelectorAll('.quick-reply');
                        let newIndex = currentIndex;
                        
                        if (event.key === 'ArrowLeft') {
                            event.preventDefault();
                            newIndex = currentIndex > 0 ? currentIndex - 1 : totalCount - 1;
                        } else if (event.key === 'ArrowRight') {
                            event.preventDefault();
                            newIndex = currentIndex < totalCount - 1 ? currentIndex + 1 : 0;
                        }
                        
                        if (quickReplyButtons[newIndex]) {
                            quickReplyButtons[newIndex].focus();
                            quickReplyButtons[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                        }
                    }

                    suggestRelevantReplies(userMessage) {
                        const lowercaseMessage = userMessage.toLowerCase();
                        if (lowercaseMessage.includes('документ') || lowercaseMessage.includes('подать')) {
                            this.setActiveCategory('documents');
                            this.loadQuickReplies('documents', ['Список документов']);
                            return;
                        }
                        if (lowercaseMessage.includes('поступ') || lowercaseMessage.includes('экзамен') || 
                            lowercaseMessage.includes('стоимость') || lowercaseMessage.includes('цена')) {
                            this.setActiveCategory('admission');
                            this.loadQuickReplies('admission', ['Стоимость обучения', 'Вступительные экзамены']);
                            return;
                        }
                        if (lowercaseMessage.includes('университет') || lowercaseMessage.includes('общежит') || 
                            lowercaseMessage.includes('кампус') || lowercaseMessage.includes('о вас')) {
                            this.setActiveCategory('about');
                            this.loadQuickReplies('about', ['История университета', 'Кампус и общежития']);
                            return;
                        }
                    }

                    async sendMessage() {
                        const text = this.inputField.value.trim();
                        if (!text) return;
                        this.addMessage('user', text);
                        this.inputField.value = '';
                        this.sendButton.disabled = true;
                        this.suggestRelevantReplies(text);
                        try {
                            this.showTyping();
                            const response = await fetch(`${WIDGET_CONFIG.apiEndpoint}/api/chat`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', },
                                body: JSON.stringify({ message: text, language: this.language, agent_type: 'communication' })
                            });
                            if (!response.ok) {
                                let errText = 'Сервис временно недоступен. Попробуйте позже.';
                                if (response.status === 503) { errText = 'Сервер перегружен или недоступен (503). Попробуйте позже.'; }
                                this.hideTyping();
                                this.addMessage('bot', errText);
                                this.showErrorAlert('Ошибка сети', errText);
                                return;
                            }
                            const data = await response.json();
                            this.hideTyping();
                            this.addMessage('bot', data.response || 'Извините, произошла ошибка. Попробуйте позже.', false);
                            if (data.quickReplies && data.quickReplies.length > 0) {
                                QUICK_REPLIES_DATA.results = data.quickReplies.map(text => ({
                                    text,
                                    icon: SVG_ICONS.info
                                }));
                                if (!this.categoryTabs.querySelector('[data-category="results"]')) {
                                    const resultsTab = document.createElement('button');
                                    resultsTab.className = 'category-tab';
                                    resultsTab.dataset.category = 'results';
                                    resultsTab.textContent = 'Результаты';
                                    resultsTab.setAttribute('role', 'tab');
                                    resultsTab.setAttribute('tabindex', '-1');
                                    resultsTab.setAttribute('aria-selected', 'false');
                                    resultsTab.setAttribute('aria-label', 'Результаты поиска');
                                    resultsTab.addEventListener('click', () => {
                                        this.setActiveCategory('results');
                                        this.loadQuickReplies('results');
                                    });
                                    resultsTab.addEventListener('keydown', (e) => {
                                        const tabs = Array.from(this.categoryTabs.querySelectorAll('.category-tab'));
                                        const index = tabs.indexOf(resultsTab);
                                        this.handleTabNavigation(e, index);
                                    });
                                    this.categoryTabs.appendChild(resultsTab);
                                }
                                this.setActiveCategory('results');
                                this.loadQuickReplies('results', data.quickReplies);
                            }
                        } catch (error) {
                            console.error('Error sending message:', error);
                            this.hideTyping();
                            const errorMessage = 'Извините, произошла ошибка соединения. Проверьте интернет и попробуйте снова.';
                            this.addMessage('bot', errorMessage);
                            this.showErrorAlert('Ошибка соединения', errorMessage);
                        } finally {
                            this.sendButton.disabled = false;
                            this.inputField.focus();
                        }
                    }

                    // Show visual error alert
                    showErrorAlert(title, message) {
                        // Remove any existing error alerts
                        const existingAlert = this.chatMessages.querySelector('.error-alert');
                        if (existingAlert) {
                            existingAlert.remove();
                        }
                        
                        const errorAlert = document.createElement('div');
                        errorAlert.className = 'error-alert';
                        errorAlert.setAttribute('role', 'alert');
                        errorAlert.setAttribute('aria-live', 'assertive');
                        errorAlert.innerHTML = `
                            <div class="error-alert-content">
                                <div class="error-alert-icon">${SVG_ICONS.info}</div>
                                <div class="error-alert-text">
                                    <strong>${title}:</strong> ${message}
                                </div>
                                <button class="error-alert-close" aria-label="Закрыть уведомление об ошибке" tabindex="0">
                                    ${SVG_ICONS.times}
                                </button>
                            </div>
                        `;
                        
                        const closeBtn = errorAlert.querySelector('.error-alert-close');
                        closeBtn.addEventListener('click', () => errorAlert.remove());
                        closeBtn.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                errorAlert.remove();
                            }
                        });
                        
                        this.chatMessages.appendChild(errorAlert);
                        this.scrollToBottom();
                        
                        // Auto-remove after 10 seconds
                        setTimeout(() => {
                            if (errorAlert.parentNode) {
                                errorAlert.remove();
                            }
                        }, 10000);
                    }

                    getHorizontalPosition() {
                        return WIDGET_CONFIG.position === 'bottom-left' ? 'left' : 'right';
                    }
                }

                function initBolashakWidget() {
                    new BolashakWidget();
                }

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initBolashakWidget);
                } else {
                    initBolashakWidget();
                }

                window.BolashakWidget = BolashakWidget;
                window.BOLASHAK_WIDGET_CONFIG = WIDGET_CONFIG;
            })();