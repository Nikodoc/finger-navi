import React from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'
import { COLORS, FONT_SIZE, SPACING, RADIUS, SHADOWS } from '../constants'

interface Props {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  onClear?: () => void
  autoFocus?: boolean
  onSubmitEditing?: () => void
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = '输入地名，找找附近厕所',
  onClear,
  autoFocus,
  onSubmitEditing,
}: Props) {
  return (
    <View style={[styles.wrap, SHADOWS.small]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        autoFocus={autoFocus}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 10,
    color: COLORS.surface,
    fontWeight: '700',
  },
})
