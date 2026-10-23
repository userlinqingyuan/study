<template>
  <section id="todos" class="surface-panel todo-panel" aria-labelledby="todo-title">
    <div class="panel-header todo-header">
      <div class="todo-header__copy">
        <span class="panel-kicker">行动清单</span>
        <div class="todo-title-row">
          <h2 id="todo-title" class="panel-title">待办计划</h2>
          <span class="todo-count-badge" aria-live="polite">{{ todos.length }} 项</span>
        </div>
        <p class="panel-description">
          给学习目标设定明确的 DDL；完成后划线留痕，进度与逾期状态自动汇总。
        </p>
      </div>

      <el-button
        type="primary"
        icon="el-icon-plus"
        class="todo-add-button"
        @click="startCreate"
      >
        新增待办
      </el-button>
    </div>

    <div class="todo-layout">
      <aside class="todo-summary" aria-label="待办完成概览">
        <div class="todo-summary__head">
          <span>完成进度</span>
          <strong>{{ completedCount }} <small>/ {{ todos.length }}</small></strong>
        </div>

        <div class="todo-summary__main">
          <div
            class="todo-progress-ring"
            role="progressbar"
            aria-label="待办完成进度"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="completionPercent"
          >
            <svg viewBox="0 0 108 108" aria-hidden="true">
              <circle class="todo-progress-ring__track" cx="54" cy="54" r="45"></circle>
              <circle
                class="todo-progress-ring__value"
                cx="54"
                cy="54"
                r="45"
                :style="{ strokeDashoffset: completionOffset }"
              ></circle>
            </svg>
            <div class="todo-progress-ring__text">
              <strong>{{ completionPercent }}</strong>
              <span>%</span>
            </div>
          </div>

          <div class="todo-summary__copy" aria-live="polite">
            <div>
              <strong>{{ remainingCount }}</strong>
              <span>项待完成</span>
            </div>
            <p v-if="overdueCount" class="is-overdue">
              <i class="el-icon-warning-outline" aria-hidden="true"></i>
              {{ overdueCount }} 项已经逾期
            </p>
            <p v-else>
              <i class="el-icon-circle-check" aria-hidden="true"></i>
              暂无逾期任务
            </p>
          </div>
        </div>

        <div class="todo-summary__progress">
          <div class="todo-summary__progress-head">
            <span>已完成 {{ completedCount }} 项</span>
            <span>{{ completionPercent }}%</span>
          </div>
          <div class="todo-summary__progress-track" aria-hidden="true">
            <span :style="{ width: `${completionPercent}%` }"></span>
          </div>
        </div>

        <div class="todo-summary__next">
          <span>下一个 DDL</span>
          <strong :title="nextTodo ? nextTodo.title : ''">
            {{ nextTodo ? nextTodo.title : '暂无待完成事项' }}
          </strong>
          <small v-if="nextTodo">
            {{ formatDueDate(nextTodo.dueDate) }} · {{ getDueMeta(nextTodo).label }}
          </small>
          <small v-else>新增待办后，这里会显示最近的任务</small>
        </div>
      </aside>

      <div class="todo-workspace">
        <transition name="todo-editor">
          <div v-if="editorVisible" class="todo-editor-shell">
            <div class="todo-editor">
              <div class="todo-editor__head">
                <div>
                  <span>QUICK CAPTURE</span>
                  <strong>{{ formMode === 'edit' ? '编辑待办' : '新增待办' }}</strong>
                </div>
                <button
                  type="button"
                  class="todo-editor__close"
                  aria-label="收起待办表单"
                  @click="closeEditor"
                >
                  <i class="el-icon-close" aria-hidden="true"></i>
                </button>
              </div>

              <el-form
                ref="todoForm"
                :model="form"
                :rules="rules"
                label-position="top"
                class="todo-form"
                @submit.native.prevent="submitTodo"
              >
                <div class="todo-form__grid">
                  <el-form-item label="待办内容" prop="title" class="todo-form__title">
                    <el-input
                      ref="titleInput"
                      v-model="form.title"
                      :maxlength="titleLimit"
                      show-word-limit
                      clearable
                      placeholder="例如：完成线性代数第三章习题"
                      @keyup.enter.native="submitTodo"
                    ></el-input>
                  </el-form-item>

                  <el-form-item label="DDL 截止日期" prop="dueDate" class="todo-form__date">
                    <el-date-picker
                      v-model="form.dueDate"
                      type="date"
                      value-format="yyyy-MM-dd"
                      format="yyyy-MM-dd"
                      placeholder="选择截止日期"
                      :clearable="false"
                      :editable="false"
                      class="todo-date-field"
                      aria-label="选择待办截止日期"
                    ></el-date-picker>
                  </el-form-item>
                </div>

                <div class="todo-form__footer">
                  <div class="todo-presets" aria-label="快捷选择截止日期">
                    <span>快捷</span>
                    <button
                      v-for="preset in datePresets"
                      :key="preset.offset"
                      type="button"
                      class="todo-preset"
                      :class="{ 'is-active': form.dueDate === preset.date }"
                      @click="setQuickDate(preset.offset)"
                    >
                      {{ preset.label }}
                    </button>
                  </div>

                  <div class="todo-form__actions">
                    <el-button size="small" class="todo-cancel-button" @click="closeEditor">
                      取消
                    </el-button>
                    <el-button
                      type="primary"
                      size="small"
                      icon="el-icon-check"
                      class="todo-save-button"
                      :loading="submitting"
                      @click="submitTodo"
                    >
                      {{ formMode === 'edit' ? '保存修改' : '加入计划' }}
                    </el-button>
                  </div>
                </div>
              </el-form>
            </div>
          </div>
        </transition>

        <div class="todo-list-head">
          <div>
            <span class="todo-list-head__title">行动计划</span>
            <span class="todo-list-head__hint">未完成优先 · 按 DDL 排序</span>
          </div>
          <span class="todo-list-head__remaining">{{ remainingCount }} 项待完成</span>
        </div>

        <transition name="todo-empty">
          <div v-if="!todos.length" class="todo-empty">
            <span class="todo-empty__icon" aria-hidden="true">
              <i class="el-icon-document-add"></i>
            </span>
            <strong>还没有待办计划</strong>
            <p>从一个清晰的下一步开始，设置 DDL 后进度会自动更新。</p>
            <el-button size="small" icon="el-icon-plus" @click="startCreate">
              新增第一条待办
            </el-button>
          </div>
        </transition>

        <transition-group
          v-if="todos.length"
          tag="ul"
          name="todo-list"
          class="todo-list"
          aria-label="待办列表"
        >
          <li
            v-for="todo in todos"
            :key="todo.id"
            class="todo-item"
            :class="[
              `is-${getDueMeta(todo).tone}`,
              {
                'is-completed': todo.completed,
                'is-highlighted': highlightedTodoId === todo.id
              }
            ]"
          >
            <button
              type="button"
              class="todo-check"
              :class="{ 'is-checked': todo.completed }"
              :aria-label="todo.completed ? `恢复待办：${todo.title}` : `完成待办：${todo.title}`"
              :aria-pressed="String(todo.completed)"
              @click="toggleTodo(todo)"
            >
              <i class="el-icon-check" aria-hidden="true"></i>
            </button>

            <div class="todo-content">
              <span class="todo-title">{{ todo.title }}</span>
              <div class="todo-meta">
                <span class="todo-due" :class="`is-${getDueMeta(todo).tone}`">
                  <i class="el-icon-date" aria-hidden="true"></i>
                  DDL {{ formatDueDate(todo.dueDate) }}
                  <strong>{{ getDueMeta(todo).label }}</strong>
                </span>
                <span v-if="todo.completed && todo.completedAt" class="todo-completed-time">
                  {{ formatCompletedTime(todo.completedAt) }} 完成
                </span>
              </div>
            </div>

            <div class="todo-actions">
              <button
                type="button"
                class="todo-action"
                :aria-label="`编辑待办：${todo.title}`"
                title="编辑"
                @click="startEdit(todo)"
              >
                <i class="el-icon-edit" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                class="todo-action todo-action--danger"
                :aria-label="`删除待办：${todo.title}`"
                title="删除"
                @click="confirmDelete(todo)"
              >
                <i class="el-icon-delete" aria-hidden="true"></i>
              </button>
            </div>
          </li>
        </transition-group>
      </div>
    </div>

    <p class="todo-sr-only" aria-live="polite">{{ announcement }}</p>
  </section>
