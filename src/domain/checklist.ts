import type { ChecklistItemDef } from './types'

export const CHECKLIST_ITEMS: readonly ChecklistItemDef[] = [
  { id: 'route', label: '避難所までの経路を確認した' },
  { id: 'water', label: '水・食料を3日分備えた' },
  { id: 'toilet', label: '携帯トイレ・衛生用品を確認した' },
  { id: 'family', label: '家族との連絡方法を決めた' },
  { id: 'hazard', label: 'ハザードマップで自宅のリスクを確認した' },
]

export const CHECKLIST_POINTS = 5
