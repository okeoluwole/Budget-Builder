import React from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import TurnerTownsendDataModule, { TTBuildingType } from '@/utils/turnerTownsendData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Building2, Building } from 'lucide-react';

interface TTBuildingTypeStepProps {
  onNext: () => void;
  onBack: () => void;
  onSaveAsDraft: () => Promise<void>;
}

const TTBuildingTypeStep: React.FC<TTBuildingTypeStepProps> = ({ 
  onNext, 
  onBack,
  onSaveAsDraft
}) => {
  const { state, updateTTOptions } = useBudget();
  
  // Ensure we have a selected city
  if (!state.ttOptions?.city) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Specification Level</h2>
        <p className="text-red-600 mb-6">
          Please select a city first before choosing a specification level.
        </p>
        <button
          type="button"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onBack}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to City Selection
        </button>
      </div>
    );
  }
  
  const buildingTypes = TurnerTownsendDataModule.getBuildingTypes();
  const cityData = TurnerTownsendDataModule.getCityData(state.ttOptions.city);
  
  const handleBuildingTypeChange = (buildingType: TTBuildingType) => {
    updateTTOptions({
      ...state.ttOptions,
      buildingType
    });
  };
  
  // Get the cost for a building type if selected
  const getBuildingTypeCost = (buildingType: TTBuildingType) => {
    if (!cityData) return null;
    
    const costs = cityData.buildingCosts[buildingType];
    if (!costs) return null;
    
    return {
      sqm: costs.costPerSqM,
      sqft: costs.costPerSqFt
    };
  };

  // Icon components for building types
  const buildingTypeIcons: Record<TTBuildingType, React.ReactNode> = {
    'high_rise_prestige': <Building2 className="h-12 w-12 text-blue-600" />,
    'medium_a_grade': <Building className="h-12 w-12 text-emerald-600" />
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Building Type</h2>
      <p className="text-gray-600 mb-6">
        The Turner & Townsend ICMS 2024 provides cost data for different categories of office buildings.
        Select the type that most closely matches your project requirements.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600 mr-2">Location:</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {state.ttOptions.city}, {state.ttOptions.country}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {buildingTypes.map((type) => {
          const costs = getBuildingTypeCost(type.id as TTBuildingType);
          return (
            <Card 
              key={type.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                state.ttOptions?.buildingType === type.id ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-gray-200'
              }`}
              onClick={() => handleBuildingTypeChange(type.id as TTBuildingType)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-medium">{type.label}</CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </div>
                  {state.ttOptions?.buildingType === type.id && (
                    <Check className="h-5 w-5 text-primary mt-1" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-shrink-0">
                    {buildingTypeIcons[type.id as TTBuildingType]}
                  </div>
                  
                  {costs && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 font-medium">Base Costs:</p>
                      <div className="flex flex-col">
                        <span className="text-md font-semibold">${costs.sqm.toLocaleString()} per sq.m</span>
                        <span className="text-sm text-gray-500">${costs.sqft.toLocaleString()} per sq.ft</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-100">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> These baseline costs represent typical office building construction costs in {state.ttOptions.city} as of {TurnerTownsendDataModule.metadata.baseDateForPricing}. 
          Actual costs may vary based on project-specific requirements, site conditions, inflation, and other factors.
        </p>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onBack}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back: City Selection
        </button>
        
        <div>
          <button
            type="button"
            className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onSaveAsDraft}
          >
            Save as Draft
          </button>
          
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={onNext}
            disabled={!state.ttOptions?.buildingType}
          >
            Next: Budget Results
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TTBuildingTypeStep;