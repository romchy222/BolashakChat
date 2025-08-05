# Импорт необходимых модулей
from datetime import datetime
from app import db
from werkzeug.security import generate_password_hash, check_password_hash

class Category(db.Model):
    """Модель категории для FAQ"""
    __tablename__ = 'categories'
    
    # Первичный ключ
    id = db.Column(db.Integer, primary_key=True)
    # Название категории на русском языке
    name_ru = db.Column(db.String(100), nullable=False)
    # Название категории на казахском языке
    name_kz = db.Column(db.String(100), nullable=False)
    # Описание категории на русском языке
    description_ru = db.Column(db.Text)
    # Описание категории на казахском языке
    description_kz = db.Column(db.Text)
    # Дата создания записи
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Связь один-ко-многим с FAQ
    faqs = db.relationship('FAQ', backref='category', lazy=True)
    
    def __repr__(self):
        """Строковое представление категории"""
        return f'<Category {self.name_ru}>'

class FAQ(db.Model):
    """Модель часто задаваемых вопросов"""
    __tablename__ = 'faqs'
    
    # Первичный ключ
    id = db.Column(db.Integer, primary_key=True)
    # Вопрос на русском языке
    question_ru = db.Column(db.Text, nullable=False)
    # Вопрос на казахском языке
    question_kz = db.Column(db.Text, nullable=False)
    # Ответ на русском языке
    answer_ru = db.Column(db.Text, nullable=False)
    # Ответ на казахском языке
    answer_kz = db.Column(db.Text, nullable=False)
    # Внешний ключ на категорию
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    # Статус активности FAQ
    is_active = db.Column(db.Boolean, default=True)
    # Дата создания записи
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Дата последнего обновления
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        """Строковое представление FAQ"""
        return f'<FAQ {self.question_ru[:50]}...>'

class UserQuery(db.Model):
    __tablename__ = 'user_queries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_message = db.Column(db.Text, nullable=False)
    bot_response = db.Column(db.Text, nullable=False)
    language = db.Column(db.String(5), nullable=False, default='ru')
    response_time = db.Column(db.Float)  # Response time in seconds
    
    # Agent tracking fields
    agent_type = db.Column(db.String(50))  # Type of agent that handled the query
    agent_name = db.Column(db.String(100))  # Name of the agent
    agent_confidence = db.Column(db.Float)  # Confidence score of the selected agent
    context_used = db.Column(db.Boolean, default=False)  # Whether FAQ context was used
    
    # Rating system fields
    user_rating = db.Column(db.String(10))  # 'like', 'dislike', or null
    rating_timestamp = db.Column(db.DateTime)  # When rating was given
    
    session_id = db.Column(db.String(100))
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<UserQuery {self.user_message[:30]}...>'

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    filename = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # pdf, doc, txt, etc.
    file_size = db.Column(db.Integer)  # Size in bytes
    content_text = db.Column(db.Text)  # Extracted text content
    is_processed = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('admin_users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Document {self.title}>'

class WebSource(db.Model):
    __tablename__ = 'web_sources'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    content_text = db.Column(db.Text)  # Extracted text content
    last_scraped = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    scrape_frequency = db.Column(db.String(20), default='daily')  # daily, weekly, manual
    added_by = db.Column(db.Integer, db.ForeignKey('admin_users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<WebSource {self.title}>'

class KnowledgeBase(db.Model):
    __tablename__ = 'knowledge_base'
    
    id = db.Column(db.Integer, primary_key=True)
    source_type = db.Column(db.String(20), nullable=False)  # 'document', 'web', 'manual'
    source_id = db.Column(db.Integer)  # Foreign key to Document or WebSource
    content_chunk = db.Column(db.Text, nullable=False)
    extra_data = db.Column(db.JSON)  # Additional metadata like page numbers, sections, etc.
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<KnowledgeBase {self.source_type}:{self.source_id}>'

class AgentKnowledgeBase(db.Model):
    """Agent-specific knowledge base entries"""
    __tablename__ = 'agent_knowledge_base'
    
    id = db.Column(db.Integer, primary_key=True)
    agent_type = db.Column(db.String(50), nullable=False)  # Type of agent this knowledge belongs to
    title = db.Column(db.String(200), nullable=False)
    content_ru = db.Column(db.Text, nullable=False)  # Content in Russian
    content_kz = db.Column(db.Text, nullable=False)  # Content in Kazakh
    keywords = db.Column(db.String(500))  # Search keywords
    priority = db.Column(db.Integer, default=1)  # Priority for ordering (1=highest)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('admin_users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<AgentKnowledgeBase {self.agent_type}:{self.title}>'

class AdminUser(db.Model):
    __tablename__ = 'admin_users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    documents = db.relationship('Document', backref='uploader', lazy=True)
    web_sources = db.relationship('WebSource', backref='creator', lazy=True)
    agent_knowledge = db.relationship('AgentKnowledgeBase', backref='creator', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<AdminUser {self.username}>'
