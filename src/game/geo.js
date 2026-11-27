import * as THREE from 'three'

// ---------------------------------------------------------------------
//  GEOGRAPHY HELPERS
//  Latitude  -90 (south pole) .. +90 (north pole)
//  Longitude -180 .. +180 (0 = Greenwich)
//  SphereGeometry wraps its texture starting at longitude -180, and these
//  formulas are matched to that layout.
// ---------------------------------------------------------------------

export function latLonToVector3(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lon + 180)

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

export function vector3ToLatLon(point) {
  const p = point.clone().normalize()
  const lat = 90 - THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(p.y, -1, 1)))
  let lon = THREE.MathUtils.radToDeg(Math.atan2(p.z, -p.x)) - 180
  if (lon < -180) lon += 360
  return { lat, lon }
}

// Great-circle distance in kilometres (haversine formula).
// Supports both distanceKm(p1, p2) and distanceKm(lat1, lon1, lat2, lon2).
export function distanceKm(lat1, lon1, lat2, lon2) {
  if (typeof lat1 === 'object' && lat1 !== null) {
    const p1 = lat1
    const p2 = lon1
    lat1 = p1.lat
    lon1 = p1.lon
    lat2 = p2.lat
    lon2 = p2.lon
  }

  const R = 6371
  const dLat = THREE.MathUtils.degToRad(lat2 - lat1)
  const dLon = THREE.MathUtils.degToRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(THREE.MathUtils.degToRad(lat1)) *
      Math.cos(THREE.MathUtils.degToRad(lat2)) *
      Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function formatKm(km) {
  if (km < 10) return km.toFixed(1)
  return Math.round(km).toLocaleString()
}
