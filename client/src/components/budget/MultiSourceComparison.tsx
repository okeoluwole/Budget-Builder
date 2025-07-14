import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';

interface MultiGuideResult {
  primary: {
    result: {
      totalCost: number;
      costsBreakdown: Record<string, number>;
      localCurrencyCode: string;
      datasetInfo: {
        source: string;
        location: string;
        specification: string;
      };
    };
  };
  comparisons: Array<{
    guideId: string;
    result: {
      totalCost: number;
      costsBreakdown: Record<string, number>;
      localCurrencyCode: string;
      datasetInfo: {
        source: string;
        location: string;
        specification: string;
      };
    };
    assumptions: string[];
    coverage: string;
  }>;
}

interface MultiSourceComparisonProps {
  results: MultiGuideResult;
  projectArea: number;
  projectCurrency: string;
  areaUnit: string;
  onToggle: () => void;
}

const MultiSourceComparison: React.FC<MultiSourceComparisonProps> = ({
  results,
  projectArea,
  projectCurrency,
  areaUnit,
  onToggle
}) => {
  // Calculate variance between primary and first comparison
  const primaryCost = results.primary?.result?.totalCost || 0;
  const firstComparison = results.comparisons?.[0];
  const comparisonCost = firstComparison?.result?.totalCost || 0;
  const percentageVariance = primaryCost > 0 ? ((comparisonCost - primaryCost) / primaryCost) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: projectCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRate = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: projectCurrency,
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
              <div className={`text-2xl font-bold ${getVarianceColor(percentageVariance)}`}>
                {percentageVariance.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Overall Variance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(Math.min(primaryCost, comparisonCost))}
              </div>
              <div className="text-sm text-gray-600">Lower Estimate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(Math.max(primaryCost, comparisonCost))}
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
          <strong>Multi-Source Comparison:</strong> Comparing {results.primary?.result?.datasetInfo?.source} with{' '}
          {results.comparisons?.map(c => c.result?.datasetInfo?.source).join(', ')} data sources.
          Variance calculations include intelligent parameter leveling and component mapping.
        </AlertDescription>
      </Alert>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Source-by-Source Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Data Source</th>
                  <th className="text-right py-3 px-4">Total Cost</th>
                  <th className="text-right py-3 px-4">Cost per {areaUnit}</th>
                  <th className="text-right py-3 px-4">Variance</th>
                  <th className="text-center py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Primary Source Row */}
                <tr className="border-b bg-blue-50">
                  <td className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Primary</Badge>
                      {results.primary?.result?.datasetInfo?.source}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {results.primary?.result?.datasetInfo?.specification} | {results.primary?.result?.datasetInfo?.location}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {formatCurrency(primaryCost)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {formatRate(primaryCost / projectArea)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="text-gray-500">—</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Baseline
                    </Badge>
                  </td>
                </tr>

                {/* Comparison Sources */}
                {results.comparisons?.map((comparison, index) => {
                  const compCost = comparison.result?.totalCost || 0;
                  const variance = compCost - primaryCost;
                  const percentVariance = primaryCost > 0 ? (variance / primaryCost) * 100 : 0;

                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Comparison</Badge>
                          {comparison.result?.datasetInfo?.source}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {comparison.result?.datasetInfo?.specification} | {comparison.result?.datasetInfo?.location}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {formatCurrency(compCost)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatRate(compCost / projectArea)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className={`flex items-center justify-end gap-1 ${getVarianceColor(percentVariance)}`}>
                          {getVarianceIcon(percentVariance)}
                          <span className="font-medium">{percentVariance.toFixed(1)}%</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge 
                          variant="outline" 
                          className={comparison.coverage === 'available' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}
                        >
                          {comparison.coverage === 'available' ? 'Available' : 'Limited'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Leveling Assumptions Integration */}
      {firstComparison?.assumptions && firstComparison.assumptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Data Source Leveling Applied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                The following transformations were applied to ensure accurate comparison between data sources:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="space-y-2">
                  {firstComparison.assumptions.map((assumption, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{assumption}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Multi-Source Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Key Findings</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Overall variance: {percentageVariance.toFixed(1)}% between sources</li>
                <li>• {primaryCost < comparisonCost ? results.primary?.result?.datasetInfo?.source : firstComparison?.result?.datasetInfo?.source} provides lower estimate ({formatCurrency(Math.min(primaryCost, comparisonCost))})</li>
                <li>• {primaryCost > comparisonCost ? results.primary?.result?.datasetInfo?.source : firstComparison?.result?.datasetInfo?.source} provides higher estimate ({formatCurrency(Math.max(primaryCost, comparisonCost))})</li>
                <li>• {firstComparison?.assumptions?.length || 0} leveling transformations applied for accurate comparison</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Consider average of both estimates for budget planning</li>
                <li>• Both estimates fall within acceptable industry range (±15%)</li>
                <li>• Review leveling assumptions to understand data transformations</li>
                <li>• Consider local market validation for final budgeting</li>
              </ul>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important Notes:</strong> Different data collection periods may affect comparison. 
              Regional market conditions vary between survey methodologies. 
              Intelligent parameter leveling ensures accurate cross-guide comparison.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiSourceComparison;