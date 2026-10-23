<template>
  <el-drawer
    :visible="visible"
    :with-header="false"
    :title="drawerTitle"
    size="440px"
    direction="rtl"
    custom-class="record-drawer"
    :close-on-click-modal="false"
    :append-to-body="true"
    @update:visible="handleVisibleChange"
  >
    <div class="editor-shell">
      <header class="editor-head">
        <div class="editor-head__copy">
          <span class="editor-kicker">{{ mode === 'edit' ? 'EDIT RECORD' : 'NEW RECORD' }}</span>
          <h2>{{ drawerTitle }}</h2>
          <p>{{ mode === 'edit' ? '修改后会立即重算看板数据' : '记录一次真实投入，让趋势更完整' }}</p>
        </div>
        <button type="button" class="editor-close" aria-label="关闭录入面板" @click="$emit('close')">
          <i class="el-icon-close" aria-hidden="true"></i>
        </button>
      </header>

      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-position="top"
        class="record-form"
        @submit.native.prevent="handleSubmit"
      >
        <div class="form-scroll">
          <el-form-item label="学习日期" prop="date" class="form-item">
            <el-date-picker
              v-model="form.date"
              type="date"
              value-format="yyyy-MM-dd"
              format="yyyy 年 MM 月 dd 日"
              placeholder="选择学习日期"
              :clearable="false"
              :editable="false"
              :picker-options="datePickerOptions"
              class="field-control"
            />
          </el-form-item>

          <el-form-item label="学习科目" prop="subject" class="form-item">
            <el-select
              v-model="form.subject"
              filterable
              allow-create
              default-first-option
              :reserve-keyword="false"
              placeholder="选择科目，或直接输入新科目"
              class="field-control"
            >
              <el-option
                v-for="subject in subjects"
                :key="subject.name"
                :label="subject.name"
                :value="subject.name"
              >
                <span class="subject-option">
                  <i
                    :style="{ backgroundColor: isDark ? subject.darkColor : subject.color }"
                    aria-hidden="true"
                  ></i>
                  <span>{{ subject.name }}</span>
                  <small v-if="subject.isCustom">自定义</small>
                </span>
              </el-option>
            </el-select>
            <p class="field-hint">输入新名称即可创建自定义科目，保存后长期保留</p>
          </el-form-item>

          <el-form-item label="学习时长" prop="hours" class="form-item">
            <div class="duration-field">
              <el-input-number
                v-model="form.hours"
                :min="0.1"
                :max="12"
                :step="0.5"
                :precision="1"
                controls-position="right"
                class="hours-input"
                aria-label="学习时长，单位小时"
              />
              <span class="duration-unit">小时</span>
            </div>
            <div class="quick-hours" aria-label="学习时长快捷选项">
              <button
                v-for="hours in quickHours"
                :key="hours"
                type="button"
                class="quick-hour"
                :class="{ 'is-active': Number(form.hours) === hours }"
                @click="setQuickHours(hours)"
              >
                {{ hours }}h
              </button>
            </div>
          </el-form-item>

          <el-form-item label="完成状态" prop="status" class="form-item">
            <div class="status-picker" role="radiogroup" aria-label="完成状态">
              <button
                v-for="status in statusOptions"
                :key="status.value"
                type="button"
                class="status-choice"
                :class="{ 'is-active': form.status === status.value }"
                role="radio"
                :aria-checked="String(form.status === status.value)"
                @click="selectStatus(status.value)"
              >
                <i :class="status.icon" aria-hidden="true"></i>
                <span>{{ status.value }}</span>
              </button>
            </div>
          </el-form-item>

          <div class="range-note" :class="{ 'is-outside': isOutsideRecent }" aria-live="polite">
            <i
              :class="isOutsideRecent ? 'el-icon-warning-outline' : 'el-icon-circle-check'"
              aria-hidden="true"
            ></i>
            <div>
              <strong>{{ isOutsideRecent ? '仅进入历史记录' : '计入最近 7 天统计' }}</strong>
              <p v-if="isOutsideRecent">
                该记录会出现在完整表格中，但不参与当前趋势图、饼图和概览指标。
              </p>
              <p v-else>
                当前统计范围 {{ recentRangeLabel }}，保存后会立即更新全部图表。
              </p>
            </div>
          </div>
        </div>

        <footer class="editor-actions">
          <el-button native-type="button" class="cancel-button" @click="$emit('close')">
            取消
          </el-button>
          <el-button
            native-type="submit"
            type="primary"
            class="save-button"
            :loading="saving"
          >
            {{ mode === 'edit' ? '保存修改' : '保存记录' }}
          </el-button>
        </footer>
      </el-form>
    </div>
  </el-drawer>
</template>

<script>
import {
  STATUS_OPTIONS,
  isDateWithinRecent,
  isValidDateKey,
  normalizeSubjectName,
  toDateKey
} from '@/data/studyData'

