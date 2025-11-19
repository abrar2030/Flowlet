"""
Flowlet Financial Backend - Main Application Entry Point
Production-ready Flask application with improved architecture
"""
import os
from dotenv import load_dotenv
from src.app import create_app
from src.models.database import db, init_db

# Load environment variables from .env file
load_dotenv()

# Create Flask application
app = create_app()

@app.cli.command()
def init_db_cli():
    """Initialize the database"""
    with app.app_context():
        init_db(app)
        print("Database initialized successfully")

@app.cli.command()
def create_admin():
    """Create admin user"""
    from src.models.user import User, UserRole, UserStatus
    from src.security.password_security import hash_password
    
    with app.app_context():
        admin_email = "admin@flowlet.com"
        existing_admin = User.query.filter_by(email=admin_email).first()
        
        if existing_admin:
            print(f"Admin user {admin_email} already exists")
            return
        
        # Ensure the database is initialized before creating the user
        # This is a safety check, but init_db_cli should be run first.
        # init_db(app) 

        admin = User(
            email=admin_email,
            first_name="Admin",
            last_name="User",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            password_hash=hash_password("AdminPassword123!") # Use secure hashing
        )
        
        db.session.add(admin)
        db.session.commit()
        
        print(f"Admin user created: {admin_email}")

if __name__ == "__main__":
    # Run the application
    # The app.run() is protected by the "__main__" guard.
    debug_mode = os.environ.get("FLASK_DEBUG", "False").lower() in ("true", "1", "t")
    
    app.run(
        host="0.0.0.0", 
        port=int(os.environ.get("PORT", 5000)),
        debug=debug_mode
    )
