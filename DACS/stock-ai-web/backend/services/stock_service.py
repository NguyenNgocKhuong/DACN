import pandas as pd
import os
from datetime import datetime, timedelta
import random

# Path to CSV data
data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/stock_data.csv'))

def get_all_stocks():
    symbols = [
        ("AAPL", "Apple Inc."), ("VNINDEX", "Chỉ số VN-Index"), ("TSLA", "Tesla Inc."), 
        ("MSFT", "Microsoft Corp"), ("AMZN", "Amazon.com Inc"), ("GOOGL", "Alphabet Inc"),
        ("META", "Meta Platforms"), ("NVDA", "Nvidia Corp"), ("NFLX", "Netflix Inc"),
        ("AMD", "Advanced Micro Devices"), ("INTC", "Intel Corp"), ("VNM", "Vinamilk"),
        ("VIC", "Vingroup JSC"), ("FPT", "FPT Corp"), ("HPG", "Hòa Phát Group"),
        ("VCB", "Vietcombank"), ("SSI", "Chứng khoán SSI"), ("MWG", "Thế Giới Di Động"),
        ("VPB", "Víet Nam Prosperity Bank"), ("TCB", "Techcombank"),
        ("VHM", "Vinhomes JSC"), ("GAS", "PV GAS"), ("SAB", "Sabeco"), 
        ("BID", "BIDV Bank"), ("STB", "Sacombank"), ("VIB", "VIB Bank"),
        ("VJC", "Vietjet Air"), ("HVN", "Vietnam Airlines"), ("PNJ", "Phu Nhuan Jewelry"),
        ("HSG", "Hoa Sen Group"), ("NKG", "Nam Kim Steel"), ("COIN", "Coinbase"),
        ("VND", "VNDIRECT"), ("SHB", "SHB Bank")
    ]
    
    df = None
    if os.path.exists(data_path):
        try:
            df = pd.read_csv(data_path)
        except:
            pass

    result = []
    for sym, name in symbols:
        # Default fallback values
        price = round(random.uniform(100, 500), 2)
        trend = random.choice(["up", "down"])
        
        if df is not None:
            try:
                sym_data = df[df['symbol'] == sym]
                if not sym_data.empty:
                    latest = sym_data.iloc[-1]
                    price = float(latest['close'])
                    trend = "up" if int(latest['trend']) == 1 else "down"
            except:
                pass # Use fallback if row processing fails

        result.append({
            "symbol": sym,
            "name": name,
            "price": price,
            "trend": trend,
            "buys": random.randint(5000, 100000),
            "sells": random.randint(5000, 100000),
            "date": datetime.now().strftime("%d/%m/%Y")
        })
    return result

def get_stock_by_symbol(symbol):
    history = []
    base_stock = None
    
    if os.path.exists(data_path):
        try:
            df = pd.read_csv(data_path)
            sym_data = df[df['symbol'].str.upper() == symbol.upper()]
            
            if not sym_data.empty:
                for _, row in sym_data.iterrows():
                    raw_date = str(row['date'])
                    try:
                        formatted_date = datetime.strptime(raw_date, "%Y-%m-%d").strftime("%d/%m/%Y")
                    except:
                        formatted_date = raw_date
                        
                    history.append({
                        "date": formatted_date,
                        "time": "14:45",
                        "action": "KẾT PHIÊN",
                        "price": row['close'],
                        "volume": row['volume'],
                        "investor": "Thị trường"
                    })
                
                latest = sym_data.iloc[-1]
                base_stock = {
                    "symbol": symbol.upper(),
                    "name": "Dữ liệu thực từ CSV",
                    "price": latest['close'],
                    "trend": "up" if latest['trend'] == 1 else "down",
                    "buys": random.randint(5000, 50000),
                    "sells": random.randint(5000, 50000),
                    "date": datetime.now().strftime("%d/%m/%Y"),
                    "history": history
                }
        except Exception as e:
            print(f"Error reading CSV in stock_service: {e}")

    if not base_stock:
        base_stock = {
            "symbol": symbol.upper(),
            "name": "Cổ phiếu niêm yết AI (Giả lập)",
            "price": round(random.uniform(50, 500), 2),
            "trend": random.choice(["up", "down"]),
            "buys": random.randint(5000, 50000),
            "sells": random.randint(5000, 50000),
            "date": datetime.now().strftime("%d/%m/%Y"),
            "history": []
        }
        
    return base_stock
