<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { usePortalStore } from '../stores/portal'
import NoticeDetailModal from '../components/NoticeDetailModal.vue'

const portalStore = usePortalStore()
const { notices, searchQuery } = storeToRefs(portalStore)

const isLoading = ref(false)
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = 8

const modalOpen = ref(false)
const selectedNotice = ref(null)

const tabs = [
  { id: 'all', label: '전체' },
  { id: '공지사항', label: '공지사항' },
  { id: '고시공고', label: '고시공고' },
  { id: '보도자료', label: '보도자료' },
]

const quickLinks = [
  {
    id: 'id-copy',
    title: '주민등록표 등본',
    notice: {
      id: 'q-id',
      title: '주민등록표 등본 발급 안내',
      category: '공지사항',
      department: '민원여권과',
      date: '2026-08-10',
      viewCount: 0,
      content: '정부24 또는 무인발급기에서 주민등록표 등·초본을 발급할 수 있습니다. 방문 발급 시 신분증을 지참해 주세요.',
      attachment: '주민등록_발급안내.pdf',
    },
  },
  {
    id: 'tax',
    title: '지방세 납부',
    notice: {
      id: 'q-tax',
      title: '지방세 납부 안내',
      category: '공지사항',
      department: '세무과',
      date: '2026-08-20',
      viewCount: 0,
      content: '지방세는 위택스(Wetax) 및 은행 앱에서 납부할 수 있습니다. 납부기한 경과 시 가산금이 부과될 수 있습니다.',
      attachment: '지방세_납부안내.pdf',
    },
  },
  {
    id: 'building',
    title: '건축물대장',
    notice: {
      id: 'q-building',
      title: '건축물대장 열람·발급 안내',
      category: '공지사항',
      department: '건축과',
      date: '2026-08-05',
      viewCount: 0,
      content: '건축물대장은 세움터 또는 민원실에서 열람·발급할 수 있습니다.',
      attachment: null,
    },
  },
  {
    id: 'rent',
    title: '대관신청',
    notice: {
      id: 'q-rent',
      title: '공공시설 대관신청 안내',
      category: '공지사항',
      department: '문화체육과',
      date: '2026-08-01',
      viewCount: 0,
      content: '시 소유 공공시설 대관은 온라인 예약 또는 담당 부서 문의 후 신청할 수 있습니다.',
      attachment: '공공시설_대관안내.pdf',
    },
  },
  {
    id: 'move',
    title: '전입신고',
    notice: {
      id: 'q-move',
      title: '전입신고 절차 안내',
      category: '공지사항',
      department: '민원여권과',
      date: '2026-07-30',
      viewCount: 0,
      content: '이사 후 14일 이내 전입신고를 해야 합니다. 정부24 또는 행정복지센터에서 신청 가능합니다.',
      attachment: null,
    },
  },
  {
    id: 'seal',
    title: '인감증명',
    notice: {
      id: 'q-seal',
      title: '인감증명서 발급 안내',
      category: '공지사항',
      department: '민원여권과',
      date: '2026-07-28',
      viewCount: 0,
      content: '인감증명서는 본인 또는 대리인이 신분증을 지참하여 민원실에서 발급받을 수 있습니다.',
      attachment: null,
    },
  },
]

const filteredNotices = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return notices.value.filter((item) => {
    if (activeTab.value !== 'all' && item.category !== activeTab.value) return false
    if (!q) return true
    return (
      String(item.title).toLowerCase().includes(q) ||
      String(item.department).toLowerCase().includes(q) ||
      String(item.category).toLowerCase().includes(q)
    )
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredNotices.value.length / pageSize)))

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 2) return [1, 2, 3]
  if (current >= total - 1) return [total - 2, total - 1, total]
  return [current - 1, current, current + 1]
})

const pagedNotices = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredNotices.value.slice(start, start + pageSize)
})

watch([searchQuery, activeTab], () => {
  currentPage.value = 1
})

watch(totalPages, (total) => {
  if (currentPage.value > total) currentPage.value = total
})

function formatDate(value) {
  if (!value) return '—'
  const text = String(value)
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text
}

function openNotice(notice) {
  if (notice.id && notices.value.some((n) => n.id === notice.id)) {
    portalStore.bumpViews(notice.id)
  }
  const latest = notices.value.find((n) => n.id === notice.id) || notice
  selectedNotice.value = { ...latest }
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  selectedNotice.value = null
}

function goPage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

