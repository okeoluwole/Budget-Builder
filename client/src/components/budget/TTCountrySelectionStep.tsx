import React from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import TurnerTownsendDataModule, { TTRegion } from '@/utils/turnerTownsendData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, MapPin } from 'lucide-react';

interface TTCountrySelectionStepProps {
  onNext: () => void;
  onBack: () => void;
  onSaveAsDraft: () => Promise<void>;
}

const TTCountrySelectionStep: React.FC<TTCountrySelectionStepProps> = ({ 
  onNext, 
  onBack,
  onSaveAsDraft
}) => {
  const { state, updateTTOptions } = useBudget();
  
  // Ensure we have a selected region
  if (!state.ttOptions?.region) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Country</h2>
        <p className="text-red-600 mb-6">
          Please select a region first before choosing a country.
        </p>
        <button
          type="button"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onBack}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Region Selection
        </button>
      </div>
    );
  }
  
  const countries = TurnerTownsendDataModule.getCountriesInRegion(state.ttOptions.region as TTRegion);
  
  const handleCountryChange = (country: string) => {
    const citiesCount = getCountryCitiesCount(country);
    
    updateTTOptions({
      ...state.ttOptions,
      country,
      // Clear dependent fields or set defaults
      city: citiesCount === 0 ? 'Regional Average' : undefined,
      buildingType: undefined
    });
  };
  
  // For each country, get the number of cities with data
  const getCountryCitiesCount = (country: string): number => {
    return TurnerTownsendDataModule.getCitiesInCountry(country).length;
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Country</h2>
      <p className="text-gray-600 mb-6">
        Select the country where your project is located to access the appropriate cost data.
      </p>

      <div className="mb-4 flex items-center">
        <span className="text-sm font-medium text-gray-600 mr-2">Selected Region:</span>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {state.ttOptions.region}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {countries.map((country) => (
          <Card 
            key={country}
            className={`cursor-pointer transition-all hover:shadow-md ${
              state.ttOptions?.country === country ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-gray-200'
            }`}
            onClick={() => handleCountryChange(country)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">{country}</CardTitle>
                {state.ttOptions?.country === country && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{getCountryCitiesCount(country)} {getCountryCitiesCount(country) === 1 ? 'city' : 'cities'} available</span>
              </div>
            </CardContent>
          </Card>
        ))}
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
          Back: Region Selection
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
            disabled={!state.ttOptions?.country}
          >
            Next: City Selection
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TTCountrySelectionStep;