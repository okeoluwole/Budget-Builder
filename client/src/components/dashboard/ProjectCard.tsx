import React from 'react';
import { Link } from 'wouter';
import { Project } from '@shared/schema';
import { formatCurrency } from '@/utils/formatters';

interface ProjectCardProps {
  project: Project;
  budgetCount: number;
  latestBudgetTotal?: number;
  currency?: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  budgetCount, 
  latestBudgetTotal,
  currency 
}) => {
  const colorClasses = [
    'border-blue-200 bg-blue-50',
    'border-green-200 bg-green-50',
    'border-yellow-200 bg-yellow-50',
    'border-purple-200 bg-purple-50',
    'border-pink-200 bg-pink-50'
  ];
  
  // Use project ID to deterministically select a color
  const colorIndex = project.id % colorClasses.length;
  const cardColorClass = colorClasses[colorIndex];

  return (
    <div className={`border rounded-lg overflow-hidden shadow-sm ${cardColorClass}`}>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900 mb-1">{project.name}</h3>
          <span className="text-xs bg-white px-2 py-1 rounded-full border border-gray-200">
            {project.reference || `Ref-${project.id}`}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          {project.city}, {project.country}
        </p>
        
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500">Area</p>
            <p className="text-sm font-medium">
              {project.totalArea?.toLocaleString()} {project.areaUnit}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500">Budgets</p>
            <p className="text-sm font-medium">{budgetCount}</p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500">Latest Budget</p>
            <p className="text-sm font-medium font-mono">
              {latestBudgetTotal 
                ? formatCurrency(latestBudgetTotal, currency || project.currency) 
                : 'N/A'}
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <Link href={`/projects/${project.id}`}>
            <div className="text-sm text-primary hover:text-primary-dark font-medium cursor-pointer">
              View Details
            </div>
          </Link>
          
          <Link href={`/new-budget?projectId=${project.id}`}>
            <div className="text-sm bg-white text-primary hover:bg-gray-50 font-medium px-3 py-1 rounded border border-primary cursor-pointer">
              New Budget
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
