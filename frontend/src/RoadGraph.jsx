
function RoadGraph({ roads = [], route }) {
  const activeRoute = route?.route || []
  const nodeIds = new Set()
  const nodeNames = {}

  roads.forEach((road) => {
    if (road.start) {
      nodeIds.add(road.start)
      nodeNames[road.start] = road.start_name || road.start
    }

    if (road.end) {
      nodeIds.add(road.end)
      nodeNames[road.end] = road.end_name || road.end
    }
  })

  activeRoute.forEach((id) => nodeIds.add(id))

  const ids = Array.from(nodeIds)
  const columns = 5
  const gapX = 190
  const gapY = 105
  const width = Math.max(950, columns * gapX + 40)
  const rows = Math.ceil(ids.length / columns)
  const height = Math.max(300, rows * gapY + 50)

  const positions = {}

  ids.forEach((id, index) => {
    positions[id] = {
      x: 95 + (index % columns) * gapX,
      y: 35 + Math.floor(index / columns) * gapY,
    }
  })

  if (!ids.length) {
    return <p>No road connections available. Check the backend.</p>
  }

  return (
    <div className="graph-container">
      <div style={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="road-graph"
          style={{
            width: '100%',
            minWidth: '800px',
            background: '#111827',
            borderRadius: '12px',
          }}
        >
          {roads.map((road, index) => {
            const start = positions[road.start]
            const end = positions[road.end]

            if (!start || !end) return null

            const blocked =
              road.blocked === true || road.status === 'blocked'

            const active = activeRoute.some(
              (id, i) =>
                i < activeRoute.length - 1 &&
                ((id === road.start &&
                  activeRoute[i + 1] === road.end) ||
                  (id === road.end &&
                    activeRoute[i + 1] === road.start))
            )

            return (
              <line
                key={`${road.start}-${road.end}-${index}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={
                  blocked ? '#ef4444' : active ? '#22c55e' : '#475569'
                }
                strokeWidth={active ? 4 : 1.5}
                strokeDasharray={blocked ? '6 5' : undefined}
              />
            )
          })}

          {ids.map((id) => {
            const point = positions[id]
            const selected = activeRoute.includes(id)
            const name = nodeNames[id] || id
            const label =
              name.length > 24 ? name.slice(0, 22) + '…' : name

            return (
              <g key={id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={selected ? 10 : 7}
                  fill={selected ? '#22c55e' : '#3b82f6'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                <text
                  x={point.x}
                  y={point.y + 24}
                  fill="#f8fafc"
                  fontSize="11"
                  fontWeight={selected ? '700' : '400'}
                  textAnchor="middle"
                >
                  {label}
                </text>

                <title>{name}</title>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="graph-legend">
        <span>🟢 Recommended route</span>
        <span>🔴 Blocked road</span>
        <span>🔵 Other locations</span>
      </div>

      <p style={{ fontSize: '12px', color: '#94a3b8' }}>
        Demo network only. Roads and connections are not verified real-world data.
      </p>
    </div>
  )
}

export default RoadGraph
