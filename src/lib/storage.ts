import { Workspace, Analysis } from './types'

const KEYS = {
  API_KEY: 'umpt_api_key',
  WORKSPACES: 'umpt_workspaces',
  ANALYSES: 'umpt_analyses',
}

const LIMITS = {
  MAX_WORKSPACES: 10,
  MAX_ANALYSES_PER_WORKSPACE: 50,
  MAX_PERSONAS_PER_WORKSPACE: 6,
}

function isClient() {
  return typeof window !== 'undefined'
}

// ── Workspaces ──

export function getWorkspaces(): Workspace[] {
  if (!isClient()) return []
  try {
    const raw = localStorage.getItem(KEYS.WORKSPACES)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getWorkspace(id: string): Workspace | null {
  return getWorkspaces().find((w) => w.id === id) ?? null
}

export function saveWorkspace(workspace: Workspace): void {
  if (!isClient()) return
  const all = getWorkspaces()
  const idx = all.findIndex((w) => w.id === workspace.id)
  if (idx >= 0) {
    all[idx] = workspace
  } else {
    if (all.length >= LIMITS.MAX_WORKSPACES) return
    all.push(workspace)
  }
  localStorage.setItem(KEYS.WORKSPACES, JSON.stringify(all))
}

export function deleteWorkspace(id: string): void {
  if (!isClient()) return
  const all = getWorkspaces().filter((w) => w.id !== id)
  localStorage.setItem(KEYS.WORKSPACES, JSON.stringify(all))
  // też usuń analizy tego workspace'u
  const analyses = getAllAnalyses().filter((a) => a.workspaceId !== id)
  localStorage.setItem(KEYS.ANALYSES, JSON.stringify(analyses))
}

// ── Analyses ──

export function getAllAnalyses(): Analysis[] {
  if (!isClient()) return []
  try {
    const raw = localStorage.getItem(KEYS.ANALYSES)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getAnalysesForWorkspace(workspaceId: string): Analysis[] {
  return getAllAnalyses()
    .filter((a) => a.workspaceId === workspaceId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getAnalysis(id: string): Analysis | null {
  return getAllAnalyses().find((a) => a.id === id) ?? null
}

export function saveAnalysis(analysis: Analysis): { pruned: boolean } {
  if (!isClient()) return { pruned: false }
  const all = getAllAnalyses()
  const workspaceAnalyses = all.filter((a) => a.workspaceId === analysis.workspaceId)

  let pruned = false
  if (workspaceAnalyses.length >= LIMITS.MAX_ANALYSES_PER_WORKSPACE) {
    // usuń najstarszą (FIFO)
    const oldest = workspaceAnalyses.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0]
    const idx = all.findIndex((a) => a.id === oldest.id)
    if (idx >= 0) all.splice(idx, 1)
    pruned = true
  }

  all.push(analysis)
  localStorage.setItem(KEYS.ANALYSES, JSON.stringify(all))
  return { pruned }
}

export function deleteAnalysis(id: string): void {
  if (!isClient()) return
  const all = getAllAnalyses().filter((a) => a.id !== id)
  localStorage.setItem(KEYS.ANALYSES, JSON.stringify(all))
}

// ── API Key ──

export function getApiKey(): string {
  if (!isClient()) return ''
  return localStorage.getItem(KEYS.API_KEY) ?? ''
}

export function saveApiKey(key: string): void {
  if (!isClient()) return
  localStorage.setItem(KEYS.API_KEY, key)
}

// ── Seeding ──

export function isSeeded(): boolean {
  if (!isClient()) return false
  return getWorkspaces().length > 0
}
