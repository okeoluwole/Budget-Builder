import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataSourceType } from '@shared/schema';

interface DataSourceStepProps {
  onNext: () => void;
  onBack: () => void;
  onSaveAsDraft: () => Promise<void>;
  selectedDataSource: DataSourceType;
  onSelectDataSource: (dataSource: DataSourceType) => void;
  enableComparison: boolean;
  onToggleComparison: (enable: boolean) => void;
}

interface DataSourceInfo {
  id: string;
  name: DataSourceType;
  displayName: string;
  description: string;
  logoUrl?: string;
  version: string;
  releaseDate: string;
  countries: string[];
  isDefault: boolean;
}

const DataSourceStep: React.FC<DataSourceStepProps> = ({
  onNext,
  onBack,
  onSaveAsDraft,
  selectedDataSource,
  onSelectDataSource,
  enableComparison,
  onToggleComparison
}) => {
  // Mock data sources for now until we integrate with backend
  const availableDataSources: DataSourceInfo[] = [
    {
      id: '1',
      name: 'CBRE',
      displayName: 'CBRE Global Fit-Out Cost Guide',
      description: 'Industry standard fit-out cost data covering 134 cities worldwide with detailed breakdown by space type and quality level.',
      logoUrl: '/assets/cbre-logo.svg',
      version: '2025.1',
      releaseDate: '2025-01-01',
      countries: ['United States', 'United Kingdom', 'Germany', 'France', 'China', 'Japan', 'India', 'Australia', 'Canada', 'Brazil'],
      isDefault: true
    },
    {
      id: '2',
      name: 'JLL',
      displayName: 'JLL Office Fit-Out Matrix',
      description: 'Comprehensive fit-out cost benchmarks with sustainability ratings and detailed cost component analysis across global markets.',
      logoUrl: '/assets/jll-logo.svg',
      version: '2025.1',
      releaseDate: '2025-01-15',
      countries: ['United States', 'United Kingdom', 'Singapore', 'Hong Kong', 'Australia', 'Japan', 'Germany', 'France', 'Spain', 'Italy'],
      isDefault: false
    },
    {
      id: '3',
      name: 'TT',
      displayName: 'Turner & Townsend Cost Intelligence',
      description: 'Detailed construction cost data with specialized focus on technical infrastructure and high-performance workspaces.',
      logoUrl: '/assets/tt-logo.svg',
      version: '2025.2',
      releaseDate: '2025-02-01',
      countries: ['United Kingdom', 'United States', 'Canada', 'Australia', 'New Zealand', 'South Africa', 'United Arab Emirates', 'Singapore', 'Hong Kong'],
      isDefault: false
    }
  ];

  // Function to handle data source selection
  const handleSelectDataSource = (dataSource: DataSourceType) => {
    onSelectDataSource(dataSource);
  };

  // Function to handle comparison toggle
  const handleComparisonToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggleComparison(event.target.checked);
  };

  // Function to handle next button click
  const handleNext = () => {
    // Validate that a data source is selected
    if (selectedDataSource) {
      onNext();
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Source Selection</h2>
      <p className="text-gray-600 mb-6">
        Choose your preferred data source for cost estimations. Each source provides different coverage and methodologies.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {availableDataSources.map((dataSource) => (
          <div 
            key={dataSource.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedDataSource === dataSource.name 
                ? 'border-primary bg-blue-50 shadow'
                : 'border-gray-200'
            }`}
            onClick={() => handleSelectDataSource(dataSource.name)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-800">{dataSource.displayName}</h3>
              <div className="w-6 h-6 flex-shrink-0">
                {/* Placeholder for logo */}
                {dataSource.name === 'CBRE' && 
                  <svg className="w-6 h-6 text-[#e4002b]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                  </svg>
                }
                {dataSource.name === 'JLL' && 
                  <svg className="w-6 h-6 text-[#c4092f]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 5h14v14H5z"/>
                  </svg>
                }
                {dataSource.name === 'TT' && 
                  <svg className="w-6 h-6 text-[#002a4e]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h16v4H4zm0 6h16v4H4zm0 6h16v4H4z"/>
                  </svg>
                }
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 h-20 overflow-hidden">{dataSource.description}</p>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {dataSource.countries.slice(0, 3).map((country, index) => (
                <span 
                  key={index} 
                  className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded"
                >
                  {country}
                </span>
              ))}
              {dataSource.countries.length > 3 && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                  +{dataSource.countries.length - 3} more
                </span>
              )}
            </div>
            
            <div className="text-xs text-gray-500 flex justify-between">
              <span>v{dataSource.version}</span>
              <span>Released: {dataSource.releaseDate}</span>
            </div>
            
            {dataSource.isDefault && (
              <div className="mt-2 text-xs text-primary font-medium">
                Default Source
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="border rounded-lg p-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Enable Data Source Comparison</h3>
            <p className="text-sm text-gray-600 mt-1">
              Compare cost estimations from different sources to get a more comprehensive view.
            </p>
          </div>
          <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
            <input
              type="checkbox"
              id="comparison-toggle"
              checked={enableComparison}
              onChange={handleComparisonToggle}
              className="absolute w-6 h-6 transition duration-200 ease-in-out transform bg-white border rounded-full cursor-pointer peer border-gray-300 left-0 top-0 appearance-none checked:left-6 checked:bg-primary checked:border-primary"
            />
            <label
              htmlFor="comparison-toggle"
              className="block h-full overflow-hidden rounded-full cursor-pointer bg-gray-200 peer-checked:bg-blue-100"
            ></label>
          </div>
        </div>
        
        {enableComparison && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-700">
              <span className="font-medium">Note:</span> Comparison mode will show cost estimates from all selected data sources side by side.
              This may add additional processing time to your budget calculations.
            </p>
          </div>
        )}
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
          Back: Project Details
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
            onClick={handleNext}
          >
            Next: Scope Selection
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataSourceStep;