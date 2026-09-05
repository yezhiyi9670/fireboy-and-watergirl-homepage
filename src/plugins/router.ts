import { ref, type Ref } from 'vue'
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
  { path: '/level_details/:game', redirect: to => '/level_details/' + to.params.game + '/map' },
  { path: '/level_details/:game/map', component: AppLevelDetails },
  { path: '/level_details/:game/gallery', component: AppLevelDetails },
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

function extractLevelDetailsGame(path: string): string | null {
  const m = /^\/level_details\/([^/]+)\/(?:map|gallery)$/.exec(path)
  return m ? m[1] : null
}

/**
 * The route that was displayed right before the current one.
 *
 * `window.history.state.back` cannot be used for this: it is only rewritten when
 * vue-router itself runs `pushState` (programmatic navigation / `<RouterLink>`),
 * while native `<a href="#...">` clicks are plain fragment navigations that clone
 * the previous entry's state without updating `.back`.
 *
 * Instead we mirror the last completed navigation here. Internal map/gallery tab
 * switches (same game, done via `replace`) are ignored so they don't overwrite the
 * actual origin page.
 */
export const previousRoutePath: Ref<string | null> = ref(null)
router.afterEach((to, from) => {
  const fromGame = extractLevelDetailsGame(from.path)
  const toGame = extractLevelDetailsGame(to.path)
  if(fromGame == null || fromGame !== toGame) {
    previousRoutePath.value = from.fullPath
  }
})

export default router
