# BolashakBot - University Chatbot System

## Overview

BolashakBot is a bilingual (Russian/Kazakh) chatbot system designed for Kyzylorda "Bolashak" University to help prospective students get information about admissions, programs, and requirements. The system uses Flask as the web framework and integrates with Mistral AI for intelligent responses based on an FAQ database.

## User Preferences

Preferred communication style: Simple, everyday language.
Widget design requirements: Minimal, clean layout matching university website style (white background, gray/black text, no bright accent colors).

## System Architecture

The application follows a traditional web application architecture with the following key components:

### Frontend
- **Technology**: HTML5, Bootstrap 5, vanilla JavaScript
- **Interface**: Single-page application with an embedded chat widget
- **Styling**: Custom CSS with Bootstrap framework and Font Awesome icons
- **Responsive Design**: Mobile-friendly interface with collapsible navigation

### Backend
- **Framework**: Flask (Python web framework)
- **Architecture Pattern**: Blueprint-based modular structure
- **Database ORM**: SQLAlchemy with Flask-SQLAlchemy extension
- **Session Management**: Flask sessions for admin authentication
- **API Design**: RESTful endpoints for chat functionality

### Database Design
- **Default Database**: SQLite (configured for development)
- **Production Ready**: Configurable for PostgreSQL via DATABASE_URL environment variable
- **Schema**: Relational database with proper foreign key relationships
- **Migration Support**: SQLAlchemy-based table creation and management

## Key Components

### Models (`models.py`)
- **Category**: Bilingual categories for organizing FAQs
- **FAQ**: Bilingual question-answer pairs with category relationships
- **UserQuery**: Conversation logs with analytics data
- **AdminUser**: Authentication system for administrative access

### Blueprints
- **Main Blueprint** (`views.py`): Public chat interface and API endpoints
- **Admin Blueprint** (`admin.py`): Administrative dashboard and management
- **Auth Blueprint** (`auth.py`): Authentication and session management

### AI Integration
- **Mistral AI Client** (`mistral_client.py`): External API integration for natural language processing
- **Context Retrieval** (`utils.py`): FAQ database search and context preparation
- **Bilingual Support**: Language-specific system prompts and responses

### Administrative Features
- **Dashboard**: Analytics and statistics overview
- **FAQ Management**: CRUD operations for questions and answers
- **Category Management**: Organization system for content
- **Query Analytics**: User interaction tracking and performance metrics

## Data Flow

1. **User Interaction**: User sends message through chat widget
2. **Context Retrieval**: System searches FAQ database for relevant content
3. **AI Processing**: Mistral AI generates response using retrieved context
4. **Response Delivery**: Formatted response sent back to user
5. **Analytics Logging**: Interaction data stored for admin analysis

### API Endpoints
- `POST /api/chat`: Main chat endpoint for user messages
- `GET /auth/verify-session`: Admin session verification
- Admin routes under `/admin/` prefix for management functions

## External Dependencies

### Third-Party Services
- **Mistral AI API**: Primary AI service for generating responses
- **Bootstrap CDN**: Frontend styling framework
- **Font Awesome CDN**: Icon library

### Python Packages
- **Flask**: Web framework and routing
- **SQLAlchemy**: Database ORM and management
- **Werkzeug**: Security utilities (password hashing, proxy handling)
- **Requests**: HTTP client for external API calls

### Environment Variables
- `DATABASE_URL`: Database connection string
- `MISTRAL_API_KEY`: API key for Mistral AI service
- `SESSION_SECRET`: Secret key for session management

## Deployment Strategy

### Development Setup
- **Entry Point**: `main.py` with debug mode enabled
- **Local Database**: SQLite with automatic table creation
- **Hot Reload**: Flask development server with debug=True

### Production Considerations
- **Database**: Configurable via DATABASE_URL for PostgreSQL
- **Security**: Environment-based configuration for secrets
- **Proxy Support**: ProxyFix middleware for reverse proxy deployment
- **Session Management**: Secure session handling with configurable secrets

### Database Initialization
- **Setup Script**: `setup_db.py` for default data initialization
- **Database Utils**: `database.py` for table management and reset functionality
- **Default Content**: Pre-configured categories and sample FAQ entries

### Performance Features
- **Connection Pooling**: SQLAlchemy engine options for connection management
- **Response Time Tracking**: Performance analytics for optimization
- **Caching Ready**: Structure supports future caching implementation

The system is designed to be easily deployable on various platforms with minimal configuration changes, while maintaining separation of concerns and modularity for future enhancements.