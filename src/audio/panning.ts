export type PanningMode = 'off' | 'surround' | 'drift'

export interface SpatialConfig {
  mode: PanningMode
  /** Azimuth (degrees, 0 = front). Static for 'surround'. */
  azimuth: number
  /** Elevation (degrees). */
  elevation: number
  /** Drift speed: angular degrees per second. */
  driftSpeed: number
  /** Drift wander radius around the base azimuth (degrees). */
  wanderRadius: number
  /** Distance scale used by the PannerNode (1-100). */
  distance: number
}

export const DEFAULT_SPATIAL: SpatialConfig = {
  mode: 'off',
  azimuth: 45,
  elevation: 0,
  driftSpeed: 15,
  wanderRadius: 40,
  distance: 20,
}

/**
 * A single 3D spatial layer for the atmosphere bus (appspec PannerMode
 * exploration). Places the atmosphere sound source at a configurable
 * azimuth/elevation around the listener.
 *
 * - `surround`: atmosphere fixed at `azimuth` (HRTF spatial image).
 * - `drift`:    azimuth animates slowly (wander) around the base position.
 * - `off`:      no PannerNode — returns null so the caller uses its normal
 *               direct routing (StereoPanner / gain only).
 */
export interface SpatialLayer {
  node: PannerNode
  config: SpatialConfig
  /** Apply az/el/distance; when drifting, pass the current azimuth. */
  apply(cfg: Partial<SpatialConfig>): void
  dispose(): void
}

/**
 * Set up the immersive listener (human at origin, facing -z, up +y).
 * Should be called once after the AudioContext is created.
 */
export function setupListener(ctx: BaseAudioContext): void {
  const l = ctx.listener
  // Modern positional audio listener API (positionX etc.).
  if ('positionX' in l) {
    ;(l as any).positionX.value = 0
    ;(l as any).positionY.value = 0
    ;(l as any).positionZ.value = 0
    ;(l as any).forwardX.value = 0
    ;(l as any).forwardY.value = 0
    ;(l as any).forwardZ.value = -1
    ;(l as any).upX.value = 0
    ;(l as any).upY.value = 1
    ;(l as any).upZ.value = 0
  } else if ('setPosition' in l) {
    ;(l as any).setPosition(0, 0, 0)
    ;(l as any).setOrientation(0, 0, -1, 0, 1, 0)
  }
}

/** Convert degrees to radians for the panner coordinate math. */
const DEG = Math.PI / 180

/**
 * Build the spatial layer. Returns null when mode is 'off', or if HRTF /
 * PannerNode isn't supported (fall back to non-spatial silently).
 */
export function createSpatialLayer(ctx: BaseAudioContext, cfg: SpatialConfig): SpatialLayer | null {
  if (cfg.mode === 'off') return null
  if (!ctx.createPanner) return null

  let node: PannerNode
  try {
    node = ctx.createPanner()
  } catch {
    return null
  }

  node.panningModel = 'HRTF'
  node.distanceModel = 'inverse'
  node.refDistance = 1
  node.maxDistance = 100
  node.rolloffFactor = 1.2
  node.coneInnerAngle = 360
  node.coneOuterAngle = 0
  node.coneOuterGain = 0

  function applyPosition(azimuthDeg: number, elevationDeg: number, distance: number) {
    const az = azimuthDeg * DEG
    const el = elevationDeg * DEG
    const x = Math.cos(el) * Math.sin(az) * distance
    const y = Math.sin(el) * distance
    const z = -Math.cos(el) * Math.cos(az) * distance
    if ('positionX' in node) {
      ;(node as any).positionX.value = x
      ;(node as any).positionY.value = y
      ;(node as any).positionZ.value = z
    } else if ('setPosition' in node) {
      ;(node as any).setPosition(x, y, z)
    }
  }

  applyPosition(cfg.azimuth, cfg.elevation, cfg.distance)

  const layer: SpatialLayer = {
    node,
    config: { ...cfg },
    apply(next) {
      Object.assign(layer.config, next)
      applyPosition(layer.config.azimuth, layer.config.elevation, layer.config.distance)
    },
    dispose() {
      try {
        node.disconnect()
      } catch {
        /* noop */
      }
    },
  }

  return layer
}
