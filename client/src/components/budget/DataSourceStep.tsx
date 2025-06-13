import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DataSourceType } from '@shared/schema';
import { FaBuilding, FaChartLine, FaCogs, FaIndustry } from 'react-icons/fa';
import { BsBuildings } from 'react-icons/bs';
import { Building2, Factory } from 'lucide-react';

interface DataSourceStepProps {
  onNext: () => void;
  onBack: () => void;
  onSaveAsDraft: () => Promise<void>;
  selectedDataSource: DataSourceType;
  onSelectDataSource: (dataSource: DataSourceType) => void;
  enableComparison: boolean;
  onToggleComparison: (enable: boolean) => void;
  comparisonSources?: DataSourceType[];
  onUpdateComparisonSources?: (sources: DataSourceType[]) => void;
}

interface DataSourceInfo {
  id: string;
  name: DataSourceType;
  displayName: string;
  description: string;
  logoUrl?: string;
  logo?: React.ReactNode;
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
  onToggleComparison,
  comparisonSources = [],
  onUpdateComparisonSources = () => {},
}) => {
  const { toast } = useToast();
  const [selectedComparisonSources, setSelectedComparisonSources] = useState<DataSourceType[]>(comparisonSources);

  const dataSources: DataSourceInfo[] = [
    {
      id: 'cbre',
      name: 'CBRE',
      displayName: 'CBRE Global Fit-Out Cost Guide',
      description: 'Comprehensive global data with Bronze/Silver/Gold specification levels and Activity/Team/Event layout options. Best for standard office spaces with detailed space allocation needs.',
      logo: <FaBuilding className="w-8 h-8 text-blue-600" />,
      version: '2024/25',
      releaseDate: 'January 2024',
      countries: ['United States', 'United Kingdom', 'Singapore', 'Australia', 'China', 'Japan', 'Germany', '+127 more'],
      isDefault: true
    },
    {
      id: 'jll',
      name: 'JLL',
      displayName: 'JLL Global Office Fit-Out Guide',
      description: 'Focused on space typologies with detailed regional cost breakdowns. Uses Open & Flexible, High Spatial Variety, and Traditional Focus typologies with Baseline/Medium/High quality options.',
      logo: <BsBuildings className="w-8 h-8 text-red-600" />,
      version: '2025',
      releaseDate: 'March 2024',
      countries: ['United States', 'United Kingdom', 'Australia', 'Hong Kong', 'France', 'Germany', '+58 more'],
      isDefault: false
    },
    {
      id: 'tt',
      name: 'TT',
      displayName: 'Turner & Townsend ICMS',
      description: 'International Construction Market Survey with detailed labor, material, and equipment costs. Includes location indices, contractor margins, and regional market outlooks. Best for complex projects.',
      logo: <FaChartLine className="w-8 h-8 text-gray-700" />,
      version: '2024 Q1',
      releaseDate: 'February 2024',
      countries: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Singapore', 'UAE', '+42 more'],
      isDefault: false
    },
    {
      id: 'mmc',
      name: 'MMC',
      displayName: 'MMC Cost Data',
      description: 'Industry-specific Modern Methods of Construction data with detailed project budgeting capabilities. Includes specialized cost indices for prefabricated and modular construction approaches.',
      logo: <FaIndustry className="w-8 h-8 text-emerald-600" />,
      version: '2024 ED',
      releaseDate: 'April 2024',
      countries: ['United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Canada', '+39 more'],
      isDefault: false
    }
  ];

  const handleNext = () => {
    if (!selectedDataSource) {
      toast({
        title: "Selection required",
        description: "Please select a data source before continuing.",
        variant: "destructive",
      });
      return;
    }
    console.log('DataSourceStep: Moving to next step with selected data source:', selectedDataSource);
    console.log('DataSourceStep: Comparison enabled:', enableComparison);
    if (enableComparison) {
      console.log('DataSourceStep: Comparison sources:', selectedComparisonSources);
    }
    onNext();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Cost Data Source</h2>
      <p className="text-gray-600 mb-6">
        <strong>This is the first and most important step.</strong> Choose which cost guide you want to use for your budget estimate. Your selection will determine the methodology, data points, and workflow for subsequent steps. Each source offers different strengths and regional coverage.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {dataSources.map((source) => (
          <div
            key={source.id}
            className={`relative border-2 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
              selectedDataSource === source.name 
                ? 'border-primary bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-4 ring-blue-100' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => onSelectDataSource(source.name)}
          >
            {/* Selection Indicator */}
            {selectedDataSource === source.name && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start mb-4">
                <div className="mr-4 flex-shrink-0">
                  {source.logo}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{source.displayName}</h3>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {source.version}
                    </span>
                    <span className="text-sm text-gray-500">{source.releaseDate}</span>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-gray-700 mb-6 leading-relaxed">{source.description}</p>
              
              {/* Country Coverage */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Global Coverage</h4>
                <div className="flex flex-wrap gap-2">
                  {source.countries.slice(0, 4).map((country, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {country}
                    </span>
                  ))}
                  {source.countries.length > 4 && (
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      +{source.countries.length - 4} countries
                    </span>
                  )}
                </div>
              </div>
              {source.isDefault && (
                <div className="mt-3">
                  <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Recommended</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableComparison"
            className="h-4 w-4 text-primary border-gray-300 rounded"
            checked={enableComparison}
            onChange={(e) => {
              const enabled = e.target.checked;
              onToggleComparison(enabled);
              if (!enabled) {
                setSelectedComparisonSources([]);
                onUpdateComparisonSources([]);
              }
            }}
          />
          <label htmlFor="enableComparison" className="ml-2 block text-sm font-medium text-gray-700">
            Enable multi-source comparison
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          When enabled, your budget will include additional comparison data from other sources where available.
        </p>

        {enableComparison && (
          <div className="mt-4 ml-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Select comparison sources:</h4>
            <div className="space-y-2">
              {dataSources
                .filter(source => source.name !== selectedDataSource)
                .map(source => (
                  <div key={source.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`compare-${source.id}`}
                      className="h-4 w-4 text-primary border-gray-300 rounded"
                      checked={selectedComparisonSources.includes(source.name)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        let newSources = [...selectedComparisonSources];
                        
                        if (isChecked && !newSources.includes(source.name)) {
                          newSources.push(source.name);
                        } else if (!isChecked) {
                          newSources = newSources.filter(s => s !== source.name);
                        }
                        
                        setSelectedComparisonSources(newSources);
                        onUpdateComparisonSources(newSources);
                      }}
                    />
                    <label htmlFor={`compare-${source.id}`} className="ml-2 flex items-center text-sm text-gray-700">
                      <span className="mr-2">{source.logo}</span>
                      {source.displayName}
                    </label>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          className="flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
          onClick={onBack}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cancel
        </button>
        
        <div className="flex gap-3">
          <button
            type="button"
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            onClick={onSaveAsDraft}
          >
            Save as Draft
          </button>
          
          <button
            type="button"
            className="px-8 py-3 text-sm font-semibold text-white bg-primary rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 flex items-center"
            onClick={handleNext}
          >
            Next: Project Setup
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataSourceStep;