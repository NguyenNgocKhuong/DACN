from flask import Blueprint, jsonify, request
from models.user_model import Message
from database.db import db_session
from sqlalchemy import or_, and_

message_bp = Blueprint('message', __name__)

@message_bp.route('/<user1>/<user2>', methods=['GET'])
def get_messages(user1, user2):
    msgs = Message.query.filter(
        or_(
            and_(Message.sender == user1, Message.receiver == user2),
            and_(Message.sender == user2, Message.receiver == user1)
        )
    ).order_by(Message.id.asc()).all()
    
    return jsonify([{"id": m.id, "sender": m.sender, "receiver": m.receiver, "content": m.content, "timestamp": m.timestamp} for m in msgs]), 200

@message_bp.route('', methods=['POST'], strict_slashes=False)
@message_bp.route('/', methods=['POST'], strict_slashes=False)
def send_message():
    data = request.get_json()
    sender = data.get('sender')
    receiver = data.get('receiver')
    content = data.get('content')
    
    if not sender or not receiver or not content:
        return jsonify({"error": "Thiếu thông tin tin nhắn"}), 400
        
    new_msg = Message(sender, receiver, content)
    db_session.add(new_msg)
    db_session.commit()
    
    return jsonify({
        "message": "Đã gửi", 
        "msg": {"id": new_msg.id, "sender": new_msg.sender, "receiver": new_msg.receiver, "content": new_msg.content, "timestamp": new_msg.timestamp}
    }), 201

@message_bp.route('/unread/<username>', methods=['GET'])
def get_unread_count(username):
    msgs = Message.query.filter(Message.receiver == username, Message.is_read == False).order_by(Message.id.desc()).all()
    count = len(msgs)
    
    details = []
    senders_seen = set()
    for m in msgs:
        if m.sender not in senders_seen:
            details.append({
                "id": m.id,
                "sender": m.sender,
                "content": m.content,
                "timestamp": m.timestamp
            })
            senders_seen.add(m.sender)
            
    return jsonify({"count": count, "details": details}), 200

@message_bp.route('/mark_read/<sender>/<receiver>', methods=['POST'], strict_slashes=False)
@message_bp.route('/mark_read/<sender>/<receiver>/', methods=['POST'], strict_slashes=False)
def mark_read(sender, receiver):
    msgs = Message.query.filter(Message.sender == sender, Message.receiver == receiver, Message.is_read == False).all()
    if msgs:
        for m in msgs:
            m.is_read = True
        db_session.commit()
    return jsonify({"message": "Đã đánh dấu đọc"}), 200

