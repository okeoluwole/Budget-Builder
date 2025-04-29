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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {dataSources.map((source) => (
          <div
            key={source.id}
            className={`border rounded-lg overflow-hidden hover:shadow-md cursor-pointer transition-shadow ${
              selectedDataSource === source.name ? 'border-primary shadow-md' : 'border-gray-200'
            }`}
            onClick={() => onSelectDataSource(source.name)}
          >
            <div className={`p-4 ${selectedDataSource === source.name ? 'bg-blue-50' : 'bg-white'}`}>
              <div className="flex items-center mb-4">
                <div className="mr-3">
                  {source.logo}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{source.displayName}</h3>
                  <p className="text-sm text-gray-500">{source.version} - {source.releaseDate}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{source.description}</p>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Country Coverage:</h4>
                <div className="flex flex-wrap gap-1">
                  {source.countries.slice(0, 5).map((country, idx) => (
                    <span key={idx} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {country}
                    </span>
                  ))}
                  {source.countries.length > 5 && (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      +{source.countries.length - 5} more
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
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onBack}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cancel
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
            Next: Project Setup
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