from dotenv import load_dotenv
from src.app import create_app

"""
WSGI Entry Point for Flowlet Application
"""


# Load environment variables from .env file for configuration
load_dotenv()

# Create the application instance
application = create_app()

# Note: The application instance is named 'application' for compatibility with
# most WSGI servers (e.g., Gunicorn, uWSGI).
