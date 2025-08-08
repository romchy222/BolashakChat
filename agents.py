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

    def get_system_prompt(self, language: str = "ru") -> str:
        """Get agent system prompt from knowledge base"""
        try:
            from models import AgentKnowledgeBase
            from app import db
            
            # Search for system prompt entry in knowledge base
            system_prompt_entry = AgentKnowledgeBase.query.filter_by(
                agent_type=self.agent_type,
                is_active=True
            ).filter(AgentKnowledgeBase.keywords.contains('системный_промпт')).first()
            
            if system_prompt_entry:
                return system_prompt_entry.content_ru if language == 'ru' else system_prompt_entry.content_kz
            
            # Fallback to default system prompt from KB
            fallback_entry = AgentKnowledgeBase.query.filter_by(
                agent_type=self.agent_type,
                is_active=True,
                priority=0
            ).first()
            
            if fallback_entry:
                return fallback_entry.content_ru if language == 'ru' else fallback_entry.content_kz
            
            # Last resort fallback
            return f"Вы помощник по теме '{self.description}'. Отвечайте на основе предоставленного контекста."
            
        except Exception as e:
            logger.error(f"Error getting system prompt for {self.agent_type}: {str(e)}")
            return f"Вы помощник по теме '{self.description}'. Отвечайте на основе предоставленного контекста."

    def process_message(self, message: str, language: str = "ru") -> Dict[str, Any]:
        try:
            # Get agent-specific system prompt from KB
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
                'context_used': bool(context),
                'system_prompt_used': bool(system_prompt)
            }
        except Exception as e:
            logger.error(f"Error in {self.name} agent: {str(e)}")
            # Try to get error response from KB
            fallback_response = self._get_kb_fallback_response(language)
            return {
                'response': fallback_response,
                'confidence': 0.1,
                'agent_type': self.agent_type,
                'agent_name': self.name,
                'context_used': False,
                'system_prompt_used': False
            }
    
    def get_agent_context(self, message: str, language: str = "ru") -> str:
        """Get comprehensive agent-specific context from knowledge base"""
        try:
            from models import AgentKnowledgeBase
            from app import db
            
            # Search for relevant knowledge entries for this agent (exclude system prompts)
            knowledge_entries = AgentKnowledgeBase.query.filter_by(
                agent_type=self.agent_type,
                is_active=True
            ).filter(
                ~AgentKnowledgeBase.keywords.contains('системный_промпт')
            ).order_by(AgentKnowledgeBase.priority.asc()).all()
            
            if not knowledge_entries:
                return ""
            
            # Build context from relevant entries
            context_parts = []
            message_lower = message.lower()
            
            # First pass: exact keyword matches
            for entry in knowledge_entries:
                if entry.keywords:
                    keywords = [k.strip().lower() for k in entry.keywords.split(',')]
                    if any(keyword in message_lower for keyword in keywords):
                        content = entry.content_ru if language == 'ru' else entry.content_kz
                        context_parts.append(f"**{entry.title}**\n{content}")
            
            # Second pass: if we have space and few matches, add high-priority entries
            if len(context_parts) < 3:
                for entry in knowledge_entries:
                    if len(context_parts) >= 5:  # Increased limit for more comprehensive context
                        break
                    
                    # Skip if already included
                    content = entry.content_ru if language == 'ru' else entry.content_kz
                    entry_text = f"**{entry.title}**\n{content}"
                    if entry_text not in context_parts:
                        context_parts.append(entry_text)
            
            # If still no context, include all available entries for this agent
            if not context_parts:
                for entry in knowledge_entries[:3]:  # Top 3 priority entries
                    content = entry.content_ru if language == 'ru' else entry.content_kz
                    context_parts.append(f"**{entry.title}**\n{content}")
            
            return "\n\n".join(context_parts)
            
        except Exception as e:
            logger.error(f"Error getting agent context: {str(e)}")
            return ""
    
    def _get_kb_fallback_response(self, language: str = "ru") -> str:
        """Get fallback response from knowledge base"""
        try:
            from models import AgentKnowledgeBase
            from app import db
            
            # Try to get any available entry for this agent
            fallback_entry = AgentKnowledgeBase.query.filter_by(
                agent_type=self.agent_type,
                is_active=True
            ).filter(
                ~AgentKnowledgeBase.keywords.contains('системный_промпт')
            ).order_by(AgentKnowledgeBase.priority.asc()).first()
            
            if fallback_entry:
                if language == "kz":
                    return f"**Кешіріңіз, техникалық қате орын алды.**\n\n{fallback_entry.content_kz[:200]}...\n\nТолығырақ ақпаратты университет әкімшілігінен алыңыз."
                else:
                    return f"**Извините, произошла техническая ошибка.**\n\n{fallback_entry.content_ru[:200]}...\n\nДля получения полной информации обратитесь к администрации университета."
            
            # Last resort fallback
            if language == "kz":
                return f"**Кешіріңіз, '{self.description}' бойынша сұрақты өңдеуде қате орын алды.** Университет әкімшілігіне хабарласыңыз."
            else:
                return f"**Извините, возникла ошибка при обработке запроса по теме '{self.description}'.** Обратитесь к администрации университета."
        
        except Exception as e:
            logger.error(f"Error getting KB fallback response: {str(e)}")
            if language == "kz":
                return f"**Техникалық қате.** '{self.description}' бойынша көмекке мұқтаж болсаңыз, университет әкімшілігіне хабарласыңыз."
            else:
                return f"**Техническая ошибка.** Для помощи по теме '{self.description}' обратитесь к администрации университета."

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