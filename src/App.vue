<template>
  <div
    class="app-shell"
    :class="{
      'is-collapsed': sidebarCollapsed,
      'is-mobile': isMobile,
      'mobile-nav-open': mobileNavOpen
    }"
  >
    <div
      v-if="isMobile && mobileNavOpen"
      class="mobile-backdrop"
      aria-hidden="true"
      @click="closeMobileNav"
    ></div>

    <AppSidebar
      :active-menu="activeMenu"
      :collapsed="sidebarCollapsed"
      :is-mobile="isMobile"
      :goal-percent="goalPercent"
      :total-hours="totalHours"
      :goal-hours="goalHours"
      :is-dark="isDark"
      @select="handleMenuSelect"
      @close="closeMobileNav"
    />

    <div class="main-shell">
      <AppHeader
        :page-title="activePageTitle"
        :week-number="weekNumber"
        :today-label="todayLabel"
        :active-days="activeDays"
        :collapsed="sidebarCollapsed"
        :is-mobile="isMobile"
        :mobile-nav-open="mobileNavOpen"
        :is-dark="isDark"
        @toggle-sidebar="toggleSidebar"
        @toggle-theme="toggleTheme"
      />

      <main id="main-content" class="dashboard-main">
        <section
          id="overview"
          class="dashboard-hero"
          :class="{ 'is-nav-target': focusedSection === 'overview' }"
          aria-labelledby="page-title"
        >
          <div class="hero-glow" aria-hidden="true"></div>

          <div class="hero-copy">
            <span class="hero-eyebrow">
              <i aria-hidden="true"></i>
              WEEKLY LEARNING REVIEW
            </span>
            <h1 id="page-title" class="hero-title">本周学习，<span>清晰可见。</span></h1>
            <p class="hero-description">
              把投入、完成进度与科目分布集中在一处，找到属于自己的学习节奏。
            </p>
            <div class="hero-meta">
              <span class="hero-meta__item">
                <i class="el-icon-date" aria-hidden="true"></i>
                {{ dateRangeLabel }}
              </span>
              <span class="hero-meta__divider" aria-hidden="true"></span>
              <span class="hero-meta__item">{{ activeDays }} 天有学习记录</span>
            </div>
          </div>

          <aside class="hero-period" aria-label="统计周期摘要">
            <div class="hero-period__top">
              <span>本周学习节奏</span>
              <strong>{{ totalHours }}<small>h</small></strong>
            </div>

            <div class="hero-mini-chart" aria-hidden="true">
              <span
                v-for="(day, index) in trend"
                :key="day.date"
                :class="{ 'is-today': index === trend.length - 1 }"
                :style="{ height: `${miniBarHeight(day.hours)}%` }"
              ></span>
            </div>

            <div class="hero-period__foot">
              <span class="hero-period__range">{{ dateRangeLabel }}</span>
              <span>日均 {{ dailyAverage }}h</span>
            </div>
            <p>点击最近 7 天记录联动趋势图；也可以手动补录学习投入。</p>
          </aside>
        </section>

        <TodoPlanner style="--enter-delay: 160ms" />

        <section class="stats-grid" aria-label="近 7 天学习概要">
          <StatCard
            v-for="(stat, index) in stats"
            :key="stat.label"
            :label="stat.label"
            :value="stat.value"
            :unit="stat.unit"
            :hint="stat.hint"
            :icon="stat.icon"
            :tone="stat.tone"
            :progress="stat.progress"
            :delay="240 + index * 70"
          />
        </section>

        <section
          id="analytics"
          class="analytics-grid"
          :class="{ 'is-nav-target': focusedSection === 'analytics' }"
          aria-label="学习数据图表"
        >
          <StudyTrendChart
            :trend="trend"
            :selected-date="selectedDate"
            :is-dark="isDark"
            style="--enter-delay: 560ms"
            @select-date="handleSelectDate"
          />
          <SubjectPieChart
            :subject-totals="subjectTotals"
            :total-hours="totalHours"
            :is-dark="isDark"
            style="--enter-delay: 630ms"
          />
        </section>

        <div
          id="records"
          class="records-section"
          :class="{ 'is-nav-target': focusedSection === 'records' }"
        >
          <RecordsTable
            :records="records"
            :selected-date="selectedDate"
            :recent-date-range="recentRange"
            :focus-record-id="focusRecordId"
            style="--enter-delay: 700ms"
            @select-date="handleSelectDate"
            @add-record="openCreateRecord"
            @edit-record="openEditRecord"
            @delete-record="handleDeleteRecord"
          />
        </div>

        <footer class="dashboard-footer">
          <p>学习记录与待办计划均保存在当前浏览器；演示数据每天更新。</p>
          <span>近 7 天统计 · StudyLab</span>
        </footer>
      </main>
    </div>

    <RecordEditorDrawer
      :visible="editorVisible"
      :mode="editorMode"
      :record="editingRecord"
      :subjects="allSubjects"
      :recent-date-range="recentRange"
      :is-dark="isDark"
      @save="handleSaveRecord"
      @close="closeEditor"
    />

    <transition name="back-top-fade">
      <button
        v-if="showBackToTop"
        type="button"
        class="back-to-top"
        aria-label="返回页面顶部"
        @click="scrollToTop"
      >
        <i class="el-icon-arrow-up" aria-hidden="true"></i>
      </button>
    </transition>
  </div>
