<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-100 text-[#333333]">
    <header class="border-b border-slate-800 bg-[#0F172A] text-white">
      <div class="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4">
        <h1 class="text-sm font-bold sm:text-base">행복시청 관리자 대시보드</h1>
        <RouterLink
          to="/"
          class="border border-white/40 px-3 py-1 text-xs font-semibold hover:bg-slate-800"
        >
          포털로 돌아가기
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-4 py-10">
      <div class="border border-slate-300 bg-white">
        <div class="border-b border-slate-300 bg-slate-800 px-4 py-3 text-white">
          <h2 class="text-base font-bold">백오피스</h2>
          <p class="mt-1 text-xs text-slate-300">관리자 전용 영역 (별도 레이아웃)</p>
        </div>
        <div class="flex min-h-[320px] items-center justify-center px-4 py-16 text-sm text-slate-600">
          페이지 준비중입니다.
        </div>
      </div>
    </main>
  </div>
</template>
