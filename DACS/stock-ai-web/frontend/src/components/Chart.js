import React from 'react';
import TradingViewChart from './TradingViewChart';

const Chart = ({ symbol, history = [] }) => {
  return <TradingViewChart symbol={symbol} history={history} />;
};

export default Chart;
