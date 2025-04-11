import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import BudgetSummary from '@/components/budget/BudgetSummary';
import { Budget, Project } from '@shared/schema';
import { formatCurrency } from '@/utils/formatters';

interface BudgetDetailsProps {
  params: {
    id: string;
  };
}

const BudgetDetails: React.FC<BudgetDetailsProps> = ({ params }) => {
  const budgetId = parseInt(params.id);
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [importingCurrency, setImportingCurrency] = useState(false);
  
  // Fetch budget details
  const { data: budget, isLoading: budgetLoading } = useQuery<Budget>({
    queryKey: [`/api/budgets/${budgetId}`],
  });
  
  // Fetch project details when budget is loaded
  const projectQueryEnabled = !!budget && typeof budget.projectId === 'number';
  const projectQueryKey = projectQueryEnabled ? [`/api/projects/${budget.projectId}`] : ['disabled-project-query'];
  
  const { data: projectData, isLoading: projectLoading } = useQuery<Project>({
    queryKey: projectQueryKey,
    enabled: projectQueryEnabled,
  });
  
  // Set project when data is loaded
  useEffect(() => {
    if (projectData) {
      setProject(projectData);
    }
  }, [projectData]);
  
  const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
    toast({
      title: "Exporting budget",
      description: `Exporting budget in ${format.toUpperCase()} format...`,
    });
    
    // In a real application, this would make an API call to generate the export
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: `Budget exported successfully in ${format.toUpperCase()} format.`,
      });
    }, 1500);
  };
  
  const handleImportCurrencyRates = async () => {
    setImportingCurrency(true);
    
    try {
      const response = await fetch('/api/admin/import-currency-rates', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Currency rates imported successfully. Imported ${result.count} currency rates.`,
      });
      
      // Refresh the budget to get updated currency data
      window.location.reload();
    } catch (error) {
      console.error('Error importing currency rates:', error);
      toast({
        title: "Error",
        description: `Failed to import currency rates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setImportingCurrency(false);
    }
  };
  
  if (budgetLoading || projectLoading) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg text-gray-700">Loading budget details...</p>
      </div>
    );
  }
  
  if (!budget) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="mt-4 text-2xl font-bold text-gray-800">Budget Not Found</h2>
        <p className="mt-2 text-gray-600">The budget you are looking for does not exist or has been removed.</p>
        <div className="mt-6">
          <Link href="/">
            <a className="text-primary hover:text-primary-dark font-medium">Return to Dashboard</a>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{budget.name}</h1>
          <p className="text-gray-600">
            {project ? `${project.city}, ${project.country}` : 'Loading project details...'}
          </p>
        </div>
        <div className="flex space-x-2">
          {budget.status === 'draft' && (
            <Link href={`/new-budget?budgetId=${budget.id}`}>
              <a className="px-4 py-2 text-sm font-medium text-primary bg-white border border-primary rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-primary">
                Edit Budget
              </a>
            </Link>
          )}
          <button
            onClick={() => handleExport('excel')}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Export Budget
          </button>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-gray-500">Total Budget</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {budget.totalCost 
                  ? formatCurrency(budget.totalCost, project?.currency || 'USD') 
                  : 'Not calculated'}
              </p>
              {budget.localCurrencyCode && budget.localCurrencyCode !== (project?.currency || 'USD') && 
               budget.localCurrencyTotalCost && (
                <p className="text-sm text-gray-600 mt-1">
                  {formatCurrency(budget.localCurrencyTotalCost, budget.localCurrencyCode)}
                </p>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">Area</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {project ? `${project.totalArea.toLocaleString()} ${project.areaUnit}` : '-'}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">Specification</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {budget.specification}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500">Layout</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {budget.layout} Based
              </p>
            </div>
          </div>
          
          {/* Status badge */}
          <div className="mb-6">
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
              budget.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : budget.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
            }`}>
              {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
            </span>
            <span className="ml-4 text-sm text-gray-500">
              Last updated: {new Date(budget.updatedAt).toLocaleDateString()}
            </span>
          </div>
          
          {/* Budget Summary */}
          {budget.totalCost && budget.costsBreakdown ? (
            <BudgetSummary 
              budgetBreakdown={budget.costsBreakdown}
              totalCost={budget.totalCost}
              currency={project?.currency || 'USD'}
              localCurrencyCode={budget.localCurrencyCode ? budget.localCurrencyCode : undefined}
              localCurrencyRate={budget.localCurrencyRate ? budget.localCurrencyRate : undefined}
              localCurrencyTotalCost={budget.localCurrencyTotalCost ? budget.localCurrencyTotalCost : undefined}
              localCurrencyCostsBreakdown={budget.costsBreakdown ? budget.costsBreakdown as { [key: string]: number } : undefined}
            />
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No budget breakdown available</h3>
              <p className="mt-1 text-sm text-gray-500">This budget has not been fully calculated.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Space Allocation */}
      {budget.spaceAllocation && typeof budget.spaceAllocation === 'object' && 
      Object.keys(budget.spaceAllocation as Record<string, {percentage: number, area: number}>).length > 0 && project && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Space Allocation</h2>
            
            {/* Visual representation */}
            <div className="h-8 w-full bg-gray-200 rounded-full overflow-hidden mb-4">
              {Object.entries(budget.spaceAllocation).map(([name, space]: [string, any], index) => {
                // Different colors for different space types
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div 
                    key={name}
                    className={`h-full ${colorClass} float-left`}
                    style={{ width: `${space.percentage}%` }}
                    title={`${name}: ${space.percentage.toFixed(1)}%`}
                  />
                );
              })}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Space Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area ({project.areaUnit})
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(budget.spaceAllocation).map(([name, space]: [string, any]) => (
                    <tr key={name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {space.percentage.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                        {space.area.toLocaleString(undefined, {maximumFractionDigits: 1})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Currency Tools */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Currency Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Import Currency Rates</h3>
              <p className="text-sm text-gray-600 mb-4">
                Import 2025 FX rate data from Excel to enable local currency conversion.
              </p>
              <button
                onClick={handleImportCurrencyRates}
                disabled={importingCurrency}
                className={`px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  importingCurrency ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {importingCurrency ? (
                  <>
                    <svg className="inline-block animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importing...
                  </>
                ) : (
                  'Import Currency Rates'
                )}
              </button>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Current Currency</h3>
              <p className="text-sm text-gray-600 mb-4">
                {budget.localCurrencyCode ? (
                  <>
                    Local currency is set to <span className="font-semibold">{budget.localCurrencyCode}</span>
                    {budget.localCurrencyRate && (
                      <> at rate of <span className="font-semibold">{budget.localCurrencyRate.toFixed(4)}</span> per USD</>
                    )}
                  </>
                ) : (
                  'No local currency is currently set. Import currency rates to enable dual currency support.'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-between">
        <Link href="/">
          <a className="text-primary hover:text-primary-dark font-medium">
            ← Back to Dashboard
          </a>
        </Link>
        
        <div className="flex space-x-3">
          <button
            onClick={() => handleExport('pdf')}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            Export PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            Export Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetDetails;
