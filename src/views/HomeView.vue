<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { usePortalStore } from '../stores/portal'
import NoticeDetailModal from '../components/NoticeDetailModal.vue'
import NoticeFormModal from '../components/NoticeFormModal.vue'
import MinwonDetailModal from '../components/MinwonDetailModal.vue'

const portalStore = usePortalStore()
const { notices, searchQuery, activeBoardTab, boardSectionTitle, isAdmin } = storeToRefs(portalStore)

const isLoading = ref(false)
const currentPage = ref(1)
const pageSize = 5

const modalOpen = ref(false)
const selectedNotice = ref(null)
const modalList = ref([])

const formOpen = ref(false)
const formMode = ref('create')
const editingNotice = ref(null)

const minwonOpen = ref(false)
const selectedMinwon = ref(null)

const toast = ref({ show: false, message: '' })
let toastTimer = null

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
    agency: '민원여권과',
    fee: '무료',
    documents: ['신분증(주민등록증·운전면허증 등)', '대리 신청 시 위임장 및 대리인 신분증'],
  },
  {
    id: 'tax',
    title: '지방세 납부',
    agency: '세정과',
    fee: '무료(납부세액 별도)',
    documents: ['납세고지서 또는 전자고지 확인', '본인 명의 결제수단'],
  },
  {
    id: 'building',
    title: '건축물대장',
    agency: '건축과',
    fee: '열람 무료 / 발급 유료',
    documents: ['신청서', '신분증', '이해관계 증빙서류(해당 시)'],
  },
  {
    id: 'rent',
    title: '대관신청',
    agency: '문화체육과',
    fee: '시설별 상이',
    documents: ['대관신청서', '신분증', '행사계획서(해당 시)'],
  },
  {
    id: 'move',
    title: '전입신고',
    agency: '민원여권과',
    fee: '무료',
    documents: ['신분증', '전입신고서', '세대주 확인 서류(해당 시)'],
  },
  {
    id: 'seal',
    title: '인감증명',
    agency: '민원여권과',
    fee: '1통 600원(기준)',
    documents: ['신분증', '인감증명 발급신청서', '대리 시 위임장'],
  },
]