</template>

<script>
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'
import StatCard from '@/components/StatCard.vue'
import StudyTrendChart from '@/components/StudyTrendChart.vue'
import SubjectPieChart from '@/components/SubjectPieChart.vue'
import RecordsTable from '@/components/RecordsTable.vue'
import RecordEditorDrawer from '@/components/RecordEditorDrawer.vue'
import TodoPlanner from '@/components/TodoPlanner.vue'
import {
  STATUS_MAP,
  SUBJECTS,
  createCustomSubject,
  createDashboardSnapshot,
  createDemoRecords,
  createRecentDays,
  createRecordId,
  findSubjectByName,
  formatLongDate,
  formatMonthDay,
  getIsoWeek,
  isValidDateKey,
  normalizeSubjectName,
  resolveSelectedDate,
  toDateKey
} from '@/data/studyData'
import {
  getInitialTheme,
  readStudyData,
  saveStudyData,
  saveTheme
} from '@/data/studyStorage'

const PAGE_TITLES = {
  overview: '数据总览',
  analytics: '学习分析',
  records: '学习记录'
}

export default {
  name: 'App',
  components: {
    AppSidebar,
    AppHeader,
    StatCard,
    StudyTrendChart,
    SubjectPieChart,
    RecordsTable,
    RecordEditorDrawer,
    TodoPlanner
  },
  data() {
    const today = new Date()
    const storedData = readStudyData()
    const latestDate = createRecentDays(today).slice(-1)[0].date

    return {
      baseDate: today,
      demoRecords: createDemoRecords(today),
      manualRecords: storedData.records,
      customSubjects: storedData.customSubjects,
      selectedDate: latestDate,
      isDark: getInitialTheme() === 'dark',
      editorVisible: false,
      editorMode: 'create',
      editingRecord: null,
      focusRecordId: '',
      recordFocusTimer: null,
      goalHours: 50,
      activeMenu: 'overview',
      sidebarCollapsed: false,
      isMobile: false,
      mobileNavOpen: false,
      showBackToTop: false,
      focusedSection: '',
      focusTimer: null,
      navScrollTimer: null,
      scrollFrame: null,
      viewportQuery: null,
      todayLabel: formatLongDate(today).replace(`${today.getFullYear()}年`, ''),
      weekNumber: getIsoWeek(today)
    }
  },
  computed: {
    activePageTitle() {
      return PAGE_TITLES[this.activeMenu] || PAGE_TITLES.overview
    },
    allSubjects() {
      return [...SUBJECTS, ...this.customSubjects]
    },
    dashboard() {
      // 全部增删改都通过这一份派生快照统一重算，避免多处统计口径不一致。
      return createDashboardSnapshot({
        baseDate: this.baseDate,
        demoRecords: this.demoRecords,
        manualRecords: this.manualRecords,
        subjects: this.allSubjects,
        isDark: this.isDark
      })
    },
    records() {
      return this.dashboard.records
    },
    trend() {
      return this.dashboard.trend
    },
    subjectTotals() {
      return this.dashboard.subjectTotals
    },
    totalHours() {
      return this.dashboard.totalHours
    },
    dailyAverage() {
      return this.dashboard.dailyAverage
    },
    completedRecords() {
      return this.dashboard.completedRecords
    },
    completionRate() {
      return this.dashboard.completionRate
    },
    topSubject() {
      return this.dashboard.topSubject
    },
    recentRange() {
      return {
        days: this.dashboard.recentDays,
        firstDate: this.dashboard.firstDate,
        latestDate: this.dashboard.latestDate,
        firstDateLabel: formatMonthDay(this.dashboard.firstDate),
        latestDateLabel: formatMonthDay(this.dashboard.latestDate)
      }
    },
    activeDays() {
      return this.trend.filter((day) => day.hours > 0).length
    },
    goalPercent() {
      return Math.min(100, Math.round((this.totalHours / this.goalHours) * 100))
    },
    sessionAverage() {
      if (!this.dashboard.recentRecordsCount) return 0
      return (
        Math.round((this.totalHours / this.dashboard.recentRecordsCount) * 10) / 10
      )
    },
    dateRangeLabel() {
      return `${this.recentRange.firstDateLabel} — ${this.recentRange.latestDateLabel}`
    },
    stats() {
      return [
        {
          label: '本周学习时长',
          value: this.totalHours.toFixed(1),
          unit: '小时',
          hint: `目标 ${this.goalHours}h · 日均 ${this.dailyAverage}h`,
          icon: 'el-icon-time',
          tone: 'primary',
          progress: this.goalPercent
        },
        {
          label: '记录完成率',
          value: this.completionRate,
          unit: '%',
          hint: `近 7 天已完成 ${this.completedRecords} / ${this.dashboard.recentRecordsCount} 条`,
          icon: 'el-icon-circle-check',
          tone: 'default',
          progress: null
        },
        {
          label: '连续学习',
          value: this.activeDays,
          unit: '天',
          hint: this.activeDays >= 7 ? '本周保持全勤 · 节奏稳定' : `近 7 天有 ${this.activeDays} 天在学习`,
          icon: 'el-icon-date',
          tone: 'default',
          progress: null
        },
        {
          label: '单次平均时长',
          value: this.sessionAverage,
          unit: '小时',
          hint: `最常学习：${this.topSubject.name} ${this.topSubject.percent}%`,
          icon: 'el-icon-s-data',
          tone: 'default',
          progress: null
        }
      ]
    }
  },
  watch: {
    mobileNavOpen(open) {
      // 移动端抽屉打开时锁定背景滚动，关闭后恢复页面。
      document.body.style.overflow = open && this.isMobile ? 'hidden' : ''
    },
    isDark(value) {
      this.applyTheme(value)
    }
  },
  mounted() {
    this.applyTheme(this.isDark)
    this.viewportQuery = window.matchMedia('(max-width: 960px)')
    this.syncViewport()
    this.viewportQuery.addEventListener('change', this.syncViewport)
    window.addEventListener('scroll', this.handleScroll, { passive: true })
    window.addEventListener('keydown', this.handleKeydown)
    this.handleScroll()
  },
  beforeDestroy() {
    if (this.viewportQuery) {
      this.viewportQuery.removeEventListener('change', this.syncViewport)
    }
    window.removeEventListener('scroll', this.handleScroll)
    window.removeEventListener('keydown', this.handleKeydown)
    window.cancelAnimationFrame(this.scrollFrame)
    window.clearTimeout(this.focusTimer)
    window.clearTimeout(this.navScrollTimer)
    window.clearTimeout(this.recordFocusTimer)
    document.body.style.overflow = ''
  },
  methods: {
    syncViewport() {
      this.isMobile = this.viewportQuery.matches
      if (!this.isMobile) {
        this.mobileNavOpen = false
      }
    },
    toggleSidebar() {
      if (this.isMobile) {
        this.mobileNavOpen = !this.mobileNavOpen
        return
      }
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    closeMobileNav() {
      this.mobileNavOpen = false
    },
    applyTheme(value) {
      // 同步 html、color-scheme 与浏览器地址栏颜色，保证刷新前后视觉一致。
      const theme = value ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', theme)
      document.documentElement.style.colorScheme = theme
      const themeColor = document.querySelector('meta[name="theme-color"]')
      if (themeColor) {
        themeColor.setAttribute('content', value ? '#121513' : '#f4f7fb')
      }
    },
    toggleTheme() {
      this.isDark = !this.isDark
      saveTheme(this.isDark ? 'dark' : 'light')
    },
    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.closeMobileNav()
      }
    },
    handleMenuSelect(index) {
      // 侧栏菜单采用页内锚点切换，并为目标区块重新触发淡入反馈。
      this.activeMenu = index
      this.closeMobileNav()
      this.focusedSection = index
      window.clearTimeout(this.focusTimer)
      this.focusTimer = window.setTimeout(() => {
        this.focusedSection = ''
      }, 600)

      if (index === 'overview') {
        this.scrollToTop()
        return
      }

      const target = document.getElementById(index)
      if (!target) return

      // 等待抽屉解锁背景滚动后，按吸顶导航高度跳到目标区块；
      // 区块本身会通过淡淡的入场动画提供切换反馈。
      this.$nextTick(() => {
        document.body.style.overflow = ''
        window.clearTimeout(this.navScrollTimer)
        this.navScrollTimer = window.setTimeout(() => {
          const headerOffset = this.isMobile ? 80 : 98
          const targetTop =
            target.getBoundingClientRect().top + window.scrollY - headerOffset
          window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: 'auto'
          })
        }, 120)
      })
    },
    handleSelectDate(date) {
      // 表格行和折线节点共用此方法，保证两处联动状态始终一致。
      this.selectedDate = date
    },
    openCreateRecord() {
      this.closeMobileNav()
      this.editorMode = 'create'
      this.editingRecord = null
      this.editorVisible = true
    },
    openEditRecord(row) {
      const record = this.manualRecords.find((item) => item.id === row.id)
      if (!record) {
        this.$message.warning('该记录已不存在，请刷新后重试')
        return
      }

      this.editorMode = 'edit'
      this.editingRecord = { ...record }
      this.editorVisible = true
    },
    closeEditor() {
      this.editorVisible = false
      this.editingRecord = null
    },
    handleSaveRecord(payload) {
      const date = payload.date
      const subjectName = normalizeSubjectName(payload.subject)
      const hours = Number(payload.hours)
      const status = STATUS_MAP[payload.status]
      const todayKey = toDateKey(new Date())

      // 抽屉已做前端校验，这里再次校验，防止异常事件直接把非法数据写入存储。
      if (
        !isValidDateKey(date) ||
        date > todayKey ||
        !subjectName ||
        subjectName.length > 20 ||
        !Number.isFinite(hours) ||
        hours < 0.1 ||
        hours > 12 ||
        !status
      ) {
        this.$message.error('记录内容不完整或超出允许范围')
        return
      }

      let editIndex = -1
      if (this.editorMode === 'edit' && this.editingRecord) {
        editIndex = this.manualRecords.findIndex(
          (record) => record.id === this.editingRecord.id
        )
        if (editIndex < 0) {
          this.$message.warning('要编辑的记录已不存在')
          this.closeEditor()
          return
        }
      }

      // 科目名称重复时复用已有科目与颜色；首次出现时创建并持久化自定义科目。
      let subject = findSubjectByName(this.allSubjects, subjectName)
      if (!subject) {
        subject = createCustomSubject(subjectName, this.allSubjects)
        this.customSubjects.push(subject)
      }

      const now = new Date().toISOString()
      let savedRecord
      if (editIndex >= 0) {
        const previous = this.manualRecords[editIndex]
        savedRecord = {
          ...previous,
          date,
          subject: subject.name,
          hours: Math.round(hours * 10) / 10,
          status: status.value,
          updatedAt: now
        }
        this.$set(this.manualRecords, editIndex, savedRecord)
      } else {
        savedRecord = {
          id: createRecordId(),
          date,
          subject: subject.name,
          hours: Math.round(hours * 10) / 10,
          status: status.value,
          source: 'manual',
          createdAt: now,
          updatedAt: now
        }
        this.manualRecords.push(savedRecord)
      }

      const persisted = saveStudyData({
        records: this.manualRecords,
        customSubjects: this.customSubjects
      })
      this.selectedDate = date
      this.closeEditor()
      this.setFocusRecord(savedRecord.id)

      if (persisted) {
        this.$message.success(editIndex >= 0 ? '记录已更新' : '记录已添加')
      } else {
        this.$message.warning('当前浏览器未允许本地保存，本次修改刷新后会丢失')
      }
    },
    handleDeleteRecord(row) {
      const record = this.manualRecords.find((item) => item.id === row.id)
      if (!record) return

      this.$confirm(
        `将删除 ${formatMonthDay(record.date)} 的“${record.subject}”记录，此操作不可撤销。`,
        '删除学习记录',
        {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning',
          customClass: 'study-confirm'
        }
      )
        .then(() => {
          this.manualRecords = this.manualRecords.filter(
            (item) => item.id !== record.id
          )
          const persisted = saveStudyData({
            records: this.manualRecords,
            customSubjects: this.customSubjects
          })

          if (this.focusRecordId === record.id) {
            this.focusRecordId = ''
            window.clearTimeout(this.recordFocusTimer)
          }
          this.ensureSelectedDate()

          if (persisted) {
            this.$message.success('记录已删除')
          } else {
            this.$message.warning('本地保存失败，本次删除刷新后会恢复')
          }
        })
        .catch((error) => {
          if (error !== 'cancel' && error !== 'close') {
            console.error('[StudyLab] 删除记录失败。', error)
          }
        })
    },
    ensureSelectedDate() {
      if (this.records.some((record) => record.date === this.selectedDate)) return
      // 当前联动日期已被删空时，回退到最新一条可用记录；没有记录则回到今天。
      this.selectedDate = resolveSelectedDate(
        this.records,
        this.selectedDate,
        this.recentRange.latestDate
      )
    },
    setFocusRecord(recordId) {
      this.focusRecordId = ''
      window.clearTimeout(this.recordFocusTimer)
      this.$nextTick(() => {
        this.focusRecordId = recordId
        this.recordFocusTimer = window.setTimeout(() => {
          this.focusRecordId = ''
        }, 1900)
      })
    },
    handleScroll() {
      this.showBackToTop = window.scrollY > 360
      if (this.scrollFrame) return

      this.scrollFrame = window.requestAnimationFrame(() => {
        this.scrollFrame = null
        const sectionIds = ['overview', 'analytics', 'records']
        let currentSection = 'overview'

        sectionIds.forEach((id) => {
          const section = document.getElementById(id)
          if (section && window.scrollY + 150 >= section.offsetTop) {
            currentSection = id
          }
        })

        const nearBottom =
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
        this.activeMenu = nearBottom ? 'records' : currentSection
      })
    },
    miniBarHeight(hours) {
      const maxHours = Math.max(...this.trend.map((day) => day.hours), 1)
      return Math.max(22, Math.round((hours / maxHours) * 100))
    },
    scrollToTop() {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    }
  }
}
</script>

