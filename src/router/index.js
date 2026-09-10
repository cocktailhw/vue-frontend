import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../components/layout/DefaultLayout.vue'
import HomeView from '../views/HomeView.vue'
import NoticeListView from '../views/board/NoticeListView.vue'
import MinwonGuideView from '../views/minwon/MinwonGuideView.vue'
import MyPageView from '../views/user/MyPageView.vue'
import AdminDashboardView from '../views/admin/AdminDashboardView.vue'
import { usePortalStore } from '../stores/portal'
import { useUiStore } from '../stores/ui'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView,
        },
        {
          path: 'notices',
          name: 'notices',
          component: NoticeListView,
        },
        {
          path: 'minwon',
          name: 'minwon',
          component: MinwonGuideView,
        },
        {
          path: 'mypage',
          name: 'mypage',
          component: MyPageView,
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboardView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash }
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const portalStore = usePortalStore()
  const uiStore = useUiStore()

  if (to.meta.requiresAuth || to.meta.requiresAdmin) {
    await portalStore.restoreAdminSession()
  }

  if (to.meta.requiresAuth && !portalStore.currentUser) {
    uiStore.showToast('로그인이 필요한 페이지입니다.', 'error')
    return { name: 'home' }
  }

  if (to.meta.requiresAdmin && !portalStore.isAdmin) {
    uiStore.showToast('관리자 권한이 필요합니다.', 'error')
    return { name: 'home' }
  }

  return true
})

export default router
