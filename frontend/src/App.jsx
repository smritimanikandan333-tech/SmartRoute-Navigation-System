
import { useEffect, useState } from 'react'
import './App.css'
import RoadGraph from './RoadGraph'
import TrafficMap from './TrafficMap'

const API = 'http://127.0.0.1:8000'

export default function App() {
  const [locations, setLocations] = useState([])
  const [roads, setRoads] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [source, setSource] = useState('')
  const [destination, setDestination] = useState('')
  const [route, setRoute] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [message, setMessage] = useState('Connecting to SmartRoute API...')
  const [loading, setLoading] = useState(false)

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Request failed: ${response.status}`)
    }

    return response.json()
  }

  async function loadLocations() {
    const data = await request('/locations')
    const list = Array.isArray(data) ? data : data.locations || []

    setLocations(list)

    if (list.length > 0) {
      setSource((old) => old || list[0].id)
      setDestination((old) => old || list[1]?.id || list[0].id)
    }
  }

  async function loadRoadsAndAnalytics() {
    const [roadData, analyticsData] = await Promise.all([
      request('/roads'),
      request('/analytics'),
    ])

    setRoads(Array.isArray(roadData) ? roadData : roadData.roads || [])
    setAnalytics(analyticsData || {})
  }

  async function refreshDashboard() {
    await Promise.all([loadLocations(), loadRoadsAndAnalytics()])
  }

  useEffect(() => {
    refreshDashboard()
      .then(() => setMessage('Connected successfully'))
      .catch((error) => setMessage(`API connection failed: ${error.message}`))
  }, [])

  function displayName(id) {
    const location = locations.find((item) => item.id === id)
    return location?.name || id || 'Unknown'
  }

  function validateRoute() {
    if (!source || !destination) {
      setMessage('Please select a starting point and destination.')
      return false
    }

    if (source === destination) {
      setMessage('Please select two different locations.')
      return false
    }

    return true
  }

  async function findRoute(type = 'shortest') {
    if (!validateRoute()) return

    setLoading(true)
    setMessage('Calculating route...')

    try {
      const path = type === 'fastest' ? '/fastest-route' : '/routes'
      const result = await request(path, {
        method: 'POST',
        body: JSON.stringify({ source, destination }),
      })

      setRoute(result)
      setComparison(null)
      setMessage(
        `${type === 'fastest' ? 'Fastest' : 'Shortest'} route calculated successfully.`,
      )
    } catch (error) {
      setRoute(null)
      setMessage(`Route error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function compareRoutes() {
    if (!validateRoute()) return

    setLoading(true)
    setMessage('Comparing available routes...')

    try {
      const result = await request('/compare-routes', {
        method: 'POST',
        body: JSON.stringify({ source, destination }),
      })

      setComparison(result)
      setMessage('Route comparison completed.')
    } catch (error) {
      setComparison(null)
      setMessage(`Comparison error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function simulateTraffic() {
    setLoading(true)

    try {
      await request('/simulate-live-traffic', { method: 'POST' })
      await loadRoadsAndAnalytics()

      if (source && destination && source !== destination) {
        const result = await request('/fastest-route', {
          method: 'POST',
          body: JSON.stringify({ source, destination }),
        })
        setRoute(result)
      }

      setComparison(null)
      setMessage('Simulated traffic updated and dashboard refreshed.')
    } catch (error) {
      setMessage(`Traffic simulation error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function blockSelectedRoad() {
    if (!route?.route || route.route.length < 2) {
      setMessage('Find a route first before blocking a road.')
      return
    }

    setLoading(true)

    try {
      await request('/simulate', {
        method: 'POST',
        body: JSON.stringify({
          source: route.route[0],
          destination: route.route[1],
        }),
      })

      await loadRoadsAndAnalytics()

      const alternative = await request('/fastest-route', {
        method: 'POST',
        body: JSON.stringify({ source, destination }),
      })

      setRoute(alternative)
      setComparison(null)
      setMessage('Road blockage simulated. Alternative route calculated.')
    } catch (error) {
      setMessage(`Road blockage/rerouting error: ${error.message}`)
      await loadRoadsAndAnalytics().catch(() => {})
    } finally {
      setLoading(false)
    }
  }

  async function resetRoads() {
    setLoading(true)

    try {
      await request('/reset', { method: 'POST' })
      await loadRoadsAndAnalytics()
      setRoute(null)
      setComparison(null)
      setMessage('Road network reset successfully.')
    } catch (error) {
      setMessage(`Reset error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  function getRouteData(result, kind) {
    if (!result) return null

    const candidates =
      kind === 'shortest'
        ? [
            result.shortest_route,
            result.shortest,
            result.shortest_path,
            result.routes?.shortest,
          ]
        : [
            result.fastest_route,
            result.fastest,
            result.fastest_path,
            result.routes?.fastest,
          ]

    const found = candidates.find(
      (item) => item && typeof item === 'object',
    )

    if (found) return found

    if (kind === 'shortest' && result.shortest_distance_km !== undefined) {
      return {
        distance_km: result.shortest_distance_km,
        estimated_time_min: result.shortest_time_min,
        route: result.shortest_path,
      }
    }

    if (kind === 'fastest' && result.fastest_distance_km !== undefined) {
      return {
        distance_km: result.fastest_distance_km,
        estimated_time_min: result.fastest_time_min,
        route: result.fastest_path,
      }
    }

    return null
  }

  function getDistance(item) {
    const value =
      item?.distance_km ??
      item?.total_distance_km ??
      item?.distance

    return Number.isFinite(Number(value)) ? Number(value).toFixed(2) : 'N/A'
  }

  function getTime(item) {
    const value =
      item?.estimated_time_min ??
      item?.travel_time_min ??
      item?.time_min ??
      item?.estimated_time

    return Number.isFinite(Number(value)) ? Number(value).toFixed(1) : 'N/A'
  }

  function getRouteNames(item) {
    if (Array.isArray(item?.route_names)) return item.route_names

    if (Array.isArray(item?.route)) {
      return item.route.map((id) => displayName(id))
    }

    if (Array.isArray(item?.path)) {
      return item.path.map((id) =>
        typeof id === 'string' ? displayName(id) : String(id),
      )
    }

    return []
  }

  const shortestComparison = getRouteData(comparison, 'shortest')
  const fastestComparison = getRouteData(comparison, 'fastest')

  const totalConnections =
    analytics.total_connections ?? analytics.total_roads ?? roads.length

  const blockedRoads =
    analytics.blocked_roads ??
    analytics.blocked_connections ??
    roads.filter((road) => road.blocked || road.status === 'blocked').length

  const openRoads =
    analytics.open_roads ??
    analytics.open_connections ??
    Math.max(0, Number(totalConnections) - Number(blockedRoads))

  const averageTraffic =
    analytics.average_traffic ??
    analytics.average_traffic_percent ??
    0

  const networkHealth =
    analytics.network_health ??
    analytics.network_health_percent ??
    (totalConnections
      ? (Number(openRoads) / Number(totalConnections)) * 100
      : 0)

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p>SMART MOBILITY • GRAPH-BASED NAVIGATION</p>
          <h1>SmartRoute</h1>
          <h2>Intelligent Traffic Navigation System</h2>
        </div>

        <div className="status-pill">
          <span>●</span> API Connected
        </div>
      </header>

      <p className="status-message">{message}</p>

      <section className="stats-grid">
        <div className="stat-card">
          <p>Total Connections</p>
          <h2>{totalConnections}</h2>
        </div>

        <div className="stat-card">
          <p>Open Roads</p>
          <h2>{openRoads}</h2>
        </div>

        <div className="stat-card">
          <p>Blocked Roads</p>
          <h2>{blockedRoads}</h2>
        </div>

        <div className="stat-card">
          <p>Average Traffic</p>
          <h2>{Number(averageTraffic).toFixed(1)}%</h2>
        </div>

        <div className="stat-card">
          <p>Network Health</p>
          <h2>{Number(networkHealth).toFixed(1)}%</h2>
        </div>
      </section>

      <section className="panel">
        <h2>Plan Your Journey</h2>

        <div className="route-controls">
          <label>
            Starting Point
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
            >
              <option value="">Select starting point</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Destination
            <select
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
            >
              <option value="">Select destination</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="button-row">
          <button disabled={loading} onClick={() => findRoute('shortest')}>
            Find Shortest Route
          </button>

          <button disabled={loading} onClick={() => findRoute('fastest')}>
            Find Fastest Route
          </button>

          <button disabled={loading} onClick={compareRoutes}>
            Compare Routes
          </button>
        </div>

        <div className="button-row">
          <button disabled={loading} onClick={simulateTraffic}>
            Simulate Traffic
          </button>

          <button disabled={loading} onClick={blockSelectedRoad}>
            Simulate Road Blockage &amp; Reroute
          </button>

          <button disabled={loading} onClick={resetRoads}>
            Reset Network
          </button>
        </div>
      </section>

      {route && (
        <section className="panel">
          <h2>Recommended Route</h2>

          <p>
            {getRouteNames(route).join(' → ') ||
              'Route calculated; path details unavailable.'}
          </p>

          <div className="stats-grid">
            <div className="stat-card">
              <p>Distance</p>
              <h2>{getDistance(route)} km</h2>
            </div>

            <div className="stat-card">
              <p>Estimated Time</p>
              <h2>{getTime(route)} min</h2>
            </div>

            <div className="stat-card">
              <p>Algorithm</p>
              <h2>{route.algorithm || 'Dijkstra'}</h2>
            </div>
          </div>
        </section>
      )}

      {comparison && (
        <section className="panel">
          <h2>Route Comparison</h2>
          <p>Compare distance and estimated travel time for both routes.</p>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Shortest Route</h3>
              <p>
                <strong>Distance:</strong>{' '}
                {shortestComparison
                  ? `${getDistance(shortestComparison)} km`
                  : 'Not provided by API'}
              </p>
              <p>
                <strong>Estimated time:</strong>{' '}
                {shortestComparison
                  ? `${getTime(shortestComparison)} min`
                  : 'Not provided by API'}
              </p>
              {shortestComparison && (
                <p>
                  <strong>Path:</strong>{' '}
                  {getRouteNames(shortestComparison).join(' → ') || 'Not provided'}
                </p>
              )}
            </div>

            <div className="stat-card">
              <h3>Fastest Route</h3>
              <p>
                <strong>Distance:</strong>{' '}
                {fastestComparison
                  ? `${getDistance(fastestComparison)} km`
                  : 'Not provided by API'}
              </p>
              <p>
                <strong>Estimated time:</strong>{' '}
                {fastestComparison
                  ? `${getTime(fastestComparison)} min`
                  : 'Not provided by API'}
              </p>
              {fastestComparison && (
                <p>
                  <strong>Path:</strong>{' '}
                  {getRouteNames(fastestComparison).join(' → ') || 'Not provided'}
                </p>
              )}
            </div>
          </div>

          {!shortestComparison && !fastestComparison && (
            <p>
              The comparison API returned data in a different format.
              Expand below to inspect the response.
            </p>
          )}

          <details style={{ marginTop: 16 }}>
            <summary>View technical comparison data</summary>
            <pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(comparison, null, 2)}
            </pre>
          </details>
        </section>
      )}

      <section className="panel">
        <h2>Interactive Road Network</h2>
        <p>
          Green indicates the calculated route; red indicates blocked
          connections.
        </p>
        <RoadGraph roads={roads} route={route} />
      </section>

      <section className="panel">
        <h2>Traffic Map</h2>
        <TrafficMap roads={roads} route={route} />
        <p className="dashboard-footer">
          Demo route visualization. Traffic and road conditions are simulated.
        </p>
      </section>

      <section className="panel">
        <h2>Road Network Details</h2>

        <div className="road-list">
          {roads.map((road, index) => {
            const isBlocked =
              road.blocked === true || road.status === 'blocked'

            return (
              <div
                className="road-row"
                key={`${road.start}-${road.end}-${index}`}
              >
                <div>
                  <strong>
                    {road.start_name || displayName(road.start)}
                    {' → '}
                    {road.end_name || displayName(road.end)}
                  </strong>

                  <p>
                    {Number(
                      road.distance_km ?? road.distance ?? 0,
                    ).toFixed(2)}{' '}
                    km • Traffic:{' '}
                    {Number(road.traffic ?? 0).toFixed(0)}%
                  </p>
                </div>

                <span>{isBlocked ? '🔴 Blocked' : '🟢 Open'}</span>
              </div>
            )
          })}
        </div>
      </section>

      <footer className="dashboard-footer">
        SmartRoute • Graph-based route planning and simulated traffic analysis
        <p>
          Demo limitation: road connections, traffic and travel times are
          simulated, not verified live road conditions.
        </p>
      </footer>
    </main>
  )
}
