import React, { useRef, useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import { COLORS, SHADOWS, SPACING, AMAP } from '../constants'
import { buildAmapHtml } from '../services/amapHtml'
import type { Toilet } from '../types'

interface Props {
  toilets: Toilet[]
  userLat: number
  userLng: number
  selectedToiletId?: string
  onToiletPress?: (toilet: Toilet) => void
  onOpenDetail?: (toilet: Toilet) => void
  onMapPress?: () => void
  onUserLocationPress?: () => void
}

export function AmapView({
  toilets,
  userLat,
  userLng,
  selectedToiletId,
  onToiletPress,
  onOpenDetail,
  onMapPress,
  onUserLocationPress,
}: Props) {
  const webRef = useRef<WebView>(null)
  const [ready, setReady] = useState(false)
  const isReady = useRef(false)
  const html = useRef(buildAmapHtml(AMAP.API_KEY)).current

  const handleMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data)
        switch (msg.type) {
          case 'ready':
            isReady.current = true
            setReady(true)
            break
          case 'markerClick': {
            const t = toilets.find((x) => x.id === msg.data.id)
            if (t) onToiletPress?.(t)
            break
          }
          case 'openDetail': {
            const t = toilets.find((x) => x.id === msg.data.id)
            if (t) onOpenDetail?.(t)
            break
          }
          case 'mapClick':
            onMapPress?.()
            break
          case 'loadError':
            console.warn('高德 JS API 加载失败')
            setReady(true) // 不再无限 loading
            break
        }
      } catch {}
    },
    [toilets, onToiletPress, onOpenDetail, onMapPress]
  )

  useEffect(() => {
    if (!ready || !userLat || !userLng || !toilets.length) return
    const data = buildToiletData(toilets)
    injectJS(
      `initMap(${userLat}, ${userLng});setToilets(${JSON.stringify(data)}, ${selectedToiletId ? `'${selectedToiletId}'` : 'null'});`
    )
  }, [ready, userLat, userLng])

  useEffect(() => {
    if (!isReady.current || !toilets.length) return
    const data = buildToiletData(toilets)
    injectJS(
      `setToilets(${JSON.stringify(data)}, ${selectedToiletId ? `'${selectedToiletId}'` : 'null'});`
    )
  }, [toilets.map((t) => t.id).join(','), selectedToiletId])

  useEffect(() => {
    if (!isReady.current || !userLat || !userLng) return
    injectJS(`updateUserLocation(${userLat}, ${userLng});`)
  }, [userLat, userLng])

  const injectJS = (code: string) => {
    webRef.current?.injectJavaScript(code)
  }

  const handleLocate = () => {
    if (!isReady.current) return
    injectJS(`initMap(${userLat}, ${userLng});`)
    onUserLocationPress?.()
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{ html }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        mixedContentMode="compatibility"
        androidLayerType="hardware"
        originWhitelist={['*']}
      />

      {!ready && (
        <View style={styles.loading}>
          <Text style={styles.loadingEmoji}>🗺️</Text>
          <Text style={styles.loadingText}>地图加载中...</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.locBtn}
        onPress={handleLocate}
        activeOpacity={0.8}
      >
        <Text style={styles.locBtnIcon}>◎</Text>
      </TouchableOpacity>

      {toilets.length > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>🚻 {toilets.length} 个厕所</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, backgroundColor: COLORS.background },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  loadingEmoji: { fontSize: 40 },
  loadingText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  locBtn: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: 180,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  locBtnIcon: { fontSize: 20, color: COLORS.primary },
  countBadge: {
    position: 'absolute',
    left: SPACING.lg,
    top: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    ...SHADOWS.small,
  },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
})

function buildToiletData(ts: Toilet[]) {
  return ts.map((t) => ({
    id: t.id,
    name: t.name,
    lat: t.lat,
    lng: t.lng,
    distance: t.distance,
    isFree: t.isFree,
    hasAccessible: t.hasAccessible,
  }))
}
