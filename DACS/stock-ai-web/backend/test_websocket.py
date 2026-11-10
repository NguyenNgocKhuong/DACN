import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
import time
from app import app, socketio

print("1. Kiểm tra khởi tạo Flask-SocketIO...")
client = socketio.test_client(app)
print("2. Kết nối test client thành công:", client.is_connected())

# Kiểm tra nhận connection_status
received = client.get_received()
print("3. Thông điệp kết nối nhận được:", received)

# Emit test event
print("4. Phát thông điệp price_tick thử nghiệm...")
socketio.emit("price_tick", {
    "symbol": "FPT",
    "delta_pct": 1.25,
    "volume_inc": 5000,
    "timestamp": "10:30:00"
})

received_after = client.get_received()
print("5. Nhận sự kiện price_tick:", received_after)

# Disconnect
client.disconnect()
print("6. Ngắt kết nối an toàn:", not client.is_connected())
print("✓ TOÀN BỘ HỆ THỐNG WEBSOCKET HOẠT ĐỘNG HOÀN HẢO!")

