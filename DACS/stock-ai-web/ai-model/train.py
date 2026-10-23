import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

# Load mock data
data_path = os.path.join(os.path.dirname(__file__), '../data/stock_data.csv')
df = pd.read_csv(data_path)

# Prepare data (mock example)
X = df[['open', 'high', 'low', 'close', 'volume']]
y = df['trend'] # 1 for UP, 0 for DOWN

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save model
model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
joblib.dump(model, model_path)
print(f"Model saved to {model_path}")
