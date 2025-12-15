type Point = {
    /**
     * - X coordinate
     */
    x: number;
    /**
     * - Y coordinate
     */
    y: number;
    /**
     * - Parametric position along edge (0-1)
     */
    t?: number;
    /**
     * - Polar angle for point classification
     */
    theta?: number;
};
/**
 * Array of points representing polygon vertices in order
 */
type Polygon = Array<Point>;
/**
 * Array of exactly two points representing an edge
 */
type Edge = Array<Point>;
