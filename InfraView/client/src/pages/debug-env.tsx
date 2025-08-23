// Debug page to check environment variables
// Access at /debug-env

export default function DebugEnv() {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 
      import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NOT SET',
    VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    VITE_USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA,
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Environment Variables Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current Environment Variables:</h2>
          
          <div className="space-y-3">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                <span className="font-mono text-sm font-medium">{key}:</span>
                <span className={`font-mono text-sm ${value ? 'text-green-600' : 'text-red-600'}`}>
                  {value || 'NOT SET'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">Status:</h3>
            {envVars.VITE_SUPABASE_URL && envVars.VITE_SUPABASE_ANON_KEY ? (
              <p className="text-green-600">✅ Supabase configuration looks good!</p>
            ) : (
              <p className="text-red-600">❌ Supabase configuration missing. Please set environment variables in Vercel dashboard.</p>
            )}
          </div>

          <div className="mt-4 text-sm text-slate-600">
            <p><strong>Note:</strong> This page should only be used for debugging and should be removed in production.</p>
          </div>
        </div>
      </div>
    </div>
  );
}