import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useBudget } from '@/contexts/BudgetContext';
import { DataSourceType, JLLLayout, JLLQuality } from '@shared/schema';
import ProjectSetupStep from './ProjectSetupStep';
import DataSourceStep from './DataSourceStep';
import ScopeSelectionStep from './ScopeSelectionStep';
import SpecificationStep from './SpecificationStep';
import LayoutStep from './LayoutStep';
import SpaceAllocationStep from './SpaceAllocationStep';
import BudgetResultsStep from './BudgetResultsStep';
import JllOptionsStep from './JllOptionsStep';
import TTRegionSelectionStep from './TTRegionSelectionStep';
import TTCountrySelectionStep from './TTCountrySelectionStep';
import TTCitySelectionStep from './TTCitySelectionStep';
import TTBuildingTypeStep from './TTBuildingTypeStep';
import { useToast } from '@/hooks/use-toast';
import { TTRegion, TTBuildingType } from '@/utils/turnerTownsendData';

type Step = 
  | 'project' 
  | 'datasource' 
  | 'scope' 
  | 'specification' 
  | 'layout' 
  | 'jllOptions' 
  | 'space' 
  | 'results'
  | 'ttRegion'
  | 'ttCountry'
  | 'ttCity'
  | 'ttBuildingType';

const BudgetWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('datasource');
  const { state, saveBudget, updateDataSource, updateJllOptions, updateTTOptions } = useBudget();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceType>(
    state.budget?.primaryDataSource || 'CBRE'
  );
  const [enableComparison, setEnableComparison] = useState<boolean>(
    state.budget?.isComparisonEnabled || false
  );
  const [comparisonSources, setComparisonSources] = useState<DataSourceType[]>(
    state.budget?.comparisonSources || []
  );

  // Define initial steps array
  const initialSteps: { id: Step; title: string; description: string }[] = [
    { id: 'datasource', title: 'Data Source', description: 'Select cost data source' },
    { id: 'project', title: 'Project Setup', description: 'Basic project information' },
    { id: 'scope', title: 'Scope Selection', description: 'Choose budget scope' },
    { id: 'specification', title: 'Specification', description: 'Select quality level' },
    { id: 'layout', title: 'Layout', description: 'Select space layout' },
    { id: 'jllOptions', title: 'JLL Options', description: 'JLL-specific configuration' },
    { id: 'ttRegion', title: 'T&T Region', description: 'Select global region' },
    { id: 'ttCountry', title: 'T&T Country', description: 'Select country' },
    { id: 'ttCity', title: 'T&T City', description: 'Select city' },
    { id: 'ttBuildingType', title: 'T&T Building Type', description: 'Select building type' },
    { id: 'space', title: 'Space Allocation', description: 'Define space usage' },
    { id: 'results', title: 'Budget Results', description: 'Review and export' },
  ];
  
  // Filter steps based on selected data source
  const [steps, setSteps] = useState(initialSteps);
  
  // Update steps whenever data source changes
  useEffect(() => {
    console.log('Data source changed to:', selectedDataSource);
    
    if (selectedDataSource === 'JLL') {
      // JLL uses its own options, and we skip the space allocation step per client request
      const jllSteps = initialSteps.filter(step => 
        step.id === 'project' || 
        step.id === 'datasource' || 
        step.id === 'scope' || 
        step.id === 'jllOptions' || 
        step.id === 'results'
      );
      console.log('JLL selected - Using JLL steps:', jllSteps.map(s => s.id).join(' → '));
      setSteps(jllSteps);
    } else if (selectedDataSource === 'TT') {
      // T&T uses its own region-country-city-building selection flow
      const ttSteps = initialSteps.filter(step => 
        step.id === 'project' || 
        step.id === 'datasource' || 
        step.id === 'scope' || 
        step.id === 'ttRegion' || 
        step.id === 'ttCountry' || 
        step.id === 'ttCity' || 
        step.id === 'ttBuildingType' || 
        step.id === 'results'
      );
      console.log('T&T selected - Using T&T steps:', ttSteps.map(s => s.id).join(' → '));
      setSteps(ttSteps);
    } else {
      // For other data sources, use standard steps without JLL options
      const standardSteps = initialSteps.filter(step => 
        step.id !== 'jllOptions' && 
        step.id !== 'ttRegion' && 
        step.id !== 'ttCountry' && 
        step.id !== 'ttCity' && 
        step.id !== 'ttBuildingType'
      );
      console.log('Standard data source - Using steps:', standardSteps.map(s => s.id).join(' → '));
      setSteps(standardSteps);
    }
  }, [selectedDataSource]);

  const goToNextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      await saveBudget();
      toast({
        title: "Budget saved",
        description: "Your budget has been saved as a draft.",
      });
    } catch (error) {
      toast({
        title: "Error saving budget",
        description: "There was an error saving your budget. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFinish = async () => {
    try {
      await saveBudget('completed');
      toast({
        title: "Budget completed",
        description: "Your budget has been successfully created.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error completing budget",
        description: "There was an error completing your budget. Please try again.",
        variant: "destructive",
      });
    }
  };

  // State for JLL options
  const [jllLayout, setJllLayout] = useState<JLLLayout>(state.budget?.jllLayout || 'Open & flexible');
  const [jllQuality, setJllQuality] = useState<JLLQuality>(state.budget?.jllQuality || 'Medium');

  // For T&T options
  const [ttRegion, setTTRegion] = useState<TTRegion | undefined>(state.ttOptions?.region);
  const [ttCountry, setTTCountry] = useState<string | undefined>(state.ttOptions?.country);
  const [ttCity, setTTCity] = useState<string | undefined>(state.ttOptions?.city);
  const [ttBuildingType, setTTBuildingType] = useState<TTBuildingType | undefined>(state.ttOptions?.buildingType);
  const [ttApplyInflation, setTTApplyInflation] = useState<boolean>(state.ttOptions?.applyInflation || false);
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 'project':
        return <ProjectSetupStep onNext={goToNextStep} onBack={goToPreviousStep} onSaveAsDraft={handleSaveAsDraft} />;
      case 'datasource':
        return (
          <DataSourceStep 
            onNext={goToNextStep} 
            onBack={goToPreviousStep} 
            onSaveAsDraft={handleSaveAsDraft}
            selectedDataSource={selectedDataSource}
            onSelectDataSource={(dataSource) => {
              setSelectedDataSource(dataSource);
              updateDataSource(dataSource, enableComparison);
            }}
            enableComparison={enableComparison}
            onToggleComparison={(enable) => {
              setEnableComparison(enable);
              updateDataSource(selectedDataSource, enable, comparisonSources);
            }}
            comparisonSources={comparisonSources}
            onUpdateComparisonSources={(sources) => {
              setComparisonSources(sources);
              updateDataSource(selectedDataSource, enableComparison, sources);
            }}
          />
        );
      case 'scope':
        return <ScopeSelectionStep onNext={goToNextStep} onBack={goToPreviousStep} onSaveAsDraft={handleSaveAsDraft} />;
      case 'specification':
        return <SpecificationStep onNext={goToNextStep} onBack={goToPreviousStep} onSaveAsDraft={handleSaveAsDraft} />;
      case 'layout':
        return <LayoutStep onNext={goToNextStep} onBack={goToPreviousStep} onSaveAsDraft={handleSaveAsDraft} />;
      case 'jllOptions':
        return (
          <JllOptionsStep 
            onNext={goToNextStep} 
            onBack={goToPreviousStep} 
            onSaveAsDraft={handleSaveAsDraft}
            jllLayout={jllLayout}
            jllQuality={jllQuality}
            onSelectJllLayout={(layout) => {
              setJllLayout(layout);
              updateJllOptions(layout, jllQuality);
            }}
            onSelectJllQuality={(quality) => {
              setJllQuality(quality);
              updateJllOptions(jllLayout, quality);
            }}
          />
        );
      case 'ttRegion':
        return (
          <TTRegionSelectionStep 
            onNext={goToNextStep} 
            onBack={goToPreviousStep} 
            onSaveAsDraft={handleSaveAsDraft}
          />
        );
      case 'ttCountry':
        return (
          <TTCountrySelectionStep 
            onNext={goToNextStep} 
            onBack={goToPreviousStep} 
            onSaveAsDraft={handleSaveAsDraft}
          />
        );
      case 'ttCity':
        return (
          <TTCitySelectionStep 
            onNext={goToNextStep} 
            onBack={goToPreviousStep} 
            onSaveAsDraft={handleSaveAsDraft}
          />
        );
      case 'ttBuildingType':
        return (
          <TTBuildingTypeStep 
            onNext={goToNextStep} 
            onBack={goToPreviousStep} 
            onSaveAsDraft={handleSaveAsDraft}
          />
        );
      case 'space':
        return <SpaceAllocationStep onNext={goToNextStep} onBack={goToPreviousStep} onSaveAsDraft={handleSaveAsDraft} />;
      case 'results':
        return <BudgetResultsStep onFinish={handleFinish} onBack={goToPreviousStep} onSaveAsDraft={handleSaveAsDraft} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Create New Budget Estimate</h1>
        <p className="text-gray-600 mt-1">Complete all steps to generate your fit-out budget estimation</p>
      </div>
      
      {/* Enhanced Wizard Progress */}
      <div className="mb-8">
        {/* Progress Summary */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <span>Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}</span>
            <span>{Math.round(((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const currentIndex = steps.findIndex(s => s.id === currentStep);
            const isActive = step.id === currentStep;
            const isCompleted = currentIndex > index;
            
            return (
              <div key={step.id} className="flex-1 relative">
                <div className="flex items-center">
                  <div 
                    className={`z-10 flex items-center justify-center w-12 h-12 rounded-full font-medium text-sm transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 text-white shadow-lg'
                        : isActive 
                        ? 'bg-primary text-white ring-4 ring-blue-100 shadow-lg scale-110' 
                        : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="hidden lg:block ml-4 flex-1">
                    <p className={`text-sm font-semibold transition-colors duration-200 ${
                      isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-tight">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute top-6 left-12 w-full h-1 transition-all duration-500 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} 
                    style={{ zIndex: 1 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current Step Content */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-8">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default BudgetWizard;
