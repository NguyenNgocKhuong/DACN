import joblib
import pandas as pd
import os

model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')

def predict(new_data):
    if not os.path.exists(model_path):
        print("Model not found. Please run train.py first.")
        return None
    
    model = joblib.load(model_path)
    df = pd.DataFrame([new_data], columns=['open', 'high', 'low', 'close', 'volume'])
    prediction = model.predict(df)
    return "UP" if prediction[0] == 1 else "DOWN"

if __name__ == "__main__":
    # Test run
    sample_data = {'open': 150.0, 'high': 155.0, 'low': 149.0, 'close': 154.0, 'volume': 1000000}
    print("Prediction:", predict(sample_data))
