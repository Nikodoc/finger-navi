import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native'
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../constants'
import { useFilterStore } from '../stores/useFilterStore'

interface Props {
  visible: boolean
  onClose: () => void
}

const DISTANCE_OPTIONS = [
  { label: '500m', value: 500 },
  { label: '1km', value: 1000 },
  { label: '3km', value: 3000 },
  { label: '5km', value: 5000 },
]

const RATING_OPTIONS = [
  { label: '不限', value: 0 },
  { label: '3.5+', value: 3.5 },
  { label: '4.0+', value: 4.0 },
  { label: '4.5+', value: 4.5 },
]

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6

export function FilterSheet({ visible, onClose }: Props) {
  const { filter, setFilter, resetFilter } = useFilterStore()
  const anim = useRef(new Animated.Value(0)).current
  const [mounted, setMounted] = React.useState(false)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 28,
        stiffness: 300,
      }).start()
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMounted(false))
    }
  }, [visible])

  if (!mounted) return null

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View
        style={[styles.backdrop, { opacity: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.4],
        }) }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [SHEET_HEIGHT, 0],
              }),
            }],
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>提点要求</Text>
          <TouchableOpacity onPress={resetFilter} activeOpacity={0.6}>
            <Text style={styles.resetBtn}>重置</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bodyContent}
        >
          {/* 距离范围 */}
          <FilterSection title="距离范围">
            <View style={styles.optionRow}>
              {DISTANCE_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt.value}
                  label={opt.label}
                  active={filter.maxDistance === opt.value}
                  onPress={() => setFilter({ maxDistance: opt.value })}
                />
              ))}
            </View>
          </FilterSection>

          {/* 最低评分 */}
          <FilterSection title="最低评分">
            <View style={styles.optionRow}>
              {RATING_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt.value}
                  label={opt.label}
                  active={filter.minRating === opt.value}
                  onPress={() => setFilter({ minRating: opt.value })}
                />
              ))}
            </View>
          </FilterSection>

          {/* 收费情况 */}
          <FilterSection title="收费情况">
            <View style={styles.optionRow}>
              <OptionChip
                label="不限"
                active={filter.isFree === null}
                onPress={() => setFilter({ isFree: null })}
              />
              <OptionChip
                label="🆓 免费"
                active={filter.isFree === true}
                onPress={() => setFilter({ isFree: true })}
              />
              <OptionChip
                label="💰 收费"
                active={filter.isFree === false}
                onPress={() => setFilter({ isFree: false })}
              />
            </View>
          </FilterSection>

          {/* 设施要求 */}
          <FilterSection title="设施要求">
            <SwitchRow
              icon="♿"
              label="无障碍设施"
              value={filter.hasAccessible}
              onValueChange={(v) => setFilter({ hasAccessible: v })}
            />
            <SwitchRow
              icon="🍼"
              label="母婴室"
              value={filter.hasBabyRoom}
              onValueChange={(v) => setFilter({ hasBabyRoom: v })}
            />
          </FilterSection>
        </ScrollView>

        {/* 底部确认按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>确认</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  )
}

function FilterSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function OptionChip({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

function SwitchRow({
  icon,
  label,
  value,
  onValueChange,
}: {
  icon: string
  label: string
  value: boolean
  onValueChange: (v: boolean) => void
}) {
  return (
    <TouchableOpacity
      style={styles.switchRow}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
    >
      <View style={styles.switchLeft}>
        <Text style={styles.switchIcon}>{icon}</Text>
        <Text style={styles.switchLabel}>{label}</Text>
      </View>
      <View style={[styles.toggle, value && styles.toggleActive]}>
        <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: SHEET_HEIGHT,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.textTertiary,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  resetBtn: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: SPACING.xl,
  },
  bodyContent: {
    paddingBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#0A0E17',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  switchIcon: {
    fontSize: 16,
  },
  switchLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: 40,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: '#FFFFFF',
  },
})
