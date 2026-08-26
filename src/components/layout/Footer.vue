<script setup>
import { MapPin, Phone, Mail } from 'lucide-vue-next'
</script>

<template>
  <footer class="mt-auto border-t border-border bg-navy text-slate-200">
    <div class="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-3">
      <div>
        <p class="text-base font-bold text-white">행복시청</p>
        <p class="mt-2 text-sm leading-relaxed text-slate-300">
          시민과 함께하는 열린 시정.<br />
          본 사이트는 시스템 테스트용 가상 포털입니다.
        </p>
      </div>
      <div class="space-y-2 text-sm">
        <p class="flex items-start gap-2">
          <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-point" />
          <span>행복시 중앙로 100 (행복시청)</span>
        </p>
        <p class="flex items-center gap-2">
          <Phone class="h-4 w-4 shrink-0 text-point" />
          <span>대표전화 1600-0000</span>
        </p>
        <p class="flex items-center gap-2">
          <Mail class="h-4 w-4 shrink-0 text-point" />
          <span>webmaster@haengbok.go.kr</span>
        </p>
      </div>
      <div class="text-sm text-slate-400 md:text-right">
        <p>이용약관 · 개인정보처리방침 · 저작권정책</p>
        <p class="mt-3">© Haengbok City Hall</p>
      </div>
    </div>
  </footer>
</template>