</template>

<script>
import { addDays, formatMonthDay, isValidDateKey, toDateKey } from '@/data/studyData'
import {
  MAX_TITLE_LENGTH,
  createTodoId,
  readTodos,
  saveTodos,
  sortTodos
} from '@/data/todoStorage'

const RING_CIRCUMFERENCE = 2 * Math.PI * 45

function getDefaultDueDate() {
  return toDateKey(addDays(new Date(), 1))
}

export default {
  name: 'TodoPlanner',
  data() {
    return {
      todos: sortTodos(readTodos()),
      todayKey: toDateKey(new Date()),
      editorVisible: false,
      formMode: 'create',
      editingId: '',
      submitting: false,
      highlightedTodoId: '',
      highlightTimer: null,
      focusTimer: null,
      announcement: '',
      titleLimit: MAX_TITLE_LENGTH,
      form: {
        title: '',
        dueDate: getDefaultDueDate()
      }
    }
  },
  computed: {
    completedCount() {
      return this.todos.filter((todo) => todo.completed).length
    },
    remainingCount() {
      return this.todos.length - this.completedCount
    },
    overdueCount() {
      return this.todos.filter((todo) => this.getDueMeta(todo).isOverdue).length
    },
    completionPercent() {
      if (!this.todos.length) return 0
      return Math.round((this.completedCount / this.todos.length) * 100)
    },
    completionOffset() {
      return RING_CIRCUMFERENCE * (1 - this.completionPercent / 100)
    },
    nextTodo() {
      return this.todos.find((todo) => !todo.completed) || null
    },
    datePresets() {
      return [
        { label: '今天', offset: 0 },
        { label: '明天', offset: 1 },
        { label: '一周后', offset: 7 }
      ].map((preset) => ({
        ...preset,
        date: toDateKey(addDays(new Date(), preset.offset))
      }))
    },
    rules() {
      return {
        title: [
          { validator: this.validateTitle, trigger: 'blur' },
          { validator: this.validateTitle, trigger: 'change' }
        ],
        dueDate: [
          { validator: this.validateDueDate, trigger: 'change' },
          { validator: this.validateDueDate, trigger: 'blur' }
        ]
      }
    }
  },
  beforeDestroy() {
    window.clearTimeout(this.highlightTimer)
    window.clearTimeout(this.focusTimer)
  },
  methods: {
    validateTitle(rule, value, callback) {
      const title = typeof value === 'string' ? value.trim() : ''
      if (!title) {
        callback(new Error('请输入待办内容'))
        return
      }
      if (title.length > MAX_TITLE_LENGTH) {
        callback(new Error(`待办内容不能超过 ${MAX_TITLE_LENGTH} 字`))
        return
      }
      callback()
    },
    validateDueDate(rule, value, callback) {
      if (!isValidDateKey(value)) {
        callback(new Error('请选择有效的截止日期'))
        return
      }
      callback()
    },
    startCreate() {
      this.formMode = 'create'
      this.editingId = ''
      this.form = {
        title: '',
        dueDate: getDefaultDueDate()
      }
      this.submitting = false
      this.editorVisible = true
      this.focusEditor(true)
    },
    startEdit(todo) {
      this.formMode = 'edit'
      this.editingId = todo.id
      this.form = {
        title: todo.title,
        dueDate: todo.dueDate
      }
      this.submitting = false
      this.editorVisible = true
      this.focusEditor(true)
    },
    closeEditor() {
      this.editorVisible = false
      this.editingId = ''
      this.submitting = false
      window.clearTimeout(this.focusTimer)
    },
    focusEditor(shouldScroll) {
      // 编辑列表靠后的待办时，表单可能位于视口上方；先平滑带回表单再聚焦。
      this.$nextTick(() => {
        window.requestAnimationFrame(() => {
          const shell = this.$el.querySelector('.todo-editor-shell')
          const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

          if (shell && shouldScroll) {
            const rect = shell.getBoundingClientRect()
            const headerOffset = window.innerWidth <= 720 ? 76 : 92
            if (rect.top < headerOffset || rect.bottom > window.innerHeight - 24) {
              window.scrollTo({
                top: Math.max(0, rect.top + window.scrollY - headerOffset),
                behavior: reduceMotion ? 'auto' : 'smooth'
              })
            }
          }

          if (this.$refs.todoForm) this.$refs.todoForm.clearValidate()
          const input = this.$refs.titleInput && this.$refs.titleInput.$el.querySelector('input')
          if (input) {
            this.focusTimer = window.setTimeout(() => {
              input.focus({ preventScroll: true })
            }, reduceMotion ? 0 : 260)
          }
        })
      })
    },
    setQuickDate(offset) {
      this.form.dueDate = toDateKey(addDays(new Date(), offset))
      if (this.$refs.todoForm) this.$refs.todoForm.validateField('dueDate')
    },
    submitTodo() {
      if (this.submitting || !this.$refs.todoForm) return
      this.submitting = true

      this.$refs.todoForm.validate((valid) => {
        if (!valid) {
          this.submitting = false
          return
        }

        const title = this.form.title.trim()
        const dueDate = this.form.dueDate
        const now = new Date().toISOString()
        let savedTodo

        if (this.formMode === 'edit') {
          const index = this.todos.findIndex((todo) => todo.id === this.editingId)
          if (index < 0) {
            this.submitting = false
            this.$message.warning('要编辑的待办已不存在')
            this.closeEditor()
            return
          }

          savedTodo = {
            ...this.todos[index],
            title,
            dueDate,
            updatedAt: now
          }
          const nextTodos = [...this.todos]
          nextTodos.splice(index, 1, savedTodo)
          this.todos = sortTodos(nextTodos)
        } else {
          savedTodo = {
            id: createTodoId(),
            title,
            dueDate,
            completed: false,
            createdAt: now,
            updatedAt: now,
            completedAt: null
          }
          this.todos = sortTodos([...this.todos, savedTodo])
        }

        const persisted = saveTodos(this.todos)
        const wasEditing = this.formMode === 'edit'
        this.submitting = false
        this.closeEditor()
        this.highlightTodo(savedTodo.id)
        this.announcement = wasEditing ? '待办已更新' : '待办已加入计划'

        if (persisted) {
          this.$message.success(wasEditing ? '待办已更新' : '待办已加入计划')
        } else {
          this.$message.warning('当前浏览器未允许本地保存，本次待办刷新后会丢失')
        }
      })
    },
    toggleTodo(todo) {
      const completed = !todo.completed
      const now = new Date().toISOString()
      const nextTodos = this.todos.map((item) => {
        if (item.id !== todo.id) return item
        return {
          ...item,
          completed,
          completedAt: completed ? now : null,
          updatedAt: now
        }
      })

      this.todos = sortTodos(nextTodos)
      const persisted = saveTodos(this.todos)
      this.announcement = completed
        ? `已完成“${todo.title}”`
        : `已恢复“${todo.title}”`

      if (!persisted) {
        this.$message.warning('本地保存失败，完成状态刷新后会恢复')
      }
    },
    confirmDelete(todo) {
      this.$confirm(
        `将删除待办“${todo.title}”，此操作不可撤销。`,
        '删除待办',
        {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning',
          customClass: 'study-confirm todo-delete-confirm'
        }
      )
        .then(() => {
          this.todos = this.todos.filter((item) => item.id !== todo.id)
          if (this.editingId === todo.id) this.closeEditor()

          const persisted = saveTodos(this.todos)
          this.announcement = `已删除待办“${todo.title}”`

          if (persisted) {
            this.$message.success('待办已删除')
          } else {
            this.$message.warning('本地保存失败，本次删除刷新后会恢复')
          }
        })
        .catch((error) => {
          if (error !== 'cancel' && error !== 'close') {
            console.error('[StudyLab] 删除待办失败。', error)
          }
        })
    },
    highlightTodo(todoId) {
      window.clearTimeout(this.highlightTimer)
      this.highlightedTodoId = todoId
      this.highlightTimer = window.setTimeout(() => {
        this.highlightedTodoId = ''
      }, 1100)
    },
    getDueMeta(todo) {
      if (!todo) {
        return { tone: 'normal', label: '', isOverdue: false }
      }

      if (todo.completed) {
        return { tone: 'completed', label: '已完成', isOverdue: false }
      }

      const days = this.getDaysBetween(this.todayKey, todo.dueDate)
      if (days < 0) {
        return {
          tone: 'overdue',
          label: `逾期 ${Math.abs(days)} 天`,
          isOverdue: true
        }
      }
      if (days === 0) return { tone: 'soon', label: '今天到期', isOverdue: false }
      if (days === 1) return { tone: 'soon', label: '明天到期', isOverdue: false }
      if (days <= 7) return { tone: 'soon', label: `还剩 ${days} 天`, isOverdue: false }
      return { tone: 'normal', label: `还剩 ${days} 天`, isOverdue: false }
    },
    getDaysBetween(fromDate, toDate) {
      const from = fromDate.split('-').map(Number)
      const to = toDate.split('-').map(Number)
      const fromUtc = Date.UTC(from[0], from[1] - 1, from[2])
      const toUtc = Date.UTC(to[0], to[1] - 1, to[2])
      return Math.round((toUtc - fromUtc) / 86400000)
    },
    formatDueDate(dateKey) {
      if (!isValidDateKey(dateKey)) return dateKey || ''
      const date = new Date(`${dateKey}T00:00:00`)
      const today = new Date()
      if (date.getFullYear() === today.getFullYear()) return formatMonthDay(dateKey)
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    },
    formatCompletedTime(timestamp) {
      const date = new Date(timestamp)
      if (Number.isNaN(date.getTime())) return ''
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  }
}
</script>

<style>
.todo-panel {
  position: relative;
  margin-top: 18px;
  overflow: hidden;
  scroll-margin-top: 98px;
}

.todo-header {
  align-items: center;
  padding-bottom: 19px;
  border-bottom: 1px solid var(--color-line);
}

.todo-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.todo-count-badge {
  padding: 3px 8px;
  color: var(--color-primary);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  border: 1px solid var(--color-primary-border);
  border-radius: 999px;
  background: var(--color-primary-soft);
  transition: color var(--theme-transition), border-color var(--theme-transition),
    background-color var(--theme-transition);
}

.todo-add-button.el-button {
  flex: 0 0 auto;
  min-width: 114px;
  height: 38px;
  font-size: 11px;
  font-weight: 650;
  border-radius: 10px;
  box-shadow: 0 8px 18px rgba(47, 107, 255, 0.18);
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease,
    background-color 180ms ease;
}

.todo-add-button.el-button:hover,
.todo-add-button.el-button:focus {
  box-shadow: 0 11px 24px rgba(47, 107, 255, 0.24);
  transform: translateY(-1px);
}

.todo-add-button.el-button:active {
  transform: scale(0.97);
}

.todo-layout {
  display: grid;
  grid-template-columns: minmax(270px, 0.78fr) minmax(0, 2.22fr);
  gap: 20px;
  align-items: start;
  margin-top: 20px;
}

.todo-summary {
  position: relative;
  min-width: 0;
  padding: 22px;
  overflow: hidden;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  background:
    radial-gradient(circle at 105% -4%, rgba(72, 122, 255, 0.48), transparent 46%),
    linear-gradient(145deg, #111b2a 0%, #0c141f 100%);
  box-shadow: 0 13px 30px rgba(13, 23, 39, 0.16);
}

.todo-summary::before {
  position: absolute;
  top: -66px;
  right: -62px;
  width: 190px;
  height: 190px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  content: '';
}

.todo-summary::after {
  position: absolute;
  right: 22px;
  bottom: 21px;
  width: 42px;
  height: 42px;
  background-image: radial-gradient(rgba(255, 255, 255, 0.23) 1px, transparent 1px);
  background-size: 8px 8px;
  content: '';
  opacity: 0.26;
  pointer-events: none;
}

.todo-summary > * {
  position: relative;
  z-index: 1;
}

.todo-summary__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: rgba(230, 237, 247, 0.52);
  font-size: 10px;
}

.todo-summary__head strong {
  color: rgba(239, 245, 255, 0.92);
  font-size: 12px;
  font-weight: 650;
}

.todo-summary__head small {
  color: rgba(230, 237, 247, 0.4);
  font-size: 10px;
  font-weight: 500;
}

.todo-summary__main {
  display: flex;
  align-items: center;
  gap: 17px;
  margin-top: 20px;
}

.todo-progress-ring {
  position: relative;
  flex: 0 0 108px;
  width: 108px;
  height: 108px;
}

.todo-progress-ring svg {
  display: block;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.todo-progress-ring circle {
  fill: none;
  stroke-width: 8;
}

.todo-progress-ring__track {
  stroke: rgba(255, 255, 255, 0.1);
}

.todo-progress-ring__value {
  stroke: var(--color-primary);
  stroke-linecap: round;
  stroke-dasharray: 282.743;
  filter: drop-shadow(0 0 6px rgba(89, 135, 255, 0.45));
  transition: stroke-dashoffset 560ms cubic-bezier(0.22, 1, 0.36, 1),
    stroke var(--theme-transition);
}

.todo-progress-ring__text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  padding-top: 38px;
  color: #ffffff;
}

.todo-progress-ring__text strong {
  font-size: 28px;
  font-weight: 720;
  letter-spacing: -0.06em;
  line-height: 1;
}

.todo-progress-ring__text span {
  margin-left: 2px;
  color: rgba(230, 237, 247, 0.52);
  font-size: 10px;
  font-weight: 600;
}

.todo-summary__copy {
  min-width: 0;
}

.todo-summary__copy > div {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.todo-summary__copy > div strong {
  color: #ffffff;
  font-size: 30px;
  font-weight: 720;
  letter-spacing: -0.05em;
  line-height: 1;
}

.todo-summary__copy > div span {
  color: rgba(230, 237, 247, 0.5);
  font-size: 9px;
  white-space: nowrap;
}

.todo-summary__copy p {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 10px 0 0;
  color: rgba(230, 237, 247, 0.48);
  font-size: 9px;
  line-height: 1.5;
}

.todo-summary__copy p i {
  font-size: 11px;
}

.todo-summary__copy p.is-overdue {
  color: #f2c986;
}

.todo-summary__progress {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.todo-summary__progress-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: rgba(230, 237, 247, 0.44);
  font-size: 9px;
}

.todo-summary__progress-track {
  height: 5px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.todo-summary__progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  box-shadow: 0 0 12px rgba(100, 145, 255, 0.44);
  transition: width 560ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color var(--theme-transition);
}

.todo-summary__next {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 18px;
  padding: 12px 13px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.todo-summary__next > span {
  color: rgba(230, 237, 247, 0.38);
  font-size: 8px;
  font-weight: 650;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.todo-summary__next strong {
  overflow: hidden;
  color: rgba(248, 251, 255, 0.94);
  font-size: 11px;
  font-weight: 620;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-summary__next small {
  color: rgba(230, 237, 247, 0.44);
  font-size: 9px;
}

.todo-workspace {
  min-width: 0;
}

.todo-editor-shell {
  display: grid;
  grid-template-rows: 1fr;
  margin-bottom: 14px;
  transition: grid-template-rows 300ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 200ms ease, transform 240ms ease, margin-bottom 300ms ease;
}

.todo-editor {
  min-height: 0;
  padding: 16px;
  overflow: hidden;
  border: 1px solid var(--color-primary-border);
  border-radius: 14px;
  background: var(--color-surface-muted);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: background-color var(--theme-transition), border-color var(--theme-transition),
    box-shadow var(--theme-transition);
}

.todo-editor-enter,
.todo-editor-leave-to {
  grid-template-rows: 0fr;
  margin-bottom: 0;
  opacity: 0;
  transform: translateY(-5px);
}

.todo-editor__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.todo-editor__head > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.todo-editor__head span {
  color: var(--color-primary);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.13em;
}

.todo-editor__head strong {
  color: var(--color-ink);
  font-size: 13px;
  font-weight: 680;
}

.todo-editor__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--color-muted);
  font-size: 13px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.todo-editor__close:hover {
  color: var(--color-ink);
  background: var(--color-primary-soft);
  transform: rotate(4deg);
}

.todo-editor__close:active {
  transform: scale(0.9);
}

.todo-editor__close:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 1px;
}

.todo-form .el-form-item {
  margin-bottom: 8px;
}

.todo-form .el-form-item__label {
  padding: 0 0 7px;
  color: var(--color-muted);
  font-size: 9px;
  font-weight: 650;
  line-height: 1.35;
}

.todo-form .el-form-item__error {
  padding-top: 3px;
  font-size: 9px;
}

.todo-form__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 198px;
  gap: 12px;
  align-items: start;
}

.todo-form .el-input__inner {
  height: 40px;
  color: var(--color-ink);
  font-size: 11px;
  border-color: var(--color-line-strong);
  border-radius: 9px;
  background: var(--color-field);
  transition: border-color 180ms ease, box-shadow 180ms ease,
    background-color var(--theme-transition);
}

.todo-form .el-input__inner:hover {
  border-color: var(--color-field-hover);
}

.todo-form .el-input.is-active .el-input__inner,
.todo-form .el-input__inner:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus);
}