const createEmptyForm = () => ({
  date: toDateKey(new Date()),
  subject: '',
  hours: 1,
  status: '已完成'
})

export default {
  name: 'RecordEditorDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      default: 'create',
      validator: (value) => ['create', 'edit'].includes(value)
    },
    record: {
      type: Object,
      default: null
    },
    subjects: {
      type: Array,
      required: true
    },
    recentDateRange: {
      type: Object,
      required: true
    },
    isDark: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: createEmptyForm(),
      saving: false,
      statusOptions: STATUS_OPTIONS,
      quickHours: [0.5, 1, 1.5, 2]
    }
  },
  computed: {
    drawerTitle() {
      return this.mode === 'edit' ? '编辑学习记录' : '录入学习记录'
    },
    recentRangeLabel() {
      return `${this.recentDateRange.firstDateLabel} — ${this.recentDateRange.latestDateLabel}`
    },
    isOutsideRecent() {
      if (!isValidDateKey(this.form.date)) return false
      return !isDateWithinRecent(this.form.date, this.recentDateRange.days)
    },
    datePickerOptions() {
      return {
        // 只允许选择今天及更早的日期，避免未来记录污染统计。
        disabledDate: (time) => {
          const endOfToday = new Date()
          endOfToday.setHours(23, 59, 59, 999)
          return time.getTime() > endOfToday.getTime()
        }
      }
    },
    rules() {
      return {
        date: [
          { required: true, message: '请选择学习日期', trigger: 'change' },
          {
            validator: (rule, value, callback) => {
              if (!isValidDateKey(value)) {
                callback(new Error('请选择有效的学习日期'))
                return
              }
              callback()
            },
            trigger: 'change'
          }
        ],
        subject: [
          {
            validator: (rule, value, callback) => {
              const name = normalizeSubjectName(value)
              if (!name) {
                callback(new Error('请选择或输入学习科目'))
                return
              }
              if (name.length > 20) {
                callback(new Error('科目名称不能超过 20 个字符'))
                return
              }
              callback()
            },
            trigger: ['blur', 'change']
          }
        ],
        hours: [
          {
            validator: (rule, value, callback) => {
              const hours = Number(value)
              if (!Number.isFinite(hours) || hours < 0.1 || hours > 12) {
                callback(new Error('学习时长需在 0.1–12 小时之间'))
                return
              }
              callback()
            },
            trigger: 'change'
          }
        ],
        status: [
          { required: true, message: '请选择完成状态', trigger: 'change' }
        ]
      }
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(open) {
        if (open) this.initializeForm()
      }
    },
    record() {
      if (this.visible) this.initializeForm()
    }
  },
  methods: {
    initializeForm() {
      // 编辑时复制记录，避免表单输入直接修改父组件中的原始对象。
      const source = this.mode === 'edit' && this.record ? this.record : createEmptyForm()
      this.form = {
        date: source.date || toDateKey(new Date()),
        subject: source.subject || '',
        hours: Number(source.hours) || 1,
        status: source.status || '已完成'
      }
      this.saving = false
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.clearValidate()
      })
    },
    handleVisibleChange(open) {
      if (!open) this.$emit('close')
    },
    setQuickHours(hours) {
      this.form.hours = hours
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.validateField('hours')
      })
    },
    selectStatus(status) {
      this.form.status = status
      this.$nextTick(() => {
        if (this.$refs.form) this.$refs.form.validateField('status')
      })
    },
    handleSubmit() {
      if (this.saving) return

      this.$refs.form.validate((valid) => {
        if (!valid) return

        this.$emit('save', {
          date: this.form.date,
          subject: normalizeSubjectName(this.form.subject),
          hours: Math.round(Number(this.form.hours) * 10) / 10,
          status: this.form.status
        })
      })
    }
  }
}
</script>

<style>
.record-drawer.el-drawer {
  width: 440px !important;
  color: var(--color-body);
  background: var(--color-surface);
  box-shadow: -24px 0 60px rgba(13, 23, 39, 0.14);
}

.record-drawer .el-drawer__body {
  height: 100%;
  padding: 0;
}

.editor-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background:
    radial-gradient(circle at 90% 0%, var(--color-primary-wash), transparent 28%),
    var(--color-surface);
}

.editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 28px 30px 22px;
  border-bottom: 1px solid var(--color-line);
}

.editor-kicker {
  display: block;
  margin-bottom: 7px;
  color: var(--color-primary);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.editor-head h2 {
  margin: 0;
  color: var(--color-ink);
  font-size: 23px;
  font-weight: 720;
  letter-spacing: -0.035em;
}

.editor-head p {
  margin: 8px 0 0;
  color: var(--color-muted);
  font-size: 11px;
}

.editor-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--color-muted);
  font-size: 17px;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-line);
  border-radius: 11px;
  cursor: pointer;
  flex: 0 0 auto;
  transition: color 180ms ease, background 180ms ease, transform 180ms ease;
}

