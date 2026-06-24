import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { COLORS, FONT_SIZE, SPACING, SHADOWS, GLOW } from '../constants'
import { bearing } from '../utils/bearing'
import { formatDistance } from '../services/location'

interface Props {
  userLat: number
  userLng: number
  targetLat: number
  targetLng: number
  targetName: string
  distance: number
  onPress?: () => void
}

export function CompassNeedle({
  userLat,
  userLng,
  targetLat,
  targetLng,
  targetName,
  distance,
  onPress,
}: Props) {
  const rotateAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const glowAnim = useRef(new Animated.Value(0)).current

  // 计算方位角并动画旋转
  useEffect(() => {
    const deg = bearing(userLat, userLng, targetLat, targetLng)
    Animated.spring(rotateAnim, {
      toValue: deg,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start()
  }, [userLat, userLng, targetLat, targetLng])

  // 脉冲光晕
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    )
    glow.start()

    return () => {
      pulse.stop()
      glow.stop()
    }
  }, [])

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  })

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  })

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* 外层光晕 */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            opacity: glowOpacity,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* 刻度盘 */}
      <View style={styles.dial}>
        {/* N S W E 标记 */}
        <Text style={[styles.dirMark, styles.dirN]}>N</Text>
        <Text style={[styles.dirMark, styles.dirS]}>S</Text>
        <Text style={[styles.dirMark, styles.dirW]}>W</Text>
        <Text style={[styles.dirMark, styles.dirE]}>E</Text>

        {/* 刻度点 */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <View
            key={deg}
            style={[
              styles.tick,
              deg % 90 === 0 && styles.tickMajor,
              {
                transform: [
                  { rotate: `${deg}deg` },
                  { translateY: -42 },
                ],
              },
            ]}
          />
        ))}

        {/* 旋转指针 */}
        <Animated.View
          style={[
            styles.needleWrap,
            { transform: [{ rotate }] },
          ]}
        >
          {/* 针尖 */}
          <View style={styles.needleHead}>
            <View style={styles.needleArrow} />
          </View>
          {/* 针尾 */}
          <View style={styles.needleTail}>
            <View style={styles.needleTailArrow} />
          </View>
        </Animated.View>

        {/* 中心圆 */}
        <View style={styles.center}>
          <Text style={styles.centerIcon}>🚻</Text>
        </View>
      </View>

      {/* 距离和名称 */}
      <View style={styles.info}>
        <Text style={styles.infoDist}>{formatDistance(distance)}</Text>
        <Text style={styles.infoName} numberOfLines={1}>
          {targetName}
        </Text>
        <Text style={styles.infoHint}>点我带路 →</Text>
      </View>
    </TouchableOpacity>
  )
}

const SIZE = 140
const INNER = 90

const styles = StyleSheet.create({
  wrap: {
    width: SIZE + 40,
    alignItems: 'center',
  },

  // 光晕
  glowRing: {
    position: 'absolute',
    top: 10,
    width: SIZE + 10,
    height: SIZE + 10,
    borderRadius: (SIZE + 10) / 2,
    backgroundColor: '#0098FF',
    opacity: 0.15,
  },

  // 刻度盘
  dial: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: 'rgba(17,24,39,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,152,255,0.25)',
    ...GLOW.cyan,
  },

  // 方向标记
  dirMark: {
    position: 'absolute',
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textTertiary,
  },
  dirN: { top: 8, alignSelf: 'center' },
  dirS: { bottom: 8, alignSelf: 'center' },
  dirW: { left: 10, top: SIZE / 2 - 8 },
  dirE: { right: 10, top: SIZE / 2 - 8 },

  // 刻度
  tick: {
    position: 'absolute',
    width: 2,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 1,
    top: SIZE / 2 - 3,
    alignSelf: 'center',
  },
  tickMajor: {
    width: 2.5,
    height: 10,
    backgroundColor: COLORS.textTertiary,
    top: SIZE / 2 - 5,
  },

  // 指针
  needleWrap: {
    position: 'absolute',
    width: INNER,
    height: INNER,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  needleHead: {
    alignItems: 'center',
  },
  needleArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.danger,
  },
  needleTail: {
    alignItems: 'center',
  },
  needleTailArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.textTertiary,
  },

  // 中心
  center: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
    zIndex: 10,
  },
  centerIcon: {
    fontSize: 14,
  },

  // 距离信息
  info: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(17,24,39,0.92)',
    borderRadius: 16,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,152,255,0.2)',
    ...GLOW.subtle,
  },
  infoDist: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    color: COLORS.primary,
  },
  infoName: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    maxWidth: 120,
    textAlign: 'center',
  },
  infoHint: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
})
