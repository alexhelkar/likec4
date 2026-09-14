import { type BBox, type Dimensions, distanceBetween, placeLabelAlongSegments } from '@likec4/core/geometry'
import type { EdgeRouting } from '@likec4/core/types'
import type { XYPosition } from '@xyflow/react'
import type { Segment } from './edge-path'

/**
 * The subset of `SVGPathElement` needed to place a label along a path.
 */
export interface MeasurablePath {
  getTotalLength(): number
  getPointAtLength(distance: number): { x: number; y: number }
}

/**
 * Top-left of the label of an edge being edited.
 * Under spline routing the label is centred on half the path length.
 * Under ortho routing an auto-placed label (`beside`) sits beside the middle of the longest straight run,
 * clear of the obstacles (the leaf nodes of the view), the same rule the layout side applies to untouched edges.
 * A label the user moved by hand keeps its offset from a base that does not flip sides as the route changes:
 * the middle of the longest run itself (`centred`).
 */
export function edgeLabelPosition({ path, segments, routing, size, obstacles, mode = 'beside' }: {
  path: MeasurablePath
  segments: ReadonlyArray<Segment>
  routing: EdgeRouting
  size: Dimensions
  obstacles: ReadonlyArray<BBox>
  mode?: 'beside' | 'centred'
}): XYPosition {
  if (routing === 'ortho' && segments.length > 0) {
    if (mode === 'beside') {
      const { x, y } = placeLabelAlongSegments({ segments, size, obstacles })
      return { x, y }
    }
    const [a, b] = longestSegment(segments)
    return centredAt({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, size)
  }
  return centredAt(path.getPointAtLength(path.getTotalLength() * 0.5), size)
}

/** the longest segment, the first one on a tie */
function longestSegment(segments: ReadonlyArray<Segment>): Segment {
  let best = segments[0]!
  let bestLength = -1
  for (const segment of segments) {
    const length = distanceBetween(segment[0], segment[1])
    if (length > bestLength) {
      bestLength = length
      best = segment
    }
  }
  return best
}

function centredAt(point: { x: number; y: number }, size: Dimensions): XYPosition {
  return {
    x: Math.round(point.x - size.width / 2),
    y: Math.round(point.y - size.height / 2),
  }
}
