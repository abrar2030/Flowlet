#!/usr/bin/env python3
"""
Run the Flask application
"""
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set required environment variables
os.environ.setdefault("SECRET_KEY", "development-secret-key-change-in-production")
os.environ.setdefault("FLASK_ENV", "development")
os.environ.setdefault("FLASK_CONFIG", "development")
os.environ.setdefault("OPENAI_API_KEY", "sk-test-key")
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_key")

from app import create_app

app = create_app()

if __name__ == "__main__":
    print("=" * 60)
    print("Flowlet Financial Backend - Development Server")
    print("=" * 60)
    print(f"✓ App created successfully")
    print(f"✓ Registered blueprints: {len(app.blueprints)}")
    print(f"✓ Database: {app.config.get('SQLALCHEMY_DATABASE_URI', 'N/A')[:50]}...")
    print(f"✓ Debug mode: {app.config.get('DEBUG', False)}")
    print("=" * 60)
    print("Starting server on http://localhost:5000")
    print("Press CTRL+C to quit")
    print("=" * 60)

    app.run(host="0.0.0.0", port=5000, debug=True)
