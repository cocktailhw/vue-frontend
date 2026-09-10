<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-vue-next'
import { usePortalStore } from '../../stores/portal'
import { useUiStore } from '../../stores/ui'
import {
  MINWON_STATUS_OPTIONS,
  minwonStatusBadgeClass,
  minwonStatusLabel,
} from '../../utils/minwon'
import NoticeDetailModal from '../../components/NoticeDetailModal.vue'
import NoticeFormModal from '../../components/NoticeFormModal.vue'

const LIST_PAGE_SIZE = 10
const MINWON_PAGE_SIZE = 10

const portalStore = usePortalStore()
const uiStore = useUiStore()
const {
  notices,
  isAdmin,
  currentUser,
  flashToast,
  pagination,
  adminMinwons,
  adminMinwonPagination,
} = storeToRefs(portalStore)

const isLoading = ref(false)
const minwonLoading = ref(false)
const statusUpdatingId = ref(null)
const activeMenu = ref('notices')

const modalOpen = ref(false)
const selectedNotice = ref(null)
const modalList = ref([])

const formOpen = ref(false)
const formMode = ref('create')
const editingNotice = ref(null)
const isSubmitting = ref(false)

const toast = ref({ show: false, message: '' })
let toastTimer = null

const sidebarMenus = [
  { id: 'dashboard', label: '대시보드 개요', icon: LayoutDashboard },
  { id: 'notices', label: '공지사항 관리', icon: FileText },
  { id: 'minwons', label: '민원 관리', icon: ClipboardList },
]

const waitingMinwonCount = computed(
  () => adminMinwons.value.filter((row) => row.status === 'WAITING').length,
)

const stats = computed(() => [
  {
    id: 'posts',
    label: '총 게시물',
    value: String(pagination.value.totalElements ?? 0),
    hint: '공지 전체',
    icon: FileText,
  },
  {
    id: 'visitors',
    label: '오늘 방문자',
    value: '3,152',
    hint: '금일 기준(Mock)',
    icon: Users,
  },
  {
    id: 'pending',
    label: '미처리 민원',
    value: String(waitingMinwonCount.value),
    hint: '목록 기준 접수대기',
    icon: ClipboardList,
  },
])

const displayName = computed(() => {
  const user = currentUser.value
  if (!user) return '관리자'
  return user.name || user.username || user.userId || user.loginId || '관리자'
})

const pageTitle = computed(() => {
  if (activeMenu.value === 'minwons') return '민원 관리'
  if (activeMenu.value === 'notices') return '공지사항 관리'
  return '대시보드 개요'
})

const currentPage = computed(() => pagination.value.page + 1)
const pageSize = computed(() => pagination.value.size)
const totalElements = computed(() => pagination.value.totalElements)
const totalPages = computed(() => Math.max(1, pagination.value.totalPages))

const pageNumbers = computed(() => buildPageNumbers(currentPage.value, totalPages.value))

const minwonCurrentPage = computed(() => adminMinwonPagination.value.page + 1)
const minwonPageSize = computed(() => adminMinwonPagination.value.size)
const minwonTotalElements = computed(() => adminMinwonPagination.value.totalElements)
const minwonTotalPages = computed(() => Math.max(1, adminMinwonPagination.value.totalPages))
const minwonPageNumbers = computed(() =>
  buildPageNumbers(minwonCurrentPage.value, minwonTotalPages.value),
)

function buildPageNumbers(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, 4, 5]
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total]
  return [current - 2, current - 1, current, current + 1, current + 2]
}

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

async function reload(pageIndex = 0) {
  isLoading.value = true
  try {
    portalStore.setBoardTab('all')
    await portalStore.loadNotices(pageIndex, { size: LIST_PAGE_SIZE })
  } finally {
    isLoading.value = false
  }
}

