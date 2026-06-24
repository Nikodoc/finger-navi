import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { COLORS, FONT_SIZE, SPACING, RADIUS, SHADOWS } from '../constants'
import { RatingStars } from './RatingStars'
import type { Toilet } from '../types'
import { formatDistance } from '../utils/distance'
import { calcDistance } from '../services/location'

interface Props {
  toilet: Toilet
  currentLat?: number
  currentLng?: number
  rank?: number
  onPress?: () => void
  onNavigate?: () => void
  compact?: boolean
}

export function ToiletCard({
  toilet,
  currentLat,
  currentLng,
  rank,
  onPress,
  onNavigate,
  compact = false,
}: Props) {
  const dist =
    toilet.distance ??
    (currentLat !== undefined && currentLng !== undefined
      ? calcDistForDisplay(currentLat, currentLng, toilet.lat, toilet.lng)
      : undefined)

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compact}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View style={styles.compactRow}>
          <View style={styles.compactLeft}>
            <View style={styles.nameRow}>
              {rank !== undefined && (
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{rank}</Text>
                </View>
              )}
              <Text style={styles.compactName} numberOfLines={1}>
                {toilet.name}
              </Text>
            </View>
            <View style={styles.compactMeta}>
              {dist !== undefined && (
                <Text style={styles.metaLabel}>距{formatDistance(dist)}</Text>
              )}
              <Text style={styles.metaLabel}>|</Text>
              <RatingStars rating={toilet.rating} size={11} />
            </View>
          </View>

          <View style={styles.compactTags}>
            {toilet.isFree && <Tag label="免费" color={COLORS.free} />}
            {toilet.hasAccessible && <Tag label="无障碍" color={COLORS.primary} />}
            {toilet.hasBabyRoom && <Tag label="母婴" color="#FF69B4" />}
          </View>

          <TouchableOpacity style={styles.navBtn} onPress={onNavigate}>
            <Text style={styles.navBtnIcon}>↗</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  // Full card
  return (
    <TouchableOpacity
      style={[styles.card, SHADOWS.medium]}
      activeOpacity={0.95}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardName} numberOfLines={1}>
          {toilet.name}
        </Text>
        {toilet.source === 'user' && (
          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>用户提供</Text>
          </View>
        )}
      </View>

      <View style={styles.cardMeta}>
        {dist !== undefined && (
          <MetaItem
            icon="📍"
            text={`${formatDistance(dist)}`}
            highlight
          />
        )}
        <MetaItem icon="📭" text={toilet.address.slice(0, 20)} />
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.cardBottomLeft}>
          <RatingStars
            rating={toilet.rating}
            size={14}
            count={toilet.ratingCount}
            showCount
          />
          <View style={styles.tagRow}>
            {toilet.isFree && <Tag label="免费" color={COLORS.free} />}
            {toilet.hasAccessible && <Tag label="无障碍" color={COLORS.primary} />}
            {toilet.hasBabyRoom && <Tag label="母婴室" color="#FF69B4" />}
            {toilet.tags?.map((t) => (
              <Tag key={t} label={t} color={COLORS.textSecondary} />
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.navBtnLarge} onPress={onNavigate}>
          <Text style={styles.navBtnLargeText}>走起</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tag, { borderColor: color }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  )
}

function MetaItem({
  icon,
  text,
  highlight,
}: {
  icon: string
  text: string
  highlight?: boolean
}) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <Text
        style={[styles.metaText, highlight && styles.metaTextHighlight]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  )
}

function calcDistForDisplay(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return calcDistance(lat1, lng1, lat2, lng2)
}

const styles = StyleSheet.create({
  // Full card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  cardName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  userBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  userBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardBottomLeft: {
    gap: SPACING.sm,
  },
  tagRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  tag: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
  },
  tagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  metaTextHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  navBtnLarge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  navBtnLargeText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Compact card
  compact: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  compactLeft: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  rankBadge: {
    backgroundColor: COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  compactName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  compactTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnIcon: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
})
