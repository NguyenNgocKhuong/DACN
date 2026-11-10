import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from services.backtest_engine import BacktestEngine

symbols = ['VCB', 'FPT', 'HPG', 'VIC', 'AAPL', 'NVDA', 'MSFT', 'TSLA']
results = []

print("=== BANG KET QUA THUC NGHIEM DINH LUONG CHIEN LUOC AI (TUAN 7) ===")
header = f"{'MA':5s} | {'CHIEN LUOC':20s} | {'LOI NHUAN':10s} | {'BUY-HOLD':10s} | {'ALPHA':8s} | {'SHARPE':7s} | {'SORTINO':7s} | {'MDD':8s} | {'WIN RATE':8s} | {'PROFIT FACTOR':13s} | {'LE NH':5s}"
print(header)
print("-" * len(header))

for sym in symbols:
    engine = BacktestEngine(
        symbol=sym,
        strategy_name='AI_TRANSFORMER_ATR',
        initial_capital=100000000.0,
        commission_rate=0.0015,
        stop_loss_pct=5.0,
        take_profit_pct=10.0,
        ai_confidence_thresh=0.55,
        use_atr_stops=True
    )
    res = engine.execute_simulation()
    if res['status'] == 'success':
        s = res['summary']
        results.append(s)
        ret_str = f"{s['total_return_pct']:+.2f}%"
        bh_str = f"{s['benchmark_return_pct']:+.2f}%"
        alpha_str = f"{s['alpha_pct']:+.2f}%"
        mdd_str = f"{s['max_drawdown_pct']:.2f}%"
        wr_str = f"{s['win_rate_pct']:.1f}%"
        pf_str = f"{s['profit_factor']:.2f}"
        line = f"{s['symbol']:5s} | {s['strategy_name']:20s} | {ret_str:>10s} | {bh_str:>10s} | {alpha_str:>8s} | {s['sharpe_ratio']:7.2f} | {s['sortino_ratio']:7.2f} | {mdd_str:>8s} | {wr_str:>8s} | {pf_str:>13s} | {s['total_trades']:5d}"
        print(line)

print("=" * len(header))

