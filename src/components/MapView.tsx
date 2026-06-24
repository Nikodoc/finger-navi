import React, { useMemo, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import MapView, { Marker, Callout, Region } from 'react-native-maps'
import { COLORS, SHADOWS, SPACING, FONT_SIZE, RADIUS } from '../constants'
import { RatingStars } from './RatingStars'
import { formatDistance } from '../utils/distance'
import type { Toilet } from '../types'

interface Props {
  toilets: Toilet[]
  userLat: number
  userLng: number
  selectedToiletId?: string
  onToiletPress?: (toilet: Toilet) => void
  onMapPress?: () => void
  onUserLocationPress?: () => void
}

export function MapViewComponent({
  toilets,
  userLat,
  userLng,
  selectedToiletId,
  onToiletPress,
  onMapPress,
  onUserLocationPress,
}: Props) {
  const mapRef = useRef<MapView>(null)
  const prevCoords = useRef({ lat: 0, lng: 0 })

  // 用户位置首次获取或大幅变化时平滑移动地图
  useEffect(() => {
    const dist = Math.sqrt(
      Math.pow(userLat - prevCoords.current.lat, 2) +
        Math.pow(userLng - prevCoords.current.lng, 2)
    )
    // 距离 >500m 才自动移动，避免频繁抢夺用户手势
    if (dist > 0.005 || (prevCoords.current.lat === 0 && userLat !== 0)) {
      prevCoords.current = { lat: userLat, lng: userLng }
      mapRef.current?.animateToRegion(
        {
          latitude: userLat,
          longitude: userLng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        600
      )
    }
  }, [userLat, userLng])

  const region: Region = useMemo(
    () => ({
      latitude: userLat,
      longitude: userLng,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    }),
    [userLat, userLng]
  )

  // 点击标记时移动地图使其居中
  const handleMarkerPress = (t: Toilet) => {
    onToiletPress?.(t)
    mapRef.current?.animateToRegion(
      {
        latitude: t.lat,
        longitude: t.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      400
    )
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={onMapPress}
        rotateEnabled={false}
        pitchEnabled={false}
        userInterfaceStyle="light"
      >
        {toilets.map((t, idx) => {
          const isSelected = t.id === selectedToiletId

          return (
            <Marker
              key={t.id}
              coordinate={{ latitude: t.lat, longitude: t.lng }}
              onPress={() => handleMarkerPress(t)}
              tracksViewChanges={true}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View
                style={[
                  styles.markerPin,
                  isSelected && styles.markerPinSelected,
                ]}
              >
                <Text style={[styles.markerNum, isSelected && styles.markerNumSelected]}>
                  {idx + 1}
                </Text>
              </View>

              <Callout tooltip onPress={() => onToiletPress?.(t)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>{t.name}</Text>
                  <View style={styles.calloutRow}>
                    <RatingStars rating={t.rating} size={12} />
                    <Text style={styles.calloutMeta}>
                      {t.distance !== undefined ? formatDistance(t.distance) : ''}
                    </Text>
                  </View>
                  <View style={styles.calloutTags}>
                    {t.isFree && <View style={styles.calloutTag}><Text style={styles.calloutTagText}>免费</Text></View>}
                    {t.hasAccessible && <View style={styles.calloutTag}><Text style={styles.calloutTagText}>无障碍</Text></View>}
                  </View>
                  <Text style={styles.calloutHint}>戳我看详情 →</Text>
                </View>
              </Callout>
            </Marker>
          )
        })}
      </MapView>

      {/* 定位按钮 */}
      <TouchableOpacity
        style={styles.locBtn}
        onPress={onUserLocationPress}
        activeOpacity={0.8}
      >
        <Text style={styles.locBtnIcon}>◎</Text>
      </TouchableOpacity>

      {/* 厕所数量指示器 */}
      {toilets.length > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            🚻 {toilets.length}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // Marker pin
  markerPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.small,
  },
  markerPinSelected: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warning,
    borderWidth: 2.5,
    ...SHADOWS.medium,
  },
  markerNum: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  markerNumSelected: {
    fontSize: 15,
    color: '#FFFFFF',
  },

  // Callout bubble
  callout: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minWidth: 160,
    maxWidth: 200,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  calloutName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  calloutMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  calloutTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  calloutTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
  },
  calloutTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  calloutHint: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },

  // 定位按钮
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
  locBtnIcon: {
    fontSize: 20,
    color: COLORS.primary,
  },

  // 厕位数
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
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
})
