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
    # Initialize database on first run
    with app.app_context():
        db.create_all()
    
    # Run the application
    app.run(
        host="0.0.0.0", 
        port=int(os.environ.get("PORT", 5000)),
        debug=app.config.get('DEBUG', False)
    )

