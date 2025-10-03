/**
 * @fileoverview Shared typedefs used exclusively for generating documentation.
 * These definitions normalise complex type expressions so they can be reused
 * across multiple modules without duplicating inline record syntax.
 */

/**
 * Two-dimensional point expressed as an object.
 * @typedef {Object} Point2D
 * @property {number} x - Horizontal coordinate.
 * @property {number} y - Vertical coordinate.
 */

/**
 * Three-dimensional point expressed as an object.
 * @typedef {Object} Point3D
 * @property {number} x - Horizontal coordinate.
 * @property {number} y - Vertical coordinate.
 * @property {number} [z] - Optional depth coordinate.
 */

/**
 * Alias for {@link Point3D} when used as a Bezier control point.
 * @typedef {Point3D} BezierPoint
 */

/**
 * Rectangular range definition with inclusive bounds.
 * @typedef {Object} Range
 * @property {number} min - Lower bound.
 * @property {number} max - Upper bound.
 */

/**
 * Minimal bounding box descriptor supporting extended coordinates.
 * @typedef {Object} BoundsLike
 * @property {number} x - Left coordinate.
 * @property {number} y - Top coordinate.
 * @property {number} [x2] - Optional right coordinate.
 * @property {number} [y2] - Optional bottom coordinate.
 */

/**
 * Circle descriptor used by bounding box helpers.
 * @typedef {Object} Circle
 * @property {number} x - Centre X coordinate.
 * @property {number} y - Centre Y coordinate.
 * @property {number} r - Circle radius.
 */

/**
 * Axis-aligned bounding ranges for three dimensions.
 * @typedef {Object} Range3D
 * @property {Range} x - Bounds along the X axis.
 * @property {Range} y - Bounds along the Y axis.
 * @property {Range} [z] - Optional bounds along the Z axis.
 */

/**
 * Extrema collections grouped per axis along with the sorted values.
 * @typedef {Object} ExtremaCollection
 * @property {Array.<number>} x - Parameter values yielding extrema in X.
 * @property {Array.<number>} y - Parameter values yielding extrema in Y.
 * @property {Array.<number>} [z] - Parameter values yielding extrema in Z.
 * @property {Array.<number>} values - Unique extrema parameters.
 */

/**
 * Cached offset geometry information for a Bezier curve.
 * @typedef {Object} OffsetGeometry
 * @property {Object} c - Curve metadata.
 * @property {Object} n - Normal metadata.
 * @property {number} x - X coordinate of the offset point.
 * @property {number} y - Y coordinate of the offset point.
 * @property {number} [z] - Optional Z coordinate of the offset point.
 */

/**
 * Ordered list of 2D points represented as objects.
 * @typedef {Array.<Point2D>} Point2DList
 */

/**
 * Ordered list of 3D points represented as objects.
 * @typedef {Array.<Point3D>} Point3DList
 */

/**
 * Tuple containing the resolved border size and the increment mode flag.
 * @typedef {Array.<(number|boolean)>} NumberBooleanTuple
 * @property {number} 0 - Border size in pixels.
 * @property {boolean} 1 - Indicates whether the size is incremental.
 */

/**
 * Pair of numeric coordinates.
 * @typedef {Array.<number>} NumberPair
 */

/**
 * Specification describing how to fetch a resource, potentially with a payload.
 * @typedef {(string|Array.<(string|*)>)} ResourceSpecifier
 */

/**
 * Timeout specification that can be passed as a number or `[value, step]` pair.
 * @typedef {(number|NumberPair)} TimeLimitSpecifier
 */

/**
 * Alternate drag-click event configuration.
 * @typedef {(number|Function|Array.<(string|Function|number)>)} AltClickEventSpecification
 */

/**
 * Supported inputs for hull computations (tuple pairs, flat arrays, or point objects).
 * @typedef {(Array.<NumberPair>|Array.<number>|Point2DList)} PointCollection
 */

/**
 * Attribute key configuration describing how virtual nodes store their metadata.
 * @typedef {Object} AttributeKeyConfiguration
 * @property {string} [attr] - Key for a single attribute entry.
 * @property {string} [attributes] - Key for the attribute collection.
 * @property {string} [type] - Key that stores the node type.
 * @property {string} [children] - Key that stores child nodes.
 */
