<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
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

    <div class="grid gap-5 lg:grid-cols-[3fr_2fr]">
      <section id="notice-board" class="border border-slate-300/90 bg-white shadow-[0_1px_0_rgba(15,41,66,0.04)]">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-gradient-to-b from-slate-50 to-[#f4f6f8] px-4 py-2.5">
          <h2 class="text-base font-bold tracking-tight text-[#0F2942]">{{ boardSectionTitle }}</h2>
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
          검색어 “{{ searchQuery.trim() }}” 결과 {{ totalElements }}건
          (페이지당 {{ pageSize }}건)
        </p>

        <div v-if="isLoading" class="px-3 py-8 text-center text-sm text-slate-500">불러오는 중…</div>
        <div v-else-if="!notices.length" class="px-3 py-10 text-center text-sm text-slate-500">
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
                v-for="(row, idx) in notices"
                :key="row.id"
                class="cursor-pointer border-b border-slate-200 transition-colors hover:bg-[#f4f7fa]"
                @click="openNotice(row)"
              >
                <td class="px-2 py-2.5 text-center text-slate-600">
                  {{ totalElements - (currentPage - 1) * pageSize - idx }}
                </td>
                <td class="px-2 py-2.5">
                  <span class="inline-block max-w-full truncate border border-slate-300/80 bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                    {{ row.category }}
                  </span>
                </td>
                <td class="px-2 py-2.5">
                  <span class="block truncate font-medium text-[#0F2942] transition-colors group-hover:underline">{{ row.title }}</span>
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
          v-if="!isLoading && totalElements > 0"
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

      <aside id="minwon-quick" class="border border-slate-300/90 bg-white shadow-[0_1px_0_rgba(15,41,66,0.04)]">
        <div class="border-b border-slate-300 bg-gradient-to-b from-slate-50 to-[#f4f6f8] px-4 py-2.5">
          <h2 class="text-base font-bold tracking-tight text-[#0F2942]">자주 찾는 민원</h2>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="item in quickLinks"
            :key="item.id"
            type="button"
            class="cursor-pointer border-b border-r border-slate-200 px-2 py-6 text-center text-sm font-semibold text-[#0F2942] transition-colors hover:bg-[#0F2942] hover:text-white"
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
