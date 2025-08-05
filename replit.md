# BolashakChat - Multi-Agent University Chatbot System

## Overview

BolashakChat is a sophisticated multi-agent chatbot system designed for Kyzylorda University "Bolashak". This platform provides intelligent assistance to prospective students and current students in both Russian and Kazakh languages. The system features a modern web-based chat interface, comprehensive admin dashboard, multi-agent architecture for specialized query handling, and integration with Mistral AI for natural language processing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Multi-Agent Architecture
The system employs a multi-agent design where specialized agents handle different domains of university inquiries. Each agent has its own confidence scoring system and can process queries related to:
- **AdmissionAgent**: Admissions and enrollment processes
- **ScholarshipAgent**: Scholarships and financial support
- **AcademicAgent**: Academic questions and educational processes
- **StudentLifeAgent**: Student life and extracurricular activities
- **GeneralAgent**: General university information

The AgentRouter component intelligently routes incoming messages to the most appropriate agent based on confidence scores and implements fallback mechanisms when external APIs are unavailable.

### Backend Architecture
Built on Flask with a modular Blueprint structure for maintainability and scalability. The system uses SQLAlchemy ORM for database operations with support for both SQLite (development) and PostgreSQL (production). The application includes comprehensive admin functionality for managing FAQ content, categories, user queries, and document processing.

### Frontend Architecture
Modern responsive web interface using HTML5, CSS3 with Bootstrap 5, and vanilla JavaScript with ES6 modules. Features include a chat widget that can be embedded in university websites, bilingual support (Russian/Kazakh), voice input capabilities, and real-time analytics dashboard with Chart.js integration.

### Database Design
Relational database schema with models for Categories, FAQ entries, UserQuery logs with agent tracking, AdminUser management, Document storage, KnowledgeBase fragments, and WebSource management. The design includes proper foreign key relationships and supports database migrations.

### AI Integration
Integration with Mistral AI API for natural language processing and response generation. The system includes intelligent context retrieval from FAQ database and knowledge base, language-specific system prompts for Russian and Kazakh, and fallback responses when AI services are unavailable.

### Analytics and Monitoring
Comprehensive analytics system tracking agent usage distribution, language preferences, response times and success rates, and daily activity trends. Real-time health monitoring with API endpoints for deployment readiness checks and system status verification.

## External Dependencies

### AI Services
- **Mistral AI API**: Primary language model for generating responses and natural language understanding
- **Speech Recognition API**: Browser-based voice input functionality

### Database Systems
- **SQLite**: Development environment database
- **PostgreSQL**: Production database (with Neon.tech support mentioned in configurations)

### Frontend Libraries
- **Bootstrap 5**: CSS framework for responsive design
- **Chart.js**: Interactive charts and graphs for analytics dashboard
- **Font Awesome**: Icon library for UI elements
- **Marked.js**: Markdown parsing for bot responses

### Development and Deployment
- **Flask**: Primary web framework
- **SQLAlchemy**: Object-relational mapping
- **Gunicorn**: WSGI HTTP server for production deployment
- **GitHub Actions**: CI/CD pipeline for automated testing and deployment
- **Trafilatura**: HTML content extraction for document processing

### Document Processing
- **PyPDF2**: PDF text extraction (referenced in document processor)
- **Mimetypes**: File type detection and validation

The system is designed to be highly modular and extensible, allowing for easy addition of new agents, languages, or external service integrations while maintaining backward compatibility and system stability.