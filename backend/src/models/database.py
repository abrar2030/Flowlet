"""
Database initialization and configuration for Flowlet.
This file defines the SQLAlchemy instance and the init_db function.
"""

import os
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.declarative import declarative_base

# Initialize SQLAlchemy
db = SQLAlchemy()
Base = declarative_base()


def init_db(app):
    """Initializes the database and creates all tables."""
    with app.app_context():
        # Ensure the database directory exists for SQLite
        db_uri = app.config.get("SQLALCHEMY_DATABASE_URI")
        if db_uri and db_uri.startswith("sqlite:///"):
            db_path = db_uri.replace("sqlite:///", "")
            # Handle relative path from the project root
            if not os.path.isabs(db_path):
                db_path = os.path.join(os.getcwd(), db_path)
            db_dir = os.path.dirname(db_path)
            if db_dir and not os.path.exists(db_dir):
                os.makedirs(db_dir)

        # Initialize the SQLAlchemy extension with the app
        db.init_app(app)

        # Create all tables defined in the models
        db.create_all()


# Re-export Base for models to inherit from
__all__ = ["db", "init_db", "Base"]
