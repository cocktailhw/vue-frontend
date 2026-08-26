<script setup>
import { ref } from 'vue'

const fontStep = ref(0)

function adjustFont(delta) {
  fontStep.value = Math.min(2, Math.max(-1, fontStep.value + delta))
  document.documentElement.style.fontSize = `${16 + fontStep.value}px`
}

function resetFont() {
  fontStep.value = 0
  document.documentElement.style.fontSize = '16px'
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-white shadow-sm print:static">
    <!-- Test alert -->
    <div class="bg-[#c2410c] text-white" role="status">
      <div class="mx-auto max-w-6xl px-4 py-2 text-center text-xs font-semibold sm:text-sm">
        ⚠️ [시스템 테스트용] 본 사이트는 시스템 테스트 목적의 가상 포털입니다.
      </div>
    </div>

    <!-- Utility bar -->
    <div class="border-b border-border bg-slate-50 print:hidden">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs text-slate-600">
        <p class="text-slate-500">행복시 공식 누리집</p>
        <div class="flex flex-wrap items-center gap-1">
          <button type="button" class="rounded px-2 py-1 hover:bg-white hover:text-navy">로그인</button>
          <span class="text-slate-300" aria-hidden="true">|</span>
          <button type="button" class="rounded px-2 py-1 hover:bg-white hover:text-navy">회원가입</button>
          <span class="text-slate-300" aria-hidden="true">|</span>
          <div class="flex items-center gap-1" aria-label="글자크기 조절">
            <span class="px-1 text-slate-500">글자크기</span>
            <button
              type="button"
              class="rounded border border-border bg-white px-2 py-0.5 font-semibold hover:border-point hover:text-point"
              aria-label="글자 작게"
              @click="adjustFont(-1)"
            >
              A-
            </button>
            <button
              type="button"
              class="rounded border border-border bg-white px-2 py-0.5 text-[11px] hover:border-point hover:text-point"
              aria-label="글자 기본"
              @click="resetFont"
            >
              기본
            </button>
            <button
              type="button"
              class="rounded border border-border bg-white px-2 py-0.5 text-sm font-semibold hover:border-point hover:text-point"
              aria-label="글자 크게"
              @click="adjustFont(1)"
            >
              A+
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Brand bar -->
    <div class="border-b border-border bg-navy">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <RouterLink to="/" class="flex min-w-0 items-center gap-3 text-white">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white/10 text-sm font-bold tracking-tight"
            aria-hidden="true"
          >
            행복
          </span>
          <span class="min-w-0">
            <span class="block truncate text-lg font-bold tracking-tight">행복시청</span>
            <span class="hidden truncate text-xs text-slate-300 sm:block">Haengbok City Hall</span>
          </span>
        </RouterLink>
        <nav class="hidden items-center gap-1 text-sm text-slate-200 md:flex" aria-label="주요 메뉴">
          <a href="#quick-services" class="rounded px-3 py-2 hover:bg-white/10 hover:text-white">주요서비스</a>
          <a href="#notice-board" class="rounded px-3 py-2 hover:bg-white/10 hover:text-white">알림마당</a>
          <a href="#minwon" class="rounded px-3 py-2 hover:bg-white/10 hover:text-white">민원안내</a>
        </nav>
      </div>
    </div>
  </header>
</template>