.todo-form .el-input__suffix,
.todo-form .el-input__prefix {
  color: var(--color-muted);
}

.todo-date-field.el-date-editor {
  width: 100%;
}

.todo-form__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 3px;
}

.todo-presets {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.todo-presets > span {
  margin-right: 2px;
  color: var(--color-muted);
  font-size: 8px;
}

.todo-preset {
  height: 27px;
  padding: 0 9px;
  color: var(--color-muted);
  font-size: 9px;
  border: 1px solid var(--color-line-strong);
  border-radius: 7px;
  background: var(--color-surface);
  cursor: pointer;
  transition: color 160ms ease, border-color 160ms ease,
    background-color 160ms ease, transform 160ms ease;
}

.todo-preset:hover {
  color: var(--color-primary);
  border-color: var(--color-primary-border);
  transform: translateY(-1px);
}

.todo-preset.is-active {
  color: var(--color-primary-foreground);
  border-color: var(--color-primary);
  background: var(--color-primary);
}

.todo-preset:active {
  transform: scale(0.95);
}

.todo-preset:focus-visible,
.todo-action:focus-visible,
.todo-check:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.todo-form__actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
}

.todo-form__actions .el-button {
  height: 33px;
  margin: 0;
  padding-inline: 12px;
  font-size: 10px;
  border-radius: 8px;
}

