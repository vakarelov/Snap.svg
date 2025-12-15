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
declare namespace voronoi {
    export { INT_BITS, INT_MAX, INT_MIN, sign, abs, min, max, isPow2, log2, log10, popCount, countTrailingZeros, nextPow2, prevPow2, parity, reverse, interleave2, deinterleave2, interleave3, deinterleave3, nextCombination, inplaceQuickSort, inplaceQuickSortIndices, DEFAULT_COMPARATOR, DEFAULT_REVERSE_COMPARATOR, reverseComparator, createTupleComparator, isArrayLike, guessLength, toArray, toArrayWithIndices, getPointerArray, getSignedPointerArray, getNumberType, getMinimalRepresentation, isTypedArray, concat, indices, ARRAY_BUFFER_SUPPORT, SYMBOL_SUPPORT, dimension, countVertices, cloneCells, compareCells, normalize, unique, findCell, incidence, dual, explode, skeleton, boundary, connectedComponents };
}
declare var INT_BITS: number;
declare const INT_MAX: 2147483647;
declare const INT_MIN: number;
declare function sign(v: any): number;
declare function abs(v: any): number;
declare function min(x: any, y: any): number;
declare function max(x: any, y: any): number;
declare function isPow2(v: any): boolean;
declare function log2(v: any): number;
declare function log10(v: any): 0 | 3 | 1 | 4 | 5 | 7 | 6 | 9 | 8 | 2;
declare function popCount(v: any): number;
declare function countTrailingZeros(v: any): number;
declare function nextPow2(v: any): any;
declare function prevPow2(v: any): number;
declare function parity(v: any): number;
declare function reverse(v: any): number;
declare function interleave2(x: any, y: any): number;
declare function deinterleave2(v: any, n: any): number;
declare function interleave3(x: any, y: any, z: any): number;
declare function deinterleave3(v: any, n: any): number;
declare function nextCombination(v: any): number;
declare function inplaceQuickSort(array: any, lo: any, hi: any): any;
declare function inplaceQuickSortIndices(array: any, indices: any, lo: any, hi: any): any;
/**
 * Mnemonist Heap Comparators
 * ===========================
 *
 * Default comparators & functions dealing with comparators reversing etc.
 */
declare function DEFAULT_COMPARATOR(a: any, b: any): 0 | 1 | -1;
declare function DEFAULT_REVERSE_COMPARATOR(a: any, b: any): 0 | 1 | -1;
/**
 * Function used to reverse a comparator.
 */
declare function reverseComparator(comparator: any): (a: any, b: any) => any;
/**
 * Function returning a tuple comparator.
 */
declare function createTupleComparator(size: any): (a: any, b: any) => 0 | 1 | -1;
/**
 * Function used to determine whether the given object supports array-like
 * random access.
 *
 * @param  {any} target - Target object.
 * @return {boolean}
 */
declare function isArrayLike(target: any): boolean;
/**
 * Function used to guess the length of the structure over which we are going
 * to iterate.
 *
 * @param  {any} target - Target object.
 * @return {number|undefined}
 */
declare function guessLength(target: any): number | undefined;
/**
 * Function used to convert an iterable to an array.
 *
 * @param  {any}   target - Iteration target.
 * @return {array}
 */
declare function toArray(target: any): any[];
/**
 * Same as above but returns a supplementary indices array.
 *
 * @param  {any}   target - Iteration target.
 * @return {array}
 */
declare function toArrayWithIndices(target: any): any[];
declare function getPointerArray(size: any): Uint8ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor;
declare function getSignedPointerArray(size: any): Int8ArrayConstructor | Int16ArrayConstructor | Int32ArrayConstructor | Float64ArrayConstructor;
declare function getNumberType(value: number): TypedArrayClass;
declare function getMinimalRepresentation(array: any, getter: any): any;
declare function isTypedArray(value: any): boolean;
declare function concat(...args: ByteArray[]): ByteArray;
declare function indices(length: number): ByteArray;
declare const ARRAY_BUFFER_SUPPORT: boolean;
declare const SYMBOL_SUPPORT: boolean;
declare function dimension(cells: any): number;
declare function countVertices(cells: any): number;
declare function cloneCells(cells: any): any[];
declare function compareCells(a: any, b: any): number;
declare function normalize(cells: any, attr: any): any;
declare function unique(cells: any): any;
declare function findCell(cells: any, c: any): number;
declare function incidence(from_cells: any, to_cells: any): any[];
declare function dual(cells: any, vertex_count: any): any[];
declare function explode(cells: any): any;
declare function skeleton(cells: any, n: any): any;
declare function boundary(cells: any): any;
declare function connectedComponents(cells: any, vertex_count: any): any[][];
