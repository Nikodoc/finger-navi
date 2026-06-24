import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, StyleSheet } from 'react-native'
import { COLORS } from '../src/constants'
import { useUserStore } from '../src/stores/useUserStore'

export default function RootLayout() {
  const loadFromStorage = useUserStore((s) => s.loadFromStorage)

  useEffect(() => {
    loadFromStorage()
  }, [])

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="toilet/[id]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
})