.todo-cancel-button.el-button {
  color: var(--color-body);
  border-color: var(--color-line-strong);
  background: var(--color-surface);
}

.todo-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 25px;
  margin-top: 1px;
}

.todo-list-head > div {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.todo-list-head__title {
  color: var(--color-ink);
  font-size: 12px;
  font-weight: 680;
}

.todo-list-head__hint,
.todo-list-head__remaining {
  color: var(--color-muted);
  font-size: 9px;
}

.todo-list-head__remaining {
  flex: 0 0 auto;
}

.todo-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.todo-item {
  --todo-status-color: transparent;
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 67px;
  padding: 12px 13px;
  border: 1px solid var(--color-line);
  border-radius: 13px;
  background: var(--color-surface);
  box-shadow: inset 3px 0 0 var(--todo-status-color), 0 2px 8px rgba(20, 34, 54, 0.025);
  transition: opacity 300ms ease, transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 180ms ease, background-color 180ms ease, box-shadow 200ms ease;
}

.todo-item:hover {
  border-color: var(--color-primary-border);
  background: var(--color-surface-muted);
  box-shadow: inset 3px 0 0 var(--todo-status-color), 0 9px 22px rgba(22, 38, 62, 0.075);
  transform: translateY(-1px);
}

.todo-item:active {
  transform: scale(0.997);
}

.todo-item.is-overdue {
  --todo-status-color: #d98a16;
  border-color: var(--color-warning-border);
}

.todo-item.is-soon {
  --todo-status-color: var(--color-primary);
}

.todo-item.is-completed {
  --todo-status-color: var(--color-primary);
  opacity: 0.52;
}

.todo-item.is-completed:hover,
.todo-item.is-completed:focus-within {
  opacity: 0.78;
}

.todo-item.is-highlighted {
  animation: todo-highlight 1000ms ease both;
}

.todo-check {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 27px;
  height: 27px;
  padding: 0;
  color: transparent;
  border: 1.5px solid var(--color-line-strong);
  border-radius: 50%;
  background: var(--color-field);
  cursor: pointer;
  transition: color 180ms ease, border-color 180ms ease,
    background-color 180ms ease, transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 180ms ease;
}

.todo-check:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  transform: scale(1.08);
}

