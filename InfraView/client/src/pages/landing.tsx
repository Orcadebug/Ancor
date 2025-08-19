import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/stores/authStore';

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuthStore();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation('/');
    }
  }, [isAuthenticated, user, setLocation]);

  const handleGetStarted = () => {
    setLocation('/login');
  };

  return (
    <div className="text-gray-800">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <i className="fas fa-anchor text-blue-600 text-2xl mr-2"></i>
                <span className="text-xl font-bold text-blue-800">ancor</span>
              </div>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <a href="#features" className="nav-link px-3 py-2 rounded-md text-sm font-medium text-blue-800 hover:text-blue-600">Features</a>
              <a href="#how-it-works" className="nav-link px-3 py-2 rounded-md text-sm font-medium text-blue-800 hover:text-blue-600">How It Works</a>
              <a href="#contact" className="nav-link px-3 py-2 rounded-md text-sm font-medium text-blue-800 hover:text-blue-600">Contact</a>
              <button 
                onClick={handleGetStarted}
                className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition duration-150"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              One-Click Private GPT for Your Business
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-blue-100">
              Deploy your own fully private AI assistant in minutes, with no technical expertise required. 
              Securely process documents and get answers from your private data.
            </p>
            <div className="mt-10 flex justify-center">
              <button 
                onClick={handleGetStarted}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 transition duration-150"
              >
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Complete AI Infrastructure Solution
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Everything you need to deploy, manage, and scale private AI systems for document processing.
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {/* Feature 1 */}
              <div className="relative hover:transform hover:-translate-y-1 transition duration-300 ease-in-out">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
                  <i className="fas fa-rocket text-xl"></i>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">One-Click Deployment</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Deploy complete AI document processing systems with a single click, including GPU instances, 
                    vector databases, and chat interfaces.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="relative hover:transform hover:-translate-y-1 transition duration-300 ease-in-out">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
                  <i className="fas fa-file-alt text-xl"></i>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Document Processing</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Automated text extraction, summarization, and semantic search for PDFs, Word docs, 
                    and more with industry-specific templates.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="relative hover:transform hover:-translate-y-1 transition duration-300 ease-in-out">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
                  <i className="fas fa-robot text-xl"></i>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">AI Chat Interface</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Natural language querying of your documents with source citations, comparison analysis, 
                    and risk assessment features.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="relative hover:transform hover:-translate-y-1 transition duration-300 ease-in-out">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
                  <i className="fas fa-project-diagram text-xl"></i>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Workflow Automation</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Visual workflow builder with pre-built templates for document routing, compliance monitoring, 
                    and daily digest generation.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="relative hover:transform hover:-translate-y-1 transition duration-300 ease-in-out">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
                  <i className="fas fa-shield-alt text-xl"></i>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Enterprise Security</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Built-in compliance with SOC 2, HIPAA, and legal standards, plus VPC, firewall rules, 
                    and audit logging.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="relative hover:transform hover:-translate-y-1 transition duration-300 ease-in-out">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
                  <i className="fas fa-chart-line text-xl"></i>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Transparent Pricing</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Simple 7% markup on hosting costs with real-time usage tracking and optimization suggestions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Process</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Simple Deployment in 4 Steps
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Get your complete AI document processing system up and running in minutes.
            </p>
          </div>

          <div className="mt-10 space-y-10">
            {/* Steps would go here - keeping it concise for now */}
            <div className="text-center">
              <button 
                onClick={handleGetStarted}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition duration-150"
              >
                Start Your Deployment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to deploy your AI infrastructure?</span>
            <span className="block text-blue-200">Start your free 14-day trial today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <button 
                onClick={handleGetStarted}
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition duration-150"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <div className="flex items-center">
                <i className="fas fa-anchor text-blue-600 text-2xl mr-2"></i>
                <span className="text-xl font-bold text-blue-800">ancor</span>
              </div>
              <p className="text-gray-500 text-base">
                One-click deployment of complete private AI document processing systems.
              </p>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="text-base text-gray-400 text-center">
              &copy; 2024 ancor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}