/**
 * Two-dimensional point expressed as an object.
 */
type Point2D = {
    /**
     * - Horizontal coordinate.
     */
    x: number;
    /**
     * - Vertical coordinate.
     */
    y: number;
};
/**
 * Three-dimensional point expressed as an object.
 */
type Point3D = {
    /**
     * - Horizontal coordinate.
     */
    x: number;
    /**
     * - Vertical coordinate.
     */
    y: number;
    /**
     * - Optional depth coordinate.
     */
    z?: number;
};
/**
 * Alias for {@link Point3D} when used as a Bezier control point.
 */
type BezierPoint = Point3D;
/**
 * Rectangular range definition with inclusive bounds.
 */
type Range = {
    /**
     * - Lower bound.
     */
    min: number;
    /**
     * - Upper bound.
     */
    max: number;
};
/**
 * Minimal bounding box descriptor supporting extended coordinates.
 */
type BoundsLike = {
    /**
     * - Left coordinate.
     */
    x: number;
    /**
     * - Top coordinate.
     */
    y: number;
    /**
     * - Optional right coordinate.
     */
    x2?: number;
    /**
     * - Optional bottom coordinate.
     */
    y2?: number;
};
/**
 * Circle descriptor used by bounding box helpers.
 */
type Circle = {
    /**
     * - Centre X coordinate.
     */
    x: number;
    /**
     * - Centre Y coordinate.
     */
    y: number;
    /**
     * - Circle radius.
     */
    r: number;
};
/**
 * Axis-aligned bounding ranges for three dimensions.
 */
type Range3D = {
    /**
     * - Bounds along the X axis.
     */
    x: Range;
    /**
     * - Bounds along the Y axis.
     */
    y: Range;
    /**
     * - Optional bounds along the Z axis.
     */
    z?: Range;
};
/**
 * Extrema collections grouped per axis along with the sorted values.
 */
type ExtremaCollection = {
    /**
     * - Parameter values yielding extrema in X.
     */
    x: Array<number>;
    /**
     * - Parameter values yielding extrema in Y.
     */
    y: Array<number>;
    /**
     * - Parameter values yielding extrema in Z.
     */
    z?: Array<number>;
    /**
     * - Unique extrema parameters.
     */
    values: Array<number>;
};
/**
 * Cached offset geometry information for a Bezier curve.
 */
type OffsetGeometry = {
    /**
     * - Curve metadata.
     */
    c: any;
    /**
     * - Normal metadata.
     */
    n: any;
    /**
     * - X coordinate of the offset point.
     */
    x: number;
    /**
     * - Y coordinate of the offset point.
     */
    y: number;
    /**
     * - Optional Z coordinate of the offset point.
     */
    z?: number;
};
/**
 * Ordered list of 2D points represented as objects.
 */
type Point2DList = Array<Point2D>;
/**
 * Ordered list of 3D points represented as objects.
 */
type Point3DList = Array<Point3D>;
/**
 * Tuple containing the resolved border size and the increment mode flag.
 */
type NumberBooleanTuple = Array<(number | boolean)>;
/**
 * Pair of numeric coordinates.
 */
type NumberPair = Array<number>;
/**
 * Specification describing how to fetch a resource, potentially with a payload.
 */
type ResourceSpecifier = (string | Array<(string | any)>);
/**
 * Timeout specification that can be passed as a number or `[value, step]` pair.
 */
type TimeLimitSpecifier = (number | NumberPair);
/**
 * Alternate drag-click event configuration.
 */
type AltClickEventSpecification = (number | Function | Array<(string | Function | number)>);
/**
 * Supported inputs for hull computations (tuple pairs, flat arrays, or point objects).
 */
type PointCollection = (Array<NumberPair> | Array<number> | Point2DList);
/**
 * Attribute key configuration describing how virtual nodes store their metadata.
 */
type AttributeKeyConfiguration = {
    /**
     * - Key for a single attribute entry.
     */
    attr?: string;
    /**
     * - Key for the attribute collection.
     */
    attributes?: string;
    /**
     * - Key that stores the node type.
     */
    type?: string;
    /**
     * - Key that stores child nodes.
     */
    children?: string;
};
