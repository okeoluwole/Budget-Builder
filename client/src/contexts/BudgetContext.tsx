import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { Project, Budget, SpaceAllocation, InsertProject, InsertBudget, DataSourceType, JLLLayout, JLLQuality } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Define the state type
interface BudgetState {
  project?: InsertProject;
  budget?: Partial<InsertBudget> & {
    spaceAllocation?: SpaceAllocation;
    costsBreakdown?: any;
    fitoutSpecification?: string;
    furnitureSpecification?: string;
    primaryDataSource?: DataSourceType;
    isComparisonEnabled?: boolean;
    comparisonSources?: DataSourceType[];
    jllLayout?: JLLLayout;
    jllQuality?: JLLQuality;
  };
  savedProject?: Project;
  savedBudget?: Budget;
}

// Define the action types
type BudgetAction =
  | { type: 'UPDATE_PROJECT'; payload: Partial<InsertProject> }
  | { type: 'UPDATE_SCOPE'; payload: string }
  | { type: 'UPDATE_SPECIFICATION'; payload: { specification: string; fitoutSpecification?: string | null; furnitureSpecification?: string | null } }
  | { type: 'UPDATE_LAYOUT'; payload: string }
  | { type: 'UPDATE_SPACE_ALLOCATION'; payload: SpaceAllocation }
  | { type: 'UPDATE_BUDGET_RESULTS'; payload: { totalCost: number; fitoutCost?: number; furnitureCost?: number; costsBreakdown: any } }
  | { type: 'UPDATE_DATA_SOURCE'; payload: { dataSource: DataSourceType; enableComparison: boolean; comparisonSources?: DataSourceType[] } }
  | { type: 'UPDATE_JLL_OPTIONS'; payload: { jllLayout: JLLLayout; jllQuality: JLLQuality } }
  | { type: 'SET_SAVED_PROJECT'; payload: Project }
  | { type: 'SET_SAVED_BUDGET'; payload: Budget }
  | { type: 'CLEAR_STATE' }
  | { type: 'LOAD_BUDGET'; payload: { project: Project; budget: Budget } };

