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
  const { state, updateSpecification, updateTTComponentSpecs } = useBudget();
  const [specifications, setSpecifications] = useState<SpecificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Track specifications separately for fitout, furniture, and technology
  const [selectedFitoutSpec, setSelectedFitoutSpec] = useState<string>(
    state.budget?.fitoutSpecification || state.budget?.specification || ''
  );
  const [selectedFurnitureSpec, setSelectedFurnitureSpec] = useState<string>(
    state.budget?.furnitureSpecification || state.budget?.specification || ''
  );
  const [selectedTechnologySpec, setSelectedTechnologySpec] = useState<string>(
    state.budget?.technologySpecification || state.budget?.specification || ''
  );

  // Track T&T component-specific specifications
  const [ttSpecifications, setTTSpecifications] = useState({
    construction: state.budget?.specification || '',
    looseFurniture: state.budget?.specification || '',
    audioVisual: state.budget?.specification || '',
    professionalFees: state.budget?.specification || ''
  });

  // Determine if we need to show both specification sections
  const showBothSections = state.budget?.scope === 'Both';

  useEffect(() => {
    const fetchSpecifications = async () => {
      try {
        setLoading(true);
        // Clear any existing specifications before loading new ones
        setSpecifications([]);
        
        // Pass data source parameter to get correct specifications
        const dataSource = state.budget?.primaryDataSource || 'CBRE';
        const res = await apiRequest('GET', `/api/specifications?dataSource=${dataSource}`, undefined);
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
            name: 'Low (Bronze)',
            description: "Standard specification with potential for future customization",
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
            name: 'Medium (Silver)',
            description: "Budget-conscious upgrade with more features and higher-grade materials",
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
            name: 'High (Gold)',
            description: "Agile, personalized, high-tech with premium finishes",
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

  const handleSelectTechnologySpecification = (specName: string) => {
    setSelectedTechnologySpec(specName);
  };

  const handleNext = () => {
    // For T&T data source, validate component-specific specifications
    if (state.budget?.primaryDataSource === 'TT') {
      // Get relevant components based on scope
      const requiredComponents = [];
      if (state.budget?.scope === 'Construction') {
        requiredComponents.push('construction');
      } else if (state.budget?.scope === 'LooseFurniture') {
        requiredComponents.push('looseFurniture');
      } else if (state.budget?.scope === 'AudioVisual') {
        requiredComponents.push('audioVisual');
      } else if (state.budget?.scope === 'ProfessionalFees') {
        requiredComponents.push('professionalFees');
      } else {
        // Complete package requires all components
        requiredComponents.push('construction', 'looseFurniture', 'audioVisual', 'professionalFees');
      }

      // Validate that all required components have specifications
      const missingSpecs = requiredComponents.filter(comp => !ttSpecifications[comp as keyof typeof ttSpecifications]);
      if (missingSpecs.length > 0) {
        toast({
          title: "Specification selection required",
          description: `Please select specifications for all components: ${missingSpecs.join(', ')}.`,
          variant: "destructive",
        });
        return;
      }

      // Store T&T component specifications in the budget context
      // For backward compatibility, use construction spec as main specification
      const mainSpec = ttSpecifications.construction || Object.values(ttSpecifications).find(s => s) || '';
      updateSpecification(mainSpec, mainSpec, mainSpec);
      
      // Store component-specific specs in budget context
      updateTTComponentSpecs(ttSpecifications);
      
      onNext();
      return;
    }

    // Original CBRE/other data source validation
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
    
    if (state.budget?.scope === 'AudioVisual' && !selectedTechnologySpec) {
      toast({
        title: "Specification selection required",
        description: "Please select a technology specification level before continuing.",
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
    
    if (state.budget?.scope === 'Complete' && (!selectedFitoutSpec || !selectedFurnitureSpec || !selectedTechnologySpec)) {
      toast({
        title: "Specification selections required",
        description: "Please select fitout, furniture, and technology specification levels before continuing.",
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
    } else if (state.budget?.scope === 'AudioVisual') {
      updateSpecification(selectedTechnologySpec, null, null, selectedTechnologySpec);
    } else if (state.budget?.scope === 'Complete') {
      // For Complete scope, we need all three specifications
      // Use fitout spec as the main specification for backward compatibility
      updateSpecification(selectedFitoutSpec, selectedFitoutSpec, selectedFurnitureSpec, selectedTechnologySpec);
    } else {
      // For 'Both' scope, we need to update both specifications
      // For backward compatibility, use fitout spec as the main specification
      updateSpecification(selectedFitoutSpec, selectedFitoutSpec, selectedFurnitureSpec);
    }
    
    onNext();
  };

  // Render technology specification section
  const renderTechnologySpecificationSection = () => {
    const sectionTitle = "Technology Specification";
    const sectionDescription = "Choose the quality level for your technology and audio-visual systems.";
    
    const getTechnologyHighlights = (spec: SpecificationData) => {
      return [
        spec.technology.av,
        spec.technology.security,
        "Network infrastructure",
        "Integration capabilities",
        "Support and maintenance"
      ];
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
              const highlights = getTechnologyHighlights(spec);
              
              return (
                <div
                  key={`technology-${spec.name}`}
                  className={`border rounded-lg overflow-hidden hover:shadow-md cursor-pointer transition-shadow ${
                    selectedTechnologySpec === spec.name ? 'border-primary shadow-sm' : ''
                  }`}
                  onClick={() => handleSelectTechnologySpecification(spec.name)}
                >
                  <div className={`p-4 border-b ${
                    selectedTechnologySpec === spec.name ? 'bg-blue-50 border-primary' : 'bg-gray-50'
                  }`}>
                    <h3 className={`text-lg font-semibold ${
                      selectedTechnologySpec === spec.name ? 'text-primary' : 'text-gray-800'
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
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Professional Fees section (no specifications, just informational)
  const renderProfessionalFeesSection = () => {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-medium text-primary mb-2">Professional Fees</h3>
        <p className="text-gray-600 mb-4">Professional fees are calculated as a percentage of other components.</p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-800">
              Professional fees (12% of fitout + furniture + technology costs) include:
            </span>
          </div>
          <ul className="mt-2 ml-7 space-y-1 text-sm text-blue-700">
            <li>• Design and project management</li>
            <li>• Cost consulting services</li>
            <li>• Technical specifications</li>
            <li>• Contract administration</li>
          </ul>
        </div>
      </div>
    );
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
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Handle T&T component specification changes
  const handleTTSpecificationChange = (component: keyof typeof ttSpecifications, spec: string) => {
    setTTSpecifications(prev => ({
      ...prev,
      [component]: spec
    }));
  };

  // Render T&T component-specific specification selection
  const renderTTSpecificationSection = () => {
    const componentsConfig = [
      {
        key: 'construction' as const,
        title: 'Construction',
        description: 'Partitions, walls, floors, ceilings, mechanical, electrical',
        icon: '🏗️'
      },
      {
        key: 'looseFurniture' as const,
        title: 'Loose Furniture',
        description: 'Desks, chairs, workstations, storage, soft seating',
        icon: '🪑'
      },
      {
        key: 'audioVisual' as const,
        title: 'Audio-Visual',
        description: 'Display screens, conferencing systems, AV equipment',
        icon: '📺'
      },
      {
        key: 'professionalFees' as const,
        title: 'Professional Fees',
        description: 'Design, project management, cost consulting',
        icon: '👔'
      }
    ];

    // Filter components based on selected scope
    const relevantComponents = componentsConfig.filter(comp => {
      if (state.budget?.scope === 'Construction') return comp.key === 'construction';
      if (state.budget?.scope === 'LooseFurniture') return comp.key === 'looseFurniture';
      if (state.budget?.scope === 'AudioVisual') return comp.key === 'audioVisual';
      if (state.budget?.scope === 'ProfessionalFees') return comp.key === 'professionalFees';
      return true; // Show all for Complete package
    });

    return (
      <div>
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Turner & Townsend Specification:</strong> Select quality levels for each component in your {state.budget?.scope} scope.
          </p>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Component Specification Levels</h3>
        <p className="text-gray-600 mb-6">Choose the quality level for each project component independently.</p>
        
        <div className="space-y-6">
          {relevantComponents.map((component) => (
            <div key={component.key} className="border rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">{component.icon}</span>
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">{component.title}</h4>
                  <p className="text-sm text-gray-600">{component.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {specifications.map((spec) => (
                  <div
                    key={spec.name}
                    className={`border rounded-md p-3 cursor-pointer transition-all ${
                      ttSpecifications[component.key] === spec.name
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTTSpecificationChange(component.key, spec.name)}
                  >
                    <div className="flex items-center mb-2">
                      <div className={`w-3 h-3 rounded-full border-2 mr-2 ${
                        ttSpecifications[component.key] === spec.name
                          ? 'border-primary bg-primary'
                          : 'border-gray-300'
                      }`}>
                        {ttSpecifications[component.key] === spec.name && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        ttSpecifications[component.key] === spec.name ? 'text-primary' : 'text-gray-800'
                      }`}>
                        {spec.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{spec.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Determine which sections to show based on the data source and scope
  const renderSpecificationSections = () => {
    // For T&T data source, show single specification selection
    if (state.budget?.primaryDataSource === 'TT') {
      return renderTTSpecificationSection();
    }
    
    // For other data sources, use original logic
    if (state.budget?.scope === 'Fitout') {
      return renderSpecificationSection('Fitout');
    } else if (state.budget?.scope === 'Furniture') {
      return renderSpecificationSection('Furniture');
    } else if (state.budget?.scope === 'Technology') {
      return renderTechnologySpecificationSection();
    } else if (state.budget?.scope === 'AudioVisual') {
      return renderTechnologySpecificationSection();
    } else if (state.budget?.scope === 'Complete') {
      // For Complete Package, show all three sections
      return (
        <>
          <div className="mb-2 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> For "Complete Package" projects, you can select different quality levels for each component.
            </p>
          </div>
          
          {renderSpecificationSection('Fitout')}
          
          <Separator className="my-8" />
          
          {renderSpecificationSection('Furniture')}
          
          <Separator className="my-8" />
          
          {renderTechnologySpecificationSection()}
          
          <Separator className="my-8" />
          
          {renderProfessionalFeesSection()}
        </>
      );
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
            {state.budget?.primaryDataSource === 'TT' ? 'Next: Budget Results' : 'Next: Layout Determination'}
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
