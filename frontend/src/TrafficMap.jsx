
import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const API = 'http://127.0.0.1:8000'
const SALEM_CENTER = [11.6643, 78.1460]

function TrafficMap({ route, roads = [] }) {
  const [locations, setLocations] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/locations`)
      .then((response) => {
        if (!response.ok) throw new Error('Could not load locations')
        return response.json()
      })
      .then((data) => {
        setLocations(Array.isArray(data) ? data : data.locations || [])
        setError('')
      })
      .catch(() => {
        setError('Cannot load locations. Check that the backend is running.')
      })
  }, [])

  // Support common coordinate field names from the API.
  const positionOf = (location) => {
    const lat = location.lat ?? location.latitude
    const lng =
      location.lon ?? location.lng ?? location.longitude

    if (lat == null || lng == null) return null

    return [Number(lat), Number(lng)]
  }

  const locationById = {}
  locations.forEach((location) => {
    locationById[location.id] = location
  })

  const routeIds = route?.route || []

  const routeCoordinates = routeIds
    .map((id) => positionOf(locationById[id] || {}))
    .filter(Boolean)

  const blockedCoordinates = roads
    .filter((road) => road.blocked === true || road.status === 'blocked')
    .map((road) => [
      positionOf(locationById[road.start] || {}),
      positionOf(locationById[road.end] || {}),
    ])
    .filter((points) => points.every(Boolean))

  return (
    <div className="traffic-map">
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      <MapContainer
        center={SALEM_CENTER}
        zoom={12}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {locations.map((location) => {
          const position = positionOf(location)
          if (!position) return null

          return (
            <Marker key={location.id} position={position}>
              <Popup>
                <strong>{location.name || location.id}</strong>
                <br />
                Location in the SmartRoute demo
              </Popup>
            </Marker>
          )
        })}

        {blockedCoordinates.map((points, index) => (
          <Polyline
            key={`blocked-${index}`}
            positions={points}
            pathOptions={{
              color: 'red',
              weight: 5,
              dashArray: '8 8',
            }}
          />
        ))}

        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{ color: 'green', weight: 6 }}
          />
        )}
      </MapContainer>

      <p style={{ fontSize: '12px', color: '#94a3b8' }}>
        Demo route visualization. Green shows the selected route;
        red dashed lines show blocked connections.
      </p>
    </div>
  )
}

export default TrafficMap
