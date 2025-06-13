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
import BreadcrumbNavigation from './BreadcrumbNavigation';
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
  | 'ttBuildingType'
  | 'ttSpecification';

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
      // T&T uses consolidated location selection in project setup, then specification selection
      const ttSteps = initialSteps.filter(step => 
        step.id === 'project' || 
        step.id === 'datasource' || 
        step.id === 'scope' || 
        step.id === 'specification' || 
        step.id === 'results'
      );
      console.log('T&T selected - Using consolidated T&T steps:', ttSteps.map(s => s.id).join(' → '));
      setSteps(ttSteps);
    } else {
      // For other data sources, use standard steps without JLL or T&T specific options
      const standardSteps = initialSteps.filter(step => 
        step.id !== 'jllOptions' && 
        step.id !== 'ttBuildingType' &&
        step.id !== 'ttRegion' &&
        step.id !== 'ttCountry' &&
        step.id !== 'ttCity'
      );
      console.log('Standard data source - Using steps:', standardSteps.map(s => s.id).join(' → '));
      setSteps(standardSteps);
    }
  }, [selectedDataSource]);

  const goToNextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    

    
    // Standard step progression
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

      case 'space':
        return <SpaceAllocationStep onNext={goToNextStep} onBack={goToPreviousStep} onSaveAsDraft={handleSaveAsDraft} />;
      case 'results':
        return <BudgetResultsStep onFinish={handleFinish} onBack={goToPreviousStep} onSaveAsDraft={handleSaveAsDraft} />;
      default:
        return null;
    }
  };

  const currentStepInfo = steps.find(step => step.id === currentStep);
  const breadcrumbSteps = steps.map((step, index) => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    return {
      id: step.id,
      title: step.title,
      completed: currentIndex > index,
      current: step.id === currentStep,
      clickable: currentIndex > index // Only allow navigation to completed steps
    };
  });

  const handleBreadcrumbClick = (stepId: string) => {
    const targetStep = steps.find(step => step.id === stepId);
    if (targetStep) {
      setCurrentStep(stepId as Step);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <BreadcrumbNavigation 
        steps={breadcrumbSteps}
        onStepClick={handleBreadcrumbClick}
        title="Create New Budget Estimate"
        subtitle="Complete all steps to generate your fit-out budget estimation"
        currentStepTitle={currentStepInfo?.title || ''}
        currentStepDescription={currentStepInfo?.description || ''}
      />
      
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
