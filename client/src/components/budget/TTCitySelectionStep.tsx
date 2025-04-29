import React from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import TurnerTownsendDataModule from '@/utils/turnerTownsendData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Building2, TrendingUp, Thermometer, BarChart } from 'lucide-react';

interface TTCitySelectionStepProps {
  onNext: () => void;
  onBack: () => void;
  onSaveAsDraft: () => Promise<void>;
}

const TTCitySelectionStep: React.FC<TTCitySelectionStepProps> = ({ 
  onNext, 
  onBack,
  onSaveAsDraft
}) => {
  const { state, updateTTOptions } = useBudget();
  
  // Ensure we have a selected country
  if (!state.ttOptions?.country) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Select City</h2>
        <p className="text-red-600 mb-6">
          Please select a country first before choosing a city.
        </p>
        <button
          type="button"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onBack}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Country Selection
        </button>
      </div>
    );
  }
  
  const cities = TurnerTownsendDataModule.getCitiesInCountry(state.ttOptions.country);
  
  const handleCityChange = (city: string) => {
    updateTTOptions({
      ...state.ttOptions,
      city,
      // Clear dependent fields
      buildingType: ''
    });
  };
  
  // Get city data if a city is selected
  const cityData = state.ttOptions?.city ? TurnerTownsendDataModule.getCityData(state.ttOptions.city) : null;
  
  // Helper function to get temperature color based on market condition
  const getConditionColor = (condition: string | undefined) => {
    if (!condition) return 'text-gray-500';
    
    switch (condition) {
      case 'Cold':
        return 'text-blue-500';
      case 'Lukewarm':
        return 'text-yellow-500';
      case 'Warm': 
        return 'text-orange-500';
      case 'Hot':
        return 'text-red-500';
      case 'Overheating':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };
  
  // Helper function to get background color based on market condition
  const getConditionBgColor = (condition: string | undefined) => {
    if (!condition) return 'bg-gray-100';
    
    switch (condition) {
      case 'Cold':
        return 'bg-blue-100';
      case 'Lukewarm':
        return 'bg-yellow-100';
      case 'Warm': 
        return 'bg-orange-100';
      case 'Hot':
        return 'bg-red-100';
      case 'Overheating':
        return 'bg-red-200';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Select City</h2>
      <p className="text-gray-600 mb-6">
        Select the specific city for your project to access detailed cost data from the Turner & Townsend ICMS 2024.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600 mr-2">Region:</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {state.ttOptions.region}
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600 mr-2">Country:</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {state.ttOptions.country}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cities.map((city) => {
          const cityInfo = TurnerTownsendDataModule.getCityData(city);
          return (
            <Card 
              key={city}
              className={`cursor-pointer transition-all hover:shadow-md ${
                state.ttOptions?.city === city ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-gray-200'
              }`}
              onClick={() => handleCityChange(city)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium">{city}</CardTitle>
                  {state.ttOptions?.city === city && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {cityInfo && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Thermometer className={`h-4 w-4 mr-1 ${getConditionColor(cityInfo.tenderingCondition)}`} />
                      <span className="text-gray-700">Market: </span>
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${getConditionBgColor(cityInfo.tenderingCondition)} ${getConditionColor(cityInfo.tenderingCondition)}`}>
                        {cityInfo.tenderingCondition}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-gray-700">Outlook: {cityInfo.marketOutlook}</span>
                    </div>
                    <div className="flex items-center">
                      <BarChart className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-gray-700">Inflation: {(cityInfo.inflation['2024'] * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {cityData && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
          <div className="flex items-center mb-2">
            <Building2 className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="font-medium text-blue-800">Market Information: {state.ttOptions.city}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-blue-700 font-medium">Market Condition</p>
              <div className="flex items-center">
                <Thermometer className={`h-4 w-4 mr-1 ${getConditionColor(cityData.tenderingCondition)}`} />
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConditionBgColor(cityData.tenderingCondition)} ${getConditionColor(cityData.tenderingCondition)}`}>
                  {cityData.tenderingCondition}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-blue-700 font-medium">Market Outlook</p>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-gray-600" />
                <span>{cityData.marketOutlook}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-blue-700 font-medium">Inflation Forecasts</p>
              <div className="flex items-center space-x-2">
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">2023: {(cityData.inflation['2023'] * 100).toFixed(1)}%</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">2024: {(cityData.inflation['2024'] * 100).toFixed(1)}%</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">2025: {(cityData.inflation['2025'] * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
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
          Back: Country Selection
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
            disabled={!state.ttOptions?.city}
          >
            Next: Building Type
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TTCitySelectionStep;