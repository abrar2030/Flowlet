"""
Flowlet Financial Backend - Main Application Entry Point
Production-ready Flask application with improved architecture
"""

import os

from app import create_app

# Create Flask application
app = create_app()


@app.cli.command()
def init_db_cli():
    """Initialize the database"""
    init_db(app)
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
            status=UserStatus.ACTIVE,
        )
        admin.set_password("AdminPassword123!")

        db.session.add(admin)
        db.session.commit()

        print(f"Admin user created: {admin_email}")


if __name__ == "__main__":
    # Run the application
    # The database is initialized via the init_db_cli command or by running main.py directly.
    # The app.config.get('DEBUG', False) should be used, but we'll ensure it's set
    # based on an environment variable for consistency.
    debug_mode = os.environ.get("FLASK_DEBUG", "False").lower() in ("true", "1", "t")

    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=debug_mode)
