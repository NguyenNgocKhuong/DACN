import os
import sys

# Add backend to sys.path to import models and database
backend_path = os.path.abspath(os.path.dirname(__file__))
if backend_path not in sys.path:
    sys.path.append(backend_path)

from database.db import db_session
from models.user_model import User

def verify_passwords():
    print("Verifying passwords...")
    
    admin = User.query.filter(User.username == 'admin').first()
    if admin and admin.password == '123456':
        print("PASS: Admin password is 123456")
    else:
        print(f"FAIL: Admin password is {admin.password if admin else 'None'}")

    other_users = User.query.filter(User.username != 'admin').all()
    all_others_correct = all(u.password == '123457' for u in other_users)
    
    if all_others_correct:
        print(f"PASS: All {len(other_users)} other users have password 123457")
    else:
        print("FAIL: Some other users do not have the expected password")
        for u in other_users:
            if u.password != '123457':
                 print(f"User ID {u.id} has incorrect password")

    db_session.remove()

if __name__ == "__main__":
    verify_passwords()
