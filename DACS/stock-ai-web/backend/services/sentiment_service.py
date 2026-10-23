from transformers import pipeline
import pandas as pd
import os

# Initialize sentiment analysis pipeline
try:
    sentiment_analyzer = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")
except Exception as e:
    print(f"Error loading sentiment model: {e}")
    sentiment_analyzer = None

def get_sentiment_score(text):
    if not sentiment_analyzer:
        return 0.0
    try:
        result = sentiment_analyzer(text)[0]
        label = result['label']
        stars = int(label.split()[0])
        return (stars - 3) / 2
    except:
        return 0.0

def analyze_market_comments(csv_path):
    if not os.path.exists(csv_path):
        return None
    df = pd.read_csv(csv_path)
    if 'sentiment' not in df.columns:
        df['sentiment'] = df['comment'].apply(get_sentiment_score)
        df.to_csv(csv_path, index=False)
    return df
