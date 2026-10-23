from flask import Blueprint, jsonify, request
from models.user_model import User, PortfolioItem
from database.db import db_session

user_bp = Blueprint('user', __name__)

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    print(f"Login attempt: {username}")
    user = User.query.filter_by(username=username).first()
    if user and user.password == password:
        return jsonify({"message": "Đăng nhập thành công", "username": username, "token": "mock-jwt-token"}), 200
    
    return jsonify({"error": "Tài khoản hoặc mật khẩu không chính xác"}), 401

@user_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Vui lòng nhập đầy đủ thông tin"}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Tài khoản này đã tồn tại"}), 400
        
    new_user = User(username=username, password=password)
    db_session.add(new_user)
    db_session.commit()
    
    return jsonify({"message": "Đăng ký thành công", "username": username}), 201

@user_bp.route('/', methods=['GET'])
def get_users():
    users = User.query.all()
    result = [{"id": u.id, "username": u.username, "balance": u.balance} for u in users]
    return jsonify(result), 200

@user_bp.route('/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    if user:
        if user.username == 'admin':
            return jsonify({"error": "Không thể xóa Admin"}), 400
        db_session.delete(user)
        db_session.commit()
        return jsonify({"message": "Đã xóa tài khoản"}), 200
    return jsonify({"error": "Tài khoản không tồn tại"}), 404

@user_bp.route('/<int:user_id>/balance', methods=['PUT'])
def update_balance(user_id):
    data = request.json
    try:
        new_balance = float(data.get('balance'))
    except (TypeError, ValueError):
        return jsonify({"error": "Giá trị không hợp lệ"}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Tài khoản không tồn tại"}), 404
        
    user.balance = new_balance
    db_session.commit()
    return jsonify({"message": f"Đã cập nhật số dư cho {user.username} thành ${new_balance:,.2f}"}), 200

@user_bp.route('/<username>/wallet', methods=['GET'])
def get_user_wallet(username):
    user = User.query.filter(User.username == username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    items = PortfolioItem.query.filter(PortfolioItem.user_id == user.id).all()
    portfolio = [{"symbol": i.symbol, "volume": i.volume, "avg_price": i.avg_price} for i in items]
    
    return jsonify({
        "balance": user.balance,
        "portfolio": portfolio
    }), 200

@user_bp.route('/transfer', methods=['POST'])
def transfer_money():
    data = request.get_json()
    sender_name = data.get('sender')
    receiver_name = data.get('receiver')
    try:
        amount = float(data.get('amount', 0))
    except (ValueError, TypeError):
        amount = 0
        
    if amount <= 0:
        return jsonify({"error": "Số tiền chuyển phải lớn hơn 0"}), 400
        
    sender = User.query.filter(User.username == sender_name).first()
    receiver = User.query.filter(User.username == receiver_name).first()
    
    if not sender or not receiver:
        return jsonify({"error": "Tài khoản gửi hoặc nhận không tồn tại"}), 404
        
    if sender.balance < amount:
        return jsonify({"error": "Số dư không đủ để thực hiện giao dịch"}), 400
        
    sender.balance -= amount
    receiver.balance += amount
    db_session.commit()
    
    return jsonify({
        "message": f"🏆 Chuyển thành công ${amount:,.2f} cho {receiver_name}!", 
        "new_balance": sender.balance
    }), 200
