from sqlalchemy import Column, Integer, String, Float, Boolean
from database.db import Base
from datetime import datetime

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True)
    password = Column(String(120))
    balance = Column(Float, default=100000.0)

    def __init__(self, username=None, password=None, balance=100000.0):
        self.username = username
        self.password = password
        self.balance = balance

    def __repr__(self):
        return f'<User {self.username!r}>'

class PortfolioItem(Base):
    __tablename__ = 'portfolio_items'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    symbol = Column(String(20))
    volume = Column(Integer)
    avg_price = Column(Float)

    def __init__(self, user_id=None, symbol=None, volume=0, avg_price=0.0):
        self.user_id = user_id
        self.symbol = symbol
        self.volume = volume
        self.avg_price = avg_price

class Message(Base):
    __tablename__ = 'messages'
    id = Column(Integer, primary_key=True)
    sender = Column(String(50))
    receiver = Column(String(50))
    content = Column(String(500))
    timestamp = Column(String(50))
    is_read = Column(Boolean, default=False)

    def __init__(self, sender=None, receiver=None, content=None):
        self.sender = sender
        self.receiver = receiver
        self.content = content
        self.timestamp = datetime.now().strftime("%d/%m/%Y %H:%M")
        self.is_read = False
