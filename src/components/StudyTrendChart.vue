<template>
  <section class="surface-panel trend-panel" aria-labelledby="trend-title">
    <div class="panel-header">
      <div>
        <span class="panel-kicker">学习趋势</span>
        <h2 id="trend-title" class="panel-title">近 7 天学习时长</h2>
        <p class="panel-description">按天汇总所有科目的投入，点击节点可切换联动日期</p>
      </div>

      <div
        class="trend-highlight"
        :class="{ 'is-outside': isSelectedOutsideRange }"
        aria-live="polite"
      >
        <span class="trend-highlight__label">当前联动</span>
        <div class="trend-highlight__value">
          <strong>{{ selectedPoint.hours }}</strong>
          <span>小时</span>
        </div>
        <small>{{ selectedPoint.dateDisplay }} · {{ selectedPoint.weekdayLabel }}</small>
      </div>
    </div>

    <div
      ref="chart"
      class="trend-chart"
      role="img"
      :aria-label="chartAriaLabel"
    ></div>

    <div class="chart-footnote">
      <span class="chart-footnote__legend">
        <i aria-hidden="true"></i>
        每日学习总时长
      </span>
      <span>7 日均值 {{ dailyAverage }} 小时</span>
    </div>
  </section>
</template>

<script>
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  AriaComponent,
  GridComponent,
  MarkLineComponent,
  TooltipComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { formatMonthDay } from '@/data/studyData'

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  AriaComponent,
  CanvasRenderer
])