.todo-check:active {
  transform: scale(0.87);
}

.todo-check i {
  font-size: 12px;
  font-weight: 700;
  opacity: 0;
  transform: scale(0.3) rotate(-24deg);
  transition: opacity 150ms ease, transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.todo-check.is-checked {
  color: var(--color-primary-foreground);
  border-color: var(--color-primary);
  background: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-wash);
  animation: todo-check-pop 360ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.todo-check.is-checked i {
  opacity: 1;
  transform: scale(1) rotate(0);
}

.todo-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.todo-title {
  color: var(--color-ink);
  font-size: 12px;
  font-weight: 640;
  line-height: 1.55;
  overflow-wrap: anywhere;
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-position: 0 56%;
  background-size: 0 1.5px;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  transition: background-size 330ms cubic-bezier(0.22, 1, 0.36, 1),
    color 220ms ease;
}

.todo-item.is-completed .todo-title {
  color: var(--color-muted);
  background-size: 100% 1.5px;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.todo-due {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  color: var(--color-muted);
  font-size: 8.5px;
  line-height: 1.3;
  border-radius: 999px;
  background: var(--color-surface-muted);
  transition: color 180ms ease, background-color var(--theme-transition);
}

.todo-due i {
  font-size: 9px;
}

.todo-due strong {
  color: var(--color-body);
  font-weight: 680;
  transition: color 180ms ease;
}

.todo-due.is-soon {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.todo-due.is-soon strong {
  color: var(--color-primary);
}

.todo-due.is-overdue {
  color: var(--color-warning);
  background: var(--color-warning-soft);
}

.todo-due.is-overdue strong {
  color: var(--color-warning);
}

.todo-due.is-completed {
  color: var(--color-muted);
  background: var(--color-primary-soft);
}

.todo-due.is-completed strong {
  color: var(--color-primary);
}

.todo-completed-time {
  color: var(--color-muted);
  font-size: 8.5px;
}

.todo-actions {
  display: flex;
  align-items: center;
  gap: 3px;
  opacity: 0.55;
  transition: opacity 180ms ease;
}

.todo-item:hover .todo-actions,
.todo-item:focus-within .todo-actions {
  opacity: 1;
}

.todo-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 29px;
  height: 29px;
  padding: 0;
  color: var(--color-muted);
  font-size: 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: color 160ms ease, background-color 160ms ease,
    border-color 160ms ease, transform 160ms ease;
}

.todo-action:hover {
  color: var(--color-primary);
  border-color: var(--color-primary-border);
  background: var(--color-primary-soft);
  transform: translateY(-1px);
}

.todo-action:active {
  transform: scale(0.9);
}

.todo-action--danger:hover {
  color: #c14f4f;
  border-color: #f3dada;
  background: #fff4f4;
}

.todo-empty {
  display: flex;
  align-items: center;
  flex-direction: column;
  margin-top: 10px;
  padding: 30px 20px 28px;
  text-align: center;
  border: 1px dashed var(--color-line-strong);
  border-radius: 14px;
  background: var(--color-surface-muted);
}

.todo-empty__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--color-primary);
  font-size: 20px;
  border-radius: 13px;
  background: var(--color-primary-soft);
}

