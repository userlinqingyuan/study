/**
 * 学习看板数据层
 *
 * 设计原则：
 * 1. 演示记录与手动记录使用同一份记录结构，表格始终展示全部记录；
 * 2. 趋势图、饼图和概览指标固定只统计最近 7 天；
 * 3. 记录本身只保存业务字段，展示所需的日期文案与主题颜色在派生阶段生成。
 */

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export const STATUS_OPTIONS = [
  {
    value: '已完成',
    type: 'success',
    tone: '#0f9f6e',
    darkTone: '#a9ca8b',
    icon: 'el-icon-circle-check'
  },
  {
    value: '进行中',
    type: '',
    tone: '#2f6bff',
    darkTone: '#c0dda5',
    icon: 'el-icon-time'
  },
  {
    value: '未完成',
    type: 'warning',
    tone: '#d98a16',
    darkTone: '#d8b56e',
    icon: 'el-icon-warning-outline'
  }
]

export const STATUS_MAP = STATUS_OPTIONS.reduce((result, status) => {
  result[status.value] = status
  return result
}, {})

/**
 * 预设科目同时保存日间和夜间配色。
 * 夜间四档颜色均落在抹茶绿色系内，保留足够的明度与色相差，方便饼图区分。
 */
export const SUBJECTS = [
  {
    name: '前端开发',
    color: '#2f6bff',
    softColor: '#edf3ff',
    darkColor: '#a9ca8b',
    darkSoftColor: '#263024'
  },
  {
    name: '数据结构',
    color: '#10a37f',
    softColor: '#e9f8f2',
    darkColor: '#7ea66a',
    darkSoftColor: '#222d22'
  },
  {
    name: '英语',
    color: '#e8a21a',
    softColor: '#fff8e6',
    darkColor: '#c8dca7',
    darkSoftColor: '#2b3124'
  },
  {
    name: '产品设计',
    color: '#8b5cf6',
    softColor: '#f4efff',
    darkColor: '#6f9b7b',
    darkSoftColor: '#233028'
  }
]

/** 新建科目时循环使用的配色，仍保持日间多彩、夜间抹茶绿的两套视觉。 */
const CUSTOM_SUBJECT_PALETTE = [
  {
    color: '#0f9b8e',
    softColor: '#e7f8f5',
    darkColor: '#8fc9a5',
    darkSoftColor: '#24302a'
  },
  {
    color: '#d95c8a',
    softColor: '#fff0f5',
    darkColor: '#b7cf8e',
    darkSoftColor: '#2a3022'
  },
  {
    color: '#b07a2a',
    softColor: '#fbf3e5',
    darkColor: '#9bbf91',
    darkSoftColor: '#252f27'
  },
  {
    color: '#5b78c7',
    softColor: '#eef2fd',
    darkColor: '#c4d9a0',
    darkSoftColor: '#2d3123'
  }
]

// 固定的学习节奏让首次打开看板时就有稳定、易读的展示效果。
const WEEK_SCHEDULE = [
  {
    offset: -6,
    sessions: [
      ['前端开发', 3.5, '已完成'],
      ['英语', 1.2, '已完成'],
      ['数据结构', 1.8, '进行中']
    ]
  },
  {
    offset: -5,
    sessions: [
      ['数据结构', 2.8, '已完成'],
      ['前端开发', 2.5, '已完成'],
      ['英语', 1.0, '已完成']
    ]
  },
  {
    offset: -4,
    sessions: [
      ['前端开发', 3.0, '已完成'],
      ['产品设计', 1.5, '已完成'],
      ['英语', 0.8, '未完成']
    ]
  },
  {
    offset: -3,
    sessions: [
      ['数据结构', 3.5, '已完成'],
      ['前端开发', 1.5, '已完成'],
      ['英语', 1.0, '已完成'],
      ['产品设计', 1.2, '已完成']
    ]
  },
  {
    offset: -2,
    sessions: [
      ['前端开发', 2.4, '已完成'],
      ['数据结构', 2.0, '进行中'],
      ['产品设计', 1.8, '已完成']
    ]
  },
  {
    offset: -1,
    sessions: [
      ['英语', 2.0, '已完成'],
      ['前端开发', 3.6, '已完成'],
      ['数据结构', 1.5, '已完成'],
      ['产品设计', 0.8, '未完成']
    ]
  },
  {
    offset: 0,
    sessions: [
      ['数据结构', 2.6, '已完成'],
      ['产品设计', 2.2, '进行中'],
      ['英语', 1.4, '已完成'],
      ['前端开发', 1.5, '已完成']
    ]
  }
]

