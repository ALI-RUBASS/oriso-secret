export default function StatusBanner({ allOperational, loading, serviceCount }) {
  if (loading) {
    return (
      <div className="rounded-lg bg-gray-100 p-6 mb-8 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3"></div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg p-6 mb-8 transition-all duration-500 ${
      allOperational 
        ? 'bg-green-50 border-2 border-green-200' 
        : 'bg-red-50 border-2 border-red-200'
    }`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {allOperational ? (
            <svg 
              className="h-12 w-12 text-green-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          ) : (
            <svg 
              className="h-12 w-12 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          )}
        </div>
        <div className="ml-4">
          <h2 className={`text-2xl font-bold ${
            allOperational ? 'text-green-900' : 'text-red-900'
          }`}>
            {allOperational 
              ? 'All Systems Operational' 
              : 'Some Systems Experiencing Issues'}
          </h2>
          <p className={`mt-1 text-sm ${
            allOperational ? 'text-green-700' : 'text-red-700'
          }`}>
            {allOperational 
              ? `All ${serviceCount} services are running smoothly` 
              : 'Some services are currently down or degraded'}
          </p>
        </div>
      </div>
    </div>
  )
}

