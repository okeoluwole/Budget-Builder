import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { MultiSourceBudget } from '@/utils/componentMapping';

interface MultiSourceComparisonProps {
  comparison: MultiSourceBudget;
  currency: string;
  area: number;
  areaUnit: string;
}

const MultiSourceComparison: React.FC<MultiSourceComparisonProps> = ({
  comparison,
  currency,
  area,
  areaUnit
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRate = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getVarianceColor = (variance: number) => {
    const absVariance = Math.abs(variance);
    if (absVariance <= 5) return 'text-green-600';
    if (absVariance <= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="w-4 h-4" />;
    if (variance < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            Multi-Source Budget Comparison Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {comparison.comparison.percentageVariance.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Variance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(Math.min(comparison.tt.total, comparison.cbre.total))}
              </div>
              <div className="text-sm text-gray-600">Lower Estimate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(Math.max(comparison.tt.total, comparison.cbre.total))}
              </div>
              <div className="text-sm text-gray-600">Higher Estimate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Source Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Data Source Notice:</strong> CBRE calculations use supplemented data. 
          Construction & Furniture from CBRE Global Fit-Out Cost Guide, 
          Audio-Visual & Professional Fees from Turner & Townsend Guide (temporary).
        </AlertDescription>
      </Alert>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Component-by-Component Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Component</th>
                  <th className="text-right py-3 px-4">T&T Guide</th>
                  <th className="text-right py-3 px-4">CBRE Guide*</th>
                  <th className="text-right py-3 px-4">Variance</th>
                  <th className="text-right py-3 px-4">% Diff</th>
                  <th className="text-center py-3 px-4">Data Source</th>
                </tr>
              </thead>
              <tbody>
                {comparison.tt.components.map((ttComponent, index) => {
                  const cbreComponent = comparison.cbre.components.find(c => 
                    c.component === ttComponent.component ||
                    (ttComponent.component === 'Loose Furniture' && c.component === 'Furniture') ||
                    (ttComponent.component === 'Construction' && c.component === 'Construction')
                  );

                  if (!cbreComponent) return null;

                  const variance = cbreComponent.cost - ttComponent.cost;
                  const percentageVariance = (Math.abs(variance) / Math.min(ttComponent.cost, cbreComponent.cost)) * 100;
                  const reliableComparison = cbreComponent.dataSource === 'CBRE';

                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">
                        {ttComponent.component}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div>{formatCurrency(ttComponent.cost)}</div>
                        <div className="text-xs text-gray-500">
                          {formatRate(ttComponent.rate)}/{areaUnit}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div>{formatCurrency(cbreComponent.cost)}</div>
                        <div className="text-xs text-gray-500">
                          {formatRate(cbreComponent.rate)}/{areaUnit}
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-right ${getVarianceColor(percentageVariance)}`}>
                        <div className="flex items-center justify-end gap-1">
                          {getVarianceIcon(variance)}
                          {formatCurrency(Math.abs(variance))}
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${getVarianceColor(percentageVariance)}`}>
                        {reliableComparison ? `±${percentageVariance.toFixed(1)}%` : '0%**'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={cbreComponent.dataSource === 'CBRE' ? 'default' : 'secondary'}>
                          {cbreComponent.dataSource === 'CBRE' ? 'CBRE' : 'T&T*'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Total Row */}
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td className="py-4 px-4 font-bold">TOTAL PROJECT COST</td>
                  <td className="py-4 px-4 text-right font-bold">
                    <div>{formatCurrency(comparison.tt.total)}</div>
                    <div className="text-xs text-gray-500">
                      {formatRate(comparison.tt.costPerSqm)}/{areaUnit}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-bold">
                    <div>{formatCurrency(comparison.cbre.total)}</div>
                    <div className="text-xs text-gray-500">
                      {formatRate(comparison.cbre.costPerSqm)}/{areaUnit}
                    </div>
                  </td>
                  <td className={`py-4 px-4 text-right font-bold ${getVarianceColor(comparison.comparison.percentageVariance)}`}>
                    <div className="flex items-center justify-end gap-1">
                      {getVarianceIcon(comparison.comparison.totalVariance)}
                      {formatCurrency(comparison.comparison.totalVariance)}
                    </div>
                  </td>
                  <td className={`py-4 px-4 text-right font-bold ${getVarianceColor(comparison.comparison.percentageVariance)}`}>
                    ±{comparison.comparison.percentageVariance.toFixed(1)}%
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Badge variant="outline">Mixed</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-2 text-xs text-gray-600">
            <div>* CBRE estimate uses mixed data sources</div>
            <div>** Same data source used - no variance expected</div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Comparison Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Key Findings</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Overall variance: {comparison.comparison.percentageVariance.toFixed(1)}% between sources</li>
                <li>• {comparison.tt.total < comparison.cbre.total ? 'T&T' : 'CBRE'} provides lower estimate ({formatCurrency(Math.min(comparison.tt.total, comparison.cbre.total))})</li>
                <li>• {comparison.tt.total > comparison.cbre.total ? 'T&T' : 'CBRE'} provides higher estimate ({formatCurrency(Math.max(comparison.tt.total, comparison.cbre.total))})</li>
                <li>• Construction & Furniture show direct comparison using native CBRE data</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Consider average of both estimates for budget planning</li>
                <li>• Both estimates fall within acceptable industry range (±15%)</li>
                <li>• Validate technology requirements separately due to data borrowing</li>
                <li>• Consider local market validation for final budgeting</li>
              </ul>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important Notes:</strong> Different data collection periods may affect comparison. 
              Regional market conditions vary between survey methodologies. 
              Audio-Visual and Professional Fees use T&T data pending CBRE availability.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiSourceComparison;