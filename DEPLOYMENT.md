# Deployment Guide для BolashakChat

Данное руководство описывает процесс развертывания BolashakChat в production окружении.

## 🚀 Quick Start (Docker Compose)

### 1. Подготовка сервера

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установите Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Клонирование и настройка

```bash
# Клонируйте репозиторий
git clone https://github.com/romchy222/BolashakChat.git
cd BolashakChat

# Создайте production конфигурацию
cp .env.example .env.production
```

### 3. Настройка переменных окружения

Отредактируйте `.env.production`:

```bash
# ОБЯЗАТЕЛЬНО ИЗМЕНИТЕ ЭТИ ЗНАЧЕНИЯ
SESSION_SECRET="ваш-сложный-секретный-ключ-минимум-32-символа"
MISTRAL_API_KEY="ваш-mistral-api-ключ"

# Production настройки
FLASK_ENV=production
FLASK_DEBUG=False
SESSION_COOKIE_SECURE=True
LOG_LEVEL=WARNING

# База данных (PostgreSQL)
DATABASE_URL=postgresql://bolashak:strong_password@db:5432/bolashakbot

# Логирование
LOG_FILE=/app/logs/app.log
```

### 4. Запуск в production

```bash
# Загрузите переменные окружения
export $(cat .env.production | xargs)

# Запустите приложение
docker-compose up -d --build

# Проверьте статус
docker-compose ps
docker-compose logs app
```

## 🔧 Детальная настройка

### SSL/HTTPS конфигурация

1. **Получите SSL сертификаты:**

```bash
# Для Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

2. **Настройте nginx для HTTPS:**

Отредактируйте `nginx.conf`, раскомментируйте HTTPS секцию и укажите пути к сертификатам:

```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

3. **Обновите docker-compose.yml:**

```yaml
nginx:
  volumes:
    - /etc/letsencrypt/live/yourdomain.com:/etc/nginx/ssl:ro
```

### База данных

#### PostgreSQL конфигурация

1. **Создание пользователя и базы:**

```sql
-- Подключитесь к PostgreSQL
sudo -u postgres psql

-- Создайте пользователя и базу
CREATE USER bolashak WITH PASSWORD 'strong_password';
CREATE DATABASE bolashakbot OWNER bolashak;
GRANT ALL PRIVILEGES ON DATABASE bolashakbot TO bolashak;
```

2. **Backup стратегия:**

```bash
# Создайте скрипт backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec db pg_dump -U bolashak bolashakbot > backup_$DATE.sql

# Добавьте в crontab
0 2 * * * /path/to/backup.sh
```

### Мониторинг и логирование

#### 1. Health checks

```bash
# Добавьте мониторинг в crontab
*/5 * * * * curl -f http://localhost/health || echo "App down" | mail admin@domain.com
```

#### 2. Логирование

```yaml
# В docker-compose.yml добавьте
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

#### 3. Централизованные логи (опционально)

```yaml
# Добавьте ELK Stack или Fluentd
  elasticsearch:
    image: elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
```

### Безопасность

#### 1. Firewall настройки

```bash
# Настройте UFW
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Ограничьте SSH доступ
sudo ufw limit ssh
```

#### 2. Fail2ban

```bash
# Установите fail2ban
sudo apt install fail2ban

# Создайте конфигурацию для nginx
sudo tee /etc/fail2ban/jail.local << EOF
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600
EOF

sudo systemctl restart fail2ban
```

#### 3. Регулярные обновления

```bash
# Создайте скрипт update.sh
#!/bin/bash
cd /path/to/BolashakChat
git pull origin main
docker-compose build --no-cache
docker-compose up -d

# Добавьте в crontab (еженедельно)
0 3 * * 0 /path/to/update.sh
```

## 📊 Мониторинг Performance

### 1. Docker мониторинг

```bash
# Мониторинг ресурсов
docker stats

# Мониторинг логов
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f nginx
```

### 2. Application мониторинг

```bash
# Health check
curl http://localhost/health

# API проверка
curl -X POST http://localhost/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

### 3. Database мониторинг

```bash
# Подключение к базе
docker-compose exec db psql -U bolashak -d bolashakbot

# Проверка размера базы
SELECT pg_size_pretty(pg_database_size('bolashakbot'));

# Активные соединения
SELECT count(*) FROM pg_stat_activity;
```

## 🔄 CI/CD Pipeline

### GitHub Actions для auto-deployment

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Production Deployment

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.PROD_HOST }}
        username: ${{ secrets.PROD_USER }}
        key: ${{ secrets.PROD_SSH_KEY }}
        script: |
          cd /path/to/BolashakChat
          git pull origin main
          docker-compose down
          docker-compose up -d --build
```

## 🚨 Troubleshooting

### Общие проблемы

1. **Приложение не запускается:**
```bash
# Проверьте логи
docker-compose logs app

# Проверьте переменные окружения
docker-compose exec app env | grep FLASK
```

2. **База данных недоступна:**
```bash
# Проверьте статус PostgreSQL
docker-compose exec db pg_isready -U bolashak

# Проверьте соединение
docker-compose exec app python -c "from app import db; print(db.engine.execute('SELECT 1'))"
```

3. **Nginx ошибки:**
```bash
# Проверьте конфигурацию
docker-compose exec nginx nginx -t

# Проверьте логи
docker-compose logs nginx
```

### Performance проблемы

1. **Медленные запросы:**
```sql
-- Включите логирование медленных запросов в PostgreSQL
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

2. **Высокое использование памяти:**
```bash
# Ограничьте память для контейнеров
services:
  app:
    mem_limit: 512m
  db:
    mem_limit: 1g
```

## 📋 Checklist перед production

- [ ] ✅ Установлены сильные пароли и секретные ключи
- [ ] ✅ Настроен HTTPS с валидными SSL сертификатами
- [ ] ✅ Настроен firewall
- [ ] ✅ Настроено резервное копирование базы данных
- [ ] ✅ Настроен мониторинг и алерты
- [ ] ✅ Проверены логи и их ротация
- [ ] ✅ Настроены автоматические обновления
- [ ] ✅ Проведено нагрузочное тестирование
- [ ] ✅ Подготовлен план восстановления после сбоя
- [ ] ✅ Документирован процесс развертывания

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи приложения: `docker-compose logs app`
2. Проверьте health endpoint: `curl http://localhost/health`
3. Обратитесь к [Issues](https://github.com/romchy222/BolashakChat/issues)
4. Создайте новый Issue с детальным описанием проблемы