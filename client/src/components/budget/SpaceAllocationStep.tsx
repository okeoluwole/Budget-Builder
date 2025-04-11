import React, { useEffect, useState } from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { SpaceAllocation } from '@shared/schema';
import { SPACE_TYPES } from '@/data/mockData';

interface SpaceAllocationStepProps {
  onNext: () => void;
  onBack: () => void;
  onSaveAsDraft: () => Promise<void>;
}

interface SpaceType {
  name: string;
  description: string;
  minPercentage: number;
  maxPercentage: number;
  defaultPercentage: number;
}

const SpaceAllocationStep: React.FC<SpaceAllocationStepProps> = ({ onNext, onBack, onSaveAsDraft }) => {
  const { state, updateSpaceAllocation } = useBudget();
  const { toast } = useToast();
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [spaceAllocation, setSpaceAllocation] = useState<SpaceAllocation>({});
  const [loading, setLoading] = useState(false);
  const [totalPercentage, setTotalPercentage] = useState(0);
  
  const layoutType = state.budget?.layout || '';
  const totalArea = state.project?.totalArea || 0;

  // Fetch space types based on selected layout
  useEffect(() => {
    if (!layoutType) return;

    const fetchLayoutDetails = async () => {
      try {
        setLoading(true);
        const res = await apiRequest('GET', `/api/layout-templates`, undefined);
        const layoutData = await res.json();
        
        const selectedLayout = layoutData.find((layout: any) => layout.name === layoutType);
        if (selectedLayout && selectedLayout.spaceTypes) {
          setSpaceTypes(selectedLayout.spaceTypes);
          
          // Initialize space allocation if not already set
          const initialAllocation: SpaceAllocation = {};
          selectedLayout.spaceTypes.forEach((type: SpaceType) => {
            initialAllocation[type.name] = {
              percentage: type.defaultPercentage,
              area: (type.defaultPercentage / 100) * totalArea
            };
          });
          
          // Use existing allocation from state or initialize new one
          if (state.budget?.spaceAllocation && Object.keys(state.budget.spaceAllocation).length > 0) {
            setSpaceAllocation(state.budget.spaceAllocation as SpaceAllocation);
          } else {
            setSpaceAllocation(initialAllocation);
          }
        }
      } catch (error) {
        console.error('Failed to fetch layout details:', error);
        toast({
          title: "Failed to load space types",
          description: "Using default space types. Some data may be missing.",
          variant: "destructive",
        });
        
        // Fallback to default space types
        const defaultTypes = SPACE_TYPES[layoutType as keyof typeof SPACE_TYPES] || [];
        const fallbackSpaceTypes = defaultTypes.map(type => ({
          name: type.name,
          description: `${type.name} space`,
          minPercentage: 5,
          maxPercentage: 60,
          defaultPercentage: type.defaultPercentage
        }));
        
        setSpaceTypes(fallbackSpaceTypes);
        
        // Initialize fallback allocation
        const fallbackAllocation: SpaceAllocation = {};
        fallbackSpaceTypes.forEach(type => {
          fallbackAllocation[type.name] = {
            percentage: type.defaultPercentage,
            area: (type.defaultPercentage / 100) * totalArea
          };
        });
        
        if (state.budget?.spaceAllocation && Object.keys(state.budget.spaceAllocation).length > 0) {
          setSpaceAllocation(state.budget.spaceAllocation as SpaceAllocation);
        } else {
          setSpaceAllocation(fallbackAllocation);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLayoutDetails();
  }, [layoutType, totalArea, state.budget?.spaceAllocation, toast]);
  
  // Calculate total percentage whenever allocation changes
  useEffect(() => {
    const total = Object.values(spaceAllocation).reduce(
      (sum, space) => sum + space.percentage, 
      0
    );
    setTotalPercentage(total);
  }, [spaceAllocation]);

  const handlePercentageChange = (spaceName: string, percentage: number) => {
    const newAllocation = { ...spaceAllocation };
    
    // Find space type for validation
    const spaceType = spaceTypes.find(type => type.name === spaceName);
    if (spaceType) {
      // Enforce min/max constraints
      let validatedPercentage = percentage;
      if (percentage < spaceType.minPercentage) {
        validatedPercentage = spaceType.minPercentage;
      } else if (percentage > spaceType.maxPercentage) {
        validatedPercentage = spaceType.maxPercentage;
      }
      
      newAllocation[spaceName] = {
        percentage: validatedPercentage,
        area: (validatedPercentage / 100) * totalArea
      };
      
      setSpaceAllocation(newAllocation);
    }
  };

  const handleNext = () => {
    // Validate total percentage is close to 100%
    if (totalPercentage < 98 || totalPercentage > 102) {
      toast({
        title: "Invalid allocation",
        description: `Total space allocation should be close to 100%. Current: ${totalPercentage.toFixed(1)}%`,
        variant: "destructive",
      });
      return;
    }
    
    // Normalize to exactly 100% if slightly off
    const normalizedAllocation = { ...spaceAllocation };
    const factor = 100 / totalPercentage;
    
    Object.keys(normalizedAllocation).forEach(key => {
      normalizedAllocation[key] = {
        percentage: normalizedAllocation[key].percentage * factor,
        area: (normalizedAllocation[key].percentage * factor / 100) * totalArea
      };
    });
    
    updateSpaceAllocation(normalizedAllocation);
    onNext();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Space Allocation</h2>
      <p className="text-gray-600 mb-6">
        Define how your space will be allocated across different usage types. 
        Total allocation should equal 100%.
      </p>
      
      {loading ? (
        <div className="text-center py-8">
          <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Loading space types...</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-md font-medium">Layout Type: <span className="text-primary">{layoutType} Based</span></h3>
              <p className="text-sm text-gray-500">Total Area: {totalArea.toLocaleString()} {state.project?.areaUnit}</p>
            </div>
            <div className={`text-md font-medium ${
              totalPercentage === 100 
                ? 'text-green-600' 
                : totalPercentage > 95 && totalPercentage < 105 
                  ? 'text-yellow-600' 
                  : 'text-red-600'
            }`}>
              Total: {totalPercentage.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <div className="text-sm font-medium text-gray-500">Space Type</div>
              <div className="text-sm font-medium text-gray-500">Percentage</div>
              <div className="text-sm font-medium text-gray-500">Area ({state.project?.areaUnit})</div>
            </div>
            
            {Object.keys(spaceAllocation).map((spaceName) => {
              const space = spaceAllocation[spaceName];
              const spaceType = spaceTypes.find(type => type.name === spaceName);
              
              return (
                <div key={spaceName} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-200 py-3">
                  <div>
                    <h4 className="font-medium">{spaceName}</h4>
                    {spaceType && (
                      <p className="text-xs text-gray-500">
                        Range: {spaceType.minPercentage}% - {spaceType.maxPercentage}%
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="range"
                      min={spaceType?.minPercentage || 0}
                      max={spaceType?.maxPercentage || 100}
                      value={space.percentage}
                      onChange={(e) => handlePercentageChange(spaceName, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-2 w-12 text-right">{space.percentage.toFixed(0)}%</span>
                  </div>
                  
                  <div className="text-base font-mono">
                    {space.area.toLocaleString(undefined, {maximumFractionDigits: 1})}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Visual representation */}
          <div className="h-8 w-full bg-gray-200 rounded-full overflow-hidden mb-6">
            {Object.entries(spaceAllocation).map(([name, space], index) => {
              // Different colors for different space types
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
              const colorClass = colors[index % colors.length];
              
              return (
                <div 
                  key={name}
                  className={`h-full ${colorClass} float-left`}
                  style={{ width: `${space.percentage}%` }}
                  title={`${name}: ${space.percentage.toFixed(1)}%`}
                />
              );
            })}
          </div>
          
          <div className="text-sm text-gray-500 mb-6">
            <p>
              Adjust the sliders to allocate your space. The percentages should sum to approximately 100%.
              Each space type has minimum and maximum recommended values based on the selected layout.
            </p>
          </div>
        </>
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
          Back: Layout Determination
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
            disabled={loading}
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

export default SpaceAllocationStep;
