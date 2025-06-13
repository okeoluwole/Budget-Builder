import React, { useEffect, useState } from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { LAYOUT_TYPES, LAYOUT_DETAILS } from '@/data/mockData';

interface LayoutStepProps {
  onNext: () => void;
  onBack: () => void;
  onSaveAsDraft: () => Promise<void>;
}

interface LayoutTemplate {
  name: string;
  description: string;
  benefits: string[];
  spaceTypes: {
    name: string;
    description: string;
    minPercentage: number;
    maxPercentage: number;
    defaultPercentage: number;
  }[];
}

const LayoutStep: React.FC<LayoutStepProps> = ({ onNext, onBack, onSaveAsDraft }) => {
  const { state, updateLayout } = useBudget();
  const [layouts, setLayouts] = useState<LayoutTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [selectedLayout, setSelectedLayout] = useState<string>(state.budget?.layout || '');

  // Fetch layout templates
  useEffect(() => {
    const fetchLayoutTemplates = async () => {
      try {
        setLoading(true);
        // Pass data source parameter to get correct layout templates
        const dataSource = state.budget?.primaryDataSource || 'CBRE';
        const res = await apiRequest('GET', `/api/layout-templates?dataSource=${dataSource}`, undefined);
        const data = await res.json();
        setLayouts(data);
      } catch (error) {
        console.error('Failed to fetch layout templates:', error);
        toast({
          title: "Failed to load layout templates",
          description: "Using default layouts instead. Some data may be missing.",
          variant: "destructive",
        });
        // Fallback to default layout data
        setLayouts(LAYOUT_TYPES.map(type => ({
          name: type,
          description: LAYOUT_DETAILS[type].description,
          benefits: LAYOUT_DETAILS[type].features,
          spaceTypes: [
            {
              name: "Primary Space",
              description: "Main usage area",
              minPercentage: 40,
              maxPercentage: 60,
              defaultPercentage: 50
            },
            {
              name: "Secondary Space",
              description: "Supporting area",
              minPercentage: 20,
              maxPercentage: 40,
              defaultPercentage: 30
            },
            {
              name: "Tertiary Space",
              description: "Additional area",
              minPercentage: 10,
              maxPercentage: 30,
              defaultPercentage: 20
            }
          ]
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchLayoutTemplates();
  }, [toast]);

  const handleSelectLayout = (layoutName: string) => {
    setSelectedLayout(layoutName);
  };

  const handleNext = () => {
    if (!selectedLayout) {
      toast({
        title: "Selection required",
        description: "Please select a layout type before continuing.",
        variant: "destructive",
      });
      return;
    }

    updateLayout(selectedLayout);
    onNext();
  };

  // Simplified layout images for each type
  const layoutImages = {
    Activity: "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=600&h=400&fit=crop",
    Team: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
    Event: "https://images.unsplash.com/photo-1559223607-a43c990c692c?w=600&h=400&fit=crop"
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Layout Determination</h2>
      <p className="text-gray-600 mb-6">Select the primary layout approach for your office space.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-8">
            <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600">Loading layout options...</p>
          </div>
        ) : (
          LAYOUT_TYPES.map((layoutType) => {
            const isSelected = selectedLayout === layoutType;
            const layout = layouts.find(l => l.name === layoutType) || {
              name: layoutType,
              description: LAYOUT_DETAILS[layoutType].description,
              benefits: LAYOUT_DETAILS[layoutType].features,
              spaceTypes: []
            };
            
            return (
              <div
                key={layoutType}
                className={`border rounded-lg overflow-hidden hover:shadow-md cursor-pointer transition-shadow ${
                  isSelected ? 'border-primary shadow-sm' : ''
                }`}
                onClick={() => handleSelectLayout(layoutType)}
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                  <img 
                    src={layoutImages[layoutType]}
                    alt={`${layoutType} Based Working Layout`}
                    className="object-cover h-48 w-full"
                  />
                </div>
                <div className={`p-4 border-b ${
                  isSelected ? 'bg-blue-50 border-primary' : 'bg-gray-50'
                }`}>
                  <h3 className={`text-lg font-semibold ${
                    isSelected ? 'text-primary' : 'text-gray-800'
                  }`}>
                    {layoutType} Based
                  </h3>
                  <p className="text-sm text-gray-600">{layout.description}</p>
                </div>
                <div className="p-4">
                  <ul className="space-y-2 text-sm">
                    {layout.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })
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
          Back: Specification Selection
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
            Next: Space Allocation
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LayoutStep;
