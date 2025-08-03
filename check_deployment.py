#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт проверки готовности к деплою для BolashakChat
Deployment Readiness Check Script for BolashakChat

Этот скрипт выполняет комплексную проверку готовности проекта к деплою.
"""

import os
import sys
import importlib.util
import subprocess
import json
from datetime import datetime


def check_python_version():
    """Проверка версии Python"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 11):
        return False, f"Требуется Python 3.11+, установлен {version.major}.{version.minor}"
    return True, f"Python {version.major}.{version.minor}.{version.micro}"


def check_dependencies():
    """Проверка установленных зависимостей"""
    required_packages = [
        'flask', 'flask_sqlalchemy', 'flask_cors', 'gunicorn', 
        'sqlalchemy', 'requests', 'werkzeug', 'psycopg2'
    ]
    
    missing = []
    installed = []
    
    for package in required_packages:
        try:
            spec = importlib.util.find_spec(package)
            if spec is None:
                missing.append(package)
            else:
                installed.append(package)
        except ImportError:
            missing.append(package)
    
    if missing:
        return False, f"Отсутствуют пакеты: {', '.join(missing)}"
    return True, f"Все зависимости установлены ({len(installed)} пакетов)"


def check_project_structure():
    """Проверка структуры проекта"""
    required_files = [
        'app.py', 'models.py', 'views.py', 'admin.py', 'auth.py',
        'pyproject.toml', '.env.example'
    ]
    
    required_dirs = [
        'templates', 'static', '.github/workflows'
    ]
    
    missing_files = []
    missing_dirs = []
    
    for file in required_files:
        if not os.path.isfile(file):
            missing_files.append(file)
    
    for dir_path in required_dirs:
        if not os.path.isdir(dir_path):
            missing_dirs.append(dir_path)
    
    if missing_files or missing_dirs:
        issues = []
        if missing_files:
            issues.append(f"файлы: {', '.join(missing_files)}")
        if missing_dirs:
            issues.append(f"директории: {', '.join(missing_dirs)}")
        return False, f"Отсутствуют {'; '.join(issues)}"
    
    return True, "Структура проекта корректна"


def check_application_startup():
    """Проверка запуска приложения"""
    try:
        # Проверяем что приложение может быть импортировано
        sys.path.insert(0, os.getcwd())
        
        import app
        test_app = app.create_app()
        
        with test_app.app_context():
            # Проверяем базу данных
            from app import db
            db.create_all()
            
        return True, "Приложение запускается без ошибок"
        
    except Exception as e:
        return False, f"Ошибка запуска: {str(e)}"


def check_environment_variables():
    """Проверка переменных окружения"""
    required_for_production = [
        'DATABASE_URL', 'SESSION_SECRET', 'MISTRAL_API_KEY'
    ]
    
    missing = []
    for var in required_for_production:
        if not os.environ.get(var):
            missing.append(var)
    
    if missing:
        return False, f"Для продакшена потребуются: {', '.join(missing)}"
    return True, "Переменные окружения настроены"


def check_security_configuration():
    """Проверка настроек безопасности"""
    issues = []
    
    # Проверяем .env файл
    if os.path.exists('.env'):
        issues.append(".env файл не должен быть в репозитории")
    
    # Проверяем .gitignore
    if os.path.exists('.gitignore'):
        with open('.gitignore', 'r') as f:
            gitignore_content = f.read()
            if '.env' not in gitignore_content:
                issues.append(".env должен быть в .gitignore")
    else:
        issues.append("Отсутствует .gitignore файл")
    
    if issues:
        return False, '; '.join(issues)
    return True, "Настройки безопасности корректны"


def check_ci_cd_configuration():
    """Проверка настройки CI/CD"""
    workflow_files = [
        '.github/workflows/cicd.yml',
        '.github/workflows/static.yml'
    ]
    
    existing_workflows = []
    for workflow in workflow_files:
        if os.path.exists(workflow):
            existing_workflows.append(workflow)
    
    if not existing_workflows:
        return False, "Отсутствуют GitHub Actions workflows"
    
    return True, f"Настроены workflows: {', '.join(existing_workflows)}"


def generate_deployment_report():
    """Генерация отчета о готовности к деплою"""
    print("🚀 === ПРОВЕРКА ГОТОВНОСТИ К ДЕПЛОЮ BOLASHAKCHAT ===\n")
    
    checks = [
        ("🐍 Версия Python", check_python_version),
        ("📦 Зависимости", check_dependencies),
        ("📁 Структура проекта", check_project_structure),
        ("🏃 Запуск приложения", check_application_startup),
        ("🔧 Переменные окружения", check_environment_variables),
        ("🔒 Настройки безопасности", check_security_configuration),
        ("🔄 CI/CD конфигурация", check_ci_cd_configuration),
    ]
    
    results = []
    all_passed = True
    
    for check_name, check_func in checks:
        try:
            passed, message = check_func()
            status = "✅" if passed else "❌"
            print(f"{status} {check_name}: {message}")
            
            results.append({
                'check': check_name,
                'passed': passed,
                'message': message
            })
            
            if not passed:
                all_passed = False
                
        except Exception as e:
            print(f"❌ {check_name}: Ошибка проверки - {str(e)}")
            results.append({
                'check': check_name,
                'passed': False,
                'message': f"Ошибка проверки: {str(e)}"
            })
            all_passed = False
    
    print("\n" + "="*60)
    
    if all_passed:
        print("✅ ПРОЕКТ ГОТОВ К ДЕПЛОЮ!")
        print("\n📋 Рекомендации для деплоя:")
        print("1. 🏗️  Используйте Gunicorn как WSGI сервер")
        print("2. 🗄️  Настройте PostgreSQL для продакшена")
        print("3. 🌐 Настройте Nginx как reverse proxy")
        print("4. 🔒 Включите HTTPS в продакшене")
        print("5. 📊 Настройте мониторинг и логирование")
        print("6. 🔧 Настройте все переменные окружения")
        exit_code = 0
    else:
        print("❌ ПРОЕКТ НЕ ГОТОВ К ДЕПЛОЮ")
        print("Исправьте указанные проблемы перед деплоем.")
        exit_code = 1
    
    # Сохраняем отчет в JSON
    report = {
        'timestamp': datetime.now().isoformat(),
        'overall_status': 'ready' if all_passed else 'not_ready',
        'checks': results
    }
    
    with open('deployment_readiness_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 Отчет сохранен в deployment_readiness_report.json")
    
    return exit_code


if __name__ == "__main__":
    exit_code = generate_deployment_report()
    sys.exit(exit_code)