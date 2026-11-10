import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
import sys
import unittest
import numpy as np
import pandas as pd

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import app
from database.db import db_session
from models.stock_model import BacktestExperiment
from services.backtest_engine import BacktestEngine

class TestBacktestingEngine(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = app.test_client()

    def test_01_engine_initialization(self):
        """Kiểm tra khởi tạo BacktestEngine với các tham số định lượng mặc định"""
        engine = BacktestEngine(symbol="VCB", initial_capital=100000000.0)
        self.assertEqual(engine.symbol, "VCB")
        self.assertEqual(engine.initial_capital, 100000000.0)
        self.assertEqual(engine.commission_rate, 0.0015)
        self.assertEqual(engine.strategy_name, "AI_TRANSFORMER_ATR")

    def test_02_load_data(self):
        """Kiểm tra khả năng tải dữ liệu nến lịch sử và chỉ báo kỹ thuật liên kết"""
        engine = BacktestEngine(symbol="VCB")
        df = engine.load_historical_data()
        self.assertFalse(df.empty)
        self.assertGreaterEqual(len(df), 20)
        for col in ["date", "open", "high", "low", "close", "volume", "rsi_14", "atr_14"]:
            self.assertIn(col, df.columns)

    def test_03_ai_signals_generation(self):
        """Kiểm tra sinh tín hiệu AI dự báo và xác suất xu hướng (không rò rỉ dữ liệu)"""
        engine = BacktestEngine(symbol="VCB")
        df = engine.load_historical_data()
        df_sig = engine.generate_ai_signals(df)
        self.assertIn("ai_trend", df_sig.columns)
        self.assertIn("ai_prob", df_sig.columns)
        self.assertTrue(all(p >= 0.0 and p <= 1.0 for p in df_sig["ai_prob"]))
        self.assertTrue(all(t in ["UP", "DOWN"] for t in df_sig["ai_trend"]))

    def test_04_simulation_execution_and_metrics(self):
        """Kiểm tra thực thi mô phỏng định lượng và các công thức chỉ số tài chính"""
        engine = BacktestEngine(
            symbol="VCB",
            strategy_name="AI_TRANSFORMER_ATR",
            initial_capital=100000000.0,
            stop_loss_pct=5.0,
            take_profit_pct=10.0
        )
        res = engine.execute_simulation()
        self.assertEqual(res["status"], "success")
        
        summary = res["summary"]
        self.assertIn("total_return_pct", summary)
        self.assertIn("benchmark_return_pct", summary)
        self.assertIn("alpha_pct", summary)
        self.assertIn("sharpe_ratio", summary)
        self.assertIn("sortino_ratio", summary)
        self.assertIn("max_drawdown_pct", summary)
        self.assertIn("win_rate_pct", summary)
        self.assertIn("profit_factor", summary)
        
        # Max Drawdown phải luôn <= 0
        self.assertLessEqual(summary["max_drawdown_pct"], 0.0)
        # Win Rate trong khoảng [0, 100]
        self.assertTrue(0.0 <= summary["win_rate_pct"] <= 100.0)
        
        # Kiểm tra đường vốn (Equity curve)
        self.assertGreater(len(res["equity_curve"]), 0)
        self.assertAlmostEqual(res["equity_curve"][0]["equity"], 100000000.0, delta=300000.0)

    def test_05_api_endpoints(self):
        """Kiểm tra toàn bộ REST APIs kiểm thử chiến lược"""
        # Presets
        r_presets = self.client.get("/api/stocks/backtest/presets")
        self.assertEqual(r_presets.status_code, 200)
        presets = r_presets.get_json()
        self.assertIsInstance(presets, list)
        self.assertGreater(len(presets), 0)

        # Run Backtest
        r_run = self.client.post("/api/stocks/backtest/run", json={
            "symbol": "VCB",
            "strategy_name": "AI_TRANSFORMER_ATR",
            "initial_capital": 50000000.0,
            "stop_loss_pct": 5.0,
            "take_profit_pct": 10.0
        })
        self.assertEqual(r_run.status_code, 200)
        data = r_run.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIsNotNone(data["experiment_id"])

        # Results History
        r_results = self.client.get("/api/stocks/backtest/results?limit=5")
        self.assertEqual(r_results.status_code, 200)
        results = r_results.get_json()
        self.assertIsInstance(results, list)
        self.assertGreater(len(results), 0)

if __name__ == '__main__':
    unittest.main()
