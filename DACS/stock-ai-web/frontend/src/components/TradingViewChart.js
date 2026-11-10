import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  CandlestickSeries, 
  LineSeries, 
  HistogramSeries, 
  ColorType, 
  CrosshairMode, 
  LineStyle 
} from 'lightweight-charts';
import { getStockIndicators } from '../services/api';

const TradingViewChart = ({ symbol, history = [] }) => {
  const chartContainerRef = useRef(null);
  const rsiContainerRef = useRef(null);
  const macdContainerRef = useRef(null);

  // States
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('1D'); // '1D', '1W', '1M'
  const [chartType, setChartType] = useState('candle'); // 'candle' | 'line'
  const [showEMA20, setShowEMA20] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showBB, setShowBB] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [subIndicator, setSubIndicator] = useState('RSI'); // 'RSI' | 'MACD' | 'NONE'
  const [hoveredData, setHoveredData] = useState(null);

  // 1. Fetch Dữ liệu chỉ báo kỹ thuật từ Backend API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const res = await getStockIndicators(symbol, 150);
        if (isMounted && res.data && res.data.data && res.data.data.length > 0) {
          // Lọc và sắp xếp theo ngày tăng dần, loại bỏ ngày trùng lặp
          const seen = new Set();
          const clean = res.data.data
            .filter(d => d.date && d.close !== undefined)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .filter(d => {
              if (seen.has(d.date)) return false;
              seen.add(d.date);
              return true;
            });

          setChartData(clean);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("[Chart API Notice] Fallback to history prop:", err);
      }

      // Fallback: Sử dụng history prop nếu API chưa có sẵn
      if (isMounted) {
        if (history && history.length > 0) {
          const fallbackData = history.map(h => {
            const dateStr = h.date ? h.date.split('/').reverse().join('-') : '2026-01-01';
            const price = Number(h.price) || 100;
            return {
              date: dateStr,
              open: price * 0.99,
              high: price * 1.015,
              low: price * 0.985,
              close: price,
              volume: h.volume || 1000000,
              rsi_14: 55,
              ema_20: price,
              ema_50: price * 0.98,
              macd: 0.5,
              macd_signal: 0.3,
              macd_hist: 0.2,
              bb_upper: price * 1.04,
              bb_middle: price,
              bb_lower: price * 0.96
            };
          });
          setChartData(fallbackData);
        } else {
          // Tạo dữ liệu mô phỏng nến nếu chưa có gì
          const sample = [];
          let cur = 150.0;
          for (let i = 30; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const change = (Math.random() - 0.48) * 4;
            const open = cur;
            const close = cur + change;
            const high = Math.max(open, close) + Math.random() * 2;
            const low = Math.min(open, close) - Math.random() * 2;
            cur = close;
            sample.push({
              date: dateStr,
              open: Number(open.toFixed(2)),
              high: Number(high.toFixed(2)),
              low: Number(low.toFixed(2)),
              close: Number(close.toFixed(2)),
              volume: Math.floor(500000 + Math.random() * 1500000),
              rsi_14: Number((45 + Math.random() * 25).toFixed(2)),
              ema_20: Number((close * 0.99).toFixed(2)),
              ema_50: Number((close * 0.97).toFixed(2)),
              macd: Number(((Math.random() - 0.5) * 2).toFixed(2)),
              macd_signal: Number(((Math.random() - 0.5) * 1.5).toFixed(2)),
              macd_hist: Number(((Math.random() - 0.5)).toFixed(2)),
              bb_upper: Number((close * 1.03).toFixed(2)),
              bb_middle: Number(close.toFixed(2)),
              bb_lower: Number((close * 0.97).toFixed(2))
            });
          }
          setChartData(sample);
        }
        setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [symbol, history]);

  // 2. Khởi tạo và cập nhật Biểu đồ TradingView Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    // Thiết lập biểu đồ chính
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1322' },
        textColor: '#90a4ae',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(0, 242, 254, 0.4)', width: 1, style: LineStyle.Dashed },
        horzLine: { color: 'rgba(0, 242, 254, 0.4)', width: 1, style: LineStyle.Dashed }
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.25 }
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false
      },
      width: chartContainerRef.current.clientWidth,
      height: 420
    });

    let mainSeries;
    if (chartType === 'candle') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#00e676',
        downColor: '#ff5252',
        borderVisible: false,
        wickUpColor: '#00e676',
        wickDownColor: '#ff5252'
      });
      mainSeries.setData(chartData.map(d => ({
        time: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close
      })));
    } else {
      mainSeries = chart.addSeries(LineSeries, {
        color: '#00f2fe',
        lineWidth: 3
      });
      mainSeries.setData(chartData.map(d => ({
        time: d.date,
        value: d.close
      })));
    }

    // Volume Series (Overlay dưới chân biểu đồ)
    let volumeSeries = null;
    if (showVolume) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
        priceLineVisible: false
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 }
      });
      volumeSeries.setData(chartData.map(d => ({
        time: d.date,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 82, 82, 0.35)'
      })));
    }

    // EMA 20
    let ema20Series = null;
    if (showEMA20) {
      ema20Series = chart.addSeries(LineSeries, {
        color: '#ffb300',
        lineWidth: 2,
        title: 'EMA 20',
        priceLineVisible: false
      });
      const ema20Data = chartData
        .filter(d => d.ema_20 !== null && d.ema_20 !== undefined)
        .map(d => ({ time: d.date, value: d.ema_20 }));
      ema20Series.setData(ema20Data);
    }

    // EMA 50
    let ema50Series = null;
    if (showEMA50) {
      ema50Series = chart.addSeries(LineSeries, {
        color: '#ba68c8',
        lineWidth: 2,
        title: 'EMA 50',
        priceLineVisible: false
      });
      const ema50Data = chartData
        .filter(d => d.ema_50 !== null && d.ema_50 !== undefined)
        .map(d => ({ time: d.date, value: d.ema_50 }));
      ema50Series.setData(ema50Data);
    }

    // Bollinger Bands
    let bbUpper = null, bbLower = null, bbMid = null;
    if (showBB) {
      bbUpper = chart.addSeries(LineSeries, {
        color: 'rgba(0, 242, 254, 0.6)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'BB Upper',
        priceLineVisible: false
      });
      bbMid = chart.addSeries(LineSeries, {
        color: 'rgba(0, 242, 254, 0.3)',
        lineWidth: 1,
        title: 'BB Mid',
        priceLineVisible: false
      });
      bbLower = chart.addSeries(LineSeries, {
        color: 'rgba(0, 242, 254, 0.6)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'BB Lower',
        priceLineVisible: false
      });

      const bbUpData = chartData.filter(d => d.bb_upper).map(d => ({ time: d.date, value: d.bb_upper }));
      const bbMidData = chartData.filter(d => d.bb_middle).map(d => ({ time: d.date, value: d.bb_middle }));
      const bbLowData = chartData.filter(d => d.bb_lower).map(d => ({ time: d.date, value: d.bb_lower }));
      
      bbUpper.setData(bbUpData);
      bbMid.setData(bbMidData);
      bbLower.setData(bbLowData);
    }

    // Set initial hovered data to latest record
    const latest = chartData[chartData.length - 1];
    setHoveredData(latest);

    // Crosshair hover handler
    chart.subscribeCrosshairMove(param => {
      if (!param || !param.time) {
        setHoveredData(latest);
        return;
      }
      const match = chartData.find(d => d.date === param.time);
      if (match) setHoveredData(match);
    });

    chart.timeScale().fitContent();

    // Auto-resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [chartData, chartType, showEMA20, showEMA50, showBB, showVolume]);

  // 3. Khởi tạo Biểu đồ phụ (Sub-Chart: RSI hoặc MACD)
  useEffect(() => {
    if (chartData.length === 0 || subIndicator === 'NONE') return;

    if (subIndicator === 'RSI' && rsiContainerRef.current) {
      const rsiChart = createChart(rsiContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#0a0e1a' },
          textColor: '#90a4ae',
          fontFamily: "'Inter', sans-serif"
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.03)' }
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          scaleMargins: { top: 0.1, bottom: 0.1 }
        },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          timeVisible: false
        },
        width: rsiContainerRef.current.clientWidth,
        height: 140
      });

      const rsiSeries = rsiChart.addSeries(LineSeries, {
        color: '#e040fb',
        lineWidth: 2,
        title: 'RSI(14)'
      });

      // Vùng Quá mua (70) và Quá bán (30)
      const overbought = rsiChart.addSeries(LineSeries, {
        color: 'rgba(255, 82, 82, 0.5)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false
      });
      const oversold = rsiChart.addSeries(LineSeries, {
        color: 'rgba(0, 230, 118, 0.5)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false
      });

      const rsiData = chartData.filter(d => d.rsi_14 !== null && d.rsi_14 !== undefined).map(d => ({ time: d.date, value: d.rsi_14 }));
      rsiSeries.setData(rsiData);
      overbought.setData(rsiData.map(d => ({ time: d.time, value: 70 })));
      oversold.setData(rsiData.map(d => ({ time: d.time, value: 30 })));

      rsiChart.timeScale().fitContent();

      const handleResizeRsi = () => {
        if (rsiContainerRef.current) {
          rsiChart.applyOptions({ width: rsiContainerRef.current.clientWidth });
        }
      };
      window.addEventListener('resize', handleResizeRsi);

      return () => {
        window.removeEventListener('resize', handleResizeRsi);
        rsiChart.remove();
      };
    }

    if (subIndicator === 'MACD' && macdContainerRef.current) {
      const macdChart = createChart(macdContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#0a0e1a' },
          textColor: '#90a4ae',
          fontFamily: "'Inter', sans-serif"
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.03)' }
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          scaleMargins: { top: 0.15, bottom: 0.15 }
        },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          timeVisible: false
        },
        width: macdContainerRef.current.clientWidth,
        height: 140
      });

      const histSeries = macdChart.addSeries(HistogramSeries, {
        title: 'Hist',
        priceLineVisible: false
      });
      const macdLine = macdChart.addSeries(LineSeries, {
        color: '#00f2fe',
        lineWidth: 2,
        title: 'MACD'
      });
      const signalLine = macdChart.addSeries(LineSeries, {
        color: '#ff9100',
        lineWidth: 1.5,
        title: 'Signal'
      });

      const validMacd = chartData.filter(d => d.macd !== null && d.macd !== undefined);
      macdLine.setData(validMacd.map(d => ({ time: d.date, value: d.macd })));
      signalLine.setData(validMacd.map(d => ({ time: d.date, value: d.macd_signal || 0 })));
      histSeries.setData(validMacd.map(d => ({
        time: d.date,
        value: d.macd_hist || 0,
        color: (d.macd_hist || 0) >= 0 ? '#00e676' : '#ff5252'
      })));

      macdChart.timeScale().fitContent();

      const handleResizeMacd = () => {
        if (macdContainerRef.current) {
          macdChart.applyOptions({ width: macdContainerRef.current.clientWidth });
        }
      };
      window.addEventListener('resize', handleResizeMacd);

      return () => {
        window.removeEventListener('resize', handleResizeMacd);
        macdChart.remove();
      };
    }
  }, [chartData, subIndicator]);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* 1. TOP TOOLBAR & CONTROLS */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 18px',
        background: 'rgba(13, 19, 34, 0.85)',
        borderRadius: '12px 12px 0 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Nhóm chuyển loại biểu đồ & khung thời gian */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setChartType('candle')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: chartType === 'candle' ? '1px solid #00f2fe' : '1px solid rgba(255,255,255,0.1)',
              background: chartType === 'candle' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
              color: chartType === 'candle' ? '#00f2fe' : '#90a4ae',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            🕯️ Nến Nhật
          </button>
          <button
            onClick={() => setChartType('line')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: chartType === 'line' ? '1px solid #00f2fe' : '1px solid rgba(255,255,255,0.1)',
              background: chartType === 'line' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
              color: chartType === 'line' ? '#00f2fe' : '#90a4ae',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            📈 Đường
          </button>

          <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>|</span>

          {['1D', '1W', '1M'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                background: timeframe === tf ? 'rgba(255, 179, 0, 0.2)' : 'transparent',
                color: timeframe === tf ? '#ffb300' : '#90a4ae',
                cursor: 'pointer',
                fontWeight: timeframe === tf ? 'bold' : 'normal',
                fontSize: '0.85rem'
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Nhóm bật/tắt Chỉ báo Kỹ thuật */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ffb300', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showEMA20} onChange={e => setShowEMA20(e.target.checked)} />
            EMA 20
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ba68c8', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showEMA50} onChange={e => setShowEMA50(e.target.checked)} />
            EMA 50
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#00f2fe', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showBB} onChange={e => setShowBB(e.target.checked)} />
            Bollinger Bands
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#00e676', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={showVolume} onChange={e => setShowVolume(e.target.checked)} />
            Volume
          </label>
        </div>

        {/* Nhóm Sub-indicator Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#90a4ae', fontSize: '0.8rem', marginRight: '4px' }}>Chỉ báo dao động:</span>
          {['RSI', 'MACD', 'NONE'].map(sub => (
            <button
              key={sub}
              onClick={() => setSubIndicator(sub)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: subIndicator === sub ? '1px solid rgba(0, 242, 254, 0.6)' : '1px solid rgba(255,255,255,0.06)',
                background: subIndicator === sub ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255,255,255,0.02)',
                color: subIndicator === sub ? '#00f2fe' : '#90a4ae',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              {sub === 'NONE' ? 'Ẩn' : sub}
            </button>
          ))}
        </div>
      </div>

      {/* 2. OHLCV LIVE INSPECTION BANNER (Hiển thị thông số nến khi hover) */}
      {hoveredData && (
        <div style={{
          display: 'flex',
          gap: '18px',
          alignItems: 'center',
          padding: '8px 18px',
          background: 'rgba(13, 19, 34, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.85rem',
          color: '#b0bec5',
          flexWrap: 'wrap'
        }}>
          <span>📅 <strong style={{ color: '#fff' }}>{hoveredData.date}</strong></span>
          <span>Mở: <strong style={{ color: hoveredData.close >= hoveredData.open ? '#00e676' : '#ff5252' }}>${hoveredData.open?.toFixed(2)}</strong></span>
          <span>Cao: <strong style={{ color: '#00e676' }}>${hoveredData.high?.toFixed(2)}</strong></span>
          <span>Thấp: <strong style={{ color: '#ff5252' }}>${hoveredData.low?.toFixed(2)}</strong></span>
          <span>Đóng: <strong style={{ color: hoveredData.close >= hoveredData.open ? '#00e676' : '#ff5252' }}>${hoveredData.close?.toFixed(2)}</strong></span>
          <span>KL: <strong style={{ color: '#ffb300' }}>{Number(hoveredData.volume).toLocaleString()}</strong></span>
          {hoveredData.rsi_14 !== undefined && (
            <span>RSI: <strong style={{ color: '#e040fb' }}>{hoveredData.rsi_14?.toFixed(1)}</strong></span>
          )}
          {hoveredData.macd !== undefined && (
            <span>MACD: <strong style={{ color: '#00f2fe' }}>{hoveredData.macd?.toFixed(2)}</strong></span>
          )}
        </div>
      )}

      {/* 3. MAIN TRADINGVIEW CANDLESTICK CHART */}
      <div 
        ref={chartContainerRef} 
        style={{ 
          width: '100%', 
          height: '420px', 
          position: 'relative',
          background: '#0d1322'
        }}
      >
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(11, 15, 25, 0.7)',
            zIndex: 10,
            color: '#00f2fe',
            fontWeight: 600
          }}>
            ⏳ Đang tải dữ liệu biểu đồ nến TradingView {symbol}...
          </div>
        )}
      </div>

      {/* 4. SUB-CHART (RSI hoặc MACD) */}
      {subIndicator === 'RSI' && (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: '#0a0e1a' }}>
          <div style={{ padding: '6px 18px', fontSize: '0.75rem', color: '#e040fb', fontWeight: 'bold' }}>
            📊 RSI (14) — [Vùng quá mua: 70 / Quá bán: 30]
          </div>
          <div ref={rsiContainerRef} style={{ width: '100%', height: '140px' }} />
        </div>
      )}

      {subIndicator === 'MACD' && (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: '#0a0e1a' }}>
          <div style={{ padding: '6px 18px', fontSize: '0.75rem', color: '#00f2fe', fontWeight: 'bold' }}>
            ⚡ MACD (12, 26, 9) — [Đường MACD: Xanh lơ / Tín hiệu: Cam / Cột động lượng: Đỏ-Xanh]
          </div>
          <div ref={macdContainerRef} style={{ width: '100%', height: '140px' }} />
        </div>
      )}

      {/* FOOTER CAPTION */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 18px',
        background: 'rgba(13, 19, 34, 0.95)',
        borderRadius: '0 0 12px 12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '0.75rem',
        color: '#78909c'
      }}>
        <span>Hệ thống biểu đồ tương tác thời gian thực — Powered by <strong>TradingView Lightweight Charts v5</strong></span>
        <span>Phóng to/Thu nhỏ bằng con lăn chuột · Kéo trục giá để co giãn biên độ</span>
      </div>
    </div>
  );
};

export default TradingViewChart;

