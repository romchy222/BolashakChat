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
        message_lower = user_message.lower()

        if any(word in message_lower
               for word in ['поступ', 'зачисл', 'вступ', 'документ']):
            if language == "kz":
                return ("**Құжаттар тізімі:**\n\n"
                        "- Аттестат\n"
                        "- Денсаулық анықтамасы\n"
                        "- Фотосуреттер\n\n"
                        "Толығырақ қабылдау комиссиясына хабарласыңыз.")
            return ("**Документы для поступления:**\n\n"
                    "- Аттестат\n"
                    "- Справка о здоровье\n"
                    "- Фотографии\n\n"
                    "За подробностями обратитесь в приемную комиссию.")

        elif any(word in message_lower
                 for word in ['стипенд', 'деньги', 'оплат', 'стоимост']):
            if language == "kz":
                return (
                    "**Стипендия және оқу ақысы:**\n\n"
                    "Толығырақ әкімшілікке хабарласыңыз. Университетте түрлі шәкіақы бағдарламалары қол жетімді."
                )
            return (
                "**Стипендии и стоимость обучения:**\n\n"
                "Подробнее — обратитесь в администрацию. В университете доступны различные стипендиальные программы."
            )

        elif any(word in message_lower
                 for word in ['расписан', 'занят', 'урок', 'предмет']):
            if language == "kz":
                return (
                    "**Сабақ кестесі** туралы ақпаратты оқу бөлімінен алыңыз. "
                    "Кесте әр семестр басында жарияланады.")
            return ("**Расписание занятий** можно получить в учебном отделе. "
                    "Расписание публикуется в начале каждого семестра.")

        elif any(word in message_lower
                 for word in ['общежит', 'жатақхана', 'прожив']):
            if language == "kz":
                return (
                    "**Жатақхана туралы ақпарат:**\n\n"
                    "Тұрмыс бөліміне хабарласыңыз. Орын алдын ала брондалады.")
            return ("**Общежитие:**\n\n"
                    "Обратитесь в жилищный отдел. Места бронируются заранее.")

        if context and context.strip():
            if language == "kz":
                return (f"**FAQ дерекқоры:**\n\n{context[:200]}...\n\n"
                        "Толығырақ университет әкімшілігіне хабарласыңыз.")
            return (
                f"**Контекст FAQ:**\n\n{context[:200]}...\n\n"
                "Для полной информации обратитесь в администрацию университета."
            )

        return self._get_fallback_response(language)

    def _get_fallback_response(self, language: str = "ru") -> str:
        fallback_responses = {
            'ru':
            "**Извините, я временно недоступен.**\n\nПожалуйста, обратитесь в приёмную комиссию университета по телефону или электронной почте.",
            'kz':
            "**Кешіріңіз, мен уақытша қолжетімсізбін.**\n\nУниверситеттің қабылдау комиссиясына телефон немесе электрондық пошта арқылы хабарласыңыз."
        }
        return fallback_responses.get(language, fallback_responses['ru'])
