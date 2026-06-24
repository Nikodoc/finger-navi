// 厕所 POI 数据模型
export interface Toilet {
  id: string
  name: string
  lat: number
  lng: number
  address: string
  distance?: number
  rating: number
  ratingCount: number
  isFree: boolean
  hasAccessible: boolean
  hasBabyRoom: boolean
  isSquatToilet: boolean
  openTime?: string
  notes?: string
  photos: string[]
  source: 'amap' | 'user'
  tags: string[]
}

// 筛选条件
export interface FilterOptions {
  maxDistance: number
  minRating: number
  isFree: boolean | null
  hasAccessible: boolean
  hasBabyRoom: boolean
}

// 高德 API 响应类型
export interface AmapPoi {
  id: string
  name: string
  location: string // "lng,lat"
  address: string
  distance: string
  biz_ext?: {
    rating?: string
    cost?: string
  }
  photos?: { url: string }[]
}

export interface AmapAroundResponse {
  status: string
  count: string
  pois: AmapPoi[]
}

// 用户提交的厕所数据
export interface ToiletSubmission {
  name: string
  lat: number
  lng: number
  address: string
  isFree: boolean
  hasAccessible: boolean
  hasBabyRoom: boolean
  isSquatToilet: boolean
  openTime?: string
  notes?: string
  photos: string[]
}

// 定位状态
export interface LocationState {
  lat: number
  lng: number
  loaded: boolean
  error: string | null
}

// 导航目标参数
export interface NavigationTarget {
  name: string
  lat: number
  lng: number
  address: string
}
