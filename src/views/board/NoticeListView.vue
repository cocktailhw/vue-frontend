<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-vue-next'
import { BOARD_TABS } from '../../data/minwonQuickLinks'
import { usePortalStore } from '../../stores/portal'
import NoticeDetailModal from '../../components/NoticeDetailModal.vue'

const LIST_PAGE_SIZE = 10

const portalStore = usePortalStore()
const { notices, searchQuery, activeBoardTab, pagination } = storeToRefs(portalStore)

const isLoading = ref(false)
const localKeyword = ref('')
const categoryFilter = ref('all')

const modalOpen = ref(false)
const selectedNotice = ref(null)
const modalList = ref([])

const categoryOptions = BOARD_TABS

const currentPage = computed(() => pagination.value.page + 1)
const pageSize = computed(() => pagination.value.size)
const totalElements = computed(() => pagination.value.totalElements)
const totalPages = computed(() => Math.max(1, pagination.value.totalPages))

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, 4, 5]
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total]
  return [current - 2, current - 1, current, current + 1, current + 2]
})

watch(activeBoardTab, (tab) => {
  categoryFilter.value = tab
})

async function reload(pageIndex = 0) {
  isLoading.value = true
  try {
    await portalStore.loadNotices(pageIndex, { size: LIST_PAGE_SIZE })
  } finally {
    isLoading.value = false
  }
}

function formatDate(value) {
  if (!value) return '—'
  const text = String(value)
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text
}

async function onSearch() {
  searchQuery.value = localKeyword.value.trim()
  portalStore.setBoardTab(categoryFilter.value)
  await reload(0)
}

async function onCategoryChange() {
  portalStore.setBoardTab(categoryFilter.value)
  await reload(0)
}

async function onReset() {
  localKeyword.value = ''
  categoryFilter.value = 'all'
  searchQuery.value = ''
  portalStore.setBoardTab('all')
  await reload(0)
}

function openNotice(notice) {
  modalList.value = notices.value
  if (notice.id && notices.value.some((n) => n.id === notice.id)) {
    portalStore.bumpViews(notice.id)
    selectedNotice.value = { ...(notices.value.find((n) => n.id === notice.id) || notice) }
  } else {
    selectedNotice.value = { ...notice }
  }
  modalOpen.value = true
}

function navigateNotice(notice) {
  openNotice(notice)
}

function closeModal() {
  modalOpen.value = false
  selectedNotice.value = null
  modalList.value = []
}

async function goPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  isLoading.value = true
  try {
    await portalStore.goToNoticePage(page)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  localKeyword.value = searchQuery.value
  categoryFilter.value = activeBoardTab.value || 'all'
  portalStore.setBoardTab(categoryFilter.value)
  await reload(0)
})
</script>

