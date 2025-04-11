import React, { useState } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface BudgetSummaryProps {
  budgetBreakdown: any;
  totalCost: number;
  currency: string;
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ budgetBreakdown, totalCost, currency }) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  
  if (!budgetBreakdown || !totalCost) {
    return null;
  }

  // Process data for charts
  const chartData = Object.entries(budgetBreakdown)
    .filter(([_, value]) => typeof value === 'number' && value > 0)
    .map(([key, value]) => ({
      name: key,
      value: value as number,
      percentage: ((value as number) / totalCost) * 100
    }))
    .sort((a, b) => b.value - a.value);
  
  // Colors for the chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">Budget Breakdown</h3>
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
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, currency)} 
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
                  tickFormatter={(value) => formatCurrency(value, currency, { notation: 'compact' })} 
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value, currency)} 
                  separator=": "
                />
                <Legend />
                <Bar dataKey="value" fill="#0d47a1" name="Cost" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
      <div className="mt-6">
        <h4 className="font-medium text-gray-700 mb-2">Detailed Breakdown</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                    {formatCurrency(item.value, currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {item.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  Total
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right font-mono">
                  {formatCurrency(totalCost, currency)}
                </td>
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
