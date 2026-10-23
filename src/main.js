import Vue from 'vue'
import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/zh-CN'
import 'element-ui/lib/theme-chalk/index.css'
import '@/styles/global.css'
import App from './App.vue'

Vue.config.productionTip = false
Vue.use(ElementUI, { locale, size: 'medium' })

new Vue({
  render: (h) => h(App)
}).$mount('#app')