.editor-close:hover {
  color: var(--color-primary);
  transform: rotate(6deg);
}

.editor-close:focus-visible,
.quick-hour:focus-visible,
.status-choice:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.record-form {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.form-scroll {
  flex: 1 1 auto;
  padding: 24px 30px 30px;
  overflow-y: auto;
}

.form-item.el-form-item {
  margin-bottom: 24px;
}

.record-form .el-form-item__label {
  padding-bottom: 8px;
  color: var(--color-body);
  font-size: 11px;
  font-weight: 650;
  line-height: 1.4;
}

.field-control,
.field-control.el-date-editor,
.field-control .el-input,
.field-control .el-select {
  width: 100%;
}

.record-form .el-input__inner {
  height: 43px;
  color: var(--color-ink);
  font-size: 12px;
  border-color: var(--color-line-strong);
  border-radius: 11px;
  background: var(--color-field);
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.record-form .el-input__inner:hover {
  border-color: var(--color-field-hover);
}

.record-form .el-input.is-active .el-input__inner,
.record-form .el-input__inner:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus);
}

.record-form .el-input__prefix,
.record-form .el-input__suffix {
  color: var(--color-muted);
}

.field-hint {
  margin: 7px 0 0;
  color: var(--color-muted);
  font-size: 10px;
  line-height: 1.5;
}

.subject-option {
  display: flex;
  align-items: center;
  gap: 9px;
}

.subject-option i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.subject-option small {
  margin-left: auto;
  color: var(--color-muted);
  font-size: 9px;
}

.duration-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hours-input.el-input-number {
  width: 100%;
}

.hours-input .el-input__inner {
  padding-right: 48px;
  text-align: left;
}

.duration-unit {
  color: var(--color-muted);
  font-size: 11px;
  flex: 0 0 auto;
}

.quick-hours {
  display: flex;
  gap: 7px;
  margin-top: 10px;
}

.quick-hour {
  flex: 1 1 0;
  height: 30px;
  color: var(--color-muted);
  font-size: 10px;
  font-weight: 600;
  background: var(--color-surface-muted);
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: color 160ms ease, background 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.quick-hour:hover {
  color: var(--color-primary);
  border-color: var(--color-primary-border);
  transform: translateY(-1px);
}

.quick-hour.is-active {
  color: var(--color-primary-foreground);
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.status-picker {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.status-choice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 44px;
  padding: 0 8px;
  color: var(--color-muted);
  font-size: 10px;
  font-weight: 600;
  background: var(--color-field);
  border: 1px solid var(--color-line-strong);
  border-radius: 10px;
  cursor: pointer;
  transition: color 160ms ease, background 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.status-choice:hover {
  color: var(--color-body);
  border-color: var(--color-field-hover);
  transform: translateY(-1px);
}

.status-choice.is-active {
  color: var(--color-primary-foreground);
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.range-note {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 14px;
  color: var(--color-primary);
  border: 1px solid var(--color-primary-border);
  border-radius: 12px;
  background: var(--color-primary-soft);
}

.range-note > i {
  margin-top: 2px;
  font-size: 15px;
}

.range-note strong {
  display: block;
  font-size: 11px;
  font-weight: 680;
}

.range-note p {
  margin: 5px 0 0;
  color: var(--color-body);
  font-size: 10px;
  line-height: 1.6;
}

.range-note.is-outside {
  color: var(--color-warning);
  border-color: var(--color-warning-border);
  background: var(--color-warning-soft);
}

.editor-actions {
  display: flex;
  gap: 10px;
  padding: 18px 30px max(18px, env(safe-area-inset-bottom));
  border-top: 1px solid var(--color-line);
  background: var(--color-surface);
}

.editor-actions .el-button {
  height: 42px;
  margin: 0;
  font-size: 12px;
  border-radius: 11px;
}

.cancel-button.el-button {
  width: 102px;
  color: var(--color-body);
  border-color: var(--color-line-strong);
  background: var(--color-surface-muted);
}

.save-button.el-button {
  flex: 1 1 auto;
  border-color: var(--color-primary);
  background: var(--color-primary);
}

.save-button.el-button:hover,
.save-button.el-button:focus {
  border-color: var(--color-primary-hover);
  background: var(--color-primary-hover);
}

@media (max-width: 540px) {
  .record-drawer.el-drawer {
    width: 100% !important;
  }

  .editor-head {
    padding: 22px 20px 18px;
  }

  .form-scroll {
    padding: 20px 20px 26px;
  }

  .editor-actions {
    padding-inline: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .editor-close:hover,
  .quick-hour:hover,
  .status-choice:hover {
    transform: none;
  }
}
</style>
