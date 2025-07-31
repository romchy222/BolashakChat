import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List

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

    @abstractmethod
    def can_handle(self, message: str, language: str = "ru") -> float:
        pass

    @abstractmethod
    def get_system_prompt(self, language: str = "ru") -> str:
        pass

    def process_message(self, message: str, language: str = "ru") -> Dict[str, Any]:
        try:
            # Здесь должна быть интеграция с LLM или внешним сервисом
            response = f"{self.name} обработал ваше сообщение: {message}"
            return {
                'response': response,
                'confidence': self.can_handle(message, language),
                'agent_type': self.agent_type,
                'agent_name': self.name
            }
        except Exception as e:
            logger.error(f"Error in {self.name} agent: {str(e)}")
            return {
                'response': f"Извините, возникла ошибка при обработке запроса по теме '{self.description}'.",
                'confidence': 0.1,
                'agent_type': self.agent_type,
                'agent_name': self.name
            }

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
        return "Вы универсальный ассистент для студентов и сотрудников университета 'Болашак'."

class AINavigatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            AgentType.AI_NAVIGATOR,
            "AI-Навигатор",
            "Карьерный навигатор и профориентация для студентов и сотрудников"
        )

    def can_handle(self, message: str, language: str = "ru") -> float:
        keywords = ["карьера", "профориентация", "резюме", "вакансия", "работа", "развитие", "трудоустройство"]
        return 1.0 if any(k in message.lower() for k in keywords) else 0.3

    def get_system_prompt(self, language: str = "ru") -> str:
        return "Вы интеллектуальный карьерный навигатор для студентов и сотрудников."

class StudentNavigatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            AgentType.STUDENT_NAVIGATOR,
            "Студенческий навигатор",
            "Цифровая платформа для административных и образовательных процедур"
        )

    def can_handle(self, message: str, language: str = "ru") -> float:
        keywords = ["администрация", "процедура", "заявление", "справка", "электронный деканат", "услуга", "студент"]
        return 1.0 if any(k in message.lower() for k in keywords) else 0.2

    def get_system_prompt(self, language: str = "ru") -> str:
        return "Вы цифровой навигатор по административным и образовательным процедурам университета."

class GreenNavigatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            AgentType.GREEN_NAVIGATOR,
            "GreenNavigator",
            "Помощник по поиску работы и стажировок для студентов и выпускников"
        )

    def can_handle(self, message: str, language: str = "ru") -> float:
        keywords = ["работа", "стажировка", "вакансия", "резюме", "трудоустройство", "работодатель"]
        return 1.0 if any(k in message.lower() for k in keywords) else 0.2

    def get_system_prompt(self, language: str = "ru") -> str:
        return "Вы цифровой помощник по поиску работы и стажировок для студентов и выпускников."

class CommunicationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            AgentType.COMMUNICATION,
            "Агент по вопросам общения",
            "Платформа для обратной связи и коммуникаций"
        )

    def can_handle(self, message: str, language: str = "ru") -> float:
        keywords = ["вопрос", "обращение", "жалоба", "предложение", "обратная связь", "поддержка", "коммуникация"]
        return 1.0 if any(k in message.lower() for k in keywords) else 0.2

    def get_system_prompt(self, language: str = "ru") -> str:
        return "Вы агент поддержки обратной связи и коммуникаций университета."

class AgentRouter:
    def __init__(self):
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