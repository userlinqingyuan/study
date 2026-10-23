<template>
  <header class="app-header">
    <div class="app-header__left">
      <button
        type="button"
        class="menu-toggle"
        :aria-label="toggleLabel"
        :aria-expanded="isMobile ? String(mobileNavOpen) : String(!collapsed)"
        @click="$emit('toggle-sidebar')"
      >
        <i :class="toggleIcon" aria-hidden="true"></i>
      </button>

      <nav class="breadcrumb" aria-label="面包屑导航">
        <span>学习工作台</span>
        <i class="el-icon-arrow-right" aria-hidden="true"></i>
        <strong>{{ pageTitle }}</strong>
      </nav>
    </div>

    <div class="app-header__right">
      <span class="week-chip">第 {{ weekNumber }} 周</span>
      <time class="header-date">{{ todayLabel }}</time>
      <button
        type="button"
        class="theme-toggle"
        :aria-label="themeToggleLabel"
        :title="themeToggleLabel"
        :aria-pressed="String(isDark)"
        @click="$emit('toggle-theme')"
      >
        <i :class="themeToggleIcon" aria-hidden="true"></i>
      </button>
      <div class="user-block">
        <span class="user-avatar" aria-hidden="true">学</span>
        <span class="user-copy">
          <strong>学习者</strong>
          <small>{{ activeDays >= 7 ? '本周全勤' : `已学习 ${activeDays} 天` }}</small>
        </span>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'AppHeader',
  props: {
    pageTitle: {
      type: String,
      default: '数据总览'
    },
    weekNumber: {
      type: Number,
      default: 1
    },
    todayLabel: {
      type: String,
      default: ''
    },
    activeDays: {
      type: Number,
      default: 0
    },
    collapsed: {
      type: Boolean,
      default: false
    },
    isMobile: {
      type: Boolean,
      default: false
    },
    mobileNavOpen: {
      type: Boolean,
      default: false
    },
    isDark: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    toggleIcon() {
      if (this.isMobile) {
        return this.mobileNavOpen ? 'el-icon-close' : 'el-icon-s-unfold'
      }
      return this.collapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'
    },
    toggleLabel() {
      if (this.isMobile) {
        return this.mobileNavOpen ? '关闭导航菜单' : '打开导航菜单'
      }
      return this.collapsed ? '展开侧边栏' : '收起侧边栏'
    },
    themeToggleLabel() {
      return this.isDark ? '切换到日间模式' : '切换到夜间模式'
    },
    themeToggleIcon() {
      return this.isDark ? 'el-icon-sunny' : 'el-icon-moon'
    }
  }
}
</script>

<style>
.app-header {
  position: sticky;
  top: 0;
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 28px;
  border-bottom: 1px solid rgba(226, 231, 240, 0.9);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
}

.app-header__left,
.app-header__right {
  display: flex;
  align-items: center;
}

.app-header__left {
  gap: 18px;
  min-width: 0;
}

.app-header__right {
  gap: 16px;
}

.menu-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  color: #4e5d72;
  font-size: 19px;
  background: #f6f8fb;
  border: 1px solid #e9edf4;
  border-radius: 11px;
  cursor: pointer;
  transition: color 180ms ease, background 180ms ease, border-color 180ms ease, transform 180ms ease;
}

.menu-toggle:hover {
  color: #2f6bff;
  background: #eef4ff;
  border-color: #dce7ff;
}

.menu-toggle:active {
  transform: scale(0.95);
}

.menu-toggle:focus-visible,
.user-avatar:focus-visible {
  outline: 3px solid rgba(47, 107, 255, 0.25);
  outline-offset: 2px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  color: #8b96a8;
  font-size: 12px;
  white-space: nowrap;
}

.breadcrumb i {
  color: #b9c1ce;
  font-size: 11px;
}

.breadcrumb strong {
  overflow: hidden;
  color: #1b2431;
  font-weight: 650;
  text-overflow: ellipsis;
}

.week-chip {
  padding: 6px 10px;
  color: #546279;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #e7ebf2;
  border-radius: 999px;
  background: #fafbfd;
}

.header-date {
  color: #7d899b;
  font-size: 12px;
  white-space: nowrap;
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: #5d6a7e;
  font-size: 16px;
  background: #f6f8fb;
  border: 1px solid #e9edf4;
  border-radius: 50%;
  cursor: pointer;
  flex: 0 0 auto;
  transition: color 200ms ease, background 200ms ease, border-color 200ms ease,
    transform 200ms ease, box-shadow 200ms ease;
}

.theme-toggle:hover {
  color: #2f6bff;
  background: #eef4ff;
  border-color: #dce7ff;
  box-shadow: 0 7px 16px rgba(47, 107, 255, 0.12);
  transform: translateY(-1px) rotate(-5deg);
}

.theme-toggle:active {
  transform: scale(0.94);
}

.theme-toggle:focus-visible {
  outline: 3px solid rgba(47, 107, 255, 0.25);
  outline-offset: 2px;
}

.user-block {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 16px;
  border-left: 1px solid #edf0f5;
}

.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  border-radius: 50%;
  background: linear-gradient(135deg, #141e2f 0%, #34435c 100%);
  box-shadow: 0 5px 14px rgba(15, 24, 38, 0.18);
}

.user-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  white-space: nowrap;
}

.user-copy strong {
  color: #202a38;
  font-size: 12px;
  font-weight: 650;
}

.user-copy small {
  color: #8d98a9;
  font-size: 10px;
}

@media (max-width: 1100px) {
  .week-chip {
    display: none;
  }
}

@media (max-width: 720px) {
  .app-header {
    height: 64px;
    padding: 0 16px;
  }

  .app-header__left {
    gap: 12px;
  }

  .app-header__right {
    gap: 10px;
  }

  .breadcrumb span,
  .breadcrumb i,
  .header-date,
  .user-copy {
    display: none;
  }

  .breadcrumb strong {
    font-size: 13px;
  }

  .user-block {
    padding-left: 10px;
  }

  .theme-toggle {
    width: 32px;
    height: 32px;
    font-size: 15px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    font-size: 12px;
  }
}
</style>
