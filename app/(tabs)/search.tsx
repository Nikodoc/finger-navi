import { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, FONT_SIZE, SPACING, RADIUS, SHADOWS } from '../../src/constants'
import { useToiletStore } from '../../src/stores/useToiletStore'
import { useLocationStore } from '../../src/stores/useLocationStore'
import { useFilterStore } from '../../src/stores/useFilterStore'
import { SearchBar } from '../../src/components/SearchBar'
import { ToiletCard } from '../../src/components/ToiletCard'
import { FilterSheet } from '../../src/components/FilterSheet'
import { EmptyState, Skeleton } from '../../src/components/EmptyState'
import { searchPlace, searchNearbyToilets } from '../../src/services/amap'
import { openNavigation, calcDistance } from '../../src/services/location'
import type { Toilet } from '../../src/types'

export default function SearchScreen() {
  const router = useRouter()
  const { lat, lng } = useLocationStore()
  const { toilets, loading, setToilets, setLoading } = useToiletStore()
  const { filter } = useFilterStore()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<
    { name: string; address: string; lat: number; lng: number }[]
  >([])
  const [showFilter, setShowFilter] = useState(false)

  // 搜索地点
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    Keyboard.dismiss()
    setSearching(true)

    try {
      const places = await searchPlace(query.trim())
      setResults(places)

      if (places.length > 0) {
        setLoading(true)
        const ts = await searchNearbyToilets(places[0].lng, places[0].lat)
        setToilets(ts)
      } else {
        setToilets([])
      }
    } catch (err) {
      console.warn('搜索失败:', err)
      setToilets([])
    } finally {
      setSearching(false)
    }
  }, [query])

  // 按距离排序
  const sortedToilets = useMemo(() => {
    if (results.length === 0) return toilets
    const center = results[0]
    return [...toilets].sort(
      (a, b) =>
        calcDistance(center.lat, center.lng, a.lat, a.lng) -
        calcDistance(center.lat, center.lng, b.lat, b.lng)
    )
  }, [toilets, results])

  const handleNavigate = useCallback((t: Toilet) => {
    openNavigation({ name: t.name, lat: t.lat, lng: t.lng, address: t.address })
  }, [])

  const hasSearched = results.length > 0 || toilets.length > 0

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>找找</Text>
        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          style={styles.filterHeaderBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.filterHeaderText}>筛选</Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="输入地名，搜搜附近有没有厕所（如：三里屯）"
        autoFocus
        onSubmitEditing={handleSearch}
      />

      <TouchableOpacity
        style={[styles.searchBtn, (!query.trim() || searching) && styles.searchBtnDisabled]}
        onPress={handleSearch}
        disabled={!query.trim() || searching}
        activeOpacity={0.8}
      >
        <Text style={styles.searchBtnText}>
          {searching ? '🔍 四处搜罗中...' : '搜一下附近的厕所'}
        </Text>
      </TouchableOpacity>

      {/* Results summary */}
      {results.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryIcon}>📍</Text>
          <Text style={styles.summaryText}>
            以 <Text style={styles.summaryHighlight}>{results[0].name}</Text> 为中心，
            找到 <Text style={styles.summaryHighlight}>{sortedToilets.length}</Text> 个厕所
          </Text>
        </View>
      )}

      {/* Toilet list */}
      {loading ? (
        <Skeleton lines={4} />
      ) : sortedToilets.length > 0 ? (
        <FlatList
          data={sortedToilets}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <ToiletCard
              toilet={item}
              currentLat={results[0]?.lat ?? lat}
              currentLng={results[0]?.lng ?? lng}
              compact
              onPress={() => router.push(`/toilet/${item.id}`)}
              onNavigate={() => handleNavigate(item)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <EmptyState
          icon={hasSearched ? '😕' : '🔎'}
          title={hasSearched ? '没有找到厕所' : '搜索地点查厕所'}
          message={
            hasSearched
              ? '试试换个地点或扩大搜索范围'
              : '输入地址或地点名，搜索附近的公共厕所'
          }
        />
      )}

      <FilterSheet visible={showFilter} onClose={() => setShowFilter(false)} />
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
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 18,
    color: COLORS.text,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  filterHeaderBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
  },
  filterHeaderText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '700',
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  searchBtnDisabled: {
    opacity: 0.5,
  },
  searchBtnText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  summaryIcon: {
    fontSize: 14,
  },
  summaryText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  summaryHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
})
