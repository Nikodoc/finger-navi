import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { COLORS, FONT_SIZE } from '../constants'

interface Props {
  rating: number
  size?: number
  count?: number
  showCount?: boolean
}

export function RatingStars({ rating, size = 13, count, showCount = false }: Props) {
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75
  const roundUp = rating - full >= 0.75

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        let char: string
        let color: string
        if (i <= full + (roundUp ? 1 : 0)) {
          char = '★' // filled star ★
          color = COLORS.warning
        } else if (i === full + 1 && hasHalf) {
          char = '★'
          color = COLORS.warning
        } else {
          char = '☆' // empty star ☆
          color = COLORS.textTertiary
        }
        return (
          <Text
            key={i}
            style={[styles.star, { fontSize: size, color }]}
          >
            {char}
          </Text>
        )
      })}
      {showCount && count !== undefined && count > 0 && (
        <Text style={styles.count}>({count})</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 1,
  },
  count: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
})
