import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
import time
import random
import threading
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from routes.stock import stock_bp
from routes.user import user_bp
from routes.message import message_bp
from database.db import db_session, init_db
from services.data_fetcher import update_stock_data

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# Auto-update data in background
def bg_update():
    with app.app_context():
        print("Updating stock data in background...")
        try:
            update_stock_data()
        except Exception as e:
            print(f"Background update failed: {e}")

# Kênh phát sóng giá chứng khoán thời gian thực (Real-time Price Tick Broadcast)
def broadcast_live_ticks():
    time.sleep(3) # Chờ server khởi động hoàn tất
    symbols_pool = ["FPT", "VCB", "HPG", "VIC", "VHM", "MWG", "TCB", "SSI", "AAPL", "NVDA", "TSLA", "MSFT"]
    print("[WebSocket] Kênh phát sóng thời gian thực đã kích hoạt.")
    
    while True:
        try:
            # Chọn ngẫu nhiên 2-4 mã để nhảy giá
            sample_syms = random.sample(symbols_pool, k=random.randint(2, 4))
            for sym in sample_syms:
                delta_pct = random.uniform(-0.015, 0.018)
                vol_inc = random.randint(1000, 30000)
                
                tick_data = {
                    "symbol": sym,
                    "delta_pct": round(delta_pct * 100, 2),
                    "volume_inc": vol_inc,
                    "timestamp": time.strftime("%H:%M:%S")
                }
                socketio.emit("price_tick", tick_data)

            # Thỉnh thoảng phát tín hiệu cảnh báo AI
            if random.random() < 0.25:
                alert_sym = random.choice(symbols_pool)
                is_buy = random.choice([True, False])
                socketio.emit("ai_alert", {
                    "symbol": alert_sym,
                    "type": "BUY_SIGNAL" if is_buy else "SELL_ALERT",
                    "message": f"🤖 Tín hiệu AI: {alert_sym} xuất hiện xung lực {'MUA MẠNH' if is_buy else 'CHỐT LỜI'} (Độ tin cậy: {random.randint(80, 94)}%)",
                    "timestamp": time.strftime("%H:%M:%S")
                })
        except Exception as e:
            pass
            
        time.sleep(2.5)

@socketio.on('connect')
def handle_connect():
    emit('connection_status', {'status': 'connected', 'message': 'Kết nối WebSocket BDT AI thành công!'})

@socketio.on('disconnect')
def handle_disconnect():
    pass

app.register_blueprint(stock_bp, url_prefix='/api/stocks')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(message_bp, url_prefix='/api/messages')

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

@app.route('/')
def index():
    return jsonify({"message": "Welcome to BDT AI API with WebSocket Real-time"})

if __name__ == '__main__':
    with app.app_context():
        print("Initializing database...")
        init_db()
    
    # Khởi động các luồng ngầm
    threading.Thread(target=bg_update, daemon=True).start()
    threading.Thread(target=broadcast_live_ticks, daemon=True).start()
    
    print("Starting BDT AI Backend with WebSocket on port 5001...")
    socketio.run(app, debug=False, port=5001, allow_unsafe_werkzeug=True)
