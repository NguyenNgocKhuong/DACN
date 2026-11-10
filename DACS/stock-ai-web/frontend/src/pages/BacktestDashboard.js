import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getBacktestPresets, runBacktest, getBacktestResults } from '../services/api';
import BacktestEquityChart from '../components/BacktestEquityChart';

const AVAILABLE_SYMBOLS = [
  { symbol: 'VCB', name: 'Vietcombank', market: 'HOSE' },
  { symbol: 'FPT', name: 'Tập đoàn FPT', market: 'HOSE' },
  { symbol: 'HPG', name: 'Tập đoàn Hòa Phát', market: 'HOSE' },
  { symbol: 'VIC', name: 'Tập đoàn Vingroup', market: 'HOSE' },
  { symbol: 'VHM', name: 'Vinhomes', market: 'HOSE' },
  { symbol: 'MWG', name: 'Thế Giới Di Động', market: 'HOSE' },
  { symbol: 'AAPL', name: 'Apple Inc.', market: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', market: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', market: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', market: 'NASDAQ' }
];

const BacktestDashboard = () => {
  const [searchParams] = useSearchParams();
  const initialSym = searchParams.get('symbol') || 'VCB';

  // Config States
  const [symbol, setSymbol] = useState(initialSym.toUpperCase());
  const [strategyName, setStrategyName] = useState('AI_TRANSFORMER_ATR');
  const [initialCapital, setInitialCapital] = useState(100000000);
  const [stopLossPct, setStopLossPct] = useState(5.0);
  const [takeProfitPct, setTakeProfitPct] = useState(10.0);
  const [aiConfidenceThresh, setAiConfidenceThresh] = useState(0.55);
  const [useAtrStops, setUseAtrStops] = useState(true);

  // Data States
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'trades' | 'history'
  const [tradeFilter, setTradeFilter] = useState('ALL'); // 'ALL' | 'WIN' | 'LOSS'
  const [backtestResult, setBacktestResult] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Tải Presets và Lịch sử khi mount
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [presetsRes, historyRes] = await Promise.all([
          getBacktestPresets(),
          getBacktestResults()
        ]);
        if (presetsRes.data) setPresets(presetsRes.data);
        if (historyRes.data) setHistoryList(historyRes.data);
      } catch (err) {
        console.error('Error fetching init backtest data:', err);
      }
    };
    fetchInit();
  }, []);

  // 2. Chạy backtest mặc định khi mở trang
  useEffect(() => {
    handleRunBacktest();
  }, [symbol]);

  // Áp dụng Preset
  const handleApplyPreset = (p) => {
    setStrategyName(p.strategy_name);
    setStopLossPct(p.stop_loss_pct);
    setTakeProfitPct(p.take_profit_pct);
    setAiConfidenceThresh(p.ai_confidence_thresh);
    setUseAtrStops(p.use_atr_stops);
    if (p.recommended_symbols && p.recommended_symbols.length > 0) {
      if (!p.recommended_symbols.includes(symbol)) {
        setSymbol(p.recommended_symbols[0]);
      }
    }
  };

  // Kích hoạt chạy Backtest
  const handleRunBacktest = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const payload = {
        symbol,
        strategy_name: strategyName,
        initial_capital: parseFloat(initialCapital),
        stop_loss_pct: parseFloat(stopLossPct),
        take_profit_pct: parseFloat(takeProfitPct),
        ai_confidence_thresh: parseFloat(aiConfidenceThresh),
        use_atr_stops: useAtrStops
      };

      const res = await runBacktest(payload);
      if (res.data && res.data.status === 'success') {
        setBacktestResult(res.data);
        // Refresh history
        const histRes = await getBacktestResults();
        if (histRes.data) setHistoryList(histRes.data);
      } else {
        setErrorMsg(res.data?.message || 'Không thể thực thi mô phỏng.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi kết nối tới máy chủ kiểm thử.');
    } finally {
      setLoading(false);
    }
  };

  const summary = backtestResult?.summary;
  const trades = backtestResult?.trades || [];
  const equityCurve = backtestResult?.equity_curve || [];

  const filteredTrades = trades.filter(t => {
    if (tradeFilter === 'WIN') return t.net_pnl > 0;
    if (tradeFilter === 'LOSS') return t.net_pnl <= 0;
    return true;
  });

  const formatVND = (val) => {
    if (val === undefined || val === null) return '0 đ';
    return Math.round(val).toLocaleString('vi-VN') + ' đ';
  };

  const getSharpeBadge = (sh) => {
    if (sh >= 1.5) return { text: 'Xuất sắc (> 1.5)', color: '#00e676', bg: 'rgba(0, 230, 118, 0.15)' };
    if (sh >= 1.0) return { text: 'Tốt (> 1.0)', color: '#00f2fe', bg: 'rgba(0, 242, 254, 0.15)' };
    if (sh >= 0.5) return { text: 'Chấp nhận được', color: '#ffb300', bg: 'rgba(255, 179, 0, 0.15)' };
    return { text: 'Rủi ro cao', color: '#ff5252', bg: 'rgba(255, 82, 82, 0.15)' };
  };

  const getExitReasonBadge = (reason) => {
    switch (reason) {
      case 'TAKE_PROFIT':
        return { label: '🎯 CHỐT LỜI (TP)', color: '#00e676', bg: 'rgba(0, 230, 118, 0.15)' };
      case 'STOP_LOSS':
        return { label: '🛑 CẮT LỖ (SL)', color: '#ff5252', bg: 'rgba(255, 82, 82, 0.15)' };
      case 'AI_SIGNAL_REVERSAL':
        return { label: '🔄 ĐẢO CHIỀU AI', color: '#4facfe', bg: 'rgba(79, 172, 254, 0.15)' };
      case 'MOMENTUM_WEAKNESS':
        return { label: '📉 SUY YẾU ĐỘNG LƯỢNG', color: '#ffb300', bg: 'rgba(255, 179, 0, 0.15)' };
      case 'PERIOD_END':
        return { label: '⏱ KẾT THÚC KỲ', color: '#b0bec5', bg: 'rgba(176, 190, 197, 0.15)' };
      default:
        return { label: reason, color: '#fff', bg: 'rgba(255, 255, 255, 0.1)' };
    }
  };

  return (
    <div className="fade-in" style={{ padding: '20px 0 50px 0', minHeight: '85vh' }}>
      {/* 1. Header Banner */}
      <div className="glass" style={{
        padding: '25px',
        marginBottom: '25px',
        borderLeft: '4px solid #00f2fe',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
            color: '#000',
            fontWeight: 800,
            fontSize: '0.75rem',
            padding: '3px 10px',
            borderRadius: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Hệ Thống Lượng Tử Định Lượng
          </span>
          <span style={{
            background: 'rgba(0, 230, 118, 0.15)',
            color: '#00e676',
            fontWeight: 600,
            fontSize: '0.75rem',
            padding: '3px 10px',
            borderRadius: '20px',
            border: '1px solid rgba(0, 230, 118, 0.3)'
          }}>
            Chu kỳ T+2.5 Chuẩn HOSE
          </span>
          <span style={{
            background: 'rgba(255, 179, 0, 0.15)',
            color: '#ffb300',
            fontWeight: 600,
            fontSize: '0.75rem',
            padding: '3px 10px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 179, 0, 0.3)'
          }}>
            Quản trị rủi ro ATR
          </span>
        </div>

        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>📈</span> Động Cơ Kiểm Thử Chiến Lược Định Lượng (Backtesting Engine)
        </h1>
        <p style={{ margin: 0, color: '#90a4ae', fontSize: '0.95rem', lineHeight: '1.5' }}>
          Mô phỏng giao dịch lịch sử theo từng phiên nến (Walk-Forward Event-Driven) nhằm đánh giá định lượng tỷ suất sinh lời Alpha, 
          tỷ số Sharpe, mức sụt giảm vốn tối đa (Max Drawdown) và tỷ lệ thắng của Mô hình AI Transformer trước khi đưa vào ứng dụng thực tế.
        </p>
      </div>

      {/* 2. Preset Kịch Bản Mẫu */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '0.85rem', color: '#90a4ae', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          💡 Chọn Nhanh Kịch Bản Chiến Lược Định Lượng:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {presets.map(p => (
            <div
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              style={{
                padding: '14px',
                borderRadius: '12px',
                background: strategyName === p.strategy_name ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: strategyName === p.strategy_name ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#00f2fe'}
              onMouseOut={e => {
                if (strategyName !== p.strategy_name) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, color: strategyName === p.strategy_name ? '#00f2fe' : '#fff', fontSize: '0.95rem' }}>
                  {p.name}
                </span>
                {strategyName === p.strategy_name && (
                  <span style={{ fontSize: '0.75rem', background: '#00f2fe', color: '#000', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                    Đang chọn
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#90a4ae', lineHeight: '1.4' }}>
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bảng Cấu Hình Tham Số Mô Phỏng */}
      <div className="glass" style={{ padding: '20px', marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚙️</span> Thiết Lập Tham Số Chiến Lược (Quant Parameters)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          {/* Symbol */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#90a4ae', marginBottom: '6px' }}>Mã Cổ Phiếu</label>
            <select
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(20, 25, 35, 0.9)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600
              }}
            >
              {AVAILABLE_SYMBOLS.map(s => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} - {s.name} ({s.market})
                </option>
              ))}
            </select>
          </div>

          {/* Strategy Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#90a4ae', marginBottom: '6px' }}>Loại Chiến Lược</label>
            <select
              value={strategyName}
              onChange={e => setStrategyName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(20, 25, 35, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            >
              <option value="AI_TRANSFORMER_ATR">AI Transformer + Dynamic ATR</option>
              <option value="AI_MOMENTUM_RSI">AI Multi-factor + MACD/RSI</option>
              <option value="BUY_AND_HOLD">Buy & Hold Benchmark</option>
            </select>
          </div>

          {/* Initial Capital */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#90a4ae', marginBottom: '6px' }}>Vốn Khởi Điểm (VND)</label>
            <input
              type="number"
              value={initialCapital}
              step="10000000"
              onChange={e => setInitialCapital(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(20, 25, 35, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#00f2fe',
                fontSize: '0.95rem',
                fontWeight: 600
              }}
            />
          </div>

          {/* Stop Loss % */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#90a4ae', marginBottom: '6px' }}>
              Ngưỡng Cắt Lỗ (%): <strong style={{ color: '#ff5252' }}>-{stopLossPct}%</strong>
            </label>
            <input
              type="range"
              min="2"
              max="15"
              step="0.5"
              value={stopLossPct}
              onChange={e => setStopLossPct(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#ff5252' }}
            />
          </div>

          {/* Take Profit % */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#90a4ae', marginBottom: '6px' }}>
              Ngưỡng Chốt Lời (%): <strong style={{ color: '#00e676' }}>+{takeProfitPct}%</strong>
            </label>
            <input
              type="range"
              min="4"
              max="30"
              step="1"
              value={takeProfitPct}
              onChange={e => setTakeProfitPct(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#00e676' }}
            />
          </div>

          {/* AI Confidence Threshold */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#90a4ae', marginBottom: '6px' }}>
              Độ Tin Cậy AI (Min Prob): <strong style={{ color: '#00f2fe' }}>{(aiConfidenceThresh * 100).toFixed(0)}%</strong>
            </label>
            <input
              type="range"
              min="0.45"
              max="0.80"
              step="0.05"
              value={aiConfidenceThresh}
              onChange={e => setAiConfidenceThresh(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#00f2fe' }}
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#b0bec5', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useAtrStops}
                onChange={e => setUseAtrStops(e.target.checked)}
                style={{ accentColor: '#00f2fe' }}
              />
              Bật Chốt lời/Cắt lỗ động theo ATR
            </label>

            <button
              onClick={handleRunBacktest}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 18px',
                background: loading ? '#546e7a' : 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
                color: '#000',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.2s'
              }}
              onMouseOver={e => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {loading ? (
                <><span>⏳</span> Đang mô phỏng...</>
              ) : (
                <><span>🚀</span> Chạy Kiểm Thử</>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            marginTop: '15px',
            padding: '12px',
            background: 'rgba(255, 82, 82, 0.15)',
            border: '1px solid #ff5252',
            borderRadius: '8px',
            color: '#ff5252',
            fontSize: '0.9rem'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      {/* 4. Thống Kê Chỉ Số Hiệu Suất Định Lượng (KPI Cards) */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '15px',
          marginBottom: '25px'
        }}>
          {/* Card 1: Total Return vs Benchmark */}
          <div className="glass" style={{ padding: '18px', borderLeft: '4px solid #00f2fe' }}>
            <div style={{ fontSize: '0.8rem', color: '#90a4ae', textTransform: 'uppercase', marginBottom: '6px' }}>
              Tỷ Suất Lợi Nhuận
            </div>
            <div style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: summary.total_return_pct >= 0 ? '#00e676' : '#ff5252',
              marginBottom: '4px'
            }}>
              {summary.total_return_pct >= 0 ? `+${summary.total_return_pct}%` : `${summary.total_return_pct}%`}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#b0bec5', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div>Buy & Hold: <strong style={{ color: '#ffb300' }}>{summary.benchmark_return_pct}%</strong></div>
              <div>Alpha vượt trội: <strong style={{ color: summary.alpha_pct >= 0 ? '#00e676' : '#ff5252' }}>
                {summary.alpha_pct >= 0 ? `+${summary.alpha_pct}%` : `${summary.alpha_pct}%`}
              </strong></div>
            </div>
          </div>

          {/* Card 2: Sharpe Ratio */}
          <div className="glass" style={{ padding: '18px', borderLeft: '4px solid #00e676' }}>
            <div style={{ fontSize: '0.8rem', color: '#90a4ae', textTransform: 'uppercase', marginBottom: '6px' }}>
              Tỷ Số Sharpe (Rf = 5%)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00f2fe', marginBottom: '4px' }}>
              {summary.sharpe_ratio}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              {(() => {
                const b = getSharpeBadge(summary.sharpe_ratio);
                return (
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: b.bg, color: b.color, fontWeight: 600 }}>
                    {b.text}
                  </span>
                );
              })()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#90a4ae' }}>
              Sortino Ratio: <strong style={{ color: '#fff' }}>{summary.sortino_ratio}</strong>
            </div>
          </div>

          {/* Card 3: Max Drawdown */}
          <div className="glass" style={{ padding: '18px', borderLeft: '4px solid #ff5252' }}>
            <div style={{ fontSize: '0.8rem', color: '#90a4ae', textTransform: 'uppercase', marginBottom: '6px' }}>
              Sụt Giảm Vốn Tối Đa (MDD)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ff5252', marginBottom: '4px' }}>
              {summary.max_drawdown_pct}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#90a4ae' }}>
              {summary.max_drawdown_pct > -15 ? '🟢 Mức độ kiểm soát rủi ro an toàn' : '🟡 Rủi ro biến động danh mục cần chú ý'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#b0bec5', marginTop: '4px' }}>
              Vốn cuối kỳ: <strong style={{ color: '#fff' }}>{formatVND(summary.final_capital)}</strong>
            </div>
          </div>

          {/* Card 4: Win Rate & Profit Factor */}
          <div className="glass" style={{ padding: '18px', borderLeft: '4px solid #ffb300' }}>
            <div style={{ fontSize: '0.8rem', color: '#90a4ae', textTransform: 'uppercase', marginBottom: '6px' }}>
              Tỷ Lệ Thắng (Win Rate)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
              {summary.win_rate_pct}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#b0bec5', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div>Thắng: <strong style={{ color: '#00e676' }}>{summary.winning_trades}</strong> / Thua: <strong style={{ color: '#ff5252' }}>{summary.losing_trades}</strong></div>
              <div>Hệ số sinh lời (Profit Factor): <strong style={{ color: '#ffb300' }}>{summary.profit_factor}</strong></div>
            </div>
          </div>

          {/* Card 5: Trading Stats */}
          <div className="glass" style={{ padding: '18px', borderLeft: '4px solid #b0bec5' }}>
            <div style={{ fontSize: '0.8rem', color: '#90a4ae', textTransform: 'uppercase', marginBottom: '6px' }}>
              Hoạt Động Khớp Lệnh
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
              {summary.total_trades} <span style={{ fontSize: '0.9rem', color: '#90a4ae', fontWeight: 400 }}>lệnh</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#b0bec5', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div>Thời gian giữ TB: <strong style={{ color: '#fff' }}>{summary.avg_holding_days} phiên</strong></div>
              <div>Phí giao dịch sàn: <strong style={{ color: '#90a4ae' }}>{formatVND(summary.commission_paid)}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Khối Tabs Điều Hướng Chi Tiết */}
      <div className="glass" style={{ padding: '20px', minHeight: '500px' }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('chart')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'chart' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
              color: activeTab === 'chart' ? '#00f2fe' : '#90a4ae',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📈 Biểu Đồ Tăng Trưởng Vốn (Equity Curve)
          </button>

          <button
            onClick={() => setActiveTab('trades')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'trades' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
              color: activeTab === 'trades' ? '#00f2fe' : '#90a4ae',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📑 Nhật Ký Lệnh Giao Dịch ({trades.length})
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'history' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
              color: activeTab === 'history' ? '#00f2fe' : '#90a4ae',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📜 Lịch Sử Thí Nghiệm Đã Lưu ({historyList.length})
          </button>
        </div>

        {/* TAB 1: Biểu đồ đường vốn */}
        {activeTab === 'chart' && (
          <div>
            {equityCurve.length > 0 ? (
              <BacktestEquityChart equityCurve={equityCurve} summary={summary || {}} />
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#90a4ae' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📊</span>
                Chưa có dữ liệu biểu đồ. Hãy bấm "Chạy Kiểm Thử" ở trên để sinh kết quả.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Nhật ký lệnh chi tiết */}
        {activeTab === 'trades' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setTradeFilter('ALL')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: tradeFilter === 'ALL' ? '#00f2fe' : 'rgba(255, 255, 255, 0.05)',
                    color: tradeFilter === 'ALL' ? '#000' : '#fff',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Tất cả ({trades.length})
                </button>
                <button
                  onClick={() => setTradeFilter('WIN')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 230, 118, 0.3)',
                    background: tradeFilter === 'WIN' ? '#00e676' : 'rgba(0, 230, 118, 0.1)',
                    color: tradeFilter === 'WIN' ? '#000' : '#00e676',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Lệnh Lãi ({summary?.winning_trades || 0})
                </button>
                <button
                  onClick={() => setTradeFilter('LOSS')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 82, 82, 0.3)',
                    background: tradeFilter === 'LOSS' ? '#ff5252' : 'rgba(255, 82, 82, 0.1)',
                    color: tradeFilter === 'LOSS' ? '#fff' : '#ff5252',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Lệnh Lỗ ({summary?.losing_trades || 0})
                </button>
              </div>

              <span style={{ fontSize: '0.85rem', color: '#90a4ae' }}>
                Khấu trừ phí giao dịch: <strong>0.15%</strong> mỗi chiều
              </span>
            </div>

            {filteredTrades.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#90a4ae' }}>
                Không có giao dịch nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#90a4ae' }}>
                      <th style={{ padding: '10px 8px' }}>#</th>
                      <th style={{ padding: '10px 8px' }}>Mã</th>
                      <th style={{ padding: '10px 8px' }}>Ngày Mua</th>
                      <th style={{ padding: '10px 8px' }}>Giá Mua</th>
                      <th style={{ padding: '10px 8px' }}>Ngày Bán</th>
                      <th style={{ padding: '10px 8px' }}>Giá Bán</th>
                      <th style={{ padding: '10px 8px' }}>Khối Lượng</th>
                      <th style={{ padding: '10px 8px' }}>Lãi/Lỗ Ròng</th>
                      <th style={{ padding: '10px 8px' }}>Tỷ Suất %</th>
                      <th style={{ padding: '10px 8px' }}>Lý Do Đóng Lệnh</th>
                      <th style={{ padding: '10px 8px' }}>Nắm Giữ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.map(t => {
                      const badge = getExitReasonBadge(t.exit_reason);
                      return (
                        <tr
                          key={t.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '10px 8px', color: '#90a4ae' }}>{t.id}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 700, color: '#00f2fe' }}>{t.symbol}</td>
                          <td style={{ padding: '10px 8px', color: '#b0bec5' }}>{t.entry_date}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 600 }}>{formatVND(t.entry_price)}</td>
                          <td style={{ padding: '10px 8px', color: '#b0bec5' }}>{t.exit_date}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 600 }}>{formatVND(t.exit_price)}</td>
                          <td style={{ padding: '10px 8px', color: '#fff' }}>{t.shares?.toLocaleString()} CP</td>
                          <td style={{
                            padding: '10px 8px',
                            fontWeight: 700,
                            color: t.net_pnl > 0 ? '#00e676' : '#ff5252'
                          }}>
                            {t.net_pnl > 0 ? `+${formatVND(t.net_pnl)}` : formatVND(t.net_pnl)}
                          </td>
                          <td style={{
                            padding: '10px 8px',
                            fontWeight: 700,
                            color: t.return_pct > 0 ? '#00e676' : '#ff5252'
                          }}>
                            {t.return_pct > 0 ? `+${t.return_pct}%` : `${t.return_pct}%`}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: badge.bg,
                              color: badge.color,
                              fontWeight: 700,
                              whiteSpace: 'nowrap'
                            }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', color: '#90a4ae' }}>{t.holding_days} phiên</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Lịch sử thí nghiệm trong cơ sở dữ liệu */}
        {activeTab === 'history' && (
          <div>
            <div style={{ marginBottom: '15px', color: '#90a4ae', fontSize: '0.85rem' }}>
              Danh sách các phiên kiểm thử định lượng đã thực thi và lưu trữ trong bảng CSDL <code>backtest_experiments</code>:
            </div>

            {historyList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#90a4ae' }}>
                Chưa có lịch sử thí nghiệm nào được lưu.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#90a4ae' }}>
                      <th style={{ padding: '10px 8px' }}>#ID</th>
                      <th style={{ padding: '10px 8px' }}>Chiến Lược</th>
                      <th style={{ padding: '10px 8px' }}>Mã</th>
                      <th style={{ padding: '10px 8px' }}>Chu Kỳ</th>
                      <th style={{ padding: '10px 8px' }}>Lợi Nhuận %</th>
                      <th style={{ padding: '10px 8px' }}>Benchmark %</th>
                      <th style={{ padding: '10px 8px' }}>Sharpe Ratio</th>
                      <th style={{ padding: '10px 8px' }}>Max Drawdown</th>
                      <th style={{ padding: '10px 8px' }}>Win Rate %</th>
                      <th style={{ padding: '10px 8px' }}>Số Lệnh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map(h => (
                      <tr
                        key={h.id}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
                      >
                        <td style={{ padding: '10px 8px', color: '#90a4ae' }}>#{h.id}</td>
                        <td style={{ padding: '10px 8px', fontWeight: 600, color: '#fff' }}>{h.strategy_name}</td>
                        <td style={{ padding: '10px 8px', fontWeight: 700, color: '#00f2fe' }}>{h.symbol}</td>
                        <td style={{ padding: '10px 8px', color: '#b0bec5', fontSize: '0.78rem' }}>{h.period}</td>
                        <td style={{
                          padding: '10px 8px',
                          fontWeight: 700,
                          color: h.total_return_pct >= 0 ? '#00e676' : '#ff5252'
                        }}>
                          {h.total_return_pct >= 0 ? `+${h.total_return_pct}%` : `${h.total_return_pct}%`}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#ffb300' }}>{h.benchmark_return_pct}%</td>
                        <td style={{ padding: '10px 8px', color: '#00f2fe', fontWeight: 600 }}>{h.sharpe_ratio}</td>
                        <td style={{ padding: '10px 8px', color: '#ff5252', fontWeight: 600 }}>{h.max_drawdown_pct}%</td>
                        <td style={{ padding: '10px 8px', color: '#fff' }}>{h.win_rate_pct}%</td>
                        <td style={{ padding: '10px 8px', color: '#90a4ae' }}>{h.total_trades}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BacktestDashboard;