.todo-empty strong {
  margin-top: 12px;
  color: var(--color-ink);
  font-size: 12px;
  font-weight: 680;
}

.todo-empty p {
  max-width: 330px;
  margin: 6px 0 14px;
  color: var(--color-muted);
  font-size: 9.5px;
  line-height: 1.7;
}

.todo-empty .el-button {
  font-size: 10px;
  border-radius: 8px;
}

.todo-list-enter-active,
.todo-list-leave-active {
  transition: opacity 230ms ease, transform 300ms cubic-bezier(0.22, 1, 0.36, 1);
}

.todo-list-enter,
.todo-list-leave-to,
.todo-item.todo-list-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.todo-list-leave-active {
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
}

.todo-list-move {
  transition: transform 330ms cubic-bezier(0.22, 1, 0.36, 1);
}

.todo-empty-enter-active,
.todo-empty-leave-active {
  transition: opacity 220ms ease, transform 260ms ease;
}

.todo-empty-enter,
.todo-empty-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.todo-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes todo-highlight {
  0% {
    box-shadow: inset 3px 0 0 var(--todo-status-color), 0 0 0 0 var(--color-focus);
  }
  40% {
    box-shadow: inset 3px 0 0 var(--todo-status-color), 0 0 0 4px var(--color-focus);
  }
  100% {
    box-shadow: inset 3px 0 0 var(--todo-status-color), 0 0 0 0 transparent;
  }
}

