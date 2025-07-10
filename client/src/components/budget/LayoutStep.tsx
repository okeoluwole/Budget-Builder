import React, { useState } from 'react';
import { useBudget } from '@/contexts/BudgetContext';

interface LayoutStepProps {
  onNext: () => void;
  onBack: () => void;
  onSaveAsDraft: () => Promise<void>;
}

const LayoutStep: React.FC<LayoutStepProps> = ({ onNext, onBack, onSaveAsDraft }) => {
  const { state, updateLayout } = useBudget();
  const [selectedLayout, setSelectedLayout] = useState<string>(state.budget?.layout || 'Activity');

  const layoutOptions = [
    {
      id: 'Activity',
      name: 'Activity-Based Working',
      description: 'Open and flexible workspace design with varied activity zones',
      details: [
        'Open plan with diverse work settings',
        'Hot-desking and flexible seating',
        'Collaboration zones and quiet areas',
        'Mobile technology integration'
      ],
      suitableFor: 'Modern offices promoting collaboration and flexibility'
    },
    {
      id: 'Team',
      name: 'Team-Based Working',
      description: 'Structured team spaces with dedicated areas for each group',
      details: [
        'Dedicated team zones',
        'Team-specific meeting rooms',
        'Shared team storage',
        'Clear team boundaries'
      ],
      suitableFor: 'Organizations with stable team structures'
    },
    {
      id: 'Event',
      name: 'Event & Meeting Spaces',
      description: 'Conference and event facilities with high-specification fit-out',
      details: [
        'Large conference rooms',
        'Event spaces and auditoriums',
        'High-end AV equipment',
        'Flexible room configurations'
      ],
      suitableFor: 'Conference centers and corporate headquarters'
    }
  ];

  const handleNext = () => {
    updateLayout(selectedLayout);
    onNext();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Layout Selection</h2>
      <p className="text-gray-600 mb-6">
        Choose the workspace layout that best matches your project. This determines which cost data will be used for calculations.
      </p>

      <div className="space-y-4">
        {layoutOptions.map((layout) => (
          <div
            key={layout.id}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              selectedLayout === layout.id
                ? 'border-primary bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => setSelectedLayout(layout.id)}
          >
            <div className="flex items-start">
              <div className={`w-5 h-5 rounded-full border-2 mr-4 mt-1 flex-shrink-0 ${
                selectedLayout === layout.id
                  ? 'border-primary bg-primary'
                  : 'border-gray-300'
              }`}>
                {selectedLayout === layout.id && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${
                  selectedLayout === layout.id ? 'text-primary' : 'text-gray-800'
                }`}>
                  {layout.name}
                </h3>
                
                <p className="text-gray-600 mb-4">{layout.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Key Features:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {layout.details.map((detail, index) => (
                        <li key={index} className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Best Suited For:</h4>
                    <p className="text-sm text-gray-600">{layout.suitableFor}</p>
                  </div>
                </div>
              </div>
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
          Back: Specification
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

export default LayoutStep;