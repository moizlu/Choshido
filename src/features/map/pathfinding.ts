import {
  CELL_METERS,
  HOME,
  MAP_HEIGHT,
  MAP_WIDTH,
  STEPS_PER_CELL,
  isHazardAt,
  isWalkableAt,
  type GridPoint,
} from './mapData'

const DIRECTIONS: readonly GridPoint[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]

function keyOf(point: GridPoint): string {
  return `${point.x},${point.y}`
}

function heuristic(a: GridPoint, b: GridPoint): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function reconstruct(
  cameFrom: Map<string, string>,
  start: GridPoint,
  goal: GridPoint,
): GridPoint[] {
  const path: GridPoint[] = []
  let current = keyOf(goal)
  const startKey = keyOf(start)
  while (true) {
    const [x, y] = current.split(',').map(Number)
    path.push({ x: x ?? 0, y: y ?? 0 })
    if (current === startKey) break
    const parent = cameFrom.get(current)
    if (!parent) break
    current = parent
  }
  return path.reverse()
}

export function findPath(
  goal: GridPoint,
  avoidHazard: boolean,
  start: GridPoint = HOME,
): GridPoint[] | null {
  if (!isWalkableAt(start.x, start.y, avoidHazard)) return null
  if (!isWalkableAt(goal.x, goal.y, avoidHazard)) return null
  if (start.x === goal.x && start.y === goal.y) return [start]

  const startKey = keyOf(start)
  const goalKey = keyOf(goal)
  const open: GridPoint[] = [start]
  const openKeys = new Set<string>([startKey])
  const cameFrom = new Map<string, string>()
  const gScore = new Map<string, number>([[startKey, 0]])
  const fScore = new Map<string, number>([[startKey, heuristic(start, goal)]])

  while (open.length > 0) {
    let bestIndex = 0
    for (let index = 1; index < open.length; index += 1) {
      const candidate = open[index]
      const best = open[bestIndex]
      if (!candidate || !best) continue
      const candidateF = fScore.get(keyOf(candidate)) ?? Infinity
      const bestF = fScore.get(keyOf(best)) ?? Infinity
      if (candidateF < bestF) bestIndex = index
    }

    const current = open.splice(bestIndex, 1)[0]
    if (!current) break
    const currentKey = keyOf(current)
    openKeys.delete(currentKey)

    if (currentKey === goalKey) {
      return reconstruct(cameFrom, start, goal)
    }

    for (const direction of DIRECTIONS) {
      const neighbor = { x: current.x + direction.x, y: current.y + direction.y }
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= MAP_WIDTH || neighbor.y >= MAP_HEIGHT) {
        continue
      }
      if (!isWalkableAt(neighbor.x, neighbor.y, avoidHazard)) continue

      const neighborKey = keyOf(neighbor)
      const tentative = (gScore.get(currentKey) ?? Infinity) + 1
      if (tentative >= (gScore.get(neighborKey) ?? Infinity)) continue

      cameFrom.set(neighborKey, currentKey)
      gScore.set(neighborKey, tentative)
      fScore.set(neighborKey, tentative + heuristic(neighbor, goal))
      if (!openKeys.has(neighborKey)) {
        open.push(neighbor)
        openKeys.add(neighborKey)
      }
    }
  }

  return null
}

export function countHazardCells(path: readonly GridPoint[]): number {
  return path.filter((point) => isHazardAt(point.x, point.y)).length
}

export function walkMetrics(path: readonly GridPoint[]): {
  cells: number
  distanceM: number
  steps: number
  hazardCells: number
} {
  return {
    cells: path.length,
    distanceM: path.length * CELL_METERS,
    steps: path.length * STEPS_PER_CELL,
    hazardCells: countHazardCells(path),
  }
}
