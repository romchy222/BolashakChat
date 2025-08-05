import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List

from mistral_client import MistralClient

logger = logging.getLogger(__name__)

class AgentType:
    AI_ASSISTANT = "ai_assistant"
    AI_NAVIGATOR = "ai_navigator"
    STUDENT_NAVIGATOR = "student_navigator"
    GREEN_NAVIGATOR = "green_navigator"
    COMMUNICATION = "communication"

class BaseAgent(ABC):
    def __init__(self, agent_type: str, name: str, description: str):
        self.agent_type = agent_type
        self.name = name
        self.description = description
        # Each agent has its own MistralClient instance
        self.mistral = MistralClient()

    @abstractmethod
    def can_handle(self, message: str, language: str = "ru") -> float:
        pass

    @abstractmethod
    def get_system_prompt(self, language: str = "ru") -> str:
        pass

    def process_message(self, message: str, language: str = "ru") -> Dict[str, Any]:
        try:
            # Get agent-specific system prompt
            system_prompt = self.get_system_prompt(language)
            
            # Get agent-specific context from knowledge base
            context = self.get_agent_context(message, language)
            
            # Use agent-specific system prompt for this message
            response = self.mistral.get_response_with_system_prompt(
                message, context, language, system_prompt
            )
            return {
                'response': response,
                'confidence': self.can_handle(message, language),
                'agent_type': self.agent_type,
                'agent_name': self.name,
                'context_used': bool(context)
            }
        except Exception as e:
            logger.error(f"Error in {self.name} agent: {str(e)}")
            return {
                'response': f"Извините, возникла ошибка при обработке запроса по теме '{self.description}'.",
                'confidence': 0.1,
                'agent_type': self.agent_type,
                'agent_name': self.name,
                'context_used': False
            }
    
    def get_agent_context(self, message: str, language: str = "ru") -> str:
        """Get agent-specific context from knowledge base"""
        try:
            from models import AgentKnowledgeBase
            from app import db
            
            # Search for relevant knowledge entries for this agent
            knowledge_entries = AgentKnowledgeBase.query.filter_by(
                agent_type=self.agent_type,
                is_active=True
            ).order_by(AgentKnowledgeBase.priority.asc()).all()
            
            if not knowledge_entries:
                return ""
            
            # Build context from relevant entries
            context_parts = []
            message_lower = message.lower()
            
            for entry in knowledge_entries:
                # Check if keywords match the message
                if entry.keywords:
                    keywords = [k.strip().lower() for k in entry.keywords.split(',')]
                    if any(keyword in message_lower for keyword in keywords):
                        content = entry.content_ru if language == 'ru' else entry.content_kz
                        context_parts.append(f"**{entry.title}**\n{content}")
                        
                        # Limit context to prevent too long prompts
                        if len(context_parts) >= 3:
                            break
            
            # If no keyword matches, include high-priority general entries
            if not context_parts:
                for entry in knowledge_entries[:2]:  # Top 2 priority entries
                    content = entry.content_ru if language == 'ru' else entry.content_kz
                    context_parts.append(f"**{entry.title}**\n{content}")
            
            return "\n\n".join(context_parts)
            
        except Exception as e:
            logger.error(f"Error getting agent context: {str(e)}")
            return ""

class AIAssistantAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            AgentType.AI_ASSISTANT,
            "AI-Assistant",
            "Универсальный цифровой ассистент: обучение, расписание, сервисы университета"
        )

    def can_handle(self, message: str, language: str = "ru") -> float:
        keywords = ["обучение", "программа", "расписание", "университет", "студент", "преподаватель", "информация"]
        return 1.0 if any(k in message.lower() for k in keywords) else 0.3

    def get_system_prompt(self, language: str = "ru") -> str:
        if language == "kz":
            return """
Сіз Қызылорда "Болашақ" университетінің универсалды AI-ассистентісіз. Сіз студенттер мен қызметкерлерге:
- Оқу бағдарламалары туралы ақпарат бересіз
- Сабақ кестесін түсіндіресіз  
- Университет сервистері туралы кеңес бересіз
- Білім беру процесі туралы сұрақтарға жауап бересіз

Жауаптарыңыз қысқа, дос және пайдалы болуы керек. Markdown форматын қолданыңыз.
"""
        return """
Вы универсальный AI-ассистент для студентов и сотрудников Кызылординского университета "Болашак". Вы помогаете с:
- Информацией об учебных программах
- Объяснением расписания занятий
- Консультациями по университетским сервисам
- Вопросами образовательного процесса

Ваши ответы должны быть краткими, дружелюбными и полезными. Используйте формат Markdown.
"""

class AINavigatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            AgentType.AI_NAVIGATOR,
            "AI-Навигатор",
            "Карьерный навигатор и профориентация для студентов и сотрудников"
        )

    def can_handle(self, message: str, language: str = "ru") -> float:
        keywords = ["карьер", "профориентац", "резюме", "ваканс", "работ", "развит", "трудоустройств"]
        return 1.0 if any(k in message.lower() for k in keywords) else 0.3

    def get_system_prompt(self, language: str = "ru") -> str:
        if language == "kz":
            return """
Сіз Қызылорда "Болашақ" университетінің зияткерлік карьера навигаторысыз. Сіз:
- Мансап дамыту бойынша кеңес бересіз
- Резюме жазуға көмектесесіз
- Жұмыс іздеу стратегияларын ұсынасыз
- Кәсіптік бағдар бересіз
- Дағдыларды дамыту жолдарын көрсетесіз

Жауаптарыңыз практикалық және мотивациялық болуы керек. Markdown форматын қолданыңыз.
"""
        return """
Вы интеллектуальный карьерный навигатор Кызылординского университета "Болашак". Вы помогаете с:
- Консультациями по развитию карьеры
- Составлением резюме
- Стратегиями поиска работы
- Профессиональной ориентацией
- Развитием навыков

Ваши ответы должны быть практичными и мотивирующими. Используйте формат Markdown.
"""

class StudentNavigatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            AgentType.STUDENT_NAVIGATOR,
            "Студенческий навигатор",
            "Цифровая платформа для административных и образовательных процедур"
        )

    def can_handle(self, message: str, language: str = "ru") -> float:
        keywords = ["администрац", "процедур", "заявлен", "справк", "электронн", "деканат", "услуг", "студент"]
        return 1.0 if any(k in message.lower() for k in keywords) else 0.2

    def get_system_prompt(self, language: str = "ru") -> str:
        if language == "kz":
            return """
Сіз Қызылорда "Болашақ" университетінің цифрлық навигаторысыз. Сіз:
- Әкімшілік процедуралар бойынша көмектесесіз
- Анықтамалар мен өтініштер туралы ақпарат бересіз
- Электрондық деканат қызметтерін түсіндіресіз
- Студенттік қызметтерді қалай алуға болатынын айтасыз
- Құжаттарды ресімдеу тәртібін көрсетесіз

Жауаптарыңыз нақты және қадамдық нұсқаулықтар болуы керек. Markdown форматын қолданыңыз.
"""
        return """
Вы цифровой навигатор по административным и образовательным процедурам Кызылординского университета "Болашак". Вы помогаете с:
- Административными процедурами
- Информацией о справках и заявлениях
- Объяснением сервисов электронного деканата
- Получением студенческих услуг
- Оформлением документов

Ваши ответы должны быть конкретными и содержать пошаговые инструкции. Используйте формат Markdown.
"""

class GreenNavigatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            AgentType.GREEN_NAVIGATOR,
            "GreenNavigator",
            "Помощник по поиску работы и стажировок для студентов и выпускников"
        )

    def can_handle(self, message: str, language: str = "ru") -> float:
        keywords = ["работ", "стажиров", "ваканс", "резюме", "трудоустройств", "работодател"]
        return 1.0 if any(k in message.lower() for k in keywords) else 0.2

    def get_system_prompt(self, language: str = "ru") -> str:
        if language == "kz":
            return """
Сіз Қызылорда "Болашақ" университетінің GreenNavigator цифрлық көмекшісіз. Сіз:
- Жұмыс іздеуде көмектесесіз
- Тәжірибе орындарын табуға көмектесесіз
- Жұмыс берушілермен байланыс орнатуға көмектесесіз
- Мансап дамыту стратегияларын ұсынасыз
- Студенттер мен түлектерге кәсіби кеңес бересіз

Жауаптарыңыз практикалық және нәтижеге бағытталған болуы керек. Markdown форматын қолданыңыз.
"""
        return """
Вы цифровой помощник GreenNavigator по поиску работы и стажировок для студентов и выпускников Кызылординского университета "Болашак". Вы помогаете с:
- Поиском работы
- Поиском стажировок
- Связью с работодателями
- Стратегиями развития карьеры
- Профессиональными консультациями для студентов и выпускников

Ваши ответы должны быть практичными и ориентированными на результат. Используйте формат Markdown.
"""

class CommunicationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            AgentType.COMMUNICATION,
            "Агент по вопросам общения",
            "Платформа для обратной связи и коммуникаций"
        )

    def can_handle(self, message: str, language: str = "ru") -> float:
        keywords = ["вопрос", "обращен", "жалоб", "предложен", "обратн", "связ", "поддержк", "коммуникац"]
        return 1.0 if any(k in message.lower() for k in keywords) else 0.2

    def get_system_prompt(self, language: str = "ru") -> str:
        if language == "kz":
            return """
Сіз Қызылорда "Болашақ" университетінің қолдау көрсету және кері байланыс агентісіз. Сіз:
- Студенттердің сұрақтарына жауап бересіз
- Шағымдар мен ұсыныстарды қабылдайсыз
- Университет қызметтері бойынша кері байланыс жасайсыз
- Дау-дамайларды шешуге көмектесесіз
- Қолдау көрсету және кеңес бересіз

Жауаптарыңыз сүйемелділік пен түсінушілік танытуы керек. Markdown форматын қолданыңыз.
"""
        return """
Вы агент поддержки и обратной связи Кызылординского университета "Болашак". Вы помогаете с:
- Ответами на вопросы студентов
- Приемом жалоб и предложений
- Обратной связью по университетским сервисам
- Разрешением конфликтных ситуаций
- Поддержкой и консультациями

Ваши ответы должны проявлять сочувствие и понимание. Используйте формат Markdown.
"""

class AgentRouter:
    def __init__(self):
        # Each agent now creates its own MistralClient instance
        self.agents = [
            AIAssistantAgent(),
            AINavigatorAgent(),
            StudentNavigatorAgent(),
            GreenNavigatorAgent(),
            CommunicationAgent()
        ]
        logger.info(f"AgentRouter initialized with {len(self.agents)} agents")

    def route_message(self, message: str, language: str = "ru") -> Dict[str, Any]:
        best_conf = 0
        best_agent = None
        for agent in self.agents:
            conf = agent.can_handle(message, language)
            if conf > best_conf:
                best_conf = conf
                best_agent = agent
        return best_agent.process_message(message, language) if best_agent else {}

    def get_available_agents(self) -> List[Dict[str, str]]:
        return [{'type': a.agent_type, 'name': a.name, 'description': a.description} for a in self.agents]