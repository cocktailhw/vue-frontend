/** Minwon status codes aligned with backend API. */
export const MINWON_STATUS_OPTIONS = [
  { value: 'WAITING', label: '접수대기' },
  { value: 'IN_PROGRESS', label: '처리중' },
  { value: 'COMPLETED', label: '완료' },
]

export function normalizeMinwonStatus(raw) {
  const text = String(raw ?? '').trim()
  const upper = text.toUpperCase().replace(/-/g, '_')

  if (upper === 'WAITING' || upper === 'PENDING' || text === '접수대기') return 'WAITING'
  if (
    upper === 'IN_PROGRESS' ||
    upper === 'INPROGRESS' ||
    upper === 'PROCESSING' ||
    text === '처리중'
  ) {
    return 'IN_PROGRESS'
  }
  if (upper === 'COMPLETED' || upper === 'DONE' || text === '완료') return 'COMPLETED'

  if (upper.includes('WAIT') || upper.includes('RECEIV')) return 'WAITING'
  if (upper.includes('PROGRESS') || upper.includes('PROCESS')) return 'IN_PROGRESS'
  if (upper.includes('COMPLETE') || upper.includes('DONE')) return 'COMPLETED'

  return 'WAITING'
}

export function minwonStatusLabel(status) {
  const code = normalizeMinwonStatus(status)
  return MINWON_STATUS_OPTIONS.find((opt) => opt.value === code)?.label ?? '접수대기'
}

export function minwonStatusBadgeClass(status) {
  const code = normalizeMinwonStatus(status)
  if (code === 'COMPLETED') return 'border-emerald-700 bg-emerald-50 text-emerald-800'
  if (code === 'IN_PROGRESS') return 'border-sky-700 bg-sky-50 text-sky-800'
  return 'border-amber-700 bg-amber-50 text-amber-900'
}

export function normalizeMinwon(item, index = 0) {
  const id = item?.id ?? item?.minwonId ?? item?.requestId ?? `M-${index + 1}`
  return {
    id,
    title: item?.title ?? item?.subject ?? item?.name ?? '제목 없음',
    content: item?.content ?? item?.description ?? '',
    status: normalizeMinwonStatus(item?.status ?? item?.state ?? item?.processStatus),
    agency: item?.agency ?? item?.department ?? item?.dept ?? item?.organ ?? '—',
    appliedAt: item?.appliedAt ?? item?.createdAt ?? item?.regDate ?? item?.date ?? '',
    applicant:
      item?.applicant ??
      item?.applicantName ??
      item?.username ??
      item?.userName ??
      item?.createdBy ??
      '—',
  }
}
