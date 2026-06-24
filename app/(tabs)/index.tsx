import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, FONT_SIZE, SPACING, RADIUS, SHADOWS } from '../../src/constants'
import { useToiletStore } from '../../src/stores/useToiletStore'
import { useLocationStore } from '../../src/stores/useLocationStore'
import { useFilterStore } from '../../src/stores/useFilterStore'
import { AmapView } from '../../src/components/AmapView'
import { CompassNeedle } from '../../src/components/CompassNeedle'
import { ToiletCard } from '../../src/components/ToiletCard'
import { EmptyState, Skeleton } from '../../src/components/EmptyState'
import { searchNearbyToilets } from '../../src/services/amap'
import { getCurrentPosition, openNavigation, watchPosition } from '../../src/services/location'
import type { Toilet } from '../../src/types'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const SHEET_MIN = 160
const SHEET_MAX = SCREEN_HEIGHT * 0.55

export default function MapScreen() {
  const router = useRouter()
  const { lat, lng, loaded, setLocation, setError } = useLocationStore()
  const { toilets, selectedToilet, loading, setToilets, selectToilet, setLoading } =
    useToiletStore()
  const { filter } = useFilterStore()

  const sheetAnim = useRef(new Animated.Value(SHEET_MIN)).current
  const sheetExpanded = useRef(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const lastSheetY = useRef(SHEET_MIN)

  // 首次加载定位
  useEffect(() => {
    if (loaded) return
    getCurrentPosition().then((pos) => {
      if (pos) setLocation(pos.lat, pos.lng)
      else setError('哎呀，定位失败了')
    })
  }, [])

  // 持续追踪位置
  useEffect(() => {
    if (!loaded) return
    const stop = watchPosition((newLat, newLng) => {
      setLocation(newLat, newLng)
    })
    return stop
  }, [loaded])

  // 位置就绪后加载数据
  useEffect(() => {
    if (!loaded) return
    setLoading(true)
    searchNearbyToilets(lng, lat)
      .then(setToilets)
      .catch((err) => {
        console.warn('厕所搜索失败:', err)
        setToilets([])
      })
  }, [loaded, lat, lng])

  // 筛选 + 按距离排序，保证地图序号和列表序号一致
  const filteredToilets = useMemo(() => {
    return toilets
      .filter((t) => {
        if (filter.minRating > 0 && t.rating < filter.minRating) return false
        if (filter.isFree !== null && t.isFree !== filter.isFree) return false
        if (filter.hasAccessible && !t.hasAccessible) return false
        if (filter.hasBabyRoom && !t.hasBabyRoom) return false
        return true
      })
      .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))
  }, [toilets, filter])

  // 展开/收起 sheet
  const animateSheet = useCallback(
    (toValue: number) => {
      Animated.spring(sheetAnim, {
        toValue,
        useNativeDriver: false,
        damping: 25,
        stiffness: 250,
        mass: 0.8,
      }).start()
      lastSheetY.current = toValue
    },
    [sheetAnim]
  )

  const snapSheet = useCallback(
    (currentY: number) => {
      const mid = (SHEET_MIN + SHEET_MAX) / 2
      if (currentY < mid) {
        sheetExpanded.current = true
        setIsExpanded(true)
        animateSheet(SHEET_MAX)
      } else {
        sheetExpanded.current = false
        setIsExpanded(false)
        animateSheet(SHEET_MIN)
      }
    },
    [animateSheet]
  )

  // PanResponder 实现拖拽底部面板
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        sheetAnim.extractOffset()
      },
      onPanResponderMove: (_, g) => {
        const newY = lastSheetY.current - g.dy
        const clamped = Math.max(SHEET_MIN, Math.min(SHEET_MAX, newY))
        sheetAnim.setValue(clamped)
      },
      onPanResponderRelease: (_, g) => {
        sheetAnim.flattenOffset()
        const targetY = lastSheetY.current - g.dy + (g.vy > 0 ? -60 : g.vy < 0 ? 60 : 0)
        snapSheet(targetY)
      },
    })
  ).current

  const handleToiletPress = useCallback(
    (toilet: Toilet) => {
      selectToilet(toilet)
    },
    [selectToilet]
  )

  const handleNavigate = useCallback((toilet: Toilet) => {
    openNavigation({
      name: toilet.name,
      lat: toilet.lat,
      lng: toilet.lng,
      address: toilet.address,
    })
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>🚽</Text>
          <Text style={styles.appName}>指厕针</Text>
        </View>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => router.push('/search')}
          activeOpacity={0.7}
        >
          <Text style={styles.searchIconHeader}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* 定位中 — 先不渲染地图，避免北京坐标闪跳 */}
      {!loaded ? (
        <View style={styles.locatingWrap}>
          <Text style={styles.locatingEmoji}>🛰️</Text>
          <Text style={styles.locatingText}>正在搜寻你的位置...</Text>
          <Text style={styles.locatingHint}>请允许访问位置信息，帮你找到最近的 🚻</Text>
        </View>
      ) : (
        <>
          {/* 高德地图 */}
          <AmapView
            toilets={filteredToilets}
            userLat={lat}
            userLng={lng}
            selectedToiletId={selectedToilet?.id}
            onToiletPress={handleToiletPress}
            onOpenDetail={(t) => router.push(`/toilet/${t.id}`)}
            onUserLocationPress={() =>
              getCurrentPosition().then((p) => {
                if (p) setLocation(p.lat, p.lng)
              })
            }
          />

          {/* 指厕针罗盘 */}
          {filteredToilets.length > 0 && lat !== 0 && (
            <View style={styles.compassWrap} pointerEvents="box-none">
              <CompassNeedle
                userLat={lat}
                userLng={lng}
                targetLat={filteredToilets[0].lat}
                targetLng={filteredToilets[0].lng}
                targetName={filteredToilets[0].name}
                distance={filteredToilets[0].distance ?? 0}
                onPress={() => {
                  selectToilet(filteredToilets[0])
                  openNavigation({
                    name: filteredToilets[0].name,
                    lat: filteredToilets[0].lat,
                    lng: filteredToilets[0].lng,
                    address: filteredToilets[0].address,
                  })
                }}
              />
            </View>
          )}

          {/* Bottom Sheet */}
          <Animated.View style={[styles.sheet, { height: sheetAnim }]}>
            <View style={styles.sheetHandle} {...panResponder.panHandlers}>
              <View style={styles.handleBar} />
            </View>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {loading ? '🔍 正在扫描周边...' : `附近 ${filteredToilets.length} 个厕所`}
              </Text>
              <TouchableOpacity
                style={styles.filterBtn}
                onPress={() => router.push('/search')}
                activeOpacity={0.7}
              >
                <Text style={styles.filterBtnText}>筛选</Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              <Skeleton lines={4} />
            ) : filteredToilets.length === 0 ? (
              <EmptyState />
            ) : (
              <FlatList
                data={filteredToilets}
                keyExtractor={(t) => t.id}
                renderItem={({ item, index }) => (
                  <ToiletCard
                    toilet={item}
                    currentLat={lat}
                    currentLng={lng}
                    rank={index + 1}
                    compact
                    onPress={() => router.push(`/toilet/${item.id}`)}
                    onNavigate={() => handleNavigate(item)}
                  />
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                bounces={!isExpanded}
              />
            )}
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    ...SHADOWS.small,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logo: {
    fontSize: 24,
  },
  appName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerRight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconHeader: {
    fontSize: 16,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    ...SHADOWS.large,
    overflow: 'hidden',
  },
  sheetHandle: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.textTertiary,
    opacity: 0.6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  sheetTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  filterBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
  },
  filterBtnText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
  locatingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  locatingEmoji: {
    fontSize: 48,
  },
  locatingText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  locatingHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  compassWrap: {
    position: 'absolute',
    bottom: SHEET_MIN + 16,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
})
