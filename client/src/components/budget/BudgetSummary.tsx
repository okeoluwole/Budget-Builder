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

  // Get the breakdown costs with improved fallback handling and logging
  console.log("BudgetSummary received props:", { 
    totalCost, 
    fitoutCost, 
    furnitureCost, 
    scope,
    breakdown: budgetBreakdown
  });
  
  // More explicit fallback logic with better default values
  const calculatedFitoutCost = (fitoutCost !== undefined && fitoutCost !== null) 
    ? fitoutCost 
    : (budgetBreakdown && budgetBreakdown['FITOUT COSTS'] !== undefined) 
      ? budgetBreakdown['FITOUT COSTS'] 
      : (scope === 'Fitout' || scope === 'Both') ? totalCost : 0;
    
  const calculatedFurnitureCost = (furnitureCost !== undefined && furnitureCost !== null)
    ? furnitureCost 
    : (budgetBreakdown && budgetBreakdown['FURNITURE COSTS'] !== undefined) 
      ? budgetBreakdown['FURNITURE COSTS'] 
      : (scope === 'Furniture' || scope === 'Both') ? totalCost : 0;
      
  console.log("Calculated costs:", {
    calculatedFitoutCost,
    calculatedFurnitureCost,
    totalCost
  });
  
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
  
  // Determine which cost value to use as the basis for space allocation
  const baseCostForAllocation = 
    scope === 'Fitout' ? calculatedFitoutCost :
    scope === 'Furniture' ? calculatedFurnitureCost :
    calculatedFitoutCost; // For 'Both', we'll use fitout as the primary allocation basis
  
  // Create chart data for space allocations
  let chartData = Object.entries(budgetBreakdown)
    .filter(([key, value]) => {
      // Only include space allocations (not the total costs)
      return (
        key.startsWith('SPACE:') && 
        typeof value === 'number' && 
        value > 0
      );
    })
    .map(([key, value]) => ({
      name: key.replace('SPACE:', ''),
      value: value as number,
      percentage: ((value as number) / (baseCostForAllocation || 1)) * 100
    }))
    .sort((a, b) => b.value - a.value);
    
  // If no space allocation data is found, create a default allocation
  if (chartData.length === 0) {
    const defaultPercentages = [
      { name: 'Team Workspace', percentage: 50 },
      { name: 'Team Meeting Area', percentage: 20 },
      { name: 'Shared Meeting Rooms', percentage: 15 },
      { name: 'Social Area', percentage: 10 },
      { name: 'Support/Ancillary', percentage: 5 }
    ];
    
    if (scope === 'Fitout' && calculatedFitoutCost > 0) {
      chartData = defaultPercentages.map(item => ({
        ...item,
        value: calculatedFitoutCost * (item.percentage / 100)
      }));
    } 
    else if (scope === 'Furniture' && calculatedFurnitureCost > 0) {
      chartData = defaultPercentages.map(item => ({
        ...item,
        value: calculatedFurnitureCost * (item.percentage / 100)
      }));
    }
    else if (scope === 'Both') {
      // For 'Both' scope, we'll use fitout cost as the basis if available
      const baseCost = calculatedFitoutCost > 0 ? calculatedFitoutCost : calculatedFurnitureCost;
      if (baseCost > 0) {
        chartData = defaultPercentages.map(item => ({
          ...item,
          value: baseCost * (item.percentage / 100)
        }));
      }
    }
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
              {scope === 'Both' && budgetBreakdown.adjustedUnitCost ?
                formatCurrency(budgetBreakdown.adjustedUnitCost, currency) : 
                formatCurrency(totalCost / (budgetBreakdown.totalArea || 1), currency)
              }/{budgetBreakdown.areaUnit || 'sqft'}
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

      {/* Show space allocation if we have any costs to display */}
      {((scope === 'Fitout' && calculatedFitoutCost > 0) || 
         (scope === 'Furniture' && calculatedFurnitureCost > 0) || 
         (scope === 'Both' && (calculatedFitoutCost > 0 || calculatedFurnitureCost > 0))) && (
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
          
          {/* Comprehensive Space Allocation Breakdown */}
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <h4 className="font-medium text-gray-700">Space Allocation Details</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Space Type
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
                  {/* Fitout Allocation Section */}
                  {(scope === 'Fitout' || scope === 'Both') && calculatedFitoutCost > 0 && (
                    <>
                      {/* Section Header for Fitout */}
                      <tr className="bg-gray-100">
                        <td colSpan={4} className="px-6 py-3 text-sm font-semibold text-gray-700">
                          FITOUT ALLOCATION
                        </td>
                      </tr>
                      
                      {/* Fitout Space Allocation Rows */}
                      {chartData.map((item, index) => (
                        <tr key={`fitout-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                            Fitout
                          </td>
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
                      
                      {/* Fitout Subtotal */}
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500">
                          Subtotal
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          TOTAL FITOUT COST
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right font-mono">
                          {formatCurrency(calculatedFitoutCost, currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                          {scope === 'Both' ? ((calculatedFitoutCost / totalCost) * 100).toFixed(1) + '%' : '100%'}
                        </td>
                      </tr>
                    </>
                  )}
                  
                  {/* Furniture Allocation Section */}
                  {(scope === 'Furniture' || scope === 'Both') && calculatedFurnitureCost > 0 && (
                    <>
                      {/* Section Header for Furniture */}
                      <tr className="bg-gray-100">
                        <td colSpan={4} className="px-6 py-3 text-sm font-semibold text-gray-700">
                          FURNITURE ALLOCATION
                        </td>
                      </tr>
                      
                      {/* Furniture Space Allocation Rows */}
                      {(() => {
                        // Create furniture-specific chart data if we're in furniture-only scope
                        // Otherwise, reuse the same distribution as fitout
                        const furnitureChartData = scope === 'Furniture' 
                          ? chartData // Already using furniture as the basis in furniture-only scope
                          : chartData.map(item => ({
                              name: item.name,
                              percentage: item.percentage,
                              value: (item.percentage / 100) * calculatedFurnitureCost
                            }));
                            
                        return furnitureChartData.map((item, index) => (
                          <tr key={`furniture-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                              Furniture
                            </td>
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
                        ));
                      })()}
                      
                      {/* Furniture Subtotal */}
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500">
                          Subtotal
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          TOTAL FURNITURE COST
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right font-mono">
                          {formatCurrency(calculatedFurnitureCost, currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                          {scope === 'Both' ? ((calculatedFurnitureCost / totalCost) * 100).toFixed(1) + '%' : '100%'}
                        </td>
                      </tr>
                    </>
                  )}
                  
                  {/* Grand Total - Only show for scope="Both" */}
                  {scope === 'Both' && (
                    <tr className="bg-primary bg-opacity-10 border-t-2 border-primary">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900" colSpan={2}>
                        TOTAL PROJECT COST
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right font-mono">
                        {formatCurrency(totalCost, currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                        100%
                      </td>
                    </tr>
                  )}
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