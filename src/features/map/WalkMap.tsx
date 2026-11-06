import type { ReactNode } from 'react'
import type { ShelterId } from '../../domain/types'
import {
  CELL_SIZE,
  HOME,
  MAP_HEIGHT,
  MAP_WIDTH,
  SHELTERS,
  cellAt,
  cellCenter,
  isHazardAt,
  type GridPoint,
  type TerrainKind,
} from './mapData'

interface WalkMapProps {
  path: GridPoint[] | null
  walkerIndex: number
  destination: ShelterId | null
}

function terrainClass(terrain: TerrainKind): string {
  return `map-cell map-${terrain === 'open' ? 'open' : terrain}`
}

export function WalkMap({ path, walkerIndex, destination }: WalkMapProps) {
  const cells: ReactNode[] = []
  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const cell = cellAt(x, y)
      const terrain: TerrainKind =
        cell === '~'
          ? 'water'
          : cell === '#'
            ? 'building'
            : cell === ','
              ? 'park'
              : cell === 'H'
                ? 'hazard'
                : cell === 'B'
                  ? 'bridge'
                  : cell === '='
                    ? 'road'
                    : 'open'
      const px = x * CELL_SIZE
      const py = y * CELL_SIZE
      const key = `${x}-${y}`

      cells.push(
        <rect
          key={`base-${key}`}
          className={terrainClass(terrain)}
          x={px}
          y={py}
          width={CELL_SIZE}
          height={CELL_SIZE}
        />,
      )

      if (terrain === 'building') {
        cells.push(
          <rect
            key={`roof-${key}`}
            className="map-building-roof"
            x={px + 7}
            y={py + 7}
            width={CELL_SIZE - 14}
            height={CELL_SIZE - 14}
          />,
        )
      } else if (terrain === 'park') {
        cells.push(
          <circle
            key={`tree-${key}`}
            className="map-tree"
            cx={px + CELL_SIZE / 2}
            cy={py + CELL_SIZE / 2}
            r={5}
          />,
        )
      } else if (terrain === 'water' && (x + y) % 4 === 0) {
        cells.push(
          <path
            key={`wave-${key}`}
            d={`M${px + 8} ${py + 22} q6 -5 12 0 t12 0`}
            fill="none"
            stroke="var(--color-water-deep)"
            strokeWidth={1}
            opacity={0.6}
          />,
        )
      } else if (terrain === 'bridge') {
        cells.push(
          <rect
            key={`bridge-${key}`}
            className="map-bridge"
            x={px + 3}
            y={py}
            width={CELL_SIZE - 6}
            height={CELL_SIZE}
          />,
        )
      } else if (terrain === 'hazard') {
        cells.push(
          <rect
            key={`hatch-${key}`}
            x={px}
            y={py}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill="url(#hazard-hatch)"
          />,
        )
      }
    }
  }

  const pathPoints = path?.map((point) => {
    const center = cellCenter(point)
    return `${center.x},${center.y}`
  })
  const walker = path?.[walkerIndex] ?? (path ? path[path.length - 1] : null) ?? HOME
  const walkerCenter = cellCenter(walker)

  return (
    <div className="map-wrap">
      <svg
        className="map-svg"
        viewBox={`0 0 ${MAP_WIDTH * CELL_SIZE} ${MAP_HEIGHT * CELL_SIZE}`}
        role="img"
        aria-label="架空の街の防災マップ。自宅、避難所A・B・C、危険区域を示します。"
      >
        <defs>
          <pattern
            id="hazard-hatch"
            width={8}
            height={8}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={8}
              stroke="var(--color-caution)"
              strokeWidth={1.2}
              opacity={0.55}
            />
          </pattern>
        </defs>

        {cells}

        {pathPoints && pathPoints.length > 1 ? (
          <>
            <polyline className="map-path-under" points={pathPoints.join(' ')} />
            <polyline className="map-path" points={pathPoints.join(' ')} />
          </>
        ) : null}

        {path
          ? path
              .filter((point) => isHazardAt(point.x, point.y))
              .map((point) => {
                const center = cellCenter(point)
                return (
                  <circle
                    key={`path-hazard-${point.x}-${point.y}`}
                    className="map-path-hazard"
                    cx={center.x}
                    cy={center.y}
                    r={5}
                  />
                )
              })
          : null}

        {SHELTERS.map((shelter) => {
          const center = cellCenter(shelter.point)
          const selected = destination === shelter.id
          return (
            <g key={shelter.id}>
              {selected ? (
                <circle
                  cx={center.x}
                  cy={center.y}
                  r={19}
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth={1}
                  opacity={0.45}
                />
              ) : null}
              <circle className="map-shelter" cx={center.x} cy={center.y} r={14} />
              <text className="map-shelter-label" x={center.x} y={center.y + 1}>
                {shelter.id}
              </text>
              <text
                className="map-label"
                x={center.x}
                y={center.y + 30}
                stroke="var(--color-paper)"
                strokeWidth={3}
                paintOrder="stroke"
              >
                避難所 {shelter.id}
              </text>
            </g>
          )
        })}

        <g>
          <rect
            className="map-home"
            x={HOME.x * CELL_SIZE + CELL_SIZE / 2 - 7}
            y={HOME.y * CELL_SIZE + CELL_SIZE / 2 - 7}
            width={14}
            height={14}
            rx={1}
          />
          <text
            className="map-label"
            x={HOME.x * CELL_SIZE + CELL_SIZE / 2}
            y={HOME.y * CELL_SIZE + CELL_SIZE / 2 + 30}
            stroke="var(--color-paper)"
            strokeWidth={3}
            paintOrder="stroke"
          >
            自宅
          </text>
        </g>

        <circle className="map-walker" cx={walkerCenter.x} cy={walkerCenter.y} r={7} />
      </svg>
    </div>
  )
}
