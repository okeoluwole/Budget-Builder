import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Budget, Project } from '@shared/schema';
import { formatCurrency } from '@/utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports: React.FC = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<'comparison' | 'distribution'>('comparison');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  
  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery({ 
    queryKey: ['/api/projects']
  });
  
  // Fetch budgets
  const { data: budgets, isLoading: budgetsLoading } = useQuery({ 
    queryKey: ['/api/budgets']
  });
  
  // Toggle project selection
  const toggleProjectSelection = (projectId: number) => {
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(selectedProjects.filter(id => id !== projectId));
    } else {
      setSelectedProjects([...selectedProjects, projectId]);
    }
  };
  
  // Generate report based on selected projects
  useEffect(() => {
    if (selectedProjects.length === 0 || !projects || !budgets) return;
    
    try {
      // For comparison report
      const comparisonData: any[] = [];
      
      // For distribution report (cost categories)
      const distributionMap: Record<string, number> = {};
      let totalDistributionCost = 0;
      
      selectedProjects.forEach(projectId => {
        const project = projects.find((p: Project) => p.id === projectId);
        if (!project) return;
        
        // Find latest completed budget for this project
        const projectBudgets = budgets
          .filter((b: Budget) => b.projectId === projectId && b.status === 'completed')
          .sort((a: Budget, b: Budget) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        
        if (projectBudgets.length === 0) return;
        
        const latestBudget = projectBudgets[0];
        
        // Add to comparison data
        comparisonData.push({
          name: project.name,
          totalCost: latestBudget.totalCost || 0,
          costPerUnit: latestBudget.totalCost 
            ? latestBudget.totalCost / project.totalArea 
            : 0,
          currency: project.currency,
          specification: latestBudget.specification,
          layout: latestBudget.layout
        });
        
        // Aggregate distribution data across selected projects
        if (latestBudget.costsBreakdown) {
          Object.entries(latestBudget.costsBreakdown).forEach(([category, cost]) => {
            if (typeof cost === 'number') {
              distributionMap[category] = (distributionMap[category] || 0) + cost;
              totalDistributionCost += cost;
            }
          });
        }
      });
      
      setChartData(comparisonData);
      
      // Convert distribution map to array for pie chart
      const distributionArray = Object.entries(distributionMap).map(([name, value]) => ({
        name,
        value,
        percentage: (value / totalDistributionCost) * 100
      }));
      
      setDistributionData(distributionArray);
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report Generation Error",
        description: "There was an error generating the report. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedProjects, projects, budgets, toast]);
  
  // Export report
  const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
    if (selectedProjects.length === 0) {
      toast({
        title: "No projects selected",
        description: "Please select at least one project to export.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Exporting report",
      description: `Exporting ${reportType} report in ${format.toUpperCase()} format...`,
    });
    
    // In a real application, this would make an API call to generate the export
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: `Report exported successfully in ${format.toUpperCase()} format.`,
      });
    }, 1500);
  };
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Budget Reports</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('excel')}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            disabled={selectedProjects.length === 0}
          >
            Export Report
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Project Selection Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Select Projects</h2>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {projectsLoading ? (
                <div className="text-center py-4">
                  <svg className="animate-spin h-6 w-6 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Loading projects...</p>
                </div>
              ) : projects && projects.length > 0 ? (
                <div className="space-y-2">
                  {projects.map((project: Project) => (
                    <div key={project.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`project-${project.id}`}
                        checked={selectedProjects.includes(project.id)}
                        onChange={() => toggleProjectSelection(project.id)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor={`project-${project.id}`} className="ml-2 block text-sm text-gray-900">
                        {project.name}
                        <span className="block text-xs text-gray-500">
                          {project.city}, {project.country}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No projects available for reporting.</p>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Report Type</h3>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="comparison-report"
                      name="report-type"
                      value="comparison"
                      checked={reportType === 'comparison'}
                      onChange={() => setReportType('comparison')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="comparison-report" className="ml-2 block text-sm text-gray-700">
                      Comparison
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="distribution-report"
                      name="report-type"
                      value="distribution"
                      checked={reportType === 'distribution'}
                      onChange={() => setReportType('distribution')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <label htmlFor="distribution-report" className="ml-2 block text-sm text-gray-700">
                      Distribution
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-x-2">
                <button
                  onClick={() => handleExport('excel')}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                  disabled={selectedProjects.length === 0}
                >
                  Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                  disabled={selectedProjects.length === 0}
                >
                  PDF
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                  disabled={selectedProjects.length === 0}
                >
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Report Visualization */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">
                {reportType === 'comparison' ? 'Budget Comparison' : 'Cost Distribution'}
              </h2>
            </div>
            <div className="p-6">
              {budgetsLoading || projectsLoading ? (
                <div className="text-center py-12">
                  <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-4 text-gray-600">Loading report data...</p>
                </div>
              ) : selectedProjects.length === 0 ? (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No Projects Selected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Please select at least one project from the list to generate a report.
                  </p>
                </div>
              ) : reportType === 'comparison' && chartData.length > 0 ? (
                <div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          label={{ value: 'Total Cost', angle: -90, position: 'insideLeft' }} 
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          label={{ value: 'Cost per Unit', angle: 90, position: 'insideRight' }} 
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            const item = chartData.find(d => d.totalCost === value || d.costPerUnit === value);
                            if (!item) return [value, name];
                            
                            return [
                              name === 'totalCost' 
                                ? formatCurrency(value as number, item.currency)
                                : formatCurrency(value as number, item.currency) + '/' + (projects.find((p: Project) => p.name === item.name)?.areaUnit || 'unit'),
                              name === 'totalCost' ? 'Total Cost' : 'Cost per Unit'
                            ];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="totalCost" name="Total Cost" fill="#0d47a1" yAxisId="left" />
                        <Bar dataKey="costPerUnit" name="Cost per Unit" fill="#00838f" yAxisId="right" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-8 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Project
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Specification
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Layout
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Cost
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cost per Unit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {chartData.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.specification}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.layout} Based
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                              {formatCurrency(item.totalCost, item.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                              {formatCurrency(item.costPerUnit, item.currency)}/
                              {projects.find((p: Project) => p.name === item.name)?.areaUnit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : reportType === 'distribution' && distributionData.length > 0 ? (
                <div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                        >
                          {distributionData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value, 'USD')} 
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-8 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cost Category
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {distributionData.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                              {formatCurrency(item.value, 'USD')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                              {item.percentage.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No report data available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    The selected projects don't have completed budgets with cost data.
                    Please select different projects or ensure budgets are completed.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
