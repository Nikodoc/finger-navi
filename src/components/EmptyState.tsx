import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { COLORS, FONT_SIZE, SPACING } from '../constants'

interface Props {
  title?: string
  message?: string
  icon?: string
}

export function EmptyState({
  title = '附近还没有发现厕所 😅',
  message = '换个地方逛逛，或者搜索其他位置',
  icon = '🚽',
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  const pulseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  })

  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <Animated.View style={[styles.bone, styles.boneTitle, { opacity }]} />
          <Animated.View style={[styles.bone, styles.boneMeta, { opacity: opacity.interpolate({
            inputRange: [0.3, 0.7],
            outputRange: [0.2, 0.5],
          }) }]} />
          <View style={styles.boneRow}>
            <Animated.View style={[styles.bone, styles.boneTag, { opacity }]} />
            <Animated.View style={[styles.bone, styles.boneBtn, { opacity }]} />
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxxl,
    paddingTop: SPACING.xxxl * 1.5,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  skeletonWrap: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  skeletonCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  bone: {
    backgroundColor: COLORS.border,
    borderRadius: 6,
  },
  boneTitle: {
    width: '60%',
    height: 18,
  },
  boneMeta: {
    width: '40%',
    height: 12,
  },
  boneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  boneTag: {
    flex: 1,
    height: 24,
    borderRadius: 12,
  },
  boneBtn: {
    width: 60,
    height: 32,
    borderRadius: 16,
  },
})
