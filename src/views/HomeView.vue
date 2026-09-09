<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Landmark,
  Pencil,
  Plus,
  Stamp,
  Trash2,
  Wallet,
} from 'lucide-vue-next'
import { BOARD_TABS, MINWON_QUICK_LINKS } from '../data/minwonQuickLinks'
import { usePortalStore } from '../stores/portal'
import NoticeDetailModal from '../components/NoticeDetailModal.vue'
import NoticeFormModal from '../components/NoticeFormModal.vue'
import MinwonDetailModal from '../components/MinwonDetailModal.vue'

const portalStore = usePortalStore()
const { notices, searchQuery, activeBoardTab, boardSectionTitle, isAdmin, flashToast, pagination } =
  storeToRefs(portalStore)

const isLoading = ref(false)

const modalOpen = ref(false)
const selectedNotice = ref(null)
const modalList = ref([])

const formOpen = ref(false)
const formMode = ref('create')
const editingNotice = ref(null)
const isSubmitting = ref(false)

const minwonOpen = ref(false)
const selectedMinwon = ref(null)

const toast = ref({ show: false, message: '' })
let toastTimer = null

const tabs = BOARD_TABS
const quickLinks = MINWON_QUICK_LINKS

const minwonIcons = {
  'id-copy': FileText,
  tax: Wallet,
  building: Building2,
  rent: Landmark,
  move: Home,
  seal: Stamp,
}

const currentPage = computed(() => pagination.value.page + 1)
const pageSize = computed(() => pagination.value.size)
const totalElements = computed(() => pagination.value.totalElements)
const totalPages = computed(() => Math.max(1, pagination.value.totalPages))

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 2) return [1, 2, 3]
  if (current >= total - 1) return [total - 2, total - 1, total]
  return [current - 1, current, current + 1]
})

watch(activeBoardTab, () => {
  reloadNotices()
})

async function reloadNotices() {
  isLoading.value = true
  try {
    await portalStore.loadNotices(0)
  } finally {
    isLoading.value = false
  }
}

function showToast(message) {
  toast.value = { show: true, message }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value.show = false
  }, 2800)
}

watch(flashToast, (message) => {
  if (!message) return
  showToast(message)
  portalStore.clearFlashToast()
})

function formatDate(value) {
  if (!value) return '—'
  const text = String(value)
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text
}

function categoryBadgeClass(category) {
  switch (category) {
    case '보도자료':
      return 'bg-violet-50 text-violet-600'
    case '고시공고':
      return 'bg-amber-50 text-amber-700'
    case '공지사항':
      return 'bg-blue-50 text-blue-600'
    default:
      return 'bg-slate-50 text-slate-600'
  }
}

function onTabClick(tabId) {
  portalStore.setBoardTab(tabId)
}

function openNotice(notice, list = null) {
  const navList = list || notices.value
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
  if (isSubmitting.value) return
  formOpen.value = false
  editingNotice.value = null
}

