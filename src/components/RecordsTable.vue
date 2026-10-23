<template>
  <section class="surface-panel records-panel" aria-labelledby="records-title">
    <div class="panel-header records-header">
      <div>
        <span class="panel-kicker">学习日志</span>
        <h2 id="records-title" class="panel-title">学习记录</h2>
        <p class="panel-description">
          点击最近 7 天记录联动图表；范围外历史记录仅高亮表格
        </p>
      </div>

      <div class="records-tools">
        <el-button
          type="primary"
          icon="el-icon-plus"
          class="add-record-button"
          @click="$emit('add-record')"
        >
          录入记录
        </el-button>
        <span class="records-summary">
          <span
            class="linked-chip"
            :class="{ 'is-outside': isSelectedOutsideRecent }"
            aria-live="polite"
          >
            <i aria-hidden="true"></i>
            <template v-if="isSelectedOutsideRecent">
              范围外历史记录 {{ selectedDateLabel }} · {{ selectedHours }}h
            </template>
            <template v-else>
              已联动 {{ selectedDateLabel }} · {{ selectedHours }}h
            </template>
          </span>
          <span class="records-total">{{ records.length }} 条记录</span>
        </span>
      </div>
    </div>

    <div class="records-table-wrap">
      <el-table
        :data="pagedRecords"
        row-key="id"
        class="records-table"
        :row-class-name="rowClassName"
        empty-text="暂无学习记录"
        @row-click="handleRowClick"
      >
        <el-table-column label="日期" :width="isNarrow ? 108 : 150">
          <template slot-scope="{ row }">
            <time class="date-cell" :datetime="row.date">
              <strong>{{ row.dateDisplay }}</strong>
              <span>{{ row.weekdayLabel }}</span>
            </time>
          </template>
        </el-table-column>

        <el-table-column label="科目" :min-width="isNarrow ? 108 : 160">
          <template slot-scope="{ row }">
            <span class="subject-cell">
              <i
                class="subject-cell__dot"
                :style="{ backgroundColor: row.subjectColor, boxShadow: `0 0 0 4px ${row.subjectSoftColor}` }"
                aria-hidden="true"
              ></i>
              <span class="subject-cell__name">{{ row.subject }}</span>
              <span v-if="row.source === 'manual'" class="manual-badge">手动</span>
            </span>
          </template>
        </el-table-column>

        <el-table-column label="学习时长（小时）" :min-width="isNarrow ? 148 : 180">
          <template slot-scope="{ row }">
            <div class="duration-cell">
              <div class="duration-cell__value">
                <strong>{{ row.hours.toFixed(1) }}</strong>
                <span>小时</span>
              </div>
              <div
                class="duration-cell__track"
                role="img"
                :aria-label="`${row.subject}学习 ${row.hours} 小时`"
              >
                <span
                  :style="{
                    width: `${durationWidth(row.hours)}%`,
                    backgroundColor: row.subjectColor
                  }"
                ></span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="完成状态" :width="isNarrow ? 104 : 132">
          <template slot-scope="{ row }">
            <el-tag :type="row.statusType" size="small" class="status-tag" disable-transitions>
              <i class="record-status-dot" :style="{ backgroundColor: row.statusTone }" aria-hidden="true"></i>
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" :width="isNarrow ? 112 : 126" fixed="right" align="right">
          <template slot-scope="{ row }">
            <div class="row-actions">
              <template v-if="row.source === 'manual'">
                <el-button
                  type="text"
                  size="mini"
                  icon="el-icon-edit"
                  aria-label="编辑该条学习记录"
                  @click.stop="$emit('edit-record', row)"
                >
                  编辑
                </el-button>
                <el-button
                  type="text"
                  size="mini"
                  icon="el-icon-delete"
                  class="delete-action"
                  aria-label="删除该条学习记录"
                  @click.stop="$emit('delete-record', row)"
                >
                  删除
                </el-button>
              </template>
              <span v-else class="demo-readonly">演示只读</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="records-footer">
      <p class="records-range">
        显示第 {{ rangeStart }}–{{ rangeEnd }} 条，共 {{ records.length }} 条
      </p>

      <el-pagination
        background
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[6, 10, 15]"
        :total="records.length"
        :layout="paginationLayout"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>
  </section>
</template>

<script>
import { formatMonthDay } from '@/data/studyData'

