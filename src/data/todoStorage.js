/**
 * 待办计划本地持久化
 *
 * 待办与学习记录使用不同的存储键，避免任一处保存时覆盖另一处数据。
 * localStorage 内容可能来自旧版本或被手工修改，因此读取时逐字段清洗；
 * 单条损坏数据只会被丢弃，不会影响其他待办或页面加载。
 */

import { isValidDateKey } from '@/data/studyData'

export const TODO_STORAGE_KEY = 'studylab:todos:v1'
const STORAGE_VERSION = 1
const MAX_TITLE_LENGTH = 60

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function getStorage() {
  try {
    return window.localStorage
  } catch (error) {
    return null
  }
}

function normalizeTimestamp(value) {
  if (typeof value !== 'string' || !value) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}

function normalizeTitle(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * 清洗待办数组，确保渲染层只会收到结构完整的数据。
 * 未完成项不保存 completedAt，避免完成时间与状态互相矛盾。
 */
function sanitizeTodos(rawTodos) {
  if (!Array.isArray(rawTodos)) return []

  const usedIds = new Set()
  const todos = []

  rawTodos.forEach((rawTodo) => {
    if (!isPlainObject(rawTodo)) return

    const id = typeof rawTodo.id === 'string' ? rawTodo.id.trim() : ''
    const title = normalizeTitle(rawTodo.title)
    const dueDate = rawTodo.dueDate
    const completed = rawTodo.completed === true
    const createdAt = normalizeTimestamp(rawTodo.createdAt)
    const updatedAt = normalizeTimestamp(rawTodo.updatedAt) || createdAt

    if (
      !id ||
      usedIds.has(id) ||
      !title ||
      title.length > MAX_TITLE_LENGTH ||
      !isValidDateKey(dueDate) ||
      !createdAt ||
      typeof rawTodo.completed !== 'boolean'
    ) {
      return
    }

    todos.push({
      id,
      title,
      dueDate,
      completed,
      createdAt,
      updatedAt,
      completedAt: completed
        ? normalizeTimestamp(rawTodo.completedAt) || updatedAt
        : null
    })
    usedIds.add(id)
  })

  return sortTodos(todos)
}

export function readTodos() {
  const storage = getStorage()
  if (!storage) return []

  try {
    const rawValue = storage.getItem(TODO_STORAGE_KEY)
    if (!rawValue) return []

    const parsed = JSON.parse(rawValue)
    if (!isPlainObject(parsed) || parsed.version !== STORAGE_VERSION) return []

    return sanitizeTodos(parsed.todos)
  } catch (error) {
    console.warn('[StudyLab] 本地待办读取失败，已回退为空列表。', error)
    return []
  }
}

export function saveTodos(todos) {
  const storage = getStorage()
  if (!storage) return false

  try {
    storage.setItem(
      TODO_STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        todos
      })
    )
    return true
  } catch (error) {
    console.warn('[StudyLab] 本地待办保存失败。', error)
    return false
  }
}

export function createTodoId() {
  const random = Math.random().toString(36).slice(2, 7)
  return `todo-${Date.now()}-${random}`
}

/**
 * 未完成项优先，其次按 DDL 由近到远排列；已完成项沉到列表底部。
 * 同一天到期时保持创建顺序，减少新增或编辑后的视觉跳动。
 */
export function sortTodos(todos) {
  return [...todos].sort((left, right) => {
    if (left.completed !== right.completed) return left.completed ? 1 : -1

    const dueDateCompare = left.dueDate.localeCompare(right.dueDate)
    if (dueDateCompare !== 0) return dueDateCompare

    if (left.completed && right.completed) {
      const completedCompare = String(right.completedAt || '').localeCompare(
        String(left.completedAt || '')
      )
      if (completedCompare !== 0) return completedCompare
    }

    return String(left.createdAt || '').localeCompare(String(right.createdAt || ''))
  })
}

export { MAX_TITLE_LENGTH }
