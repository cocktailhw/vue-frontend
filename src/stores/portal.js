import { defineStore } from 'pinia'
import { ref } from 'vue'
import { FALLBACK_NOTICES } from '../data/fallbackNotices'
import http, { clearLegacyAccessToken } from '../utils/http'
import { parsePagedModel, sliceForPage } from '../utils/pagedModel'
import { normalizeMinwon } from '../utils/minwon'
import { useUiStore } from './ui'
import router from '../router'

const DEFAULT_PAGE_SIZE = 5
const DEFAULT_MINWON_PAGE_SIZE = 10

/** In-flight /auth/me restore — shared so concurrent callers hit the API once. */
let sessionPromise = null

function createDefaultPagination(size = DEFAULT_PAGE_SIZE) {
  return {
    page: 0,
    size,
    totalElements: 0,
    totalPages: 1,
  }
}

function mapCategory(raw, index) {
  const text = String(raw ?? '').trim()
  if (/보도|시정소식|뉴스|press/i.test(text)) return '보도자료'
  if (/고시|공고|입찰|입법/i.test(text)) return '고시공고'
  if (/공지|안내|일반|notice/i.test(text)) return '공지사항'
  const cycle = ['공지사항', '보도자료', '고시공고']
  return cycle[index % cycle.length]
}

function normalizeNotice(item, index) {
  const idNum = Number(item.id ?? item.noticeId ?? index + 1)
  const phones = ['1600-0001', '1600-0002', '1600-0003', '1600-0004']
  return {
    id: item.id ?? item.noticeId ?? `N-${index + 1}`,
    no: Number.isFinite(idNum) ? idNum : index + 1,
    type: item.type ?? item.portalType ?? 'NOTICE',
    title: item.title ?? item.subject ?? '제목 없음',
    category: mapCategory(item.category ?? item.typeName ?? item.boardType, index),
    department: item.department ?? item.dept ?? item.organ ?? '행복시청',
    status: item.status ?? item.stateName ?? '-',
    date: item.date ?? item.createdAt ?? item.regDate ?? item.publishedAt ?? '',
    viewCount: Number(item.viewCount ?? item.views ?? item.hit ?? 0),
    contact:
      item.contact ??
      item.phone ??
      item.tel ??
      phones[index % phones.length],
    content:
      item.content ??
      item.description ??
      item.summary ??
      '시민 여러분께 알려드립니다.\n\n본 안내는 행복시청 관련 시정 사항을 공유하기 위한 공지입니다. 자세한 내용은 담당 부서로 문의하여 주시기 바랍니다.\n\n※ 본 게시물은 시스템 테스트용 가상 데이터일 수 있습니다.',
    originalFileName:
      item.originalFileName ?? item.originalFilename ?? item.fileName ?? item.attachment ?? null,
    storedFileName: item.storedFileName ?? item.storedFilename ?? item.storedName ?? null,
    fileSize: item.fileSize ?? item.attachmentSize ?? item.size ?? null,
    attachment:
      item.originalFileName ??
      item.originalFilename ??
      item.attachment ??
      item.fileName ??
      item.file ??
      null,
    attachmentSize: item.attachmentSize ?? item.fileSize ?? item.size ?? null,
  }
}

