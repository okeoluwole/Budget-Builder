import React, { useState } from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { useToast } from '@/hooks/use-toast';
import { BudgetScope } from '@shared/schema';
import { Construction, Armchair, Monitor, UserCheck, Package } from 'lucide-react';

interface ScopeSelectionStepProps {
  onNext: () => void;
  onBack: () => void;
  onSaveAsDraft: () => Promise<void>;
}

const ScopeSelectionStep: React.FC<ScopeSelectionStepProps> = ({ onNext, onBack, onSaveAsDraft }) => {
  const { state, updateScope } = useBudget();
  const { toast } = useToast();
  const [selectedScope, setSelectedScope] = useState<BudgetScope>(state.budget?.scope as BudgetScope || 'Fitout');

  const handleSelectScope = (scope: BudgetScope) => {
    setSelectedScope(scope);
  };

  const handleNext = () => {
    if (!selectedScope) {
      toast({
        title: "Selection required",
        description: "Please select a budget scope before continuing.",
        variant: "destructive",
      });
      return;
    }

    updateScope(selectedScope);
    onNext();
  };

  // Define scope options based on data source
  const getTTScopeOptions = () => [
    {
      value: 'Construction',
      title: 'Construction Only',
      description: 'Core construction elements and permanently installed components only.',
      icon: <Construction className="h-8 w-8 text-blue-500" />,
      benefits: [
        'Partitions, walls, floors and ceilings',
        'Basic mechanical and electrical works',
        'Lighting and HVAC systems',
        'Excludes furniture and AV equipment'
      ]
    },
    {
      value: 'LooseFurniture',
      title: 'Loose Furniture Only',
      description: 'Standalone furniture, fixtures and equipment only.',
      icon: <Armchair className="h-8 w-8 text-orange-500" />,
      benefits: [
        'Desks, chairs and workstations',
        'Meeting room furniture',
        'Storage and filing systems',
        'Soft seating and lounge items'
      ]
    },
    {
      value: 'AudioVisual',
      title: 'Audio-Visual Only',
      description: 'Technology and AV systems only.',
      icon: <Monitor className="h-8 w-8 text-purple-500" />,
      benefits: [
        'Display screens and monitors',
        'Audio conferencing systems',
        'Video conferencing equipment',
        'Control systems and cabling'
      ]
    },
    {
      value: 'ProfessionalFees',
      title: 'Professional Fees Only',
      description: 'Project management and professional services only.',
      icon: <UserCheck className="h-8 w-8 text-indigo-500" />,
      benefits: [
        'Design and project management',
        'Cost consulting services',
        'Technical specifications',
        'Contract administration'
      ]
    },
    {
      value: 'Complete',
      title: 'Complete Package',
      description: 'Comprehensive budget including all T&T cost components.',
      icon: <Package className="h-8 w-8 text-green-500" />,
      benefits: [
        'All construction elements',
        'All furniture and fixtures',
        'All audio-visual systems',
        'All professional fees'
      ]
    }
  ];

  const getCBREScopeOptions = () => [
    {
      value: 'Fitout',
      title: 'Fitout Only',
      description: 'Construction elements and permanently installed components only.',
      icon: <Construction className="h-8 w-8 text-blue-500" />,
      benefits: [
        'Focus exclusively on construction elements',
        'Includes partitions, walls, floors and ceilings',
        'Excludes furniture, fixtures and equipment',
        'Ideal for shell-and-core projects'
      ]
    },
    {
      value: 'Furniture',
      title: 'Furniture Only',
      description: 'Standalone furniture, fixtures and equipment only.',
      icon: <Armchair className="h-8 w-8 text-orange-500" />,
      benefits: [
        'Focus exclusively on movable items',
        'Includes desks, chairs and workstations',
        'Includes soft seating and conference room furniture',
        'Ideal for tenant improvement projects'
      ]
    },
    {
      value: 'Both',
      title: 'Complete Package',
      description: 'Comprehensive budget including both fitout construction and furniture components.',
      icon: <Package className="h-8 w-8 text-green-500" />,
      benefits: [
        'Comprehensive total project cost',
        'Includes both construction and movable items',
        'Separate specifications for each component',
        'Most suitable for full office refresh projects'
      ]
    }
  ];

  // Get scope options based on selected data source
  const dataSource = state.budget?.primaryDataSource;
  const scopeOptions = dataSource === 'TT' ? getTTScopeOptions() : getCBREScopeOptions();

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Budget Scope Selection</h2>
      <p className="text-gray-600 mb-6">
        Select the scope of your budget. This will determine which components are included in your estimate.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scopeOptions.map((option) => (
          <div
            key={option.value}
            className={`border rounded-lg overflow-hidden hover:shadow-md cursor-pointer transition-shadow ${
              selectedScope === option.value ? 'border-primary shadow-sm' : ''
            }`}
            onClick={() => handleSelectScope(option.value as BudgetScope)}
          >
            <div className={`p-4 border-b ${
              selectedScope === option.value ? 'bg-blue-50 border-primary' : 'bg-gray-50'
            }`}>
              <div className="flex items-center">
                <div className="mr-3">
                  {option.icon}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    selectedScope === option.value ? 'text-primary' : 'text-gray-800'
                  }`}>
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Includes:</p>
              <ul className="space-y-2 text-sm">
                {option.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
            onClick={handleNext}
          >
            Next: Specification
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScopeSelectionStep;