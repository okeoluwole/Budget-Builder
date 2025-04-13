import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { Project, Budget, SpaceAllocation, InsertProject, InsertBudget } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Define the state type
interface BudgetState {
  project?: InsertProject;
  budget?: Partial<InsertBudget> & {
    spaceAllocation?: SpaceAllocation;
    costsBreakdown?: any;
  };
  savedProject?: Project;
  savedBudget?: Budget;
}

// Define the action types
type BudgetAction =
  | { type: 'UPDATE_PROJECT'; payload: Partial<InsertProject> }
  | { type: 'UPDATE_SCOPE'; payload: string }
  | { type: 'UPDATE_SPECIFICATION'; payload: string }
  | { type: 'UPDATE_LAYOUT'; payload: string }
  | { type: 'UPDATE_SPACE_ALLOCATION'; payload: SpaceAllocation }
  | { type: 'UPDATE_BUDGET_RESULTS'; payload: { totalCost: number; fitoutCost?: number; furnitureCost?: number; costsBreakdown: any } }
  | { type: 'SET_SAVED_PROJECT'; payload: Project }
  | { type: 'SET_SAVED_BUDGET'; payload: Budget }
  | { type: 'CLEAR_STATE' }
  | { type: 'LOAD_BUDGET'; payload: { project: Project; budget: Budget } };

// Create the context
interface BudgetContextType {
  state: BudgetState;
  updateProject: (project: Partial<InsertProject>) => void;
  updateSpecification: (specification: string) => void;
  updateLayout: (layout: string) => void;
  updateSpaceAllocation: (spaceAllocation: SpaceAllocation) => void;
  updateBudgetResults: (totalCost: number, costsBreakdown: any) => void;
  setSavedProject: (project: Project) => void;
  setSavedBudget: (budget: Budget) => void;
  loadBudget: (project: Project, budget: Budget) => void;
  clearState: () => void;
  saveBudget: (status?: string) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

// Reducer function
const budgetReducer = (state: BudgetState, action: BudgetAction): BudgetState => {
  switch (action.type) {
    case 'UPDATE_PROJECT':
      return {
        ...state,
        project: {
          ...(state.project || {}),
          ...action.payload
        }
      };
    case 'UPDATE_SPECIFICATION':
      return {
        ...state,
        budget: {
          ...(state.budget || {}),
          specification: action.payload
        }
      };
    case 'UPDATE_LAYOUT':
      return {
        ...state,
        budget: {
          ...(state.budget || {}),
          layout: action.payload
        }
      };
    case 'UPDATE_SPACE_ALLOCATION':
      return {
        ...state,
        budget: {
          ...(state.budget || {}),
          spaceAllocation: action.payload
        }
      };
    case 'UPDATE_BUDGET_RESULTS':
      return {
        ...state,
        budget: {
          ...(state.budget || {}),
          totalCost: action.payload.totalCost,
          costsBreakdown: action.payload.costsBreakdown
        }
      };
    case 'SET_SAVED_PROJECT':
      return {
        ...state,
        savedProject: action.payload
      };
    case 'SET_SAVED_BUDGET':
      return {
        ...state,
        savedBudget: action.payload
      };
    case 'CLEAR_STATE':
      return {
        project: undefined,
        budget: undefined,
        savedProject: undefined,
        savedBudget: undefined
      };
    case 'LOAD_BUDGET':
      return {
        project: action.payload.project,
        budget: {
          projectId: action.payload.budget.projectId,
          version: action.payload.budget.version,
          name: action.payload.budget.name,
          specification: action.payload.budget.specification,
          layout: action.payload.budget.layout,
          spaceAllocation: action.payload.budget.spaceAllocation,
          totalCost: action.payload.budget.totalCost,
          costsBreakdown: action.payload.budget.costsBreakdown,
          status: action.payload.budget.status
        },
        savedProject: action.payload.project,
        savedBudget: action.payload.budget
      };
    default:
      return state;
  }
};

// Provider component
interface BudgetProviderProps {
  children: ReactNode;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(budgetReducer, {});

  const updateProject = useCallback((project: Partial<InsertProject>) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: project });
  }, []);

  const updateSpecification = useCallback((specification: string) => {
    dispatch({ type: 'UPDATE_SPECIFICATION', payload: specification });
  }, []);

  const updateLayout = useCallback((layout: string) => {
    dispatch({ type: 'UPDATE_LAYOUT', payload: layout });
  }, []);

  const updateSpaceAllocation = useCallback((spaceAllocation: SpaceAllocation) => {
    dispatch({ type: 'UPDATE_SPACE_ALLOCATION', payload: spaceAllocation });
  }, []);

  const updateBudgetResults = useCallback((totalCost: number, costsBreakdown: any) => {
    dispatch({ 
      type: 'UPDATE_BUDGET_RESULTS', 
      payload: { totalCost, costsBreakdown } 
    });
  }, []);

  const setSavedProject = useCallback((project: Project) => {
    dispatch({ type: 'SET_SAVED_PROJECT', payload: project });
  }, []);

  const setSavedBudget = useCallback((budget: Budget) => {
    dispatch({ type: 'SET_SAVED_BUDGET', payload: budget });
  }, []);

  const loadBudget = useCallback((project: Project, budget: Budget) => {
    dispatch({ type: 'LOAD_BUDGET', payload: { project, budget } });
  }, []);

  const clearState = useCallback(() => {
    dispatch({ type: 'CLEAR_STATE' });
  }, []);

  const saveBudget = useCallback(async (status: string = 'draft') => {
    if (!state.project) {
      throw new Error('Project data is missing');
    }

    try {
      // Save or update project
      let project: Project;
      if (state.savedProject) {
        // Update existing project
        const res = await apiRequest('PUT', `/api/projects/${state.savedProject.id}`, state.project);
        project = await res.json();
      } else {
        // Create new project
        const res = await apiRequest('POST', '/api/projects', {
          ...state.project,
          status: 'active'
        });
        project = await res.json();
        dispatch({ type: 'SET_SAVED_PROJECT', payload: project });
      }

      // Save or update budget
      if (state.budget) {
        if (state.savedBudget) {
          // Update existing budget
          const res = await apiRequest('PUT', `/api/budgets/${state.savedBudget.id}`, {
            ...state.budget,
            projectId: project.id,
            status
          });
          const budget = await res.json();
          dispatch({ type: 'SET_SAVED_BUDGET', payload: budget });
        } else {
          // Create new budget
          const budgetName = state.project.name 
            ? `${state.project.name} Budget` 
            : `Budget ${new Date().toLocaleDateString()}`;
            
          const res = await apiRequest('POST', '/api/budgets', {
            ...state.budget,
            projectId: project.id,
            name: budgetName,
            version: 1,
            status
          });
          const budget = await res.json();
          dispatch({ type: 'SET_SAVED_BUDGET', payload: budget });
        }
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      throw error;
    }
  }, [state]);

  return (
    <BudgetContext.Provider value={{ 
      state, 
      updateProject, 
      updateSpecification, 
      updateLayout, 
      updateSpaceAllocation, 
      updateBudgetResults,
      setSavedProject,
      setSavedBudget,
      loadBudget,
      clearState,
      saveBudget
    }}>
      {children}
    </BudgetContext.Provider>
  );
};

// Custom hook to use the budget context
export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
