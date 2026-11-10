import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  LineSeries,
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineStyle
} from 'lightweight-charts';

const BacktestEquityChart = ({ equityCurve = [], summary = {} }) => {
  const chartContainerRef = useRef(null);
  const drawdownContainerRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    if (!chartContainerRef.current || !equityCurve || equityCurve.length === 0) return;

    // Chuẩn hóa và làm sạch dữ liệu chuỗi thời gian (sắp xếp tăng dần theo ngày và loại bỏ ngày trùng lặp)
    const seenDates = new Set();
    const cleanCurve = [];

    equityCurve.forEach(pt => {
      if (pt && pt.date && !seenDates.has(pt.date)) {
        seenDates.add(pt.date);
        cleanCurve.push(pt);
      }
    });

    cleanCurve.sort((a, b) => (a.date > b.date ? 1 : -1));

    if (cleanCurve.length === 0) return;

    // 1. KHỞI TẠO BIỂU ĐỒ ĐƯỜNG VỐN CHÍNH (EQUITY CURVE)
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 360,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#90a4ae',
        fontFamily: 'Inter, sans-serif',
        fontSize: 12
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(0, 242, 254, 0.4)',
          width: 1,
          style: LineStyle.Dashed
        },
        horzLine: {
          color: 'rgba(0, 242, 254, 0.4)',
          width: 1,
          style: LineStyle.Dashed
        }
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.1 }
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false
      }
    });

    // Đường vốn Chiến lược AI (Area Series Gradient Xanh Cyan)
    const strategySeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(0, 242, 254, 0.35)',
      bottomColor: 'rgba(0, 242, 254, 0.01)',
      lineColor: '#00f2fe',
      lineWidth: 2,
      priceFormat: {
        type: 'volume',
        precision: 0
      }
    });

    // Đường vốn Đối chuẩn Benchmark (Line Series Vàng Hổ Phách Nét đứt)
    const benchmarkSeries = chart.addSeries(LineSeries, {
      color: '#ffb300',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      priceFormat: {
        type: 'volume',
        precision: 0
      }
    });

    const strategyData = cleanCurve.map(pt => ({
      time: pt.date,
      value: pt.equity
    }));

    const benchmarkData = cleanCurve.map(pt => ({
      time: pt.date,
      value: pt.benchmark_equity
    }));

    strategySeries.setData(strategyData);
    benchmarkSeries.setData(benchmarkData);

    // 2. KHỞI TẠO BIỂU ĐỒ SỤT GIẢM VỐN (DRAWDOWN UNDERWATER SUBCHART)
    let drawdownChart = null;
    if (drawdownContainerRef.current) {
      drawdownChart = createChart(drawdownContainerRef.current, {
        width: drawdownContainerRef.current.clientWidth,
        height: 140,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#90a4ae',
          fontFamily: 'Inter, sans-serif',
          fontSize: 11
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.04)' }
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          scaleMargins: { top: 0.05, bottom: 0.1 }
        },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          visible: true
        }
      });

      const ddSeries = drawdownChart.addSeries(AreaSeries, {
        topColor: 'rgba(255, 82, 82, 0.02)',
        bottomColor: 'rgba(255, 82, 82, 0.45)',
        lineColor: '#ff5252',
        lineWidth: 1.5,
        priceFormat: {
          type: 'custom',
          formatter: price => `${price.toFixed(1)}%`
        }
      });

      const ddData = cleanCurve.map(pt => ({
        time: pt.date,
        value: pt.drawdown_pct
      }));
      ddSeries.setData(ddData);

      // Đồng bộ TimeScale giữa 2 biểu đồ
      chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range && drawdownChart) {
          drawdownChart.timeScale().setVisibleLogicalRange(range);
        }
      });
      drawdownChart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (range && chart) {
          chart.timeScale().setVisibleLogicalRange(range);
        }
      });
    }

    // 3. THEO DÕI SỰ KIỆN CROSSHAIR HOVER
    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData) {
        setHoveredPoint(null);
        return;
      }
      const stratVal = param.seriesData.get(strategySeries);
      const benchVal = param.seriesData.get(benchmarkSeries);
      const foundPt = cleanCurve.find(p => p.date === param.time);

      if (foundPt) {
        setHoveredPoint({
          date: param.time,
          equity: stratVal ? stratVal.value : foundPt.equity,
          benchmark: benchVal ? benchVal.value : foundPt.benchmark_equity,
          drawdown: foundPt.drawdown_pct,
          inPosition: foundPt.in_position,
          closePrice: foundPt.close_price
        });
      }
    });

    chart.timeScale().fitContent();
    if (drawdownChart) {
      drawdownChart.timeScale().fitContent();
    }

    // 4. XỬ LÝ RESPONSIVE RESIZE
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
      if (drawdownContainerRef.current && drawdownChart) {
        drawdownChart.applyOptions({ width: drawdownContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      if (drawdownChart) {
        drawdownChart.remove();
      }
    };
  }, [equityCurve]);

  // Format currency
  const formatVND = val => {
    if (val === undefined || val === null) return '0 đ';
    return Math.round(val).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {/* Thanh trạng thái Tooltip khi rà chuột */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <span style={{ color: '#90a4ae' }}>Phiên: </span>
            <span style={{ fontWeight: 600, color: '#fff' }}>
              {hoveredPoint ? hoveredPoint.date : (cleanDate(summary.period) || 'Toàn chu kỳ')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00f2fe', display: 'inline-block' }}></span>
            <span style={{ color: '#00f2fe', fontWeight: 600 }}>Chiến lược AI: </span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>
              {hoveredPoint ? formatVND(hoveredPoint.equity) : formatVND(summary.final_capital)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffb300', display: 'inline-block' }}></span>
            <span style={{ color: '#ffb300', fontWeight: 600 }}>Buy & Hold: </span>
            <span style={{ color: '#fff' }}>
              {hoveredPoint ? formatVND(hoveredPoint.benchmark) : formatVND(summary.initial_capital * (1 + (summary.benchmark_return_pct || 0) / 100))}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <span style={{ color: '#90a4ae' }}>Sụt giảm vốn (Drawdown): </span>
            <span style={{
              color: (hoveredPoint ? hoveredPoint.drawdown : summary.max_drawdown_pct) < -10 ? '#ff5252' : '#ffb300',
              fontWeight: 'bold'
            }}>
              {hoveredPoint ? `${hoveredPoint.drawdown}%` : `${summary.max_drawdown_pct}%`}
            </span>
          </div>

          {hoveredPoint && (
            <div style={{
              padding: '2px 8px',
              borderRadius: '6px',
              background: hoveredPoint.inPosition ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 255, 255, 0.1)',
              color: hoveredPoint.inPosition ? '#00e676' : '#b0bec5',
              fontWeight: 600,
              fontSize: '0.75rem'
            }}>
              {hoveredPoint.inPosition ? '🟢 ĐANG NẮM GIỮ CP' : '⚪ TIỀN MẶT'}
            </div>
          )}
        </div>
      </div>

      {/* Vùng vẽ biểu đồ đường vốn chính */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '16px',
          zIndex: 10,
          display: 'flex',
          gap: '12px',
          fontSize: '0.75rem',
          pointerEvents: 'none'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#00f2fe' }}>
            <span style={{ display: 'inline-block', width: '14px', height: '2px', background: '#00f2fe' }}></span>
            Vốn Tài Khoản AI
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ffb300' }}>
            <span style={{ display: 'inline-block', width: '14px', height: '2px', borderTop: '2px dashed #ffb300' }}></span>
            Buy & Hold Đối Chuẩn
          </span>
        </div>
        <div ref={chartContainerRef} style={{ width: '100%', height: '360px' }} />
      </div>

      {/* Vùng vẽ biểu đồ Underwater Drawdown */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
        <div style={{ fontSize: '0.8rem', color: '#90a4ae', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
          <span>📉 Biểu đồ Mức sụt giảm vốn từ đỉnh (Underwater Drawdown Curve %)</span>
          <span style={{ color: '#ff5252', fontWeight: 600 }}>Max Drawdown: {summary.max_drawdown_pct}%</span>
        </div>
        <div ref={drawdownContainerRef} style={{ width: '100%', height: '140px' }} />
      </div>
    </div>
  );
};

const cleanDate = period => {
  if (!period) return '';
  return period;
};

export default BacktestEquityChart;

