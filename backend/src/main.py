import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.database import db
from src.routes.wallet import wallet_bp
from src.routes.payment import payment_bp
from src.routes.card import card_bp
from src.routes.kyc_aml import kyc_aml_bp
from src.routes.ledger import ledger_bp
from src.routes.ai_service import ai_bp
from src.routes.security import security_bp
from src.routes.api_gateway import api_gateway_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'flowlet_secure_key_2024_embedded_finance'

# Enable CORS for all routes
CORS(app, origins="*")

# Register all service blueprints
app.register_blueprint(wallet_bp, url_prefix='/api/v1/wallet')
app.register_blueprint(payment_bp, url_prefix='/api/v1/payment')
app.register_blueprint(card_bp, url_prefix='/api/v1/card')
app.register_blueprint(kyc_aml_bp, url_prefix='/api/v1/kyc')
app.register_blueprint(ledger_bp, url_prefix='/api/v1/ledger')
app.register_blueprint(ai_bp, url_prefix='/api/v1/ai')
app.register_blueprint(security_bp, url_prefix='/api/v1/security')
app.register_blueprint(api_gateway_bp, url_prefix='/api/v1/gateway')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'flowlet.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "Flowlet Embedded Finance Platform API", 200

@app.route('/health')
def health_check():
    return {"status": "healthy", "service": "Flowlet Backend", "version": "1.0.0"}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

