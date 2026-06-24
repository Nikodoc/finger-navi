import { AMAP } from '../constants'
import type { AmapAroundResponse, Toilet } from '../types'

function buildUrl(path: string, params: Record<string, string | number>): string {
  const qs = new URLSearchParams({
    key: AMAP.API_KEY,
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ),
  }).toString()
  return `${AMAP.BASE_URL}${path}?${qs}`
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`高德 API 请求失败: ${res.status}`)
  return res.json() as Promise<T>
}

/**
 * 搜索周边厕所 POI
 */
export async function searchNearbyToilets(
  lng: number,
  lat: number,
  radius = AMAP.SEARCH_RADIUS
): Promise<Toilet[]> {
  const url = buildUrl('/place/around', {
    location: `${lng},${lat}`,
    keywords: '公共厕所|卫生间|洗手间|厕所',
    radius,
    offset: AMAP.PAGE_SIZE,
    page: 1,
    extensions: 'all',
  })

  const data = await fetchJson<AmapAroundResponse>(url)

  if (data.status !== '1' || !data.pois) {
    console.warn('高德 API 返回异常:', JSON.stringify(data).slice(0, 200))
    return []
  }

  return data.pois.map((poi) => {
    const [lngStr, latStr] = poi.location.split(',')
    const distance = parseFloat(poi.distance)

    return {
      id: `amap_${poi.id}`,
      name: normalizeName(poi.name),
      lat: parseFloat(latStr),
      lng: parseFloat(lngStr),
      address: poi.address || '',
      distance: isNaN(distance) ? undefined : distance,
      rating: poi.biz_ext?.rating ? parseFloat(poi.biz_ext.rating) : 3.0,
      ratingCount: 0,
      isFree: true,
      hasAccessible: false,
      hasBabyRoom: false,
      isSquatToilet: false,
      photos: (poi.photos || []).map((p) =>
        p.url.startsWith('http') ? p.url : `https:${p.url}`
      ),
      source: 'amap',
      tags: inferTags(poi.name),
    }
  })
}

/**
 * 通过名称搜索位置 (用于用户选点)
 */
export async function searchPlace(
  keywords: string,
  city?: string
): Promise<{ name: string; address: string; lat: number; lng: number }[]> {
  const params: Record<string, string | number> = {
    keywords,
    offset: 10,
    page: 1,
    extensions: 'base',
  }
  if (city) params.city = city

  const url = buildUrl('/place/text', params)
  const data = await fetchJson<AmapAroundResponse>(url)

  if (data.status !== '1' || !data.pois) return []

  return data.pois.map((poi) => {
    const [lngStr, latStr] = poi.location.split(',')
    return {
      name: poi.name,
      address: poi.address || '',
      lat: parseFloat(latStr),
      lng: parseFloat(lngStr),
    }
  })
}

/**
 * 反向地理编码
 */
export async function reverseGeocode(
  lng: number,
  lat: number
): Promise<string> {
  const url = buildUrl('/geocode/regeo', {
    location: `${lng},${lat}`,
    extensions: 'base',
  })

  const data = await fetchJson<{
    status: string
    regeocode?: { formatted_address?: string }
  }>(url)

  if (data.status === '1' && data.regeocode?.formatted_address) {
    return data.regeocode.formatted_address
  }
  return ''
}

function normalizeName(name: string): string {
  // 高德有些厕所名字比较长/奇怪
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/（.*?）/g, '')
    .trim()
    .slice(0, 20) || '公共厕所'
}

function inferTags(name: string): string[] {
  const tags: string[] = []
  const n = name.toLowerCase()
  if (n.includes('无障碍') || n.includes('残障')) tags.push('无障碍')
  if (n.includes('母婴') || n.includes('亲子')) tags.push('母婴室')
  if (n.includes('第三') || n.includes('家庭')) tags.push('第三卫生间')
  return tags
}
