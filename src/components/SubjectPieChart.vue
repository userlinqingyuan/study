<template>
  <section class="surface-panel pie-panel" aria-labelledby="subject-pie-title">
    <div class="panel-header">
      <div>
        <span class="panel-kicker">科目分布</span>
        <h2 id="subject-pie-title" class="panel-title">学习时长占比</h2>
        <p class="panel-description">近 7 天各科目投入结构</p>
      </div>
      <span class="panel-count">{{ subjectTotals.length }} 个科目</span>
    </div>

    <div
      ref="chart"
      class="subject-chart"
      role="img"
      :aria-label="chartAriaLabel"
    ></div>

    <ul class="subject-legend" aria-label="各科目学习时长与占比">
      <li
        v-for="(subject, index) in subjectTotals"
        :key="subject.name"
        class="subject-legend__item"
        @mouseenter="highlightSubject(index)"
        @mouseleave="clearHighlight"
      >
        <span class="subject-legend__dot" :style="{ backgroundColor: subject.color }"></span>
        <span class="subject-legend__name">{{ subject.name }}</span>
        <span class="subject-legend__hours">{{ subject.hours }}h</span>
        <strong class="subject-legend__percent">{{ subject.percent }}%</strong>
      </li>
    </ul>

    <div class="pie-insight">
      <span>本周投入最多</span>
      <strong>{{ topSubject.name }}</strong>
      <span>{{ topSubject.hours }} 小时</span>
    </div>
  </section>
</template>