<style>
.dashboard-main {
  width: min(100%, 1480px);
  margin: 0 auto;
  padding: 28px 30px 36px;
}

.dashboard-hero {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 34px;
  min-height: 238px;
  padding: 36px 38px;
  overflow: hidden;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 24px;
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0.02), transparent 46%),
    #0e1623;
  box-shadow: 0 18px 44px rgba(14, 24, 40, 0.12);
  scroll-margin-top: 98px;
}

.dashboard-hero::before {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.10) 1px, transparent 1px);
  background-size: 22px 22px;
  content: '';
  opacity: 0.18;
  mask-image: linear-gradient(to right, transparent 15%, #000000 100%);
}

.dashboard-hero::after {
  position: absolute;
  top: -110px;
  right: 18%;
  width: 380px;
  height: 300px;
  border: 1px solid rgba(90, 134, 255, 0.14);
  border-radius: 50%;
  content: '';
  transform: rotate(-12deg);
}

.hero-glow {
  position: absolute;
  top: -150px;
  right: -80px;
  width: 500px;
  height: 430px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(47, 107, 255, 0.30) 0%, rgba(47, 107, 255, 0) 68%);
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  max-width: 670px;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #779cf7;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.hero-eyebrow i {
  width: 18px;
  height: 1px;
  background: #4d7dff;
}

