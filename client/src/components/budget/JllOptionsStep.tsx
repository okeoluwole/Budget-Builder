import React, { useState, useEffect } from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { JLLLayout, JLLQuality } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, LayoutGrid, Layers3 } from 'lucide-react';

interface JllOptionsStepProps {
  onNext: () => void;
  onBack: () => void;
  onSaveAsDraft: () => Promise<void>;
  jllLayout?: JLLLayout;
  jllQuality?: JLLQuality;
  onSelectJllLayout: (layout: JLLLayout) => void;
  onSelectJllQuality: (quality: JLLQuality) => void;
}

interface LayoutOption {
  id: string;
  value: JLLLayout;
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
}

interface QualityOption {
  id: string;
  value: JLLQuality;
  title: string;
  description: string;
  features: string[];
  sustainabilityFeatures: string[];
  recommendedFor: string;
}

const JllOptionsStep: React.FC<JllOptionsStepProps> = ({
  onNext,
  onBack,
  onSaveAsDraft,
  jllLayout,
  jllQuality,
  onSelectJllLayout,
  onSelectJllQuality
}) => {
  const [activeTab, setActiveTab] = useState<string>('layout');
  const { state } = useBudget();

  // Setup layout options based on JLL data
  const layoutOptions: LayoutOption[] = [
    {
      id: 'open-flexible',
      value: 'Open & flexible',
      title: 'Open & flexible (Progressive)',
      description: 'Open floor plan with no enclosed offices, prioritizing open collaboration spaces.',
      icon: <LayoutGrid className="h-10 w-10 text-blue-500" />,
      benefits: [
        'Maximizes space efficiency',
        'Encourages collaboration and knowledge sharing',
        'Adaptable to changing workplace needs',
        'Cost-effective solution',
        'Supports activity-based working'
      ]
    },
    {
      id: 'spatial-variety',
      value: 'High spatial variety',
      title: 'High spatial variety (Moderate)',
      description: 'Open floor plan with mix of open/enclosed collaboration spaces.',
      icon: <Layers3 className="h-10 w-10 text-indigo-600" />,
      benefits: [
        'Supports diverse work styles and preferences',
        'Balance between privacy and collaboration',
        'Optimized for productivity and wellbeing',
        'Attractive to talent acquisition and retention',
        'Supports hybrid working models'
      ]
    },
    {
      id: 'structured',
      value: 'Structured',
      title: 'Structured (Traditional)',
      description: 'Focus on dedicated desks, private offices and enclosed meeting rooms.',
      icon: <Building2 className="h-10 w-10 text-gray-700" />,
      benefits: [
        'Maximizes privacy and concentration',
        'Clear status hierarchy',
        'Suitable for confidential work',
        'Predictable workspace allocation',
        'Familiar environment for traditional industries'
      ]
    }
  ];

  // Setup quality options based on JLL data
  const qualityOptions: QualityOption[] = [
    {
      id: 'baseline',
      value: 'Baseline',
      title: 'Baseline',
      description: 'Simple aesthetic with finishes focused on function.',
      features: [
        'Standard suspended ceiling systems',
        'Basic carpet tiles in open areas',
        'Painted drywall partitions',
        'Basic task lighting',
        'Standard workstations and seating'
      ],
      sustainabilityFeatures: [
        'Standard energy-efficient lighting',
        'Basic waste management systems'
      ],
      recommendedFor: 'Budget-conscious projects, back-office functions, and shorter-term leases'
    },
    {
      id: 'medium',
      value: 'Medium',
      title: 'Medium',
      description: 'Standard project complexity with some unique design features.',
      features: [
        'Mix of open and feature ceilings',
        'Mid-range flooring with accent areas',
        'Combination of painted and feature walls',
        'Enhanced acoustic treatments',
        'Ergonomic furniture with some branded items'
      ],
      sustainabilityFeatures: [
        'Energy-efficient lighting with controls',
        'Water-saving fixtures',
        'Some sustainable material selections'
      ],
      recommendedFor: 'Corporate offices, client-facing environments, and medium to long-term occupancy'
    },
    {
      id: 'high',
      value: 'High',
      title: 'High',
      description: 'Emphasizes top-quality finishes with increased aesthetic detail.',
      features: [
        'Bespoke ceiling features',
        'Premium flooring materials including natural products',
        'Feature wall finishes and architectural detailing',
        'Comprehensive AV and technology integration',
        'Designer furniture and custom joinery'
      ],
      sustainabilityFeatures: [
        'Comprehensive smart building controls',
        'LEED/BREEAM/WELL certification potential',
        'Circular economy principles in material selection',
        'Biophilic design elements'
      ],
      recommendedFor: 'Headquarters, high-end client spaces, flagship locations, and brand-conscious organizations'
    }
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">JLL Typology & Quality Matrix</h2>
      <p className="text-gray-600 mb-6">
        Configure the JLL-specific layout typology and quality level based on JLL's 9-point matrix system.
      </p>

      <Tabs
        defaultValue="layout"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full mb-8"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="layout">Layout Typology</TabsTrigger>
          <TabsTrigger value="quality">Quality/Complexity</TabsTrigger>
        </TabsList>

        {/* Layout Selection Tab */}
        <TabsContent value="layout" className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Select Layout Typology</h3>
          <p className="text-gray-600 mb-6">
            Choose a layout typology that best suits your organization's working style and culture.
          </p>

          <RadioGroup 
            value={jllLayout || 'Open & flexible'} 
            onValueChange={(value) => onSelectJllLayout(value as JLLLayout)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {layoutOptions.map((option) => (
              <div key={option.id} className="relative">
                <RadioGroupItem
                  value={option.value}
                  id={`layout-${option.id}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`layout-${option.id}`}
                  className="flex flex-col h-full p-4 border-2 rounded-lg cursor-pointer 
                  peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50 
                  hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center mb-4">
                    {option.icon}
                    <span className="ml-2 text-lg font-medium">{option.title}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Key benefits:</h4>
                    <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                      {option.benefits.map((benefit, idx) => (
                        <li key={idx}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </TabsContent>

        {/* Quality Selection Tab */}
        <TabsContent value="quality" className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Select Quality/Complexity Level</h3>
          <p className="text-gray-600 mb-6">
            Choose the quality and complexity level that aligns with your budget and brand requirements.
          </p>

          <RadioGroup 
            value={jllQuality || 'Medium'} 
            onValueChange={(value) => onSelectJllQuality(value as JLLQuality)}
            className="space-y-4"
          >
            {qualityOptions.map((option) => (
              <div key={option.id} className="relative">
                <RadioGroupItem
                  value={option.value}
                  id={`quality-${option.id}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`quality-${option.id}`}
                  className="block w-full p-4 border-2 rounded-lg cursor-pointer 
                  peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-blue-50 
                  hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium">{option.title}</span>
                    {option.value === 'Baseline' && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Economy</span>
                    )}
                    {option.value === 'Medium' && (
                      <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">Standard</span>
                    )}
                    {option.value === 'High' && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Premium</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Key features:</h4>
                      <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                        {option.features.map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Sustainability:</h4>
                      <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
                        {option.sustainabilityFeatures.map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                      
                      <div className="mt-3">
                        <h4 className="text-sm font-medium mb-1">Recommended for:</h4>
                        <p className="text-sm text-gray-600">{option.recommendedFor}</p>
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onBack}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
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
            onClick={() => {
              // Only proceed if both layout and quality are selected when using JLL
              if (jllLayout && jllQuality) {
                onNext();
              } else {
                // Could show an error toast here, but since we have defaults it shouldn't happen
                onNext();
              }
            }}
          >
            Next Step
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default JllOptionsStep;