// Create the context
interface BudgetContextType {
  state: BudgetState;
  updateProject: (project: Partial<InsertProject>) => void;
  updateScope: (scope: string) => void;
  updateSpecification: (
    specification: string,
    fitoutSpecification?: string | null,
    furnitureSpecification?: string | null
  ) => void;
  updateLayout: (layout: string) => void;
  updateSpaceAllocation: (spaceAllocation: SpaceAllocation) => void;
  updateBudgetResults: (totalCost: number, fitoutCost?: number, furnitureCost?: number, costsBreakdown?: any) => void;
  updateDataSource: (dataSource: DataSourceType, enableComparison: boolean, comparisonSources?: DataSourceType[]) => void;
  updateJllOptions: (jllLayout: JLLLayout, jllQuality: JLLQuality) => void;
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
    case 'UPDATE_SCOPE':
      return {
        ...state,
        budget: {
          ...(state.budget || {}),
          scope: action.payload
        }
      };
    case 'UPDATE_SPECIFICATION':
      return {
        ...state,
        budget: {
          ...(state.budget || {}),
          specification: action.payload.specification,
          fitoutSpecification: action.payload.fitoutSpecification || null,
          furnitureSpecification: action.payload.furnitureSpecification || null
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
          fitoutCost: action.payload.fitoutCost,
          furnitureCost: action.payload.furnitureCost,
          costsBreakdown: action.payload.costsBreakdown
        }
      };
    case 'UPDATE_DATA_SOURCE':
      return {
        ...state,
        budget: {
          ...(state.budget || {}),
          primaryDataSource: action.payload.dataSource,
          isComparisonEnabled: action.payload.enableComparison,
          comparisonSources: action.payload.comparisonSources || []
        }
      };
    case 'UPDATE_JLL_OPTIONS':
      return {
        ...state,
        budget: {
          ...(state.budget || {}),
          jllLayout: action.payload.jllLayout,
          jllQuality: action.payload.jllQuality
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
          scope: action.payload.budget.scope || 'Fitout',
          specification: action.payload.budget.specification,
          fitoutSpecification: action.payload.budget.fitoutSpecification || action.payload.budget.specification,
          furnitureSpecification: action.payload.budget.furnitureSpecification || action.payload.budget.specification,
          layout: action.payload.budget.layout,
          spaceAllocation: action.payload.budget.spaceAllocation,
          totalCost: action.payload.budget.totalCost,
          fitoutCost: action.payload.budget.fitoutCost,
          furnitureCost: action.payload.budget.furnitureCost,
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

  const updateScope = useCallback((scope: string) => {
    dispatch({ type: 'UPDATE_SCOPE', payload: scope });
  }, []);

  const updateSpecification = useCallback((
    specification: string,
    fitoutSpecification?: string | null,
    furnitureSpecification?: string | null
  ) => {
    dispatch({
      type: 'UPDATE_SPECIFICATION',
      payload: {
        specification,
        fitoutSpecification,
        furnitureSpecification
      }
    });
  }, []);

  const updateLayout = useCallback((layout: string) => {
    dispatch({ type: 'UPDATE_LAYOUT', payload: layout });
  }, []);

  const updateSpaceAllocation = useCallback((spaceAllocation: SpaceAllocation) => {
    dispatch({ type: 'UPDATE_SPACE_ALLOCATION', payload: spaceAllocation });
  }, []);

  const updateBudgetResults = useCallback((totalCost: number, fitoutCost?: number, furnitureCost?: number, costsBreakdown?: any) => {
    dispatch({ 
      type: 'UPDATE_BUDGET_RESULTS', 
      payload: { totalCost, fitoutCost, furnitureCost, costsBreakdown } 
    });
  }, []);

  const updateDataSource = useCallback((dataSource: DataSourceType, enableComparison: boolean, comparisonSources: DataSourceType[] = []) => {
    dispatch({
      type: 'UPDATE_DATA_SOURCE',
      payload: { dataSource, enableComparison, comparisonSources }
    });
  }, []);

  const updateJllOptions = useCallback((jllLayout: JLLLayout, jllQuality: JLLQuality) => {
    dispatch({
      type: 'UPDATE_JLL_OPTIONS',
      payload: { jllLayout, jllQuality }
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
          name: state.project.name || 'Untitled Project',
          country: state.project.country || 'United States',
          city: state.project.city || 'New York',
          totalArea: state.project.totalArea || 1000,
          areaUnit: state.project.areaUnit || 'sqm',
          currency: state.project.currency || 'USD',
          reference: state.project.reference,
          startDate: state.project.startDate,
          inflationRate: state.project.inflationRate,
          status: 'active'
        });
        project = await res.json();
        dispatch({ type: 'SET_SAVED_PROJECT', payload: project });
      }

      // Save or update budget
      if (state.budget) {
        if (state.savedBudget) {
          // Update existing budget
          const updateBudgetData = {
            projectId: project.id,
            name: state.budget.name || state.savedBudget.name,
            scope: state.budget.scope || state.savedBudget.scope,
            specification: state.budget.specification || state.savedBudget.specification,
            layout: state.budget.layout || state.savedBudget.layout,
            primaryDataSource: state.budget.primaryDataSource || state.savedBudget.primaryDataSource || 'CBRE',
            isComparisonEnabled: typeof state.budget.isComparisonEnabled !== 'undefined' ? 
              state.budget.isComparisonEnabled : 
              state.savedBudget.isComparisonEnabled || false,
            comparisonSources: state.budget.comparisonSources || [],
            fitoutCost: state.budget.fitoutCost !== undefined ? state.budget.fitoutCost : state.savedBudget.fitoutCost,
            furnitureCost: state.budget.furnitureCost !== undefined ? state.budget.furnitureCost : state.savedBudget.furnitureCost,
            totalCost: state.budget.totalCost !== undefined ? state.budget.totalCost : state.savedBudget.totalCost,
            status
          };
          
          // Add JSON fields
          if (state.budget.spaceAllocation) {
            updateBudgetData['spaceAllocation'] = state.budget.spaceAllocation;
          }
          
          if (state.budget.costsBreakdown) {
            updateBudgetData['costsBreakdown'] = state.budget.costsBreakdown;
          }
          
          const res = await apiRequest('PUT', `/api/budgets/${state.savedBudget.id}`, updateBudgetData);
          const budget = await res.json();
          dispatch({ type: 'SET_SAVED_BUDGET', payload: budget });
        } else {
          // Create new budget
          const budgetName = state.project.name 
            ? `${state.project.name} Budget` 
            : `Budget ${new Date().toLocaleDateString()}`;
            
          // Build budget data with defaults for any missing fields
          const budgetData = {
            projectId: project.id,
            name: budgetName,
            version: 1,
            scope: state.budget.scope || 'Fitout',
            specification: state.budget.specification || 'Bronze',
            layout: state.budget.layout || 'Activity',
            primaryDataSource: state.budget.primaryDataSource || 'CBRE',
            isComparisonEnabled: state.budget.isComparisonEnabled || false,
            comparisonSources: state.budget.comparisonSources || [],
            fitoutCost: state.budget.fitoutCost,
            furnitureCost: state.budget.furnitureCost,
            totalCost: state.budget.totalCost,
            status
          };

          // Add non-schema fields as JSON
          if (state.budget.spaceAllocation) {
            budgetData['spaceAllocation'] = state.budget.spaceAllocation;
          }
          
          if (state.budget.costsBreakdown) {
            budgetData['costsBreakdown'] = state.budget.costsBreakdown;
          }
          
          const res = await apiRequest('POST', '/api/budgets', budgetData);
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
      updateScope,
      updateSpecification, 
      updateLayout, 
      updateSpaceAllocation, 
      updateBudgetResults,
      updateDataSource,
      updateJllOptions,
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
