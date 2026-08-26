<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Search } from 'lucide-vue-next'
import { usePortalStore } from '../../stores/portal'
import SitemapModal from '../SitemapModal.vue'
import AuthModal from '../AuthModal.vue'

const portalStore = usePortalStore()
const { searchQuery, activeGnb, fontScale, isAdmin } = storeToRefs(portalStore)

const sitemapOpen = ref(false)
const authOpen = ref(false)
const authMode = ref('login')

const gnbItems = [
  { label: '민원안내' },
  { label: '시정소식' },
  { label: '정보공개' },
  { label: '시민참여' },
  { label: '시청안내' },
]

function setFont(percent) {
  portalStore.setFontScale(percent)
}

function openAuth(mode) {
  authMode.value = mode
  authOpen.value = true
}

function onSearch() {
  document.getElementById('notice-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onGnbClick(label) {
  portalStore.selectGnb(label)
}

function onSitemapSelect({ columnTitle }) {
  if (columnTitle === '민원안내') portalStore.selectGnb('민원안내')
  else if (columnTitle === '시정소식') portalStore.selectGnb('시정소식')
  else if (columnTitle === '정보공개') portalStore.selectGnb('정보공개')
  else portalStore.selectGnb('시청안내')
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
          <button
            type="button"
            class="px-2 font-bold"
            :class="isAdmin ? 'text-orange-700' : 'text-slate-600 hover:text-[#1E3A8A]'"
            @click="portalStore.toggleAdmin()"
          >
            관리자 모드 {{ isAdmin ? 'On' : 'Off' }}
          </button>
          <button type="button" class="px-2 hover:text-[#1E3A8A]" @click="openAuth('login')">로그인</button>
          <button type="button" class="px-2 hover:text-[#1E3A8A]" @click="openAuth('signup')">회원가입</button>
          <button type="button" class="px-2 hover:text-[#1E3A8A]" @click="sitemapOpen = true">사이트맵</button>
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
          <button
            type="button"
            class="flex h-11 w-full items-center justify-center hover:bg-slate-800"
            :class="activeGnb === item.label ? 'bg-slate-800 underline decoration-2 underline-offset-4' : ''"
            @click="onGnbClick(item.label)"
          >
            {{ item.label }}
          </button>
        </li>
      </ul>
    </nav>

    <SitemapModal :open="sitemapOpen" @close="sitemapOpen = false" @select="onSitemapSelect" />
    <AuthModal :open="authOpen" :mode="authMode" @close="authOpen = false" />
  </header>
</template>