export const usePortalStore = defineStore('portal', () => {
  const notices = ref([])
  const searchQuery = ref('')
  const activeGnb = ref('시정소식')
  const activeBoardTab = ref('보도자료')
  const boardSectionTitle = ref('시정소식 · 보도자료')
  const fontScale = ref(100)
  const isAdmin = ref(false)
  const currentUser = ref(null)
  const flashToast = ref('')
  const pagination = ref(createDefaultPagination())
  const myMinwons = ref([])
  const adminMinwons = ref([])
  const adminMinwonPagination = ref(createDefaultPagination(DEFAULT_MINWON_PAGE_SIZE))

  const gnbBoardMap = {
    민원안내: { tab: 'all', title: '민원안내 · 전체 알림', scroll: 'minwon-quick' },
    시정소식: { tab: '보도자료', title: '시정소식 · 보도자료', scroll: 'notice-board' },
    정보공개: { tab: '고시공고', title: '정보공개 · 고시공고', scroll: 'notice-board' },
    시민참여: { tab: '공지사항', title: '시민참여 · 공지사항', scroll: 'notice-board' },
    시청안내: { tab: 'all', title: '시청안내 · 전체 알림', scroll: 'footer' },
  }

  function setFontScale(percent) {
    fontScale.value = percent
    document.documentElement.style.fontSize = `${percent}%`
  }

  function showFlashToast(message, type = 'success') {
    try {
      useUiStore().showToast(message, type)
    } catch {
      flashToast.value = message
    }
  }

  function clearFlashToast() {
    flashToast.value = ''
  }

  /**
   * Admin only when backend role claims include ADMIN.
   * No username-based heuristics.
   */
  function resolveIsAdmin(me) {
    if (!me || typeof me !== 'object') return false

    const role = String(me.role ?? me.userRole ?? me.authority ?? '').toUpperCase()
    if (role.includes('ADMIN')) return true

    if (Array.isArray(me.roles) && me.roles.some((r) => String(r).toUpperCase().includes('ADMIN'))) {
      return true
    }
    if (
      Array.isArray(me.authorities) &&
      me.authorities.some((a) => String(a?.authority ?? a).toUpperCase().includes('ADMIN'))
    ) {
      return true
    }

    return false
  }

  /**
   * Refresh session user from HttpOnly cookie via GET /auth/me.
   */
  async function fetchCurrentUser() {
    const me = await http.get('/v1/auth/me', { skipGlobalLoading: true })
    currentUser.value = me && typeof me === 'object' ? me : null
    isAdmin.value = resolveIsAdmin(currentUser.value)
    return currentUser.value
  }

  /**
   * Restore session from HttpOnly cookie via /auth/me.
   * Concurrent callers share one in-flight Promise (single /auth/me).
   */
  async function restoreAdminSession() {
    if (sessionPromise) return sessionPromise

    sessionPromise = (async () => {
      clearLegacyAccessToken()
      try {
        await fetchCurrentUser()
      } catch {
        currentUser.value = null
        isAdmin.value = false
      }
    })().finally(() => {
      sessionPromise = null
    })

    return sessionPromise
  }

  /**
   * DB-backed login — same endpoint for admin and general users.
   */
  async function loginAdmin(username, password) {
    await http.post('/v1/auth/login', {
      username: String(username ?? '').trim(),
      password: String(password ?? ''),
    })
    await fetchCurrentUser()
    showFlashToast(
      isAdmin.value ? '관리자 로그인에 성공했습니다.' : '로그인되었습니다.',
    )
  }

  async function signup(username, password) {
    return http.post('/v1/auth/signup', {
      username: String(username ?? '').trim(),
      password: String(password ?? ''),
    })
  }

  async function logoutAdmin({ silent = false } = {}) {
    isAdmin.value = false
    currentUser.value = null
    notices.value = []
    searchQuery.value = ''
    pagination.value = createDefaultPagination()
    myMinwons.value = []
    adminMinwons.value = []
    adminMinwonPagination.value = createDefaultPagination(DEFAULT_MINWON_PAGE_SIZE)
    clearLegacyAccessToken()
    sessionPromise = null

    try {
      await http.post('/v1/auth/logout', null, { skipGlobalLoading: true })
    } catch {
      // Cookie may already be cleared / session expired — UI already public.
    }

    const route = router.currentRoute.value
    if (route.meta.requiresAuth || route.meta.requiresAdmin) {
      await router.replace({ name: 'home' })
    }

    if (!silent) {
      showFlashToast('로그아웃되었습니다.')
    }
  }

  function selectGnb(label) {
    activeGnb.value = label
    const config = gnbBoardMap[label]
    if (!config) return
    activeBoardTab.value = config.tab
    boardSectionTitle.value = config.title
    requestAnimationFrame(() => {
      document.getElementById(config.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function setBoardTab(tabId) {
    activeBoardTab.value = tabId
    const titles = {
      all: '알림마당 · 전체',
      공지사항: '알림마당 · 공지사항',
      고시공고: '알림마당 · 고시공고',
      보도자료: '알림마당 · 보도자료',
    }
    boardSectionTitle.value = titles[tabId] || '알림마당'
  }

  function withMeta(item, index) {
    const normalized = normalizeNotice(item, index)
    return {
      ...normalized,
      contact: item.contact ?? normalized.contact ?? `1600-000${(index % 4) + 1}`,
      content:
        item.content ||
        normalized.content ||
        '시민 여러분께 알려드립니다.\n\n본 공지는 행복시청 시정 운영과 관련한 안내사항입니다. 관련 문의는 담당 부서 연락처로 연락해 주시기 바랍니다.\n\n붙임: 세부 안내문 1부. 끝.',
    }
  }

  function buildPortalFormData(form) {
    const portalData = {
      type: form.type,
      title: form.title,
      department: form.department,
      status: form.status,
      content: form.content,
      category: form.category,
    }
    const formData = new FormData()
    formData.append('data', new Blob([JSON.stringify(portalData)], { type: 'application/json' }))
    if (form.file instanceof File) {
      formData.append('file', form.file)
    }
    return formData
  }

  function matchesRouteCategory(itemCategory, routeCategory) {
    if (!routeCategory || routeCategory === 'all') return true
    const key = String(routeCategory).toUpperCase()
    // 라우트 API 카테고리(NOTICE/INFO/PARTICIPATE) — 폴백 더미 데이터 매핑
    if (key === 'NOTICE') return ['공지사항', '보도자료'].includes(itemCategory)
    if (key === 'INFO') return itemCategory === '고시공고'
    if (key === 'PARTICIPATE') return itemCategory === '공지사항'
    return itemCategory === routeCategory
  }

  function filterFallbackNotices(overrideCategory) {
    const q = searchQuery.value.trim().toLowerCase()
    const tab = overrideCategory ?? activeBoardTab.value
    const isRouteCategory = ['NOTICE', 'INFO', 'PARTICIPATE'].includes(String(tab).toUpperCase())
    return FALLBACK_NOTICES.filter((item) => {
      const category = mapCategory(item.category, 0)
      if (isRouteCategory) {
        if (!matchesRouteCategory(category, tab)) return false
      } else if (tab !== 'all' && category !== tab) {
        return false
      }
      if (!q) return true
      return (
        String(item.title).toLowerCase().includes(q) ||
        String(item.department).toLowerCase().includes(q) ||
        String(item.content).toLowerCase().includes(q)
      )
    })
  }

  function applyPagedResult(items, pageMeta, pageIndex) {
    notices.value = items.map((item, index) => withMeta(item, pageIndex * pageMeta.size + index))
    pagination.value = {
      page: pageMeta.number,
      size: pageMeta.size || DEFAULT_PAGE_SIZE,
      totalElements: pageMeta.totalElements,
      totalPages: Math.max(1, pageMeta.totalPages),
    }
  }

  function applyFallbackPage(pageIndex = 0, overrideCategory = undefined) {
    const size = pagination.value.size || DEFAULT_PAGE_SIZE
    const filtered = filterFallbackNotices(overrideCategory)
    const totalElements = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalElements / size))
    const safePage = Math.min(Math.max(0, pageIndex), totalPages - 1)
    const items = sliceForPage(filtered, safePage, size)
    applyPagedResult(
      items,
      {
        number: safePage,
        size,
        totalElements,
        totalPages,
      },
      safePage,
    )
  }

  async function loadNotices(pageIndex, options = {}) {
    if (options.size != null && Number(options.size) > 0) {
      pagination.value = {
        ...pagination.value,
        size: Number(options.size),
      }
    }

    const size = pagination.value.size || DEFAULT_PAGE_SIZE
    const page = pageIndex ?? pagination.value.page ?? 0

    const params = {
      type: 'NOTICE',
      page,
      size,
    }

    // options.category가 있으면 라우트 기준 카테고리 우선 (게시판 탭보다 상위)
    let resolvedCategory = null
    if (options.category != null && options.category !== '') {
      resolvedCategory = options.category
    } else if (activeBoardTab.value !== 'all') {
      resolvedCategory = activeBoardTab.value
    }

    if (resolvedCategory) {
      params.category = resolvedCategory
    }

    const keyword = searchQuery.value.trim()
    if (keyword) {
      params.keyword = keyword
    }

    try {
      const payload = await http.get('/v1/portal', { params })
      const { items, page: pageMeta } = parsePagedModel(payload)

      if (!items.length && page > 0) {
        await loadNotices(page - 1, options)
        return
      }

      if (items.length) {
        applyPagedResult(items, pageMeta, pageMeta.number)
        return
      }

      applyFallbackPage(page, resolvedCategory)
    } catch {
      applyFallbackPage(page, resolvedCategory)
    }
  }

  async function goToNoticePage(pageOneBased) {
    const target = Math.max(1, pageOneBased)
    const zeroBased = target - 1
    if (zeroBased === pagination.value.page && notices.value.length) return
    await loadNotices(zeroBased)
  }

  async function createNotice(form) {
    await http.post('/v1/portal', buildPortalFormData(form))
    await loadNotices(0)
  }

  async function updateNotice(id, form) {
    await http.put(`/v1/portal/${id}`, buildPortalFormData(form))
    await loadNotices(pagination.value.page)
  }

  async function deleteNotice(id) {
    const currentPage = pagination.value.page
    await http.delete(`/v1/portal/${id}`)
    await loadNotices(currentPage)
  }

  function bumpViews(id) {
    const target = notices.value.find((item) => item.id === id)
    if (target) target.viewCount += 1
  }

  /** POST /v1/minwon — citizen application */
  async function applyMinwon({ title, content }) {
    return http.post('/v1/minwon', {
      title: String(title ?? '').trim(),
      content: String(content ?? '인터넷 자동 접수').trim() || '인터넷 자동 접수',
    })
  }

  /** GET /v1/minwon/my — current user's applications */
  async function fetchMyMinwons() {
    const payload = await http.get('/v1/minwon/my')
    let items = []
    if (Array.isArray(payload)) {
      items = payload
    } else {
      items = parsePagedModel(payload).items
    }
    myMinwons.value = items.map((item, index) => normalizeMinwon(item, index))
    return myMinwons.value
  }

  /** GET /v1/minwon — admin paged list */
  async function fetchAdminMinwons(pageIndex = 0, options = {}) {
    if (options.size != null && Number(options.size) > 0) {
      adminMinwonPagination.value = {
        ...adminMinwonPagination.value,
        size: Number(options.size),
      }
    }

    const size = adminMinwonPagination.value.size || DEFAULT_MINWON_PAGE_SIZE
    const page = pageIndex ?? adminMinwonPagination.value.page ?? 0

    const payload = await http.get('/v1/minwon', {
      params: { page, size },
    })
    const { items, page: pageMeta } = parsePagedModel(payload)

    adminMinwons.value = items.map((item, index) =>
      normalizeMinwon(item, pageMeta.number * (pageMeta.size || size) + index),
    )
    adminMinwonPagination.value = {
      page: pageMeta.number,
      size: pageMeta.size || size,
      totalElements: pageMeta.totalElements,
      totalPages: Math.max(1, pageMeta.totalPages),
    }
    return adminMinwons.value
  }

  /** PUT /v1/minwon/{id}/status */
  async function updateMinwonStatus(id, status) {
    await http.put(`/v1/minwon/${encodeURIComponent(id)}/status`, {
      status: String(status ?? '').trim(),
    })
    await fetchAdminMinwons(adminMinwonPagination.value.page)
  }

  return {
    notices,
    searchQuery,
    activeGnb,
    activeBoardTab,
    boardSectionTitle,
    fontScale,
    isAdmin,
    currentUser,
    flashToast,
    pagination,
    myMinwons,
    adminMinwons,
    adminMinwonPagination,
    setFontScale,
    showFlashToast,
    clearFlashToast,
    restoreAdminSession,
    fetchCurrentUser,
    loginAdmin,
    signup,
    logoutAdmin,
    selectGnb,
    setBoardTab,
    loadNotices,
    goToNoticePage,
    createNotice,
    updateNotice,
    deleteNotice,
    bumpViews,
    applyMinwon,
    fetchMyMinwons,
    fetchAdminMinwons,
    updateMinwonStatus,
  }
})
