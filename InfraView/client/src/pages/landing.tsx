import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/stores/authStore';

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, user, setLocation]);

  const handleGetStarted = () => {
    setLocation('/login');
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <style>{`
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f8fafc;
        }
        .gradient-bg {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        }
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .feature-icon {
          background-color: #eff6ff;
        }
        .pricing-card:hover {
          transform: scale(1.03);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .deployment-step {
          position: relative;
        }
        .deployment-step:not(:last-child):after {
          content: '';
          position: absolute;
          left: 24px;
          top: 40px;
          height: calc(100% - 40px);
          width: 2px;
          background-color: #3b82f6;
        }
        @media (max-width: 768px) {
          .deployment-step:not(:last-child):after {
            display: none;
          }
        }
      `}</style>

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
                <button 
                  onClick={() => scrollToSection('features')}
                  className="nav-link px-3 py-2 rounded-md text-sm font-medium text-blue-800 hover:text-blue-600"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="nav-link px-3 py-2 rounded-md text-sm font-medium text-blue-800 hover:text-blue-600"
                >
                  How It Works
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="nav-link px-3 py-2 rounded-md text-sm font-medium text-blue-800 hover:text-blue-600"
                >
                  Contact
                </button>
                <button 
                  onClick={handleGetStarted}
                  className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition duration-150"
                >
                  Get Started
                </button>
              </div>
              <div className="-mr-2 flex items-center md:hidden">
                <button 
                  type="button" 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-blue-800 hover:text-blue-600 focus:outline-none"
                >
                  <span className="sr-only">Open main menu</span>
                  <i className="fas fa-bars text-xl"></i>
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white shadow-lg rounded-lg mt-2 py-2 absolute right-4 w-48 z-50">
              <button 
                onClick={() => scrollToSection('features')}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Contact
              </button>
              <button 
                onClick={handleGetStarted}
                className="block px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 w-full text-left"
              >
                Get Started
              </button>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <div className="gradient-bg text-white">
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
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50"
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
                <div className="relative card-hover transition duration-300 ease-in-out">
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
                <div className="relative card-hover transition duration-300 ease-in-out">
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
                <div className="relative card-hover transition duration-300 ease-in-out">
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
                <div className="relative card-hover transition duration-300 ease-in-out">
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
                <div className="relative card-hover transition duration-300 ease-in-out">
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
                <div className="relative card-hover transition duration-300 ease-in-out">
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
              {/* Step 1 */}
              <div className="relative deployment-step pl-16">
                <div className="absolute left-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600">
                  <span className="text-xl font-bold">1</span>
                </div>
                <div className="min-h-48 bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900">Industry & Use Case Selection</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Choose from our pre-configured templates for legal, healthcare, finance, or professional services.
                  </p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-md">
                      <i className="fas fa-balance-scale text-blue-600"></i>
                      <span className="ml-2 font-medium">Legal</span>
                      <p className="mt-1 text-sm text-gray-600">Contracts, case files, briefs</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <i className="fas fa-heartbeat text-blue-600"></i>
                      <span className="ml-2 font-medium">Healthcare</span>
                      <p className="mt-1 text-sm text-gray-600">Patient records, research docs</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <i className="fas fa-chart-pie text-blue-600"></i>
                      <span className="ml-2 font-medium">Finance</span>
                      <p className="mt-1 text-sm text-gray-600">Reports, compliance docs</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <i className="fas fa-briefcase text-blue-600"></i>
                      <span className="ml-2 font-medium">Services</span>
                      <p className="mt-1 text-sm text-gray-600">Proposals, client docs</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative deployment-step pl-16">
                <div className="absolute left-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600">
                  <span className="text-xl font-bold">2</span>
                </div>
                <div className="min-h-48 bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900">Model & Performance Selection</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Select the AI model that fits your needs and budget.
                  </p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-gray-200 p-4 rounded-md">
                      <h4 className="font-medium text-gray-900">LLaMA 3 8B</h4>
                      <p className="text-sm text-gray-600">Lightweight</p>
                    </div>
                    <div className="border-2 border-blue-500 bg-blue-50 p-4 rounded-md">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-900">LLaMA 3 70B</h4>
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Recommended</span>
                      </div>
                      <p className="text-sm text-gray-600">Balanced performance</p>
                    </div>
                    <div className="border border-gray-200 p-4 rounded-md">
                      <h4 className="font-medium text-gray-900">LLaMA 3 405B</h4>
                      <p className="text-sm text-gray-600">Enterprise-grade</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative deployment-step pl-16">
                <div className="absolute left-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600">
                  <span className="text-xl font-bold">3</span>
                </div>
                <div className="min-h-48 bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900">Infrastructure Provisioning</h3>
                  <p className="mt-2 text-base text-gray-500">
                    We automatically provision all the infrastructure you need.
                  </p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-start">
                      <i className="fas fa-server text-blue-500 mt-1 mr-2"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">GPU Instances</h4>
                        <p className="text-sm text-gray-600">Dual A100 GPUs for 70B model</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <i className="fas fa-globe-americas text-blue-500 mt-1 mr-2"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">Region Selection</h4>
                        <p className="text-sm text-gray-600">US-East, US-West, EU</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <i className="fas fa-lock text-blue-500 mt-1 mr-2"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">Security Setup</h4>
                        <p className="text-sm text-gray-600">VPC, firewall rules, SSL</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <i className="fas fa-shield-alt text-blue-500 mt-1 mr-2"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">Compliance</h4>
                        <p className="text-sm text-gray-600">SOC 2, HIPAA standards</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative pl-16">
                <div className="absolute left-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600">
                  <span className="text-xl font-bold">4</span>
                </div>
                <div className="min-h-48 bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900">Complete System Deployment</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Your entire AI document processing system is ready to use.
                  </p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-start">
                      <i className="fas fa-brain text-blue-500 mt-1 mr-2"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">vLLM + LLaMA 3</h4>
                        <p className="text-sm text-gray-600">Quantized model API</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <i className="fas fa-database text-blue-500 mt-1 mr-2"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">ChromaDB Cluster</h4>
                        <p className="text-sm text-gray-600">Vector storage</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <i className="fas fa-project-diagram text-blue-500 mt-1 mr-2"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">LlamaIndex RAG</h4>
                        <p className="text-sm text-gray-600">Industry-configured</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <i className="fas fa-comments text-blue-500 mt-1 mr-2"></i>
                      <div>
                        <h4 className="font-medium text-gray-900">Streamlit UI</h4>
                        <p className="text-sm text-gray-600">Branded chat interface</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="gradient-bg">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to deploy your AI infrastructure?</span>
              <span className="block text-blue-200">Start your free 14-day trial today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <button 
                  onClick={handleGetStarted}
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                >
                  Get Started
                </button>
              </div>
              <div className="ml-3 inline-flex rounded-md shadow">
                <button 
                  onClick={handleGetStarted}
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 bg-opacity-60 hover:bg-opacity-70"
                >
                  Contact Sales
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
                <div className="flex space-x-6">
                  <a href="#" className="text-gray-400 hover:text-gray-500">
                    <i className="fab fa-twitter text-xl"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-gray-500">
                    <i className="fab fa-linkedin text-xl"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-gray-500">
                    <i className="fab fa-github text-xl"></i>
                  </a>
                </div>
              </div>
              <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
                <div className="md:grid md:grid-cols-2 md:gap-8">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Product</h3>
                    <ul className="mt-4 space-y-4">
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Features</a></li>
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Pricing</a></li>
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Demo</a></li>
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Integrations</a></li>
                    </ul>
                  </div>
                  <div className="mt-12 md:mt-0">
                    <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Resources</h3>
                    <ul className="mt-4 space-y-4">
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Documentation</a></li>
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">API Reference</a></li>
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Community</a></li>
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Status</a></li>
                    </ul>
                  </div>
                </div>
                <div className="md:grid md:grid-cols-2 md:gap-8">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Company</h3>
                    <ul className="mt-4 space-y-4">
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">About</a></li>
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Blog</a></li>
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Careers</a></li>
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Press</a></li>
                    </ul>
                  </div>
                  <div className="mt-12 md:mt-0">
                    <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Legal</h3>
                    <ul className="mt-4 space-y-4">
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Privacy</a></li>
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Terms</a></li>
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Security</a></li>
                      <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Compliance</a></li>
                    </ul>
                  </div>
                </div>
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
    </>
  );
}