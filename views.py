# Импорт необходимых модулей
import time
import logging
from flask import Blueprint, render_template, request, jsonify, session

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


@main_bp.route('/health')
def health_check():
    """Health check endpoint for deployment monitoring"""
    try:
        from app import db
        from sqlalchemy import text
        
        # Test database connection
        with db.engine.connect() as conn:
            conn.execute(text('SELECT 1'))
        
        return jsonify({
            'status': 'healthy',
            'timestamp': time.time(),
            'database': 'connected'
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'timestamp': time.time(),
            'database': 'disconnected',
            'error': str(e)
        }), 500


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
        error_message = "Извините, произошла ошибка. Попробуйте еще раз." if language == 'ru' else "Кешіріңіз, қате орын алды. Қайталап көріңіз."
        return jsonify({'error': error_message}), 500


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
