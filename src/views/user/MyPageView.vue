<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { BadgeCheck, ClipboardList, Shield, UserRound } from 'lucide-vue-next'
import { usePortalStore } from '../../stores/portal'

const portalStore = usePortalStore()
const { currentUser, isAdmin } = storeToRefs(portalStore)

const displayName = computed(() => {
  const user = currentUser.value
  if (!user) return '—'
  return user.name || user.username || user.userId || user.loginId || '회원'
})

const roleLabel = computed(() => {
  if (isAdmin.value) return '관리자'
  const user = currentUser.value
  if (!user) return '일반회원'
  const role = String(user.role ?? user.userRole ?? user.authority ?? '').toUpperCase()
  if (role.includes('ADMIN')) return '관리자'
  if (role) return role
  return '일반회원'
})

const userId = computed(() => {
  const user = currentUser.value
  if (!user) return '—'
  return user.username || user.userId || user.loginId || user.id || '—'
})

const email = computed(() => currentUser.value?.email || '등록된 이메일이 없습니다.')

const myMinwonList = [
  {
    id: 'M-2026-0312',
    title: '전입신고 관련 문의',
    agency: '민원여권과',
    appliedAt: '2026-09-02',
    status: '완료',
  },
  {
    id: 'M-2026-0288',
    title: '건축물대장 열람 신청',
    agency: '건축과',
    appliedAt: '2026-08-28',
    status: '처리중',
  },
  {
    id: 'M-2026-0251',
    title: '지방세 납부 확인서 발급',
    agency: '세정과',
    appliedAt: '2026-08-20',
    status: '접수대기',
  },
]

function statusBadgeClass(status) {
  if (status === '완료') return 'border-emerald-700 bg-emerald-50 text-emerald-800'
  if (status === '처리중') return 'border-sky-700 bg-sky-50 text-sky-800'
  return 'border-amber-700 bg-amber-50 text-amber-900'
}
</script>

<template>
  <main class="mx-auto max-w-[1100px] px-4 py-8 text-[#333333]">
    <div class="mb-4 border-b-2 border-slate-800 pb-3">
      <h1 class="text-xl font-bold text-[#0F2942]">마이페이지</h1>
      <p class="mt-1 text-sm text-slate-600">로그인 계정 정보와 민원 신청 내역을 확인합니다.</p>
    </div>

    <!-- 프로필 카드 -->
    <section class="mb-6 rounded-sm border border-slate-200 bg-white">
      <div class="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <UserRound :size="18" class="text-slate-700" />
        <h2 class="text-sm font-bold text-[#0F2942]">내 프로필</h2>
      </div>

      <div class="grid gap-6 p-5 md:grid-cols-[auto_1fr]">
        <div
          class="flex h-20 w-20 items-center justify-center rounded-sm border border-slate-300 bg-slate-100 text-slate-600"
          aria-hidden="true"
        >
          <UserRound :size="36" stroke-width="1.5" />
        </div>

        <dl class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2.5">
            <dt class="text-xs font-semibold text-slate-500">이름 / 표시명</dt>
            <dd class="mt-1 text-sm font-bold text-slate-800">{{ displayName }}</dd>
          </div>
          <div class="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2.5">
            <dt class="text-xs font-semibold text-slate-500">아이디</dt>
            <dd class="mt-1 text-sm font-bold text-slate-800">{{ userId }}</dd>
          </div>
          <div class="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2.5">
            <dt class="flex items-center gap-1 text-xs font-semibold text-slate-500">
              <Shield :size="12" />
              권한
            </dt>
            <dd class="mt-1">
              <span
                class="inline-flex items-center gap-1 rounded-sm border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700"
              >
                <BadgeCheck :size="12" class="text-slate-600" />
                {{ roleLabel }}
              </span>
            </dd>
          </div>
          <div class="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2.5">
            <dt class="text-xs font-semibold text-slate-500">이메일</dt>
            <dd class="mt-1 truncate text-sm text-slate-700">{{ email }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- 민원 신청 내역 (Mock) -->
    <section class="rounded-sm border border-slate-200 bg-white">
      <div class="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <div class="flex items-center gap-2">
          <ClipboardList :size="18" class="text-slate-700" />
          <h2 class="text-sm font-bold text-[#0F2942]">나의 민원 신청 내역</h2>
        </div>
        <p class="text-xs text-slate-500">※ 현재는 Mock 데이터입니다.</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[40rem] table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col class="w-32" />
            <col />
            <col class="w-28" />
            <col class="w-28" />
            <col class="w-24" />
          </colgroup>
          <thead>
            <tr class="border-t-2 border-b border-slate-800 bg-slate-800 text-xs text-white">
              <th class="px-3 py-3 font-bold">신청번호</th>
              <th class="px-3 py-3 font-bold">민원명</th>
              <th class="px-3 py-3 font-bold">담당부서</th>
              <th class="px-3 py-3 font-bold">신청일</th>
              <th class="px-3 py-3 text-center font-bold">처리상태</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in myMinwonList"
              :key="row.id"
              class="border-b border-slate-200 hover:bg-slate-50"
            >
              <td class="px-3 py-3 font-medium text-slate-700">{{ row.id }}</td>
              <td class="px-3 py-3 text-[#0F2942]">{{ row.title }}</td>
              <td class="px-3 py-3 text-slate-600">{{ row.agency }}</td>
              <td class="px-3 py-3 text-slate-600">{{ row.appliedAt }}</td>
              <td class="px-3 py-3 text-center">
                <span
                  class="inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold"
                  :class="statusBadgeClass(row.status)"
                >
                  {{ row.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