@keyframes todo-check-pop {
  0% {
    transform: scale(0.78);
  }
  65% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

html[data-theme='dark'] .todo-add-button.el-button {
  box-shadow: 0 9px 20px rgba(0, 0, 0, 0.2);
}

html[data-theme='dark'] .todo-add-button.el-button:hover,
html[data-theme='dark'] .todo-add-button.el-button:focus {
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.3);
}

html[data-theme='dark'] .todo-summary {
  border-color: #3a4739;
  background:
    radial-gradient(circle at 105% -4%, rgba(169, 202, 139, 0.25), transparent 47%),
    linear-gradient(145deg, #242c25 0%, #151a16 100%);
  box-shadow: 0 15px 34px rgba(0, 0, 0, 0.28);
}

html[data-theme='dark'] .todo-progress-ring__value {
  filter: drop-shadow(0 0 7px rgba(169, 202, 139, 0.36));
}

html[data-theme='dark'] .todo-summary__progress-track span {
  box-shadow: 0 0 12px rgba(169, 202, 139, 0.26);
}

html[data-theme='dark'] .todo-editor {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
}

html[data-theme='dark'] .todo-item {
  box-shadow: inset 3px 0 0 var(--todo-status-color), 0 2px 8px rgba(0, 0, 0, 0.1);
}

html[data-theme='dark'] .todo-item:hover {
  box-shadow: inset 3px 0 0 var(--todo-status-color), 0 10px 24px rgba(0, 0, 0, 0.24);
}

html[data-theme='dark'] .todo-action--danger:hover {
  color: #e6a5a5;
  border-color: #523a3a;
  background: #2a1f1f;
}

html[data-theme='dark'] .todo-check.is-checked {
  box-shadow: 0 0 0 4px rgba(169, 202, 139, 0.09);
}

@media (max-width: 900px) {
  .todo-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .todo-summary {
    min-height: 0;
  }
}

@media (max-width: 720px) {
  .todo-panel {
    margin-top: 14px;
    scroll-margin-top: 82px;
  }

  .todo-header {
    padding-bottom: 16px;
  }

  .todo-layout {
    margin-top: 16px;
  }

  .todo-summary {
    padding: 19px;
  }

  .todo-summary__main {
    margin-top: 17px;
  }

  .todo-form__grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
  }

  .todo-form__footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .todo-form__actions {
    width: 100%;
    justify-content: flex-end;
  }

  .todo-form__actions .el-button {
    min-width: 86px;
  }
}