.hero-title {
  margin: 16px 0 0;
  color: #ffffff;
  font-size: clamp(31px, 3.2vw, 46px);
  font-weight: 700;
  letter-spacing: -0.055em;
  line-height: 1.16;
}

.hero-title span {
  color: #8bafff;
}

.hero-description {
  max-width: 520px;
  margin: 15px 0 0;
  color: rgba(218, 227, 241, 0.62);
  font-size: 12px;
  line-height: 1.8;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 23px;
  color: rgba(218, 227, 241, 0.55);
  font-size: 10px;
}

.hero-meta__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.hero-meta__item i {
  color: #7fa6ff;
}

.hero-meta__divider {
  width: 1px;
  height: 12px;
  background: rgba(255, 255, 255, 0.14);
}

.hero-period {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 0 0 304px;
  flex-direction: column;
  justify-content: center;
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.065);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.hero-period__top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  color: rgba(229, 236, 247, 0.57);
  font-size: 10px;
}

.hero-period__top strong {
  color: #ffffff;
  font-size: 30px;
  font-weight: 720;
  letter-spacing: -0.06em;
  line-height: 1;
}

.hero-period__top small {
  margin-left: 4px;
  color: #8bafff;
  font-size: 10px;
  letter-spacing: 0;
}

.hero-mini-chart {
  display: flex;
  align-items: flex-end;
  gap: 7px;
  height: 54px;
  margin: 18px 0 14px;
}