async function reloadMinwons(pageIndex = 0) {
  minwonLoading.value = true
  try {
    await portalStore.fetchAdminMinwons(pageIndex, { size: MINWON_PAGE_SIZE })
  } catch {
    uiStore.showToast('민원 목록을 불러오지 못했습니다.', 'error')
  } finally {
    minwonLoading.value = false
  }
}

watch(activeMenu, async (menu) => {
  if (menu === 'minwons' || menu === 'dashboard') {
    await reloadMinwons(adminMinwonPagination.value.page || 0)
  }
  if (menu === 'notices' || menu === 'dashboard') {
    if (!notices.value.length) await reload(0)
  }
})

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
    uiStore.showToast('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'error')
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
    uiStore.showToast('삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'error')
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

async function goPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  isLoading.value = true
  try {
    await portalStore.goToNoticePage(page)
  } finally {
    isLoading.value = false
  }
}

async function goMinwonPage(page) {
  if (page < 1 || page > minwonTotalPages.value || page === minwonCurrentPage.value) return
  await reloadMinwons(page - 1)
}

async function onMinwonStatusChange(row, event) {
  const nextStatus = event.target.value
  if (!row?.id || nextStatus === row.status) return

  statusUpdatingId.value = row.id
  try {
    await portalStore.updateMinwonStatus(row.id, nextStatus)
    showToast('민원 상태가 변경되었습니다.')
  } catch {
    uiStore.showToast('상태 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'error')
    event.target.value = row.status
  } finally {
    statusUpdatingId.value = null
  }
}

async function onLogout() {
  await portalStore.logoutAdmin()
}

onMounted(async () => {
  if (flashToast.value) {
    showToast(flashToast.value)
    portalStore.clearFlashToast()
  }
  await reload(0)
  await reloadMinwons(0)
})

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<template>
  <div class="flex min-h-screen bg-slate-100 text-[#333333]">
    <Transition name="toast">
      <div
        v-if="toast.show"
        class="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 border border-slate-800 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white"
        role="status"
      >
        {{ toast.message }}
      </div>
    </Transition>

    <aside class="flex w-56 shrink-0 flex-col bg-[#0F172A] text-white">
      <div class="border-b border-slate-700 px-4 py-5">
        <p class="text-xs font-semibold tracking-wide text-slate-400">BACK OFFICE</p>
        <h1 class="mt-1 text-base font-bold">관리자 대시보드</h1>
        <p class="mt-2 truncate text-xs text-slate-400">{{ displayName }}</p>
      </div>

      <nav class="flex-1 space-y-1 p-3" aria-label="관리 메뉴">
        <button
          v-for="menu in sidebarMenus"
          :key="menu.id"
          type="button"
          class="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm font-semibold"
          :class="
            activeMenu === menu.id
              ? 'bg-slate-800 text-white'
              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
          "
          @click="activeMenu = menu.id"
        >
          <component :is="menu.icon" :size="18" class="shrink-0" />
          {{ menu.label }}
        </button>
      </nav>

      <div class="space-y-2 border-t border-slate-700 p-3">
        <RouterLink
          to="/"
          class="flex w-full items-center justify-center rounded-sm border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
        >
          포털로 돌아가기
        </RouterLink>
        <button
          type="button"
          class="flex w-full items-center justify-center gap-1 rounded-sm border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          @click="onLogout"
        >
          <LogOut :size="14" />
          로그아웃
        </button>
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <header class="border-b border-slate-200 bg-white px-6 py-4">
        <h2 class="text-lg font-bold text-[#0F2942]">{{ pageTitle }}</h2>
        <p class="mt-0.5 text-sm text-slate-500">
          {{ isAdmin ? '관리자 권한이 확인되었습니다.' : '권한 확인 중…' }}
        </p>
      </header>

      <main class="space-y-6 p-6">
        <section class="grid gap-4 sm:grid-cols-3">
          <article
            v-for="card in stats"
            :key="card.id"
            class="rounded-sm border border-slate-200 bg-white p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-semibold text-slate-500">{{ card.label }}</p>
                <p class="mt-2 text-2xl font-bold text-[#0F2942]">{{ card.value }}</p>
                <p class="mt-1 text-xs text-slate-400">{{ card.hint }}</p>
              </div>
              <span
                class="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-slate-200 bg-slate-50 text-slate-700"
              >
                <component :is="card.icon" :size="20" />
              </span>
            </div>
          </article>
        </section>

        <!-- 공지사항 관리 -->
        <section
          v-if="activeMenu === 'notices' || activeMenu === 'dashboard'"
          class="rounded-sm border border-slate-200 bg-white"
        >
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <h3 class="text-sm font-bold text-[#0F2942]">공지사항 관리</h3>
              <p class="mt-0.5 text-xs text-slate-500">등록 · 수정 · 삭제는 이 화면에서만 가능합니다.</p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-sm border border-[#0F2942] bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              @click="openCreateForm"
            >
              <Plus :size="16" />
              글쓰기 (신규 등록)
            </button>
          </div>

          <div v-if="isLoading" class="px-4 py-14 text-center text-sm text-slate-500">불러오는 중…</div>
          <div v-else-if="!notices.length" class="px-4 py-14 text-center text-sm text-slate-500">
            등록된 게시물이 없습니다.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[48rem] table-fixed border-collapse text-left text-sm">
              <colgroup>
                <col class="w-14" />
                <col class="w-24" />
                <col />
                <col class="w-28" />
                <col class="w-24" />
                <col class="w-16" />
                <col class="w-28" />
              </colgroup>
              <thead>
                <tr class="border-t-2 border-b border-slate-800 bg-slate-100 text-xs text-slate-800">
                  <th class="px-3 py-2.5 text-center font-bold">번호</th>
                  <th class="px-3 py-2.5 font-bold">분류</th>
                  <th class="px-3 py-2.5 font-bold">제목</th>
                  <th class="px-3 py-2.5 font-bold">담당부서</th>
                  <th class="px-3 py-2.5 font-bold">작성일</th>
                  <th class="px-3 py-2.5 text-center font-bold">조회</th>
                  <th class="px-3 py-2.5 text-center font-bold">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in notices"
                  :key="row.id"
                  class="cursor-pointer border-b border-slate-200 hover:bg-slate-50"
                  @click="openNotice(row)"
                >
                  <td class="px-3 py-2.5 text-center text-slate-600">
                    {{ totalElements - (currentPage - 1) * pageSize - idx }}
                  </td>
                  <td class="px-3 py-2.5">
                    <span
                      class="inline-block max-w-full truncate rounded-sm border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700"
                    >
                      {{ row.category }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5">
                    <span class="block truncate font-medium text-[#0F2942]">{{ row.title }}</span>
                  </td>
                  <td class="truncate px-3 py-2.5 text-slate-600">{{ row.department }}</td>
                  <td class="truncate px-3 py-2.5 text-slate-600">{{ formatDate(row.date) }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-600">{{ row.viewCount }}</td>
                  <td class="px-3 py-2.5">
                    <div class="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        class="inline-flex items-center gap-0.5 text-xs text-slate-500 hover:text-slate-800 hover:underline"
                        @click="onRowEdit($event, row)"
                      >
                        <Pencil :size="12" />
                        수정
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center gap-0.5 text-xs text-slate-500 hover:text-slate-800 hover:underline"
                        @click="onRowDelete($event, row)"
                      >
                        <Trash2 :size="12" />
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

        <!-- 민원 관리 -->
        <section
          v-if="activeMenu === 'minwons' || activeMenu === 'dashboard'"
          class="rounded-sm border border-slate-200 bg-white"
        >
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <h3 class="text-sm font-bold text-[#0F2942]">민원 관리</h3>
              <p class="mt-0.5 text-xs text-slate-500">
                상태 변경 시 즉시 서버에 반영됩니다. (WAITING / IN_PROGRESS / COMPLETED)
              </p>
            </div>
            <p class="text-xs text-slate-500">총 {{ minwonTotalElements }}건</p>
          </div>

          <div v-if="minwonLoading" class="px-4 py-14 text-center text-sm text-slate-500">
            불러오는 중…
          </div>
          <div v-else-if="!adminMinwons.length" class="px-4 py-14 text-center text-sm text-slate-500">
            등록된 민원이 없습니다.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[52rem] table-fixed border-collapse text-left text-sm">
              <colgroup>
                <col class="w-28" />
                <col />
                <col class="w-28" />
                <col class="w-28" />
                <col class="w-28" />
                <col class="w-40" />
              </colgroup>
              <thead>
                <tr class="border-t-2 border-b border-slate-800 bg-slate-100 text-xs text-slate-800">
                  <th class="px-3 py-2.5 font-bold">신청번호</th>
                  <th class="px-3 py-2.5 font-bold">민원명</th>
                  <th class="px-3 py-2.5 font-bold">신청자</th>
                  <th class="px-3 py-2.5 font-bold">신청일</th>
                  <th class="px-3 py-2.5 text-center font-bold">현재상태</th>
                  <th class="px-3 py-2.5 text-center font-bold">상태 변경</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in adminMinwons"
                  :key="row.id"
                  class="border-b border-slate-200 hover:bg-slate-50"
                >
                  <td class="px-3 py-2.5 font-medium text-slate-700">{{ row.id }}</td>
                  <td class="px-3 py-2.5">
                    <span class="block truncate font-medium text-[#0F2942]">{{ row.title }}</span>
                  </td>
                  <td class="truncate px-3 py-2.5 text-slate-600">{{ row.applicant }}</td>
                  <td class="truncate px-3 py-2.5 text-slate-600">{{ formatDate(row.appliedAt) }}</td>
                  <td class="px-3 py-2.5 text-center">
                    <span
                      class="inline-block rounded-sm border px-2 py-0.5 text-xs font-semibold"
                      :class="minwonStatusBadgeClass(row.status)"
                    >
                      {{ minwonStatusLabel(row.status) }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5">
                    <select
                      class="w-full rounded-sm border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 disabled:bg-slate-100"
                      :value="row.status"
                      :disabled="statusUpdatingId === row.id"
                      @change="onMinwonStatusChange(row, $event)"
                    >
                      <option
                        v-for="opt in MINWON_STATUS_OPTIONS"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="!minwonLoading && minwonTotalElements > 0"
            class="flex items-center justify-center gap-1 border-t border-slate-200 bg-slate-50 px-3 py-3"
          >
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-slate-300 bg-white disabled:opacity-40"
              :disabled="minwonCurrentPage <= 1"
              aria-label="이전 페이지"
              @click="goMinwonPage(minwonCurrentPage - 1)"
            >
              <ChevronLeft :size="16" />
            </button>
            <button
              v-for="page in minwonPageNumbers"
              :key="`m-${page}`"
              type="button"
              class="inline-flex h-8 min-w-8 items-center justify-center rounded-sm border px-2 text-xs font-semibold"
              :class="
                page === minwonCurrentPage
                  ? 'border-[#0F2942] bg-[#0F2942] text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              "
              @click="goMinwonPage(page)"
            >
              {{ page }}
            </button>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-slate-300 bg-white disabled:opacity-40"
              :disabled="minwonCurrentPage >= minwonTotalPages"
              aria-label="다음 페이지"
              @click="goMinwonPage(minwonCurrentPage + 1)"
            >
              <ChevronRight :size="16" />
            </button>
          </div>
        </section>
      </main>
    </div>

    <NoticeDetailModal
      :open="modalOpen"
      :notice="selectedNotice"
      :list="modalList"
      :is-admin="true"
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
  </div>
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