@media (max-width: 520px) {
  .todo-header {
    align-items: stretch;
  }

  .todo-add-button.el-button {
    width: 100%;
  }

  .todo-summary__main {
    gap: 14px;
  }

  .todo-progress-ring {
    flex-basis: 96px;
    width: 96px;
    height: 96px;
  }

  .todo-progress-ring__text {
    padding-top: 33px;
  }

  .todo-progress-ring__text strong {
    font-size: 25px;
  }

  .todo-summary__copy > div strong {
    font-size: 27px;
  }

  .todo-summary__next {
    padding: 11px 12px;
  }

  .todo-editor {
    padding: 14px;
  }

  .todo-list-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }

  .todo-list-head > div {
    flex-wrap: wrap;
  }

  .todo-list-head__remaining {
    display: none;
  }

  .todo-item {
    gap: 10px;
    padding: 12px 11px;
  }

  .todo-check {
    width: 25px;
    height: 25px;
  }

  .todo-title {
    font-size: 11.5px;
  }

  .todo-actions {
    gap: 1px;
    opacity: 0.72;
  }

  .todo-action {
    width: 27px;
    height: 27px;
  }

  .todo-due {
    gap: 3px;
    padding: 4px 7px;
    font-size: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .todo-item:hover,
  .todo-add-button.el-button:hover,
  .todo-add-button.el-button:focus,
  .todo-check:hover,
  .todo-action:hover,
  .todo-editor__close:hover,
  .todo-preset:hover {
    transform: none;
  }

  .todo-list-move {
    transition: none;
  }
}
</style>
