# Импорт необходимых модулей
import time
import logging
from flask import Blueprint, render_template, request, jsonify, session, Response
import requests
from flask import Response
import requests
import base64


# Настройка логирования
logger = logging.getLogger(__name__)

# Создание Blueprint для основных маршрутов
main_bp = Blueprint('main', __name__)

# Инициализация роутера агентов (выполним позже, чтобы избежать circular import)
agent_router = None

def initialize_agent_router():
    """Initialize agent router after app context is available"""
    global agent_router
    if agent_router is None:
        from agents import AgentRouter
        agent_router = AgentRouter()
    return agent_router


@main_bp.route('/')
def index():
    """Main page with chat widget"""
    return render_template('index.html')


@main_bp.route('/chat')
def chat_page():
    """ page with chat """
    return render_template('chat.html')


@main_bp.route('/widget-demo')
def widget_demo():
    """Widget integration demo page"""
    return render_template('widget-demo.html')


@main_bp.route('/api/chat', methods=['POST'])
def chat():
    try:
        from models import UserQuery
        from app import db
        from flask import current_app

        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'Сообщение не найдено'}), 400

        user_message = data['message'].strip()
        language = data.get('language', 'ru')
        agent_type = data.get('agent_type')  # <-- добавлено

        if not user_message:
            return jsonify({'error': 'Пустое сообщение'}), 400

        start_time = time.time()

        with current_app.app_context():
            router = initialize_agent_router()
            if agent_type:
                # Поиск агента с нужным типом
                for agent in router.agents:
                        if getattr(agent, "agent_type", None) and (agent.agent_type == agent_type):
                            result = agent.process_message(user_message, language)
                            result['agent_type'] = agent.agent_type
                            result['agent_name'] = agent.name
                            result['confidence'] = 1.0
                            break
                else:
                    # Если не найден — fallback на авто-выбор
                    result = router.route_message(user_message, language)
            else:
                # Автоматический выбор агента
                result = router.route_message(user_message, language)

            response_time = time.time() - start_time

            user_query = UserQuery(
                user_message=user_message,
                bot_response=result['response'],
                language=language,
                response_time=response_time,
                agent_type=result.get('agent_type'),
                agent_name=result.get('agent_name'),
                agent_confidence=result.get('confidence', 0.0),
                context_used=result.get('context_used', False),
                session_id=session.get('session_id', ''),
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent', '')
            )

            db.session.add(user_query)
            db.session.commit()

            logger.info(
                f"Chat response generated in {response_time:.2f}s "
                f"by {result.get('agent_name', 'Unknown')} agent "
                f"(confidence: {result.get('confidence', 0):.2f}) "
                f"for language: {language}"
            )

            return jsonify({
                'response': result['response'],
                'response_time': response_time,
                'agent_name': result.get('agent_name'),
                'agent_type': result.get('agent_type'),
                'confidence': result.get('confidence', 0.0)
            })

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        # Use a default language if language is not defined
        lang = locals().get('language', 'ru')
        error_message = "Извините, произошла ошибка. Попробуйте еще раз." if lang == 'ru' else "Кешіріңіз, қате орын алды. Қайталап көріңіз."
        return jsonify({'error': error_message}), 500
        
@main_bp.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': time.time()})


@main_bp.route('/api/agents')
def get_agents():
    """Get information about available agents"""
    try:
        router = initialize_agent_router()
        agents_info = router.get_available_agents()
        return jsonify({
            'agents': agents_info,
            'total_agents': len(agents_info)
        })
    except Exception as e:
        logger.error(f"Error getting agents info: {str(e)}")
        return jsonify({'error': 'Failed to get agents information'}), 500


@main_bp.route('/api/tts', methods=['POST'])
def tts_proxy():
    try:
        data = request.get_json(force=True)
        # Можно добавить свой api_token, если требуется
        
        data['format'] = 'wav'  # для браузера лучше wav или mp3, не raw!
        silero_url = 'https://api.silero.ai/voice'

        silero_resp = requests.post(silero_url, json=data)
        if not silero_resp.ok:
            print('Silero error:', silero_resp.status_code, silero_resp.text)
            return Response('Silero error', status=500)
        silero_json = silero_resp.json()
        audio_base64 = silero_json['results'][0]['audio']
        audio_bytes = base64.b64decode(audio_base64)
        # wav/mp3 лучше для браузерного Audio
        return Response(audio_bytes, mimetype='audio/wav')
    except Exception as e:
        print('tts_proxy error:', e)
        return Response('Failed to fetch from Silero', status=500)