const padNumber = (value) => String(value).padStart(2, '0')
const roundOneDecimal = (value) => Math.round(value * 10) / 10
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function addDays(date, amount) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  result.setDate(result.getDate() + amount)
  return result
}

export function toDateKey(date) {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate())
  ].join('-')
}

/** 校验 YYYY-MM-DD，并排除 2026-02-31 这类“格式合法但日期不存在”的值。 */
export function isValidDateKey(value) {
  if (typeof value !== 'string' || !DATE_KEY_PATTERN.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export function formatLongDate(date) {
  const weekday = WEEKDAYS[date.getDay()]
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekday}`
}

export function formatMonthDay(value) {
  if (!isValidDateKey(value)) return value || ''
  const date = new Date(`${value}T00:00:00`)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function getIsoWeek(date) {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayNumber = (target.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNumber + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const firstDayNumber = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3)
  return 1 + Math.round((target - firstThursday) / (7 * 24 * 60 * 60 * 1000))
}

/** 生成最近 7 天的图表横轴与日期范围，所有统计模块共用。 */
export function createRecentDays(baseDate = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(baseDate, index - 6)
    const dateKey = toDateKey(date)
    const dateDisplay = `${date.getMonth() + 1}月${date.getDate()}日`
    const weekdayLabel = WEEKDAYS[date.getDay()]

    return {
      date: dateKey,
      label: `${padNumber(date.getMonth() + 1)}/${padNumber(date.getDate())}`,
      dateDisplay,
      weekdayLabel,
      fullLabel: `${dateDisplay} · ${weekdayLabel}`
    }
  })
}

/** 生成只读演示记录；source 字段用于区分可编辑的手动记录。 */
export function createDemoRecords(baseDate = new Date()) {
  const records = []

  WEEK_SCHEDULE.forEach((day) => {
    const date = addDays(baseDate, day.offset)
    const dateKey = toDateKey(date)

    day.sessions.forEach(([subject, hours, status], index) => {
      records.push({
        id: `demo-${dateKey}-${index + 1}`,
        date: dateKey,
        subject,
        hours,
        status,
        source: 'demo',
        createdAt: `${dateKey}T${padNumber(8 + index)}:00:00`,
        updatedAt: `${dateKey}T${padNumber(8 + index)}:00:00`
      })
    })
  })

  return sortRecords(records)
}

export function normalizeSubjectName(value) {
  return String(value || '').trim()
}

export function findSubjectByName(subjects, name) {
  const target = normalizeSubjectName(name).toLocaleLowerCase('zh-CN')
  return subjects.find(
    (subject) => subject.name.toLocaleLowerCase('zh-CN') === target
  )
}

/** 新建科目进入已有科目列表；颜色按当前自定义科目数量循环选取。 */
export function createCustomSubject(name, existingSubjects = []) {
  const normalizedName = normalizeSubjectName(name)
  const customCount = existingSubjects.filter((subject) => subject.isCustom).length
  const palette = CUSTOM_SUBJECT_PALETTE[customCount % CUSTOM_SUBJECT_PALETTE.length]

  return {
    name: normalizedName,
    ...palette,
    isCustom: true
  }
}

export function createRecordId() {
  const random = Math.random().toString(36).slice(2, 7)
  return `manual-${Date.now()}-${random}`
}

export function sortRecords(records) {
  return [...records].sort((left, right) => {
    const dateCompare = right.date.localeCompare(left.date)
    if (dateCompare !== 0) return dateCompare
    return String(right.createdAt || '').localeCompare(String(left.createdAt || ''))
  })
}

export function isDateWithinRecent(date, recentDays) {
  return recentDays.some((day) => day.date === date)
}

/**
 * 删除记录后解析仍然有效的联动日期。
 *
 * records 已按日期倒序排列，因此当前日期被删空时优先回退到最新一条可用
 * 记录；完全没有记录时回到今天，避免折线图停留在不存在的日期。
 */
export function resolveSelectedDate(records, currentDate, fallbackDate) {
  if (records.some((record) => record.date === currentDate)) return currentDate
  return records.length ? records[0].date : fallbackDate
}

function decorateRecord(record, subjectMap, isDark) {
  const subject = subjectMap.get(record.subject)
  const status = STATUS_MAP[record.status] || STATUS_OPTIONS[0]
  const date = new Date(`${record.date}T00:00:00`)

  return {
    ...record,
    dateDisplay: `${date.getMonth() + 1}月${date.getDate()}日`,
    weekdayLabel: WEEKDAYS[date.getDay()],
    shortDate: `${padNumber(date.getMonth() + 1)}/${padNumber(date.getDate())}`,
    subjectColor: isDark ? subject.darkColor : subject.color,
    subjectSoftColor: isDark ? subject.darkSoftColor : subject.softColor,
    statusType: status.type,
    statusTone: isDark ? status.darkTone : status.tone
  }
}

/**
 * 统一计算看板快照。
 *
 * 手动新增、编辑、删除后，App.vue 只需重新传入原始记录，本函数会立即重算
 * 趋势、饼图、完成率和概览指标，避免多个组件各自维护一份汇总数据。
 */
export function createDashboardSnapshot({
  baseDate = new Date(),
  demoRecords = [],
  manualRecords = [],
  subjects = SUBJECTS,
  isDark = false
}) {
  const recentDays = createRecentDays(baseDate)
  const recentDateKeys = new Set(recentDays.map((day) => day.date))
  const allRawRecords = sortRecords([...demoRecords, ...manualRecords])
  const subjectMap = new Map(subjects.map((subject) => [subject.name, subject]))
  const records = allRawRecords.map((record) =>
    decorateRecord(record, subjectMap, isDark)
  )
  const recentRecords = allRawRecords.filter((record) =>
    recentDateKeys.has(record.date)
  )

  // 折线图固定返回 7 个日期点；没有记录的日期补 0，保证横轴连续。
  const trend = recentDays.map((day) => {
    const hours = recentRecords
      .filter((record) => record.date === day.date)
      .reduce((sum, record) => sum + record.hours, 0)

    return {
      ...day,
      hours: roundOneDecimal(hours)
    }
  })

  const totalHours = roundOneDecimal(
    trend.reduce((sum, day) => sum + day.hours, 0)
  )
  const completedRecords = recentRecords.filter(
    (record) => record.status === '已完成'
  ).length
  const completionRate = recentRecords.length
    ? Math.round((completedRecords / recentRecords.length) * 100)
    : 0
  const dailyAverage = roundOneDecimal(totalHours / trend.length)

  // 饼图只包含近 7 天实际有投入的科目，自定义科目会自动进入统计。
  const subjectTotals = subjects
    .map((subject) => {
      const hours = roundOneDecimal(
        recentRecords
          .filter((record) => record.subject === subject.name)
          .reduce((sum, record) => sum + record.hours, 0)
      )

      return {
        ...subject,
        color: isDark ? subject.darkColor : subject.color,
        softColor: isDark ? subject.darkSoftColor : subject.softColor,
        hours,
        percent: totalHours ? Math.round((hours / totalHours) * 100) : 0
      }
    })
    .filter((subject) => subject.hours > 0)
    .sort((left, right) => right.hours - left.hours)

  return {
    records,
    trend,
    recentDays,
    subjectTotals,
    totalHours,
    dailyAverage,
    completedRecords,
    completionRate,
    recentRecordsCount: recentRecords.length,
    topSubject: subjectTotals[0] || { name: '暂无', hours: 0, percent: 0 },
    latestDate: recentDays[recentDays.length - 1].date,
    firstDate: recentDays[0].date
  }
}

// 兼容旧调用方式：默认只生成演示数据快照。
export function createStudyDataset(baseDate = new Date()) {
  return createDashboardSnapshot({
    baseDate,
    demoRecords: createDemoRecords(baseDate),
    manualRecords: [],
    subjects: SUBJECTS
  })
}
