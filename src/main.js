import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './utils/http'
import { usePortalStore } from './stores/portal'
import './style.css'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

setUnauthorizedHandler(() => {
  usePortalStore(pinia).logoutAdmin({ silent: true })
})

usePortalStore(pinia).restoreAdminSession()

app.mount('#app')