export default {
  name: 'StudyTrendChart',
  props: {
    trend: {
      type: Array,
      required: true
    },
    selectedDate: {
      type: String,
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
    selectedIndex() {
      // 返回 -1 表示当前选中的是范围外历史记录，不能回退到最后一天。
      return this.trend.findIndex((day) => day.date === this.selectedDate)
    },
    isSelectedOutsideRange() {
      return this.selectedIndex < 0
    },
    selectedPoint() {
      if (this.selectedIndex >= 0) return this.trend[this.selectedIndex]
      return {
        hours: '—',
        dateDisplay: formatMonthDay(this.selectedDate),
        weekdayLabel: '范围外历史记录'
      }
    },
    chartPalette() {
      if (this.isDark) {
        return {
          line: '#a9ca8b',
          lineStrong: '#c0dda5',
          selected: '#edf2ea',
          pointBorder: '#1b201c',
          axis: '#3a433b',
          label: '#9aa89d',
          grid: '#2a322b',
          averageLine: '#4a564b',
          tooltipBg: '#232a24',
          tooltipBorder: '#3a463b',
          tooltipMuted: '#9aa89d',
          tooltipLabel: '#c7d2c9',
          tooltipValue: '#edf2ea',
          markLine: 'rgba(169, 202, 139, 0.46)',
          lineShadow: 'rgba(169, 202, 139, 0.22)',
          areaTop: 'rgba(169, 202, 139, 0.30)',
          areaMid: 'rgba(169, 202, 139, 0.06)',
          areaBottom: 'rgba(169, 202, 139, 0)'
        }
      }

      return {
        line: '#2f6bff',
        lineStrong: '#2f6bff',
        selected: '#101827',
        pointBorder: '#ffffff',
        axis: '#e5eaf2',
        label: '#8c97a8',
        grid: '#edf1f6',
        averageLine: '#cdd5e1',
        tooltipBg: '#101827',
        tooltipBorder: 'transparent',
        tooltipMuted: '#aebad0',
        tooltipLabel: '#cbd5e1',
        tooltipValue: '#ffffff',
        markLine: 'rgba(47, 107, 255, 0.34)',
        lineShadow: 'rgba(47, 107, 255, 0.20)',
        areaTop: 'rgba(47, 107, 255, 0.22)',
        areaMid: 'rgba(47, 107, 255, 0.04)',
        areaBottom: 'rgba(47, 107, 255, 0)'
      }
    },
    dailyAverage() {
      const total = this.trend.reduce((sum, day) => sum + day.hours, 0)
      return this.trend.length ? (Math.round((total / this.trend.length) * 10) / 10).toFixed(1) : '0.0'
    },
    chartAriaLabel() {
      if (this.isSelectedOutsideRange) {
        return `近 7 天学习趋势折线图，当前选择范围外历史日期 ${this.selectedPoint.dateDisplay}，该记录不参与趋势统计`
      }
      return `近 7 天学习趋势折线图，当前高亮 ${this.selectedPoint.dateDisplay}，学习 ${this.selectedPoint.hours} 小时`
    }
  },
  watch: {
    selectedDate() {
      this.updateChart()
    },
    trend() {
      this.updateChart()
    },
    isDark() {
      // 主题变化会改变坐标轴、提示框和曲线配色，需要重新应用完整配置。
      this.updateChart()
    }
  },
  mounted() {
    this.chart = echarts.init(this.$refs.chart)
    this.updateChart(true)
    this.chart.on('click', this.handleChartClick)
    this.observeSize()
  },
  beforeDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    if (this.chart) {
      this.chart.off('click', this.handleChartClick)
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
    handleChartClick(params) {
      // 折线节点反向联动左侧高亮信息与学习记录。
      if (params.componentType !== 'series' || !this.trend[params.dataIndex]) return
      this.$emit('select-date', this.trend[params.dataIndex].date)
    },
    updateChart(initial = false) {
      if (!this.chart) return

      const selectedIndex = this.selectedIndex
      const selectedPoint = this.selectedPoint
      const averageValue = Number(this.dailyAverage)
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const palette = this.chartPalette

      // 只有选中最近 7 天内日期时才绘制垂直定位线。
      const markLineData = []
      if (selectedIndex >= 0) {
        markLineData.push({
          xAxis: selectedIndex,
          lineStyle: {
            color: palette.markLine,
            width: 1,
            type: 'dashed'
          },
          label: { show: false }
        })
      }
      markLineData.push({
        yAxis: averageValue,
        lineStyle: {
          color: palette.averageLine,
          width: 1,
          type: 'dashed'
        },
        label: { show: false }
      })

      const option = {
        // 入场时播放绘制动画；系统开启“减少动态效果”时直接展示最终状态。
        animation: !reduceMotion,
        animationDuration: initial ? 900 : 360,
        animationDurationUpdate: 360,
        animationEasing: 'cubicOut',
        // 为辅助技术生成图表摘要，并与图表容器的 aria-label 保持一致。
        aria: {
          enabled: true,
          description: this.chartAriaLabel
        },
        // 预留坐标轴和联动标签的空间，避免小屏下内容被裁切。
        grid: {
          top: 38,
          right: 18,
          bottom: 28,
          left: 8,
          containLabel: true
        },
        // 纵向轴触发提示框，悬停时能一次看到当天完整的学习摘要。
        tooltip: {
          trigger: 'axis',
          backgroundColor: palette.tooltipBg,
          borderColor: palette.tooltipBorder,
          borderWidth: this.isDark ? 1 : 0,
          padding: [12, 14],
          textStyle: {
            color: palette.tooltipValue,
            fontSize: 12,
            fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif'
          },
          axisPointer: {
            type: 'line',
            lineStyle: {
              color: palette.markLine,
              width: 1,
              type: 'dashed'
            }
          },
          formatter: (params) => {
            const point = this.trend[params[0].dataIndex]
            if (!point) return ''
            return `
              <div style="margin-bottom:7px;color:${palette.tooltipMuted};font-size:11px;">${point.fullLabel}</div>
              <div style="display:flex;align-items:baseline;justify-content:space-between;gap:22px;">
                <span style="color:${palette.tooltipLabel};">学习时长</span>
                <strong style="font-size:15px;color:${palette.tooltipValue};">${point.hours} 小时</strong>
              </div>
            `
          }
        },
        // 横轴使用最近 7 天的日期，折线从第一个点到最后一个点铺满宽度。
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.trend.map((day) => day.label),
          axisLine: {
            lineStyle: { color: palette.axis }
          },
          axisTick: { show: false },
          axisLabel: {
            color: palette.label,
            fontSize: 11,
            margin: 14
          }
        },
        // 纵轴始终从 0 开始，避免夸大不同日期之间的时长差异。
        yAxis: {
          type: 'value',
          min: 0,
          splitNumber: 4,
          axisLabel: {
            color: palette.label,
            fontSize: 10,
            formatter: '{value}h'
          },
          splitLine: {
            lineStyle: {
              color: palette.grid,
              type: 'dashed'
            }
          }
        },
        series: [
          {
            name: '学习时长',
            type: 'line',
            // 平滑曲线让趋势更易读，同时保留每日节点作为精确落点。
            smooth: 0.38,
            showSymbol: true,
            z: 3,
            data: this.trend.map((day, index) => ({
              value: day.hours,
              // 当前联动日期使用更大的深色节点，其他日期保持品牌蓝色。
              symbolSize: index === selectedIndex ? 13 : 7,
              itemStyle: {
                color: index === selectedIndex ? palette.selected : palette.line,
                borderColor: palette.pointBorder,
                borderWidth: index === selectedIndex ? 4 : 2.5,
                shadowBlur: index === selectedIndex ? 12 : 0,
                shadowColor: this.isDark
                  ? 'rgba(0, 0, 0, 0.3)'
                  : 'rgba(15, 24, 39, 0.22)'
              }
            })),
            lineStyle: {
              width: 3,
              color: palette.line,
              shadowBlur: 16,
              shadowColor: palette.lineShadow,
              shadowOffsetY: 8
            },
            itemStyle: {
              color: palette.line
            },
            areaStyle: {
              // 渐变面积强调趋势，并在底部自然淡出，避免遮挡坐标轴。
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: palette.areaTop },
                { offset: 0.72, color: palette.areaMid },
                { offset: 1, color: palette.areaBottom }
              ])
            },
            emphasis: {
              focus: 'series',
              scale: 1.2
            },
            markLine: {
              // 横线表示 7 日均值，竖线定位当前与表格联动的日期。
              silent: true,
              symbol: ['none', 'none'],
              data: markLineData
            }
          }
        ]
      }

      this.chart.setOption(option, initial)
    }
  }
}
</script>