export default {
  name: 'RecordsTable',
  props: {
    records: {
      type: Array,
      required: true
    },
    selectedDate: {
      type: String,
      required: true
    },
    recentDateRange: {
      type: Object,
      required: true
    },
    focusRecordId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      currentPage: 1,
      pageSize: 6,
      isNarrow: false,
      mediaQuery: null,
      activeFocusId: '',
      focusTimer: null
    }
  },
  computed: {
    pagedRecords() {
      // Element UI 只负责展示当前页，完整数据保留在父页面中供图表联动使用。
      const start = (this.currentPage - 1) * this.pageSize
      return this.records.slice(start, start + this.pageSize)
    },
    rangeStart() {
      return this.records.length ? (this.currentPage - 1) * this.pageSize + 1 : 0
    },
    rangeEnd() {
      return Math.min(this.currentPage * this.pageSize, this.records.length)
    },
    selectedDateLabel() {
      return formatMonthDay(this.selectedDate)
    },
    isSelectedOutsideRecent() {
      return !this.recentDateRange.days.some((day) => day.date === this.selectedDate)
    },
    selectedHours() {
      const total = this.records
        .filter((record) => record.date === this.selectedDate)
        .reduce((sum, record) => sum + record.hours, 0)
      return Math.round(total * 10) / 10
    },
    paginationLayout() {
      return this.isNarrow ? 'prev, pager, next' : 'sizes, prev, pager, next'
    }
  },
  watch: {
    records() {
      // 删除记录后若当前页已经没有内容，自动回退到最后一页。
      const maxPage = Math.max(1, Math.ceil(this.records.length / this.pageSize))
      if (this.currentPage > maxPage) this.currentPage = maxPage
    },
    focusRecordId(id) {
      if (id) this.locateRecord(id)
    }
  },
  mounted() {
    this.mediaQuery = window.matchMedia('(max-width: 680px)')
    this.syncNarrowMode()
    this.mediaQuery.addEventListener('change', this.syncNarrowMode)
  },
  beforeDestroy() {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.syncNarrowMode)
    }
    window.clearTimeout(this.focusTimer)
  },
  methods: {
    syncNarrowMode() {
      this.isNarrow = this.mediaQuery.matches
    },
    durationWidth(hours) {
      // 以单次 4 小时作为视觉满格，仅用于表达相对投入强度。
      return Math.min(100, Math.max(8, (hours / 4) * 100))
    },
    rowClassName({ row }) {
      // 同一日期的所有记录一起高亮，让联动范围更清楚。
      const classes = []
      if (row.date === this.selectedDate) classes.push('is-linked-date')
      if (row.id === this.activeFocusId) classes.push('is-focused-record')
      return classes.join(' ')
    },
    handleRowClick(row) {
      this.$emit('select-date', row.date)
    },
    locateRecord(recordId) {
      const index = this.records.findIndex((record) => record.id === recordId)
      if (index < 0) return

      // 先切换到记录所在页，再为整行添加短暂的定位高亮。
      this.currentPage = Math.floor(index / this.pageSize) + 1
      this.activeFocusId = recordId
      window.clearTimeout(this.focusTimer)
      this.focusTimer = window.setTimeout(() => {
        this.activeFocusId = ''
      }, 1800)
    },
    handleCurrentChange(page) {
      this.currentPage = page
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    }
  }
}
</script>

<style>
.records-panel {
  padding-bottom: 18px;
}

.records-header {
  align-items: flex-start;
}

.records-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.add-record-button.el-button {
  height: 34px;
  padding: 0 14px;
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  border: 0;
  border-radius: 10px;
  background: #2f6bff;
  box-shadow: 0 8px 18px rgba(47, 107, 255, 0.2);
  transition: background 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.add-record-button.el-button:hover,
.add-record-button.el-button:focus {
  color: #ffffff;
  background: #245be0;
  box-shadow: 0 10px 22px rgba(47, 107, 255, 0.28);
  transform: translateY(-1px);
}

.add-record-button.el-button:active {
  transform: scale(0.97);
}

.records-summary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.linked-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  color: #2f6bff;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid #dfe9ff;
  border-radius: 999px;
  background: #f3f7ff;
}

.linked-chip i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2f6bff;
  box-shadow: 0 0 0 3px rgba(47, 107, 255, 0.12);
}

.linked-chip.is-outside {
  color: #9a6b14;
  border-color: #f1dfb5;
  background: #fff9eb;
}

.linked-chip.is-outside i {
  background: #d99a21;
  box-shadow: 0 0 0 3px rgba(217, 154, 33, 0.13);
}

.records-total {
  color: #96a0af;
  font-size: 10px;
  white-space: nowrap;
}

.records-table-wrap {
  margin: 22px -4px 0;
}

.records-table {
  width: 100%;
  color: #293548;
  background: transparent;
}

.records-table::before {
  display: none;
}

.records-table th.el-table__cell {
  height: 42px;
  padding: 0;
  color: #929cac;
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.035em;
  background: #f8fafc;
  border-bottom: 0;
}

.records-table th.el-table__cell:first-child {
  border-radius: 10px 0 0 10px;
}

.records-table th.el-table__cell:last-child {
  border-radius: 0 10px 10px 0;
}

.records-table td.el-table__cell {
  padding: 13px 0;
  border-bottom-color: #f0f3f8;
  transition: background 160ms ease;
}

.records-table .cell {
  padding-inline: 16px;
}

.records-table .el-table__row {
  cursor: pointer;
}

.records-table .el-table__body tr:hover > td.el-table__cell {
  background: #f8faff !important;
}

.records-table .el-table__body tr.is-linked-date > td.el-table__cell {
  background: #eef4ff !important;
}

.records-table .el-table__body tr.is-linked-date:hover > td.el-table__cell {
  background: #e8f0ff !important;
}