@main_bp.route('/api/deployment-readiness')
def deployment_readiness():
    """
    Comprehensive deployment readiness check
    Комплексная проверка готовности к деплою
    """
    try:
        from app import db
        from flask import current_app
        import os
        import sys
        
        # Инициализация результата проверки
        checks = {
            'database': {'status': 'unknown', 'message': ''},
            'agents': {'status': 'unknown', 'message': ''},
            'environment': {'status': 'unknown', 'message': ''},
            'dependencies': {'status': 'unknown', 'message': ''},
            'configuration': {'status': 'unknown', 'message': ''}
        }
        
        overall_status = 'healthy'
        
        # 1. Проверка базы данных
        try:
            # Проверяем соединение с базой данных
            from sqlalchemy import text
            # Простая проверка - создание таблиц
            db.create_all()
            checks['database']['status'] = 'healthy'
            checks['database']['message'] = 'База данных доступна и отвечает'
        except Exception as e:
            checks['database']['status'] = 'error'
            checks['database']['message'] = f'Ошибка подключения к БД: {str(e)}'
            overall_status = 'error'
        
        # 2. Проверка агентов
        try:
            router = initialize_agent_router()
            agents = router.get_available_agents()
            if len(agents) > 0:
                checks['agents']['status'] = 'healthy'
                checks['agents']['message'] = f'Доступно агентов: {len(agents)}'
            else:
                checks['agents']['status'] = 'warning'
                checks['agents']['message'] = 'Агенты не настроены'
                if overall_status != 'error':
                    overall_status = 'warning'
        except Exception as e:
            checks['agents']['status'] = 'error'
            checks['agents']['message'] = f'Ошибка инициализации агентов: {str(e)}'
            overall_status = 'error'
        
        # 3. Проверка переменных окружения
        required_env = ['DATABASE_URL', 'SESSION_SECRET']
        env_issues = []
        for env_var in required_env:
            if not os.environ.get(env_var):
                env_issues.append(env_var)
        
        if env_issues:
            checks['environment']['status'] = 'warning'
            checks['environment']['message'] = f'Отсутствуют переменные: {", ".join(env_issues)}'
            if overall_status == 'healthy':
                overall_status = 'warning'
        else:
            checks['environment']['status'] = 'healthy'
            checks['environment']['message'] = 'Все необходимые переменные окружения настроены'
        
        # 4. Проверка зависимостей
        try:
            import flask, sqlalchemy, gunicorn, requests
            checks['dependencies']['status'] = 'healthy'
            checks['dependencies']['message'] = f'Python {sys.version.split()[0]}, Flask {getattr(flask, "__version__", "unknown")}'
        except ImportError as e:
            checks['dependencies']['status'] = 'error'
            checks['dependencies']['message'] = f'Отсутствуют зависимости: {str(e)}'
            overall_status = 'error'
        
        # 5. Проверка конфигурации
        config_issues = []
        
        # Проверяем настройки безопасности для продакшена
        if current_app.debug and os.environ.get('FLASK_ENV') == 'production':
            config_issues.append('Debug режим включен в продакшене')
        
        # Проверяем секретный ключ
        if current_app.secret_key == 'dev-secret-key-change-in-production':
            config_issues.append('Используется тестовый секретный ключ')
        
        if config_issues:
            checks['configuration']['status'] = 'warning'
            checks['configuration']['message'] = '; '.join(config_issues)
            if overall_status == 'healthy':
                overall_status = 'warning'
        else:
            checks['configuration']['status'] = 'healthy'
            checks['configuration']['message'] = 'Конфигурация корректна'
        
        # Формирование итогового ответа
        result = {
            'overall_status': overall_status,
            'timestamp': time.time(),
            'checks': checks,
            'deployment_ready': overall_status != 'error',
            'recommendations': []
        }
        
        # Добавляем рекомендации
        if overall_status == 'error':
            result['recommendations'].append('Исправьте критические ошибки перед деплоем')
        elif overall_status == 'warning':
            result['recommendations'].append('Рекомендуется исправить предупреждения')
            result['recommendations'].append('Настройте переменные окружения для продакшена')
        else:
            result['recommendations'].append('Проект готов к деплою')
            result['recommendations'].append('Используйте Gunicorn для продакшена')
            result['recommendations'].append('Настройте PostgreSQL для продакшена')
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in deployment readiness check: {str(e)}")
        return jsonify({
            'overall_status': 'error',
            'error': f'Ошибка проверки готовности: {str(e)}',
            'deployment_ready': False
        }), 500