<script>
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { AriaComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([PieChart, TitleComponent, TooltipComponent, AriaComponent, CanvasRenderer])

export default {
  name: 'SubjectPieChart',
  props: {
    subjectTotals: {
      type: Array,
      required: true
    },
    totalHours: {
      type: Number,
      required: true
    },
    isDark: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      chart: null,
      resizeObserver: null
    }
  },
  computed: {
    topSubject() {
      return this.subjectTotals[0] || { name: '暂无', hours: 0 }
    },
    chartAriaLabel() {
      const summary = this.subjectTotals
        .map((subject) => `${subject.name} ${subject.percent}%`)
        .join('，')
      return `近 7 天各科目学习时长占比饼图，总学习 ${this.totalHours} 小时。${summary}`
    },
    chartPalette() {
      if (this.isDark) {
        return {
          title: '#edf2ea',
          subtitle: '#9aa89d',
          tooltipBg: '#232a24',
          tooltipBorder: '#3a463b',
          tooltipMuted: '#9aa89d',
          tooltipLabel: '#c7d2c9',
          tooltipValue: '#edf2ea',
          itemBorder: '#1b201c',
          emphasisShadow: 'rgba(0, 0, 0, 0.34)'
        }
      }

      return {
        title: '#111a27',
        subtitle: '#98a2b2',
        tooltipBg: '#101827',
        tooltipBorder: 'transparent',
        tooltipMuted: '#aebad0',
        tooltipLabel: '#cbd5e1',
        tooltipValue: '#ffffff',
        itemBorder: '#ffffff',
        emphasisShadow: 'rgba(16, 26, 42, 0.16)'
      }
    }
  },
  watch: {
    subjectTotals() {
      this.renderChart()
    },
    isDark() {
      // 主题切换后重新绘制中心标题、提示框、扇区描边和阴影。
      this.renderChart()
    }
  },
  mounted() {
    this.chart = echarts.init(this.$refs.chart)
    this.renderChart()
    this.observeSize()
  },
  beforeDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    window.removeEventListener('resize', this.resizeChart)
    if (this.chart) {
      this.chart.dispose()
    }
  },
  methods: {
    observeSize() {
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.chart) this.chart.resize()
        })
        this.resizeObserver.observe(this.$refs.chart)
        return
      }

      window.addEventListener('resize', this.resizeChart)
    },
    resizeChart() {
      if (this.chart) this.chart.resize()
    },
    highlightSubject(index) {
      if (!this.chart) return
      this.chart.dispatchAction({ type: 'downplay', seriesIndex: 0 })
      this.chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: index })
    },
    clearHighlight() {
      if (this.chart) this.chart.dispatchAction({ type: 'downplay', seriesIndex: 0 })
    },
    renderChart() {
      if (!this.chart) return
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const palette = this.chartPalette

      const option = {
        // 环形图以缩放方式入场，减少动态效果时关闭动画。
        animation: !reduceMotion,
        animationDuration: 950,
        animationEasing: 'cubicOut',
        animationType: 'scale',
        aria: {
          enabled: true,
          description: this.chartAriaLabel
        },
        title: {
          // 标题放在圆环中心，直接汇总近 7 天总学习时长。
          text: `${this.totalHours}`,
          subtext: '总学习时长 / 小时',
          left: 'center',
          top: '31%',
          itemGap: 7,
          textStyle: {
            color: palette.title,
            fontSize: 30,
            fontWeight: 720,
            fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif'
          },
          subtextStyle: {
            color: palette.subtitle,
            fontSize: 10,
            lineHeight: 16
          }
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: palette.tooltipBg,
          borderColor: palette.tooltipBorder,
          borderWidth: this.isDark ? 1 : 0,
          padding: [12, 14],
          textStyle: {
            color: palette.tooltipValue,
            fontSize: 12,
            fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif'
          },
          formatter: (params) => `
            <div style="margin-bottom:7px;color:${palette.tooltipMuted};font-size:11px;">${params.name}</div>
            <div style="display:flex;align-items:baseline;justify-content:space-between;gap:22px;">
              <span style="color:${palette.tooltipLabel};">学习时长</span>
              <strong style="font-size:15px;color:${palette.tooltipValue};">${params.value} 小时 · ${params.percent}%</strong>
            </div>
          `
        },
        series: [
          {
            name: '科目学习时长',
            type: 'pie',
            // 内外半径构成环形图，中心留给总时长，四周留白更从容。
            radius: ['54%', '74%'],
            center: ['50%', '43%'],
            minAngle: 7,
            padAngle: 2,
            avoidLabelOverlap: true,
            itemStyle: {
              borderColor: palette.itemBorder,
              borderWidth: 3,
              borderRadius: 7
            },
            label: { show: false },
            labelLine: { show: false },
            emphasis: {
              // 悬停扇区时放大并增加阴影，和图例高亮形成一致反馈。
              scale: true,
              scaleSize: 7,
              itemStyle: {
                shadowBlur: 22,
                shadowColor: palette.emphasisShadow
              }
            },
            data: this.subjectTotals.map((subject) => ({
              name: subject.name,
              value: subject.hours,
              itemStyle: { color: subject.color }
            }))
          }
        ]
      }

      this.chart.setOption(option, true)
    }
  }
}
</script>

<style>
.pie-panel {
  min-width: 0;
}

.panel-count {
  padding: 6px 10px;
  color: #7c879a;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid #ebeff5;
  border-radius: 999px;
  background: #fafbfd;
}

.subject-chart {
  width: 100%;
  height: 236px;
  margin-top: 3px;
}

.subject-legend {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.subject-legend__item {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 8px 9px;
  border-radius: 9px;
  transition: background 160ms ease, transform 160ms ease;
}

.subject-legend__item:hover {
  background: #f7f9fc;
  transform: translateX(2px);
}

.subject-legend__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.subject-legend__name {
  overflow: hidden;
  color: #606d80;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subject-legend__hours {
  color: #9ba5b5;
  font-size: 9px;
  white-space: nowrap;
}

.subject-legend__percent {
  color: #202b3a;
  font-size: 10px;
  font-weight: 650;
}

.pie-insight {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 10px 12px;
  color: #8d98a9;
  font-size: 10px;
  border-radius: 10px;
  background: #f7f9fc;
}

.pie-insight strong {
  color: #2f6bff;
  font-size: 10px;
  font-weight: 650;
}

.pie-insight span:last-child {
  margin-left: auto;
  color: #5e6b7e;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .subject-chart {
    height: 220px;
  }
}

@media (max-width: 600px) {
  .subject-chart {
    height: 232px;
  }
}
</style>
