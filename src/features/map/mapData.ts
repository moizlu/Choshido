import type { ShelterId } from '../../domain/types'

export interface GridPoint {
  x: number
  y: number
}

export type TerrainKind = 'water' | 'road' | 'building' | 'park' | 'open' | 'hazard' | 'bridge'

export const MAP_WIDTH = 16
export const MAP_HEIGHT = 12
export const CELL_SIZE = 40
export const CELL_METERS = 30
export const STEPS_PER_CELL = 40

// 16 columns x 12 rows. The map is fictional and only used for the training demo.
// ~ water / = road / # building / , park / . open / H hazard / B bridge
export const MAP_ROWS: readonly string[] = [
  '~~#=#=#=#=#=#=#=',
  '~~#=#=#=#=#=#=#=',
  '~~==============',
  '~~#=#=,=#=#===#=',
  '~~#=HH,=#=#=H=#=',
  '~~#=H=,=#=#===#=',
  '~~~~~B~~~~~~B~~~',
  '~~#=#=#=#=#===#=',
  '~~==============',
  '~~#=#=#=#=#=,=H=',
  '~~#=#=#=#=#=HH==',
  '~~#=#=#=#=#=#=#=',
]

export const HOME: GridPoint = { x: 3, y: 8 }

export interface Shelter {
  id: ShelterId
  name: string
  area: string
  point: GridPoint
}

export const SHELTERS: readonly Shelter[] = [
  { id: 'A', name: '避難所 A', area: '北東', point: { x: 13, y: 2 } },
  { id: 'B', name: '避難所 B', area: '北西', point: { x: 2, y: 2 } },
  { id: 'C', name: '避難所 C', area: '南東', point: { x: 14, y: 10 } },
]

export function shelterById(id: ShelterId): Shelter {
  const shelter = SHELTERS.find((item) => item.id === id)
  if (!shelter) throw new Error(`Unknown shelter: ${id}`)
  return shelter
}

export function cellAt(x: number, y: number): string {
  if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return ''
  return MAP_ROWS[y]?.[x] ?? ''
}

export function terrainAt(x: number, y: number): TerrainKind {
  const cell = cellAt(x, y)
  if (cell === '~') return 'water'
  if (cell === '=') return 'road'
  if (cell === '#') return 'building'
  if (cell === ',') return 'park'
  if (cell === 'H') return 'hazard'
  if (cell === 'B') return 'bridge'
  return 'open'
}

export function isHazardAt(x: number, y: number): boolean {
  return cellAt(x, y) === 'H'
}

export function isWalkableAt(x: number, y: number, avoidHazard: boolean): boolean {
  const cell = cellAt(x, y)
  if (!cell) return false
  if (cell === '~' || cell === '#') return false
  if (avoidHazard && cell === 'H') return false
  return true
}

export function cellCenter(point: GridPoint): { x: number; y: number } {
  return {
    x: point.x * CELL_SIZE + CELL_SIZE / 2,
    y: point.y * CELL_SIZE + CELL_SIZE / 2,
  }
}

export function samePoint(a: GridPoint, b: GridPoint): boolean {
  return a.x === b.x && a.y === b.y
}
