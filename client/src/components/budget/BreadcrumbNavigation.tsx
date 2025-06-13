import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

interface BreadcrumbStep {
  id: string;
  title: string;
  completed: boolean;
  current: boolean;
  clickable: boolean;
}

interface BreadcrumbNavigationProps {
  steps: BreadcrumbStep[];
  onStepClick: (stepId: string) => void;
  title: string;
  subtitle: string;
  currentStepTitle: string;
  currentStepDescription: string;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  steps,
  onStepClick,
  title,
  subtitle,
  currentStepTitle,
  currentStepDescription,
}) => {
  return (
    <div className="mb-8">
      {/* Main Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <nav className="flex items-center space-x-1 text-sm" aria-label="Progress">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <ChevronRight className="flex-shrink-0 h-4 w-4 text-gray-400" />
              )}
              
              <div className="flex items-center">
                {step.clickable ? (
                  <button
                    onClick={() => onStepClick(step.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      step.current
                        ? 'bg-primary text-white'
                        : step.completed
                        ? 'text-primary hover:bg-primary hover:bg-opacity-10'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {step.completed && !step.current && (
                      <Check className="mr-1 h-4 w-4" />
                    )}
                    {step.current && (
                      <div className="mr-1 h-4 w-4 rounded-full bg-white border-2 border-white" />
                    )}
                    {step.title}
                  </button>
                ) : (
                  <span
                    className={`flex items-center px-3 py-2 text-sm font-medium ${
                      step.current
                        ? 'text-primary font-semibold'
                        : step.completed
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.completed && !step.current && (
                      <Check className="mr-1 h-4 w-4" />
                    )}
                    {step.current && (
                      <div className="mr-1 h-4 w-4 rounded-full bg-primary" />
                    )}
                    {step.title}
                  </span>
                )}
              </div>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Current Step Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentStepTitle}</h2>
        <p className="text-gray-600">{currentStepDescription}</p>
      </div>
    </div>
  );
};

export default BreadcrumbNavigation;