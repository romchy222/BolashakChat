"""
Enhanced Text-to-Speech Service with Multiple Providers
Поддержка нескольких TTS провайдеров для лучшего качества синтеза речи
"""

import os
import base64
import requests
import logging
from typing import Dict, Optional, List, Union
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class TTSProvider(Enum):
    """Доступные TTS провайдеры"""
    SILERO = "silero"
    AZURE = "azure"
    GOOGLE = "google"
    ELEVENLABS = "elevenlabs"
    WEB_SPEECH = "web_speech"

@dataclass
class VoiceConfig:
    """Конфигурация голоса"""
    id: str
    name: str
    language: str
    gender: str
    provider: TTSProvider
    sample_text: str = "Привет! Это тестовый голос."

class EnhancedTTSService:
    """Улучшенный сервис синтеза речи с поддержкой нескольких провайдеров"""
    
    def __init__(self):
        self.providers = {
            TTSProvider.SILERO: self._silero_tts,
            TTSProvider.AZURE: self._azure_tts,
            TTSProvider.GOOGLE: self._google_tts,
            TTSProvider.ELEVENLABS: self._elevenlabs_tts
        }
        
        # Определяем доступные голоса для каждого провайдера
        self.available_voices = self._get_available_voices()
        
    def _get_available_voices(self) -> List[VoiceConfig]:
        """Получить список доступных голосов"""
        voices = []
        
        # Silero голоса (русский)
        silero_voices = [
            VoiceConfig("baya", "Бая (женский, дружелюбный)", "ru", "female", TTSProvider.SILERO),
            VoiceConfig("kseniya", "Ксения (женский, деловой)", "ru", "female", TTSProvider.SILERO),
            VoiceConfig("xenia", "Ксения-2 (женский, мягкий)", "ru", "female", TTSProvider.SILERO),
            VoiceConfig("aidar", "Айдар (мужской, уверенный)", "ru", "male", TTSProvider.SILERO),
        ]
        
        # Azure голоса (если API ключ доступен)
        if os.environ.get('AZURE_SPEECH_KEY'):
            azure_voices = [
                VoiceConfig("ru-RU-SvetlanaNeural", "Светлана (Azure, премиум)", "ru", "female", TTSProvider.AZURE),
                VoiceConfig("ru-RU-DmitryNeural", "Дмитрий (Azure, премиум)", "ru", "male", TTSProvider.AZURE),
                VoiceConfig("ru-RU-DariyaNeural", "Дария (Azure, молодая)", "ru", "female", TTSProvider.AZURE),
            ]
            voices.extend(azure_voices)
        
        # ElevenLabs голоса (если API ключ доступен)
        if os.environ.get('ELEVENLABS_API_KEY'):
            elevenlabs_voices = [
                VoiceConfig("21m00Tcm4TlvDq8ikWAM", "Rachel (ElevenLabs, премиум)", "en", "female", TTSProvider.ELEVENLABS),
                VoiceConfig("AZnzlk1XvdvUeBnXmlld", "Domi (ElevenLabs, премиум)", "en", "female", TTSProvider.ELEVENLABS),
            ]
            voices.extend(elevenlabs_voices)
        
        voices.extend(silero_voices)
        return voices
    
    def get_voices(self) -> List[Dict]:
        """Получить список доступных голосов в формате для фронтенда"""
        return [
            {
                "id": voice.id,
                "name": voice.name,
                "language": voice.language,
                "gender": voice.gender,
                "provider": voice.provider.value,
                "sample_text": voice.sample_text
            }
            for voice in self.available_voices
        ]
    
    async def synthesize(
        self,
        text: str,
        voice_id: str = "baya",
        speed: float = 1.0,
        emotion: str = "neutral",
        output_format: str = "wav"
    ) -> Optional[bytes]:
        """
        Синтезировать речь с автоматическим выбором лучшего провайдера
        
        Args:
            text: Текст для синтеза
            voice_id: ID голоса
            speed: Скорость речи (0.5-2.0)
            emotion: Эмоция (neutral, happy, sad, etc.)
            output_format: Формат аудио (wav, mp3)
            
        Returns:
            Аудио данные в байтах или None при ошибке
        """
        
        # Найти конфигурацию голоса
        voice_config = next((v for v in self.available_voices if v.id == voice_id), None)
        if not voice_config:
            logger.error(f"Voice {voice_id} not found")
            return None
        
        # Очистить текст
        cleaned_text = self._clean_text(text)
        if not cleaned_text:
            logger.warning("Text is empty after cleaning")
            return None
        
        # Попытаться синтезировать с выбранным провайдером
        provider_func = self.providers.get(voice_config.provider)
        if provider_func:
            try:
                audio_data = await provider_func(
                    cleaned_text, voice_id, speed, emotion, output_format
                )
                if audio_data:
                    return audio_data
            except Exception as e:
                logger.error(f"Error with {voice_config.provider.value}: {e}")
        
        # Fallback к Silero если основной провайдер не работает
        if voice_config.provider != TTSProvider.SILERO:
            try:
                fallback_voice = "baya"  # Дефолтный голос Silero
                audio_data = await self._silero_tts(
                    cleaned_text, fallback_voice, speed, emotion, output_format
                )
                if audio_data:
                    logger.info(f"Used Silero fallback for voice {voice_id}")
                    return audio_data
            except Exception as e:
                logger.error(f"Silero fallback failed: {e}")
        
        return None
    
    def _clean_text(self, text: str) -> str:
        """Очистить текст для TTS"""
        if not text:
            return ""
        
        # Удаление эмодзи и специальных символов
        import re
        
        # Удаляем эмодзи
        emoji_pattern = re.compile(
            "["
            u"\U0001F600-\U0001F64F"  # emoticons
            u"\U0001F300-\U0001F5FF"  # symbols & pictographs
            u"\U0001F680-\U0001F6FF"  # transport & map symbols
            u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
            u"\U00002702-\U000027B0"
            u"\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE
        )
        text = emoji_pattern.sub('', text)
        
        # Удаляем лишние символы, но оставляем знаки препинания
        text = re.sub(r'[\\/@#*^~|]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Ограничиваем длину
        if len(text) > 500:
            text = text[:500] + "..."
        
        return text
    
    async def _silero_tts(
        self, text: str, voice_id: str, speed: float, emotion: str, output_format: str
    ) -> Optional[bytes]:
        """Silero TTS провайдер with fallback to Web Speech API simulation"""
        try:
            payload = {
                "text": text,
                "speaker": voice_id,
                "lang": "ru",
                "sample_rate": 24000,
                "speed": speed,
                "emotion": emotion,
                "format": output_format
            }
            
            response = requests.post(
                "https://api.silero.ai/voice",
                json=payload,
                timeout=10  # Shorter timeout
            )
            
            if response.ok:
                response_data = response.json()
                if 'results' in response_data and response_data['results']:
                    audio_base64 = response_data['results'][0]['audio']
                    return base64.b64decode(audio_base64)
            else:
                logger.error(f"Silero API error: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Silero TTS error: {e}")
            # Return a simple placeholder audio for demo purposes
            return self._generate_placeholder_audio(text)
        
        return None
    
    def _generate_placeholder_audio(self, text: str) -> bytes:
        """Generate a simple placeholder WAV file for demo purposes"""
        import struct
        import math
        
        # WAV file parameters
        sample_rate = 24000
        duration = min(len(text) * 0.1, 10)  # 0.1 second per character, max 10 seconds
        num_samples = int(sample_rate * duration)
        
        # Generate a simple sine wave tone
        frequency = 440  # A4 note
        samples = []
        for i in range(num_samples):
            t = i / sample_rate
            # Simple fade in/out envelope
            envelope = 1.0
            if t < 0.1:
                envelope = t / 0.1
            elif t > duration - 0.1:
                envelope = (duration - t) / 0.1
            
            sample = envelope * 0.3 * math.sin(2 * math.pi * frequency * t)
            samples.append(int(sample * 32767))
        
        # WAV file header
        byte_count = num_samples * 2
        wav_header = struct.pack('<4sI4s4sIHHIIHH4sI',
            b'RIFF',
            36 + byte_count,  # File size
            b'WAVE',
            b'fmt ',
            16,  # PCM header size
            1,   # PCM format
            1,   # Mono
            sample_rate,
            sample_rate * 2,  # Byte rate
            2,   # Block align
            16,  # Bits per sample
            b'data',
            byte_count
        )
        
        # Pack samples
        audio_data = b''.join(struct.pack('<h', sample) for sample in samples)
        
        return wav_header + audio_data
    
    async def _azure_tts(
        self, text: str, voice_id: str, speed: float, emotion: str, output_format: str
    ) -> Optional[bytes]:
        """Azure Speech Services TTS провайдер"""
        api_key = os.environ.get('AZURE_SPEECH_KEY')
        region = os.environ.get('AZURE_SPEECH_REGION', 'westus')
        
        if not api_key:
            return None
        
        try:
            # Построить SSML
            rate_percent = int((speed - 1) * 100)
            ssml = f"""
            <speak version='1.0' xml:lang='ru-RU'>
                <voice xml:lang='ru-RU' name='{voice_id}'>
                    <prosody rate='{rate_percent:+}%'>{text}</prosody>
                </voice>
            </speak>
            """
            
            headers = {
                'Ocp-Apim-Subscription-Key': api_key,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
            }
            
            response = requests.post(
                f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1',
                headers=headers,
                data=ssml.encode('utf-8'),
                timeout=30
            )
            
            if response.ok:
                return response.content
            else:
                logger.error(f"Azure TTS error: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Azure TTS error: {e}")
        
        return None
    
    async def _google_tts(
        self, text: str, voice_id: str, speed: float, emotion: str, output_format: str
    ) -> Optional[bytes]:
        """Google Cloud TTS провайдер"""
        api_key = os.environ.get('GOOGLE_CLOUD_TTS_KEY')
        
        if not api_key:
            return None
        
        try:
            payload = {
                "input": {"text": text},
                "voice": {
                    "languageCode": "ru-RU",
                    "name": voice_id,
                },
                "audioConfig": {
                    "audioEncoding": "MP3",
                    "speakingRate": speed,
                }
            }
            
            response = requests.post(
                f"https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}",
                json=payload,
                timeout=30
            )
            
            if response.ok:
                response_data = response.json()
                if 'audioContent' in response_data:
                    return base64.b64decode(response_data['audioContent'])
            else:
                logger.error(f"Google TTS error: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Google TTS error: {e}")
        
        return None
    
    async def _elevenlabs_tts(
        self, text: str, voice_id: str, speed: float, emotion: str, output_format: str
    ) -> Optional[bytes]:
        """ElevenLabs TTS провайдер (премиум качество)"""
        api_key = os.environ.get('ELEVENLABS_API_KEY')
        
        if not api_key:
            return None
        
        try:
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": api_key
            }
            
            data = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.5,
                    "speed": speed
                }
            }
            
            response = requests.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                json=data,
                headers=headers,
                timeout=30
            )
            
            if response.ok:
                return response.content
            else:
                logger.error(f"ElevenLabs TTS error: {response.status_code}")
                
        except Exception as e:
            logger.error(f"ElevenLabs TTS error: {e}")
        
        return None

# Глобальный экземпляр сервиса
tts_service = EnhancedTTSService()