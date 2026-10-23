import os
import sys

# Add backend to sys.path to import models and database
backend_path = os.path.abspath(os.path.dirname(__file__))
if backend_path not in sys.path:
    sys.path.append(backend_path)

from database.db import db_session
from models.user_model import User

users = User.query.all()
print(f"Total users: {len(users)}")
for user in users:
    print(f"User: {user.username}, Password: {user.password}")

db_session.remove()