<template>
  <main class="mx-auto max-w-[1100px] px-4 py-8 text-[#333333]">
    <div class="mb-4 border-b-2 border-slate-800 pb-3">
      <h1 class="text-xl font-bold text-[#0F2942]">전체 공지사항</h1>
      <p class="mt-1 text-sm text-slate-600">시정 공지·고시공고·보도자료를 한곳에서 확인할 수 있습니다.</p>
    </div>

    <!-- 검색 · 필터 -->
    <section class="mb-4 border border-slate-200 bg-white p-4">
      <form class="flex flex-col gap-3 md:flex-row md:items-end" @submit.prevent="onSearch">
        <div class="min-w-0 flex-1">
          <label for="notice-keyword" class="mb-1 flex items-center gap-1 text-xs font-bold text-slate-700">
            <Search :size="14" class="text-slate-500" />
            검색어
          </label>
          <input
            id="notice-keyword"
            v-model="localKeyword"
            type="search"
            placeholder="제목, 부서, 내용 검색"
            class="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
          />
        </div>

        <div class="w-full md:w-44">
          <label for="notice-category" class="mb-1 flex items-center gap-1 text-xs font-bold text-slate-700">
            <Filter :size="14" class="text-slate-500" />
            분류
          </label>
          <select
            id="notice-category"
            v-model="categoryFilter"
            class="w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
            @change="onCategoryChange"
          >
            <option v-for="opt in categoryOptions" :key="opt.id" :value="opt.id">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="flex gap-2">
          <button
            type="submit"
            class="inline-flex items-center gap-1 rounded-sm border border-[#0F2942] bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Search :size="16" />
            검색
          </button>
          <button
            type="button"
            class="rounded-sm border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            @click="onReset"
          >
            초기화
          </button>
        </div>
      </form>

      <p v-if="searchQuery.trim()" class="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
        검색어 “{{ searchQuery.trim() }}” 결과
        <span class="font-semibold text-slate-800">{{ totalElements }}</span>건
        (페이지당 {{ pageSize }}건)
      </p>
    </section>

    <!-- 목록 테이블 -->
    <section class="border border-slate-200 bg-white">
      <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <h2 class="text-sm font-bold text-[#0F2942]">게시물 목록</h2>
        <p class="text-xs text-slate-500">총 {{ totalElements }}건</p>
      </div>

      <div v-if="isLoading" class="px-4 py-16 text-center text-sm text-slate-500">불러오는 중…</div>
      <div v-else-if="!notices.length" class="px-4 py-16 text-center text-sm text-slate-500">
        검색 조건에 맞는 게시물이 없습니다.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[44rem] table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col class="w-16" />
            <col class="w-28" />
            <col />
            <col class="w-32" />
            <col class="w-28" />
            <col class="w-20" />
          </colgroup>
          <thead>
            <tr class="border-t-2 border-b border-slate-800 bg-slate-800 text-xs text-white">
              <th class="px-3 py-3 text-center font-bold">번호</th>
              <th class="px-3 py-3 font-bold">분류</th>
              <th class="px-3 py-3 font-bold">제목</th>
              <th class="px-3 py-3 font-bold">담당부서</th>
              <th class="px-3 py-3 font-bold">작성일</th>
              <th class="px-3 py-3 text-center font-bold">조회</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in notices"
              :key="row.id"
              class="cursor-pointer border-b border-slate-200 hover:bg-slate-50"
              @click="openNotice(row)"
            >
              <td class="px-3 py-3 text-center text-slate-600">
                {{ totalElements - (currentPage - 1) * pageSize - idx }}
              </td>
              <td class="px-3 py-3">
                <span
                  class="inline-block max-w-full truncate rounded-sm border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700"
                >
                  {{ row.category }}
                </span>
              </td>
              <td class="px-3 py-3">
                <span class="block truncate font-medium text-[#0F2942]">{{ row.title }}</span>
              </td>
              <td class="truncate px-3 py-3 text-slate-600">{{ row.department }}</td>
              <td class="truncate px-3 py-3 text-slate-600">{{ formatDate(row.date) }}</td>
              <td class="px-3 py-3 text-center text-slate-600">{{ row.viewCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="!isLoading && totalElements > 0"
        class="flex items-center justify-center gap-1 border-t border-slate-200 bg-slate-50 px-3 py-3"
      >
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-slate-300 bg-white disabled:opacity-40"
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
          class="inline-flex h-8 min-w-8 items-center justify-center rounded-sm border px-2 text-xs font-semibold"
          :class="
            page === currentPage
              ? 'border-[#0F2942] bg-[#0F2942] text-white'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          "
          @click="goPage(page)"
        >
          {{ page }}
        </button>
        <button
          type="button"
          class="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-slate-300 bg-white disabled:opacity-40"
          :disabled="currentPage >= totalPages"
          aria-label="다음 페이지"
          @click="goPage(currentPage + 1)"
        >
          <ChevronRight :size="16" />
        </button>
      </div>
    </section>

    <NoticeDetailModal
      :open="modalOpen"
      :notice="selectedNotice"
      :list="modalList"
      :is-admin="false"
      @close="closeModal"
      @navigate="navigateNotice"
    />
  </main>
</template>
