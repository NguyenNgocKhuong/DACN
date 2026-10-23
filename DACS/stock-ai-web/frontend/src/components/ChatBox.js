import React, { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, markMessagesAsRead } from '../services/api';

const ChatBox = ({ currentUser, targetUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await getMessages(currentUser, targetUser);
      setMessages(res.data);
      if (res.data.length > 0) {
        await markMessagesAsRead(targetUser, currentUser);
      }
    } catch (e) {
      console.log('Error fetching messages', e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [currentUser, targetUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    try {
      await sendMessage({ sender: currentUser, receiver: targetUser, content: inputText });
      setInputText('');
      fetchMessages();
    } catch (e) {
      console.log('Error sending message', e);
    }
  };

  return (
    <div className="chat-box glass" style={{
      position: 'fixed', bottom: '20px', right: '20px', width: '350px', height: '500px', 
      display: 'flex', flexDirection: 'column', borderRadius: '15px', zIndex: 1000,
      border: '1px solid rgba(0, 242, 254, 0.5)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      animation: 'slideUp 0.3s ease-out forwards'
    }}>
      <div style={{ background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          💬 Trao đổi với {targetUser === 'admin' ? 'Hỗ trợ viên' : targetUser}
        </h3>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e=>e.target.style.transform='scale(1.2)'} onMouseOut={e=>e.target.style.transform='scale(1)'}>✖</button>
      </div>
      
      <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.7)' }}>
        {messages.map(m => {
          const isMe = m.sender === currentUser;
          return (
            <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{ 
                background: isMe ? 'linear-gradient(135deg, #00f2fe, #4facfe)' : 'rgba(255,255,255,0.1)', 
                padding: '10px 15px', borderRadius: isMe ? '15px 15px 0 15px' : '15px 15px 15px 0',
                color: '#fff', fontSize: '0.95rem', border: isMe ? 'none' : '1px solid rgba(255,255,255,0.05)'
              }}>
                {m.content}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#90a4ae', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                {m.timestamp}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && <div style={{ color: '#90a4ae', textAlign: 'center', marginTop: '20px' }}>Chưa có tin nhắn nào. Hãy gửi lời chào! 👋</div>}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.8)', padding: '10px' }}>
        <input 
          type="text" 
          value={inputText} 
          onChange={e => setInputText(e.target.value)} 
          placeholder="Viết tin nhắn..." 
          style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none' }}
        />
        <button type="submit" style={{ background: 'transparent', border: 'none', color: '#00f2fe', fontSize: '1.5rem', cursor: 'pointer', marginLeft: '10px', transition: 'transform 0.2s' }} onMouseOver={e=>e.target.style.transform='scale(1.2)'} onMouseOut={e=>e.target.style.transform='scale(1)'}>
          ➤
        </button>
      </form>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ChatBox;
