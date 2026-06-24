import { useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, FONT_SIZE, SPACING, RADIUS, SHADOWS } from '../../src/constants'
import { useToiletStore } from '../../src/stores/useToiletStore'
import { useLocationStore } from '../../src/stores/useLocationStore'
import { useUserStore } from '../../src/stores/useUserStore'
import { RatingStars } from '../../src/components/RatingStars'
import { openNavigation, formatDistance, calcDistance } from '../../src/services/location'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function ToiletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const toilet = useToiletStore((s) =>
    [...s.toilets, ...s.userToilets].find((t) => t.id === id)
  )
  const { lat: userLat, lng: userLng } = useLocationStore()
  const addToHistory = useUserStore((s) => s.addToHistory)
  const toggleFavorite = useUserStore((s) => s.toggleFavorite)
  // 直接订阅 favorites 数组，切换后立即重渲染
  const favorited = useUserStore((s) =>
    s.favorites.some((f) => f.id === id)
  )

  const dist =
    toilet && userLat && userLng
      ? calcDistance(userLat, userLng, toilet.lat, toilet.lng)
      : undefined

  // 浏览记录
  useEffect(() => {
    if (toilet) addToHistory(toilet)
  }, [toilet?.id])

  const handleNavigate = useCallback(() => {
    if (!toilet) return
    openNavigation({
      name: toilet.name,
      lat: toilet.lat,
      lng: toilet.lng,
      address: toilet.address,
    })
  }, [toilet])

  if (!toilet) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.noItem}>
          <View style={styles.noItemIcon}>
            <Text style={styles.noItemEmoji}>🚽</Text>
          </View>
          <Text style={styles.noItemText}>这个厕所走丢了 😵</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.noItemLink} activeOpacity={0.7}>
            <Text style={styles.noItemLinkText}>← 返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header 透明栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>厕所详情</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 头图 */}
        <View style={styles.hero}>
          {toilet.photos.length > 0 ? (
            <Image
              source={{ uri: toilet.photos[0] }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroEmoji}>🚻</Text>
            </View>
          )}
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>
                  {toilet.source === 'amap' ? '高德地图' : '用户贡献'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.favBtn, favorited && styles.favBtnActive]}
                onPress={() => toggleFavorite(toilet)}
                activeOpacity={0.7}
              >
                <Text style={styles.favBtnIcon}>{favorited ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.heroName}>{toilet.name}</Text>
            <View style={styles.heroMeta}>
              {dist !== undefined && (
                <View style={styles.heroDistBadge}>
                  <Text style={styles.heroDistText}>📍 {formatDistance(dist)}</Text>
                </View>
              )}
              <RatingStars rating={toilet.rating} size={14} />
            </View>
          </View>
        </View>

        {/* 基本信息卡片 */}
        <View style={styles.infoCard}>
          <InfoRow icon="📍" label="地址" value={toilet.address} />
          <InfoRow
            icon="🕐"
            label="开放时间"
            value={toilet.openTime || '未知（请以实际为准）'}
          />
          <InfoRow
            icon="💵"
            label="收费"
            value={toilet.isFree ? '免费' : '收费'}
            valueColor={toilet.isFree ? COLORS.success : COLORS.warning}
          />
          {toilet.notes && (
            <InfoRow icon="📝" label="备注" value={toilet.notes} />
          )}
        </View>

        {/* 设施标签 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠 设施</Text>
          <View style={styles.amenityGrid}>
            <AmenityBadge label="无障碍" active={toilet.hasAccessible} activeEmoji="♿" />
            <AmenityBadge label="母婴室" active={toilet.hasBabyRoom} activeEmoji="🍼" />
            <AmenityBadge label="蹲便" active={toilet.isSquatToilet} activeEmoji="🚽" />
            <AmenityBadge label="坐便" active={!toilet.isSquatToilet} activeEmoji="🧻" />
          </View>
        </View>

        {/* 评分区 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ 评分</Text>
          <View style={styles.ratingCard}>
            <View style={styles.ratingBig}>
              <Text style={styles.ratingNum}>{toilet.rating.toFixed(1)}</Text>
              <RatingStars rating={toilet.rating} size={22} />
              {toilet.ratingCount > 0 ? (
                <Text style={styles.ratingCount}>
                  {toilet.ratingCount} 人评价
                </Text>
              ) : (
                <Text style={styles.ratingCount}>暂无评价</Text>
              )}
            </View>
            <TouchableOpacity style={styles.rateBtn} activeOpacity={0.7}>
              <Text style={styles.rateBtnText}>✍️ 写评价</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 底部固定操作栏 */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={handleNavigate}
            activeOpacity={0.8}
          >
            <Text style={styles.navBtnIcon}>↗</Text>
            <Text style={styles.navBtnLabel}>带我去！</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: string
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  )
}

function AmenityBadge({
  label,
  active,
  activeEmoji,
}: {
  label: string
  active: boolean
  activeEmoji: string
}) {
  return (
    <View style={[styles.amenityBadge, active && styles.amenityActive]}>
      <Text style={styles.amenityEmoji}>
        {active ? activeEmoji : '❌'}
      </Text>
      <Text style={[styles.amenityLabel, active && styles.amenityLabelActive]}>
        {label}
      </Text>
      <View style={[styles.amenityDot, active && styles.amenityDotActive]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    zIndex: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  noItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  noItemIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noItemEmoji: {
    fontSize: 36,
  },
  noItemText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
  },
  noItemLink: {
    marginTop: SPACING.sm,
  },
  noItemLinkText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '700',
  },
  hero: {
    height: 240,
    justifyContent: 'flex-end',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: 240,
  },
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  favBtnActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  favBtnIcon: {
    fontSize: 20,
  },
  heroEmoji: {
    fontSize: 72,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  heroBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroDistBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  heroDistText: {
    fontSize: FONT_SIZE.sm,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 140,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: -SPACING.lg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
    gap: SPACING.sm,
  },
  infoIcon: {
    fontSize: 14,
    width: 24,
    textAlign: 'center',
    marginTop: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    width: 60,
    marginTop: 1,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  amenityGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  amenityBadge: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  amenityActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  amenityEmoji: {
    fontSize: 26,
    marginBottom: SPACING.xs,
  },
  amenityLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  amenityLabelActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  amenityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  amenityDotActive: {
    backgroundColor: COLORS.success,
  },
  ratingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  ratingBig: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  ratingNum: {
    fontSize: 52,
    fontWeight: '800',
    color: COLORS.warning,
  },
  ratingCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  rateBtn: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  rateBtnText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  bottomBarInner: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  navBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  navBtnIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navBtnLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
