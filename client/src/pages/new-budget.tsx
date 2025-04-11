import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import BudgetWizard from '@/components/budget/BudgetWizard';
import { useBudget } from '@/contexts/BudgetContext';
import { Project, Budget } from '@shared/schema';

const NewBudget: React.FC = () => {
  const { clearState, loadBudget } = useBudget();
  const [location] = useLocation();
  
  // Extract project ID from URL if provided
  const params = new URLSearchParams(location.split('?')[1]);
  const projectId = params.get('projectId');
  const budgetId = params.get('budgetId');
  
  // Fetch project if projectId is provided
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: projectId ? [`/api/projects/${projectId}`] : null,
    enabled: !!projectId,
  });
  
  // Fetch budget if budgetId is provided
  const { data: budget, isLoading: budgetLoading } = useQuery({
    queryKey: budgetId ? [`/api/budgets/${budgetId}`] : null,
    enabled: !!budgetId,
  });
  
  // Clear state when component mounts (unless editing existing budget)
  useEffect(() => {
    if (!budgetId) {
      clearState();
    }
  }, [clearState, budgetId]);
  
  // Load budget data if editing existing budget
  useEffect(() => {
    if (budgetId && budget && projectId && project) {
      loadBudget(project, budget);
    }
  }, [budgetId, budget, projectId, project, loadBudget]);
  
  return (
    <div>
      {(projectLoading || budgetLoading) && (projectId || budgetId) ? (
        <div className="max-w-7xl mx-auto text-center py-12">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg text-gray-700">Loading budget information...</p>
        </div>
      ) : (
        <BudgetWizard />
      )}
    </div>
  );
};

export default NewBudget;
