import { defineStore } from 'pinia'
import { ref } from 'vue'
import { FALLBACK_NOTICES } from '../data/fallbackNotices'
import http, { clearLegacyAccessToken } from '../utils/http'
import { parsePagedModel, sliceForPage } from '../utils/pagedModel'

const DEFAULT_PAGE_SIZE = 5

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
  const pagination = ref({
    page: 0,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 1,
  })

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

  function showFlashToast(message) {
    flashToast.value = message
  }

  function clearFlashToast() {
    flashToast.value = ''
  }

  function resolveIsAdmin(me) {
    if (!me || typeof me !== 'object') return false

    const role = String(me.role ?? me.userRole ?? me.authority ?? '').toUpperCase()
    if (role.includes('ADMIN')) return true
    if (role && (role.includes('USER') || role.includes('MEMBER') || role.includes('CITIZEN'))) {
      return false
    }

    if (Array.isArray(me.roles) && me.roles.some((r) => String(r).toUpperCase().includes('ADMIN'))) {
      return true
    }
    if (
      Array.isArray(me.authorities) &&
      me.authorities.some((a) => String(a?.authority ?? a).toUpperCase().includes('ADMIN'))
    ) {
      return true
    }

    // Seed admin account when role field is absent
    return String(me.username ?? me.userId ?? me.loginId ?? '').toLowerCase() === 'admin'
  }

  /**
   * Refresh session user from HttpOnly cookie via GET /auth/me.
   */
  async function fetchCurrentUser() {
    const me = await http.get('/v1/auth/me')
    currentUser.value = me && typeof me === 'object' ? me : null
    isAdmin.value = resolveIsAdmin(currentUser.value)
    return currentUser.value
  }

  /**
   * Restore admin UI from HttpOnly session cookie via /auth/me.
   * Also clears leftover localStorage tokens from the old Bearer scheme.
   */
  async function restoreAdminSession() {
    clearLegacyAccessToken()
    try {
      await fetchCurrentUser()
    } catch {
      currentUser.value = null
      isAdmin.value = false
    }
  }

  /**
   * DB-backed login — same endpoint for admin and general users.
   * Payload: { username, password } from the form (no client-side bypass).
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

  /**
   * Register a new account (DB-backed auth).
   * @returns {Promise<unknown>} unwrapped API response body
   */
  async function signup(username, password) {
    return http.post('/v1/auth/signup', {
      username: String(username ?? '').trim(),
      password: String(password ?? ''),
    })
  }

  async function logoutAdmin({ silent = false } = {}) {
    isAdmin.value = false
    currentUser.value = null
    clearLegacyAccessToken()

    try {
      await http.post('/v1/auth/logout')
    } catch {
      // Cookie may already be cleared / session expired — UI already public.
    }

    if (!silent) {
      showFlashToast('관리자 모드에서 로그아웃했습니다.')
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

  function filterFallbackNotices() {
    const q = searchQuery.value.trim().toLowerCase()
    const tab = activeBoardTab.value
    return FALLBACK_NOTICES.filter((item) => {
      const category = mapCategory(item.category, 0)
      if (tab !== 'all' && category !== tab) return false
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

  function applyFallbackPage(pageIndex = 0) {
    const size = pagination.value.size || DEFAULT_PAGE_SIZE
    const filtered = filterFallbackNotices()
    const totalElements = filtered.length
    const totalPages = Math.max(1, Math.ceil(totalElements / size))
    const safePage = Math.min(Math.max(0, pageIndex), totalPages - 1)
    const items = sliceForPage(filtered, safePage, size)
    applyPagedResult(items, {
      number: safePage,
      size,
      totalElements,
      totalPages,
    }, safePage)
  }

  async function loadNotices(pageIndex) {
    const size = pagination.value.size || DEFAULT_PAGE_SIZE
    const page = pageIndex ?? pagination.value.page ?? 0

    const params = {
      type: 'NOTICE',
      page,
      size,
    }

    if (activeBoardTab.value !== 'all') {
      params.category = activeBoardTab.value
    }

    const keyword = searchQuery.value.trim()
    if (keyword) {
      params.keyword = keyword
    }

    try {
      const payload = await http.get('/v1/portal', { params })
      const { items, page: pageMeta } = parsePagedModel(payload)

      if (!items.length && page > 0) {
        await loadNotices(page - 1)
        return
      }

      if (items.length) {
        applyPagedResult(items, pageMeta, pageMeta.number)
        return
      }

      applyFallbackPage(page)
    } catch {
      applyFallbackPage(page)
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
  }
})
