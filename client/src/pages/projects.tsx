import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { Project, Budget } from '@shared/schema';

const Projects: React.FC = () => {
  const [projectBudgetCounts, setProjectBudgetCounts] = useState<Record<number, number>>({});
  const [latestBudgetTotals, setLatestBudgetTotals] = useState<Record<number, number>>({});
  
  // Fetch all projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({ 
    queryKey: ['/api/projects'],
    staleTime: 30000 // 30 seconds
  });
  
  // Fetch all budgets
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery<Budget[]>({ 
    queryKey: ['/api/budgets'],
    staleTime: 30000 // 30 seconds
  });

  // Process budget data when loaded
  useEffect(() => {
    if (budgets) {
      // Calculate budget counts per project
      const counts: Record<number, number> = {};
      const latestTotals: Record<number, number> = {};
      
      budgets.forEach((budget: Budget) => {
        counts[budget.projectId] = (counts[budget.projectId] || 0) + 1;
        
        // Track latest budget total for each project
        if (budget.totalCost && 
            (!latestTotals[budget.projectId] || 
             new Date(budget.updatedAt).getTime() > new Date(
               budgets.find((b: Budget) => 
                 b.projectId === budget.projectId && 
                 latestTotals[budget.projectId] === b.totalCost
               )?.updatedAt || 0
             ).getTime())
           ) {
          latestTotals[budget.projectId] = budget.totalCost;
        }
      });
      
      setProjectBudgetCounts(counts);
      setLatestBudgetTotals(latestTotals);
    }
  }, [budgets]);
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Projects</h1>
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
      
      {projectsLoading || budgetsLoading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <svg className="animate-spin h-10 w-10 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg text-gray-700">Loading projects...</p>
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
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
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No projects found</h3>
          <p className="mt-2 text-gray-600">Get started by creating a new project with a budget.</p>
          <div className="mt-6">
            <Link href="/new-budget">
              <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer">
                Create New Budget
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
