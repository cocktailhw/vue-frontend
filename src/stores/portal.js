import { defineStore } from 'pinia'
import { ref } from 'vue'
import http from '../utils/http'

function asList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.list)) return payload.list
  return []
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

const FALLBACK_NOTICES = [
  {
    id: 'F-1',
    no: 1,
    type: 'NOTICE',
    title: '2026년 상반기 지방세 납부 일정 안내',
    category: '공지사항',
    department: '세무과',
    status: '-',
    date: '2026-08-20',
    viewCount: 1284,
    content:
      '2026년 상반기 지방세(재산세·자동차세 등) 납부 일정을 안내드립니다. 납부기한 내 미납 시 가산금이 부과될 수 있으니 기한 내 납부하여 주시기 바랍니다.',
    attachment: '2026_지방세납부안내.pdf',
  },
  {
    id: 'F-2',
    no: 2,
    type: 'NOTICE',
    title: '행복시 청사 방문객 주차 안내 변경 공지',
    category: '공지사항',
    department: '총무과',
    status: '-',
    date: '2026-08-18',
    viewCount: 856,
    content:
      '청사 주변 교통혼잡 완화를 위해 방문객 주차 운영 방식이 일부 변경됩니다. 민원 업무 방문 시 사전 예약 또는 대중교통 이용을 권장합니다.',
    attachment: null,
  },
  {
    id: 'F-3',
    no: 3,
    type: 'NOTICE',
    title: '행복시, 디지털 민원 서비스 확대 추진',
    category: '보도자료',
    department: '홍보담당관',
    status: '-',
    date: '2026-08-15',
    viewCount: 642,
    content:
      '행복시는 시민 편의 제고를 위해 온라인 민원 서식과 무인발급기 서비스를 확대한다고 밝혔습니다.',
    attachment: '2026_보도자료_디지털민원.pdf',
  },
  {
    id: 'F-4',
    no: 4,
    type: 'NOTICE',
    title: '행복시 공원 조성사업 실시계획 고시',
    category: '고시공고',
    department: '도시공원과',
    status: '-',
    date: '2026-08-12',
    viewCount: 391,
    content:
      '행복시 공원 조성사업 실시계획을 고시하오니 이해관계자께서는 관련 내용을 확인해 주시기 바랍니다.',
    attachment: '2026_공원조성_고시문.pdf',
  },
  {
    id: 'F-5',
    no: 5,
    type: 'NOTICE',
    title: '주민등록표 등·초본 온라인 발급 이용 안내',
    category: '공지사항',
    department: '민원여권과',
    status: '-',
    date: '2026-08-10',
    viewCount: 2103,
    content:
      '정부24를 통한 주민등록표 등·초본 온라인 발급 방법을 안내드립니다. 본인인증 후 즉시 발급이 가능합니다.',
    attachment: '주민등록_발급안내.pdf',
  },
  {
    id: 'F-6',
    no: 6,
    type: 'NOTICE',
    title: '행복시 여름철 폭염 대비 무더위 쉼터 운영',
    category: '보도자료',
    department: '안전총괄과',
    status: '-',
    date: '2026-08-08',
    viewCount: 977,
    content:
      '폭염 특보에 따라 동 행정복지센터와 경로당 등 무더위 쉼터를 집중 운영합니다.',
    attachment: null,
  },
  {
    id: 'F-7',
    no: 7,
    type: 'NOTICE',
    title: '공유재산 대부 입찰 공고',
    category: '고시공고',
    department: '회계과',
    status: '접수중',
    date: '2026-08-05',
    viewCount: 254,
    content: '행복시 소유 공유재산 대부 입찰을 공고합니다. 입찰 참가 자격 및 일정은 첨부파일을 참고하십시오.',
    attachment: '2026_공유재산_입찰공고.pdf',
  },
  {
    id: 'F-8',
    no: 8,
    type: 'NOTICE',
    title: '시정자문위원회 제3차 회의 결과 안내',
    category: '공지사항',
    department: '정책기획과',
    status: '-',
    date: '2026-08-03',
    viewCount: 418,
    content: '시정자문위원회 제3차 회의 주요 논의사항과 후속 조치를 안내드립니다.',
    attachment: null,
  },
  {
    id: 'F-9',
    no: 9,
    type: 'NOTICE',
    title: '행복시 청년 주거지원 사업 설명회 개최',
    category: '보도자료',
    department: '청년정책과',
    status: '접수중',
    date: '2026-08-01',
    viewCount: 733,
    content: '청년 주거지원 사업 설명회를 개최합니다. 신청 자격과 지원 내용은 시 홈페이지에서 확인 가능합니다.',
    attachment: '청년주거지원_안내.pdf',
  },
  {
    id: 'F-10',
    no: 10,
    type: 'NOTICE',
    title: '도시관리계획 결정(변경) 열람 공고',
    category: '고시공고',
    department: '도시계획과',
    status: '마감',
    date: '2026-07-28',
    viewCount: 512,
    content: '도시관리계획 결정(변경)안에 대한 열람을 실시하오니 의견이 있으신 분은 기한 내 제출하여 주시기 바랍니다.',
    attachment: '도시관리계획_열람공고.pdf',
  },
  {
    id: 'F-11',
    no: 11,
    type: 'NOTICE',
    title: '행복시청 민원실 운영시간 조정 안내',
    category: '공지사항',
    department: '민원여권과',
    status: '-',
    date: '2026-07-25',
    viewCount: 1450,
    content: '민원 대기시간 단축을 위해 민원실 창구 운영시간이 일부 조정됩니다.',
    attachment: null,
  },
  {
    id: 'F-12',
    no: 12,
    type: 'NOTICE',
    title: '행복시 탄소중립 실천 캠페인 추진',
    category: '보도자료',
    department: '환경정책과',
    status: '-',
    date: '2026-07-22',
    viewCount: 366,
    content: '시민과 함께하는 탄소중립 실천 캠페인을 추진합니다. 참여 방법은 시 누리집을 참고해 주세요.',
    attachment: null,
  },
]

export const usePortalStore = defineStore('portal', () => {
  const notices = ref([])
  const searchQuery = ref('')
  const activeGnb = ref('시정소식')
  const activeBoardTab = ref('보도자료')
  const boardSectionTitle = ref('시정소식 · 보도자료')
  const fontScale = ref(100)
  const isAdmin = ref(false)

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

  function toggleAdmin() {
    isAdmin.value = !isAdmin.value
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

  async function loadNotices() {
    try {
      const payload = await http.get('/v1/portal', {
        params: { type: 'NOTICE' },
      })
      const list = asList(payload).map((item, index) => withMeta(item, index))
      notices.value = list.length ? list : FALLBACK_NOTICES.map(withMeta)
    } catch {
      notices.value = FALLBACK_NOTICES.map(withMeta)
    }
  }

  async function createNotice(form) {
    await http.post('/v1/portal', buildPortalFormData(form))
    await loadNotices()
  }

  async function updateNotice(id, form) {
    await http.put(`/v1/portal/${id}`, buildPortalFormData(form))
    await loadNotices()
  }

  async function deleteNotice(id) {
    await http.delete(`/v1/portal/${id}`)
    await loadNotices()
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
    setFontScale,
    toggleAdmin,
    selectGnb,
    setBoardTab,
    loadNotices,
    createNotice,
    updateNotice,
    deleteNotice,
    bumpViews,
  }
})
