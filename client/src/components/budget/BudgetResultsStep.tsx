import React, { useState, useEffect } from 'react';
import { useBudget } from '@/contexts/BudgetContext';
import { useToast } from '@/hooks/use-toast';
import BudgetSummary from './BudgetSummary';
import { calculateBudget } from '@/utils/budgetCalculator';
import { formatCurrency } from '@/utils/formatters';
import { apiRequest } from '@/lib/queryClient';
import { BudgetCategory, Project } from '@shared/schema';

interface BudgetResultsStepProps {
  onFinish: () => Promise<void>;
  onBack: () => void;
  onSaveAsDraft: () => Promise<void>;
}

const BudgetResultsStep: React.FC<BudgetResultsStepProps> = ({ onFinish, onBack, onSaveAsDraft }) => {
  const { state, updateBudgetResults } = useBudget();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [calculatingBudget, setCalculatingBudget] = useState(true);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('excel');
  const [budgetTemplateStructure, setBudgetTemplateStructure] = useState<BudgetCategory[]>([]);
  const [budgetBreakdown, setBudgetBreakdown] = useState<any>(null);
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [localCurrencyCode, setLocalCurrencyCode] = useState<string | null>(null);
  const [localCurrencyRate, setLocalCurrencyRate] = useState<number | null>(null);
  const [localCurrencyTotalCost, setLocalCurrencyTotalCost] = useState<number | null>(null);
  const [localCurrencyCostsBreakdown, setLocalCurrencyCostsBreakdown] = useState<{[key: string]: number} | null>(null);

  // Fetch currency rates for the project country
  useEffect(() => {
    const fetchCurrencyRate = async () => {
      if (!state.project?.country) return;
      
      try {
        // Get currency rates
        const ratesRes = await apiRequest('GET', '/api/currency-rates', undefined);
        const ratesData = await ratesRes.json();
        
        console.log("Available currency rates:", ratesData.map(r => r.country));
        console.log("Project country:", state.project?.country);
        
        // Find currency for the project country - case insensitive
        const countryCurrency = ratesData.find((rate: any) => 
          rate.country.toLowerCase() === state.project?.country.toLowerCase()
        );
        
        if (countryCurrency) {
          console.log("Found exact currency match for country:", countryCurrency);
          setLocalCurrencyCode(countryCurrency.currencyCode);
          setLocalCurrencyRate(parseFloat(countryCurrency.exchangeRate.toString()));
        } else {
          console.log("No exact currency match found for country:", state.project?.country);
          
          // Try common country matches
          const countryMappings: Record<string, string> = {
            'germany': 'EURO',
            'france': 'EURO',
            'italy': 'EURO',
            'spain': 'EURO',
            'ireland': 'EURO',
            'united kingdom': 'UNITED KINGDOM',
            'uk': 'UNITED KINGDOM',
            'united states': 'UNITED STATES',
            'usa': 'UNITED STATES',
            'canada': 'CANADA',
            'australia': 'AUSTRALIA',
            'japan': 'JAPAN'
          };
          
          const mappedCountry = countryMappings[state.project?.country.toLowerCase()];
          
          if (mappedCountry) {
            const mappedMatch = ratesData.find((rate: any) => 
              rate.country.toLowerCase() === mappedCountry.toLowerCase()
            );
            
            if (mappedMatch) {
              console.log("Found mapped currency match:", mappedMatch);
              setLocalCurrencyCode(mappedMatch.currencyCode);
              setLocalCurrencyRate(parseFloat(mappedMatch.exchangeRate.toString()));
              return;
            }
          }
          
          // If no exact match for country name is found, try a partial match
          const partialMatch = ratesData.find((rate: any) => 
            state.project?.country.toLowerCase().includes(rate.country.toLowerCase()) ||
            rate.country.toLowerCase().includes(state.project?.country.toLowerCase())
          );
          
          if (partialMatch) {
            console.log("Found partial currency match for country:", partialMatch);
            setLocalCurrencyCode(partialMatch.currencyCode);
            setLocalCurrencyRate(parseFloat(partialMatch.exchangeRate.toString()));
          } else {
            // Try find currency by code if country is a currency zone
            if (state.project?.country.toLowerCase() === 'eurozone') {
              const euroMatch = ratesData.find((rate: any) => rate.currencyCode === 'EUR');
              if (euroMatch) {
                console.log("Found Eurozone currency match:", euroMatch);
                setLocalCurrencyCode(euroMatch.currencyCode);
                setLocalCurrencyRate(parseFloat(euroMatch.exchangeRate.toString()));
                return;
              }
            }
            
            console.log("No currency match found for country:", state.project?.country);
            // Default to USD if no match found
            setLocalCurrencyCode(null);
            setLocalCurrencyRate(null);
          }
        }
      } catch (error) {
        console.error("Error fetching currency rates:", error);
        
        // If there's an API error, don't set any default currency conversion
        setLocalCurrencyCode(null);
        setLocalCurrencyRate(null);
        console.log("Could not fetch currency rates due to API error");
      }
    };
    
    fetchCurrencyRate();
  }, [state.project?.country]);

  useEffect(() => {
    const fetchBudgetTemplate = async () => {
      try {
        setLoading(true);
        const res = await apiRequest('GET', '/api/budget-template', undefined);
        const data = await res.json();
        setBudgetTemplateStructure(data);
      } catch (error) {
        console.error('Failed to fetch budget template:', error);
        toast({
          title: "Error loading budget template",
          description: "Could not load the budget structure. Some details may be missing.",
          variant: "destructive",
        });
        // Set a basic fallback structure
        setBudgetTemplateStructure([
          {
            name: "CONSTRUCTION COSTS",
            subcategories: [
              {
                name: "Total Construction",
                lineItems: [{ name: "Construction total", defaultFactor: 1.0 }]
              }
            ]
          },
          {
            name: "FURNITURE & EQUIPMENT",
            subcategories: [
              {
                name: "Total FF&E",
                lineItems: [{ name: "FF&E total", defaultFactor: 1.0 }]
              }
            ]
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetTemplate();
  }, [toast]);

  useEffect(() => {
    const performBudgetCalculation = async () => {
      // Check if we have necessary data and budget template is loaded
      if (!state.project || !state.budget || loading || budgetTemplateStructure.length === 0) return;
      
      // Check if we already have results to avoid recalculating unnecessarily
      if (totalCost !== null && budgetBreakdown !== null) return;

      try {
        setCalculatingBudget(true);
        console.log("Starting budget calculation with project data:", {
          country: state.project.country,
          city: state.project.city,
          layout: state.budget.layout,
          specification: state.budget.specification
        });
        
        // Make sure we have all required properties for project
        if (!state.project || !state.budget) {
          throw new Error("Missing project or budget data");
        }
        
        // Calculate the budget - using savedProject if available, otherwise create a Project from InsertProject
        const projectForCalculation = state.savedProject || {
          id: 0, // Temporary ID for calculation
          name: state.project.name,
          reference: state.project.reference || null,
          country: state.project.country,
          city: state.project.city,
          totalArea: state.project.totalArea,
          areaUnit: state.project.areaUnit,
          startDate: state.project.startDate || null,
          currency: state.project.currency,
          inflationRate: state.project.inflationRate || null,
          status: state.project.status || 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const { 
          totalCost: calculatedTotalCost, 
          costsBreakdown,
          localCurrencyCode: calcLocalCurrencyCode,
          localCurrencyRate: calcLocalCurrencyRate,
          localCurrencyTotalCost: calcLocalCurrencyTotalCost,
          localCurrencyCostsBreakdown: calcLocalCurrencyCostsBreakdown
        } = await calculateBudget({
          project: projectForCalculation,
          budget: state.budget,
          budgetStructure: budgetTemplateStructure
        });
        
        console.log("Budget calculation complete:", { 
          totalCost: calculatedTotalCost,
          localCurrencyCode: calcLocalCurrencyCode,
          localCurrencyRate: calcLocalCurrencyRate
        });
        
        setTotalCost(calculatedTotalCost);
        setBudgetBreakdown(costsBreakdown);
        
        // Set local currency info if available from calculation
        if (calcLocalCurrencyCode) setLocalCurrencyCode(calcLocalCurrencyCode);
        if (calcLocalCurrencyRate) setLocalCurrencyRate(calcLocalCurrencyRate);
        if (calcLocalCurrencyTotalCost) setLocalCurrencyTotalCost(calcLocalCurrencyTotalCost);
        if (calcLocalCurrencyCostsBreakdown) setLocalCurrencyCostsBreakdown(calcLocalCurrencyCostsBreakdown);
        
        // Update context with results
        updateBudgetResults(calculatedTotalCost, costsBreakdown);
      } catch (error) {
        console.error('Error calculating budget:', error);
        toast({
          title: "Budget calculation error",
          description: "There was an error calculating your budget. Please check your inputs and try again.",
          variant: "destructive",
        });
      } finally {
        setCalculatingBudget(false);
      }
    };

    performBudgetCalculation();
  }, [state.project, state.budget, budgetTemplateStructure, loading, toast, updateBudgetResults, state.savedProject]);

  const handleExport = async () => {
    try {
      toast({
        title: "Exporting budget",
        description: `Exporting budget in ${exportFormat.toUpperCase()} format...`,
      });
      
      // In a real application, this would make an API call to generate the export
      setTimeout(() => {
        toast({
          title: "Export complete",
          description: `Budget exported successfully in ${exportFormat.toUpperCase()} format.`,
        });
      }, 1500);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your budget. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Budget Results</h2>
      <p className="text-gray-600 mb-6">Review your budget estimate and export the details as needed.</p>
      
      {(loading || calculatingBudget) ? (
        <div className="text-center py-12">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg text-gray-700">Calculating your budget...</p>
          <p className="text-sm text-gray-500">This may take a moment while we process all the factors.</p>
        </div>
      ) : (
        <>
          {totalCost !== null && budgetBreakdown ? (
            <div>
              <div className="bg-gray-100 p-6 rounded-lg mb-6 text-center">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Total Budget Estimate</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {formatCurrency(totalCost, 'USD')}
                </div>
                {localCurrencyCode && localCurrencyCode !== 'USD' && localCurrencyRate && (
                  <div className="text-2xl font-bold text-gray-700 mb-2">
                    {formatCurrency(totalCost * localCurrencyRate, localCurrencyCode)}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-6 text-sm text-gray-600 mt-2">
                  <div>
                    {state.project?.totalArea?.toLocaleString()} {state.project?.areaUnit} @ 
                    {formatCurrency(totalCost / (state.project?.totalArea || 1), 'USD')}
                    /{state.project?.areaUnit}
                  </div>
                  {localCurrencyCode && localCurrencyCode !== 'USD' && localCurrencyRate && (
                    <div>
                      {formatCurrency((totalCost * localCurrencyRate) / (state.project?.totalArea || 1), localCurrencyCode)}
                      /{state.project?.areaUnit}
                    </div>
                  )}
                </div>
                {localCurrencyCode && localCurrencyCode !== 'USD' && localCurrencyRate && (
                  <div className="text-xs text-gray-500 mt-2">
                    Exchange Rate: 1 USD = {localCurrencyRate.toFixed(4)} {localCurrencyCode} (2025 FX Rate)
                  </div>
                )}
              </div>
              
              <BudgetSummary 
                budgetBreakdown={budgetBreakdown} 
                totalCost={totalCost} 
                currency={state.project?.currency || 'USD'} 
                localCurrencyCode={localCurrencyCode || undefined}
                localCurrencyRate={localCurrencyRate || undefined}
                localCurrencyTotalCost={localCurrencyTotalCost || undefined}
                localCurrencyCostsBreakdown={localCurrencyCostsBreakdown || undefined}
              />
              
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Budget Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Project Details</h4>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                          <td className="py-1 text-gray-500">Project Name:</td>
                          <td className="py-1 font-medium">{state.project?.name}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-500">Location:</td>
                          <td className="py-1 font-medium">{state.project?.city}, {state.project?.country}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-500">Total Area:</td>
                          <td className="py-1 font-medium">{state.project?.totalArea?.toLocaleString()} {state.project?.areaUnit}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-500">Currency:</td>
                          <td className="py-1 font-medium">
                            USD
                            {localCurrencyCode && localCurrencyCode !== 'USD' && localCurrencyRate && (
                              <span className="block text-sm text-gray-500">
                                {localCurrencyCode} (Local)
                              </span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-500">Inflation Rate:</td>
                          <td className="py-1 font-medium">{state.project?.inflationRate}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="bg-white p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Budget Configuration</h4>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                          <td className="py-1 text-gray-500">Specification Level:</td>
                          <td className="py-1 font-medium">{state.budget?.specification}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-500">Layout Type:</td>
                          <td className="py-1 font-medium">{state.budget?.layout} Based</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-500">Space Types:</td>
                          <td className="py-1 font-medium">
                            {state.budget?.spaceAllocation && 
                              Object.keys(state.budget.spaceAllocation).length} types
                          </td>
                        </tr>
                        <tr>
                          <td className="py-1 text-gray-500">Rate per {state.project?.areaUnit}:</td>
                          <td className="py-1 font-medium">
                            {formatCurrency(totalCost / (state.project?.totalArea || 1), 'USD')}
                            {localCurrencyCode && localCurrencyCode !== 'USD' && localCurrencyRate && (
                              <span className="block text-sm text-gray-500">
                                {formatCurrency((totalCost * localCurrencyRate) / (state.project?.totalArea || 1), localCurrencyCode)}
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h4 className="font-medium text-gray-700 mb-2">Export Options</h4>
                  <div className="flex space-x-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="export-excel"
                        name="export-format"
                        value="excel"
                        checked={exportFormat === 'excel'}
                        onChange={() => setExportFormat('excel')}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <label htmlFor="export-excel" className="ml-2 text-sm text-gray-700">Excel</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="export-pdf"
                        name="export-format"
                        value="pdf"
                        checked={exportFormat === 'pdf'}
                        onChange={() => setExportFormat('pdf')}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <label htmlFor="export-pdf" className="ml-2 text-sm text-gray-700">PDF</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="export-csv"
                        name="export-format"
                        value="csv"
                        checked={exportFormat === 'csv'}
                        onChange={() => setExportFormat('csv')}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <label htmlFor="export-csv" className="ml-2 text-sm text-gray-700">CSV</label>
                    </div>
                    
                    <button
                      type="button"
                      className="ml-4 px-3 py-1 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      onClick={handleExport}
                    >
                      Export
                      <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-800">Could not calculate budget</h3>
              <p className="mt-2 text-gray-600">
                There was a problem calculating your budget. Please check your inputs and try again.
              </p>
            </div>
          )}
        </>
      )}
      
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onBack}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back: Space Allocation
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
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            onClick={onFinish}
            disabled={loading || calculatingBudget || !totalCost}
          >
            Complete Budget
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetResultsStep;
