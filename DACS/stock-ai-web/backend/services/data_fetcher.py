import yfinance as yf
import pandas as pd
import os
from datetime import datetime, timedelta

# Path to CSV
data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/stock_data.csv'))

def update_stock_data():
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}")
        return
        
    df = pd.read_csv(data_path)
    
    symbol_map = {
        "AAPL": "AAPL", "MSFT": "MSFT", "GOOGL": "GOOGL", "AMZN": "AMZN", "META": "META",
        "TSLA": "TSLA", "NVDA": "NVDA", "NFLX": "NFLX", "AMD": "AMD", "INTC": "INTC",
        "COIN": "COIN", "VNINDEX": "^VNINDEX",
        "VNM": "VNM.VN", "FPT": "FPT.VN", "VIC": "VIC.VN", "HPG": "HPG.VN",
        "VCB": "VCB.VN", "SSI": "SSI.VN", "MWG": "MWG.VN", "VPB": "VPB.VN",
        "TCB": "TCB.VN", "VHM": "VHM.VN", "GAS": "GAS.VN", "SAB": "SAB.VN",
        "BID": "BID.VN", "STB": "STB.VN", "VIB": "VIB.VN", "VJC": "VJC.VN",
        "HVN": "HVN.VN", "PNJ": "PNJ.VN", "HSG": "HSG.VN", "NKG": "NKG.VN",
        "VND": "VND.VN", "SHB": "SHB.VN"
    }
    
    # Get all Yahoo symbols
    yf_symbols = list(symbol_map.values())
    
    print(f"Fetching latest data for {len(yf_symbols)} symbols...")
    try:
        # Download last 7 days of data for all symbols at once (very fast)
        all_data = yf.download(yf_symbols, period="7d", group_by='ticker', progress=False)
        
        updated = False
        for local_sym, yf_sym in symbol_map.items():
            try:
                # Handle single or multi-index result from yfinance
                if len(yf_symbols) > 1:
                    ticker_data = all_data[yf_sym]
                else:
                    ticker_data = all_data
                    
                if ticker_data.empty: continue
                
                for date, row in ticker_data.iterrows():
                    if pd.isna(row['Close']): continue
                    
                    date_str = date.strftime("%Y-%m-%d")
                    # Chia 1000 cho các mã chứng khoán Việt Nam để đồng bộ đơn vị (nghìn đồng)
                    scale = 1000.0 if yf_sym.endswith('.VN') else 1.0
                    
                    new_row = {
                        "date": date_str,
                        "symbol": local_sym,
                        "open": round(float(row['Open']) / scale, 2),
                        "high": round(float(row['High']) / scale, 2),
                        "low": round(float(row['Low']) / scale, 2),
                        "close": round(float(row['Close']) / scale, 2),
                        "volume": int(row['Volume']),
                        "trend": 1 if row['Close'] >= row['Open'] else 0
                    }
                    
                    # Check if already exists
                    exists = ((df['date'] == new_row['date']) & (df['symbol'] == local_sym)).any()
                    if not exists:
                        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
                        updated = True
            except Exception as e:
                print(f"Error processing {local_sym}: {e}")
                
        if updated:
            df = df.sort_values(by=['symbol', 'date'])
            df.to_csv(data_path, index=False)
            print("Stock data updated successfully!")
        else:
            print("Data is already up to date.")
    except Exception as e:
        print(f"Bulk fetch failed: {e}")

if __name__ == "__main__":
    update_stock_data()
