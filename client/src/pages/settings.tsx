import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const { toast } = useToast();
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [defaultAreaUnit, setDefaultAreaUnit] = useState('sqm');
  const [defaultInflationRate, setDefaultInflationRate] = useState(2.5);
  const [dataUpdateFrequency, setDataUpdateFrequency] = useState('quarterly');
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings saved",
        description: "Your settings have been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Application Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="default-currency">
                Default Currency
              </label>
              <select
                id="default-currency"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">The default currency for new projects.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="default-area-unit">
                Default Area Unit
              </label>
              <select
                id="default-area-unit"
                value={defaultAreaUnit}
                onChange={(e) => setDefaultAreaUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="sqm">Square Meters (m²)</option>
                <option value="sqft">Square Feet (ft²)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">The default unit of measurement for area calculations.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="default-inflation-rate">
                Default Inflation Rate (%)
              </label>
              <input
                type="number"
                id="default-inflation-rate"
                value={defaultInflationRate}
                onChange={(e) => setDefaultInflationRate(parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p className="mt-1 text-sm text-gray-500">The default inflation rate applied to new budget calculations.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="data-update-frequency">
                Cost Data Update Frequency
              </label>
              <select
                id="data-update-frequency"
                value={dataUpdateFrequency}
                onChange={(e) => setDataUpdateFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="biannually">Bi-annually</option>
                <option value="annually">Annually</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">How often the application should check for updated cost data.</p>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Management</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-md">
              <div>
                <h3 className="font-medium text-gray-800">Fit-out Cost Data</h3>
                <p className="text-sm text-gray-500">Last updated: 29.01.2024</p>
              </div>
              <button
                type="button"
                className="px-3 py-1 text-sm font-medium text-primary bg-white border border-primary rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Update Now
              </button>
            </div>
            
            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-md">
              <div>
                <h3 className="font-medium text-gray-800">MMC Design Standards</h3>
                <p className="text-sm text-gray-500">Last updated: 15.12.2023</p>
              </div>
              <button
                type="button"
                className="px-3 py-1 text-sm font-medium text-primary bg-white border border-primary rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Update Now
              </button>
            </div>
            
            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-md">
              <div>
                <h3 className="font-medium text-gray-800">Budget Templates</h3>
                <p className="text-sm text-gray-500">Last updated: 05.01.2024</p>
              </div>
              <button
                type="button"
                className="px-3 py-1 text-sm font-medium text-primary bg-white border border-primary rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Update Now
              </button>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Automatic Updates</h3>
                <p className="text-xs text-yellow-700 mt-1">
                  The system will automatically check for updates based on your selected frequency. 
                  Manual updates can be performed at any time by clicking "Update Now".
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">User Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive emails about budget updates and reports</p>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                <input
                  type="checkbox"
                  id="email-notifications"
                  className="absolute w-6 h-6 transition duration-200 ease-in-out transform bg-white border rounded-full cursor-pointer peer border-gray-300 left-0 top-0 appearance-none checked:left-6 checked:bg-primary checked:border-primary"
                />
                <label
                  htmlFor="email-notifications"
                  className="block h-full overflow-hidden rounded-full cursor-pointer bg-gray-200 peer-checked:bg-blue-100"
                ></label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">Dark Mode</h3>
                <p className="text-sm text-gray-500">Use dark color theme for the application</p>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                <input
                  type="checkbox"
                  id="dark-mode"
                  className="absolute w-6 h-6 transition duration-200 ease-in-out transform bg-white border rounded-full cursor-pointer peer border-gray-300 left-0 top-0 appearance-none checked:left-6 checked:bg-primary checked:border-primary"
                />
                <label
                  htmlFor="dark-mode"
                  className="block h-full overflow-hidden rounded-full cursor-pointer bg-gray-200 peer-checked:bg-blue-100"
                ></label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">Auto-save</h3>
                <p className="text-sm text-gray-500">Automatically save budget drafts while editing</p>
              </div>
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                <input
                  type="checkbox"
                  id="auto-save"
                  className="absolute w-6 h-6 transition duration-200 ease-in-out transform bg-white border rounded-full cursor-pointer peer border-gray-300 left-0 top-0 appearance-none checked:left-6 checked:bg-primary checked:border-primary"
                  defaultChecked
                />
                <label
                  htmlFor="auto-save"
                  className="block h-full overflow-hidden rounded-full cursor-pointer bg-gray-200 peer-checked:bg-blue-100"
                ></label>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
