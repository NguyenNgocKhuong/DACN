from flask import Flask, jsonify
from flask_cors import CORS
from routes.stock import stock_bp
from routes.user import user_bp
from routes.message import message_bp
from database.db import db_session, init_db
from services.data_fetcher import update_stock_data
import threading

app = Flask(__name__)
CORS(app)

# Auto-update data in background
def bg_update():
    with app.app_context():
        print("Updating stock data in background...")
        try:
            update_stock_data()
        except Exception as e:
            print(f"Background update failed: {e}")

app.register_blueprint(stock_bp, url_prefix='/api/stocks')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(message_bp, url_prefix='/api/messages')

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

@app.route('/')
def index():
    return jsonify({"message": "Welcome to BDT AI API"})

if __name__ == '__main__':
    with app.app_context():
        print("Initializing database...")
        init_db()
    
    # Start background update thread only when running directly
    threading.Thread(target=bg_update, daemon=True).start()
    
    print("Starting BDT AI Backend on port 5001...")
    app.run(debug=True, port=5001)
