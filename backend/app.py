"""
Flowlet Integrated Application - Production Deployment
"""

from simple_app import app, init_db

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)