<style>
.trend-panel {
  min-width: 0;
}

.trend-highlight {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: 1px 10px;
  min-width: 130px;
  padding: 12px 14px;
  border: 1px solid #e6edfa;
  border-radius: 13px;
  background: #f8faff;
}

.trend-highlight__label {
  grid-column: 1;
  color: #8b96a7;
  font-size: 10px;
  letter-spacing: 0.04em;
}

.trend-highlight__value {
  display: flex;
  grid-column: 1;
  align-items: baseline;
  gap: 4px;
}

.trend-highlight__value strong {
  color: #172235;
  font-size: 22px;
  font-weight: 720;
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.trend-highlight__value span {
  color: #8b96a7;
  font-size: 10px;
}

.trend-highlight small {
  grid-column: 2;
  grid-row: 1 / span 2;
  color: #2f6bff;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.trend-highlight.is-outside {
  border-color: #f1dfb5;
  background: #fff9eb;
}

.trend-highlight.is-outside small {
  color: #9a6b14;
}

.trend-chart {
  width: 100%;
  height: 286px;
  margin-top: 8px;
}

.chart-footnote {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  color: #96a0b0;
  font-size: 10px;
  border-top: 1px solid #f1f4f8;
}

.chart-footnote__legend {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.chart-footnote__legend i {
  display: inline-block;
  width: 14px;
  height: 3px;
  border-radius: 99px;
  background: #2f6bff;
}

@media (max-width: 600px) {
  .trend-highlight {
    min-width: 0;
    padding: 10px 12px;
  }

  .trend-highlight small {
    display: none;
  }

  .trend-chart {
    height: 250px;
  }

  .chart-footnote {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
}
</style>
