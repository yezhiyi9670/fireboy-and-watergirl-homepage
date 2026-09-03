import { createWebHashHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import AppHome from '../app-home/AppHome.vue'
import AppLevelDetails from '../app-level_details/AppLevelDetails.vue'
import AppNotFound from '../app-not_found/AppNotFound.vue'
import Branding from '../branding/Branding.ts'
import AppModificationNotes from '../app-home/AppModificationNotes.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: AppHome },
  { path: '/modification_notes', component: AppModificationNotes },
  { path: '/level_details/:game', component: AppLevelDetails },
  { path: '/:pathMatch(.*)*', meta: { title: '找不到页面 – ' + Branding.systemTitle }, component: AppNotFound },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from) => {
  if(to.meta.title && typeof to.meta.title == 'string') {
    document.title = to.meta.title
  }
})

export default router
