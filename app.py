# Импорт необходимых библиотек
import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix

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
    # Установка секретного ключа для сессий
    app.secret_key = os.environ.get("SESSION_SECRET",
                                    "dev-secret-key-change-in-production")
    # Настройка ProxyFix для работы за прокси
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

    # Настройка базы данных - принудительно используем SQLite для стабильности
    database_url = os.environ.get("DATABASE_URL")
    if not database_url or database_url.strip() == "" or "neon.tech" in database_url:
        database_url = "sqlite:///bolashakbot.db"
        logging.info("Using SQLite database: bolashakbot.db")
    else:
        logging.info(f"Using database: {database_url}")
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    # Настройки движка базы данных
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,  # Переподключение каждые 5 минут
        "pool_pre_ping": True,  # Проверка соединения перед использованием
    }
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

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

# Запуск приложения в режиме разработки
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
