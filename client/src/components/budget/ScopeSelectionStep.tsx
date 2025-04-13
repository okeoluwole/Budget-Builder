import React from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BudgetScope } from '@shared/schema';
import { CheckIcon } from 'lucide-react';

interface ScopeSelectionStepProps {
  onNext: () => void;
  onBack: () => void;
}

const ScopeSelectionStep: React.FC<ScopeSelectionStepProps> = ({ onNext, onBack }) => {
  const { state, updateScope } = useBudget();
  const selectedScope = state.budget?.scope || 'Fitout';

  const handleScopeSelect = (scope: BudgetScope) => {
    updateScope(scope);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Select Budget Scope</h2>
        <p className="text-gray-600">Choose what to include in your budget estimate</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScopeCard 
          title="Fit-out Only" 
          description="Construction, finishes, and built-in elements only" 
          selected={selectedScope === 'Fitout'} 
          onClick={() => handleScopeSelect('Fitout')}
          features={[
            'Construction works',
            'Walls and partitions',
            'Flooring and ceilings',
            'Electrical and MEP',
            'Fixed joinery'
          ]}
        />
        
        <ScopeCard 
          title="Furniture Only" 
          description="Loose furniture and movable items only" 
          selected={selectedScope === 'Furniture'} 
          onClick={() => handleScopeSelect('Furniture')}
          features={[
            'Desks and chairs',
            'Storage units',
            'Meeting room furniture',
            'Breakout furniture',
            'Reception furniture'
          ]}
        />
        
        <ScopeCard 
          title="Complete Package" 
          description="Combined fit-out and furniture budget" 
          selected={selectedScope === 'Both'} 
          onClick={() => handleScopeSelect('Both')}
          features={[
            'All fit-out elements',
            'All furniture items',
            'Coordinated design',
            'Complete space planning',
            'Comprehensive budget view'
          ]}
        />
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          Next Step
        </Button>
      </div>
    </div>
  );
};

interface ScopeCardProps {
  title: string;
  description: string;
  features: string[];
  selected: boolean;
  onClick: () => void;
}

const ScopeCard: React.FC<ScopeCardProps> = ({ title, description, features, selected, onClick }) => {
  return (
    <Card 
      className={`cursor-pointer transition-all ${
        selected 
          ? 'border-2 border-primary shadow-md' 
          : 'border hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          {title}
          {selected && (
            <span className="ml-2 text-primary">
              <CheckIcon size={18} />
            </span>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="text-sm flex items-start">
              <span className="text-primary mr-2">•</span>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ScopeSelectionStep;