"""
Flowlet Financial Backend - Main Application Entry Point
Production-ready Flask application with improved architecture
"""

import os
from app import create_app, db

# Create Flask application
app = create_app()

@app.cli.command()
def init_db():
    """Initialize the database"""
    with app.app_context():
        db.create_all()
        print("Database initialized successfully")

@app.cli.command()
def create_admin():
    """Create admin user"""
    from app.models.user import User, UserRole, UserStatus
    
    with app.app_context():
        admin_email = "admin@flowlet.com"
        existing_admin = User.query.filter_by(email=admin_email).first()
        
        if existing_admin:
            print(f"Admin user {admin_email} already exists")
            return
        
        admin = User(
            email=admin_email,
            first_name="Admin",
            last_name="User",
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE
        )
        admin.set_password("AdminPassword123!")
        
        db.session.add(admin)
        db.session.commit()
        
        print(f"Admin user created: {admin_email}")

if __name__ == "__main__":
    # Run the application
    # The database is initialized in app.py's init_db function, which is called
    # if the app is run directly, or via the init_db CLI command.
    # The app.config.get('DEBUG', False) should be used, but we'll ensure it's set
    # based on an environment variable for consistency.
    debug_mode = os.environ.get("FLASK_DEBUG", "False").lower() in ("true", "1", "t")
    
    app.run(
        host="0.0.0.0", 
        port=int(os.environ.get("PORT", 5000)),
        debug=debug_mode
    )

