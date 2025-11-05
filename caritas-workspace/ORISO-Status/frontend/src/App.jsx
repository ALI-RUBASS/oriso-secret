import { useState, useEffect } from 'react'
import StatusBanner from './components/StatusBanner'
import ServiceGrid from './components/ServiceGrid'
import Header from './components/Header'

function App() {
  const [services, setServices] = useState({})
  const [serviceStatuses, setServiceStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      const data = await response.json()
      setServices(data)
      setLastUpdate(new Date())
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch services:', error)
      setLoading(false)
    }
  }

  const fetchAllHealthStatuses = async () => {
    if (Object.keys(services).length === 0) return
    
    const statuses = {}
    await Promise.all(
      Object.keys(services).map(async (key) => {
        try {
          const response = await fetch(`/api/health/${key}`)
          if (response.ok) {
            const data = await response.json()
            statuses[key] = data.status
          } else {
            statuses[key] = 'DOWN'
          }
        } catch {
          statuses[key] = 'DOWN'
        }
      })
    )
    setServiceStatuses(statuses)
  }

  useEffect(() => {
    fetchServices()
    const interval = setInterval(fetchServices, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (Object.keys(services).length > 0) {
      fetchAllHealthStatuses()
      const interval = setInterval(fetchAllHealthStatuses, 30000) // Refresh every 30s
      return () => clearInterval(interval)
    }
  }, [services])

  const allOperational = Object.values(serviceStatuses).every(
    (status) => status === 'UP'
  ) && Object.keys(serviceStatuses).length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <StatusBanner 
          allOperational={allOperational} 
          loading={loading}
          serviceCount={Object.keys(services).length}
        />
        
        <ServiceGrid 
          services={services} 
          loading={loading}
        />
        
        {/* Past Incidents Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Past Incidents
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="flex items-center justify-center space-x-2">
              <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">No incidents in the last 90 days</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Monitoring {Object.keys(services).length} services • 
            Updates every 30 seconds
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
