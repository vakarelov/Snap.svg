type PathSegment = {
    /**
     * - Segment type (M, L, C, Q, A, Z, etc.)
     */
    type: string;
    /**
     * - Segment arguments/coordinates
     */
    args: Array<number>;
};
/**
 * Array representation of an SVG path
 */
type PathArray = Array<PathSegment>;
type PointOnPath = {
    /**
     * - X coordinate
     */
    x: number;
    /**
     * - Y coordinate
     */
    y: number;
    /**
     * - Tangent angle at point
     */
    alpha?: number;
    /**
     * - Parametric position (0-1)
     */
    t?: number;
};
