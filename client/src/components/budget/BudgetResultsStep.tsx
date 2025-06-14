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
  const [rawUnitCost, setRawUnitCost] = useState<number | null>(null);
  const [adjustedUnitCost, setAdjustedUnitCost] = useState<number | null>(null);
  const [areaUnit, setAreaUnit] = useState<string | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<any | null>(null);
  const [localCurrencyCode, setLocalCurrencyCode] = useState<string | null>(null);
  const [localCurrencyRate, setLocalCurrencyRate] = useState<number | null>(null);
  const [localCurrencyTotalCost, setLocalCurrencyTotalCost] = useState<number | null>(null);
  const [localCurrencyCostsBreakdown, setLocalCurrencyCostsBreakdown] = useState<{[key: string]: number} | null>(null);
  
  // Multi-source comparison state
  const [comparisonResults, setComparisonResults] = useState<{[source: string]: any} | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch currency rates for the project country
  useEffect(() => {
    const fetchCurrencyRate = async () => {
      if (!state.project?.country) return;
      
      try {
        // Map countries to their ISO currency codes
        const countryToCurrency: Record<string, string> = {
          // Europe
          'Austria': 'EUR',
          'Belgium': 'EUR',
          'Bulgaria': 'BGN',
          'Croatia': 'EUR',
          'Cyprus': 'EUR',
          'Czech Republic': 'CZK',
          'Denmark': 'DKK',
          'Estonia': 'EUR',
          'Finland': 'EUR',
          'France': 'EUR',
          'Germany': 'EUR',
          'Greece': 'EUR',
          'Hungary': 'HUF',
          'Ireland': 'EUR',
          'Italy': 'EUR',
          'Latvia': 'EUR',
          'Lithuania': 'EUR',
          'Luxembourg': 'EUR',
          'Malta': 'EUR',
          'Netherlands': 'EUR',
          'Poland': 'PLN',
          'Portugal': 'EUR',
          'Romania': 'RON',
          'Slovakia': 'EUR',
          'Slovenia': 'EUR',
          'Spain': 'EUR',
          'Sweden': 'SEK',
          'United Kingdom': 'GBP',
          'Switzerland': 'CHF',
          'Norway': 'NOK',
          
          // North America
          'United States': 'USD',
          'Canada': 'CAD',
          'Mexico': 'MXN',
          
          // Asia Pacific
          'Australia': 'AUD',
          'New Zealand': 'NZD',
          'Japan': 'JPY',
          'China': 'CNY',
          'Singapore': 'SGD',
          'Hong Kong': 'HKD',
          'India': 'INR',
          'Indonesia': 'IDR',
          'Malaysia': 'MYR',
          'Philippines': 'PHP',
          'South Korea': 'KRW',
          'Taiwan': 'TWD',
          'Thailand': 'THB',
          'Vietnam': 'VND',
          
          // South America
          'Brazil': 'BRL',
          'Argentina': 'ARS',
          'Chile': 'CLP',
          'Colombia': 'COP',
          'Peru': 'PEN',
          'Venezuela': 'VES',
          
          // Africa
          'South Africa': 'ZAR',
          'Nigeria': 'NGN',
          'Egypt': 'EGP',
          'Kenya': 'KES',
          'Morocco': 'MAD',
          'Ghana': 'GHS',
          'Ethiopia': 'ETB',
          'Tanzania': 'TZS',
          'Uganda': 'UGX',
          'Angola': 'AOA',
          'Mozambique': 'MZN',
          'Zimbabwe': 'ZWL',
          'Botswana': 'BWP',
          'Namibia': 'NAD',
          'Mauritius': 'MUR',
          
          // Middle East
          'Saudi Arabia': 'SAR',
          'United Arab Emirates': 'AED',
          'Qatar': 'QAR',
          'Israel': 'ILS',
          'Turkey': 'TRY',
          'Jordan': 'JOD',
          'Kuwait': 'KWD',
          'Bahrain': 'BHD',
          'Oman': 'OMR',
          'Lebanon': 'LBP',
          'Iraq': 'IQD',
          
          // Other
          'Russia': 'RUB'
        };
        
        const currencyCode = countryToCurrency[state.project.country] || 'USD';
        console.log(`Currency lookup for ${state.project.country}: ${currencyCode}`);
        
        if (currencyCode && currencyCode !== 'USD') {
          try {
            // Get specific currency rate directly
            const directRateRes = await apiRequest('GET', `/api/currency-rates/${currencyCode}`, undefined);
            const directRateData = await directRateRes.json();
            console.log("Direct currency rate response:", directRateData, typeof directRateData.rate);
            
            // Check if we got a valid rate value
            if (directRateData && directRateData.rate !== undefined && directRateData.rate !== null) {
              const rate = parseFloat(directRateData.rate.toString());
              
              if (!isNaN(rate) && rate > 0) {
                console.log(`Setting currency: ${currencyCode} with rate: ${rate}`);
                setLocalCurrencyCode(currencyCode);
                setLocalCurrencyRate(rate);
                
                // For debugging: calculate the conversion example
                const exampleAmountUSD = 1000;
                const convertedAmount = exampleAmountUSD * rate;
                console.log(`Example conversion: $${exampleAmountUSD} USD = ${convertedAmount.toFixed(2)} ${currencyCode}`);
                
                return;
              } else {
                console.error(`Invalid rate value for ${currencyCode}: ${rate}`);
              }
            } else {
              console.error(`No rate property found in response for ${currencyCode}:`, directRateData);
            }
          } catch (error) {
            console.error(`Error fetching rate for ${currencyCode}:`, error);
          }
        }
        
        // Fallback to original implementation if direct lookup fails
        const ratesRes = await apiRequest('GET', '/api/currency-rates', undefined);
        const ratesData = await ratesRes.json();
        
        console.log("Available currency rates:", ratesData.length);
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
          rawUnitCost: calcRawUnitCost,
          adjustedUnitCost: calcAdjustedUnitCost,
          areaUnit: calcAreaUnit,
          datasetInfo: calcDatasetInfo,
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
          rawUnitCost: calcRawUnitCost,
          adjustedUnitCost: calcAdjustedUnitCost,
          datasetInfo: calcDatasetInfo,
          localCurrencyCode: calcLocalCurrencyCode,
          localCurrencyRate: calcLocalCurrencyRate
        });
        
        setTotalCost(calculatedTotalCost);
        setBudgetBreakdown(costsBreakdown);
        
        // Set unit cost information
        if (calcRawUnitCost) setRawUnitCost(calcRawUnitCost);
        if (calcAdjustedUnitCost) setAdjustedUnitCost(calcAdjustedUnitCost);
        if (calcAreaUnit) setAreaUnit(calcAreaUnit);
        if (calcDatasetInfo) setDatasetInfo(calcDatasetInfo);
        
        // Set local currency info if available from calculation
        if (calcLocalCurrencyCode) setLocalCurrencyCode(calcLocalCurrencyCode);
        if (calcLocalCurrencyRate) setLocalCurrencyRate(calcLocalCurrencyRate);
        if (calcLocalCurrencyTotalCost) setLocalCurrencyTotalCost(calcLocalCurrencyTotalCost);
        if (calcLocalCurrencyCostsBreakdown) setLocalCurrencyCostsBreakdown(calcLocalCurrencyCostsBreakdown);
        
        // Update context with results - properly pass the fitout and furniture costs
        const fitoutCost = costsBreakdown['FITOUT COSTS']; 
        const furnitureCost = costsBreakdown['FURNITURE COSTS'];
        
        console.log("Updating budget results with:", { 
          totalCost: calculatedTotalCost,
          fitoutCost,
          furnitureCost,
          costsBreakdown
        });
        
        updateBudgetResults(calculatedTotalCost, fitoutCost, furnitureCost, costsBreakdown);
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
              {/* Enhanced Modern Card Design for Total Budget */}
              <div className="results-container bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-2xl mb-8">
                <div className="total-budget-card bg-white rounded-2xl p-8 text-center shadow-2xl">
                  <h3 className="text-xl font-medium text-gray-700 mb-4">Total Budget Estimate</h3>
                  
                  <div className="text-5xl font-bold text-gray-900 mb-4">
                    {formatCurrency(totalCost, 'USD')}
                  </div>
                  
                  <div className="text-lg text-gray-600">
                    {state.project?.totalArea?.toLocaleString()} {state.project?.areaUnit} @ 
                    {formatCurrency(totalCost / (state.project?.totalArea || 1), 'USD')}
                    /{state.project?.areaUnit}
                  </div>
                </div>
              </div>
              
              {/* Enhanced budget configuration section */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Budget Details</h3>
                
                {/* Enhanced Budget Details Grid with Modern Cards */}
                <div className="budget-details-grid grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="detail-card bg-white p-6 rounded-xl shadow-lg">
                    <h4 className="font-semibold text-gray-800 mb-4 text-lg">Project Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Project Name:</span>
                        <span className="font-medium text-gray-800">{state.project?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span className="font-medium text-gray-800">{state.project?.city}, {state.project?.country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Area:</span>
                        <span className="font-medium text-gray-800">{state.project?.totalArea?.toLocaleString()} {state.project?.areaUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Currency:</span>
                        <span className="font-medium text-gray-800">USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Inflation Rate:</span>
                        <span className="font-medium text-gray-800">{state.project?.inflationRate || 0}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-card bg-white p-6 rounded-xl shadow-lg">
                    <h4 className="font-semibold text-gray-800 mb-4 text-lg">Budget Configuration</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Data Source:</span>
                        <span className="font-medium text-gray-800">
                          {state.budget?.primaryDataSource === 'TT' ? 'T&T Guide' : 
                           state.budget?.primaryDataSource === 'CBRE' ? 'CBRE Guide' : 
                           state.budget?.primaryDataSource || 'Mixed Sources'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Budget Scope:</span>
                        <span className="font-medium text-gray-800">
                          {state.budget?.scope === 'Complete' ? 'Complete Package' :
                           state.budget?.scope === 'Both' ? 'Fitout & Furniture' :
                           state.budget?.scope === 'Fitout' ? 'Fitout Only' : 
                           state.budget?.scope || 'Standard'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Components:</span>
                        <span className="font-medium text-gray-800">
                          {state.budget?.primaryDataSource === 'TT' && state.budget?.ttComponentSpecs ? 
                            `${Object.keys(state.budget.ttComponentSpecs).length} types` :
                            state.budget?.spaceAllocation ? `${Object.keys(state.budget.spaceAllocation).length} types` : 
                            '4 types'}
                        </span>
                      </div>
                      
                      {/* T&T Component-Specific Rates */}
                      {state.budget?.primaryDataSource === 'TT' && state.budget?.ttComponentSpecs && (() => {
                        const area = state.project?.totalArea || 1;
                        const constructionRate = Math.round((totalCost * 0.75) / area);
                        const furnitureRate = Math.round((totalCost * 0.15) / area);
                        const avRate = Math.round((totalCost * 0.06) / area);
                        const professionalRate = Math.round((totalCost * 0.04) / area);
                        const combinedRate = Math.round(totalCost / area);
                        
                        return (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Construction Rate:</span>
                              <span className="font-medium text-gray-800">{formatCurrency(constructionRate, 'USD')}/{state.project?.areaUnit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Furniture Rate:</span>
                              <span className="font-medium text-gray-800">{formatCurrency(furnitureRate, 'USD')}/{state.project?.areaUnit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Audio-Visual Rate:</span>
                              <span className="font-medium text-gray-800">{formatCurrency(avRate, 'USD')}/{state.project?.areaUnit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Professional Rate:</span>
                              <span className="font-medium text-gray-800">{formatCurrency(professionalRate, 'USD')}/{state.project?.areaUnit}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                              <span className="text-gray-700 font-medium">Combined Rate:</span>
                              <span className="font-bold text-gray-900">{formatCurrency(combinedRate, 'USD')}/{state.project?.areaUnit}</span>
                            </div>
                          </>
                        );
                      })()}
                      
                      {/* Standard CBRE Rates */}
                      {state.budget?.primaryDataSource !== 'TT' && (
                        <>
                          {state.budget?.scope === 'Both' ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Fitout Base Rate:</span>
                                <span className="font-medium text-gray-800">
                                  {state.budget?.fitoutCost && state.project?.totalArea ? 
                                    formatCurrency(state.budget.fitoutCost / state.project.totalArea, 'USD') : '-'}/{areaUnit}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Furniture Base Rate:</span>
                                <span className="font-medium text-gray-800">
                                  {state.budget?.furnitureCost && state.project?.totalArea ? 
                                    formatCurrency(state.budget.furnitureCost / state.project.totalArea, 'USD') : '-'}/{areaUnit}
                                </span>
                              </div>
                              <div className="flex justify-between pt-2 border-t">
                                <span className="text-gray-700 font-medium">Combined Rate:</span>
                                <span className="font-bold text-gray-900">
                                  {totalCost && state.project?.totalArea ?
                                    formatCurrency(totalCost / state.project.totalArea, 'USD') : '-'}/{areaUnit}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between pt-2 border-t">
                              <span className="text-gray-700 font-medium">Final Rate:</span>
                              <span className="font-bold text-gray-900">
                                {totalCost && state.project?.totalArea ? 
                                  formatCurrency(totalCost / state.project.totalArea, 'USD') : '-'}/{areaUnit}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Enhanced T&T Component Breakdown with Interactive Features */}
                {state.budget?.primaryDataSource === 'TT' && state.budget?.ttComponentSpecs && (
                  <div className="mt-6">
                    <div className="cost-summary-table bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="table-header bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-semibold text-gray-800">Budget Cost Summary (T&T Methodology)</h4>
                          <div className="flex items-center space-x-4">
                            <div className="data-source-badge flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border">
                              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                                <span className="text-white font-bold text-xs">T&T</span>
                              </div>
                              <span className="text-sm font-medium text-gray-700">Turner & Townsend Global Fit-Out Cost Guide 2025</span>
                            </div>
                            <div className="view-toggle flex bg-gray-100 rounded-lg p-1">
                              <button className="active px-3 py-1 text-xs font-medium bg-white text-gray-700 rounded shadow">Table View</button>
                              <button className="px-3 py-1 text-xs font-medium text-gray-500">Chart View</button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="cost-breakdown p-6">
                        <div className="grid grid-cols-4 gap-6 text-sm font-semibold text-gray-700 border-b-2 border-gray-200 pb-4 mb-4">
                          <div className="flex items-center">
                            <span>CATEGORY</span>
                          </div>
                          <div className="text-right">AMOUNT (USD)</div>
                          <div className="text-right">RATE/SQM</div>
                          <div className="text-right">PERCENTAGE</div>
                        </div>
                        
                        {/* Display actual T&T component costs from budget breakdown */}
                        {(() => {
                          const ttSpecs = state.budget?.ttComponentSpecs || {};
                          const area = state.project?.totalArea || 1;
                          
                          // Use actual calculated breakdown from budgetBreakdown if available
                          const actualBreakdown = budgetBreakdown?.costsBreakdown || {};
                          
                          // Map component names and calculate from actual data
                          const componentMapping = {
                            'Construction Costs': { 
                              key: 'fitoutCost',
                              fallbackAmount: totalCost * 0.75,
                              color: '#3B82F6',
                              description: 'Partitions, walls, floors, ceilings, mechanical, electrical'
                            },
                            'Loose Furniture': { 
                              key: 'furnitureCost',
                              fallbackAmount: totalCost * 0.15,
                              color: '#10B981',
                              description: 'Desks, chairs, workstations, storage, soft seating'
                            },
                            'Audio-Visual Systems': { 
                              key: 'audioVisualCost',
                              fallbackAmount: totalCost * 0.06,
                              color: '#F59E0B',
                              description: 'Display screens, conferencing systems, AV equipment'
                            },
                            'Professional Fees': { 
                              key: 'professionalFeesCost',
                              fallbackAmount: totalCost * 0.04,
                              color: '#8B5CF6',
                              description: 'Design, project management, cost consulting'
                            }
                          };
                          
                          // Calculate component costs using actual breakdown or T&T methodology
                          const componentCosts = Object.entries(componentMapping).map(([componentName, config]) => {
                            const actualAmount = actualBreakdown[config.key] || 
                                               (budgetBreakdown?.[config.key]) || 
                                               config.fallbackAmount;
                            
                            const amount = Math.round(actualAmount);
                            const rate = Math.round(amount / area);
                            const percentage = (amount / totalCost) * 100;
                            
                            return {
                              name: componentName,
                              amount,
                              rate,
                              percentage: Math.max(0.1, percentage), // Ensure minimum 0.1% visibility
                              color: config.color,
                              description: config.description
                            };
                          });
                          
                          return componentCosts.map((data) => (
                            <div key={data.name} className="cost-row grid grid-cols-4 gap-6 py-4 border-b border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 rounded-lg group">
                              <div className="category-info flex items-center space-x-3">
                                <div 
                                  className="color-indicator w-4 h-4 rounded-full border-2 border-white shadow-md" 
                                  style={{ backgroundColor: data.color }}
                                ></div>
                                <span className="category-name font-semibold text-gray-800 group-hover:text-gray-900">{data.name}</span>
                                <div className="group/tooltip relative">
                                  <span className="info-icon text-gray-400 hover:text-gray-600 cursor-help text-sm">ⓘ</span>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-xs rounded-lg p-3 w-64 z-20 shadow-lg">
                                    <div className="font-medium mb-1">{data.name}</div>
                                    <div>{data.description}</div>
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              </div>
                              <div className="amount text-right">
                                <span className="font-bold text-lg text-gray-900">{formatCurrency(data.amount, 'USD')}</span>
                              </div>
                              <div className="rate text-right">
                                <span className="font-medium text-gray-700">{formatCurrency(data.rate, 'USD')}/{state.project?.areaUnit}</span>
                              </div>
                              <div className="percentage text-right">
                                <div className="flex items-center justify-end space-x-3">
                                  <div className="percentage-bar w-16 bg-gray-200 rounded-full h-3 shadow-inner">
                                    <div 
                                      className="fill h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
                                      style={{ 
                                        width: `${Math.min(100, data.percentage)}%`,
                                        background: `linear-gradient(90deg, ${data.color}, ${data.color}dd)`
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-base font-bold text-gray-900">{data.percentage.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                        
                        <div className="grid grid-cols-4 gap-6 py-6 font-bold text-gray-900 bg-gradient-to-r from-gray-100 to-blue-100 border-t-4 border-blue-500 rounded-lg mt-4">
                          <div className="flex items-center">
                            <span className="text-lg">TOTAL BUDGET</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-black">{formatCurrency(totalCost, 'USD')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold">{formatCurrency(totalCost / (state.project?.totalArea || 1), 'USD')}/{state.project?.areaUnit}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black">100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Professional Export Options */}
                <div className="export-section mt-8">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Options</h3>
                    <div className="export-buttons grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button 
                        onClick={handleExport}
                        className="export-btn primary flex flex-col items-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Executive Summary PDF</span>
                      </button>
                      <button 
                        onClick={handleExport}
                        className="export-btn flex flex-col items-center p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 11-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Detailed Excel Report</span>
                      </button>
                      <button 
                        onClick={handleExport}
                        className="export-btn flex flex-col items-center p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Presentation Slides</span>
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast({
                            title: "Link copied",
                            description: "Budget link copied to clipboard",
                          });
                        }}
                        className="export-btn flex flex-col items-center p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                        </svg>
                        <span className="text-sm font-medium">Share Link</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Standard BudgetSummary for non-T&T sources */}
                {state.budget?.primaryDataSource !== 'TT' && (
                  <BudgetSummary 
                    budgetBreakdown={{
                      ...budgetBreakdown,
                      projectName: state.project?.name,
                      location: state.project?.country && state.project?.city 
                      ? `${state.project.city}, ${state.project.country}` 
                      : undefined,
                    totalArea: state.project?.totalArea,
                    areaUnit: state.project?.areaUnit,
                    inflationRate: state.project?.inflationRate,
                    layoutType: state.budget?.layout,
                    spaceTypes: state.budget?.spaceAllocation ? Object.keys(state.budget.spaceAllocation).length + " types" : undefined,
                    baseUnitCost: rawUnitCost,
                    adjustedUnitCost: adjustedUnitCost
                  }}
                  totalCost={totalCost || 0} 
                  currency={state.project?.currency || 'USD'}
                  scope={state.budget?.scope}
                  fitoutCost={state.budget?.fitoutCost}
                  furnitureCost={state.budget?.furnitureCost}
                  specification={state.budget?.specification}
                  fitoutSpecification={state.budget?.fitoutSpecification}
                  furnitureSpecification={state.budget?.furnitureSpecification}
                />
                )}

                {datasetInfo && (
                  <div className="bg-white p-4 border rounded-lg mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">Dataset Information</h4>
                    <div className="text-sm text-gray-600">
                      <p className="mb-1"><span className="font-medium text-gray-700">Source:</span> {datasetInfo.name}</p>
                      <p className="mb-1"><span className="font-medium text-gray-700">Sheet:</span> {datasetInfo.sheet}</p>
                      <p className="mb-1"><span className="font-medium text-gray-700">Region:</span> {datasetInfo.region}</p>
                      <p className="mb-1"><span className="font-medium text-gray-700">Benchmark:</span> {datasetInfo.benchmark}</p>
                    </div>
                  </div>
                )}
                
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
          Back: {state.budget?.primaryDataSource === 'JLL' ? 'JLL Options' : 'Space Allocation'}
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
