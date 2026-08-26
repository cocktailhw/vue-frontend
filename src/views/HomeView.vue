<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  Search,
  Megaphone,
  FileText,
  Newspaper,
  Building2,
  MessageCircleHeart,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-vue-next'
import { usePortalStore } from '../stores/portal'
import NoticeDetailModal from '../components/NoticeDetailModal.vue'

const portalStore = usePortalStore()
const { notices } = storeToRefs(portalStore)

const isLoading = ref(false)
const error = ref('')
const searchQuery = ref('')
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = 5

const modalOpen = ref(false)
const selectedNotice = ref(null)

const tabs = [
  { id: 'all', label: '전체' },
  { id: '공지사항', label: '공지사항' },
  { id: '보도자료', label: '보도자료' },
  { id: '고시공고', label: '고시공고' },
]

const quickServices = [
  { id: 'notice', label: '주요 공지사항', desc: '알림마당 바로가기', icon: Megaphone, tab: '공지사항' },
  { id: 'forms', label: '민원 서식 안내', desc: '자주 찾는 서식', icon: FileText, target: 'minwon' },
  { id: 'news', label: '시정 소식 / 보도자료', desc: '시정 홍보자료', icon: Newspaper, tab: '보도자료' },
  { id: 'org', label: '청사 / 조직도 안내', desc: '부서·위치 안내', icon: Building2, noticeId: 'org' },
  { id: 'praise', label: '칭찬합시다 / 시민소통', desc: '시민 의견 제안', icon: MessageCircleHeart, noticeId: 'praise' },
]

const minwonCards = [
  {
    id: 'tax',
    title: '지방세 납부 안내',
    department: '세무과',
    summary: '재산세·자동차세 등 납부 일정과 납부 방법을 안내합니다.',
    category: '공지사항',
    date: '2026-08-20',
    viewCount: 0,
    content:
      '지방세는 위택스(Wetax) 또는 은행 앱에서 납부할 수 있습니다. 납부기한 경과 시 가산금이 부과됩니다.',
    attachment: '지방세_납부안내.pdf',
  },
  {
    id: 'id-copy',
    title: '주민등록표 등본 발급 안내',
    department: '민원여권과',
    summary: '정부24 및 무인발급기를 통한 등·초본 발급 방법을 안내합니다.',
    category: '공지사항',
    date: '2026-08-10',
    viewCount: 0,
    content:
      '주민등록표 등·초본은 정부24에서 본인인증 후 즉시 발급 가능합니다. 방문 발급은 신분증을 지참해 주세요.',
    attachment: '주민등록_발급안내.pdf',
  },
  {
    id: 'move',
    title: '전입신고 절차 안내',
    department: '민원여권과',
    summary: '이사 후 14일 이내 전입신고가 필요합니다.',
    category: '공지사항',
    date: '2026-07-30',
    viewCount: 0,
    content:
      '전입신고는 정부24 또는 관할 행정복지센터에서 가능합니다. 기한 내 미신고 시 과태료가 부과될 수 있습니다.',
    attachment: null,
  },
]

const orgNotice = {
  id: 'org',
  title: '행복시청 청사 및 조직도 안내',
  category: '공지사항',
  department: '총무과',
  date: '2026-08-01',
  viewCount: 120,
  content:
    '행복시청 본청은 행복시 중앙로 100에 위치합니다. 주요 부서 안내와 층별 배치는 청사 안내도를 참고해 주세요.\n\n- 1층: 민원여권과, 민원실\n- 2층: 세무과, 회계과\n- 3층: 정책기획과, 홍보담당관',
  attachment: '청사_조직도_안내.pdf',
}

const praiseNotice = {
  id: 'praise',
  title: '칭찬합시다 / 시민소통 안내',
  category: '공지사항',
  department: '소통협력과',
  date: '2026-08-01',
  viewCount: 88,
  content:
    '시정 관련 칭찬, 제안, 건의사항은 시민소통 창구를 통해 접수할 수 있습니다. 접수된 의견은 관련 부서 검토 후 답변드립니다.',
  attachment: null,
}

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