async function onFormSubmit(formData) {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    if (formMode.value === 'edit' && editingNotice.value?.id) {
      await portalStore.updateNotice(editingNotice.value.id, formData)
      showToast('게시물이 수정되었습니다.')
    } else {
      await portalStore.createNotice(formData)
      showToast('게시물이 등록되었습니다.')
    }
    formOpen.value = false
    editingNotice.value = null
    closeModal()
  } catch {
    window.alert('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
  } finally {
    isSubmitting.value = false
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

async function goPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  isLoading.value = true
  try {
    await portalStore.goToNoticePage(page)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  reloadNotices()
})

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<template>
  <main class="mx-auto max-w-[1100px] px-4 py-8 text-slate-700">
    <Transition name="toast">
      <div
        v-if="toast.show"
        class="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
        role="status"
      >
        {{ toast.message }}
      </div>
    </Transition>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <!-- Notice board -->
      <section id="notice-board" class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <p class="text-xs font-medium tracking-wide text-slate-400">알림마당</p>
            <h2 class="mt-0.5 text-lg font-bold text-slate-900">{{ boardSectionTitle }}</h2>
          </div>
          <div class="flex flex-wrap gap-1 rounded-full bg-slate-50 p-1" role="tablist" aria-label="게시판 분류">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              role="tab"
              class="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
              :class="
                activeBoardTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-white hover:text-slate-800'
              "
              :aria-selected="activeBoardTab === tab.id"
              @click="onTabClick(tab.id)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div v-if="isAdmin" class="border-b border-gray-100 px-5 py-3">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            @click="openCreateForm"
          >
            <Plus :size="16" />
            글쓰기
          </button>
        </div>

        <p v-if="searchQuery.trim()" class="border-b border-gray-100 px-5 py-2.5 text-xs text-slate-500">
          검색어 “{{ searchQuery.trim() }}” 결과
          <span class="font-semibold text-slate-800">{{ totalElements }}</span>건
          (페이지당 {{ pageSize }}건)
        </p>

        <div v-if="isLoading" class="px-5 py-12 text-center text-sm text-slate-400">불러오는 중…</div>
        <div v-else-if="!notices.length" class="px-5 py-14 text-center text-sm text-slate-400">
          검색 조건에 맞는 게시물이 없습니다.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[36rem] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col class="w-12" />
              <col class="w-[5.5rem]" />
              <col />
              <col class="w-24" />
              <col class="w-24" />
              <col class="w-14" />
              <col v-if="isAdmin" class="w-20" />
            </colgroup>
            <thead>
              <tr class="border-b border-gray-100 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                <th class="px-3 py-3 font-semibold">번호</th>
                <th class="px-3 py-3 font-semibold">분류</th>
                <th class="px-3 py-3 font-semibold">제목</th>
                <th class="px-3 py-3 font-semibold">담당부서</th>
                <th class="px-3 py-3 font-semibold">작성일</th>
                <th class="px-3 py-3 font-semibold">조회</th>
                <th v-if="isAdmin" class="px-2 py-3 font-semibold">
                  <span class="sr-only">관리</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in notices"
                :key="row.id"
                class="group cursor-pointer border-b border-gray-100 transition-colors last:border-b-0 hover:bg-gray-50"
                @click="openNotice(row)"
              >
                <td class="px-3 py-3.5 text-center text-slate-400">
                  {{ totalElements - (currentPage - 1) * pageSize - idx }}
                </td>
                <td class="px-3 py-3.5">
                  <span
                    class="inline-flex max-w-full truncate rounded-full px-2 py-1 text-xs font-medium"
                    :class="categoryBadgeClass(row.category)"
                  >
                    {{ row.category }}
                  </span>
                </td>
                <td class="px-3 py-3.5">
                  <span class="block truncate font-medium text-slate-800 group-hover:text-blue-600">
                    {{ row.title }}
                  </span>
                </td>
                <td class="truncate px-3 py-3.5 text-slate-500">{{ row.department }}</td>
                <td class="truncate px-3 py-3.5 text-slate-500">{{ formatDate(row.date) }}</td>
                <td class="px-3 py-3.5 text-center text-slate-400">{{ row.viewCount }}</td>
                <td v-if="isAdmin" class="px-2 py-3.5">
                  <div
                    class="flex justify-center gap-0.5 opacity-40 transition-opacity group-hover:opacity-100"
                  >
                    <button
                      type="button"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                      title="수정"
                      aria-label="수정"
                      @click="onRowEdit($event, row)"
                    >
                      <Pencil :size="15" />
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      title="삭제"
                      aria-label="삭제"
                      @click="onRowDelete($event, row)"
                    >
                      <Trash2 :size="15" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="!isLoading && totalElements > 0"
          class="flex items-center justify-center gap-1.5 border-t border-gray-100 bg-slate-50/60 px-4 py-3"
        >
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white text-slate-600 transition hover:bg-white hover:shadow-sm disabled:opacity-40"
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
            class="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition"
            :class="
              page === currentPage
                ? 'bg-slate-900 text-white shadow-sm'
                : 'border border-gray-100 bg-white text-slate-600 hover:bg-gray-50'
            "
            @click="goPage(page)"
          >
            {{ page }}
          </button>
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white text-slate-600 transition hover:bg-white hover:shadow-sm disabled:opacity-40"
            :disabled="currentPage >= totalPages"
            aria-label="다음 페이지"
            @click="goPage(currentPage + 1)"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </section>

      <!-- Minwon quick cards -->
      <aside id="minwon-quick" class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div class="mb-4">
          <p class="text-xs font-medium tracking-wide text-slate-400">민원 서비스</p>
          <h2 class="mt-0.5 text-lg font-bold text-slate-900">자주 찾는 민원</h2>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="item in quickLinks"
            :key="item.id"
            type="button"
            class="group flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-5 text-center transition hover:-translate-y-1 hover:border-blue-100 hover:shadow-lg"
            @click="openMinwon(item)"
          >
            <span
              class="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white"
            >
              <component :is="minwonIcons[item.id] || FileText" :size="24" stroke-width="1.75" />
            </span>
            <span class="text-sm font-semibold text-slate-800 group-hover:text-blue-700">
              {{ item.title }}
            </span>
          </button>
        </div>

        <p class="mt-4 text-xs leading-relaxed text-slate-400">
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
      :submitting="isSubmitting"
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