async function loadData() {
  isLoading.value = true
  try {
    await portalStore.loadNotices()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <main class="mx-auto max-w-[1100px] px-4 py-6">
    <div class="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <!-- Notice board (60%) -->
      <section id="notice-board" class="border border-slate-300 bg-white">
        <div class="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-3 py-2">
          <h2 class="text-base font-bold text-gov-navy">알림마당</h2>
          <div class="flex" role="tablist" aria-label="게시판 분류">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              role="tab"
              class="border border-slate-300 px-2.5 py-1 text-xs font-semibold -ml-px first:ml-0"
              :class="
                activeTab === tab.id
                  ? 'relative z-[1] border-gov-navy bg-gov-navy text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              "
              :aria-selected="activeTab === tab.id"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div v-if="isLoading" class="px-3 py-8 text-center text-sm text-slate-500">
          불러오는 중…
        </div>

        <div v-else-if="!pagedNotices.length" class="px-3 py-10 text-center text-sm text-slate-500">
          검색 조건에 맞는 게시물이 없습니다.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[36rem] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col class="w-12" />
              <col class="w-20" />
              <col />
              <col class="w-24" />
              <col class="w-24" />
              <col class="w-14" />
            </colgroup>
            <thead>
              <tr class="border-t-2 border-slate-800 border-b border-slate-300 bg-slate-100 text-xs text-slate-700">
                <th class="px-2 py-2.5 font-bold">번호</th>
                <th class="px-2 py-2.5 font-bold">분류</th>
                <th class="px-2 py-2.5 font-bold">제목</th>
                <th class="px-2 py-2.5 font-bold">담당부서</th>
                <th class="px-2 py-2.5 font-bold">작성일</th>
                <th class="px-2 py-2.5 font-bold">조회</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in pagedNotices"
                :key="row.id"
                class="cursor-pointer border-b border-slate-200 hover:bg-slate-50"
                @click="openNotice(row)"
              >
                <td class="px-2 py-2.5 text-center text-slate-500">
                  {{ filteredNotices.length - ((currentPage - 1) * pageSize + idx) }}
                </td>
                <td class="px-2 py-2.5">
                  <span class="inline-block max-w-full truncate rounded-none bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700">
                    {{ row.category }}
                  </span>
                </td>
                <td class="px-2 py-2.5">
                  <span class="block truncate font-medium text-gov-navy">{{ row.title }}</span>
                </td>
                <td class="truncate px-2 py-2.5 text-slate-500">{{ row.department }}</td>
                <td class="truncate px-2 py-2.5 text-slate-500">{{ formatDate(row.date) }}</td>
                <td class="px-2 py-2.5 text-center text-slate-500">{{ row.viewCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="!isLoading && filteredNotices.length"
          class="flex items-center justify-center gap-1 border-t border-slate-300 bg-slate-50 px-3 py-2"
        >
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center border border-slate-300 bg-white text-slate-600 disabled:opacity-40"
            :disabled="currentPage <= 1"
            aria-label="이전"
            @click="goPage(currentPage - 1)"
          >
            <ChevronLeft :size="14" />
          </button>
          <button
            v-for="page in pageNumbers"
            :key="page"
            type="button"
            class="inline-flex h-7 min-w-7 items-center justify-center border px-2 text-xs font-semibold"
            :class="
              page === currentPage
                ? 'border-gov-navy bg-gov-navy text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            "
            @click="goPage(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center border border-slate-300 bg-white text-slate-600 disabled:opacity-40"
            :disabled="currentPage >= totalPages"
            aria-label="다음"
            @click="goPage(currentPage + 1)"
          >
            <ChevronRight :size="14" />
          </button>
        </div>
      </section>

      <!-- Quick civil shortcuts (40%) -->
      <aside id="minwon-quick" class="border border-slate-300 bg-white">
        <div class="border-b border-slate-300 bg-slate-50 px-3 py-2">
          <h2 class="text-base font-bold text-gov-navy">자주 찾는 민원</h2>
        </div>
        <div class="grid grid-cols-2 border-t border-slate-300 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="(item, index) in quickLinks"
            :key="item.id"
            type="button"
            class="border-b border-r border-slate-300 px-2 py-5 text-center text-sm font-semibold text-gov-navy hover:bg-slate-50"
            :class="{
              'border-r-0': (index + 1) % 3 === 0,
            }"
            @click="openNotice(item.notice)"
          >
            {{ item.title }}
          </button>
        </div>
        <p class="border-t border-slate-300 px-3 py-2 text-xs text-slate-500">
          ※ 항목을 선택하면 안내 내용을 확인할 수 있습니다.
        </p>
      </aside>
    </div>

    <NoticeDetailModal :open="modalOpen" :notice="selectedNotice" @close="closeModal" />
  </main>
</template>
