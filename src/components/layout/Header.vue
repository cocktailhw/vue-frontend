<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Search } from 'lucide-vue-next'
import { usePortalStore } from '../../stores/portal'

const portalStore = usePortalStore()
const { searchQuery } = storeToRefs(portalStore)

const fontStep = ref(0)

const gnbItems = [
  { label: '민원안내', href: '#minwon-quick' },
  { label: '시정소식', href: '#notice-board' },
  { label: '정보공개', href: '#notice-board' },
  { label: '시민참여', href: '#notice-board' },
  { label: '시청안내', href: '#footer' },
]

function adjustFont(delta) {
  fontStep.value = Math.min(2, Math.max(-1, fontStep.value + delta))
  document.documentElement.style.fontSize = `${16 + fontStep.value}px`
}

function resetFont() {
  fontStep.value = 0
  document.documentElement.style.fontSize = '16px'
}

function onSearch() {
  document.getElementById('notice-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-white print:static">
    <!-- Test banner -->
    <div class="border-b border-orange-800 bg-orange-700 text-white" role="status">
      <div class="mx-auto max-w-[1100px] px-4 py-1.5 text-center text-xs font-semibold">
        ⚠️ [시스템 테스트용] 본 사이트는 시스템 테스트 목적의 가상 포털입니다.
      </div>
    </div>

    <!-- Top utility strip -->
    <div class="h-8 border-b border-slate-300 bg-slate-100">
      <div class="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4 text-xs text-slate-600">
        <p>행복시청 공식 포털</p>
        <div class="flex items-center gap-0 divide-x divide-slate-300">
          <div class="flex items-center gap-1 px-2" aria-label="글자크기">
            <span class="text-slate-500">글자크기</span>
            <button type="button" class="border border-slate-300 bg-white px-1.5 py-0.5 hover:bg-slate-50" @click="resetFont">보통</button>
            <button type="button" class="border border-slate-300 bg-white px-1.5 py-0.5 hover:bg-slate-50" @click="adjustFont(1)">확대</button>
            <button type="button" class="border border-slate-300 bg-white px-1.5 py-0.5 hover:bg-slate-50" @click="adjustFont(-1)">축소</button>
          </div>
          <button type="button" class="px-2 hover:text-gov-blue">로그인</button>
          <button type="button" class="px-2 hover:text-gov-blue">회원가입</button>
          <button type="button" class="px-2 hover:text-gov-blue">사이트맵</button>
        </div>
      </div>
    </div>

    <!-- Main header zone -->
    <div class="border-b border-slate-300 bg-white">
      <div class="mx-auto flex h-20 max-w-[1100px] items-center gap-6 px-4">
        <RouterLink to="/" class="flex shrink-0 items-center gap-2">
          <span
            class="flex h-12 w-12 items-center justify-center border border-slate-800 bg-gov-navy text-xs font-bold text-white"
            aria-hidden="true"
          >
            문장
          </span>
          <span class="text-xl font-bold text-gov-navy">행복특별시</span>
        </RouterLink>

        <form class="flex min-w-0 flex-1 items-stretch" @submit.prevent="onSearch">
          <label class="sr-only" for="gnb-search">통합검색</label>
          <input
            id="gnb-search"
            v-model="searchQuery"
            type="search"
            placeholder="검색어를 입력하세요"
            class="min-w-0 flex-1 border border-slate-300 border-r-0 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-gov-blue"
          />
          <button
            type="submit"
            class="inline-flex items-center gap-1 border border-gov-blue bg-gov-blue px-4 text-sm font-semibold text-white hover:bg-gov-navy"
            aria-label="검색"
          >
            <Search :size="16" />
            검색
          </button>
        </form>
      </div>
    </div>

    <!-- GNB -->
    <nav class="border-b border-slate-800 bg-gov-navy" aria-label="주메뉴">
      <ul class="mx-auto flex max-w-[1100px] divide-x divide-slate-700 px-4 text-sm font-semibold text-white">
        <li v-for="item in gnbItems" :key="item.label" class="flex-1">
          <a
            :href="item.href"
            class="flex h-11 items-center justify-center hover:bg-slate-800"
          >
            {{ item.label }}
          </a>
        </li>
      </ul>
    </nav>
  </header>
</template>
