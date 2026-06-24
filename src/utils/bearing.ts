/**
 * 计算从 (lat1,lng1) 到 (lat2,lng2) 的方位角（0-360°，北为0）
 */
export function bearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180)
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLng)
  const brng = (Math.atan2(y, x) * 180) / Math.PI
  return (brng + 360) % 360
}
