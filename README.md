# BolashakChat - Multi-Agent Chatbot System

![Python](https://img.shields.io/badge/python-v3.11+-blue.svg)
![Flask](https://img.shields.io/badge/flask-v3.1+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

Интеллектуальная система чат-бота для Кызылординского университета "Болашак" с мультиагентной архитектурой.

## 🚀 Особенности

- **Мультиагентная архитектура** с 5 специализированными агентами
- **Многоязычная поддержка** (русский, казахский языки)
- **Admin панель** для управления контентом
- **Аналитика в реальном времени** с интерактивными графиками
- **REST API** для интеграции с внешними системами
- **Загрузка документов** (PDF, DOC, TXT)
- **Веб-скрапинг** для автоматического обновления контента
- **Production-ready** конфигурация с Docker

## 🏗️ Архитектура

```
Frontend (Chat UI) → API Gateway (/api/chat) → AgentRouter → Specialized Agents → MistralClient
```

### Специализированные агенты:
- **AdmissionAgent**: Поступление и зачисление
- **ScholarshipAgent**: Стипендии и финансовая поддержка  
- **AcademicAgent**: Учебные вопросы и образовательный процесс
- **StudentLifeAgent**: Студенческая жизнь и внеучебная деятельность
- **GeneralAgent**: Общие вопросы и информация об университете

## 📋 Требования

- Python 3.11+
- PostgreSQL 15+ (для production)
- SQLite 3+ (для development)
- Mistral AI API key

## 🛠️ Установка и запуск

### Локальная разработка

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/romchy222/BolashakChat.git
   cd BolashakChat
   ```

2. **Создайте виртуальное окружение:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # или
   venv\Scripts\activate     # Windows
   ```

3. **Установите зависимости:**
   ```bash
   pip install flask flask-sqlalchemy flask-cors gunicorn psycopg2-binary
   pip install requests sqlalchemy trafilatura werkzeug pypdf2==3.0.1 email-validator
   ```

4. **Настройте переменные окружения:**
   ```bash
   cp .env.example .env
   # Отредактируйте .env файл с вашими настройками
   ```

5. **Запустите приложение:**
   ```bash
   python app.py
   ```

### Docker Compose (рекомендуется)

#### Development
```bash
# Скопируйте и настройте environment файл
cp .env.example .env

# Запустите в development режиме
docker-compose -f docker-compose.dev.yml up --build
```

#### Production
```bash
# Настройте production переменные
export SESSION_SECRET="ваш-супер-секретный-ключ"
export MISTRAL_API_KEY="ваш-mistral-api-ключ"

# Запустите в production режиме
docker-compose up -d --build
```

## 🔧 Конфигурация

### Переменные окружения

| Переменная | Описание | Default | Обязательная |
|------------|----------|---------|--------------|
| `FLASK_ENV` | Режим приложения | `development` | Нет |
| `SESSION_SECRET` | Секретный ключ сессий | - | **Да (production)** |
| `MISTRAL_API_KEY` | API ключ Mistral AI | - | **Да** |
| `DATABASE_URL` | URL базы данных | `sqlite:///bolashakbot.db` | Нет |
| `PORT` | Порт приложения | `5000` | Нет |
| `LOG_LEVEL` | Уровень логирования | `INFO` | Нет |

### Production конфигурация

Для production развертывания обязательно:

1. **Установите переменные окружения:**
   ```bash
   export FLASK_ENV=production
   export SESSION_SECRET="ваш-сложный-секретный-ключ-минимум-32-символа"
   export MISTRAL_API_KEY="ваш-mistral-api-ключ"
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

2. **Используйте HTTPS** с SSL сертификатами
3. **Настройте firewall** и ограничьте доступ к портам
4. **Настройте мониторинг** и логирование
5. **Настройте резервное копирование** базы данных

## 🎯 API Endpoints

### Основные маршруты
- `GET /` - Главная страница с чат-виджетом
- `GET /chat` - Полноэкранная страница чата
- `POST /api/chat` - API для отправки сообщений
- `GET /health` - Health check для мониторинга

### Admin панель
- `GET /admin/` - Главная панель администратора
- `GET /admin/login` - Вход в админ панель
- `GET /admin/faqs` - Управление FAQ
- `GET /admin/documents` - Управление документами
- `GET /admin/analytics` - Аналитика и статистика

### API для аналитики
- `GET /admin/api/analytics/agents` - Статистика по агентам
- `GET /admin/api/analytics/summary` - Сводная аналитика
- `GET /api/agents` - Информация о доступных агентах

## 📊 Мониторинг

### Health Checks
```bash
# Проверка состояния приложения
curl http://localhost:8000/health

# Ответ:
{
  "status": "healthy",
  "timestamp": 1672531200.0,
  "database": "connected"
}
```

### Логирование
- Логи приложения сохраняются в `/app/logs/` (в Docker)
- Уровень логирования настраивается через `LOG_LEVEL`
- Формат: `timestamp - logger - level - message`

## 🔒 Безопасность

### Реализованные меры безопасности:
- ✅ Хэширование паролей (Werkzeug)
- ✅ Environment-based конфигурация
- ✅ CORS настройки
- ✅ Session management
- ✅ Input validation
- ✅ SQL injection protection (SQLAlchemy ORM)
- ✅ Rate limiting (через nginx)
- ✅ Security headers
- ✅ Non-root Docker user

### Рекомендации для production:
- Используйте сильные пароли и секретные ключи
- Настройте HTTPS с валидными SSL сертификатами
- Ограничьте доступ к admin панели по IP
- Регулярно обновляйте зависимости
- Настройте мониторинг безопасности
- Делайте регулярные резервные копии

## 🧪 Тестирование

```bash
# Установка зависимостей для тестирования
pip install pytest pytest-flask

# Запуск тестов
pytest

# Проверка запуска приложения
python -c "from app import create_app; app = create_app(); print('OK')"
```

## 📈 Развертывание

### Docker Hub / GitHub Container Registry

```bash
# Сборка образа
docker build -t bolashak-chat:latest .

# Запуск контейнера
docker run -d \
  -p 8000:8000 \
  -e FLASK_ENV=production \
  -e SESSION_SECRET="ваш-секретный-ключ" \
  -e MISTRAL_API_KEY="ваш-api-ключ" \
  bolashak-chat:latest
```

### CI/CD

Проект включает GitHub Actions workflow для:
- Автоматического тестирования
- Сборки Docker образа
- Security scanning
- Deployment в различные окружения

## 🤝 Вклад в разработку

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

Если у вас есть вопросы или проблемы:

1. Проверьте [Issues](https://github.com/romchy222/BolashakChat/issues)
2. Создайте новый Issue с подробным описанием
3. Используйте health check endpoint для диагностики: `/health`

## 📚 Дополнительная документация

- [Multi-Agent Architecture](docs/multi-agent-architecture.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)