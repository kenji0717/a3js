import DefaultTheme from 'vitepress/theme'
import A3Runner from './components/A3Runner.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('A3Runner', A3Runner)
  }
}
