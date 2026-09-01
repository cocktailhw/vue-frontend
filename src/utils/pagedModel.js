/**
 * Spring HATEOAS PagedModel (and legacy page shapes) → normalized list + page meta.
 *
 * PagedModel example:
 * {
 *   "_embedded": { "portalList": [ ... ] },
 *   "page": { "size": 5, "totalElements": 42, "totalPages": 9, "number": 0 }
 * }
 */
export function parsePagedModel(payload) {
  const empty = {
    items: [],
    page: { number: 0, size: 0, totalElements: 0, totalPages: 0 },
  }

  if (!payload) return empty

  if (Array.isArray(payload)) {
    return {
      items: payload,
      page: normalizePageMeta(null, payload.length),
    }
  }

  if (typeof payload !== 'object') return empty

  // PagedModel: collection under _embedded, metadata under page
  if (payload._embedded && typeof payload._embedded === 'object') {
    const embeddedKey = Object.keys(payload._embedded).find((key) =>
      Array.isArray(payload._embedded[key]),
    )
    const items = embeddedKey ? payload._embedded[embeddedKey] : []
    return {
      items,
      page: normalizePageMeta(payload.page, items.length),
    }
  }

  // Spring Page<T> serialized without _embedded
  if (Array.isArray(payload.content)) {
    return {
      items: payload.content,
      page: normalizePageMeta(
        {
          number: payload.number,
          size: payload.size,
          totalElements: payload.totalElements,
          totalPages: payload.totalPages,
        },
        payload.content.length,
      ),
    }
  }

  // Legacy flat wrappers
  const legacyItems =
    (Array.isArray(payload.items) && payload.items) ||
    (Array.isArray(payload.list) && payload.list) ||
    []

  if (legacyItems.length) {
    return {
      items: legacyItems,
      page: normalizePageMeta(
        payload.page ?? {
          number: payload.number ?? payload.pageNumber,
          size: payload.size ?? payload.pageSize,
          totalElements: payload.totalElements ?? payload.total ?? legacyItems.length,
          totalPages: payload.totalPages,
        },
        legacyItems.length,
      ),
    }
  }

  return empty
}

function normalizePageMeta(pageMeta, itemsLength = 0) {
  const page = pageMeta && typeof pageMeta === 'object' ? pageMeta : {}
  const size = Number(page.size ?? page.pageSize ?? itemsLength ?? 0)
  const totalElements = Number(page.totalElements ?? page.total ?? itemsLength ?? 0)
  const totalPages = Math.max(1, Number(page.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : 1)))
  const number = Number(page.number ?? page.page ?? page.pageNumber ?? 0)

  return {
    number: Number.isFinite(number) ? number : 0,
    size: Number.isFinite(size) ? size : itemsLength,
    totalElements: Number.isFinite(totalElements) ? totalElements : itemsLength,
    totalPages: Number.isFinite(totalPages) ? totalPages : 1,
  }
}

export function sliceForPage(items, page, size) {
  const start = page * size
  return items.slice(start, start + size)
}
