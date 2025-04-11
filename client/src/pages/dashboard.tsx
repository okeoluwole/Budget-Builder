import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import BudgetsList from '@/components/dashboard/BudgetsList';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { Project, Budget } from '@shared/schema';

const Dashboard: React.FC = () => {
  const [recentBudgets, setRecentBudgets] = useState<(Budget & { project?: Project })[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [projectBudgetCounts, setProjectBudgetCounts] = useState<Record<number, number>>({});
  const [latestBudgetTotals, setLatestBudgetTotals] = useState<Record<number, number>>({});
  
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({ 
    queryKey: ['/api/projects'],
    staleTime: 30000 // 30 seconds
  });
  
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery<Budget[]>({ 
    queryKey: ['/api/budgets'],
    staleTime: 30000 // 30 seconds
  });

  // Process data when it's loaded
  useEffect(() => {
    if (!projectsLoading && !budgetsLoading && projects.length >= 0 && budgets.length >= 0) {
      // Skip processing if both arrays are empty
      if (projects.length === 0 && budgets.length === 0) {
        return;
      }
      
      // Get recent budgets with their project data
      const budgetsWithProjects = budgets.map((budget: Budget) => ({
        ...budget,
        project: projects.find((p: Project) => p.id === budget.projectId)
      }));
      
      // Sort by updated date descending
      const sortedBudgets = [...budgetsWithProjects].sort((a, b) => 
        new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      );
      
      // Get recent projects
      const sortedProjects = [...projects].sort((a: Project, b: Project) => 
        new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      );
      
      // Calculate budget counts per project
      const counts: Record<number, number> = {};
      const latestTotals: Record<number, number> = {};
      
      budgets.forEach((budget: Budget) => {
        if (budget && budget.projectId) {
          counts[budget.projectId] = (counts[budget.projectId] || 0) + 1;
          
          // Track latest budget total for each project
          if (budget.totalCost && 
              (!latestTotals[budget.projectId] || 
               new Date(budget.updatedAt || 0).getTime() > new Date(
                 budgets.find((b: Budget) => 
                   b && b.projectId === budget.projectId && 
                   latestTotals[budget.projectId] === b.totalCost
                 )?.updatedAt || 0
               ).getTime())
             ) {
            latestTotals[budget.projectId] = budget.totalCost;
          }
        }
      });
      
      setRecentBudgets(sortedBudgets.slice(0, 5));
      setRecentProjects(sortedProjects.slice(0, 3));
      setProjectBudgetCounts(counts);
      setLatestBudgetTotals(latestTotals);
    }
  }, [projects, budgets, projectsLoading, budgetsLoading]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Link href="/new-budget">
          <div className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Budget
            </span>
          </div>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Total Projects</h2>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {projectsLoading ? (
                  <span className="text-gray-400">...</span>
                ) : (
                  projects?.length || 0
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Completed Budgets</h2>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {budgetsLoading ? (
                  <span className="text-gray-400">...</span>
                ) : (
                  budgets?.filter((b: Budget) => b.status === 'completed').length || 0
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-700">Draft Budgets</h2>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {budgetsLoading ? (
                  <span className="text-gray-400">...</span>
                ) : (
                  budgets?.filter((b: Budget) => b.status === 'draft').length || 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Projects</h2>
      {projectsLoading ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm">
          <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Loading projects...</p>
        </div>
      ) : recentProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {recentProjects.map(project => (
            <ProjectCard 
              key={project.id}
              project={project}
              budgetCount={projectBudgetCounts[project.id] || 0}
              latestBudgetTotal={latestBudgetTotals[project.id]}
              currency={project.currency}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new project with a budget.</p>
        </div>
      )}

      {/* Recent Budgets */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Budget Estimates</h2>
      <BudgetsList budgets={recentBudgets} loading={budgetsLoading} />
      
      {!budgetsLoading && recentBudgets.length > 0 && (
        <div className="mt-4 text-right">
          <Link href="/projects">
            <div className="text-primary hover:text-primary-dark font-medium text-sm cursor-pointer inline-block">
              View All Projects →
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
