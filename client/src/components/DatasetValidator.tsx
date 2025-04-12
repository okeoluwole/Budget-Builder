import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface DatasetValidationResult {
  isValid: boolean;
  datasetName: string;
  timestamp: string;
  issues: string[];
  message: string;
}

interface DatasetWarnings {
  hasWarnings: boolean;
  warnings: string[];
}

export const DatasetValidator = () => {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);
  
  // Query warnings first (lighter response)
  const warningsQuery = useQuery({
    queryKey: ['/api/dataset-warnings'],
    queryFn: async () => {
      const res = await fetch('/api/dataset-warnings');
      if (!res.ok) throw new Error('Failed to fetch dataset warnings');
      return res.json() as Promise<DatasetWarnings>;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  // Only query full validation if warnings exist or user requests details
  const validationQuery = useQuery({
    queryKey: ['/api/validate-dataset'],
    queryFn: async () => {
      const res = await fetch('/api/validate-dataset');
      if (!res.ok) throw new Error('Failed to validate dataset');
      return res.json() as Promise<DatasetValidationResult>;
    },
    enabled: showDetails || (warningsQuery.isSuccess && warningsQuery.data.hasWarnings),
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  // Show toast notification if there are warnings
  useEffect(() => {
    if (warningsQuery.isSuccess && warningsQuery.data.hasWarnings) {
      toast({
        title: 'Dataset Validation Warning',
        description: 'The system detected potential issues with the dataset being used.',
        variant: 'destructive',
        duration: 8000
      });
    }
  }, [warningsQuery.isSuccess, warningsQuery.data, toast]);
  
  // If no warnings and not showing details, don't render anything
  if (
    (warningsQuery.isSuccess && !warningsQuery.data.hasWarnings && !showDetails) ||
    (!warningsQuery.isSuccess && !showDetails)
  ) {
    return null;
  }
  
  // Show loading state
  if (
    warningsQuery.isLoading || 
    (validationQuery.isLoading && (showDetails || (warningsQuery.isSuccess && warningsQuery.data.hasWarnings)))
  ) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md mb-4 animate-pulse">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Checking dataset validation...</h3>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (
    warningsQuery.isError || 
    (validationQuery.isError && (showDetails || (warningsQuery.isSuccess && warningsQuery.data.hasWarnings)))
  ) {
    return (
      <div className="bg-red-50 p-4 rounded-md mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error checking dataset validation</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>There was an error validating the dataset. Please try again later.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                onClick={() => {
                  warningsQuery.refetch();
                  if (showDetails) validationQuery.refetch();
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show validation results
  if (showDetails && validationQuery.isSuccess) {
    const { isValid, datasetName, timestamp, issues, message } = validationQuery.data;
    
    return (
      <div className={`${isValid ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-md mb-4`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {isValid ? (
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${isValid ? 'text-green-800' : 'text-red-800'}`}>
              {message}
            </h3>
            <div className={`mt-2 text-sm ${isValid ? 'text-green-700' : 'text-red-700'}`}>
              <p><strong>Dataset:</strong> {datasetName}</p>
              <p><strong>Validated at:</strong> {new Date(timestamp).toLocaleString()}</p>
              
              {!isValid && issues.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Issues found:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    {issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-4">
              <button
                type="button"
                className={`rounded-md ${isValid ? 'bg-green-50 text-green-800 hover:bg-green-100 focus:ring-green-600' : 'bg-red-50 text-red-800 hover:bg-red-100 focus:ring-red-600'} px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2`}
                onClick={() => setShowDetails(false)}
              >
                Hide Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show warning notification
  if (warningsQuery.isSuccess && warningsQuery.data.hasWarnings) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Dataset Validation Warning</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>The system may not be using the correct dataset for calculations.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
                onClick={() => setShowDetails(true)}
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default DatasetValidator;