.hero-mini-chart span {
  flex: 1 1 0;
  min-width: 4px;
  border-radius: 4px 4px 2px 2px;
  background: linear-gradient(to top, rgba(71, 118, 235, 0.28), rgba(111, 154, 255, 0.78));
  transition: height 500ms cubic-bezier(0.22, 1, 0.36, 1), background 180ms ease;
}

.hero-mini-chart span.is-today {
  background: linear-gradient(to top, #3c6feb, #a8c1ff);
  box-shadow: 0 0 18px rgba(111, 154, 255, 0.24);
}

.hero-period__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  color: rgba(218, 227, 241, 0.46);
  font-size: 9px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.hero-period__range {
  color: rgba(218, 227, 241, 0.74);
}

.hero-period p {
  margin: 12px 0 0;
  color: rgba(218, 227, 241, 0.37);
  font-size: 9px;
  line-height: 1.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(330px, 0.95fr);
  gap: 18px;
  margin-top: 18px;
  scroll-margin-top: 98px;
}

.records-section {
  margin-top: 18px;
  scroll-margin-top: 98px;
}

.is-nav-target {
  animation: nav-target-in 480ms ease both;
}

.dashboard-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 4px 0;
  color: #99a3b2;
  font-size: 9px;
}

.dashboard-footer p {
  margin: 0;
}