function categoryClass(category) {
  if (category === '보도자료') return 'bg-point-light text-point'
  if (category === '고시공고') return 'bg-amber-50 text-amber-800'
  return 'bg-slate-100 text-slate-700'
}

function openNotice(notice) {
  portalStore.bumpViews(notice.id)
  const latest = notices.value.find((n) => n.id === notice.id) || notice
  selectedNotice.value = { ...latest }
  modalOpen.value = true
}

function openStatic(notice) {
  selectedNotice.value = { ...notice }
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  selectedNotice.value = null
}

function onQuickService(item) {
  if (item.tab) {
    activeTab.value = item.tab
    document.getElementById('notice-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  if (item.target === 'minwon') {
    document.getElementById('minwon')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  if (item.noticeId === 'org') openStatic(orgNotice)
  if (item.noticeId === 'praise') openStatic(praiseNotice)
}

function goPage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

async function loadData() {
  isLoading.value = true
  error.value = ''
  try {
    await portalStore.loadNotices()
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <!-- Search banner -->
    <section class="border-b border-border bg-white">
      <div class="mx-auto max-w-6xl px-4 py-8">
        <h1 class="text-[1.125rem] font-bold text-navy">행복시청 통합 검색</h1>
        <p class="mt-1 text-sm text-slate-500">공지사항, 보도자료, 고시공고를 한곳에서 찾아보세요.</p>
        <form class="mt-4 flex gap-2" @submit.prevent>
          <label class="sr-only" for="board-search">게시판 검색</label>
          <div class="flex min-w-0 flex-1 items-center gap-2 rounded border border-border bg-slate-50 px-3">
            <Search class="h-4 w-4 shrink-0 text-point" />
            <input
              id="board-search"
              v-model="searchQuery"
              type="search"
              placeholder="제목, 담당부서, 분류로 검색"
              class="w-full border-0 bg-transparent py-3 text-sm text-ink placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            class="shrink-0 rounded bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-dark"
          >
            검색
          </button>
        </form>
        <p v-if="searchQuery.trim()" class="mt-2 text-sm text-slate-500">
          “{{ searchQuery.trim() }}” 검색 결과 {{ filteredNotices.length }}건
        </p>
      </div>
    </section>

    <div class="mx-auto max-w-6xl px-4 py-8">
      <!-- Quick services -->
      <section id="quick-services" class="mb-8">
        <h2 class="mb-3 text-[1.125rem] font-bold text-navy">주요 서비스</h2>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <button
            v-for="item in quickServices"
            :key="item.id"
            type="button"
            class="flex flex-col items-start gap-2 rounded border border-border bg-white p-4 text-left shadow-sm transition hover:border-point hover:bg-point-light/40"
            @click="onQuickService(item)"
          >
            <span class="inline-flex h-9 w-9 items-center justify-center rounded bg-point-light text-point">
              <component :is="item.icon" :size="18" />
            </span>
            <span class="truncate text-sm font-bold text-navy">{{ item.label }}</span>
            <span class="truncate text-xs text-slate-500">{{ item.desc }}</span>
          </button>
        </div>
      </section>

      <div
        v-if="error && !isLoading"
        class="mb-6 flex flex-col gap-3 rounded border border-red-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        role="alert"
      >
        <p class="flex items-center gap-2 text-sm text-red-700">
          <AlertCircle :size="16" />
          게시판을 불러오지 못했습니다. 테스트 데이터로 표시합니다.
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded border border-border px-3 py-1.5 text-sm font-semibold text-navy"
          @click="loadData"
        >
          <RefreshCw :size="14" /> 다시 시도
        </button>
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <!-- Notice table -->
        <section id="notice-board" class="rounded border border-border bg-white shadow-sm">
          <div class="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-[1.125rem] font-bold text-navy">알림마당</h2>
            <div class="flex flex-wrap gap-1" role="tablist" aria-label="게시판 분류">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                role="tab"
                class="rounded px-3 py-1.5 text-sm font-semibold transition"
                :class="
                  activeTab === tab.id
                    ? 'bg-navy text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-point-light hover:text-point'
                "
                :aria-selected="activeTab === tab.id"
                @click="activeTab = tab.id"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div v-if="isLoading" class="space-y-3 p-4" aria-busy="true">
            <div v-for="n in 5" :key="n" class="h-10 animate-pulse rounded bg-slate-100" />
          </div>

          <div v-else-if="!pagedNotices.length" class="px-4 py-12 text-center text-sm text-slate-500">
            검색 조건에 맞는 게시물이 없습니다.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[40rem] table-fixed text-left text-sm">
              <colgroup>
                <col class="w-14" />
                <col class="w-24" />
                <col />
                <col class="w-28" />
                <col class="w-24" />
                <col class="w-16" />
              </colgroup>
              <thead>
                <tr class="border-b border-border bg-slate-50 text-xs text-slate-500">
                  <th class="px-3 py-2.5 font-semibold">번호</th>
                  <th class="px-3 py-2.5 font-semibold">분류</th>
                  <th class="px-3 py-2.5 font-semibold">제목</th>
                  <th class="px-3 py-2.5 font-semibold">담당부서</th>
                  <th class="px-3 py-2.5 font-semibold">작성일</th>
                  <th class="px-3 py-2.5 font-semibold">조회수</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in pagedNotices"
                  :key="row.id"
                  class="cursor-pointer border-b border-border/80 hover:bg-slate-50"
                  @click="openNotice(row)"
                >
                  <td class="px-3 py-3 text-slate-500">
                    {{ filteredNotices.length - ((currentPage - 1) * pageSize + idx) }}
                  </td>
                  <td class="px-3 py-3">
                    <span
                      class="inline-block max-w-full truncate rounded px-2 py-0.5 text-xs font-semibold"
                      :class="categoryClass(row.category)"
                    >
                      {{ row.category }}
                    </span>
                  </td>
                  <td class="px-3 py-3">
                    <span class="block truncate font-medium text-navy">{{ row.title }}</span>
                  </td>
                  <td class="truncate px-3 py-3 text-slate-500">{{ row.department }}</td>
                  <td class="truncate px-3 py-3 text-slate-500">{{ formatDate(row.date) }}</td>
                  <td class="px-3 py-3 text-slate-500">{{ row.viewCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div
            v-if="!isLoading && filteredNotices.length"
            class="flex items-center justify-center gap-1 border-t border-border px-4 py-3"
          >
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              :disabled="currentPage <= 1"
              aria-label="이전 페이지"
              @click="goPage(currentPage - 1)"
            >
              <ChevronLeft :size="16" />
            </button>
            <button
              v-for="page in pageNumbers"
              :key="page"
              type="button"
              class="inline-flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm font-semibold"
              :class="
                page === currentPage
                  ? 'bg-navy text-white'
                  : 'border border-border text-slate-600 hover:bg-slate-50'
              "
              @click="goPage(page)"
            >
              {{ page }}
            </button>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded border border-border text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              :disabled="currentPage >= totalPages"
              aria-label="다음 페이지"
              @click="goPage(currentPage + 1)"
            >
              <ChevronRight :size="16" />
            </button>
          </div>
        </section>

        <!-- Minwon side panel -->
        <aside id="minwon" class="space-y-3">
          <h2 class="text-[1.125rem] font-bold text-navy">자주 찾는 민원</h2>
          <button
            v-for="card in minwonCards"
            :key="card.id"
            type="button"
            class="block w-full rounded border border-border bg-white p-4 text-left shadow-sm transition hover:border-point"
            @click="openStatic(card)"
          >
            <p class="truncate text-sm font-bold text-navy">{{ card.title }}</p>
            <p class="mt-1 truncate text-xs text-slate-500">{{ card.department }}</p>
            <p class="mt-2 line-clamp-2 text-sm text-slate-600">{{ card.summary }}</p>
          </button>
        </aside>
      </div>
    </div>

    <NoticeDetailModal :open="modalOpen" :notice="selectedNotice" @close="closeModal" />
  </div>
</template>
