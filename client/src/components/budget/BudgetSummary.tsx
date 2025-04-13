import React, { useState } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface BudgetSummaryProps {
  budgetBreakdown: any;
  totalCost: number;
  currency: string;
  scope?: string;
  fitoutCost?: number | null;
  furnitureCost?: number | null;
  specification?: string;
  fitoutSpecification?: string | null;
  furnitureSpecification?: string | null;
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ 
  budgetBreakdown, 
  totalCost, 
  currency,
  scope = 'Fitout',
  fitoutCost,
  furnitureCost,
  specification,
  fitoutSpecification,
  furnitureSpecification
}) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  
  if (!budgetBreakdown || !totalCost) {
    return null;
  }

  // Get the breakdown costs
  const calculatedFitoutCost = fitoutCost || budgetBreakdown['FITOUT COSTS'] || 
    (scope === 'Fitout' ? totalCost : 0);
    
  const calculatedFurnitureCost = furnitureCost || budgetBreakdown['FURNITURE COSTS'] || 
    (scope === 'Furniture' ? totalCost : 0);
  
  // Format the scope for display
  const formattedScope = scope === 'Both' 
    ? 'Complete Package (Fitout & Furniture)' 
    : scope === 'Fitout' 
      ? 'Fitout Only' 
      : 'Furniture Only';
  
  // Format the specifications for display
  let specificationDisplay = specification || '';
  
  if (scope === 'Both' && fitoutSpecification && furnitureSpecification) {
    specificationDisplay = `Fitout: ${fitoutSpecification}, Furniture: ${furnitureSpecification}`;
  }
  
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
      percentage: ((value as number) / calculatedFitoutCost) * 100
    }))
    .sort((a, b) => b.value - a.value);
    
  // If no space allocation data is found, create a default allocation
  if (chartData.length === 0 && calculatedFitoutCost > 0) {
    chartData = [
      { name: 'Team Workspace', value: calculatedFitoutCost * 0.5, percentage: 50 },
      { name: 'Team Meeting Area', value: calculatedFitoutCost * 0.2, percentage: 20 },
      { name: 'Shared Meeting Rooms', value: calculatedFitoutCost * 0.15, percentage: 15 },
      { name: 'Social Area', value: calculatedFitoutCost * 0.1, percentage: 10 },
      { name: 'Support/Ancillary', value: calculatedFitoutCost * 0.05, percentage: 5 }
    ];
  }
  
  // Colors for the chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

  return (
    <div>
      {/* Budget Configuration Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Project Details</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            {budgetBreakdown.projectName && (
              <>
                <dt className="text-sm font-medium text-gray-500">Project Name:</dt>
                <dd className="text-sm text-gray-900">{budgetBreakdown.projectName}</dd>
              </>
            )}
            {budgetBreakdown.location && (
              <>
                <dt className="text-sm font-medium text-gray-500">Location:</dt>
                <dd className="text-sm text-gray-900">{budgetBreakdown.location}</dd>
              </>
            )}
            {budgetBreakdown.totalArea && (
              <>
                <dt className="text-sm font-medium text-gray-500">Total Area:</dt>
                <dd className="text-sm text-gray-900">
                  {budgetBreakdown.totalArea} {budgetBreakdown.areaUnit || 'sqft'}
                </dd>
              </>
            )}
            <dt className="text-sm font-medium text-gray-500">Currency:</dt>
            <dd className="text-sm text-gray-900">{currency}</dd>
            {budgetBreakdown.inflationRate !== undefined && (
              <>
                <dt className="text-sm font-medium text-gray-500">Inflation Rate:</dt>
                <dd className="text-sm text-gray-900">{budgetBreakdown.inflationRate}%</dd>
              </>
            )}
          </dl>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Budget Configuration</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <dt className="text-sm font-medium text-gray-500">Specification Level:</dt>
            <dd className="text-sm text-gray-900">{specificationDisplay}</dd>
            
            {budgetBreakdown.layoutType && (
              <>
                <dt className="text-sm font-medium text-gray-500">Layout Type:</dt>
                <dd className="text-sm text-gray-900">{budgetBreakdown.layoutType}</dd>
              </>
            )}
            
            {budgetBreakdown.spaceTypes && (
              <>
                <dt className="text-sm font-medium text-gray-500">Space Types:</dt>
                <dd className="text-sm text-gray-900">{budgetBreakdown.spaceTypes}</dd>
              </>
            )}
            
            <dt className="text-sm font-medium text-gray-500">Budget Scope:</dt>
            <dd className="text-sm text-gray-900">{formattedScope}</dd>
            
            {budgetBreakdown.baseUnitCost && (
              <>
                <dt className="text-sm font-medium text-gray-500">Base Unit Cost:</dt>
                <dd className="text-sm text-gray-900">{formatCurrency(budgetBreakdown.baseUnitCost, currency)}/{budgetBreakdown.areaUnit || 'sqft'}</dd>
              </>
            )}
            
            {budgetBreakdown.adjustedUnitCost && (
              <>
                <dt className="text-sm font-medium text-gray-500">Adjusted Unit Cost:</dt>
                <dd className="text-sm text-gray-900">{formatCurrency(budgetBreakdown.adjustedUnitCost, currency)}/{budgetBreakdown.areaUnit || 'sqft'}</dd>
              </>
            )}
            
            <dt className="text-sm font-medium text-gray-500">Final Rate:</dt>
            <dd className="text-sm text-gray-900">
              {formatCurrency(totalCost / (budgetBreakdown.totalArea || 1), currency)}/{budgetBreakdown.areaUnit || 'sqft'}
            </dd>
          </dl>
        </div>
      </div>

      {/* Budget Cost Breakdown */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Budget Cost Summary</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount ({currency})
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Display different rows based on scope */}
              {scope === 'Both' && (
                <>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Fitout Costs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                      {formatCurrency(calculatedFitoutCost, currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {((calculatedFitoutCost / totalCost) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Furniture Costs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                      {formatCurrency(calculatedFurnitureCost, currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {((calculatedFurnitureCost / totalCost) * 100).toFixed(1)}%
                    </td>
                  </tr>
                </>
              )}
              
              {/* Always show total row */}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  TOTAL BUDGET
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

      {/* Only show space allocation if we have fitout costs */}
      {(scope === 'Fitout' || scope === 'Both') && calculatedFitoutCost > 0 && (
        <>
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
                      formatter={(value: number) => [formatCurrency(value, currency), '']} 
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
                      formatter={(value: number) => [formatCurrency(value, currency), '']} 
                      separator=": "
                    />
                    <Legend />
                    <Bar dataKey="value" fill="#0d47a1" name={`Cost (${currency})`} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
          {/* Space Allocation Breakdown */}
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <h4 className="font-medium text-gray-700">Space Allocation Details</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Space Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount (USD)
                    </th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {item.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {/* Total row for space allocation */}
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      TOTAL FITOUT COST
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right font-mono">
                      {formatCurrency(calculatedFitoutCost, currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                      100%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BudgetSummary;