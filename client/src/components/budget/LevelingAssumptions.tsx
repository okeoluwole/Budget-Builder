import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface LevelingAssumptionsProps {
  multiGuideResults?: any;
  mappingNotes?: string[];
  isComparisonEnabled?: boolean;
}

const LevelingAssumptions: React.FC<LevelingAssumptionsProps> = ({
  multiGuideResults,
  mappingNotes,
  isComparisonEnabled
}) => {
  // Debug logging
  console.log('🔍 LevelingAssumptions Debug:', {
    isComparisonEnabled,
    hasMultiGuideResults: !!multiGuideResults,
    multiGuideResults,
    mappingNotes,
    comparisonsCount: multiGuideResults?.comparisons?.length || 0
  });

  if (!isComparisonEnabled || !multiGuideResults) {
    console.log('❌ LevelingAssumptions: Not rendering - comparison disabled or no results');
    return null;
  }

  // Extract assumptions from comparison results
  const getAllAssumptions = () => {
    const allAssumptions: string[] = [];

    if (multiGuideResults?.comparisons) {
      multiGuideResults.comparisons.forEach((comp: any) => {
        if (comp.assumptions && comp.assumptions.length > 0) {
          comp.assumptions.forEach((assumption: string) => {
            allAssumptions.push(`${comp.guideName || comp.guideId}: ${assumption}`);
          });
        }
      });
    }

    return allAssumptions;
  };

  const assumptions = getAllAssumptions();
  const hasTransformations = assumptions.length > 0;
  const hasMappingNotes = mappingNotes && mappingNotes.length > 0;

  console.log('🔧 LevelingAssumptions Processing:', {
    assumptionsCount: assumptions.length,
    hasTransformations,
    hasMappingNotes,
    shouldDisplay: hasTransformations || hasMappingNotes,
    assumptions
  });

  // Categorize assumptions
  const categorizeAssumptions = (assumptionsList: string[]) => {
    const categories = {
      specification: [] as string[],
      layout: [] as string[],
      component: [] as string[],
      currency: [] as string[],
      data: [] as string[],
      other: [] as string[]
    };

    assumptionsList.forEach(assumption => {
      const lower = assumption.toLowerCase();
      if (lower.includes('specification') || lower.includes('bronze') || lower.includes('silver') || lower.includes('gold')) {
        categories.specification.push(assumption);
      } else if (lower.includes('layout') || lower.includes('activity') || lower.includes('team') || lower.includes('event') || lower.includes('universal')) {
        categories.layout.push(assumption);
      } else if (lower.includes('component') || lower.includes('mapping') || lower.includes('construction') || lower.includes('furniture')) {
        categories.component.push(assumption);
      } else if (lower.includes('currency') || lower.includes('usd') || lower.includes('conversion')) {
        categories.currency.push(assumption);
      } else if (lower.includes('vintage') || lower.includes('data') || lower.includes('source')) {
        categories.data.push(assumption);
      } else {
        categories.other.push(assumption);
      }
    });

    return categories;
  };

  const categorized = categorizeAssumptions(assumptions);

  if (!hasTransformations && !hasMappingNotes) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          Multi-Source Comparison Assumptions & Transformations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview Alert */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Data Source Leveling Applied:</strong> The following transformations ensure accurate 
            comparison between different cost guides with varying data structures and methodologies.
          </AlertDescription>
        </Alert>

        {/* Specification Transformations */}
        {categorized.specification.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-green-600" />
              Specification Level Mapping
            </h4>
            <div className="bg-green-50 rounded-lg p-3 space-y-1">
              {categorized.specification.map((assumption, index) => (
                <div key={index} className="text-sm text-green-800 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">SPEC</Badge>
                  {assumption}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layout Transformations */}
        {categorized.layout.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-600" />
              Layout Compatibility Handling
            </h4>
            <div className="bg-blue-50 rounded-lg p-3 space-y-1">
              {categorized.layout.map((assumption, index) => (
                <div key={index} className="text-sm text-blue-800 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">LAYOUT</Badge>
                  {assumption}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Component Mapping */}
        {categorized.component.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-purple-600" />
              Component Category Alignment
            </h4>
            <div className="bg-purple-50 rounded-lg p-3 space-y-1">
              {categorized.component.map((assumption, index) => (
                <div key={index} className="text-sm text-purple-800 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">COMP</Badge>
                  {assumption}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Currency Handling */}
        {categorized.currency.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-orange-600" />
              Currency Normalization
            </h4>
            <div className="bg-orange-50 rounded-lg p-3 space-y-1">
              {categorized.currency.map((assumption, index) => (
                <div key={index} className="text-sm text-orange-800 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">CURR</Badge>
                  {assumption}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Source Notes */}
        {categorized.data.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-gray-600" />
              Data Source Characteristics
            </h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              {categorized.data.map((assumption, index) => (
                <div key={index} className="text-sm text-gray-800 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">DATA</Badge>
                  {assumption}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System-Level Mapping Notes */}
        {hasMappingNotes && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-600" />
              System-Level Compatibility Notes
            </h4>
            <div className="bg-indigo-50 rounded-lg p-3 space-y-1">
              {mappingNotes!.map((note, index) => (
                <div key={index} className="text-sm text-indigo-800 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">SYS</Badge>
                  {note}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Assumptions */}
        {categorized.other.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-gray-600" />
              Additional Considerations
            </h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              {categorized.other.map((assumption, index) => (
                <div key={index} className="text-sm text-gray-800 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">NOTE</Badge>
                  {assumption}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Impact Assessment:</strong> These transformations enable meaningful comparison between 
            cost guides with different methodologies. All adjustments maintain data integrity while providing 
            standardized comparison metrics.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default LevelingAssumptions;