<template>
  <article
    class="stat-card"
    :class="{ 'stat-card--primary': tone === 'primary' }"
    :style="{ '--enter-delay': `${delay}ms` }"
  >
    <div class="stat-card__head">
      <span class="stat-card__label">{{ label }}</span>
      <span class="stat-card__icon" aria-hidden="true">
        <i :class="icon"></i>
      </span>
    </div>

    <div class="stat-card__value">
      <strong>{{ value }}</strong>
      <span>{{ unit }}</span>
    </div>

    <p class="stat-card__hint">{{ hint }}</p>

    <div v-if="progress !== null" class="stat-card__progress">
      <div class="stat-card__progress-head">
        <span>距离周目标</span>
        <span>{{ Math.round(progress) }}%</span>
      </div>
      <div
        class="stat-card__progress-track"
        role="progressbar"
        aria-label="本周学习目标完成进度"
        :aria-valuenow="Math.round(progress)"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span :style="{ width: `${Math.min(progress, 100)}%` }"></span>
      </div>
    </div>
  </article>
</template>

<script>
export default {
  name: 'StatCard',
  props: {
    label: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number],
      required: true
    },
    unit: {
      type: String,
      default: ''
    },
    hint: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'el-icon-s-data'
    },
    tone: {
      type: String,
      default: 'default'
    },
    progress: {
      type: Number,
      default: null
    },
    delay: {
      type: Number,
      default: 0
    }
  }
}
</script>

<style>
.stat-card {
  position: relative;
  min-height: 174px;
  padding: 22px;
  overflow: hidden;
  border: 1px solid #e8edf5;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(27, 39, 57, 0.035);
  animation: stat-enter 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--enter-delay, 0ms);
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease, border-color 220ms ease;
}

.stat-card:hover {
  z-index: 2;
  border-color: #dce6f8;
  box-shadow: 0 18px 40px rgba(30, 54, 92, 0.11);
  transform: translateY(-5px) scale(1.012);
}

.stat-card__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-card__label {
  color: #69768a;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.stat-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #2f6bff;
  font-size: 16px;
  border-radius: 10px;
  background: #edf3ff;
}

.stat-card__value {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 18px;
}

.stat-card__value strong {
  color: #111a27;
  font-size: clamp(30px, 2.5vw, 38px);
  font-weight: 720;
  letter-spacing: -0.05em;
  line-height: 1;
}

.stat-card__value span {
  color: #8a95a6;
  font-size: 12px;
  font-weight: 600;
}

.stat-card__hint {
  position: relative;
  z-index: 1;
  margin: 12px 0 0;
  color: #8a95a6;
  font-size: 11px;
  line-height: 1.5;
}

.stat-card__progress {
  position: relative;
  z-index: 1;
  margin-top: 16px;
}

.stat-card__progress-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.54);
  font-size: 10px;
}

.stat-card__progress-track {
  height: 5px;
  overflow: hidden;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.12);
}

.stat-card__progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #5f8cff 0%, #9ab7ff 100%);
  box-shadow: 0 0 12px rgba(111, 150, 255, 0.4);
  transition: width 700ms cubic-bezier(0.22, 1, 0.36, 1);
}

.stat-card--primary {
  border-color: #121c2b;
  background:
    radial-gradient(circle at 94% -12%, rgba(86, 132, 255, 0.5), transparent 40%),
    linear-gradient(150deg, #101a2a 0%, #0c1420 100%);
  box-shadow: 0 12px 30px rgba(13, 23, 39, 0.16);
}

.stat-card--primary::before {
  position: absolute;
  top: 28px;
  right: -30px;
  width: 126px;
  height: 126px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  content: '';
}

.stat-card--primary:hover {
  border-color: #1e3150;
  box-shadow: 0 22px 48px rgba(13, 23, 39, 0.25);
}

.stat-card--primary .stat-card__label {
  color: rgba(255, 255, 255, 0.58);
}

.stat-card--primary .stat-card__icon {
  color: #dbe7ff;
  background: rgba(255, 255, 255, 0.09);
}

.stat-card--primary .stat-card__value strong {
  color: #ffffff;
}

.stat-card--primary .stat-card__value span {
  color: rgba(255, 255, 255, 0.52);
}

.stat-card--primary .stat-card__hint {
  color: rgba(255, 255, 255, 0.42);
}

@keyframes stat-enter {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 720px) {
  .stat-card {
    min-height: 154px;
    padding: 18px;
  }

  .stat-card__value strong {
    font-size: 32px;
  }
}
</style>
