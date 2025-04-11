import React, { useState } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface BudgetSummaryProps {
  budgetBreakdown: any;
  totalCost: number;
  currency: string;
  localCurrencyCode?: string;
  localCurrencyRate?: number;
  localCurrencyTotalCost?: number;
  localCurrencyCostsBreakdown?: { [key: string]: number };
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ 
  budgetBreakdown, 
  totalCost, 
  currency,
  localCurrencyCode,
  localCurrencyRate,
  localCurrencyTotalCost,
  localCurrencyCostsBreakdown
}) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [showLocalCurrency, setShowLocalCurrency] = useState<boolean>(
    Boolean(localCurrencyCode && localCurrencyCode !== 'USD' && localCurrencyRate && localCurrencyTotalCost)
  );
  
  if (!budgetBreakdown || !totalCost) {
    return null;
  }

  // Only include space costs for chart data
  // First, get the fitout cost
  const fitoutCost = budgetBreakdown['FITOUT COSTS'] || totalCost;
  
  // Create chart data only for space allocations (not including total fitout)
  let chartData = Object.entries(budgetBreakdown)
    .filter(([key, value]) => {
      // Only include space allocations (not the fitout total)
      return (
        key.startsWith('SPACE:') && 
        typeof value === 'number' && 
        value > 0
      );
    })
    .map(([key, value]) => ({
      name: key.replace('SPACE:', ''),
      value: value as number,
      percentage: ((value as number) / fitoutCost) * 100
    }))
    .sort((a, b) => b.value - a.value);
    
  // If no space allocation data is found, create a default allocation
  if (chartData.length === 0) {
    chartData = [
      { name: 'Team Workspace', value: fitoutCost * 0.5, percentage: 50 },
      { name: 'Team Meeting Area', value: fitoutCost * 0.2, percentage: 20 },
      { name: 'Shared Meeting Rooms', value: fitoutCost * 0.15, percentage: 15 },
      { name: 'Social Area', value: fitoutCost * 0.1, percentage: 10 },
      { name: 'Support/Ancillary', value: fitoutCost * 0.05, percentage: 5 }
    ];
  }
  
  // Colors for the chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">Space Allocation Breakdown</h3>
        <div className="flex space-x-2">
          <button
            type="button"
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              chartType === 'pie' 
                ? 'bg-primary text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setChartType('pie')}
          >
            Pie Chart
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              chartType === 'bar' 
                ? 'bg-primary text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setChartType('bar')}
          >
            Bar Chart
          </button>
          
          {/* Currency toggle button - only show if local currency is available */}
          {localCurrencyCode && localCurrencyCode !== currency && localCurrencyRate && localCurrencyTotalCost && (
            <button
              type="button"
              className={`px-3 py-1 text-xs font-medium rounded-md ml-2 ${
                showLocalCurrency 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-blue-600 text-white'
              }`}
              onClick={() => setShowLocalCurrency((prev) => !prev)}
            >
              {showLocalCurrency ? localCurrencyCode : currency}
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white p-4 border rounded-lg">
        <div className="h-80">
          {chartType === 'pie' ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => {
                    if (localCurrencyCode && localCurrencyCode !== 'USD' && localCurrencyRate) {
                      const localValue = value * localCurrencyRate;
                      return [
                        `${formatCurrency(value, currency)} / ${formatCurrency(localValue, localCurrencyCode)}`,
                        ''
                      ];
                    }
                    return [formatCurrency(value, currency), ''];
                  }} 
                  separator=": "
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => {
                    return formatCurrency(value, currency, { notation: 'compact' });
                  }} 
                />
                <Tooltip 
                  formatter={(value: number) => {
                    if (localCurrencyCode && localCurrencyCode !== 'USD' && localCurrencyRate) {
                      const localValue = value * localCurrencyRate;
                      return [
                        `${formatCurrency(value, currency)} / ${formatCurrency(localValue, localCurrencyCode)}`,
                        ''
                      ];
                    }
                    return [formatCurrency(value, currency), ''];
                  }} 
                  separator=": "
                />
                <Legend />
                <Bar dataKey="value" fill="#0d47a1" name={`Cost (${currency} / ${localCurrencyCode || currency})`} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between mb-2">
          <h4 className="font-medium text-gray-700">Fitout Cost Details</h4>
          {localCurrencyCode && localCurrencyCode !== currency && localCurrencyRate && (
            <div className="text-sm text-gray-600">
              Exchange Rate: <span className="font-semibold">1 USD = {localCurrencyRate.toFixed(4)} {localCurrencyCode}</span>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount (USD)
                </th>
                {localCurrencyCode && localCurrencyCode !== 'USD' && localCurrencyRate && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount ({localCurrencyCode})
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Display space allocation breakdown */}
              {chartData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                    {formatCurrency(item.value, currency)}
                  </td>
                  {localCurrencyCode && localCurrencyCode !== 'USD' && localCurrencyRate && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                      {formatCurrency(item.value * localCurrencyRate, localCurrencyCode)}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {item.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
              {/* Total row as FITOUT COSTS */}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  FITOUT COSTS
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right font-mono">
                  {formatCurrency(fitoutCost, currency)}
                </td>
                {localCurrencyCode && localCurrencyCode !== 'USD' && localCurrencyRate && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right font-mono">
                    {formatCurrency(localCurrencyTotalCost || fitoutCost * (localCurrencyRate || 1), localCurrencyCode)}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                  100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BudgetSummary;
