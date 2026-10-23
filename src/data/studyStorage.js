/**
 * 浏览器本地持久化
 *
 * localStorage 可能被用户禁用、内容被手工修改或来自旧版本，因此读取时必须逐字段
 * 校验。任何异常都回退为空数据，不能让看板因为存储问题白屏。
 */

import {
  STATUS_MAP,
  SUBJECTS,
  createCustomSubject,
  isValidDateKey,
  normalizeSubjectName,
  sortRecords,
  toDateKey
} from '@/data/studyData'

export const STUDY_DATA_KEY = 'studylab:data:v1'
export const THEME_KEY = 'studylab:theme:v1'
const STORAGE_VERSION = 1
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i
const VALID_THEMES = ['light', 'dark']

const emptyStudyData = () => ({ records: [], customSubjects: [] })

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

function sanitizeCustomSubjects(rawSubjects) {
  if (!Array.isArray(rawSubjects)) return []

  const subjects = []
  const names = new Set(SUBJECTS.map((subject) => subject.name.toLocaleLowerCase('zh-CN')))

  rawSubjects.forEach((rawSubject) => {
    if (!isPlainObject(rawSubject)) return

    const name = normalizeSubjectName(rawSubject.name)
    const nameKey = name.toLocaleLowerCase('zh-CN')
    if (!name || name.length > 20 || names.has(nameKey)) return

    // 颜色字段损坏时重新生成，保证科目仍可用且颜色可控。
    const fallback = createCustomSubject(name, [...SUBJECTS, ...subjects])
    const colorsAreValid = ['color', 'softColor', 'darkColor', 'darkSoftColor'].every(
      (key) => HEX_COLOR_PATTERN.test(rawSubject[key])
    )

    subjects.push({
      name,
      color: colorsAreValid ? rawSubject.color : fallback.color,
      softColor: colorsAreValid ? rawSubject.softColor : fallback.softColor,
      darkColor: colorsAreValid ? rawSubject.darkColor : fallback.darkColor,
      darkSoftColor: colorsAreValid ? rawSubject.darkSoftColor : fallback.darkSoftColor,
      isCustom: true
    })
    names.add(nameKey)
  })

  return subjects
}

function sanitizeRecords(rawRecords, customSubjects) {
  if (!Array.isArray(rawRecords)) return []

  const todayKey = toDateKey(new Date())
  const subjectNames = new Map(
    [...SUBJECTS, ...customSubjects].map((subject) => [
      subject.name.toLocaleLowerCase('zh-CN'),
      subject.name
    ])
  )
  const usedIds = new Set()
  const records = []

  rawRecords.forEach((rawRecord) => {
    if (!isPlainObject(rawRecord)) return

    const id = typeof rawRecord.id === 'string' ? rawRecord.id.trim() : ''
    const rawSubject = normalizeSubjectName(rawRecord.subject)
    const subject = subjectNames.get(rawSubject.toLocaleLowerCase('zh-CN'))
    const hours = Number(rawRecord.hours)
    const date = rawRecord.date
    const status = Object.prototype.hasOwnProperty.call(STATUS_MAP, rawRecord.status)
      ? STATUS_MAP[rawRecord.status]
      : null

    if (
      !id ||
      usedIds.has(id) ||
      !subject ||
      !isValidDateKey(date) ||
      date > todayKey ||
      !Number.isFinite(hours) ||
      hours < 0.1 ||
      hours > 12 ||
      !status
    ) {
      return
    }

    const fallbackTime = `${date}T00:00:00`
    const createdAt =
      typeof rawRecord.createdAt === 'string' && rawRecord.createdAt
        ? rawRecord.createdAt
        : fallbackTime
    const updatedAt =
      typeof rawRecord.updatedAt === 'string' && rawRecord.updatedAt
        ? rawRecord.updatedAt
        : createdAt

    records.push({
      id,
      date,
      subject,
      hours: Math.round(hours * 10) / 10,
      status: status.value,
      source: 'manual',
      createdAt,
      updatedAt
    })
    usedIds.add(id)
  })

  return sortRecords(records)
}

export function readStudyData() {
  const storage = getStorage()
  if (!storage) return emptyStudyData()

  try {
    const rawValue = storage.getItem(STUDY_DATA_KEY)
    if (!rawValue) return emptyStudyData()

    const parsed = JSON.parse(rawValue)
    if (!isPlainObject(parsed) || parsed.version !== STORAGE_VERSION) {
      return emptyStudyData()
    }

    const customSubjects = sanitizeCustomSubjects(parsed.customSubjects)
    const records = sanitizeRecords(parsed.records, customSubjects)
    return { records, customSubjects }
  } catch (error) {
    console.warn('[StudyLab] 本地学习数据读取失败，已回退到演示数据。', error)
    return emptyStudyData()
  }
}

export function saveStudyData({ records, customSubjects }) {
  const storage = getStorage()
  if (!storage) return false

  try {
    storage.setItem(
      STUDY_DATA_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        records,
        customSubjects
      })
    )
    return true
  } catch (error) {
    console.warn('[StudyLab] 本地学习数据保存失败。', error)
    return false
  }
}

export function readSavedTheme() {
  const storage = getStorage()
  if (!storage) return null

  try {
    const value = storage.getItem(THEME_KEY)
    return VALID_THEMES.includes(value) ? value : null
  } catch (error) {
    return null
  }
}

export function saveTheme(theme) {
  if (!VALID_THEMES.includes(theme)) return false
  const storage = getStorage()
  if (!storage) return false

  try {
    storage.setItem(THEME_KEY, theme)
    return true
  } catch (error) {
    return false
  }
}

/** 首次访问跟随系统主题；已有用户选择时始终以保存值为准。 */
export function getInitialTheme() {
  return (
    readSavedTheme() ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  )
}