.records-table .el-table__body tr.is-linked-date > td:first-child {
  box-shadow: inset 3px 0 0 #2f6bff;
}

.records-table .el-table__body tr.is-focused-record > td.el-table__cell {
  background: #eafaf0 !important;
}

.records-table .el-table__body tr.is-focused-record > td:first-child {
  box-shadow: inset 3px 0 0 #10a37f;
}

.records-table .el-table__body tr:last-child td.el-table__cell {
  border-bottom-color: transparent;
}

.date-cell {
  display: flex;
  align-items: baseline;
  gap: 8px;
  white-space: nowrap;
}

.date-cell strong {
  color: #303c4f;
  font-size: 12px;
  font-weight: 650;
}

.date-cell span {
  color: #a0a9b7;
  font-size: 9px;
}

.subject-cell {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.subject-cell__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.subject-cell__name {
  overflow: hidden;
  color: #303b4d;
  font-size: 12px;
  font-weight: 550;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manual-badge {
  padding: 2px 6px;
  color: #2f6bff;
  font-size: 8px;
  font-weight: 650;
  line-height: 1.4;
  border-radius: 999px;
  background: #edf3ff;
  flex: 0 0 auto;
}

.duration-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.duration-cell__value {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  min-width: 55px;
}

.duration-cell__value strong {
  color: #1d2838;
  font-size: 13px;
  font-weight: 680;
}

.duration-cell__value span {
  color: #9ba5b4;
  font-size: 9px;
}

.duration-cell__track {
  width: 64px;
  height: 4px;
  overflow: hidden;
  border-radius: 99px;
  background: #f0f3f7;
}

.duration-cell__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  opacity: 0.8;
  transition: width 450ms cubic-bezier(0.22, 1, 0.36, 1);
}

.status-tag.el-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 23px;
  padding: 0 9px;
  font-size: 9px;
  line-height: 21px;
  border: 0;
  border-radius: 999px;
}

.status-tag.el-tag--success {
  color: #0c8760;
  background: #e8f7f1;
}

.status-tag.el-tag--warning {
  color: #b07713;
  background: #fff5df;
}

.status-tag.el-tag--primary,
.status-tag.el-tag:not(.el-tag--success):not(.el-tag--warning) {
  color: #2f6bff;
  background: #edf3ff;
}

.record-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

.row-actions .el-button {
  padding: 4px;
  color: #2f6bff;
  font-size: 10px;
}

.row-actions .el-button:hover {
  color: #1c4fc9;
}

.row-actions .delete-action {
  color: #c65353;
}

.row-actions .delete-action:hover {
  color: #a52e2e;
}

.demo-readonly {
  color: #a3adbb;
  font-size: 9px;
  white-space: nowrap;
}

.records-table .el-table__fixed-right {
  box-shadow: -8px 0 18px rgba(24, 37, 56, 0.035);
}

.records-table .el-table__fixed-right::before,
.records-table .el-table__fixed::before {
  display: none;
}

.records-table .el-table__fixed-right .el-table__fixed-header-wrapper th,
.records-table .el-table__fixed-right .el-table__fixed-body-wrapper td {
  background-color: #ffffff;
}

.records-table .el-table__fixed-right .el-table__fixed-header-wrapper th {
  background-color: #f8fafc;
}

.records-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #f0f3f8;
}

.records-range {
  margin: 0;
  color: #98a2b1;
  font-size: 10px;
}

.records-footer .el-pagination {
  padding: 0;
}

.records-footer .el-pagination.is-background .btn-next,
.records-footer .el-pagination.is-background .btn-prev,
.records-footer .el-pagination.is-background .el-pager li {
  min-width: 28px;
  height: 28px;
  margin: 0 2px;
  color: #647185;
  font-size: 10px;
  line-height: 28px;
  border-radius: 8px;
  background: #f6f8fb;
  transition: color 160ms ease, background 160ms ease, transform 160ms ease;
}

.records-footer .el-pagination.is-background .btn-next:hover,
.records-footer .el-pagination.is-background .btn-prev:hover,
.records-footer .el-pagination.is-background .el-pager li:hover {
  color: #2f6bff;
  background: #eef4ff;
}

.records-footer .el-pagination.is-background .el-pager li:not(.disabled).active {
  color: #ffffff;
  background: #101827;
}

.records-footer .el-pagination .el-select .el-input {
  width: 92px;
}

.records-footer .el-pagination .el-select .el-input__inner {
  height: 28px;
  color: #647185;
  font-size: 10px;
  border-color: #ecf0f5;
  border-radius: 8px;
  background: #f8fafc;
}

@media (max-width: 900px) {
  .records-header {
    flex-direction: column;
    gap: 14px;
  }

  .records-summary {
    justify-content: flex-start;
  }

  .records-tools {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 680px) {
  .records-table-wrap {
    margin-inline: -2px;
  }

  .records-table .cell {
    padding-inline: 8px;
  }

  .records-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .records-range {
    order: 2;
  }
}
</style>
