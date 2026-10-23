<template>
  <aside class="app-sidebar" :class="{ 'is-collapsed': menuCollapsed }" aria-label="主导航">
    <div class="sidebar-brand">
      <div class="brand-mark" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div v-show="!menuCollapsed" class="brand-copy">
        <strong>Study<span>Lab</span></strong>
        <small>个人学习数据中心</small>
      </div>
      <button
        v-if="isMobile"
        type="button"
        class="sidebar-close"
        aria-label="关闭导航"
        @click="$emit('close')"
      >
        <i class="el-icon-close" aria-hidden="true"></i>
      </button>
    </div>

    <div v-show="!menuCollapsed" class="menu-caption">工作台</div>

    <el-menu
      :default-active="activeMenu"
      :collapse="menuCollapsed"
      :collapse-transition="false"
      class="sidebar-menu"
      popper-class="sidebar-menu-popper"
      @select="$emit('select', $event)"
    >
      <el-menu-item index="overview">
        <i class="el-icon-s-home" aria-hidden="true"></i>
        <span slot="title">数据总览</span>
      </el-menu-item>
      <el-menu-item index="analytics">
        <i class="el-icon-s-data" aria-hidden="true"></i>
        <span slot="title">学习分析</span>
      </el-menu-item>
      <el-menu-item index="records">
        <i class="el-icon-document" aria-hidden="true"></i>
        <span slot="title">学习记录</span>
      </el-menu-item>
    </el-menu>

    <div class="sidebar-spacer"></div>

    <div v-show="!menuCollapsed" class="weekly-goal">
      <div class="weekly-goal__head">
        <span>本周目标</span>
        <strong>{{ goalPercent }}%</strong>
      </div>
      <el-progress
        :percentage="goalPercent"
        :show-text="false"
        :stroke-width="6"
        :color="progressColor"
        class="weekly-goal__progress"
      />
      <p>{{ totalHours }} / {{ goalHours }} 小时</p>
    </div>

    <div class="sidebar-footer" :class="{ 'is-icon-only': menuCollapsed }">
      <span class="status-dot" aria-hidden="true"></span>
      <span v-show="!menuCollapsed">近 7 天数据已汇总</span>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'AppSidebar',
  props: {
    activeMenu: {
      type: String,
      required: true
    },
    collapsed: {
      type: Boolean,
      default: false
    },
    isMobile: {
      type: Boolean,
      default: false
    },
    goalPercent: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    },
    goalHours: {
      type: Number,
      default: 50
    },
    isDark: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    menuCollapsed() {
      // 移动端使用抽屉式侧栏，始终展示完整菜单。
      return this.collapsed && !this.isMobile
    },
    progressColor() {
      return this.isDark ? '#a9ca8b' : '#4d7dff'
    }
  }
}
</script>

<style>
.app-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  padding: 0 14px 18px;
  overflow: hidden;
  color: #ffffff;
  background:
    radial-gradient(circle at 18% 8%, rgba(47, 107, 255, 0.2), transparent 30%),
    #0c111b;
  box-shadow: 14px 0 40px rgba(10, 17, 30, 0.08);
  transition: width 280ms cubic-bezier(0.22, 1, 0.36, 1), transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.app-sidebar.is-collapsed {
  width: var(--sidebar-collapsed-width);
  padding-inline: 10px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 82px;
  padding: 0 8px;
  flex: 0 0 auto;
}

.brand-mark {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 3px;
  width: 38px;
  height: 38px;
  padding: 9px 8px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  background: linear-gradient(145deg, #2f6bff 0%, #6d96ff 100%);
  box-shadow: 0 10px 24px rgba(47, 107, 255, 0.3);
  flex: 0 0 auto;
}

.brand-mark span {
  width: 4px;
  border-radius: 4px;
  background: #ffffff;
}

.brand-mark span:nth-child(1) {
  height: 9px;
  opacity: 0.68;
}

.brand-mark span:nth-child(2) {
  height: 17px;
}

.brand-mark span:nth-child(3) {
  height: 13px;
  opacity: 0.84;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  white-space: nowrap;
}

.brand-copy strong {
  font-size: 17px;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.brand-copy strong span {
  color: #7da1ff;
}

.brand-copy small {
  margin-top: 4px;
  overflow: hidden;
  color: #78859a;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
}

.sidebar-close {
  display: none;
  margin-left: auto;
  padding: 8px;
  color: #aeb9ca;
  font-size: 18px;
  line-height: 1;
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

.sidebar-close:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.menu-caption {
  padding: 8px 16px 10px;
  color: #59667b;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.sidebar-menu.el-menu {
  width: 100%;
  border-right: 0;
  background: transparent;
}

.sidebar-menu .el-menu-item {
  height: 48px;
  margin-bottom: 6px;
  padding: 0 16px !important;
  color: #9aa7ba;
  line-height: 48px;
  border-radius: 12px;
  transition: color 180ms ease, background 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.sidebar-menu .el-menu-item i {
  margin-right: 12px;
  color: inherit;
  font-size: 18px;
}

.sidebar-menu .el-menu-item:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.065);
  transform: translateX(2px);
}

.sidebar-menu .el-menu-item.is-active {
  color: #ffffff;
  background: linear-gradient(135deg, #2f6bff 0%, #2459df 100%);
  box-shadow: 0 10px 24px rgba(47, 107, 255, 0.28);
}

.sidebar-menu .el-menu-item.is-active::after {
  position: absolute;
  right: 10px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ffffff;
  content: '';
}

.app-sidebar.is-collapsed .sidebar-menu .el-menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 !important;
}

.app-sidebar.is-collapsed .sidebar-menu .el-menu-item i {
  margin: 0;
}

.app-sidebar.is-collapsed .sidebar-menu .el-menu-item.is-active::after {
  display: none;
}

.app-sidebar.is-collapsed .sidebar-brand {
  justify-content: center;
  padding: 0;
}

.sidebar-spacer {
  flex: 1 1 auto;
  min-height: 36px;
}

.weekly-goal {
  position: relative;
  margin: 0 4px 16px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.045);
}

.weekly-goal::after {
  position: absolute;
  right: -24px;
  bottom: -34px;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: rgba(47, 107, 255, 0.18);
  content: '';
  filter: blur(10px);
}

.weekly-goal__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #bdc7d7;
  font-size: 12px;
}

.weekly-goal__head strong {
  color: #ffffff;
  font-size: 14px;
}

.weekly-goal__progress {
  position: relative;
  z-index: 1;
}

.weekly-goal__progress .el-progress-bar__outer {
  background: rgba(255, 255, 255, 0.1);
}

.weekly-goal p {
  position: relative;
  z-index: 1;
  margin: 9px 0 0;
  color: #6f7d90;
  font-size: 11px;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  color: #667387;
  font-size: 11px;
  white-space: nowrap;
}

.sidebar-footer.is-icon-only {
  justify-content: center;
  padding: 0;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #28b487;
  box-shadow: 0 0 0 3px rgba(40, 180, 135, 0.12);
  flex: 0 0 auto;
}

@media (max-width: 960px) {
  .app-sidebar,
  .app-sidebar.is-collapsed {
    width: 284px;
    padding-inline: 16px;
    transform: translateX(-105%);
    box-shadow: 24px 0 60px rgba(5, 10, 20, 0.3);
  }

  .app-shell.mobile-nav-open .app-sidebar {
    transform: translateX(0);
  }

  .sidebar-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .app-sidebar.is-collapsed .sidebar-brand {
    justify-content: flex-start;
    padding: 0 8px;
  }
}
</style>
