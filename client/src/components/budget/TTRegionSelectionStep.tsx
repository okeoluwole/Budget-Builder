import React from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import TurnerTownsendDataModule, { TTRegion } from '@/utils/turnerTownsendData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Globe } from 'lucide-react';

interface TTRegionSelectionStepProps {
  onNext: () => void;
  onBack: () => void;
  onSaveAsDraft: () => Promise<void>;
}

const TTRegionSelectionStep: React.FC<TTRegionSelectionStepProps> = ({ 
  onNext, 
  onBack,
  onSaveAsDraft
}) => {
  const { state, updateTTOptions } = useBudget();
  const regions = TurnerTownsendDataModule.getRegions();
  
  const handleRegionChange = (region: TTRegion) => {
    updateTTOptions({
      region,
      // Clear dependent fields when region changes
      country: '',
      city: '',
      buildingType: ''
    });
  };

  // For each region, provide number of countries and brief description
  const regionInfo: Record<TTRegion, { description: string; countries: number }> = {
    'Africa': { 
      description: 'Markets across Africa showing varied growth, with focus on infrastructure development.',
      countries: TurnerTownsendDataModule.getCountriesInRegion('Africa').length
    },
    'Asia': { 
      description: 'Diverse economies with high-growth markets and mature construction sectors.',
      countries: TurnerTownsendDataModule.getCountriesInRegion('Asia').length
    },
    'Australia and New Zealand': { 
      description: 'Stable mature markets with consistent quality and regulatory standards.',
      countries: TurnerTownsendDataModule.getCountriesInRegion('Australia and New Zealand').length
    },
    'Europe': { 
      description: 'Established markets with strong regulatory frameworks and sustainability focus.',
      countries: TurnerTownsendDataModule.getCountriesInRegion('Europe').length
    },
    'Middle East': { 
      description: 'Dynamic growth markets with significant investment in commercial development.',
      countries: TurnerTownsendDataModule.getCountriesInRegion('Middle East').length
    },
    'North America': { 
      description: 'Mature markets with high standards and competitive construction sectors.',
      countries: TurnerTownsendDataModule.getCountriesInRegion('North America').length
    },
    'South America': { 
      description: 'Emerging markets with varied economic conditions and investment opportunities.',
      countries: TurnerTownsendDataModule.getCountriesInRegion('South America').length
    },
    'UK': { 
      description: 'Established market with high quality standards and comprehensive cost data.',
      countries: TurnerTownsendDataModule.getCountriesInRegion('UK').length
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Region</h2>
      <p className="text-gray-600 mb-6">
        The Turner & Townsend International Construction Market Survey (ICMS) 2024 provides data for 91 markets across 8 global regions.
        Select a region to begin.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {regions.map((region) => (
          <Card 
            key={region}
            className={`cursor-pointer transition-all hover:shadow-md ${
              state.ttOptions?.region === region ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-gray-200'
            }`}
            onClick={() => handleRegionChange(region)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">{region}</CardTitle>
                {state.ttOptions?.region === region && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
              <CardDescription>
                {regionInfo[region].countries} {regionInfo[region].countries === 1 ? 'country' : 'countries'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {regionInfo[region].description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {state.ttOptions?.region && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
          <div className="flex items-center mb-2">
            <Globe className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="font-medium text-blue-800">About {state.ttOptions.region}</h3>
          </div>
          <p className="text-sm text-blue-700">
            The T&T ICMS 2024 provides data for {regionInfo[state.ttOptions.region].countries} {regionInfo[state.ttOptions.region].countries === 1 ? 'country' : 'countries'} in {state.ttOptions.region}.
          </p>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onBack}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back: Data Source
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
            disabled={!state.ttOptions?.region}
          >
            Next: Country Selection
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TTRegionSelectionStep;