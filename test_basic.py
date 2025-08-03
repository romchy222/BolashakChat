"""
Basic tests for BolashakChat application
"""
import pytest
import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

@pytest.fixture
def app():
    """Create test app"""
    os.environ['FLASK_ENV'] = 'testing'
    os.environ['SESSION_SECRET'] = 'test-secret-key'
    os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
    
    from app import create_app
    app = create_app()
    app.config['TESTING'] = True
    
    with app.app_context():
        from app import db
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

def test_app_creation():
    """Test that app can be created"""
    os.environ['FLASK_ENV'] = 'testing'
    os.environ['SESSION_SECRET'] = 'test-secret-key'
    
    from app import create_app
    app = create_app()
    assert app is not None
    assert app.config['TESTING'] is True

def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get('/health')
    assert response.status_code == 200
    
    data = response.get_json()
    assert data['status'] == 'healthy'
    assert 'timestamp' in data
    assert data['database'] == 'connected'

def test_index_page(client):
    """Test main page loads"""
    response = client.get('/')
    assert response.status_code == 200

def test_chat_page(client):
    """Test chat page loads"""
    response = client.get('/chat')
    assert response.status_code == 200

def test_widget_demo_page(client):
    """Test widget demo page loads"""
    response = client.get('/widget-demo')
    assert response.status_code == 200

def test_admin_login_redirect(client):
    """Test that admin pages require authentication"""
    response = client.get('/admin/')
    # Should redirect to login
    assert response.status_code == 302

def test_chat_api_missing_message(client):
    """Test chat API with missing message"""
    response = client.post('/api/chat', 
                          json={},
                          content_type='application/json')
    assert response.status_code == 400

def test_chat_api_empty_message(client):
    """Test chat API with empty message"""
    response = client.post('/api/chat', 
                          json={'message': ''},
                          content_type='application/json')
    assert response.status_code == 400

def test_configuration():
    """Test configuration loading"""
    from config import DevelopmentConfig, ProductionConfig, TestingConfig
    
    dev_config = DevelopmentConfig()
    assert dev_config.DEBUG is True
    
    test_config = TestingConfig()
    assert test_config.TESTING is True
    assert test_config.SQLALCHEMY_DATABASE_URI == 'sqlite:///:memory:'

def test_production_config_validation():
    """Test that production config validates required settings"""
    # Remove environment variables to test validation
    old_secret = os.environ.pop('SESSION_SECRET', None)
    old_mistral = os.environ.pop('MISTRAL_API_KEY', None)
    
    try:
        from config import ProductionConfig
        
        # Should raise ValueError without required environment variables
        with pytest.raises(ValueError):
            ProductionConfig()
    finally:
        # Restore environment variables
        if old_secret:
            os.environ['SESSION_SECRET'] = old_secret
        if old_mistral:
            os.environ['MISTRAL_API_KEY'] = old_mistral

if __name__ == '__main__':
    pytest.main([__file__])