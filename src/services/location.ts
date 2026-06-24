import * as Location from 'expo-location'
import { Alert, Linking, Platform, AppState } from 'react-native'
import type { NavigationTarget } from '../types'
import { wgs84ToGcj02 } from '../utils/coords'

/**
 * 请求定位权限并获取当前位置（强制从 GPS 获取，不使用缓存）
 */
export async function getCurrentPosition(): Promise<{
  lat: number
  lng: number
} | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        '需要位置权限 🛰️',
        '打开位置权限，指厕针才能帮你找到最近的厕所哦',
        [
          { text: '不了', style: 'cancel' },
          { text: '去打开', onPress: () => Linking.openSettings() },
        ]
      )
      return null
    }

    // BestForNavigation 精度 + timeInterval 等待足够精度的位置
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 2000, // 至少等 2s 获取高精度位置
    })

    // WGS-84 → GCJ-02，匹配国内地图底图
    const gcj = wgs84ToGcj02(pos.coords.latitude, pos.coords.longitude)
    return { lat: gcj.lat, lng: gcj.lng }
  } catch (error) {
    console.warn('获取定位失败:', error)
    return null
  }
}

/**
 * 持续监听位置变化，返回取消订阅函数
 */
export function watchPosition(
  onUpdate: (lat: number, lng: number) => void
): () => void {
  let sub: Location.LocationSubscription | null = null

  Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 10, // 移动 10m 以上才触发更新
      timeInterval: 3000, // 最少 3s 间隔
    },
    (pos) => {
      const gcj = wgs84ToGcj02(pos.coords.latitude, pos.coords.longitude)
      onUpdate(gcj.lat, gcj.lng)
    }
  ).then((s) => {
    sub = s
  })

  return () => {
    sub?.remove()
  }
}

/**
 * 获取地址描述（通过原生反向编码）
 */
export async function getAddressFromCoords(
  lng: number,
  lat: number
): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    })
    if (results.length > 0) {
      const r = results[0]
      return [r.city, r.district, r.street].filter(Boolean).join(' ')
    }
  } catch {
    // 兜底用坐标
  }
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

/**
 * 唤起三方地图导航
 *
 * 策略：
 * - iOS：优先高德 (iosamap://)，不可用时回退 Apple Maps
 * - Android：优先高德 (androidamap://)，不可用时回退 geo: Intent（系统默认地图）
 */
export function openNavigation(target: NavigationTarget): void {
  const { lat, lng, name } = target
  const encodedName = encodeURIComponent(name)

  if (Platform.OS === 'ios') {
    // path = 路线规划页，用户可点「步行」tab切换（高德不支持URL参数设默认）
    const gaodeUrl = `iosamap://path?sourceApplication=fingernavi&dlat=${lat}&dlon=${lng}&dev=0`
    const appleUrl = `http://maps.apple.com/?ll=${lat},${lng}&q=${encodedName}`

    let resolved = false

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        resolved = true
        sub.remove()
      }
    })

    Linking.openURL(gaodeUrl)

    setTimeout(() => {
      sub.remove()
      if (!resolved) {
        Linking.openURL(appleUrl)
      }
    }, 800)
  } else {
    const gaodeUrl = `androidamap://route?sourceApplication=fingernavi&dlat=${lat}&dlon=${lng}&dev=0`
    const geoUrl = `geo:${lat},${lng}?q=${encodedName}`

    Linking.openURL(gaodeUrl).catch(() => {
      Linking.openURL(geoUrl)
    })
  }
}

/**
 * 计算两点之间的距离 (Haversine) 返回米
 */
export function calcDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`
  return `${(meters / 1000).toFixed(1)}km`
}
