import { get, set, del, keys } from 'idb-keyval'

/**
 * IndexedDB blob cache for sourced ambient loops (appspec §6.3).
 *
 * Pipeline on first play:
 *   1. Try IndexedDB (idb-keyval) for the encoded blob.
 *   2. Else fetch from the CDN/static path.
 *   3. Store the encoded blob in IndexedDB (indexed by loop id).
 *   4. Decode to an AudioBuffer via OfflineAudioContext and return it.
 * On subsequent plays the network is skipped (offline replay).
 *
 * Keys are namespaced per the spec: `bt:loop:v1:<loopId>`.
 */
const LOOP_NS = 'bt:loop:v1:'

export type LoopSourceKind = 'synth' | 'sourced'

export interface Loop {
  id: string
  /** Path or URL of the encoded audio blob (mp3/opus). */
  src: string
  kind: LoopSourceKind
}

async function decode(ctx: AudioContext, blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer()
  return await ctx.decodeAudioData(arrayBuffer)
}

/**
 * Ensure an audio buffer for the given loop, reading from IndexedDB first
 * and falling back to network, caching the blob for next time.
 */
export async function resolveLoopBuffer(
  ctx: AudioContext,
  loop: Loop,
): Promise<AudioBuffer | null> {
  const key = LOOP_NS + loop.id

  try {
    const cached = await get<Blob>(key)
    if (cached && cached.size > 0) {
      return await decode(ctx, cached)
    }
  } catch {
    /* cached read failed — fall through to network */
  }

  try {
    const resp = await fetch(loop.src)
    if (!resp.ok) return null
    const blob = await resp.blob()
    if (blob.size > 0) {
      try {
        await set(key, blob)
      } catch {
        /* quota — non-fatal; in-memory only */
      }
    }
    return await decode(ctx, blob)
  } catch {
    return null
  }
}

/** Drop a single loop, or every cached loop blob, from IndexedDB. */
export async function evictLoop(loopId?: string): Promise<void> {
  try {
    if (loopId) {
      await del(LOOP_NS + loopId)
      return
    }
    const all = await keys<string>()
    await Promise.all(
      all.filter((k) => typeof k === 'string' && k.startsWith(LOOP_NS)).map((k) => del(k)),
    )
  } catch {
    /* ignore */
  }
}
