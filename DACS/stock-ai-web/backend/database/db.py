import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os

db_path = os.path.join(os.path.dirname(__file__), '../app.db')
engine = create_engine(f'sqlite:///{db_path}')

db_session = scoped_session(sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=engine))
Base = declarative_base()
Base.query = db_session.query_property()

def init_db():
    import models.user_model
    import models.stock_model
    Base.metadata.create_all(bind=engine)
    
    from models.user_model import User, PortfolioItem, Message
    admin = User.query.filter(User.username == 'admin').first()
    if not admin:
        admin_user = User('admin', '123455', 500000.0)
        db_session.add(admin_user)
        db_session.add(User('user1', '654321', 100000.0))
        db_session.add(User('user2', '111111', 100000.0))
        db_session.commit()
        
        # Seed initial portfolio for demo
        db_session.add(PortfolioItem(admin_user.id, "AAPL", 150, 142.5))
        db_session.add(PortfolioItem(admin_user.id, "VNINDEX", 5000, 1180.0))
        db_session.add(PortfolioItem(admin_user.id, "TSLA", 50, 195.0))
        db_session.commit()
