<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Search } from 'lucide-vue-next'
import { usePortalStore } from '../../stores/portal'
import SitemapModal from '../SitemapModal.vue'
import AuthModal from '../AuthModal.vue'
import AdminLoginModal from '../AdminLoginModal.vue'

const router = useRouter()
const portalStore = usePortalStore()
const { searchQuery, fontScale, isAdmin, currentUser } = storeToRefs(portalStore)

const sitemapOpen = ref(false)
const authOpen = ref(false)
const authMode = ref('login')
const adminLoginOpen = ref(false)

const gnbItems = [
  { label: '민원안내', to: '/minwon' },
  { label: '시정소식', to: '/notices' },
  { label: '정보공개', to: '/notices' },
  { label: '시민참여', to: '/notices' },
  { label: '시청안내', to: '/' },
]

function setFont(percent) {
  portalStore.setFontScale(percent)
}

function openAuth(mode) {
  authMode.value = mode
  authOpen.value = true
}

function onAdminModeClick() {
  adminLoginOpen.value = true
}

async function onLogout() {
  await portalStore.logoutAdmin()
}

async function onSearch() {
  const q = String(searchQuery.value ?? '').trim()
  const query = q ? { q } : {}
  const onHome = router.currentRoute.value.name === 'home'
  const currentQ = String(router.currentRoute.value.query.q ?? '')

  if (!onHome) {
    await router.push({ name: 'home', query })
    return
  }

  if (currentQ === q) {
    await portalStore.loadNotices(0, { size: 5 })
  } else {
    await router.replace({ name: 'home', query })
  }

  requestAnimationFrame(() => {
    document.getElementById('notice-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function onSitemapSelect({ columnTitle }) {
  if (columnTitle === '민원안내') {
    router.push('/minwon')
    return
  }
  if (columnTitle === '시정소식' || columnTitle === '정보공개') {
    router.push('/notices')
    return
  }
  router.push('/')
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-white print:static">
    <div class="border-b border-orange-800 bg-orange-700 text-white" role="status">
      <div class="mx-auto max-w-[1100px] px-4 py-1.5 text-center text-xs font-semibold">
        ⚠️ [시스템 테스트용] 본 사이트는 시스템 테스트 목적의 가상 포털입니다.
      </div>
    </div>

    <div class="h-8 border-b border-slate-300 bg-slate-100">
      <div class="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4 text-xs text-slate-600">
        <p>행복시청 공식 포털</p>
        <div class="flex items-center gap-0 divide-x divide-slate-300">
          <div class="flex items-center gap-1 px-2" aria-label="글자크기">
            <span class="text-slate-500">글자크기</span>
            <button
              type="button"
              class="border px-1.5 py-0.5"
              :class="fontScale === 100 ? 'border-[#0F2942] bg-[#0F2942] text-white' : 'border-slate-300 bg-white hover:bg-slate-50'"
              @click="setFont(100)"
            >
              보통
            </button>
            <button
              type="button"
              class="border px-1.5 py-0.5"
              :class="fontScale === 115 ? 'border-[#0F2942] bg-[#0F2942] text-white' : 'border-slate-300 bg-white hover:bg-slate-50'"
              @click="setFont(115)"
            >
              확대
            </button>
            <button
              type="button"
              class="border px-1.5 py-0.5"
              :class="fontScale === 90 ? 'border-[#0F2942] bg-[#0F2942] text-white' : 'border-slate-300 bg-white hover:bg-slate-50'"
              @click="setFont(90)"
            >
              축소
            </button>
          </div>

          <!-- 로그인 상태: 마이페이지 · (관리자 대시보드) · 로그아웃 -->
          <template v-if="currentUser">
            <RouterLink
              to="/mypage"
              class="px-2 font-semibold text-slate-700 hover:text-[#1E3A8A]"
            >
              마이페이지
            </RouterLink>
            <RouterLink
              v-if="isAdmin"
              to="/admin"
              class="px-2 font-semibold text-slate-700 hover:text-[#1E3A8A]"
            >
              관리자 대시보드
            </RouterLink>
            <button
              type="button"
              class="px-2 font-semibold text-slate-700 hover:text-[#1E3A8A]"
              @click="onLogout"
            >
              로그아웃
            </button>
          </template>

          <!-- 비로그인: 관리자 모드 · 로그인 · 회원가입 -->
          <template v-else>
            <button
              type="button"
              class="px-2 font-bold text-slate-600 hover:text-[#1E3A8A]"
              @click="onAdminModeClick"
            >
              관리자 모드
            </button>
            <button type="button" class="px-2 hover:text-[#1E3A8A]" @click="openAuth('login')">
              로그인
            </button>
            <button type="button" class="px-2 hover:text-[#1E3A8A]" @click="openAuth('signup')">
              회원가입
            </button>
          </template>

          <button type="button" class="px-2 hover:text-[#1E3A8A]" @click="sitemapOpen = true">
            사이트맵
          </button>
        </div>
      </div>
    </div>

    <div class="border-b border-slate-300 bg-white">
      <div class="mx-auto flex h-20 max-w-[1100px] items-center gap-6 px-4">
        <RouterLink to="/" class="flex shrink-0 items-center gap-2">
          <span
            class="flex h-12 w-12 items-center justify-center border border-slate-800 bg-[#0F2942] text-xs font-bold text-white"
            aria-hidden="true"
          >
            문장
          </span>
          <span class="text-xl font-bold text-[#0F172A]">행복특별시</span>
        </RouterLink>

        <form class="flex min-w-0 flex-1 items-stretch" @submit.prevent="onSearch">
          <label class="sr-only" for="gnb-search">통합검색</label>
          <input
            id="gnb-search"
            v-model="searchQuery"
            type="search"
            placeholder="검색어를 입력하세요"
            class="min-w-0 flex-1 border border-r-0 border-slate-300 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
          />
          <button
            type="submit"
            class="inline-flex items-center gap-1 border border-[#1E3A8A] bg-[#1E3A8A] px-4 text-sm font-semibold text-white hover:bg-[#0F2942]"
          >
            <Search :size="16" />
            검색
          </button>
        </form>
      </div>
    </div>

    <nav class="border-b border-slate-800 bg-[#0F172A]" aria-label="주메뉴">
      <ul class="mx-auto flex max-w-[1100px] divide-x divide-slate-700 px-4 text-sm font-semibold text-white">
        <li v-for="item in gnbItems" :key="item.label" class="flex-1">
          <RouterLink
            :to="item.to"
            class="flex h-11 w-full items-center justify-center hover:bg-slate-800"
            :active-class="item.to === '/' ? '' : 'bg-slate-800 underline decoration-2 underline-offset-4'"
            exact-active-class="bg-slate-800 underline decoration-2 underline-offset-4"
          >
            {{ item.label }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <SitemapModal :open="sitemapOpen" @close="sitemapOpen = false" @select="onSitemapSelect" />
    <AuthModal :open="authOpen" :mode="authMode" @close="authOpen = false" />
    <AdminLoginModal :open="adminLoginOpen" @close="adminLoginOpen = false" />
  </header>
</template>
