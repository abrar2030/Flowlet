import os
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.declarative import declarative_base

"\nDatabase initialization and configuration for Flowlet.\nThis file defines the SQLAlchemy instance and the init_db function.\n"
db = SQLAlchemy()
Base = declarative_base()


def init_db(app: Any) -> Any:
    """Initializes the database and creates all tables."""
    with app.app_context():
        db_uri = app.config.get("SQLALCHEMY_DATABASE_URI")
        if db_uri and db_uri.startswith("sqlite:///"):
            db_path = db_uri.replace("sqlite:///", "")
            if not os.path.isabs(db_path):
                db_path = os.path.join(os.getcwd(), db_path)
            db_dir = os.path.dirname(db_path)
            if db_dir and (not os.path.exists(db_dir)):
                os.makedirs(db_dir)
        db.init_app(app)
        db.create_all()


__all__ = ["db", "init_db", "Base"]
