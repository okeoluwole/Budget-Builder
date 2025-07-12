import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { 
  Calculator, 
  Globe, 
  Users, 
  TrendingUp, 
  FileText,
  Building2,
  DollarSign,
  BarChart3,
  CheckCircle
} from 'lucide-react';

export function LandingPage() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect authenticated users to dashboard
  if (user) {
    setLocation('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      setLocation('/'); // Redirect to dashboard after successful login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="relative bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <span className="text-2xl font-bold text-gray-900">Cost Estimator Pro</span>
            </div>
            <div className="text-sm text-gray-600">
              Enterprise Budget Planning Platform
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          
          {/* Left Side - Value Proposition */}
          <div className="mb-12 lg:mb-0">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl lg:text-6xl mb-3">
              <span className="text-blue-600">Cost Estimator Pro</span>
            </h1>
            <p className="text-2xl font-normal text-gray-600 mb-6">
              Professional Cost Estimation
            </p>
            
            <p className="mt-6 text-xl text-gray-600 leading-8">
              Streamline your capital expenditure planning with enterprise-grade cost analysis tools. 
              Access industry-leading cost databases and compare multiple data sources in real-time for accurate budget forecasting.
            </p>

            {/* Key Features */}
            <div className="mt-10 space-y-4">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                <span className="text-lg text-gray-700">Global cost database with 150+ markets</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                <span className="text-lg text-gray-700">Premium cost guide integration with live cross-dataset comparison</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                <span className="text-lg text-gray-700">Advanced project collaboration and sharing</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                <span className="text-lg text-gray-700">Professional reporting and export capabilities</span>
              </div>
            </div>

            {/* Statistics */}
            <div className="mt-12 grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">150+</div>
                <div className="text-sm text-gray-600">Global Markets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">1000+</div>
                <div className="text-sm text-gray-600">Data Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">24/7</div>
                <div className="text-sm text-gray-600">Live Updates</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="lg:ml-10">
            <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10">
              <div className="text-center mb-8">
                <Calculator className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                <p className="text-gray-600 mt-2">
                  Access your cost estimation workspace
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800 text-sm">{error}</div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In to Workspace'
                  )}
                </button>
              </form>

            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Comprehensive Cost Estimation Platform
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need for accurate budget planning and project cost management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Global Coverage</h3>
              <p className="text-gray-600">Access cost data from 150+ international markets with real-time updates</p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Data Sources</h3>
              <p className="text-gray-600">Industry-leading cost guides integrated for seamless comparison and comprehensive analysis</p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h3>
              <p className="text-gray-600">Multi-user workspace with project sharing and role-based permissions</p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Reports</h3>
              <p className="text-gray-600">Comprehensive reporting and export capabilities for stakeholder presentations</p>
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Trusted by Leading Organizations
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Supporting diverse cost estimation needs across industries
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl">
              <DollarSign className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Fortune 500 CapEx Teams</h3>
              <p className="text-gray-700">
                Strategic capital expenditure planning with accurate budget forecasting for global real estate portfolios.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl">
              <TrendingUp className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Professional Services</h3>
              <p className="text-gray-700">
                Consulting firms delivering data-driven cost analysis and recommendations to enterprise clients.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl">
              <FileText className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Project Management</h3>
              <p className="text-gray-700">
                Early-stage budget development with detailed cost breakdowns and scenario planning capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center mb-4">
                <Building2 className="h-8 w-8 text-blue-400 mr-3" />
                <span className="text-2xl font-bold">Cost Estimator Pro</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Professional cost estimation platform designed for accurate budget planning 
                and project management across global markets.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Cost Estimation</li>
                <li>Project Management</li>
                <li>Data Analytics</li>
                <li>Team Collaboration</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>Support Center</li>
                <li>Enterprise Sales</li>
                <li>System Status</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Cost Estimator Pro. Professional cost estimation platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}