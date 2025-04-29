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
import { useToast } from '@/hooks/use-toast';

type Step = 'project' | 'datasource' | 'scope' | 'specification' | 'layout' | 'jllOptions' | 'space' | 'results';

const BudgetWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('project');
  const { state, saveBudget, updateDataSource, updateJllOptions } = useBudget();
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
    { id: 'project', title: 'Project Setup', description: 'Basic project information' },
    { id: 'datasource', title: 'Data Source', description: 'Select cost data source' },
    { id: 'scope', title: 'Scope Selection', description: 'Choose budget scope' },
    { id: 'specification', title: 'Specification', description: 'Select quality level' },
    { id: 'layout', title: 'Layout', description: 'Select space layout' },
    { id: 'jllOptions', title: 'JLL Options', description: 'JLL-specific configuration' },
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
    } else {
      // For other data sources, use standard steps without JLL options
      const standardSteps = initialSteps.filter(step => step.id !== 'jllOptions');
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
      
      {/* Wizard Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
            
            return (
              <div key={step.id} className="flex-1 relative">
                <div className="flex items-center">
                  <div 
                    className={`z-10 flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                      isActive || isCompleted 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="hidden md:block ml-3">
                    <p className={`text-sm font-medium ${
                      isActive || isCompleted ? 'text-primary' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div 
                    className={`absolute top-5 left-0 w-full h-0.5 ${
                      isCompleted ? 'bg-primary' : 'bg-gray-300'
                    }`} 
                  />
                )}
                {index === steps.length - 1 && (
                  <div 
                    className={`absolute top-5 left-0 w-1/2 h-0.5 ${
                      isCompleted ? 'bg-primary' : 'bg-gray-300'
                    }`} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current Step Content */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default BudgetWizard;
