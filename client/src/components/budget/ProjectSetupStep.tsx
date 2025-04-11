import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBudget } from '@/contexts/BudgetContext';
import { apiRequest } from '@/lib/queryClient';
import { COUNTRIES, CITIES, CURRENCIES } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

interface ProjectSetupStepProps {
  onNext: () => void;
  onSaveAsDraft: () => Promise<void>;
}

// Schema for project setup form
const projectFormSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  projectReference: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  totalArea: z.coerce.number().positive('Area must be positive'),
  areaUnit: z.enum(['sqm', 'sqft']),
  startDate: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  inflationRate: z.coerce.number().min(0).max(100).optional()
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const ProjectSetupStep: React.FC<ProjectSetupStepProps> = ({ onNext, onSaveAsDraft }) => {
  const { state, updateProject } = useBudget();
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const { toast } = useToast();
  const [locations, setLocations] = useState<{ [country: string]: string[] }>({});
  const [loading, setLoading] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectName: state.project?.name || '',
      projectReference: state.project?.reference || '',
      country: state.project?.country || '',
      city: state.project?.city || '',
      totalArea: state.project?.totalArea || undefined,
      areaUnit: (state.project?.areaUnit as 'sqm' | 'sqft') || 'sqm',
      startDate: state.project?.startDate || '',
      currency: state.project?.currency || 'USD',
      inflationRate: state.project?.inflationRate || 2.5
    }
  });

  // Fetch location data from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const res = await apiRequest('GET', '/api/locations', undefined);
        const data = await res.json();
        setLocations(data);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        toast({
          title: "Failed to load locations",
          description: "Using default locations instead. Some data may be missing.",
          variant: "destructive",
        });
        // Fallback to mock data
        setLocations(CITIES);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [toast]);

  // Update cities when country changes
  useEffect(() => {
    const country = form.watch('country');
    if (country && locations[country]) {
      setAvailableCities(locations[country]);
    } else {
      setAvailableCities([]);
    }
  }, [form.watch('country'), locations]);

  const onSubmit = (data: ProjectFormValues) => {
    updateProject({
      name: data.projectName,
      reference: data.projectReference,
      country: data.country,
      city: data.city,
      totalArea: data.totalArea,
      areaUnit: data.areaUnit,
      startDate: data.startDate,
      currency: data.currency,
      inflationRate: data.inflationRate
    });
    
    onNext();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Setup</h2>
      <p className="text-gray-600 mb-6">Enter the basic information about your project to start the budget estimation process.</p>
      
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project-name">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="project-name"
              {...form.register('projectName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="e.g. London Office Relocation"
            />
            {form.formState.errors.projectName && (
              <p className="mt-1 text-sm text-red-500">{form.formState.errors.projectName.message}</p>
            )}
          </div>
          
          {/* Project Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project-reference">
              Project Reference
            </label>
            <input
              type="text"
              id="project-reference"
              {...form.register('projectReference')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="e.g. LON-2023-001"
            />
          </div>
          
          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location-country">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              id="location-country"
              {...form.register('country')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={loading}
            >
              <option value="">Select a country</option>
              {Object.keys(locations).length > 0 ? (
                Object.keys(locations).map(country => (
                  <option key={country} value={country}>{country}</option>
                ))
              ) : (
                COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))
              )}
            </select>
            {form.formState.errors.country && (
              <p className="mt-1 text-sm text-red-500">{form.formState.errors.country.message}</p>
            )}
          </div>
          
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location-city">
              City <span className="text-red-500">*</span>
            </label>
            <select
              id="location-city"
              {...form.register('city')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={!form.watch('country') || loading}
            >
              <option value="">{form.watch('country') ? 'Select a city' : 'First select a country'}</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {form.formState.errors.city && (
              <p className="mt-1 text-sm text-red-500">{form.formState.errors.city.message}</p>
            )}
          </div>
          
          {/* Total Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="total-area">
              Total Area <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <input
                type="number"
                id="total-area"
                {...form.register('totalArea')}
                min="1"
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="e.g. 10000"
              />
              <select
                id="area-unit"
                {...form.register('areaUnit')}
                className="px-3 py-2 border border-gray-300 border-l-0 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-gray-50"
              >
                <option value="sqm">sq m</option>
                <option value="sqft">sq ft</option>
              </select>
            </div>
            {form.formState.errors.totalArea && (
              <p className="mt-1 text-sm text-red-500">{form.formState.errors.totalArea.message}</p>
            )}
          </div>
          
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="project-start-date">
              Estimated Start Date
            </label>
            <input
              type="date"
              id="project-start-date"
              {...form.register('startDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          
          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="currency">
              Currency <span className="text-red-500">*</span>
            </label>
            <select
              id="currency"
              {...form.register('currency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
            {form.formState.errors.currency && (
              <p className="mt-1 text-sm text-red-500">{form.formState.errors.currency.message}</p>
            )}
          </div>
          
          {/* Inflation Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="inflation-rate">
              Inflation Rate (%)
            </label>
            <input
              type="number"
              id="inflation-rate"
              {...form.register('inflationRate')}
              min="0"
              max="100"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="e.g. 2.5"
            />
            {form.formState.errors.inflationRate && (
              <p className="mt-1 text-sm text-red-500">{form.formState.errors.inflationRate.message}</p>
            )}
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={onSaveAsDraft}
          >
            Save as Draft
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Next: Specification Selection
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 w-4 h-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectSetupStep;
