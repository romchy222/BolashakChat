import os
import logging
import requests
import json
from typing import Optional

logger = logging.getLogger(__name__)


class MistralClient:
    """Client for interacting with Mistral AI API"""

    def __init__(self):
        self.api_key = os.environ.get("MISTRAL_API_KEY",
                                      "nxJcrPGFtx89fMeaLM2FdJS6STblMHAf")
        self.base_url = "https://api.mistral.ai/v1"
        self.model = "mistral-small-latest"

        self.system_prompts = {
            'ru': """
        Ты — AI-ассистент для абитуриентов и студентов Кызылординского университета "Болашак". Отвечай кратко, дружелюбно и информативно на русском языке. Используй следующие возможности:
        - Помогаешь поступающим по вопросам приёмной кампании, документов, сроков, образовательных программ, стоимости, проживания, стипендий, расписания, трудоустройства и другим вопросам.
        - Даёшь справочную информацию о цифровых сервисах университета: AI-бот, Студенческий навигатор, GreenNavigator, бот по вопросам общежития.
        - Помогаешь найти контакты, расписания, условия поступления, шаги для подачи документов, возможности трудоустройства и проживания, способы обращения за консультацией.
        - В случае отсутствия информации — советуй обратиться в приёмную комиссию или соответствующие службы.
        - Всегда отвечай в формате Markdown.
        """,
            'kz': """
        Сіз Қызылорда "Болашақ" университетінің талапкерлері мен студенттеріне арналған AI-ассистентсіз. Қазақ тілінде қысқа, достық және ақпараттық жауап беріңіз. Мына бағыттарда көмектесесіз:
        - Қабылдау науқаны, құжаттар, мерзімдер, білім бағдарламалары, оқу ақысы, жатақхана, стипендия, сабақ кестесі, жұмысқа орналасу және басқа да сұрақтарға жауап бересіз.
        - Университеттің цифрлық сервистері туралы ақпарат бересіз: AI-бот, Студенттік навигатор, GreenNavigator, жатақхана бойынша бот.
        - Байланыс деректерін, қабылдау талаптарын, құжат тапсыру қадамдарын, жұмысқа орналасу және тұру мүмкіндіктерін, кеңес алу жолдарын түсіндіресіз.
        - Ақпарат жеткіліксіз болса — қабылдау комиссиясына немесе тиісті бөлімдерге жүгінуге кеңес беріңіз.
        - Жауаптарды тек Markdown форматында беріңіз.
        """
        }

    def get_response(self,
                     user_message: str,
                     context: str = "",
                     language: str = "ru") -> str:
        try:
            system_prompt = self.system_prompts.get(language,
                                                    self.system_prompts['ru'])

            messages = [{
                "role": "system",
                "content": system_prompt
            }, {
                "role":
                "user",
                "content":
                f"Контекст из FAQ:\n{context}\n\nВопрос пользователя: {user_message}"
            }]

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            data = {
                "model": self.model,
                "messages": messages,
                "max_tokens": 500,
                "temperature": 0.7
            }

            response = requests.post(f"{self.base_url}/chat/completions",
                                     headers=headers,
                                     json=data,
                                     timeout=30)

            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content'].strip()
            else:
                logger.error(
                    f"Mistral API error: {response.status_code} - {response.text}"
                )
                return self._get_fallback_response(language)

        except requests.exceptions.RequestException as e:
            logger.error(f"Request error to Mistral API: {str(e)}")
            return self._get_smart_fallback_response(user_message, context,
                                                     language)
        except Exception as e:
            logger.error(f"Unexpected error in Mistral client: {str(e)}")
            return self._get_fallback_response(language)

    def get_response_with_system_prompt(self,
                                        user_message: str,
                                        context: str = "",
                                        language: str = "ru",
                                        custom_system_prompt: str = "") -> str:
        """Get response using a custom system prompt"""
        try:
            # Use custom system prompt if provided, otherwise fall back to default
            system_prompt = custom_system_prompt if custom_system_prompt else self.system_prompts.get(language, self.system_prompts['ru'])

            messages = [{
                "role": "system",
                "content": system_prompt
            }, {
                "role":
                "user",
                "content":
                f"Контекст из FAQ:\n{context}\n\nВопрос пользователя: {user_message}"
            }]

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            data = {
                "model": self.model,
                "messages": messages,
                "max_tokens": 500,
                "temperature": 0.7
            }

            response = requests.post(f"{self.base_url}/chat/completions",
                                     headers=headers,
                                     json=data,
                                     timeout=30)

            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content'].strip()
            else:
                logger.error(
                    f"Mistral API error: {response.status_code} - {response.text}"
                )
                return self._get_fallback_response(language)

        except requests.exceptions.RequestException as e:
            logger.error(f"Request error to Mistral API: {str(e)}")
            return self._get_smart_fallback_response(user_message, context,
                                                     language)
        except Exception as e:
            logger.error(f"Unexpected error in Mistral client: {str(e)}")
            return self._get_fallback_response(language)

    def get_response_with_system_prompt(self,
                                        user_message: str,
                                        context: str = "",
                                        language: str = "ru",
                                        custom_system_prompt: str = "") -> str:
        """Get response using a custom system prompt"""
        try:
            # Use custom system prompt if provided, otherwise fall back to default
            system_prompt = custom_system_prompt if custom_system_prompt else self.system_prompts.get(language, self.system_prompts['ru'])

            messages = [{
                "role": "system",
                "content": system_prompt
            }, {
                "role":
                "user",
                "content":
                f"Контекст из FAQ:\n{context}\n\nВопрос пользователя: {user_message}"
            }]

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            data = {
                "model": self.model,
                "messages": messages,
                "max_tokens": 500,
                "temperature": 0.7
            }

            response = requests.post(f"{self.base_url}/chat/completions",
                                     headers=headers,
                                     json=data,
                                     timeout=30)

            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content'].strip()
            else:
                logger.error(
                    f"Mistral API error: {response.status_code} - {response.text}"
                )
                return self._get_fallback_response(language)

        except requests.exceptions.RequestException as e:
            logger.error(f"Request error to Mistral API: {str(e)}")
            return self._get_smart_fallback_response(user_message, context,
                                                     language)
        except Exception as e:
            logger.error(f"Unexpected error in Mistral client: {str(e)}")
            return self._get_fallback_response(language)

    def _get_smart_fallback_response(self,
                                     user_message: str,
                                     context: str,
                                     language: str = "ru") -> str:
        """Improved smart fallback that provides contextual responses"""
        message_lower = user_message.lower()

        # Check if we have relevant FAQ context
        if context and context.strip():
            if language == "kz":
                return f"**Сізге арналған ақпарат:**\n\n{context}\n\n💡 **Көмекші кеңес:** Қосымша сұрақтарыңыз болса, қабылдау комиссиясына хабарласыңыз."
            return f"**Информация по вашему вопросу:**\n\n{context}\n\n💡 **Полезный совет:** Если у вас есть дополнительные вопросы, обратитесь в приемную комиссию."

        # Keyword-based responses
        if any(word in message_lower for word in ['поступ', 'зачисл', 'вступ', 'документ', 'түсу', 'құжат']):
            if language == "kz":
                return ("**🎓 Түсу туралы ақпарат:**\n\n"
                        "**Қажетті құжаттар:**\n"
                        "• Орта білім туралы аттестат\n"
                        "• Денсаулық жағдайы туралы анықтама (086-У)\n"
                        "• 3x4 фотосуреттер (6 дана)\n"
                        "• Жеке куәліктің көшірмесі\n\n"
                        "**Байланыс:** +7 (7242) 26-17-52")
            return ("**🎓 Информация о поступлении:**\n\n"
                    "**Необходимые документы:**\n"
                    "• Аттестат о среднем образовании\n"
                    "• Справка о состоянии здоровья (086-У)\n"
                    "• Фотографии 3x4 (6 штук)\n"
                    "• Копия удостоверения личности\n\n"
                    "**Контакт:** +7 (7242) 26-17-52")

        elif any(word in message_lower for word in ['стипенд', 'деньги', 'оплат', 'стоимост', 'шәкіақы', 'ақша']):
            if language == "kz":
                return ("**💰 Оқу ақысы мен стипендиялар:**\n\n"
                        "• Мемлекеттік грант қол жетімді\n"
                        "• Ақылы оқу (мамандыққа байланысты)\n"
                        "• Оқу стипендиясы\n"
                        "• Әлеуметтік стипендия\n\n"
                        "**Толығырақ:** әкімшілікке хабарласыңыз")
            return ("**💰 Стоимость обучения и стипендии:**\n\n"
                    "• Государственные гранты доступны\n"
                    "• Платное обучение (зависит от специальности)\n"
                    "• Академическая стипендия\n"
                    "• Социальная стипендия\n\n"
                    "**Подробнее:** обратитесь в администрацию")

        elif any(word in message_lower for word in ['расписан', 'занят', 'урок', 'предмет', 'кесте', 'сабақ']):
            if language == "kz":
                return ("**📅 Сабақ кестесі:**\n\n"
                        "• Кесте әр семестр басында жарияланады\n"
                        "• Университеттің ресми сайтында\n"
                        "• Оқу бөлімінде алуға болады\n\n"
                        "**Сайт:** www.bolashak.edu.kz")
            return ("**📅 Расписание занятий:**\n\n"
                    "• Расписание публикуется в начале семестра\n"
                    "• Доступно на официальном сайте\n"
                    "• Можно получить в учебном отделе\n\n"
                    "**Сайт:** www.bolashak.edu.kz")

        elif any(word in message_lower for word in ['общежит', 'жатақхана', 'прожив', 'тұру']):
            if language == "kz":
                return ("**🏠 Жатақхана туралы ақпарат:**\n\n"
                        "• Жатақхана орындары шектеулі\n"
                        "• Алдын ала брондау қажет\n"
                        "• Тұрмыс бөліміне хабарласыңыз\n\n"
                        "**Куратор:** жатақхана бөлімі")
            return ("**🏠 Информация об общежитии:**\n\n"
                    "• Места в общежитии ограничены\n"
                    "• Требуется предварительное бронирование\n"
                    "• Обратитесь в жилищный отдел\n\n"
                    "**Куратор:** отдел общежития")

        elif any(word in message_lower for word in ['привет', 'hello', 'сәлем', 'здравствуй']):
            return self._get_fallback_response(language)

        # Default response for unrecognized queries
        if language == "kz":
            return ("**🤖 Кешіріңіз, сұрағыңызды дәл түсіне алмадым.**\n\n"
                    "Мен мына тақырыптар бойынша көмектесе аламын:\n"
                    "• Түсу процедуралары\n"
                    "• Құжаттар тізімі\n"
                    "• Мамандықтар\n"
                    "• Оқу ақысы\n"
                    "• Жатақхана\n\n"
                    "**Байланыс:** +7 (7242) 26-17-52")
        return ("**🤖 Извините, не смог точно понять ваш вопрос.**\n\n"
                "Я могу помочь по следующим темам:\n"
                "• Процедуры поступления\n"
                "• Список документов\n"
                "• Специальности\n"
                "• Стоимость обучения\n"
                "• Общежитие\n\n"
                "**Контакт:** +7 (7242) 26-17-52")

    def _get_fallback_response(self, language: str = "ru") -> str:
        """Enhanced fallback response that provides useful information"""
        if language == 'kz':
            return ("**Сәлеметсіз бе! Мен Болашақ университетінің AI-көмекшісімін.**\n\n"
                    "**Мен сізге мынадай мәселелер бойынша көмектесе аламын:**\n"
                    "• 📚 Түсу процедуралары және талаптар\n"
                    "• 📄 Қажетті құжаттар тізімі\n"
                    "• 🎓 Мамандықтар мен бағдарламалар\n"
                    "• 💰 Оқу ақысы мен стипендиялар\n"
                    "• 🏠 Жатақхана және тұру мәселелері\n"
                    "• 📅 Сабақ кестесі мен маңызды күндер\n\n"
                    "**Байланыс деректері:**\n"
                    "📞 Қабылдау комиссиясы: +7 (7242) 26-17-52\n"
                    "📧 Email: info@bolashak.edu.kz\n"
                    "🌐 Сайт: www.bolashak.edu.kz")
        else:
            return ("**Здравствуйте! Я AI-помощник университета Болашак.**\n\n"
                    "**Я могу помочь вам по следующим вопросам:**\n"
                    "• 📚 Процедуры поступления и требования\n"
                    "• 📄 Список необходимых документов\n"
                    "• 🎓 Специальности и программы обучения\n"
                    "• 💰 Стоимость обучения и стипендии\n"
                    "• 🏠 Общежитие и вопросы проживания\n"
                    "• 📅 Расписание и важные даты\n\n"
                    "**Контактная информация:**\n"
                    "📞 Приемная комиссия: +7 (7242) 26-17-52\n"
                    "📧 Email: info@bolashak.edu.kz\n"
                    "🌐 Сайт: www.bolashak.edu.kz")