.back-to-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #ffffff;
  font-size: 17px;
  background: #101827;
  border: 0;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(16, 24, 39, 0.22);
  cursor: pointer;
  transition: transform 180ms ease, background 180ms ease;
}

.back-to-top:hover {
  background: #2f6bff;
  transform: translateY(-3px);
}

.back-to-top:focus-visible {
  outline: 3px solid rgba(47, 107, 255, 0.28);
  outline-offset: 3px;
}

.back-top-fade-enter-active,
.back-top-fade-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.back-top-fade-enter,
.back-top-fade-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.94);
}

@keyframes nav-target-in {
  from {
    opacity: 0.56;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1180px) {
  .analytics-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 1040px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-period {
    flex-basis: 276px;
  }
}

@media (max-width: 960px) {
  .dashboard-main {
    padding: 22px 24px 32px;
  }

  .dashboard-hero {
    gap: 24px;
  }
}

@media (max-width: 820px) {
  .dashboard-hero {
    align-items: stretch;
    flex-direction: column;
    padding: 30px;
  }

  .hero-copy {
    max-width: none;
  }

  .hero-period {
    flex: 0 0 auto;
    width: 100%;
  }

  .hero-mini-chart {
    height: 46px;
  }
}

@media (max-width: 720px) {
  .dashboard-main {
    padding: 16px 16px 26px;
  }

  .dashboard-hero {
    min-height: 0;
    padding: 26px 22px;
    border-radius: 20px;
    scroll-margin-top: 82px;
  }

  .hero-eyebrow {
    font-size: 9px;
    letter-spacing: 0.1em;
  }

  .hero-title {
    margin-top: 14px;
    font-size: 31px;
  }

  .hero-description {
    margin-top: 12px;
    font-size: 11px;
  }

  .hero-meta {
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
  }

  .hero-meta__divider {
    display: none;
  }

  .hero-period {
    padding: 18px;
    border-radius: 15px;
  }

  .stats-grid,
  .analytics-grid,
  .records-section {
    margin-top: 14px;
  }

  .analytics-grid,
  .records-section {
    scroll-margin-top: 82px;
  }

  .dashboard-footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
    padding-top: 20px;
  }

  .back-to-top {
    right: 16px;
    bottom: 16px;
  }
}

@media (max-width: 548px) {
  .stats-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .hero-title {
    font-size: 29px;
  }

  .hero-title span {
    display: block;
    margin-top: 3px;
  }
}
</style>
