import os
import sys

# Add backend to sys.path to import models and database
backend_path = os.path.abspath(os.path.dirname(__file__))
if backend_path not in sys.path:
    sys.path.append(backend_path)

from database.db import db_session
from models.user_model import User

def reset_passwords():
    print("Connecting to database...")
    
    # Reset admin password
    admin = User.query.filter(User.username == 'admin').first()
    if admin:
        admin.password = '123456'
        print(f"Updated admin password to 123456")
    else:
        print("Admin user not found!")

    # Reset other users passwords
    other_users = User.query.filter(User.username != 'admin').all()
    print(f"Updating passwords for {len(other_users)} other users...")
    for user in other_users:
        user.password = '123457'

    try:
        db_session.commit()
        print("Changes committed successfully.")
    except Exception as e:
        db_session.rollback()
        print(f"Error committing changes: {e}")
    finally:
        db_session.remove()

if __name__ == "__main__":
    reset_passwords()