const filteredNotices = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const tab = activeBoardTab.value
  return notices.value.filter((item) => {
    if (tab !== 'all' && item.category !== tab) return false
    if (!q) return true
    return (
      String(item.title).toLowerCase().includes(q) ||
      String(item.department).toLowerCase().includes(q) ||
      String(item.content).toLowerCase().includes(q)
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

watch([searchQuery, activeBoardTab], () => {
  currentPage.value = 1
})

watch(totalPages, (total) => {
  if (currentPage.value > total) currentPage.value = total
})

function showToast(message) {
  toast.value = { show: true, message }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value.show = false
  }, 2800)
}

function formatDate(value) {
  if (!value) return '—'
  const text = String(value)
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text
}

function onTabClick(tabId) {
  portalStore.setBoardTab(tabId)
}

function openNotice(notice, list = null) {
  const navList = list || filteredNotices.value
  modalList.value = navList
  if (notice.id && notices.value.some((n) => n.id === notice.id)) {
    portalStore.bumpViews(notice.id)
    selectedNotice.value = { ...(notices.value.find((n) => n.id === notice.id) || notice) }
  } else {
    selectedNotice.value = { ...notice }
  }
  modalOpen.value = true
}

function navigateNotice(notice) {
  openNotice(notice, modalList.value)
}

function closeModal() {
  modalOpen.value = false
  selectedNotice.value = null
  modalList.value = []
}

function openCreateForm() {
  formMode.value = 'create'
  editingNotice.value = null
  formOpen.value = true
}

function openEditForm(notice) {
  formMode.value = 'edit'
  editingNotice.value = notice
  formOpen.value = true
  modalOpen.value = false
}

function closeForm() {
  formOpen.value = false
  editingNotice.value = null
}

async function onFormSubmit(formData) {
  try {
    if (formMode.value === 'edit' && editingNotice.value?.id) {
      await portalStore.updateNotice(editingNotice.value.id, formData)
      showToast('게시물이 수정되었습니다.')
    } else {
      await portalStore.createNotice(formData)
      showToast('게시물이 등록되었습니다.')
    }
    closeForm()
    closeModal()
  } catch {
    window.alert('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
  }
}

async function onDeleteNotice(notice) {
  if (!confirm('정말 삭제하시겠습니까?')) return
  try {
    await portalStore.deleteNotice(notice.id)
    closeModal()
    showToast('게시물이 삭제되었습니다.')
  } catch {
    window.alert('삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.')
  }
}

function onRowEdit(event, row) {
  event.stopPropagation()
  openEditForm(row)
}

async function onRowDelete(event, row) {
  event.stopPropagation()
  await onDeleteNotice(row)
}

function openMinwon(item) {
  selectedMinwon.value = item
  minwonOpen.value = true
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
  <main class="mx-auto max-w-[1100px] px-4 py-6 text-[#333333]">
    <Transition name="toast">
      <div
        v-if="toast.show"
        class="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 border-2 border-[#0F2942] bg-[#0F2942] px-5 py-2.5 text-sm font-bold text-white shadow-lg"
        role="status"
      >
        {{ toast.message }}
      </div>
    </Transition>

    <div class="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <section id="notice-board" class="border border-slate-300 bg-white">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-slate-50 px-3 py-2">
          <h2 class="text-base font-bold text-[#0F2942]">{{ boardSectionTitle }}</h2>
          <div class="flex" role="tablist" aria-label="게시판 분류">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              role="tab"
              class="-ml-px border border-slate-300 px-2.5 py-1 text-xs font-semibold first:ml-0"
              :class="
                activeBoardTab === tab.id
                  ? 'relative z-[1] border-[#0F2942] bg-[#0F2942] text-white'
                  : 'bg-white text-[#333333] hover:bg-slate-50'
              "
              :aria-selected="activeBoardTab === tab.id"
              @click="onTabClick(tab.id)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div v-if="isAdmin" class="border-b border-slate-300 bg-white px-3 py-2">
          <button
            type="button"
            class="border border-[#0F2942] bg-[#0F2942] px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
            @click="openCreateForm"
          >
            글쓰기 (신규 등록)
          </button>
        </div>

        <p v-if="searchQuery.trim()" class="border-b border-slate-200 px-3 py-2 text-xs text-slate-600">
          검색어 “{{ searchQuery.trim() }}” 결과 {{ filteredNotices.length }}건
          (페이지당 {{ pageSize }}건)
        </p>

        <div v-if="isLoading" class="px-3 py-8 text-center text-sm text-slate-500">불러오는 중…</div>
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
              <col v-if="isAdmin" class="w-28" />
            </colgroup>
            <thead>
              <tr class="border-t-2 border-slate-800 border-b border-slate-300 bg-slate-100 text-xs">
                <th class="px-2 py-2.5 font-bold">번호</th>
                <th class="px-2 py-2.5 font-bold">분류</th>
                <th class="px-2 py-2.5 font-bold">제목</th>
                <th class="px-2 py-2.5 font-bold">담당부서</th>
                <th class="px-2 py-2.5 font-bold">작성일</th>
                <th class="px-2 py-2.5 font-bold">조회</th>
                <th v-if="isAdmin" class="px-2 py-2.5 font-bold">관리</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in pagedNotices"
                :key="row.id"
                class="cursor-pointer border-b border-slate-200 hover:bg-slate-50"
                @click="openNotice(row)"
              >
                <td class="px-2 py-2.5 text-center text-slate-600">
                  {{ filteredNotices.length - ((currentPage - 1) * pageSize + idx) }}
                </td>
                <td class="px-2 py-2.5">
                  <span class="inline-block max-w-full truncate rounded-none bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700">
                    {{ row.category }}
                  </span>
                </td>
                <td class="px-2 py-2.5">
                  <span class="block truncate font-medium text-[#0F2942]">{{ row.title }}</span>
                </td>
                <td class="truncate px-2 py-2.5 text-slate-600">{{ row.department }}</td>
                <td class="truncate px-2 py-2.5 text-slate-600">{{ formatDate(row.date) }}</td>
                <td class="px-2 py-2.5 text-center text-slate-600">{{ row.viewCount }}</td>
                <td v-if="isAdmin" class="px-2 py-2.5">
                  <div class="flex justify-center gap-1">
                    <button
                      type="button"
                      class="border border-[#0F2942] px-1.5 py-0.5 text-xs font-bold text-[#0F2942] hover:bg-slate-100"
                      @click="onRowEdit($event, row)"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      class="border border-red-700 px-1.5 py-0.5 text-xs font-bold text-red-700 hover:bg-red-50"
                      @click="onRowDelete($event, row)"
                    >
                      삭제
                    </button>
                  </div>
                </td>
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
            class="inline-flex h-7 w-7 items-center justify-center border border-slate-300 bg-white disabled:opacity-40"
            :disabled="currentPage <= 1"
            aria-label="이전 페이지"
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
                ? 'border-[#0F2942] bg-[#0F2942] text-white'
                : 'border-slate-300 bg-white text-[#333333] hover:bg-slate-50'
            "
            @click="goPage(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center border border-slate-300 bg-white disabled:opacity-40"
            :disabled="currentPage >= totalPages"
            aria-label="다음 페이지"
            @click="goPage(currentPage + 1)"
          >
            <ChevronRight :size="14" />
          </button>
        </div>
      </section>

      <aside id="minwon-quick" class="border border-slate-300 bg-white">
        <div class="border-b border-slate-300 bg-slate-50 px-3 py-2">
          <h2 class="text-base font-bold text-[#0F2942]">자주 찾는 민원</h2>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="item in quickLinks"
            :key="item.id"
            type="button"
            class="cursor-pointer border-b border-r border-slate-300 px-2 py-5 text-center text-sm font-semibold text-[#0F2942] hover:bg-slate-100"
            @click="openMinwon(item)"
          >
            {{ item.title }}
          </button>
        </div>
        <p class="border-t border-slate-300 px-3 py-2 text-xs text-slate-500">
          ※ 항목을 클릭하면 구비서류와 신청 안내를 확인할 수 있습니다.
        </p>
      </aside>
    </div>

    <NoticeDetailModal
      :open="modalOpen"
      :notice="selectedNotice"
      :list="modalList"
      :is-admin="isAdmin"
      @close="closeModal"
      @navigate="navigateNotice"
      @edit="openEditForm"
      @delete="onDeleteNotice"
    />
    <NoticeFormModal
      :open="formOpen"
      :mode="formMode"
      :notice="editingNotice"
      @close="closeForm"
      @submit="onFormSubmit"
    />
    <MinwonDetailModal
      :open="minwonOpen"
      :item="selectedMinwon"
      @close="minwonOpen = false"
    />
  </main>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 0.5rem);
}
</style>
