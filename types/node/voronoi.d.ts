export = voronoi;
/**
 * Computes Voronoi cells for the supplied point cloud.
 *
 * The routine wraps a Delaunay triangulation produced by {@link module:delaunay-triangulate} and derives the
 * circumcentres that form the Voronoi vertices.  Degenerate simplices that reference the super triangle are
 * marked with `-1` so callers can easily skip unbounded faces.  The resulting structure is designed to be fed
 * into higher level helpers such as {@link Snap.voronoi}.
 *
 * @param {Array<Array<number>>} points Input points.
 * @returns {{cells:Array<Array<number>>, positions:Array<Array<number>>, triangles:Array<Array<number>>}} Voronoi diagram representation.
 * @example
 * const {cells, positions} = voronoi([[0, 0], [50, 10], [25, 75]]);
 * // cells -> index references into positions array forming each Voronoi face
 */
declare function voronoi(points: Array<Array<number>>): {
    cells: Array<Array<number>>;
    positions: Array<Array<number>>;
    triangles: Array<Array<number>>;
};
