# Импорт необходимых библиотек
import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
from config import get_config, setup_logging

# Настройка логирования
logging.basicConfig(level=logging.DEBUG)


# Базовый класс для моделей базы данных
class Base(DeclarativeBase):
    pass


# Инициализация объекта базы данных
db = SQLAlchemy(model_class=Base)


def create_app():
    """Функция создания и настройки Flask приложения"""
    # Создание экземпляра Flask приложения
    app = Flask(__name__)
    
    # Загрузка конфигурации
    config_class = get_config()
    app.config.from_object(config_class)
    
    # Установка секретного ключа для сессий с проверкой безопасности
    secret_key = os.environ.get("SESSION_SECRET")
    if not secret_key:
        if os.environ.get("FLASK_ENV") == "production":
            raise ValueError("SESSION_SECRET must be set in production environment")
        secret_key = "dev-secret-key-change-in-production"
    app.secret_key = secret_key
    
    # Настройка ProxyFix для работы за прокси
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

    # Настройка логирования
    setup_logging(app)

    # Инициализация базы данных с приложением
    db.init_app(app)

    # Настройка CORS (разрешение кросс-доменных запросов)
    CORS(
        app,
        origins=[
            "https://7a0463a0-cbab-40ed-8964-1461cf93cb8a-00-tv6bvx5wqo3s.pike.replit.dev",
            "https://*.replit.dev",  # Разрешить все поддомены replit.dev
            "http://localhost:*",  # Для локальной разработки
            "https://localhost:*"  # Для локальной разработки с HTTPS
        ],
        supports_credentials=True)

    # Импорт модулей с маршрутами (blueprints)
    from views import main_bp
    from admin import admin_bp
    from auth import auth_bp

    # Регистрация модулей маршрутов
    app.register_blueprint(main_bp)  # Основные страницы
    app.register_blueprint(admin_bp, url_prefix='/admin')  # Админ панель
    app.register_blueprint(auth_bp, url_prefix='/auth')  # Аутентификация

    # Инициализация в контексте приложения
    with app.app_context():
        # Импорт моделей для регистрации в SQLAlchemy
        import models

        # Создание всех таблиц в базе данных
        db.create_all()

        # Инициализация начальных данных с задержкой
        # Commented out for now to avoid circular imports
        # try:
        #     from setup_db import init_default_data
        #     init_default_data()
        # except Exception as e:
        #     import logging
        #     logger = logging.getLogger(__name__)
        #     logger.error(f"Error initializing default data: {e}")

    return app


# Создание экземпляра приложения
app = create_app()

# Запуск приложения
if __name__ == '__main__':
    # Используем переменную окружения для debug режима
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
