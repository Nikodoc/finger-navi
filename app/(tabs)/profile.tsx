import { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, FONT_SIZE, SPACING, RADIUS, SHADOWS } from '../../src/constants'
import { useUserStore } from '../../src/stores/useUserStore'
import { ToiletCard } from '../../src/components/ToiletCard'
import { EmptyState } from '../../src/components/EmptyState'
import { openNavigation } from '../../src/services/location'
import type { Toilet } from '../../src/types'

export default function ProfileScreen() {
  const router = useRouter()
  const { favorites, history } = useUserStore()

  const handleNavigate = useCallback((t: Toilet) => {
    openNavigation({ name: t.name, lat: t.lat, lng: t.lng, address: t.address })
  }, [])

  const handleClearHistory = useCallback(() => {
    Alert.alert('清空足迹', '确定要清空所有浏览记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清除',
        style: 'destructive',
        onPress: () => useUserStore.setState({ history: [] }),
      },
    ])
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 收藏 */}
        <SectionHeader
          icon="⭐"
          title="我的收藏"
          count={favorites.length}
        />
        {favorites.length > 0 ? (
          favorites.map((t) => (
            <ToiletCard
              key={t.id}
              toilet={t}
              compact
              onPress={() => router.push(`/toilet/${t.id}`)}
              onNavigate={() => handleNavigate(t)}
            />
          ))
        ) : (
          <EmptyState
            icon="⭐"
            title="还没有收藏哦"
            message="遇到好厕所就点个 ❤️ 收藏起来吧"
          />
        )}

        {/* 最近查看 */}
        <SectionHeader
          icon="🕐"
          title="我的足迹"
          count={history.length}
          action={history.length > 0 ? { label: '清空', onPress: handleClearHistory } : undefined}
        />
        {history.length > 0 ? (
          history.map((t) => (
            <ToiletCard
              key={`hist_${t.id}`}
              toilet={t}
              compact
              onPress={() => router.push(`/toilet/${t.id}`)}
              onNavigate={() => handleNavigate(t)}
            />
          ))
        ) : (
          <EmptyState
            icon="🕐"
            title="还没有足迹哦"
            message="去首页逛逛，看过的厕所会留在这里"
          />
        )}

        {/* 关于 */}
        <SectionHeader icon="ℹ️" title="关于" />
        <View style={styles.aboutCard}>
          <AboutRow label="应用名称" value="指厕针" />
          <AboutRow label="版本" value="1.0.0" />
          <AboutRow label="数据来源" value="高德地图 POI" />
          <AboutRow
            label="开源协议"
            value="MIT"
            onPress={() =>
              Alert.alert(
                'MIT License',
                'Copyright (c) 2025 指厕针\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software...'
              )
            }
          />
        </View>

        <Text style={styles.footer}>
          指厕针 —— 急了就来找我 🚽
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function SectionHeader({
  icon,
  title,
  count,
  action,
}: {
  icon: string
  title: string
  count?: number
  action?: { label: string; onPress: () => void }
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count !== undefined && count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress} activeOpacity={0.6}>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

function AboutRow({
  label,
  value,
  onPress,
}: {
  label: string
  value: string
  onPress?: () => void
}) {
  return (
    <TouchableOpacity
      style={styles.aboutRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.6}
    >
      <Text style={styles.aboutLabel}>{label}</Text>
      <Text style={[styles.aboutValue, onPress && styles.aboutLink]}>
        {value}
      </Text>
    </TouchableOpacity>
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
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.sm,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  countText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.danger,
    fontWeight: '600',
  },
  aboutCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  aboutLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  aboutValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  aboutLink: {
    color: COLORS.primary,
  },
  footer: {
    textAlign: 'center',
    marginTop: SPACING.xxxl,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
  },
})
