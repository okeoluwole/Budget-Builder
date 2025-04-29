import React, { useEffect, useState } from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SpecificationData } from '@shared/schema';
import { SPECIFICATION_DETAILS } from '@/data/mockData';
import { Separator } from '@/components/ui/separator';

interface SpecificationStepProps {
  onNext: () => void;
  onBack: () => void;
  onSaveAsDraft: () => Promise<void>;
}

const SpecificationStep: React.FC<SpecificationStepProps> = ({ onNext, onBack, onSaveAsDraft }) => {
  const { state, updateSpecification } = useBudget();
  const [specifications, setSpecifications] = useState<SpecificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Track specifications separately for fitout and furniture
  const [selectedFitoutSpec, setSelectedFitoutSpec] = useState<string>(
    state.budget?.fitoutSpecification || state.budget?.specification || ''
  );
  const [selectedFurnitureSpec, setSelectedFurnitureSpec] = useState<string>(
    state.budget?.furnitureSpecification || state.budget?.specification || ''
  );

  // Determine if we need to show both specification sections
  const showBothSections = state.budget?.scope === 'Both';

  useEffect(() => {
    const fetchSpecifications = async () => {
      try {
        setLoading(true);
        // Clear any existing specifications before loading new ones
        setSpecifications([]);
        
        const res = await apiRequest('GET', '/api/specifications', undefined);
        const data = await res.json();
        
        // Check if we got valid data and deduplicate by name
        if (Array.isArray(data) && data.length > 0) {
          // Use a Map to deduplicate by name
          const uniqueSpecs = new Map();
          data.forEach(spec => {
            if (!uniqueSpecs.has(spec.name)) {
              uniqueSpecs.set(spec.name, spec);
            }
          });
          setSpecifications(Array.from(uniqueSpecs.values()));
        } else {
          throw new Error('No specification data received');
        }
      } catch (error) {
        console.error('Failed to fetch specifications:', error);
        toast({
          title: "Failed to load specifications",
          description: "Using default specifications instead. Some data may be missing.",
          variant: "destructive",
        });
        // Fallback to default specs - use only if API fails completely
        setSpecifications([
          {
            name: 'Bronze',
            description: SPECIFICATION_DETAILS.Bronze.description,
            walls: "Painted walls with minimal branding",
            partitions: {
              type: "Single glazed",
              acousticRating: "38dB Rw",
              costFactor: 1.0
            },
            flooring: "Standard carpet tiles",
            ceiling: "Same as rest of office, minimal modifications",
            furniture: {
              desks: "Fixed desks",
              chairs: "Steelcase Series 1 or equivalent",
              storage: "Basic storage solutions"
            },
            technology: {
              av: "Basic AV with audio conferencing",
              security: "Standard security features"
            },
            fittings: "Basic fittings and finishes",
            recommendedFor: "Standard office spaces with budget constraints"
          },
          {
            name: 'Silver',
            description: SPECIFICATION_DETAILS.Silver.description,
            walls: "Feature walls with special finishes",
            partitions: {
              type: "Double glazed",
              acousticRating: "45dB Rw",
              costFactor: 1.4
            },
            flooring: "Upgraded options, timber/LVT in specific areas",
            ceiling: "Feature ceiling elements",
            furniture: {
              desks: "Mix of static and height-adjustable desks",
              chairs: "Mid-tier with better fabrics",
              storage: "Enhanced storage solutions"
            },
            technology: {
              av: "Enhanced AV throughout with video conferencing",
              security: "Enhanced security features"
            },
            fittings: "Higher quality fittings and finishes",
            recommendedFor: "Enhanced office environments requiring more customization"
          },
          {
            name: 'Gold',
            description: SPECIFICATION_DETAILS.Gold.description,
            walls: "Feature wall concepts throughout, extensive branding",
            partitions: {
              type: "Double glazed with high performance",
              acousticRating: "50dB Rw",
              costFactor: 1.8
            },
            flooring: "High-specification (ceramic, porcelain)",
            ceiling: "Comprehensive feature ceiling concepts",
            furniture: {
              desks: "Full sit-stand provision",
              chairs: "Premium ergonomic options",
              storage: "Premium storage solutions"
            },
            technology: {
              av: "Premium AV throughout with integrated systems",
              security: "Advanced security features"
            },
            fittings: "Premium fittings and finishes",
            recommendedFor: "Premium office environments requiring extensive customization"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecifications();
  }, [toast]);

  const handleSelectFitoutSpecification = (specName: string) => {
    setSelectedFitoutSpec(specName);
  };

  const handleSelectFurnitureSpecification = (specName: string) => {
    setSelectedFurnitureSpec(specName);
  };

  const handleNext = () => {
    // Validate based on which sections are visible
    if (state.budget?.scope === 'Fitout' && !selectedFitoutSpec) {
      toast({
        title: "Specification selection required",
        description: "Please select a fitout specification level before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    if (state.budget?.scope === 'Furniture' && !selectedFurnitureSpec) {
      toast({
        title: "Specification selection required",
        description: "Please select a furniture specification level before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    if (state.budget?.scope === 'Both' && (!selectedFitoutSpec || !selectedFurnitureSpec)) {
      toast({
        title: "Specification selections required",
        description: "Please select both fitout and furniture specification levels before continuing.",
        variant: "destructive",
      });
      return;
    }

    // When it's a single scope, we update the main specification
    // and also set the specific one for future reference
    if (state.budget?.scope === 'Fitout') {
      updateSpecification(selectedFitoutSpec, selectedFitoutSpec, null);
    } else if (state.budget?.scope === 'Furniture') {
      updateSpecification(selectedFurnitureSpec, null, selectedFurnitureSpec);
    } else {
      // For 'Both' scope, we need to update both specifications
      // For backward compatibility, use fitout spec as the main specification
      updateSpecification(selectedFitoutSpec, selectedFitoutSpec, selectedFurnitureSpec);
    }
    
    onNext();
  };

  // Determine which specification section to show based on the selected scope
  const renderSpecificationSection = (type: 'Fitout' | 'Furniture') => {
    const isSelected = (type === 'Fitout') 
      ? (specName: string) => selectedFitoutSpec === specName
      : (specName: string) => selectedFurnitureSpec === specName;
    
    const handleSelect = (type === 'Fitout')
      ? handleSelectFitoutSpecification
      : handleSelectFurnitureSpecification;
      
    // Different header and descriptions based on type
    const sectionTitle = `${type} Specification`;
    const sectionDescription = type === 'Fitout'
      ? `Choose the quality level for your ${type.toLowerCase()} construction elements.`
      : `Choose the quality level for your ${type.toLowerCase()} and movable items.`;
      
    // Different highlights based on type
    const getSpecHighlights = (spec: SpecificationData) => {
      if (type === 'Fitout') {
        return [
          spec.walls,
          `${spec.partitions.type} (${spec.partitions.acousticRating})`,
          spec.flooring,
          spec.ceiling,
          spec.technology.av
        ];
      } else {
        return [
          spec.furniture.desks,
          spec.furniture.chairs,
          spec.furniture.storage,
          `Technology: ${spec.technology.av}`,
          "Matching design aesthetic"
        ];
      }
    };

    return (
      <div className="mb-8">
        <h3 className="text-lg font-medium text-primary mb-2">{sectionTitle}</h3>
        <p className="text-gray-600 mb-4">{sectionDescription}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-8">
              <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-gray-600">Loading specifications...</p>
            </div>
          ) : (
            specifications.map((spec) => {
              const highlights = getSpecHighlights(spec);
              
              return (
                <div
                  key={`${type}-${spec.name}`}
                  className={`border rounded-lg overflow-hidden hover:shadow-md cursor-pointer transition-shadow ${
                    isSelected(spec.name) ? 'border-primary shadow-sm' : ''
                  }`}
                  onClick={() => handleSelect(spec.name)}
                >
                  <div className={`p-4 border-b ${
                    isSelected(spec.name) ? 'bg-blue-50 border-primary' : 'bg-gray-50'
                  }`}>
                    <h3 className={`text-lg font-semibold ${
                      isSelected(spec.name) ? 'text-primary' : 'text-gray-800'
                    }`}>
                      {spec.name}
                    </h3>
                    <p className="text-sm text-gray-600">{spec.description}</p>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-2 text-sm">
                      {highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 text-xs text-gray-500">
                      Cost Factor: <span className="font-semibold">{spec.partitions.costFactor.toFixed(1)}x</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Determine which sections to show based on the scope
  const renderSpecificationSections = () => {
    if (state.budget?.scope === 'Fitout') {
      return renderSpecificationSection('Fitout');
    } else if (state.budget?.scope === 'Furniture') {
      return renderSpecificationSection('Furniture');
    } else {
      // For 'Both' scope, show both sections with a separator between them
      return (
        <>
          <div className="mb-2 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> For "Complete Package" projects, you can select different quality levels for fitout construction and furniture elements.
            </p>
          </div>
          
          {renderSpecificationSection('Fitout')}
          
          <Separator className="my-8" />
          
          {renderSpecificationSection('Furniture')}
        </>
      );
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Specification Selection</h2>
      <p className="text-gray-600 mb-6">Choose the quality level for your project based on industry Design Standards.</p>
      
      {renderSpecificationSections()}
      
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onBack}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back: Scope Selection
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
            Next: Layout Determination
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpecificationStep;
