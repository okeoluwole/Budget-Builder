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
      
      // CRITICAL: Skip currency conversion for CBRE data source - CBRE data is always in USD
      if (state.budget?.primaryDataSource === 'CBRE') {
        console.log("CBRE data source detected - skipping currency conversion, using USD");
        setLocalCurrencyCode('USD');
        setLocalCurrencyRate(1.0);
        return;
      }
      
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
      if (!state.project || !state.budget || loading || budgetTemplateStructure.length === 0) {
        console.log('Budget calculation skipped: missing required data', {
          hasProject: !!state.project,
          hasBudget: !!state.budget,
          loading,
          hasTemplate: budgetTemplateStructure.length > 0
        });
        return;
      }
      
      // Check if we already have results to avoid recalculating unnecessarily
      if (totalCost !== null && budgetBreakdown !== null) {
        console.log('Budget calculation skipped: results already exist');
        return;
      }

      try {
        setCalculatingBudget(true);
        console.log("=== STARTING BUDGET CALCULATION ===");
        console.log("Project data:", {
          country: state.project.country,
          city: state.project.city,
          totalArea: state.project.totalArea,
          areaUnit: state.project.areaUnit,
          currency: state.project.currency
        });
        console.log("Budget data:", {
          layout: state.budget.layout,
          specification: state.budget.specification,
          scope: state.budget.scope,
          primaryDataSource: state.budget.primaryDataSource,
          fitoutSpecification: state.budget.fitoutSpecification,
          furnitureSpecification: state.budget.furnitureSpecification,
          technologySpecification: state.budget.technologySpecification
        });
        
        // Validate required project fields
        if (!state.project.country || !state.project.city || !state.project.totalArea) {
          throw new Error(`Missing required project data: country=${!!state.project.country}, city=${!!state.project.city}, area=${!!state.project.totalArea}`);
        }
        
        // Validate required budget fields
        if (!state.budget.specification) {
          throw new Error('Missing budget specification');
        }
        
        // Calculate the budget - using savedProject if available, otherwise create a Project from InsertProject
        const projectForCalculation = state.savedProject || {
          id: 0, // Temporary ID for calculation
          name: state.project.name || 'Test Project',
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
        
        // Prepare budget with required defaults
        const budgetForCalculation = {
          ...state.budget,
          primaryDataSource: state.budget.primaryDataSource || 'CBRE',
          specification: state.budget.specification || 'Medium',
          layout: state.budget.layout || 'Activity',
          scope: state.budget.scope || 'Fitout',
          spaceAllocation: state.budget.spaceAllocation || {
            'Open workspace': { percentage: 50, area: projectForCalculation.totalArea * 0.5 },
            'Meeting rooms': { percentage: 25, area: projectForCalculation.totalArea * 0.25 },
            'Focus areas': { percentage: 15, area: projectForCalculation.totalArea * 0.15 },
            'Support spaces': { percentage: 10, area: projectForCalculation.totalArea * 0.1 }
          }
        };
        
        console.log("Prepared calculation data:", {
          project: projectForCalculation,
          budget: budgetForCalculation,
          budgetStructure: budgetTemplateStructure.length
        });
        
        const result = await calculateBudget({
          project: projectForCalculation,
          budget: budgetForCalculation,
          budgetStructure: budgetTemplateStructure
        });
        
        console.log("Budget calculation result:", result);
        
        // Validate calculation result
        if (!result || typeof result.totalCost !== 'number' || result.totalCost <= 0) {
          throw new Error(`Invalid calculation result: totalCost=${result?.totalCost}`);
        }
        
        console.log("Budget calculation complete:", { 
          totalCost: result.totalCost,
          fitoutCost: result.fitoutCost,
          furnitureCost: result.furnitureCost,
          costsBreakdown: result.costsBreakdown,
          rawUnitCost: result.rawUnitCost,
          adjustedUnitCost: result.adjustedUnitCost,
          datasetInfo: result.datasetInfo
        });
        
        // Update state with results
        setTotalCost(result.totalCost);
        setBudgetBreakdown(result); // Store the entire result object
        setRawUnitCost(result.rawUnitCost || null);
        setAdjustedUnitCost(result.adjustedUnitCost || null);
        setAreaUnit(result.areaUnit || null);
        setDatasetInfo(result.datasetInfo || null);
        
        // Set local currency info if available from calculation
        if (result.localCurrencyCode) setLocalCurrencyCode(result.localCurrencyCode);
        if (result.localCurrencyRate) setLocalCurrencyRate(result.localCurrencyRate);
        if (result.localCurrencyTotalCost) setLocalCurrencyTotalCost(result.localCurrencyTotalCost);
        if (result.localCurrencyCostsBreakdown) setLocalCurrencyCostsBreakdown(result.localCurrencyCostsBreakdown);
        
        // Update context with results
        updateBudgetResults(
          result.totalCost,
          result.fitoutCost,
          result.furnitureCost,
          result.costsBreakdown
        );
        
        console.log("=== BUDGET CALCULATION COMPLETE ===");
        
      } catch (error) {
        console.error('=== BUDGET CALCULATION ERROR ===');
        console.error('Error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Project data:', state.project);
        console.error('Budget data:', state.budget);
        
        // Show detailed error message based on error type
        let errorMessage = 'Could not calculate budget';
        if (error instanceof Error) {
          if (error.message.includes('Missing required project data')) {
            errorMessage = 'Missing project information. Please check that location and area are specified.';
          } else if (error.message.includes('Missing budget specification')) {
            errorMessage = 'Missing specification level. Please select a specification level.';
          } else if (error.message.includes('Invalid calculation result')) {
            errorMessage = 'Budget calculation returned invalid results. Please check your data source settings.';
          } else {
            errorMessage = `Calculation error: ${error.message}`;
          }
        }
        
        toast({
          title: "Budget calculation error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setCalculatingBudget(false);
      }
    };

    performBudgetCalculation();
  }, [state.project, state.budget, budgetTemplateStructure, loading, toast, updateBudgetResults, state.savedProject]);

  // PDF Export Function
  const handlePDFExport = async () => {
    try {
      const projectName = state.project?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Budget_Report';
      const dataSource = state.budget?.primaryDataSource === 'TT' ? 'Turner & Townsend' : 'CBRE';
      const totalAmount = formatCurrency(totalCost || 0, 'USD');
      const area = state.project?.totalArea || 1;
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Calculate component costs based on actual scope selection
      const calculateComponentCosts = () => {
        const scope = state.budget?.scope;
        const isTT = state.budget?.primaryDataSource === 'TT';
        
        if (scope === 'Fitout') {
          return [{
            name: isTT ? 'Construction' : 'Fitout Costs',
            amount: totalCost || 0,
            rate: (totalCost || 0) / area,
            percentage: 100
          }];
        }
        
        if (scope === 'Furniture') {
          return [{
            name: isTT ? 'Loose Furniture' : 'Furniture Costs',
            amount: totalCost || 0,
            rate: (totalCost || 0) / area,
            percentage: 100
          }];
        }
        
        if (scope === 'technology' || scope === 'AudioVisual') {
          return [{
            name: isTT ? 'Audio-Visual' : 'Technology Costs',
            amount: totalCost || 0,
            rate: (totalCost || 0) / area,
            percentage: 100
          }];
        }
        
        if (scope === 'Both') {
          return [
            {
              name: isTT ? 'Construction' : 'Fitout Costs',
              amount: (totalCost || 0) * 0.8, // 80% fitout, 20% furniture for Both scope
              rate: ((totalCost || 0) * 0.8) / area,
              percentage: 80
            },
            {
              name: isTT ? 'Loose Furniture' : 'Furniture Costs',
              amount: (totalCost || 0) * 0.2,
              rate: ((totalCost || 0) * 0.2) / area,
              percentage: 20
            }
          ];
        }
        
        // Complete Package - all 4 components
        return isTT ? [
          { name: 'Construction', amount: (totalCost || 0) * 0.729, rate: ((totalCost || 0) * 0.729) / area, percentage: 72.9 },
          { name: 'Loose Furniture', amount: (totalCost || 0) * 0.127, rate: ((totalCost || 0) * 0.127) / area, percentage: 12.7 },
          { name: 'Audio-Visual', amount: (totalCost || 0) * 0.095, rate: ((totalCost || 0) * 0.095) / area, percentage: 9.5 },
          { name: 'Professional Fees', amount: (totalCost || 0) * 0.049, rate: ((totalCost || 0) * 0.049) / area, percentage: 4.9 }
        ] : [
          { name: 'Fitout Costs', amount: (totalCost || 0) * 0.729, rate: ((totalCost || 0) * 0.729) / area, percentage: 72.9 },
          { name: 'Furniture Costs', amount: (totalCost || 0) * 0.127, rate: ((totalCost || 0) * 0.127) / area, percentage: 12.7 },
          { name: 'Technology Costs', amount: (totalCost || 0) * 0.095, rate: ((totalCost || 0) * 0.095) / area, percentage: 9.5 },
          { name: 'Professional Fees', amount: (totalCost || 0) * 0.049, rate: ((totalCost || 0) * 0.049) / area, percentage: 4.9 }
        ];
      };
      
      const componentCosts = calculateComponentCosts();

      // Create comprehensive HTML content for PDF-style display
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${projectName} - Executive Summary</title>
          <style>
            @page { size: A4; margin: 0.5in; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.4; font-size: 12px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 15px; }
            .header h1 { color: #1e40af; margin: 0 0 10px 0; font-size: 24px; }
            .header p { margin: 5px 0; color: #6b7280; font-size: 14px; }
            .summary-box { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; text-align: center; padding: 25px; margin: 20px 0; border-radius: 8px; }
            .summary-box h2 { margin: 0 0 10px 0; font-size: 18px; }
            .summary-box .amount { font-size: 32px; font-weight: bold; margin: 10px 0; }
            .summary-box .details { font-size: 14px; opacity: 0.9; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .info-card { border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; background: #f9fafb; }
            .info-card h3 { margin: 0 0 10px 0; color: #374151; font-size: 16px; }
            .info-card p { margin: 5px 0; color: #6b7280; }
            .info-card strong { color: #374151; }
            .breakdown-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .breakdown-table th { background: #f3f4f6; border: 1px solid #d1d5db; padding: 10px; text-align: left; font-weight: bold; color: #374151; }
            .breakdown-table td { border: 1px solid #e5e7eb; padding: 10px; }
            .breakdown-table .total-row { background: #dbeafe; font-weight: bold; }
            .breakdown-table .total-row td { border-top: 2px solid #3b82f6; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${state.project?.name || 'Budget Report'}</h1>
            <p><strong>Executive Summary Report</strong></p>
            <p>Data Source: ${dataSource} Global Fit-Out Cost Guide | Generated: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary-box">
            <h2>Total Budget Estimate</h2>
            <div class="amount">${totalAmount}</div>
            <div class="details">${state.project?.totalArea?.toLocaleString()} ${state.project?.areaUnit} @ ${formatCurrency((totalCost || 0) / (state.project?.totalArea || 1), 'USD')}/${state.project?.areaUnit}</div>
          </div>
          
          <div class="info-grid">
            <div class="info-card">
              <h3>Project Information</h3>
              <p><strong>Project Name:</strong> ${state.project?.name}</p>
              <p><strong>Location:</strong> ${state.project?.city}, ${state.project?.country}</p>
              <p><strong>Total Area:</strong> ${state.project?.totalArea?.toLocaleString()} ${state.project?.areaUnit}</p>
              <p><strong>Currency:</strong> USD</p>
              <p><strong>Inflation Rate:</strong> ${state.project?.inflationRate || 0}%</p>
            </div>
            
            <div class="info-card">
              <h3>Budget Configuration</h3>
              <p><strong>Data Source:</strong> ${dataSource}</p>
              <p><strong>Budget Scope:</strong> ${state.budget?.scope === 'Complete' ? 'Complete Package' : state.budget?.scope}</p>
              <p><strong>Component Specifications:</strong></p>
              ${(() => {
                const getSpecDisplay = (specLevel) => {
                  const specMap = {
                    'Low': 'Bronze (Low)', 'Medium': 'Silver (Medium)', 'High': 'Gold (High)',
                    'Bronze': 'Bronze (Low)', 'Silver': 'Silver (Medium)', 'Gold': 'Gold (High)'
                  };
                  return specMap[specLevel] || specLevel;
                };
                
                const scope = state.budget?.scope;
                const area = state.project?.totalArea || 1;
                let specs = [];
                
                if (state.budget?.primaryDataSource === 'TT' && state.budget?.ttComponentSpecs) {
                  const ttSpecs = state.budget.ttComponentSpecs;
                  if (ttSpecs.construction) specs.push(`Construction: ${getSpecDisplay(ttSpecs.construction)}`);
                  if (ttSpecs.furniture) specs.push(`Loose Furniture: ${getSpecDisplay(ttSpecs.furniture)}`);
                  if (ttSpecs.audioVisual) specs.push(`Audio-Visual: ${getSpecDisplay(ttSpecs.audioVisual)}`);
                  if (scope === 'Complete') specs.push(`Professional Fees: 4.9% of other components`);
                } else {
                  if (scope === 'Fitout' || scope === 'Complete' || scope === 'Both') {
                    const fitoutSpec = state.budget?.fitoutSpecification || state.budget?.specification || 'Medium';
                    specs.push(`Fitout Construction: ${getSpecDisplay(fitoutSpec)}`);
                  }
                  if (scope === 'Furniture' || scope === 'Complete' || scope === 'Both') {
                    const furnitureSpec = state.budget?.furnitureSpecification || state.budget?.specification || 'Medium';
                    specs.push(`Furniture: ${getSpecDisplay(furnitureSpec)}`);
                  }
                  if (scope === 'technology' || scope === 'AudioVisual' || scope === 'Complete') {
                    const technologySpec = state.budget?.technologySpecification || state.budget?.specification || 'Medium';
                    specs.push(`Technology: ${getSpecDisplay(technologySpec)}`);
                  }
                  if (scope === 'Complete') {
                    specs.push(`Professional Fees: 4.9% of other components`);
                  }
                }
                
                return specs.map(spec => `<div style="margin-left: 20px;">• ${spec}</div>`).join('');
              })()}
              <p><strong>Components:</strong> ${componentCosts.length} categories</p>
            </div>
          </div>
          
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount (USD)</th>
                <th>Rate per ${state.project?.areaUnit}</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${componentCosts.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>$${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>$${item.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${item.percentage.toFixed(1)}%</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td><strong>TOTAL BUDGET</strong></td>
                <td><strong>$${(totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><strong>$${((totalCost || 0) / area).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><strong>100.0%</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>This report was generated using ${dataSource} cost data and methodology. All costs are in USD.</p>
          </div>
        </body>
        </html>
      `;
      
      // Create and trigger HTML download (which can be opened as PDF)
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${projectName}_executive_summary_${currentDate}.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Export complete",
        description: "Executive summary downloaded (open HTML file and print to PDF)",
      });
    } catch (error) {
      console.error('PDF Export error:', error);
      toast({
        title: "PDF Export failed",
        description: "Error exporting PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Excel Export Function
  const handleExcelExport = async () => {
    try {
      const projectName = state.project?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Budget_Report';
      const dataSource = state.budget?.primaryDataSource === 'TT' ? 'Turner_Townsend' : 'CBRE';
      const totalAmount = formatCurrency(totalCost || 0, 'USD');
      const area = state.project?.totalArea || 1;
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Calculate component costs based on actual scope selection
      const calculateComponentCosts = () => {
        const scope = state.budget?.scope;
        const isTT = state.budget?.primaryDataSource === 'TT';
        
        if (scope === 'Fitout') {
          return [{
            name: isTT ? 'Construction' : 'Fitout Costs',
            amount: totalCost || 0,
            rate: (totalCost || 0) / area,
            percentage: 100
          }];
        }
        
        if (scope === 'Furniture') {
          return [{
            name: isTT ? 'Loose Furniture' : 'Furniture Costs',
            amount: totalCost || 0,
            rate: (totalCost || 0) / area,
            percentage: 100
          }];
        }
        
        if (scope === 'technology' || scope === 'AudioVisual') {
          return [{
            name: isTT ? 'Audio-Visual' : 'Technology Costs',
            amount: totalCost || 0,
            rate: (totalCost || 0) / area,
            percentage: 100
          }];
        }
        
        if (scope === 'Both') {
          return [
            {
              name: isTT ? 'Construction' : 'Fitout Costs',
              amount: (totalCost || 0) * 0.8, // 80% fitout, 20% furniture for Both scope
              rate: ((totalCost || 0) * 0.8) / area,
              percentage: 80
            },
            {
              name: isTT ? 'Loose Furniture' : 'Furniture Costs',
              amount: (totalCost || 0) * 0.2,
              rate: ((totalCost || 0) * 0.2) / area,
              percentage: 20
            }
          ];
        }
        
        // Complete Package - all 4 components
        return isTT ? [
          { name: 'Construction', amount: (totalCost || 0) * 0.729, rate: ((totalCost || 0) * 0.729) / area, percentage: 72.9 },
          { name: 'Loose Furniture', amount: (totalCost || 0) * 0.127, rate: ((totalCost || 0) * 0.127) / area, percentage: 12.7 },
          { name: 'Audio-Visual', amount: (totalCost || 0) * 0.095, rate: ((totalCost || 0) * 0.095) / area, percentage: 9.5 },
          { name: 'Professional Fees', amount: (totalCost || 0) * 0.049, rate: ((totalCost || 0) * 0.049) / area, percentage: 4.9 }
        ] : [
          { name: 'Fitout Costs', amount: (totalCost || 0) * 0.729, rate: ((totalCost || 0) * 0.729) / area, percentage: 72.9 },
          { name: 'Furniture Costs', amount: (totalCost || 0) * 0.127, rate: ((totalCost || 0) * 0.127) / area, percentage: 12.7 },
          { name: 'Technology Costs', amount: (totalCost || 0) * 0.095, rate: ((totalCost || 0) * 0.095) / area, percentage: 9.5 },
          { name: 'Professional Fees', amount: (totalCost || 0) * 0.049, rate: ((totalCost || 0) * 0.049) / area, percentage: 4.9 }
        ];
      };
      
      const componentCosts = calculateComponentCosts();
      
      // Enhanced CSV format for Excel export
      const csvContent = [
        [`${projectName} - Budget Report`],
        [`Generated: ${new Date().toLocaleDateString()}`],
        [`Data Source: ${dataSource.replace('_', ' ')} Global Fit-Out Cost Guide`],
        [],
        ['PROJECT DETAILS'],
        ['Project Name', state.project?.name || ''],
        ['Location', `${state.project?.city}, ${state.project?.country}`],
        ['Total Area', `${state.project?.totalArea?.toLocaleString()} ${state.project?.areaUnit}`],
        ['Currency', 'USD'],
        ['Inflation Rate', `${state.project?.inflationRate || 0}%`],
        [],
        ['BUDGET CONFIGURATION'],
        ['Data Source', dataSource.replace('_', ' ')],
        ['Budget Scope', state.budget?.scope === 'Complete' ? 'Complete Package' : state.budget?.scope || 'Complete Package'],
        ['Component Specifications', (() => {
          const getSpecDisplay = (specLevel) => {
            const specMap = {
              'Low': 'Bronze (Low)', 'Medium': 'Silver (Medium)', 'High': 'Gold (High)',
              'Bronze': 'Bronze (Low)', 'Silver': 'Silver (Medium)', 'Gold': 'Gold (High)'
            };
            return specMap[specLevel] || specLevel;
          };
          
          const scope = state.budget?.scope;
          let specs = [];
          
          if (state.budget?.primaryDataSource === 'TT' && state.budget?.ttComponentSpecs) {
            const ttSpecs = state.budget.ttComponentSpecs;
            if (ttSpecs.construction) specs.push(`Construction: ${getSpecDisplay(ttSpecs.construction)}`);
            if (ttSpecs.furniture) specs.push(`Furniture: ${getSpecDisplay(ttSpecs.furniture)}`);
            if (ttSpecs.audioVisual) specs.push(`Audio-Visual: ${getSpecDisplay(ttSpecs.audioVisual)}`);
            if (scope === 'Complete') specs.push(`Professional Fees: 4.9%`);
          } else {
            if (scope === 'Fitout' || scope === 'Complete' || scope === 'Both') {
              const fitoutSpec = state.budget?.fitoutSpecification || state.budget?.specification || 'Medium';
              specs.push(`Fitout: ${getSpecDisplay(fitoutSpec)}`);
            }
            if (scope === 'Furniture' || scope === 'Complete' || scope === 'Both') {
              const furnitureSpec = state.budget?.furnitureSpecification || state.budget?.specification || 'Medium';
              specs.push(`Furniture: ${getSpecDisplay(furnitureSpec)}`);
            }
            if (scope === 'technology' || scope === 'AudioVisual' || scope === 'Complete') {
              const technologySpec = state.budget?.technologySpecification || state.budget?.specification || 'Medium';
              specs.push(`Technology: ${getSpecDisplay(technologySpec)}`);
            }
            if (scope === 'Complete') {
              specs.push(`Professional Fees: 4.9%`);
            }
          }
          
          return specs.join('; ');
        })()],
        [],
        ['COST BREAKDOWN'],
        ['Category', 'Amount (USD)', `Rate per ${state.project?.areaUnit}`, 'Percentage'],
        ...componentCosts.map(item => [
          item.name,
          item.amount.toFixed(2),
          item.rate.toFixed(2),
          `${item.percentage}%`
        ]),
        [],
        ['TOTAL BUDGET', (totalCost || 0).toFixed(2), ((totalCost || 0) / area).toFixed(2), '100%'],
        [],
        ['SUMMARY'],
        ['Total Project Cost', totalAmount],
        [`Cost per ${state.project?.areaUnit}`, formatCurrency((totalCost || 0) / area, 'USD')],
        ['Number of Components', componentCosts.length.toString()]
      ];
      
      // Convert to CSV string
      const csvString = csvContent.map(row => 
        row.map(cell => `"${cell?.toString().replace(/"/g, '""') || ''}"`).join(',')
      ).join('\n');
      
      // Create and trigger download
      const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${projectName}_detailed_report_${currentDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Excel Export complete",
        description: "Detailed budget report downloaded successfully",
      });
    } catch (error) {
      console.error('Excel Export error:', error);
      toast({
        title: "Excel Export failed",
        description: "Error exporting Excel report. Please try again.",
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
                          {state.budget?.primaryDataSource === 'TT' ? 'Turner & Townsend Global Office Fit-Out Cost Guide 2025' : 
                           state.budget?.primaryDataSource === 'CBRE' ? 'CBRE Global Fit-Out Cost Guide' : 
                           state.budget?.isComparisonEnabled ? 'Multi-Source Comparison' :
                           state.budget?.primaryDataSource || 'CBRE Global Fit-Out Cost Guide'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Budget Scope:</span>
                        <span className="font-medium text-gray-800">
                          {state.budget?.scope === 'Complete' ? 'Complete Package (Construction, Furniture, Technology, Professional)' :
                           state.budget?.scope === 'Both' ? 'Complete Package (Fitout & Furniture)' :
                           state.budget?.scope === 'Fitout' ? 'Fitout Only' : 
                           state.budget?.scope === 'Furniture' ? 'Furniture Only' :
                           'Complete Package'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Components:</span>
                        <span className="font-medium text-gray-800">
                          {(() => {
                            const scope = state.budget?.scope;
                            if (scope === 'Fitout') return '1 component (Fitout)';
                            if (scope === 'Furniture') return '1 component (Furniture)';
                            if (scope === 'technology' || scope === 'AudioVisual') return '1 component (Technology)';
                            if (scope === 'Complete') return '4 components (Fitout, Furniture, Technology, Professional Fees)';
                            if (scope === 'Both') return '2 components (Fitout & Furniture)';
                            return '4 components';
                          })()}
                        </span>
                      </div>
                      {/* Component Specifications Breakdown */}
                      <div className="component-specifications">
                        <div className="mb-3">
                          <span className="text-gray-500 font-medium">Component Specifications:</span>
                        </div>
                        <div className="space-y-2">
                          {(() => {
                            const getSpecificationDisplay = (specLevel) => {
                              const specMap = {
                                'Low': 'Bronze (Low)',
                                'Medium': 'Silver (Medium)', 
                                'High': 'Gold (High)',
                                'Bronze': 'Bronze (Low)',
                                'Silver': 'Silver (Medium)',
                                'Gold': 'Gold (High)'
                              };
                              return specMap[specLevel] || specLevel;
                            };

                            const getSpecificationBadge = (specification) => {
                              if (specification.includes('Bronze')) {
                                return <span className="inline-block px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-md mr-2">Bronze</span>;
                              } else if (specification.includes('Silver')) {
                                return <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md mr-2">Silver</span>;
                              } else if (specification.includes('Gold')) {
                                return <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-md mr-2">Gold</span>;
                              }
                              return <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md mr-2">Standard</span>;
                            };

                            const componentSpecs = [];
                            const scope = state.budget?.scope;
                            const area = state.project?.totalArea || 1;

                            if (state.budget?.primaryDataSource === 'TT' && state.budget?.ttComponentSpecs) {
                              const specs = state.budget.ttComponentSpecs;
                              if (specs.construction) {
                                const constructionRate = Math.round((totalCost * 0.729) / area);
                                componentSpecs.push({
                                  name: 'Construction',
                                  specification: getSpecificationDisplay(specs.construction),
                                  rate: `US$${constructionRate}/sqm`
                                });
                              }
                              if (specs.furniture) {
                                const furnitureRate = Math.round((totalCost * 0.127) / area);
                                componentSpecs.push({
                                  name: 'Loose Furniture',
                                  specification: getSpecificationDisplay(specs.furniture),
                                  rate: `US$${furnitureRate}/sqm`
                                });
                              }
                              if (specs.audioVisual) {
                                const avRate = Math.round((totalCost * 0.095) / area);
                                componentSpecs.push({
                                  name: 'Audio-Visual',
                                  specification: getSpecificationDisplay(specs.audioVisual),
                                  rate: `US$${avRate}/sqm`
                                });
                              }
                              if (scope === 'Complete') {
                                const professionalRate = Math.round((totalCost * 0.049) / area);
                                componentSpecs.push({
                                  name: 'Professional Fees',
                                  specification: '4.9% of other components',
                                  rate: `US$${professionalRate}/sqm`
                                });
                              }
                            } else {
                              // CBRE specifications - Use actual breakdown values from server response
                              const breakdown = budgetBreakdown || {};
                              console.log("CBRE Component Specs - Using breakdown:", breakdown);
                              
                              if ((scope === 'Fitout' || scope === 'Complete Package' || scope === 'Both') && breakdown['FITOUT COSTS']) {
                                const fitoutSpec = state.budget?.fitoutSpecification || state.budget?.specification || 'Medium';
                                const fitoutRate = Math.round(breakdown['FITOUT COSTS'] / area);
                                console.log("Fitout rate calculation:", breakdown['FITOUT COSTS'], "÷", area, "=", fitoutRate);
                                componentSpecs.push({
                                  name: 'Fitout Construction',
                                  specification: getSpecificationDisplay(fitoutSpec),
                                  rate: `US$${fitoutRate}/sqm`
                                });
                              }
                              
                              if ((scope === 'Furniture' || scope === 'Complete Package' || scope === 'Both') && breakdown['FURNITURE COSTS']) {
                                const furnitureSpec = state.budget?.furnitureSpecification || state.budget?.specification || 'Medium';
                                const furnitureRate = Math.round(breakdown['FURNITURE COSTS'] / area);
                                console.log("Furniture rate calculation:", breakdown['FURNITURE COSTS'], "÷", area, "=", furnitureRate);
                                componentSpecs.push({
                                  name: 'Furniture',
                                  specification: getSpecificationDisplay(furnitureSpec),
                                  rate: `US$${furnitureRate}/sqm`
                                });
                              }
                              
                              if ((scope === 'Technology' || scope === 'AudioVisual' || scope === 'Complete Package') && breakdown['TECHNOLOGY COSTS']) {
                                const technologySpec = state.budget?.technologySpecification || state.budget?.specification || 'Medium';
                                const technologyRate = Math.round(breakdown['TECHNOLOGY COSTS'] / area);
                                console.log("Technology rate calculation:", breakdown['TECHNOLOGY COSTS'], "÷", area, "=", technologyRate);
                                componentSpecs.push({
                                  name: 'Technology',
                                  specification: getSpecificationDisplay(technologySpec),
                                  rate: `US$${technologyRate}/sqm`
                                });
                              }
                              
                              if (scope === 'Complete Package' && breakdown['PROFESSIONAL FEES']) {
                                const professionalRate = Math.round(breakdown['PROFESSIONAL FEES'] / area);
                                console.log("Professional fees rate calculation:", breakdown['PROFESSIONAL FEES'], "÷", area, "=", professionalRate);
                                componentSpecs.push({
                                  name: 'Professional Fees',
                                  specification: 'Standard',
                                  rate: `US$${professionalRate}/sqm`
                                });
                              }
                            }

                            return componentSpecs.map((comp, index) => (
                              <div key={index} className="flex items-center justify-between py-1">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-700 mr-2">•</span>
                                  <span className="text-sm font-medium text-gray-800">{comp.name}:</span>
                                  {getSpecificationBadge(comp.specification)}
                                  <span className="text-xs text-gray-600">{comp.specification}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-700">{comp.rate}</span>
                              </div>
                            ));
                          })()}
                        </div>
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
                          
                          // Enhanced T&T component mapping with accurate industry percentages
                          const componentMapping = {
                            'Construction': { 
                              key: 'fitoutCost',
                              fallbackAmount: totalCost * 0.729, // 72.9% industry standard
                              color: '#E11D48',
                              description: 'CAT B fit-out standard: partitions, flooring, ceilings, basic M&E works',
                              ttNote: 'Core construction works'
                            },
                            'Loose Furniture': { 
                              key: 'furnitureCost',
                              fallbackAmount: totalCost * 0.127, // 12.7%
                              color: '#059669',
                              description: 'Standard specification furniture: desks, chairs, storage, meeting furniture',
                              ttNote: 'Movable furniture package'
                            },
                            'Audio-Visual': { 
                              key: 'audioVisualCost',
                              fallbackAmount: totalCost * 0.095, // 9.5%
                              color: '#DC2626',
                              description: 'Medium-spec AV package: displays, conferencing, control systems',
                              ttNote: 'Technology integration'
                            },
                            'Professional Fees': { 
                              key: 'professionalFeesCost',
                              fallbackAmount: totalCost * 0.049, // 4.9%
                              color: '#7C3AED',
                              description: '12-15% of construction cost: design, project management, consulting',
                              ttNote: 'Professional services'
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
                    <div className="export-buttons grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                      <button 
                        onClick={() => handlePDFExport()}
                        className="export-btn primary flex flex-col items-center p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Executive Summary PDF</span>
                      </button>
                      <button 
                        onClick={() => handleExcelExport()}
                        className="export-btn flex flex-col items-center p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-6 h-6 mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 11-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Detailed Excel Report</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced CBRE Interactive Cost Breakdown */}
                {state.budget?.primaryDataSource !== 'TT' && (
                  <div className="mt-6">
                    <div className="cost-summary-table bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="table-header bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-semibold text-gray-800">Budget Cost Summary (CBRE Methodology)</h4>
                          <div className="flex items-center space-x-4">
                            <div className="data-source-badge flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border">
                              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                                <span className="text-white font-bold text-xs">CBRE</span>
                              </div>
                              <span className="text-sm font-medium text-gray-700">CBRE Global Fit-Out Cost Guide</span>
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
                        
                        {/* Enhanced CBRE Component Breakdown - Using Actual Server Data */}
                        {(() => {
                          const area = state.project?.totalArea || 1;
                          const breakdown = budgetBreakdown?.costsBreakdown || {};
                          
                          console.log("CBRE Breakdown Table - budgetBreakdown:", budgetBreakdown);
                          console.log("CBRE Breakdown Table - breakdown:", breakdown);
                          console.log("CBRE Breakdown Table - Object.keys(breakdown):", Object.keys(breakdown));
                          console.log("CBRE Breakdown Table - breakdown entries:", Object.entries(breakdown));
                          console.log("CBRE Breakdown Table - totalCost:", totalCost);
                          console.log("CBRE Breakdown Table - area:", area);
                          
                          // Create component mapping for CBRE data using actual server breakdown
                          const componentDisplayMap = {
                            'FITOUT COSTS': {
                              displayName: "Construction Costs",
                              color: "#3B82F6",
                              description: "Partitions, flooring, ceilings, mechanical works, electrical systems"
                            },
                            'FURNITURE COSTS': {
                              displayName: "Furniture Costs",
                              color: "#10B981", 
                              description: "Desks, chairs, storage, meeting room furniture, workstations"
                            },
                            'TECHNOLOGY COSTS': {
                              displayName: "Technology Costs",
                              color: "#F59E0B",
                              description: "AV systems, displays, conferencing equipment, IT infrastructure"
                            },
                            'PROFESSIONAL FEES': {
                              displayName: "Professional Fees",
                              color: "#8B5CF6",
                              description: "Design, project management, consulting, contract administration"
                            }
                          };
                          
                          // Build component costs from actual server breakdown with proper fallback
                          let cbreComponentCosts = [];
                          
                          // First try to use actual server breakdown
                          if (breakdown && Object.keys(breakdown).length > 0) {
                            console.log("CBRE Breakdown Table - Using server breakdown with", Object.keys(breakdown).length, "components");
                            
                            const filteredEntries = Object.entries(breakdown)
                              .filter(([key, value]) => {
                                const hasMapping = !!componentDisplayMap[key];
                                const isPositive = value > 0;
                                console.log(`Filter check - ${key}: hasMapping=${hasMapping}, value=${value}, isPositive=${isPositive}`);
                                return hasMapping && isPositive;
                              });
                            
                            console.log("CBRE Breakdown Table - Filtered entries:", filteredEntries.length);
                            
                            cbreComponentCosts = filteredEntries.map(([key, amount]) => {
                              const config = componentDisplayMap[key];
                              const rate = amount / area;
                              const percentage = (amount / totalCost) * 100;
                              
                              console.log(`Creating component: ${key} -> ${config.displayName}`);
                              console.log(`  Amount: $${amount}, Rate: $${Math.round(rate)}/sqm, Percentage: ${percentage.toFixed(1)}%`);
                              
                              return {
                                name: config.displayName,
                                amount: amount,
                                rate: rate,
                                percentage: percentage,
                                color: config.color,
                                description: config.description
                              };
                            });
                            
                            console.log("CBRE Breakdown Table - Final component costs array length:", cbreComponentCosts.length);
                          } else {
                            console.log("CBRE Breakdown Table - No valid breakdown data, keys:", Object.keys(breakdown));
                          } 
                          
                          // Fallback: use direct budget values if breakdown is empty
                          if (cbreComponentCosts.length === 0 && totalCost > 0) {
                            console.log("Using fallback calculation with individual budget values");
                            
                            const components = [];
                            
                            // Use individual cost values from budget state
                            if (state.budget?.fitoutCost || budgetBreakdown?.fitoutCost) {
                              const amount = state.budget?.fitoutCost || budgetBreakdown?.fitoutCost;
                              components.push({
                                name: "Construction Costs",
                                amount: amount,
                                rate: amount / area,
                                percentage: (amount / totalCost) * 100,
                                color: "#3B82F6",
                                description: "Partitions, flooring, ceilings, mechanical works, electrical systems"
                              });
                            }
                            
                            if (state.budget?.furnitureCost || budgetBreakdown?.furnitureCost) {
                              const amount = state.budget?.furnitureCost || budgetBreakdown?.furnitureCost;
                              components.push({
                                name: "Furniture Costs",
                                amount: amount,
                                rate: amount / area,
                                percentage: (amount / totalCost) * 100,
                                color: "#10B981",
                                description: "Desks, chairs, storage, meeting room furniture, workstations"
                              });
                            }
                            
                            if (state.budget?.technologyCost || budgetBreakdown?.technologyCost) {
                              const amount = state.budget?.technologyCost || budgetBreakdown?.technologyCost;
                              components.push({
                                name: "Technology Costs",
                                amount: amount,
                                rate: amount / area,
                                percentage: (amount / totalCost) * 100,
                                color: "#F59E0B",
                                description: "AV systems, displays, conferencing equipment, IT infrastructure"
                              });
                            }
                            
                            // Professional fees calculation (15% of other components)
                            const otherTotal = components.reduce((sum, comp) => sum + comp.amount, 0);
                            if (otherTotal > 0) {
                              const professionalAmount = otherTotal * 0.15;
                              components.push({
                                name: "Professional Fees",
                                amount: professionalAmount,
                                rate: professionalAmount / area,
                                percentage: (professionalAmount / totalCost) * 100,
                                color: "#8B5CF6",
                                description: "Design, project management, consulting, contract administration"
                              });
                            }
                            
                            cbreComponentCosts = components;
                          }
                          
                          return cbreComponentCosts.map((data) => (
                            <div key={data.name} className="cost-row grid grid-cols-4 gap-6 py-4 border-b border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50 transition-all duration-200 rounded-lg group">
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
                        
                        <div className="grid grid-cols-4 gap-6 py-6 font-bold text-gray-900 bg-gradient-to-r from-gray-100 to-green-100 border-t-4 border-green-500 rounded-lg mt-4">
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
                      onClick={handlePDFExport}
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
          Back: {state.budget?.primaryDataSource === 'JLL' ? 'JLL Options' : 'Specification'}
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
