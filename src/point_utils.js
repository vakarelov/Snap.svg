(function () {
    function r(e, n, t) {
        function o(i, f) {
            if (!n[i]) {
                if (!e[i]) {
                    var c = "function" == typeof require && require;
                    if (!f && c) return c(i, !0);
                    if (u) return u(i, !0);
                    var a = new Error("Cannot find module '" + i + "'");
                    throw a.code = "MODULE_NOT_FOUND", a
                }
                var p = n[i] = {exports: {}};
                e[i][0].call(p.exports, function (r) {
                    var n = e[i][1][r];
                    return o(n || r)
                }, p, p.exports, r, e, n, t)
            }
            return n[i].exports
        }

        for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
        return o
    }

    return r
})()({
    1: [function (require, module, exports) {
        /**
         * Bit twiddling hacks for JavaScript.
         *
         * Author: Mikola Lysenko
         *
         * Ported from Stanford bit twiddling hack library:
         *    http://graphics.stanford.edu/~seander/bithacks.html
         */

        "use strict";
        "use restrict";

//Number of bits in an integer
        var INT_BITS = 32;

//Constants
        exports.INT_BITS = INT_BITS;
        exports.INT_MAX = 0x7fffffff;
        exports.INT_MIN = -1 << (INT_BITS - 1);

//Returns -1, 0, +1 depending on sign of x
        exports.sign = function (v) {
            return (v > 0) - (v < 0);
        }

//Computes absolute value of integer
        exports.abs = function (v) {
            var mask = v >> (INT_BITS - 1);
            return (v ^ mask) - mask;
        }

//Computes minimum of integers x and y
        exports.min = function (x, y) {
            return y ^ ((x ^ y) & -(x < y));
        }

//Computes maximum of integers x and y
        exports.max = function (x, y) {
            return x ^ ((x ^ y) & -(x < y));
        }

//Checks if a number is a power of two
        exports.isPow2 = function (v) {
            return !(v & (v - 1)) && (!!v);
        }

//Computes log base 2 of v
        exports.log2 = function (v) {
            var r, shift;
            r = (v > 0xFFFF) << 4;
            v >>>= r;
            shift = (v > 0xFF) << 3;
            v >>>= shift;
            r |= shift;
            shift = (v > 0xF) << 2;
            v >>>= shift;
            r |= shift;
            shift = (v > 0x3) << 1;
            v >>>= shift;
            r |= shift;
            return r | (v >> 1);
        }

//Computes log base 10 of v
        exports.log10 = function (v) {
            return (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
                (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
                    (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
        }

//Counts number of bits
        exports.popCount = function (v) {
            v = v - ((v >>> 1) & 0x55555555);
            v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
            return ((v + (v >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
        }

//Counts number of trailing zeros
        function countTrailingZeros(v) {
            var c = 32;
            v &= -v;
            if (v) c--;
            if (v & 0x0000FFFF) c -= 16;
            if (v & 0x00FF00FF) c -= 8;
            if (v & 0x0F0F0F0F) c -= 4;
            if (v & 0x33333333) c -= 2;
            if (v & 0x55555555) c -= 1;
            return c;
        }

        exports.countTrailingZeros = countTrailingZeros;

//Rounds to next power of 2
        exports.nextPow2 = function (v) {
            v += v === 0;
            --v;
            v |= v >>> 1;
            v |= v >>> 2;
            v |= v >>> 4;
            v |= v >>> 8;
            v |= v >>> 16;
            return v + 1;
        }

//Rounds down to previous power of 2
        exports.prevPow2 = function (v) {
            v |= v >>> 1;
            v |= v >>> 2;
            v |= v >>> 4;
            v |= v >>> 8;
            v |= v >>> 16;
            return v - (v >>> 1);
        }

//Computes parity of word
        exports.parity = function (v) {
            v ^= v >>> 16;
            v ^= v >>> 8;
            v ^= v >>> 4;
            v &= 0xf;
            return (0x6996 >>> v) & 1;
        }

        var REVERSE_TABLE = new Array(256);

        (function (tab) {
            for (var i = 0; i < 256; ++i) {
                var v = i, r = i, s = 7;
                for (v >>>= 1; v; v >>>= 1) {
                    r <<= 1;
                    r |= v & 1;
                    --s;
                }
                tab[i] = (r << s) & 0xff;
            }
        })(REVERSE_TABLE);

//Reverse bits in a 32 bit word
        exports.reverse = function (v) {
            return (REVERSE_TABLE[v & 0xff] << 24) |
                (REVERSE_TABLE[(v >>> 8) & 0xff] << 16) |
                (REVERSE_TABLE[(v >>> 16) & 0xff] << 8) |
                REVERSE_TABLE[(v >>> 24) & 0xff];
        }

//Interleave bits of 2 coordinates with 16 bits.  Useful for fast quadtree codes
        exports.interleave2 = function (x, y) {
            x &= 0xFFFF;
            x = (x | (x << 8)) & 0x00FF00FF;
            x = (x | (x << 4)) & 0x0F0F0F0F;
            x = (x | (x << 2)) & 0x33333333;
            x = (x | (x << 1)) & 0x55555555;

            y &= 0xFFFF;
            y = (y | (y << 8)) & 0x00FF00FF;
            y = (y | (y << 4)) & 0x0F0F0F0F;
            y = (y | (y << 2)) & 0x33333333;
            y = (y | (y << 1)) & 0x55555555;

            return x | (y << 1);
        }

//Extracts the nth interleaved component
        exports.deinterleave2 = function (v, n) {
            v = (v >>> n) & 0x55555555;
            v = (v | (v >>> 1)) & 0x33333333;
            v = (v | (v >>> 2)) & 0x0F0F0F0F;
            v = (v | (v >>> 4)) & 0x00FF00FF;
            v = (v | (v >>> 16)) & 0x000FFFF;
            return (v << 16) >> 16;
        }


//Interleave bits of 3 coordinates, each with 10 bits.  Useful for fast octree codes
        exports.interleave3 = function (x, y, z) {
            x &= 0x3FF;
            x = (x | (x << 16)) & 4278190335;
            x = (x | (x << 8)) & 251719695;
            x = (x | (x << 4)) & 3272356035;
            x = (x | (x << 2)) & 1227133513;

            y &= 0x3FF;
            y = (y | (y << 16)) & 4278190335;
            y = (y | (y << 8)) & 251719695;
            y = (y | (y << 4)) & 3272356035;
            y = (y | (y << 2)) & 1227133513;
            x |= (y << 1);

            z &= 0x3FF;
            z = (z | (z << 16)) & 4278190335;
            z = (z | (z << 8)) & 251719695;
            z = (z | (z << 4)) & 3272356035;
            z = (z | (z << 2)) & 1227133513;

            return x | (z << 2);
        }

//Extracts nth interleaved component of a 3-tuple
        exports.deinterleave3 = function (v, n) {
            v = (v >>> n) & 1227133513;
            v = (v | (v >>> 2)) & 3272356035;
            v = (v | (v >>> 4)) & 251719695;
            v = (v | (v >>> 8)) & 4278190335;
            v = (v | (v >>> 16)) & 0x3FF;
            return (v << 22) >> 22;
        }

//Computes next combination in colexicographic order (this is mistakenly called nextPermutation on the bit twiddling hacks page)
        exports.nextCombination = function (v) {
            var t = v | (v - 1);
            return (t + 1) | (((~t & -~t) - 1) >>> (countTrailingZeros(v) + 1));
        }


    }, {}],
    2: [function (require, module, exports) {
        "use strict"

        var dup = require("dup")
        var solve = require("robust-linear-solve")

        function dot(a, b) {
            var s = 0.0
            var d = a.length
            for (var i = 0; i < d; ++i) {
                s += a[i] * b[i]
            }
            return s
        }

        function barycentricCircumcenter(points) {
            var N = points.length
            if (N === 0) {
                return []
            }

            var D = points[0].length
            var A = dup([points.length + 1, points.length + 1], 1.0)
            var b = dup([points.length + 1], 1.0)
            A[N][N] = 0.0
            for (var i = 0; i < N; ++i) {
                for (var j = 0; j <= i; ++j) {
                    A[j][i] = A[i][j] = 2.0 * dot(points[i], points[j])
                }
                b[i] = dot(points[i], points[i])
            }
            var x = solve(A, b)

            var denom = 0.0
            var h = x[N + 1]
            for (var i = 0; i < h.length; ++i) {
                denom += h[i]
            }

            var y = new Array(N)
            for (var i = 0; i < N; ++i) {
                var h = x[i]
                var numer = 0.0
                for (var j = 0; j < h.length; ++j) {
                    numer += h[j]
                }
                y[i] = numer / denom
            }

            return y
        }

        function circumcenter(points) {
            if (points.length === 0) {
                return []
            }
            var D = points[0].length
            var result = dup([D])
            var weights = barycentricCircumcenter(points)
            for (var i = 0; i < points.length; ++i) {
                for (var j = 0; j < D; ++j) {
                    result[j] += points[i][j] * weights[i]
                }
            }
            return result
        }

        circumcenter.barycenetric = barycentricCircumcenter
        module.exports = circumcenter
    }, {"dup": 4, "robust-linear-solve": 16}],
    3: [function (require, module, exports) {
        "use strict"

        var ch = require("incremental-convex-hull")
        var uniq = require("uniq")

        module.exports = triangulate

        function LiftedPoint(p, i) {
            this.point = p
            this.index = i
        }

        function compareLifted(a, b) {
            var ap = a.point
            var bp = b.point
            var d = ap.length
            for (var i = 0; i < d; ++i) {
                var s = bp[i] - ap[i]
                if (s) {
                    return s
                }
            }
            return 0
        }

        function triangulate1D(n, points, includePointAtInfinity) {
            if (n === 1) {
                if (includePointAtInfinity) {
                    return [[-1, 0]]
                } else {
                    return []
                }
            }
            var lifted = points.map(function (p, i) {
                return [p[0], i]
            })
            lifted.sort(function (a, b) {
                return a[0] - b[0]
            })
            var cells = new Array(n - 1)
            for (var i = 1; i < n; ++i) {
                var a = lifted[i - 1]
                var b = lifted[i]
                cells[i - 1] = [a[1], b[1]]
            }
            if (includePointAtInfinity) {
                cells.push(
                    [-1, cells[0][1],],
                    [cells[n - 1][1], -1])
            }
            return cells
        }

        function triangulate(points, includePointAtInfinity) {
            var n = points.length
            if (n === 0) {
                return []
            }

            var d = points[0].length
            if (d < 1) {
                return []
            }

            //Special case:  For 1D we can just sort the points
            if (d === 1) {
                return triangulate1D(n, points, includePointAtInfinity)
            }

            //Lift points, sort
            var lifted = new Array(n)
            var upper = 1.0
            for (var i = 0; i < n; ++i) {
                var p = points[i]
                var x = new Array(d + 1)
                var l = 0.0
                for (var j = 0; j < d; ++j) {
                    var v = p[j]
                    x[j] = v
                    l += v * v
                }
                x[d] = l
                lifted[i] = new LiftedPoint(x, i)
                upper = Math.max(l, upper)
            }
            uniq(lifted, compareLifted)

            //Double points
            n = lifted.length

            //Create new list of points
            var dpoints = new Array(n + d + 1)
            var dindex = new Array(n + d + 1)

            //Add steiner points at top
            var u = (d + 1) * (d + 1) * upper
            var y = new Array(d + 1)
            for (var i = 0; i <= d; ++i) {
                y[i] = 0.0
            }
            y[d] = u

            dpoints[0] = y.slice()
            dindex[0] = -1

            for (var i = 0; i <= d; ++i) {
                var x = y.slice()
                x[i] = 1
                dpoints[i + 1] = x
                dindex[i + 1] = -1
            }

            //Copy rest of the points over
            for (var i = 0; i < n; ++i) {
                var h = lifted[i]
                dpoints[i + d + 1] = h.point
                dindex[i + d + 1] = h.index
            }

            //Construct convex hull
            var hull = ch(dpoints, false)
            if (includePointAtInfinity) {
                hull = hull.filter(function (cell) {
                    var count = 0
                    for (var j = 0; j <= d; ++j) {
                        var v = dindex[cell[j]]
                        if (v < 0) {
                            if (++count >= 2) {
                                return false
                            }
                        }
                        cell[j] = v
                    }
                    return true
                })
            } else {
                hull = hull.filter(function (cell) {
                    for (var i = 0; i <= d; ++i) {
                        var v = dindex[cell[i]]
                        if (v < 0) {
                            return false
                        }
                        cell[i] = v
                    }
                    return true
                })
            }

            if (d & 1) {
                for (var i = 0; i < hull.length; ++i) {
                    var h = hull[i]
                    var x = h[0]
                    h[0] = h[1]
                    h[1] = x
                }
            }

            return hull
        }
    }, {"incremental-convex-hull": 5, "uniq": 25}],
    4: [function (require, module, exports) {
        "use strict"

        function dupe_array(count, value, i) {
            var c = count[i] | 0
            if (c <= 0) {
                return []
            }
            var result = new Array(c), j
            if (i === count.length - 1) {
                for (j = 0; j < c; ++j) {
                    result[j] = value
                }
            } else {
                for (j = 0; j < c; ++j) {
                    result[j] = dupe_array(count, value, i + 1)
                }
            }
            return result
        }

        function dupe_number(count, value) {
            var result, i
            result = new Array(count)
            for (i = 0; i < count; ++i) {
                result[i] = value
            }
            return result
        }

        function dupe(count, value) {
            if (typeof value === "undefined") {
                value = 0
            }
            switch (typeof count) {
                case "number":
                    if (count > 0) {
                        return dupe_number(count | 0, value)
                    }
                    break
                case "object":
                    if (typeof (count.length) === "number") {
                        return dupe_array(count, value, 0)
                    }
                    break
            }
            return []
        }

        module.exports = dupe
    }, {}],
    5: [function (require, module, exports) {
        "use strict"

//High level idea:
// 1. Use Clarkson's incremental construction to find convex hull
// 2. Point location in triangulation by jump and walk

        module.exports = incrementalConvexHull

        var orient = require("robust-orientation")
        var compareCell = require("simplicial-complex").compareCells

        function compareInt(a, b) {
            return a - b
        }

        function Simplex(vertices, adjacent, boundary) {
            this.vertices = vertices
            this.adjacent = adjacent
            this.boundary = boundary
            this.lastVisited = -1
        }

        Simplex.prototype.flip = function () {
            var t = this.vertices[0]
            this.vertices[0] = this.vertices[1]
            this.vertices[1] = t
            var u = this.adjacent[0]
            this.adjacent[0] = this.adjacent[1]
            this.adjacent[1] = u
        }

        function GlueFacet(vertices, cell, index) {
            this.vertices = vertices
            this.cell = cell
            this.index = index
        }

        function compareGlue(a, b) {
            return compareCell(a.vertices, b.vertices)
        }

        function bakeOrient(d) {
            var code = ["function orient(){var tuple=this.tuple;return test("]
            for (var i = 0; i <= d; ++i) {
                if (i > 0) {
                    code.push(",")
                }
                code.push("tuple[", i, "]")
            }
            code.push(")}return orient")
            var proc = new Function("test", code.join(""))
            var test = orient[d + 1]
            if (!test) {
                test = orient
            }
            return proc(test)
        }

        var BAKED = []

        function Triangulation(dimension, vertices, simplices) {
            this.dimension = dimension
            this.vertices = vertices
            this.simplices = simplices
            this.interior = simplices.filter(function (c) {
                return !c.boundary
            })

            this.tuple = new Array(dimension + 1)
            for (var i = 0; i <= dimension; ++i) {
                this.tuple[i] = this.vertices[i]
            }

            var o = BAKED[dimension]
            if (!o) {
                o = BAKED[dimension] = bakeOrient(dimension)
            }
            this.orient = o
        }

        var proto = Triangulation.prototype

//Degenerate situation where we are on boundary, but coplanar to face
        proto.handleBoundaryDegeneracy = function (cell, point) {
            var d = this.dimension
            var n = this.vertices.length - 1
            var tuple = this.tuple
            var verts = this.vertices

            //Dumb solution: Just do dfs from boundary cell until we find any peak, or terminate
            var toVisit = [cell]
            cell.lastVisited = -n
            while (toVisit.length > 0) {
                cell = toVisit.pop()
                var cellVerts = cell.vertices
                var cellAdj = cell.adjacent
                for (var i = 0; i <= d; ++i) {
                    var neighbor = cellAdj[i]
                    if (!neighbor.boundary || neighbor.lastVisited <= -n) {
                        continue
                    }
                    var nv = neighbor.vertices
                    for (var j = 0; j <= d; ++j) {
                        var vv = nv[j]
                        if (vv < 0) {
                            tuple[j] = point
                        } else {
                            tuple[j] = verts[vv]
                        }
                    }
                    var o = this.orient()
                    if (o > 0) {
                        return neighbor
                    }
                    neighbor.lastVisited = -n
                    if (o === 0) {
                        toVisit.push(neighbor)
                    }
                }
            }
            return null
        }

        proto.walk = function (point, random) {
            //Alias local properties
            var n = this.vertices.length - 1
            var d = this.dimension
            var verts = this.vertices
            var tuple = this.tuple

            //Compute initial jump cell
            var initIndex = random ? (this.interior.length * Math.random()) | 0 : (this.interior.length - 1)
            var cell = this.interior[initIndex]

            //Start walking
            outerLoop:
                while (!cell.boundary) {
                    var cellVerts = cell.vertices
                    var cellAdj = cell.adjacent

                    for (var i = 0; i <= d; ++i) {
                        tuple[i] = verts[cellVerts[i]]
                    }
                    cell.lastVisited = n

                    //Find farthest adjacent cell
                    for (var i = 0; i <= d; ++i) {
                        var neighbor = cellAdj[i]
                        if (neighbor.lastVisited >= n) {
                            continue
                        }
                        var prev = tuple[i]
                        tuple[i] = point
                        var o = this.orient()
                        tuple[i] = prev
                        if (o < 0) {
                            cell = neighbor
                            continue outerLoop
                        } else {
                            if (!neighbor.boundary) {
                                neighbor.lastVisited = n
                            } else {
                                neighbor.lastVisited = -n
                            }
                        }
                    }
                    return
                }

            return cell
        }

        proto.addPeaks = function (point, cell) {
            var n = this.vertices.length - 1
            var d = this.dimension
            var verts = this.vertices
            var tuple = this.tuple
            var interior = this.interior
            var simplices = this.simplices

            //Walking finished at boundary, time to add peaks
            var tovisit = [cell]

            //Stretch initial boundary cell into a peak
            cell.lastVisited = n
            cell.vertices[cell.vertices.indexOf(-1)] = n
            cell.boundary = false
            interior.push(cell)

            //Record a list of all new boundaries created by added peaks so we can glue them together when we are all done
            var glueFacets = []

            //Do a traversal of the boundary walking outward from starting peak
            while (tovisit.length > 0) {
                //Pop off peak and walk over adjacent cells
                var cell = tovisit.pop()
                var cellVerts = cell.vertices
                var cellAdj = cell.adjacent
                var indexOfN = cellVerts.indexOf(n)
                if (indexOfN < 0) {
                    continue
                }

                for (var i = 0; i <= d; ++i) {
                    if (i === indexOfN) {
                        continue
                    }

                    //For each boundary neighbor of the cell
                    var neighbor = cellAdj[i]
                    if (!neighbor.boundary || neighbor.lastVisited >= n) {
                        continue
                    }

                    var nv = neighbor.vertices

                    //Test if neighbor is a peak
                    if (neighbor.lastVisited !== -n) {
                        //Compute orientation of p relative to each boundary peak
                        var indexOfNeg1 = 0
                        for (var j = 0; j <= d; ++j) {
                            if (nv[j] < 0) {
                                indexOfNeg1 = j
                                tuple[j] = point
                            } else {
                                tuple[j] = verts[nv[j]]
                            }
                        }
                        var o = this.orient()

                        //Test if neighbor cell is also a peak
                        if (o > 0) {
                            nv[indexOfNeg1] = n
                            neighbor.boundary = false
                            interior.push(neighbor)
                            tovisit.push(neighbor)
                            neighbor.lastVisited = n
                            continue
                        } else {
                            neighbor.lastVisited = -n
                        }
                    }

                    var na = neighbor.adjacent

                    //Otherwise, replace neighbor with new face
                    var vverts = cellVerts.slice()
                    var vadj = cellAdj.slice()
                    var ncell = new Simplex(vverts, vadj, true)
                    simplices.push(ncell)

                    //Connect to neighbor
                    var opposite = na.indexOf(cell)
                    if (opposite < 0) {
                        continue
                    }
                    na[opposite] = ncell
                    vadj[indexOfN] = neighbor

                    //Connect to cell
                    vverts[i] = -1
                    vadj[i] = cell
                    cellAdj[i] = ncell

                    //Flip facet
                    ncell.flip()

                    //Add to glue list
                    for (var j = 0; j <= d; ++j) {
                        var uu = vverts[j]
                        if (uu < 0 || uu === n) {
                            continue
                        }
                        var nface = new Array(d - 1)
                        var nptr = 0
                        for (var k = 0; k <= d; ++k) {
                            var vv = vverts[k]
                            if (vv < 0 || k === j) {
                                continue
                            }
                            nface[nptr++] = vv
                        }
                        glueFacets.push(new GlueFacet(nface, ncell, j))
                    }
                }
            }

            //Glue boundary facets together
            glueFacets.sort(compareGlue)

            for (var i = 0; i + 1 < glueFacets.length; i += 2) {
                var a = glueFacets[i]
                var b = glueFacets[i + 1]
                var ai = a.index
                var bi = b.index
                if (ai < 0 || bi < 0) {
                    continue
                }
                a.cell.adjacent[a.index] = b.cell
                b.cell.adjacent[b.index] = a.cell
            }
        }

        proto.insert = function (point, random) {
            //Add point
            var verts = this.vertices
            verts.push(point)

            var cell = this.walk(point, random)
            if (!cell) {
                return
            }

            //Alias local properties
            var d = this.dimension
            var tuple = this.tuple

            //Degenerate case: If point is coplanar to cell, then walk until we find a non-degenerate boundary
            for (var i = 0; i <= d; ++i) {
                var vv = cell.vertices[i]
                if (vv < 0) {
                    tuple[i] = point
                } else {
                    tuple[i] = verts[vv]
                }
            }
            var o = this.orient(tuple)
            if (o < 0) {
                return
            } else if (o === 0) {
                cell = this.handleBoundaryDegeneracy(cell, point)
                if (!cell) {
                    return
                }
            }

            //Add peaks
            this.addPeaks(point, cell)
        }

//Extract all boundary cells
        proto.boundary = function () {
            var d = this.dimension
            var boundary = []
            var cells = this.simplices
            var nc = cells.length
            for (var i = 0; i < nc; ++i) {
                var c = cells[i]
                if (c.boundary) {
                    var bcell = new Array(d)
                    var cv = c.vertices
                    var ptr = 0
                    var parity = 0
                    for (var j = 0; j <= d; ++j) {
                        if (cv[j] >= 0) {
                            bcell[ptr++] = cv[j]
                        } else {
                            parity = j & 1
                        }
                    }
                    if (parity === (d & 1)) {
                        var t = bcell[0]
                        bcell[0] = bcell[1]
                        bcell[1] = t
                    }
                    boundary.push(bcell)
                }
            }
            return boundary
        }

        function incrementalConvexHull(points, randomSearch) {
            var n = points.length
            if (n === 0) {
                throw new Error("Must have at least d+1 points")
            }
            var d = points[0].length
            if (n <= d) {
                throw new Error("Must input at least d+1 points")
            }

            //FIXME: This could be degenerate, but need to select d+1 non-coplanar points to bootstrap process
            var initialSimplex = points.slice(0, d + 1)

            //Make sure initial simplex is positively oriented
            var o = orient.apply(void 0, initialSimplex)
            if (o === 0) {
                throw new Error("Input not in general position")
            }
            var initialCoords = new Array(d + 1)
            for (var i = 0; i <= d; ++i) {
                initialCoords[i] = i
            }
            if (o < 0) {
                initialCoords[0] = 1
                initialCoords[1] = 0
            }

            //Create initial topological index, glue pointers together (kind of messy)
            var initialCell = new Simplex(initialCoords, new Array(d + 1), false)
            var boundary = initialCell.adjacent
            var list = new Array(d + 2)
            for (var i = 0; i <= d; ++i) {
                var verts = initialCoords.slice()
                for (var j = 0; j <= d; ++j) {
                    if (j === i) {
                        verts[j] = -1
                    }
                }
                var t = verts[0]
                verts[0] = verts[1]
                verts[1] = t
                var cell = new Simplex(verts, new Array(d + 1), true)
                boundary[i] = cell
                list[i] = cell
            }
            list[d + 1] = initialCell
            for (var i = 0; i <= d; ++i) {
                var verts = boundary[i].vertices
                var adj = boundary[i].adjacent
                for (var j = 0; j <= d; ++j) {
                    var v = verts[j]
                    if (v < 0) {
                        adj[j] = initialCell
                        continue
                    }
                    for (var k = 0; k <= d; ++k) {
                        if (boundary[k].vertices.indexOf(v) < 0) {
                            adj[j] = boundary[k]
                        }
                    }
                }
            }

            //Initialize triangles
            var triangles = new Triangulation(d, initialSimplex, list)

            //Insert remaining points
            var useRandom = !!randomSearch
            for (var i = d + 1; i < n; ++i) {
                triangles.insert(points[i], useRandom)
            }

            //Extract boundary cells
            return triangles.boundary()
        }
    }, {"robust-orientation": 17, "simplicial-complex": 21}],
    6: [function (require, module, exports) {
        /**
         * Mnemonist Fixed Reverse Heap
         * =============================
         *
         * Static heap implementation with fixed capacity. It's a "reverse" heap
         * because it stores the elements in reverse so we can replace the worst
         * item in logarithmic time. As such, one cannot pop this heap but can only
         * consume it at the end. This structure is very efficient when trying to
         * find the n smallest/largest items from a larger query (k nearest neigbors
         * for instance).
         */
        var comparators = require('./utils/comparators.js'),
            Heap = require('./heap.js');

        var DEFAULT_COMPARATOR = comparators.DEFAULT_COMPARATOR,
            reverseComparator = comparators.reverseComparator;

        /**
         * Helper functions.
         */

        /**
         * Function used to sift up.
         *
         * @param {function} compare - Comparison function.
         * @param {array}    heap    - Array storing the heap's data.
         * @param {number}   size    - Heap's true size.
         * @param {number}   i       - Index.
         */
        function siftUp(compare, heap, size, i) {
            var endIndex = size,
                startIndex = i,
                item = heap[i],
                childIndex = 2 * i + 1,
                rightIndex;

            while (childIndex < endIndex) {
                rightIndex = childIndex + 1;

                if (
                    rightIndex < endIndex &&
                    compare(heap[childIndex], heap[rightIndex]) >= 0
                ) {
                    childIndex = rightIndex;
                }

                heap[i] = heap[childIndex];
                i = childIndex;
                childIndex = 2 * i + 1;
            }

            heap[i] = item;
            Heap.siftDown(compare, heap, startIndex, i);
        }

        /**
         * Fully consumes the given heap.
         *
         * @param  {function} ArrayClass - Array class to use.
         * @param  {function} compare    - Comparison function.
         * @param  {array}    heap       - Array storing the heap's data.
         * @param  {number}   size       - True size of the heap.
         * @return {array}
         */
        function consume(ArrayClass, compare, heap, size) {
            var l = size,
                i = l;

            var array = new ArrayClass(size),
                lastItem,
                item;

            while (i > 0) {
                lastItem = heap[--i];

                if (i !== 0) {
                    item = heap[0];
                    heap[0] = lastItem;
                    siftUp(compare, heap, --size, 0);
                    lastItem = item;
                }

                array[i] = lastItem;
            }

            return array;
        }

        /**
         * Binary Minimum FixedReverseHeap.
         *
         * @constructor
         * @param {function} ArrayClass - The class of array to use.
         * @param {function} comparator - Comparator function.
         * @param {number}   capacity   - Maximum number of items to keep.
         */
        function FixedReverseHeap(ArrayClass, comparator, capacity) {

            // Comparator can be omitted
            if (arguments.length === 2) {
                capacity = comparator;
                comparator = null;
            }

            this.ArrayClass = ArrayClass;
            this.capacity = capacity;

            this.items = new ArrayClass(capacity);
            this.clear();
            this.comparator = comparator || DEFAULT_COMPARATOR;

            if (typeof capacity !== 'number' && capacity <= 0)
                throw new Error('mnemonist/FixedReverseHeap.constructor: capacity should be a number > 0.');

            if (typeof this.comparator !== 'function')
                throw new Error('mnemonist/FixedReverseHeap.constructor: given comparator should be a function.');

            this.comparator = reverseComparator(this.comparator);
        }

        /**
         * Method used to clear the heap.
         *
         * @return {undefined}
         */
        FixedReverseHeap.prototype.clear = function () {

            // Properties
            this.size = 0;
        };

        /**
         * Method used to push an item into the heap.
         *
         * @param  {any}    item - Item to push.
         * @return {number}
         */
        FixedReverseHeap.prototype.push = function (item) {

            // Still some place
            if (this.size < this.capacity) {
                this.items[this.size] = item;
                Heap.siftDown(this.comparator, this.items, 0, this.size);
                this.size++;
            }

            // Heap is full, we need to replace worst item
            else {

                if (this.comparator(item, this.items[0]) > 0)
                    Heap.replace(this.comparator, this.items, item);
            }

            return this.size;
        };

        /**
         * Method used to peek the worst item in the heap.
         *
         * @return {any}
         */
        FixedReverseHeap.prototype.peek = function () {
            return this.items[0];
        };

        /**
         * Method used to consume the heap fully and return its items as a sorted array.
         *
         * @return {array}
         */
        FixedReverseHeap.prototype.consume = function () {
            var items = consume(this.ArrayClass, this.comparator, this.items, this.size);
            this.size = 0;

            return items;
        };

        /**
         * Method used to convert the heap to an array. Note that it basically clone
         * the heap and consumes it completely. This is hardly performant.
         *
         * @return {array}
         */
        FixedReverseHeap.prototype.toArray = function () {
            return consume(this.ArrayClass, this.comparator, this.items.slice(0, this.size), this.size);
        };

        /**
         * Convenience known methods.
         */
        FixedReverseHeap.prototype.inspect = function () {
            var proxy = this.toArray();

            // Trick so that node displays the name of the constructor
            Object.defineProperty(proxy, 'constructor', {
                value: FixedReverseHeap,
                enumerable: false
            });

            return proxy;
        };

        if (typeof Symbol !== 'undefined')
            FixedReverseHeap.prototype[Symbol.for('nodejs.util.inspect.custom')] = FixedReverseHeap.prototype.inspect;

        /**
         * Exporting.
         */
        module.exports = FixedReverseHeap;

    }, {"./heap.js": 7, "./utils/comparators.js": 10}],
    7: [function (require, module, exports) {
        /**
         * Mnemonist Binary Heap
         * ======================
         *
         * Binary heap implementation.
         */
        var forEach = require('obliterator/foreach'),
            comparators = require('./utils/comparators.js'),
            iterables = require('./utils/iterables.js');

        var DEFAULT_COMPARATOR = comparators.DEFAULT_COMPARATOR,
            reverseComparator = comparators.reverseComparator;

        /**
         * Heap helper functions.
         */

        /**
         * Function used to sift down.
         *
         * @param {function} compare    - Comparison function.
         * @param {array}    heap       - Array storing the heap's data.
         * @param {number}   startIndex - Starting index.
         * @param {number}   i          - Index.
         */
        function siftDown(compare, heap, startIndex, i) {
            var item = heap[i],
                parentIndex,
                parent;

            while (i > startIndex) {
                parentIndex = (i - 1) >> 1;
                parent = heap[parentIndex];

                if (compare(item, parent) < 0) {
                    heap[i] = parent;
                    i = parentIndex;
                    continue;
                }

                break;
            }

            heap[i] = item;
        }

        /**
         * Function used to sift up.
         *
         * @param {function} compare - Comparison function.
         * @param {array}    heap    - Array storing the heap's data.
         * @param {number}   i       - Index.
         */
        function siftUp(compare, heap, i) {
            var endIndex = heap.length,
                startIndex = i,
                item = heap[i],
                childIndex = 2 * i + 1,
                rightIndex;

            while (childIndex < endIndex) {
                rightIndex = childIndex + 1;

                if (
                    rightIndex < endIndex &&
                    compare(heap[childIndex], heap[rightIndex]) >= 0
                ) {
                    childIndex = rightIndex;
                }

                heap[i] = heap[childIndex];
                i = childIndex;
                childIndex = 2 * i + 1;
            }

            heap[i] = item;
            siftDown(compare, heap, startIndex, i);
        }

        /**
         * Function used to push an item into a heap represented by a raw array.
         *
         * @param {function} compare - Comparison function.
         * @param {array}    heap    - Array storing the heap's data.
         * @param {any}      item    - Item to push.
         */
        function push(compare, heap, item) {
            heap.push(item);
            siftDown(compare, heap, 0, heap.length - 1);
        }

        /**
         * Function used to pop an item from a heap represented by a raw array.
         *
         * @param  {function} compare - Comparison function.
         * @param  {array}    heap    - Array storing the heap's data.
         * @return {any}
         */
        function pop(compare, heap) {
            var lastItem = heap.pop();

            if (heap.length !== 0) {
                var item = heap[0];
                heap[0] = lastItem;
                siftUp(compare, heap, 0);

                return item;
            }

            return lastItem;
        }

        /**
         * Function used to pop the heap then push a new value into it, thus "replacing"
         * it.
         *
         * @param  {function} compare - Comparison function.
         * @param  {array}    heap    - Array storing the heap's data.
         * @param  {any}      item    - The item to push.
         * @return {any}
         */
        function replace(compare, heap, item) {
            if (heap.length === 0)
                throw new Error('mnemonist/heap.replace: cannot pop an empty heap.');

            var popped = heap[0];
            heap[0] = item;
            siftUp(compare, heap, 0);

            return popped;
        }

        /**
         * Function used to push an item in the heap then pop the heap and return the
         * popped value.
         *
         * @param  {function} compare - Comparison function.
         * @param  {array}    heap    - Array storing the heap's data.
         * @param  {any}      item    - The item to push.
         * @return {any}
         */
        function pushpop(compare, heap, item) {
            var tmp;

            if (heap.length !== 0 && compare(heap[0], item) < 0) {
                tmp = heap[0];
                heap[0] = item;
                item = tmp;
                siftUp(compare, heap, 0);
            }

            return item;
        }

        /**
         * Converts and array into an abstract heap in linear time.
         *
         * @param {function} compare - Comparison function.
         * @param {array}    array   - Target array.
         */
        function heapify(compare, array) {
            var n = array.length,
                l = n >> 1,
                i = l;

            while (--i >= 0)
                siftUp(compare, array, i);
        }

        /**
         * Fully consumes the given heap.
         *
         * @param  {function} compare - Comparison function.
         * @param  {array}    heap    - Array storing the heap's data.
         * @return {array}
         */
        function consume(compare, heap) {
            var l = heap.length,
                i = 0;

            var array = new Array(l);

            while (i < l)
                array[i++] = pop(compare, heap);

            return array;
        }

        /**
         * Function used to retrieve the n smallest items from the given iterable.
         *
         * @param {function} compare  - Comparison function.
         * @param {number}   n        - Number of top items to retrieve.
         * @param {any}      iterable - Arbitrary iterable.
         * @param {array}
         */
        function nsmallest(compare, n, iterable) {
            if (arguments.length === 2) {
                iterable = n;
                n = compare;
                compare = DEFAULT_COMPARATOR;
            }

            var reverseCompare = reverseComparator(compare);

            var i, l, v;

            var min = Infinity;

            var result;

            // If n is equal to 1, it's just a matter of finding the minimum
            if (n === 1) {
                if (iterables.isArrayLike(iterable)) {
                    for (i = 0, l = iterable.length; i < l; i++) {
                        v = iterable[i];

                        if (min === Infinity || compare(v, min) < 0)
                            min = v;
                    }

                    result = new iterable.constructor(1);
                    result[0] = min;

                    return result;
                }

                forEach(iterable, function (value) {
                    if (min === Infinity || compare(value, min) < 0)
                        min = value;
                });

                return [min];
            }

            if (iterables.isArrayLike(iterable)) {

                // If n > iterable length, we just clone and sort
                if (n >= iterable.length)
                    return iterable.slice().sort(compare);

                result = iterable.slice(0, n);
                heapify(reverseCompare, result);

                for (i = n, l = iterable.length; i < l; i++)
                    if (reverseCompare(iterable[i], result[0]) > 0)
                        replace(reverseCompare, result, iterable[i]);

                // NOTE: if n is over some number, it becomes faster to consume the heap
                return result.sort(compare);
            }

            // Correct for size
            var size = iterables.guessLength(iterable);

            if (size !== null && size < n)
                n = size;

            result = new Array(n);
            i = 0;

            forEach(iterable, function (value) {
                if (i < n) {
                    result[i] = value;
                } else {
                    if (i === n)
                        heapify(reverseCompare, result);

                    if (reverseCompare(value, result[0]) > 0)
                        replace(reverseCompare, result, value);
                }

                i++;
            });

            if (result.length > i)
                result.length = i;

            // NOTE: if n is over some number, it becomes faster to consume the heap
            return result.sort(compare);
        }

        /**
         * Function used to retrieve the n largest items from the given iterable.
         *
         * @param {function} compare  - Comparison function.
         * @param {number}   n        - Number of top items to retrieve.
         * @param {any}      iterable - Arbitrary iterable.
         * @param {array}
         */
        function nlargest(compare, n, iterable) {
            if (arguments.length === 2) {
                iterable = n;
                n = compare;
                compare = DEFAULT_COMPARATOR;
            }

            var reverseCompare = reverseComparator(compare);

            var i, l, v;

            var max = -Infinity;

            var result;

            // If n is equal to 1, it's just a matter of finding the maximum
            if (n === 1) {
                if (iterables.isArrayLike(iterable)) {
                    for (i = 0, l = iterable.length; i < l; i++) {
                        v = iterable[i];

                        if (max === -Infinity || compare(v, max) > 0)
                            max = v;
                    }

                    result = new iterable.constructor(1);
                    result[0] = max;

                    return result;
                }

                forEach(iterable, function (value) {
                    if (max === -Infinity || compare(value, max) > 0)
                        max = value;
                });

                return [max];
            }

            if (iterables.isArrayLike(iterable)) {

                // If n > iterable length, we just clone and sort
                if (n >= iterable.length)
                    return iterable.slice().sort(reverseCompare);

                result = iterable.slice(0, n);
                heapify(compare, result);

                for (i = n, l = iterable.length; i < l; i++)
                    if (compare(iterable[i], result[0]) > 0)
                        replace(compare, result, iterable[i]);

                // NOTE: if n is over some number, it becomes faster to consume the heap
                return result.sort(reverseCompare);
            }

            // Correct for size
            var size = iterables.guessLength(iterable);

            if (size !== null && size < n)
                n = size;

            result = new Array(n);
            i = 0;

            forEach(iterable, function (value) {
                if (i < n) {
                    result[i] = value;
                } else {
                    if (i === n)
                        heapify(compare, result);

                    if (compare(value, result[0]) > 0)
                        replace(compare, result, value);
                }

                i++;
            });

            if (result.length > i)
                result.length = i;

            // NOTE: if n is over some number, it becomes faster to consume the heap
            return result.sort(reverseCompare);
        }

        /**
         * Binary Minimum Heap.
         *
         * @constructor
         * @param {function} comparator - Comparator function to use.
         */
        function Heap(comparator) {
            this.clear();
            this.comparator = comparator || DEFAULT_COMPARATOR;

            if (typeof this.comparator !== 'function')
                throw new Error('mnemonist/Heap.constructor: given comparator should be a function.');
        }

        /**
         * Method used to clear the heap.
         *
         * @return {undefined}
         */
        Heap.prototype.clear = function () {

            // Properties
            this.items = [];
            this.size = 0;
        };

        /**
         * Method used to push an item into the heap.
         *
         * @param  {any}    item - Item to push.
         * @return {number}
         */
        Heap.prototype.push = function (item) {
            push(this.comparator, this.items, item);
            return ++this.size;
        };

        /**
         * Method used to retrieve the "first" item of the heap.
         *
         * @return {any}
         */
        Heap.prototype.peek = function () {
            return this.items[0];
        };

        /**
         * Method used to retrieve & remove the "first" item of the heap.
         *
         * @return {any}
         */
        Heap.prototype.pop = function () {
            if (this.size !== 0)
                this.size--;

            return pop(this.comparator, this.items);
        };

        /**
         * Method used to pop the heap, then push an item and return the popped
         * item.
         *
         * @param  {any} item - Item to push into the heap.
         * @return {any}
         */
        Heap.prototype.replace = function (item) {
            return replace(this.comparator, this.items, item);
        };

        /**
         * Method used to push the heap, the pop it and return the pooped item.
         *
         * @param  {any} item - Item to push into the heap.
         * @return {any}
         */
        Heap.prototype.pushpop = function (item) {
            return pushpop(this.comparator, this.items, item);
        };

        /**
         * Method used to consume the heap fully and return its items as a sorted array.
         *
         * @return {array}
         */
        Heap.prototype.consume = function () {
            this.size = 0;
            return consume(this.comparator, this.items);
        };

        /**
         * Method used to convert the heap to an array. Note that it basically clone
         * the heap and consumes it completely. This is hardly performant.
         *
         * @return {array}
         */
        Heap.prototype.toArray = function () {
            return consume(this.comparator, this.items.slice());
        };

        /**
         * Convenience known methods.
         */
        Heap.prototype.inspect = function () {
            var proxy = this.toArray();

            // Trick so that node displays the name of the constructor
            Object.defineProperty(proxy, 'constructor', {
                value: Heap,
                enumerable: false
            });

            return proxy;
        };

        if (typeof Symbol !== 'undefined')
            Heap.prototype[Symbol.for('nodejs.util.inspect.custom')] = Heap.prototype.inspect;

        /**
         * Binary Maximum Heap.
         *
         * @constructor
         * @param {function} comparator - Comparator function to use.
         */
        function MaxHeap(comparator) {
            this.clear();
            this.comparator = comparator || DEFAULT_COMPARATOR;

            if (typeof this.comparator !== 'function')
                throw new Error('mnemonist/MaxHeap.constructor: given comparator should be a function.');

            this.comparator = reverseComparator(this.comparator);
        }

        MaxHeap.prototype = Heap.prototype;

        /**
         * Static @.from function taking an arbitrary iterable & converting it into
         * a heap.
         *
         * @param  {Iterable} iterable   - Target iterable.
         * @param  {function} comparator - Custom comparator function.
         * @return {Heap}
         */
        Heap.from = function (iterable, comparator) {
            var heap = new Heap(comparator);

            var items;

            // If iterable is an array, we can be clever about it
            if (iterables.isArrayLike(iterable))
                items = iterable.slice();
            else
                items = iterables.toArray(iterable);

            heapify(heap.comparator, items);
            heap.items = items;
            heap.size = items.length;

            return heap;
        };

        MaxHeap.from = function (iterable, comparator) {
            var heap = new MaxHeap(comparator);

            var items;

            // If iterable is an array, we can be clever about it
            if (iterables.isArrayLike(iterable))
                items = iterable.slice();
            else
                items = iterables.toArray(iterable);

            heapify(heap.comparator, items);
            heap.items = items;
            heap.size = items.length;

            return heap;
        };

        /**
         * Exporting.
         */
        Heap.siftUp = siftUp;
        Heap.siftDown = siftDown;
        Heap.push = push;
        Heap.pop = pop;
        Heap.replace = replace;
        Heap.pushpop = pushpop;
        Heap.heapify = heapify;
        Heap.consume = consume;

        Heap.nsmallest = nsmallest;
        Heap.nlargest = nlargest;

        Heap.MinHeap = Heap;
        Heap.MaxHeap = MaxHeap;

        module.exports = Heap;

    }, {"./utils/comparators.js": 10, "./utils/iterables.js": 11, "obliterator/foreach": 13}],
    8: [function (require, module, exports) {
        /**
         * Mnemonist KDTree
         * =================
         *
         * Low-level JavaScript implementation of a k-dimensional tree.
         */
        var iterables = require('./utils/iterables.js');
        var typed = require('./utils/typed-arrays.js');
        var createTupleComparator = require('./utils/comparators.js').createTupleComparator;
        var FixedReverseHeap = require('./fixed-reverse-heap.js');
        var inplaceQuickSortIndices = require('./sort/quick.js').inplaceQuickSortIndices;

        /**
         * Helper function used to compute the squared distance between a query point
         * and an indexed points whose values are stored in a tree's axes.
         *
         * Note that squared distance is used instead of euclidean to avoid
         * costly sqrt computations.
         *
         * @param  {number} dimensions - Number of dimensions.
         * @param  {array}  axes       - Axes data.
         * @param  {number} pivot      - Pivot.
         * @param  {array}  point      - Query point.
         * @return {number}
         */
        function squaredDistanceAxes(dimensions, axes, pivot, b) {
            var d;

            var dist = 0,
                step;

            for (d = 0; d < dimensions; d++) {
                step = axes[d][pivot] - b[d];
                dist += step * step;
            }

            return dist;
        }

        /**
         * Helper function used to reshape input data into low-level axes data.
         *
         * @param  {number} dimensions - Number of dimensions.
         * @param  {array}  data       - Data in the shape [label, [x, y, z...]]
         * @return {object}
         */
        function reshapeIntoAxes(dimensions, data) {
            var l = data.length;

            var axes = new Array(dimensions),
                labels = new Array(l),
                axis;

            var PointerArray = typed.getPointerArray(l);

            var ids = new PointerArray(l);

            var d, i, row;

            var f = true;

            for (d = 0; d < dimensions; d++) {
                axis = new Float64Array(l);

                for (i = 0; i < l; i++) {
                    row = data[i];
                    axis[i] = row[1][d];

                    if (f) {
                        labels[i] = row[0];
                        ids[i] = i;
                    }
                }

                f = false;
                axes[d] = axis;
            }

            return {axes: axes, ids: ids, labels: labels};
        }

        /**
         * Helper function used to build a kd-tree from axes data.
         *
         * @param  {number} dimensions - Number of dimensions.
         * @param  {array}  axes       - Axes.
         * @param  {array}  ids        - Indices to sort.
         * @param  {array}  labels     - Point labels.
         * @return {object}
         */
        function buildTree(dimensions, axes, ids, labels) {
            var l = labels.length;

            // NOTE: +1 because we need to keep 0 as null pointer
            var PointerArray = typed.getPointerArray(l + 1);

            // Building the tree
            var pivots = new PointerArray(l),
                lefts = new PointerArray(l),
                rights = new PointerArray(l);

            var stack = [[0, 0, ids.length, -1, 0]],
                step,
                parent,
                direction,
                median,
                pivot,
                lo,
                hi;

            var d, i = 0;

            while (stack.length !== 0) {
                step = stack.pop();

                d = step[0];
                lo = step[1];
                hi = step[2];
                parent = step[3];
                direction = step[4];

                inplaceQuickSortIndices(axes[d], ids, lo, hi);

                l = hi - lo;
                median = lo + (l >>> 1); // Fancy floor(l / 2)
                pivot = ids[median];
                pivots[i] = pivot;

                if (parent > -1) {
                    if (direction === 0)
                        lefts[parent] = i + 1;
                    else
                        rights[parent] = i + 1;
                }

                d = (d + 1) % dimensions;

                // Right
                if (median !== lo && median !== hi - 1) {
                    stack.push([d, median + 1, hi, i, 1]);
                }

                // Left
                if (median !== lo) {
                    stack.push([d, lo, median, i, 0]);
                }

                i++;
            }

            return {
                axes: axes,
                labels: labels,
                pivots: pivots,
                lefts: lefts,
                rights: rights
            };
        }

        /**
         * KDTree.
         *
         * @constructor
         */
        function KDTree(dimensions, build) {
            this.dimensions = dimensions;
            this.visited = 0;

            this.axes = build.axes;
            this.labels = build.labels;

            this.pivots = build.pivots;
            this.lefts = build.lefts;
            this.rights = build.rights;

            this.size = this.labels.length;
        }

        /**
         * Method returning the query's nearest neighbor.
         *
         * @param  {array}  query - Query point.
         * @return {any}
         */
        KDTree.prototype.nearestNeighbor = function (query) {
            var bestDistance = Infinity,
                best = null;

            var dimensions = this.dimensions,
                axes = this.axes,
                pivots = this.pivots,
                lefts = this.lefts,
                rights = this.rights;

            var visited = 0;

            function recurse(d, node) {
                visited++;

                var left = lefts[node],
                    right = rights[node],
                    pivot = pivots[node];

                var dist = squaredDistanceAxes(
                    dimensions,
                    axes,
                    pivot,
                    query
                );

                if (dist < bestDistance) {
                    best = pivot;
                    bestDistance = dist;

                    if (dist === 0)
                        return;
                }

                var dx = axes[d][pivot] - query[d];

                d = (d + 1) % dimensions;

                // Going the correct way?
                if (dx > 0) {
                    if (left !== 0)
                        recurse(d, left - 1);
                } else {
                    if (right !== 0)
                        recurse(d, right - 1);
                }

                // Going the other way?
                if (dx * dx < bestDistance) {
                    if (dx > 0) {
                        if (right !== 0)
                            recurse(d, right - 1);
                    } else {
                        if (left !== 0)
                            recurse(d, left - 1);
                    }
                }
            }

            recurse(0, 0);

            this.visited = visited;
            return this.labels[best];
        };

        var KNN_HEAP_COMPARATOR_3 = createTupleComparator(3);
        var KNN_HEAP_COMPARATOR_2 = createTupleComparator(2);

        /**
         * Method returning the query's k nearest neighbors.
         *
         * @param  {number} k     - Number of nearest neighbor to retrieve.
         * @param  {array}  query - Query point.
         * @return {array}
         */

// TODO: can do better by improving upon static-kdtree here
        KDTree.prototype.kNearestNeighbors = function (k, query) {
            if (k <= 0)
                throw new Error('mnemonist/kd-tree.kNearestNeighbors: k should be a positive number.');

            k = Math.min(k, this.size);

            if (k === 1)
                return [this.nearestNeighbor(query)];

            var heap = new FixedReverseHeap(Array, KNN_HEAP_COMPARATOR_3, k);

            var dimensions = this.dimensions,
                axes = this.axes,
                pivots = this.pivots,
                lefts = this.lefts,
                rights = this.rights;

            var visited = 0;

            function recurse(d, node) {
                var left = lefts[node],
                    right = rights[node],
                    pivot = pivots[node];

                var dist = squaredDistanceAxes(
                    dimensions,
                    axes,
                    pivot,
                    query
                );

                heap.push([dist, visited++, pivot]);

                var point = query[d],
                    split = axes[d][pivot],
                    dx = point - split;

                d = (d + 1) % dimensions;

                // Going the correct way?
                if (point < split) {
                    if (left !== 0) {
                        recurse(d, left - 1);
                    }
                } else {
                    if (right !== 0) {
                        recurse(d, right - 1);
                    }
                }

                // Going the other way?
                if (dx * dx < heap.peek()[0] || heap.size < k) {
                    if (point < split) {
                        if (right !== 0) {
                            recurse(d, right - 1);
                        }
                    } else {
                        if (left !== 0) {
                            recurse(d, left - 1);
                        }
                    }
                }
            }

            recurse(0, 0);

            this.visited = visited;

            var best = heap.consume();

            for (var i = 0; i < best.length; i++)
                best[i] = this.labels[best[i][2]];

            return best;
        };

        /**
         * Method returning the query's k nearest neighbors by linear search.
         *
         * @param  {number} k     - Number of nearest neighbor to retrieve.
         * @param  {array}  query - Query point.
         * @return {array}
         */
        KDTree.prototype.linearKNearestNeighbors = function (k, query) {
            if (k <= 0)
                throw new Error('mnemonist/kd-tree.kNearestNeighbors: k should be a positive number.');

            k = Math.min(k, this.size);

            var heap = new FixedReverseHeap(Array, KNN_HEAP_COMPARATOR_2, k);

            var i, l, dist;

            for (i = 0, l = this.size; i < l; i++) {
                dist = squaredDistanceAxes(
                    this.dimensions,
                    this.axes,
                    this.pivots[i],
                    query
                );

                heap.push([dist, i]);
            }

            var best = heap.consume();

            for (i = 0; i < best.length; i++)
                best[i] = this.labels[this.pivots[best[i][1]]];

            return best;
        };

        /**
         * Convenience known methods.
         */
        KDTree.prototype.inspect = function () {
            var dummy = new Map();

            dummy.dimensions = this.dimensions;

            Object.defineProperty(dummy, 'constructor', {
                value: KDTree,
                enumerable: false
            });

            var i, j, point;

            for (i = 0; i < this.size; i++) {
                point = new Array(this.dimensions);

                for (j = 0; j < this.dimensions; j++)
                    point[j] = this.axes[j][i];

                dummy.set(this.labels[i], point);
            }

            return dummy;
        };

        if (typeof Symbol !== 'undefined')
            KDTree.prototype[Symbol.for('nodejs.util.inspect.custom')] = KDTree.prototype.inspect;

        /**
         * Static @.from function taking an arbitrary iterable & converting it into
         * a structure.
         *
         * @param  {Iterable} iterable   - Target iterable.
         * @param  {number}   dimensions - Space dimensions.
         * @return {KDTree}
         */
        KDTree.from = function (iterable, dimensions) {
            var data = iterables.toArray(iterable);

            var reshaped = reshapeIntoAxes(dimensions, data);

            var result = buildTree(dimensions, reshaped.axes, reshaped.ids, reshaped.labels);

            return new KDTree(dimensions, result);
        };

        /**
         * Static @.from function building a KDTree from given axes.
         *
         * @param  {Iterable} iterable   - Target iterable.
         * @param  {number}   dimensions - Space dimensions.
         * @return {KDTree}
         */
        KDTree.fromAxes = function (axes, labels) {
            if (!labels)
                labels = typed.indices(axes[0].length);

            var dimensions = axes.length;

            var result = buildTree(axes.length, axes, typed.indices(labels.length), labels);

            return new KDTree(dimensions, result);
        };

        /**
         * Exporting.
         */
        module.exports = KDTree;

    }, {
        "./fixed-reverse-heap.js": 6,
        "./sort/quick.js": 9,
        "./utils/comparators.js": 10,
        "./utils/iterables.js": 11,
        "./utils/typed-arrays.js": 12
    }],
    9: [function (require, module, exports) {
        /**
         * Mnemonist Quick Sort
         * =====================
         *
         * Quick sort related functions.
         * Adapted from: https://alienryderflex.com/quicksort/
         */
        var LOS = new Float64Array(64),
            HIS = new Float64Array(64);

        function inplaceQuickSort(array, lo, hi) {
            var p, i, l, r, swap;

            LOS[0] = lo;
            HIS[0] = hi;
            i = 0;

            while (i >= 0) {
                l = LOS[i];
                r = HIS[i] - 1;

                if (l < r) {
                    p = array[l];

                    while (l < r) {
                        while (array[r] >= p && l < r)
                            r--;

                        if (l < r)
                            array[l++] = array[r];

                        while (array[l] <= p && l < r)
                            l++;

                        if (l < r)
                            array[r--] = array[l];
                    }

                    array[l] = p;
                    LOS[i + 1] = l + 1;
                    HIS[i + 1] = HIS[i];
                    HIS[i++] = l;

                    if (HIS[i] - LOS[i] > HIS[i - 1] - LOS[i - 1]) {
                        swap = LOS[i];
                        LOS[i] = LOS[i - 1];
                        LOS[i - 1] = swap;

                        swap = HIS[i];
                        HIS[i] = HIS[i - 1];
                        HIS[i - 1] = swap;
                    }
                } else {
                    i--;
                }
            }

            return array;
        }

        exports.inplaceQuickSort = inplaceQuickSort;

        function inplaceQuickSortIndices(array, indices, lo, hi) {
            var p, i, l, r, t, swap;

            LOS[0] = lo;
            HIS[0] = hi;
            i = 0;

            while (i >= 0) {
                l = LOS[i];
                r = HIS[i] - 1;

                if (l < r) {
                    t = indices[l];
                    p = array[t];

                    while (l < r) {
                        while (array[indices[r]] >= p && l < r)
                            r--;

                        if (l < r)
                            indices[l++] = indices[r];

                        while (array[indices[l]] <= p && l < r)
                            l++;

                        if (l < r)
                            indices[r--] = indices[l];
                    }

                    indices[l] = t;
                    LOS[i + 1] = l + 1;
                    HIS[i + 1] = HIS[i];
                    HIS[i++] = l;

                    if (HIS[i] - LOS[i] > HIS[i - 1] - LOS[i - 1]) {
                        swap = LOS[i];
                        LOS[i] = LOS[i - 1];
                        LOS[i - 1] = swap;

                        swap = HIS[i];
                        HIS[i] = HIS[i - 1];
                        HIS[i - 1] = swap;
                    }
                } else {
                    i--;
                }
            }

            return indices;
        }

        exports.inplaceQuickSortIndices = inplaceQuickSortIndices;

    }, {}],
    10: [function (require, module, exports) {
        /**
         * Mnemonist Heap Comparators
         * ===========================
         *
         * Default comparators & functions dealing with comparators reversing etc.
         */
        var DEFAULT_COMPARATOR = function (a, b) {
            if (a < b)
                return -1;
            if (a > b)
                return 1;

            return 0;
        };

        var DEFAULT_REVERSE_COMPARATOR = function (a, b) {
            if (a < b)
                return 1;
            if (a > b)
                return -1;

            return 0;
        };

        /**
         * Function used to reverse a comparator.
         */
        function reverseComparator(comparator) {
            return function (a, b) {
                return comparator(b, a);
            };
        }

        /**
         * Function returning a tuple comparator.
         */
        function createTupleComparator(size) {
            if (size === 2) {
                return function (a, b) {
                    if (a[0] < b[0])
                        return -1;

                    if (a[0] > b[0])
                        return 1;

                    if (a[1] < b[1])
                        return -1;

                    if (a[1] > b[1])
                        return 1;

                    return 0;
                };
            }

            return function (a, b) {
                var i = 0;

                while (i < size) {
                    if (a[i] < b[i])
                        return -1;

                    if (a[i] > b[i])
                        return 1;

                    i++;
                }

                return 0;
            };
        }

        /**
         * Exporting.
         */
        exports.DEFAULT_COMPARATOR = DEFAULT_COMPARATOR;
        exports.DEFAULT_REVERSE_COMPARATOR = DEFAULT_REVERSE_COMPARATOR;
        exports.reverseComparator = reverseComparator;
        exports.createTupleComparator = createTupleComparator;

    }, {}],
    11: [function (require, module, exports) {
        /**
         * Mnemonist Iterable Function
         * ============================
         *
         * Harmonized iteration helpers over mixed iterable targets.
         */
        var forEach = require('obliterator/foreach');

        var typed = require('./typed-arrays.js');

        /**
         * Function used to determine whether the given object supports array-like
         * random access.
         *
         * @param  {any} target - Target object.
         * @return {boolean}
         */
        function isArrayLike(target) {
            return Array.isArray(target) || typed.isTypedArray(target);
        }

        /**
         * Function used to guess the length of the structure over which we are going
         * to iterate.
         *
         * @param  {any} target - Target object.
         * @return {number|undefined}
         */
        function guessLength(target) {
            if (typeof target.length === 'number')
                return target.length;

            if (typeof target.size === 'number')
                return target.size;

            return;
        }

        /**
         * Function used to convert an iterable to an array.
         *
         * @param  {any}   target - Iteration target.
         * @return {array}
         */
        function toArray(target) {
            var l = guessLength(target);

            var array = typeof l === 'number' ? new Array(l) : [];

            var i = 0;

            // TODO: we could optimize when given target is array like
            forEach(target, function (value) {
                array[i++] = value;
            });

            return array;
        }

        /**
         * Same as above but returns a supplementary indices array.
         *
         * @param  {any}   target - Iteration target.
         * @return {array}
         */
        function toArrayWithIndices(target) {
            var l = guessLength(target);

            var IndexArray = typeof l === 'number' ?
                typed.getPointerArray(l) :
                Array;

            var array = typeof l === 'number' ? new Array(l) : [];
            var indices = typeof l === 'number' ? new IndexArray(l) : [];

            var i = 0;

            // TODO: we could optimize when given target is array like
            forEach(target, function (value) {
                array[i] = value;
                indices[i] = i++;
            });

            return [array, indices];
        }

        /**
         * Exporting.
         */
        exports.isArrayLike = isArrayLike;
        exports.guessLength = guessLength;
        exports.toArray = toArray;
        exports.toArrayWithIndices = toArrayWithIndices;

    }, {"./typed-arrays.js": 12, "obliterator/foreach": 13}],
    12: [function (require, module, exports) {
        /**
         * Mnemonist Typed Array Helpers
         * ==============================
         *
         * Miscellaneous helpers related to typed arrays.
         */

        /**
         * When using an unsigned integer array to store pointers, one might want to
         * choose the optimal word size in regards to the actual numbers of pointers
         * to store.
         *
         * This helpers does just that.
         *
         * @param  {number} size - Expected size of the array to map.
         * @return {TypedArray}
         */
        var MAX_8BIT_INTEGER = Math.pow(2, 8) - 1,
            MAX_16BIT_INTEGER = Math.pow(2, 16) - 1,
            MAX_32BIT_INTEGER = Math.pow(2, 32) - 1;

        var MAX_SIGNED_8BIT_INTEGER = Math.pow(2, 7) - 1,
            MAX_SIGNED_16BIT_INTEGER = Math.pow(2, 15) - 1,
            MAX_SIGNED_32BIT_INTEGER = Math.pow(2, 31) - 1;

        exports.getPointerArray = function (size) {
            var maxIndex = size - 1;

            if (maxIndex <= MAX_8BIT_INTEGER)
                return Uint8Array;

            if (maxIndex <= MAX_16BIT_INTEGER)
                return Uint16Array;

            if (maxIndex <= MAX_32BIT_INTEGER)
                return Uint32Array;

            throw new Error('mnemonist: Pointer Array of size > 4294967295 is not supported.');
        };

        exports.getSignedPointerArray = function (size) {
            var maxIndex = size - 1;

            if (maxIndex <= MAX_SIGNED_8BIT_INTEGER)
                return Int8Array;

            if (maxIndex <= MAX_SIGNED_16BIT_INTEGER)
                return Int16Array;

            if (maxIndex <= MAX_SIGNED_32BIT_INTEGER)
                return Int32Array;

            return Float64Array;
        };

        /**
         * Function returning the minimal type able to represent the given number.
         *
         * @param  {number} value - Value to test.
         * @return {TypedArrayClass}
         */
        exports.getNumberType = function (value) {

            // <= 32 bits itnteger?
            if (value === (value | 0)) {

                // Negative
                if (Math.sign(value) === -1) {
                    if (value <= 127 && value >= -128)
                        return Int8Array;

                    if (value <= 32767 && value >= -32768)
                        return Int16Array;

                    return Int32Array;
                } else {

                    if (value <= 255)
                        return Uint8Array;

                    if (value <= 65535)
                        return Uint16Array;

                    return Uint32Array;
                }
            }

            // 53 bits integer & floats
            // NOTE: it's kinda hard to tell whether we could use 32bits or not...
            return Float64Array;
        };

        /**
         * Function returning the minimal type able to represent the given array
         * of JavaScript numbers.
         *
         * @param  {array}    array  - Array to represent.
         * @param  {function} getter - Optional getter.
         * @return {TypedArrayClass}
         */
        var TYPE_PRIORITY = {
            Uint8Array: 1,
            Int8Array: 2,
            Uint16Array: 3,
            Int16Array: 4,
            Uint32Array: 5,
            Int32Array: 6,
            Float32Array: 7,
            Float64Array: 8
        };

// TODO: make this a one-shot for one value
        exports.getMinimalRepresentation = function (array, getter) {
            var maxType = null,
                maxPriority = 0,
                p,
                t,
                v,
                i,
                l;

            for (i = 0, l = array.length; i < l; i++) {
                v = getter ? getter(array[i]) : array[i];
                t = exports.getNumberType(v);
                p = TYPE_PRIORITY[t.name];

                if (p > maxPriority) {
                    maxPriority = p;
                    maxType = t;
                }
            }

            return maxType;
        };

        /**
         * Function returning whether the given value is a typed array.
         *
         * @param  {any} value - Value to test.
         * @return {boolean}
         */
        exports.isTypedArray = function (value) {
            return typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(value);
        };

        /**
         * Function used to concat byte arrays.
         *
         * @param  {...ByteArray}
         * @return {ByteArray}
         */
        exports.concat = function () {
            var length = 0,
                i,
                o,
                l;

            for (i = 0, l = arguments.length; i < l; i++)
                length += arguments[i].length;

            var array = new (arguments[0].constructor)(length);

            for (i = 0, o = 0; i < l; i++) {
                array.set(arguments[i], o);
                o += arguments[i].length;
            }

            return array;
        };

        /**
         * Function used to initialize a byte array of indices.
         *
         * @param  {number}    length - Length of target.
         * @return {ByteArray}
         */
        exports.indices = function (length) {
            var PointerArray = exports.getPointerArray(length);

            var array = new PointerArray(length);

            for (var i = 0; i < length; i++)
                array[i] = i;

            return array;
        };

    }, {}],
    13: [function (require, module, exports) {
        /**
         * Obliterator ForEach Function
         * =============================
         *
         * Helper function used to easily iterate over mixed values.
         */

        /**
         * Constants.
         */
        var ARRAY_BUFFER_SUPPORT = typeof ArrayBuffer !== 'undefined',
            SYMBOL_SUPPORT = typeof Symbol !== 'undefined';

        /**
         * Function able to iterate over almost any iterable JS value.
         *
         * @param  {any}      iterable - Iterable value.
         * @param  {function} callback - Callback function.
         */
        function forEach(iterable, callback) {
            var iterator, k, i, l, s;

            if (!iterable)
                throw new Error('obliterator/forEach: invalid iterable.');

            if (typeof callback !== 'function')
                throw new Error('obliterator/forEach: expecting a callback.');

            // The target is an array or a string or function arguments
            if (
                Array.isArray(iterable) ||
                (ARRAY_BUFFER_SUPPORT && ArrayBuffer.isView(iterable)) ||
                typeof iterable === 'string' ||
                iterable.toString() === '[object Arguments]'
            ) {
                for (i = 0, l = iterable.length; i < l; i++)
                    callback(iterable[i], i);
                return;
            }

            // The target has a #.forEach method
            if (typeof iterable.forEach === 'function') {
                iterable.forEach(callback);
                return;
            }

            // The target is iterable
            if (
                SYMBOL_SUPPORT &&
                Symbol.iterator in iterable &&
                typeof iterable.next !== 'function'
            ) {
                iterable = iterable[Symbol.iterator]();
            }

            // The target is an iterator
            if (typeof iterable.next === 'function') {
                iterator = iterable;
                i = 0;

                while ((s = iterator.next(), s.done !== true)) {
                    callback(s.value, i);
                    i++;
                }

                return;
            }

            // The target is a plain object
            for (k in iterable) {
                if (iterable.hasOwnProperty(k)) {
                    callback(iterable[k], k);
                }
            }

            return;
        }

        /**
         * Same function as the above `forEach` but will yield `null` when the target
         * does not have keys.
         *
         * @param  {any}      iterable - Iterable value.
         * @param  {function} callback - Callback function.
         */
        forEach.forEachWithNullKeys = function (iterable, callback) {
            var iterator, k, i, l, s;

            if (!iterable)
                throw new Error('obliterator/forEachWithNullKeys: invalid iterable.');

            if (typeof callback !== 'function')
                throw new Error('obliterator/forEachWithNullKeys: expecting a callback.');

            // The target is an array or a string or function arguments
            if (
                Array.isArray(iterable) ||
                (ARRAY_BUFFER_SUPPORT && ArrayBuffer.isView(iterable)) ||
                typeof iterable === 'string' ||
                iterable.toString() === '[object Arguments]'
            ) {
                for (i = 0, l = iterable.length; i < l; i++)
                    callback(iterable[i], null);
                return;
            }

            // The target is a Set
            if (iterable instanceof Set) {
                iterable.forEach(function (value) {
                    callback(value, null);
                });
                return;
            }

            // The target has a #.forEach method
            if (typeof iterable.forEach === 'function') {
                iterable.forEach(callback);
                return;
            }

            // The target is iterable
            if (
                SYMBOL_SUPPORT &&
                Symbol.iterator in iterable &&
                typeof iterable.next !== 'function'
            ) {
                iterable = iterable[Symbol.iterator]();
            }

            // The target is an iterator
            if (typeof iterable.next === 'function') {
                iterator = iterable;
                i = 0;

                while ((s = iterator.next(), s.done !== true)) {
                    callback(s.value, null);
                    i++;
                }

                return;
            }

            // The target is a plain object
            for (k in iterable) {
                if (iterable.hasOwnProperty(k)) {
                    callback(iterable[k], k);
                }
            }

            return;
        };

        /**
         * Exporting.
         */
        module.exports = forEach;

    }, {}],
    14: [function (require, module, exports) {
        "use strict"

        module.exports = compressExpansion

        function compressExpansion(e) {
            var m = e.length
            var Q = e[e.length - 1]
            var bottom = m
            for (var i = m - 2; i >= 0; --i) {
                var a = Q
                var b = e[i]
                Q = a + b
                var bv = Q - a
                var q = b - bv
                if (q) {
                    e[--bottom] = Q
                    Q = q
                }
            }
            var top = 0
            for (var i = bottom; i < m; ++i) {
                var a = e[i]
                var b = Q
                Q = a + b
                var bv = Q - a
                var q = b - bv
                if (q) {
                    e[top++] = q
                }
            }
            e[top++] = Q
            e.length = top
            return e
        }
    }, {}],
    15: [function (require, module, exports) {
        "use strict"

        var twoProduct = require("two-product")
        var robustSum = require("robust-sum")
        var robustScale = require("robust-scale")
        var compress = require("robust-compress")

        var NUM_EXPANDED = 6

        function cofactor(m, c) {
            var result = new Array(m.length - 1)
            for (var i = 1; i < m.length; ++i) {
                var r = result[i - 1] = new Array(m.length - 1)
                for (var j = 0, k = 0; j < m.length; ++j) {
                    if (j === c) {
                        continue
                    }
                    r[k++] = m[i][j]
                }
            }
            return result
        }

        function matrix(n) {
            var result = new Array(n)
            for (var i = 0; i < n; ++i) {
                result[i] = new Array(n)
                for (var j = 0; j < n; ++j) {
                    result[i][j] = ["m[", i, "][", j, "]"].join("")
                }
            }
            return result
        }

        function sign(n) {
            if (n & 1) {
                return "-"
            }
            return ""
        }

        function generateSum(expr) {
            if (expr.length === 1) {
                return expr[0]
            } else if (expr.length === 2) {
                return ["sum(", expr[0], ",", expr[1], ")"].join("")
            } else {
                var m = expr.length >> 1
                return ["sum(", generateSum(expr.slice(0, m)), ",", generateSum(expr.slice(m)), ")"].join("")
            }
        }

        function determinant(m) {
            if (m.length === 2) {
                return ["sum(prod(", m[0][0], ",", m[1][1], "),prod(-", m[0][1], ",", m[1][0], "))"].join("")
            } else {
                var expr = []
                for (var i = 0; i < m.length; ++i) {
                    expr.push(["scale(", determinant(cofactor(m, i)), ",", sign(i), m[0][i], ")"].join(""))
                }
                return generateSum(expr)
            }
        }

        function compileDeterminant(n) {
            var proc = new Function("sum", "scale", "prod", "compress", [
                "function robustDeterminant", n, "(m){return compress(",
                determinant(matrix(n)),
                ")};return robustDeterminant", n].join(""))
            return proc(robustSum, robustScale, twoProduct, compress)
        }

        var CACHE = [
            function robustDeterminant0() {
                return [0]
            },
            function robustDeterminant1(m) {
                return [m[0][0]]
            }
        ]

        function generateDispatch() {
            while (CACHE.length < NUM_EXPANDED) {
                CACHE.push(compileDeterminant(CACHE.length))
            }
            var procArgs = []
            var code = ["function robustDeterminant(m){switch(m.length){"]
            for (var i = 0; i < NUM_EXPANDED; ++i) {
                procArgs.push("det" + i)
                code.push("case ", i, ":return det", i, "(m);")
            }
            code.push("}\
var det=CACHE[m.length];\
if(!det)\
det=CACHE[m.length]=gen(m.length);\
return det(m);\
}\
return robustDeterminant")
            procArgs.push("CACHE", "gen", code.join(""))
            var proc = Function.apply(undefined, procArgs)
            module.exports = proc.apply(undefined, CACHE.concat([CACHE, compileDeterminant]))
            for (var i = 0; i < CACHE.length; ++i) {
                module.exports[i] = CACHE[i]
            }
        }

        generateDispatch()
    }, {"robust-compress": 14, "robust-scale": 18, "robust-sum": 20, "two-product": 22}],
    16: [function (require, module, exports) {
        "use strict"

        var determinant = require("robust-determinant")

        var NUM_EXPAND = 6

        function generateSolver(n) {
            var funcName = "robustLinearSolve" + n + "d"
            var code = ["function ", funcName, "(A,b){return ["]
            for (var i = 0; i < n; ++i) {
                code.push("det([")
                for (var j = 0; j < n; ++j) {
                    if (j > 0) {
                        code.push(",")
                    }
                    code.push("[")
                    for (var k = 0; k < n; ++k) {
                        if (k > 0) {
                            code.push(",")
                        }
                        if (k === i) {
                            code.push("+b[", j, "]")
                        } else {
                            code.push("+A[", j, "][", k, "]")
                        }
                    }
                    code.push("]")
                }
                code.push("]),")
            }
            code.push("det(A)]}return ", funcName)
            var proc = new Function("det", code.join(""))
            if (n < 6) {
                return proc(determinant[n])
            }
            return proc(determinant)
        }

        function robustLinearSolve0d() {
            return [0]
        }

        function robustLinearSolve1d(A, b) {
            return [[b[0]], [A[0][0]]]
        }

        var CACHE = [
            robustLinearSolve0d,
            robustLinearSolve1d
        ]

        function generateDispatch() {
            while (CACHE.length < NUM_EXPAND) {
                CACHE.push(generateSolver(CACHE.length))
            }
            var procArgs = []
            var code = ["function dispatchLinearSolve(A,b){switch(A.length){"]
            for (var i = 0; i < NUM_EXPAND; ++i) {
                procArgs.push("s" + i)
                code.push("case ", i, ":return s", i, "(A,b);")
            }
            code.push("}var s=CACHE[A.length];if(!s)s=CACHE[A.length]=g(A.length);return s(A,b)}return dispatchLinearSolve")
            procArgs.push("CACHE", "g", code.join(""))
            var proc = Function.apply(undefined, procArgs)
            module.exports = proc.apply(undefined, CACHE.concat([CACHE, generateSolver]))
            for (var i = 0; i < NUM_EXPAND; ++i) {
                module.exports[i] = CACHE[i]
            }
        }

        generateDispatch()
    }, {"robust-determinant": 15}],
    17: [function (require, module, exports) {
        "use strict"

        var twoProduct = require("two-product")
        var robustSum = require("robust-sum")
        var robustScale = require("robust-scale")
        var robustSubtract = require("robust-subtract")

        var NUM_EXPAND = 5

        var EPSILON = 1.1102230246251565e-16
        var ERRBOUND3 = (3.0 + 16.0 * EPSILON) * EPSILON
        var ERRBOUND4 = (7.0 + 56.0 * EPSILON) * EPSILON

        function orientation_3(sum, prod, scale, sub) {
            return function orientation3Exact(m0, m1, m2) {
                var p = sum(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])))
                var n = sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0]))
                var d = sub(p, n)
                return d[d.length - 1]
            }
        }

        function orientation_4(sum, prod, scale, sub) {
            return function orientation4Exact(m0, m1, m2, m3) {
                var p = sum(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))))
                var n = sum(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), sum(scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))))
                var d = sub(p, n)
                return d[d.length - 1]
            }
        }

        function orientation_5(sum, prod, scale, sub) {
            return function orientation5Exact(m0, m1, m2, m3, m4) {
                var p = sum(sum(sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m2[2]), sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), -m3[2]), scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m4[2]))), m1[3]), sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m3[2]), scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m4[2]))), -m2[3]), scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m4[2]))), m3[3]))), sum(scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), -m4[3]), sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m3[2]), scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m4[2]))), m0[3]), scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m3[2]), scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), m4[2]))), -m1[3])))), sum(sum(scale(sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m4[2]))), m3[3]), sum(scale(sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))), -m4[3]), scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), m0[3]))), sum(scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), -m1[3]), sum(scale(sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))), m2[3]), scale(sum(scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))), -m3[3])))))
                var n = sum(sum(sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m2[2]), sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), -m3[2]), scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m4[2]))), m0[3]), scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m3[2]), scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), m4[2]))), -m2[3])), sum(scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m4[2]))), m3[3]), scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), -m4[3]))), sum(sum(scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m4[2]))), m0[3]), scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m4[2]))), -m1[3])), sum(scale(sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m4[2]))), m2[3]), scale(sum(scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))), -m4[3]))))
                var d = sub(p, n)
                return d[d.length - 1]
            }
        }

        function orientation(n) {
            var fn =
                n === 3 ? orientation_3 :
                    n === 4 ? orientation_4 : orientation_5

            return fn(robustSum, twoProduct, robustScale, robustSubtract)
        }

        var orientation3Exact = orientation(3)
        var orientation4Exact = orientation(4)

        var CACHED = [
            function orientation0() {
                return 0
            },
            function orientation1() {
                return 0
            },
            function orientation2(a, b) {
                return b[0] - a[0]
            },
            function orientation3(a, b, c) {
                var l = (a[1] - c[1]) * (b[0] - c[0])
                var r = (a[0] - c[0]) * (b[1] - c[1])
                var det = l - r
                var s
                if (l > 0) {
                    if (r <= 0) {
                        return det
                    } else {
                        s = l + r
                    }
                } else if (l < 0) {
                    if (r >= 0) {
                        return det
                    } else {
                        s = -(l + r)
                    }
                } else {
                    return det
                }
                var tol = ERRBOUND3 * s
                if (det >= tol || det <= -tol) {
                    return det
                }
                return orientation3Exact(a, b, c)
            },
            function orientation4(a, b, c, d) {
                var adx = a[0] - d[0]
                var bdx = b[0] - d[0]
                var cdx = c[0] - d[0]
                var ady = a[1] - d[1]
                var bdy = b[1] - d[1]
                var cdy = c[1] - d[1]
                var adz = a[2] - d[2]
                var bdz = b[2] - d[2]
                var cdz = c[2] - d[2]
                var bdxcdy = bdx * cdy
                var cdxbdy = cdx * bdy
                var cdxady = cdx * ady
                var adxcdy = adx * cdy
                var adxbdy = adx * bdy
                var bdxady = bdx * ady
                var det = adz * (bdxcdy - cdxbdy)
                    + bdz * (cdxady - adxcdy)
                    + cdz * (adxbdy - bdxady)
                var permanent = (Math.abs(bdxcdy) + Math.abs(cdxbdy)) * Math.abs(adz)
                    + (Math.abs(cdxady) + Math.abs(adxcdy)) * Math.abs(bdz)
                    + (Math.abs(adxbdy) + Math.abs(bdxady)) * Math.abs(cdz)
                var tol = ERRBOUND4 * permanent
                if ((det > tol) || (-det > tol)) {
                    return det
                }
                return orientation4Exact(a, b, c, d)
            }
        ]

        function slowOrient(args) {
            var proc = CACHED[args.length]
            if (!proc) {
                proc = CACHED[args.length] = orientation(args.length)
            }
            return proc.apply(undefined, args)
        }

        function proc(slow, o0, o1, o2, o3, o4, o5) {
            return function getOrientation(a0, a1, a2, a3, a4) {
                switch (arguments.length) {
                    case 0:
                    case 1:
                        return 0;
                    case 2:
                        return o2(a0, a1)
                    case 3:
                        return o3(a0, a1, a2)
                    case 4:
                        return o4(a0, a1, a2, a3)
                    case 5:
                        return o5(a0, a1, a2, a3, a4)
                }

                var s = new Array(arguments.length)
                for (var i = 0; i < arguments.length; ++i) {
                    s[i] = arguments[i]
                }
                return slow(s)
            }
        }

        function generateOrientationProc() {
            while (CACHED.length <= NUM_EXPAND) {
                CACHED.push(orientation(CACHED.length))
            }
            module.exports = proc.apply(undefined, [slowOrient].concat(CACHED))
            for (var i = 0; i <= NUM_EXPAND; ++i) {
                module.exports[i] = CACHED[i]
            }
        }

        generateOrientationProc()
    }, {"robust-scale": 18, "robust-subtract": 19, "robust-sum": 20, "two-product": 22}],
    18: [function (require, module, exports) {
        "use strict"

        var twoProduct = require("two-product")
        var twoSum = require("two-sum")

        module.exports = scaleLinearExpansion

        function scaleLinearExpansion(e, scale) {
            var n = e.length
            if (n === 1) {
                var ts = twoProduct(e[0], scale)
                if (ts[0]) {
                    return ts
                }
                return [ts[1]]
            }
            var g = new Array(2 * n)
            var q = [0.1, 0.1]
            var t = [0.1, 0.1]
            var count = 0
            twoProduct(e[0], scale, q)
            if (q[0]) {
                g[count++] = q[0]
            }
            for (var i = 1; i < n; ++i) {
                twoProduct(e[i], scale, t)
                var pq = q[1]
                twoSum(pq, t[0], q)
                if (q[0]) {
                    g[count++] = q[0]
                }
                var a = t[1]
                var b = q[1]
                var x = a + b
                var bv = x - a
                var y = b - bv
                q[1] = x
                if (y) {
                    g[count++] = y
                }
            }
            if (q[1]) {
                g[count++] = q[1]
            }
            if (count === 0) {
                g[count++] = 0.0
            }
            g.length = count
            return g
        }
    }, {"two-product": 22, "two-sum": 23}],
    19: [function (require, module, exports) {
        "use strict"

        module.exports = robustSubtract

//Easy case: Add two scalars
        function scalarScalar(a, b) {
            var x = a + b
            var bv = x - a
            var av = x - bv
            var br = b - bv
            var ar = a - av
            var y = ar + br
            if (y) {
                return [y, x]
            }
            return [x]
        }

        function robustSubtract(e, f) {
            var ne = e.length | 0
            var nf = f.length | 0
            if (ne === 1 && nf === 1) {
                return scalarScalar(e[0], -f[0])
            }
            var n = ne + nf
            var g = new Array(n)
            var count = 0
            var eptr = 0
            var fptr = 0
            var abs = Math.abs
            var ei = e[eptr]
            var ea = abs(ei)
            var fi = -f[fptr]
            var fa = abs(fi)
            var a, b
            if (ea < fa) {
                b = ei
                eptr += 1
                if (eptr < ne) {
                    ei = e[eptr]
                    ea = abs(ei)
                }
            } else {
                b = fi
                fptr += 1
                if (fptr < nf) {
                    fi = -f[fptr]
                    fa = abs(fi)
                }
            }
            if ((eptr < ne && ea < fa) || (fptr >= nf)) {
                a = ei
                eptr += 1
                if (eptr < ne) {
                    ei = e[eptr]
                    ea = abs(ei)
                }
            } else {
                a = fi
                fptr += 1
                if (fptr < nf) {
                    fi = -f[fptr]
                    fa = abs(fi)
                }
            }
            var x = a + b
            var bv = x - a
            var y = b - bv
            var q0 = y
            var q1 = x
            var _x, _bv, _av, _br, _ar
            while (eptr < ne && fptr < nf) {
                if (ea < fa) {
                    a = ei
                    eptr += 1
                    if (eptr < ne) {
                        ei = e[eptr]
                        ea = abs(ei)
                    }
                } else {
                    a = fi
                    fptr += 1
                    if (fptr < nf) {
                        fi = -f[fptr]
                        fa = abs(fi)
                    }
                }
                b = q0
                x = a + b
                bv = x - a
                y = b - bv
                if (y) {
                    g[count++] = y
                }
                _x = q1 + x
                _bv = _x - q1
                _av = _x - _bv
                _br = x - _bv
                _ar = q1 - _av
                q0 = _ar + _br
                q1 = _x
            }
            while (eptr < ne) {
                a = ei
                b = q0
                x = a + b
                bv = x - a
                y = b - bv
                if (y) {
                    g[count++] = y
                }
                _x = q1 + x
                _bv = _x - q1
                _av = _x - _bv
                _br = x - _bv
                _ar = q1 - _av
                q0 = _ar + _br
                q1 = _x
                eptr += 1
                if (eptr < ne) {
                    ei = e[eptr]
                }
            }
            while (fptr < nf) {
                a = fi
                b = q0
                x = a + b
                bv = x - a
                y = b - bv
                if (y) {
                    g[count++] = y
                }
                _x = q1 + x
                _bv = _x - q1
                _av = _x - _bv
                _br = x - _bv
                _ar = q1 - _av
                q0 = _ar + _br
                q1 = _x
                fptr += 1
                if (fptr < nf) {
                    fi = -f[fptr]
                }
            }
            if (q0) {
                g[count++] = q0
            }
            if (q1) {
                g[count++] = q1
            }
            if (!count) {
                g[count++] = 0.0
            }
            g.length = count
            return g
        }
    }, {}],
    20: [function (require, module, exports) {
        "use strict"

        module.exports = linearExpansionSum

//Easy case: Add two scalars
        function scalarScalar(a, b) {
            var x = a + b
            var bv = x - a
            var av = x - bv
            var br = b - bv
            var ar = a - av
            var y = ar + br
            if (y) {
                return [y, x]
            }
            return [x]
        }

        function linearExpansionSum(e, f) {
            var ne = e.length | 0
            var nf = f.length | 0
            if (ne === 1 && nf === 1) {
                return scalarScalar(e[0], f[0])
            }
            var n = ne + nf
            var g = new Array(n)
            var count = 0
            var eptr = 0
            var fptr = 0
            var abs = Math.abs
            var ei = e[eptr]
            var ea = abs(ei)
            var fi = f[fptr]
            var fa = abs(fi)
            var a, b
            if (ea < fa) {
                b = ei
                eptr += 1
                if (eptr < ne) {
                    ei = e[eptr]
                    ea = abs(ei)
                }
            } else {
                b = fi
                fptr += 1
                if (fptr < nf) {
                    fi = f[fptr]
                    fa = abs(fi)
                }
            }
            if ((eptr < ne && ea < fa) || (fptr >= nf)) {
                a = ei
                eptr += 1
                if (eptr < ne) {
                    ei = e[eptr]
                    ea = abs(ei)
                }
            } else {
                a = fi
                fptr += 1
                if (fptr < nf) {
                    fi = f[fptr]
                    fa = abs(fi)
                }
            }
            var x = a + b
            var bv = x - a
            var y = b - bv
            var q0 = y
            var q1 = x
            var _x, _bv, _av, _br, _ar
            while (eptr < ne && fptr < nf) {
                if (ea < fa) {
                    a = ei
                    eptr += 1
                    if (eptr < ne) {
                        ei = e[eptr]
                        ea = abs(ei)
                    }
                } else {
                    a = fi
                    fptr += 1
                    if (fptr < nf) {
                        fi = f[fptr]
                        fa = abs(fi)
                    }
                }
                b = q0
                x = a + b
                bv = x - a
                y = b - bv
                if (y) {
                    g[count++] = y
                }
                _x = q1 + x
                _bv = _x - q1
                _av = _x - _bv
                _br = x - _bv
                _ar = q1 - _av
                q0 = _ar + _br
                q1 = _x
            }
            while (eptr < ne) {
                a = ei
                b = q0
                x = a + b
                bv = x - a
                y = b - bv
                if (y) {
                    g[count++] = y
                }
                _x = q1 + x
                _bv = _x - q1
                _av = _x - _bv
                _br = x - _bv
                _ar = q1 - _av
                q0 = _ar + _br
                q1 = _x
                eptr += 1
                if (eptr < ne) {
                    ei = e[eptr]
                }
            }
            while (fptr < nf) {
                a = fi
                b = q0
                x = a + b
                bv = x - a
                y = b - bv
                if (y) {
                    g[count++] = y
                }
                _x = q1 + x
                _bv = _x - q1
                _av = _x - _bv
                _br = x - _bv
                _ar = q1 - _av
                q0 = _ar + _br
                q1 = _x
                fptr += 1
                if (fptr < nf) {
                    fi = f[fptr]
                }
            }
            if (q0) {
                g[count++] = q0
            }
            if (q1) {
                g[count++] = q1
            }
            if (!count) {
                g[count++] = 0.0
            }
            g.length = count
            return g
        }
    }, {}],
    21: [function (require, module, exports) {
        "use strict";
        "use restrict";

        var bits = require("bit-twiddle")
            , UnionFind = require("union-find")

//Returns the dimension of a cell complex
        function dimension(cells) {
            var d = 0
                , max = Math.max
            for (var i = 0, il = cells.length; i < il; ++i) {
                d = max(d, cells[i].length)
            }
            return d - 1
        }

        exports.dimension = dimension

//Counts the number of vertices in faces
        function countVertices(cells) {
            var vc = -1
                , max = Math.max
            for (var i = 0, il = cells.length; i < il; ++i) {
                var c = cells[i]
                for (var j = 0, jl = c.length; j < jl; ++j) {
                    vc = max(vc, c[j])
                }
            }
            return vc + 1
        }

        exports.countVertices = countVertices

//Returns a deep copy of cells
        function cloneCells(cells) {
            var ncells = new Array(cells.length)
            for (var i = 0, il = cells.length; i < il; ++i) {
                ncells[i] = cells[i].slice(0)
            }
            return ncells
        }

        exports.cloneCells = cloneCells

//Ranks a pair of cells up to permutation
        function compareCells(a, b) {
            var n = a.length
                , t = a.length - b.length
                , min = Math.min
            if (t) {
                return t
            }
            switch (n) {
                case 0:
                    return 0;
                case 1:
                    return a[0] - b[0];
                case 2:
                    var d = a[0] + a[1] - b[0] - b[1]
                    if (d) {
                        return d
                    }
                    return min(a[0], a[1]) - min(b[0], b[1])
                case 3:
                    var l1 = a[0] + a[1]
                        , m1 = b[0] + b[1]
                    d = l1 + a[2] - (m1 + b[2])
                    if (d) {
                        return d
                    }
                    var l0 = min(a[0], a[1])
                        , m0 = min(b[0], b[1])
                        , d = min(l0, a[2]) - min(m0, b[2])
                    if (d) {
                        return d
                    }
                    return min(l0 + a[2], l1) - min(m0 + b[2], m1)

                //TODO: Maybe optimize n=4 as well?

                default:
                    var as = a.slice(0)
                    as.sort()
                    var bs = b.slice(0)
                    bs.sort()
                    for (var i = 0; i < n; ++i) {
                        t = as[i] - bs[i]
                        if (t) {
                            return t
                        }
                    }
                    return 0
            }
        }

        exports.compareCells = compareCells

        function compareZipped(a, b) {
            return compareCells(a[0], b[0])
        }

//Puts a cell complex into normal order for the purposes of findCell queries
        function normalize(cells, attr) {
            if (attr) {
                var len = cells.length
                var zipped = new Array(len)
                for (var i = 0; i < len; ++i) {
                    zipped[i] = [cells[i], attr[i]]
                }
                zipped.sort(compareZipped)
                for (var i = 0; i < len; ++i) {
                    cells[i] = zipped[i][0]
                    attr[i] = zipped[i][1]
                }
                return cells
            } else {
                cells.sort(compareCells)
                return cells
            }
        }

        exports.normalize = normalize

//Removes all duplicate cells in the complex
        function unique(cells) {
            if (cells.length === 0) {
                return []
            }
            var ptr = 1
                , len = cells.length
            for (var i = 1; i < len; ++i) {
                var a = cells[i]
                if (compareCells(a, cells[i - 1])) {
                    if (i === ptr) {
                        ptr++
                        continue
                    }
                    cells[ptr++] = a
                }
            }
            cells.length = ptr
            return cells
        }

        exports.unique = unique;

//Finds a cell in a normalized cell complex
        function findCell(cells, c) {
            var lo = 0
                , hi = cells.length - 1
                , r = -1
            while (lo <= hi) {
                var mid = (lo + hi) >> 1
                    , s = compareCells(cells[mid], c)
                if (s <= 0) {
                    if (s === 0) {
                        r = mid
                    }
                    lo = mid + 1
                } else if (s > 0) {
                    hi = mid - 1
                }
            }
            return r
        }

        exports.findCell = findCell;

//Builds an index for an n-cell.  This is more general than dual, but less efficient
        function incidence(from_cells, to_cells) {
            var index = new Array(from_cells.length)
            for (var i = 0, il = index.length; i < il; ++i) {
                index[i] = []
            }
            var b = []
            for (var i = 0, n = to_cells.length; i < n; ++i) {
                var c = to_cells[i]
                var cl = c.length
                for (var k = 1, kn = (1 << cl); k < kn; ++k) {
                    b.length = bits.popCount(k)
                    var l = 0
                    for (var j = 0; j < cl; ++j) {
                        if (k & (1 << j)) {
                            b[l++] = c[j]
                        }
                    }
                    var idx = findCell(from_cells, b)
                    if (idx < 0) {
                        continue
                    }
                    while (true) {
                        index[idx++].push(i)
                        if (idx >= from_cells.length || compareCells(from_cells[idx], b) !== 0) {
                            break
                        }
                    }
                }
            }
            return index
        }

        exports.incidence = incidence

//Computes the dual of the mesh.  This is basically an optimized version of buildIndex for the situation where from_cells is just the list of vertices
        function dual(cells, vertex_count) {
            if (!vertex_count) {
                return incidence(unique(skeleton(cells, 0)), cells, 0)
            }
            var res = new Array(vertex_count)
            for (var i = 0; i < vertex_count; ++i) {
                res[i] = []
            }
            for (var i = 0, len = cells.length; i < len; ++i) {
                var c = cells[i]
                for (var j = 0, cl = c.length; j < cl; ++j) {
                    res[c[j]].push(i)
                }
            }
            return res
        }

        exports.dual = dual

//Enumerates all cells in the complex
        function explode(cells) {
            var result = []
            for (var i = 0, il = cells.length; i < il; ++i) {
                var c = cells[i]
                    , cl = c.length | 0
                for (var j = 1, jl = (1 << cl); j < jl; ++j) {
                    var b = []
                    for (var k = 0; k < cl; ++k) {
                        if ((j >>> k) & 1) {
                            b.push(c[k])
                        }
                    }
                    result.push(b)
                }
            }
            return normalize(result)
        }

        exports.explode = explode

//Enumerates all of the n-cells of a cell complex
        function skeleton(cells, n) {
            if (n < 0) {
                return []
            }
            var result = []
                , k0 = (1 << (n + 1)) - 1
            for (var i = 0; i < cells.length; ++i) {
                var c = cells[i]
                for (var k = k0; k < (1 << c.length); k = bits.nextCombination(k)) {
                    var b = new Array(n + 1)
                        , l = 0
                    for (var j = 0; j < c.length; ++j) {
                        if (k & (1 << j)) {
                            b[l++] = c[j]
                        }
                    }
                    result.push(b)
                }
            }
            return normalize(result)
        }

        exports.skeleton = skeleton;

//Computes the boundary of all cells, does not remove duplicates
        function boundary(cells) {
            var res = []
            for (var i = 0, il = cells.length; i < il; ++i) {
                var c = cells[i]
                for (var j = 0, cl = c.length; j < cl; ++j) {
                    var b = new Array(c.length - 1)
                    for (var k = 0, l = 0; k < cl; ++k) {
                        if (k !== j) {
                            b[l++] = c[k]
                        }
                    }
                    res.push(b)
                }
            }
            return normalize(res)
        }

        exports.boundary = boundary;

//Computes connected components for a dense cell complex
        function connectedComponents_dense(cells, vertex_count) {
            var labels = new UnionFind(vertex_count)
            for (var i = 0; i < cells.length; ++i) {
                var c = cells[i]
                for (var j = 0; j < c.length; ++j) {
                    for (var k = j + 1; k < c.length; ++k) {
                        labels.link(c[j], c[k])
                    }
                }
            }
            var components = []
                , component_labels = labels.ranks
            for (var i = 0; i < component_labels.length; ++i) {
                component_labels[i] = -1
            }
            for (var i = 0; i < cells.length; ++i) {
                var l = labels.find(cells[i][0])
                if (component_labels[l] < 0) {
                    component_labels[l] = components.length
                    components.push([cells[i].slice(0)])
                } else {
                    components[component_labels[l]].push(cells[i].slice(0))
                }
            }
            return components
        }

//Computes connected components for a sparse graph
        function connectedComponents_sparse(cells) {
            var vertices = unique(normalize(skeleton(cells, 0)))
                , labels = new UnionFind(vertices.length)
            for (var i = 0; i < cells.length; ++i) {
                var c = cells[i]
                for (var j = 0; j < c.length; ++j) {
                    var vj = findCell(vertices, [c[j]])
                    for (var k = j + 1; k < c.length; ++k) {
                        labels.link(vj, findCell(vertices, [c[k]]))
                    }
                }
            }
            var components = []
                , component_labels = labels.ranks
            for (var i = 0; i < component_labels.length; ++i) {
                component_labels[i] = -1
            }
            for (var i = 0; i < cells.length; ++i) {
                var l = labels.find(findCell(vertices, [cells[i][0]]));
                if (component_labels[l] < 0) {
                    component_labels[l] = components.length
                    components.push([cells[i].slice(0)])
                } else {
                    components[component_labels[l]].push(cells[i].slice(0))
                }
            }
            return components
        }

//Computes connected components for a cell complex
        function connectedComponents(cells, vertex_count) {
            if (vertex_count) {
                return connectedComponents_dense(cells, vertex_count)
            }
            return connectedComponents_sparse(cells)
        }

        exports.connectedComponents = connectedComponents

    }, {"bit-twiddle": 1, "union-find": 24}],
    22: [function (require, module, exports) {
        "use strict"

        module.exports = twoProduct

        var SPLITTER = +(Math.pow(2, 27) + 1.0)

        function twoProduct(a, b, result) {
            var x = a * b

            var c = SPLITTER * a
            var abig = c - a
            var ahi = c - abig
            var alo = a - ahi

            var d = SPLITTER * b
            var bbig = d - b
            var bhi = d - bbig
            var blo = b - bhi

            var err1 = x - (ahi * bhi)
            var err2 = err1 - (alo * bhi)
            var err3 = err2 - (ahi * blo)

            var y = alo * blo - err3

            if (result) {
                result[0] = y
                result[1] = x
                return result
            }

            return [y, x]
        }
    }, {}],
    23: [function (require, module, exports) {
        "use strict"

        module.exports = fastTwoSum

        function fastTwoSum(a, b, result) {
            var x = a + b
            var bv = x - a
            var av = x - bv
            var br = b - bv
            var ar = a - av
            if (result) {
                result[0] = ar + br
                result[1] = x
                return result
            }
            return [ar + br, x]
        }
    }, {}],
    24: [function (require, module, exports) {
        "use strict";
        "use restrict";

        module.exports = UnionFind;

        function UnionFind(count) {
            this.roots = new Array(count);
            this.ranks = new Array(count);

            for (var i = 0; i < count; ++i) {
                this.roots[i] = i;
                this.ranks[i] = 0;
            }
        }

        var proto = UnionFind.prototype

        Object.defineProperty(proto, "length", {
            "get": function () {
                return this.roots.length
            }
        })

        proto.makeSet = function () {
            var n = this.roots.length;
            this.roots.push(n);
            this.ranks.push(0);
            return n;
        }

        proto.find = function (x) {
            var x0 = x
            var roots = this.roots;
            while (roots[x] !== x) {
                x = roots[x]
            }
            while (roots[x0] !== x) {
                var y = roots[x0]
                roots[x0] = x
                x0 = y
            }
            return x;
        }

        proto.link = function (x, y) {
            var xr = this.find(x)
                , yr = this.find(y);
            if (xr === yr) {
                return;
            }
            var ranks = this.ranks
                , roots = this.roots
                , xd = ranks[xr]
                , yd = ranks[yr];
            if (xd < yd) {
                roots[xr] = yr;
            } else if (yd < xd) {
                roots[yr] = xr;
            } else {
                roots[yr] = xr;
                ++ranks[xr];
            }
        }
    }, {}],
    25: [function (require, module, exports) {
        "use strict"

        function unique_pred(list, compare) {
            var ptr = 1
                , len = list.length
                , a = list[0], b = list[0]
            for (var i = 1; i < len; ++i) {
                b = a
                a = list[i]
                if (compare(a, b)) {
                    if (i === ptr) {
                        ptr++
                        continue
                    }
                    list[ptr++] = a
                }
            }
            list.length = ptr
            return list
        }

        function unique_eq(list) {
            var ptr = 1
                , len = list.length
                , a = list[0], b = list[0]
            for (var i = 1; i < len; ++i, b = a) {
                b = a
                a = list[i]
                if (a !== b) {
                    if (i === ptr) {
                        ptr++
                        continue
                    }
                    list[ptr++] = a
                }
            }
            list.length = ptr
            return list
        }

        function unique(list, compare, sorted) {
            if (list.length === 0) {
                return list
            }
            if (compare) {
                if (!sorted) {
                    list.sort(compare)
                }
                return unique_pred(list, compare)
            }
            if (!sorted) {
                list.sort()
            }
            return unique_eq(list)
        }

        module.exports = unique

    }, {}],
    26: [function (require, module, exports) {
        Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
            const _voronoi = require("./voronoi.js");
            const KDTree = require('mnemonist/kd-tree');

            function Voronoi(points, cells, positions, triangles) {
                this.cells = cells;
                this.positions = positions;
                this.triangles = triangles;
                this.points = points;
                this.length = cells.length;
            }

            Voronoi.prototype.getPolygon = function (index) {

                if (index === undefined) {
                    const ret = [];
                    for (let i = 0; i < this.length; ++i) {
                        ret.push(this.getPolygon(i))
                    }
                    return ret;
                }

                if (index >= this.length) return;
                let cell = this.cells[index];
                cell = cell.filter((v) => v !== -1)
                const map = cell.map((p_inx) => {
                    return this.positions[p_inx]
                });
                return map;
            }

            Voronoi.prototype.getTriangle = function (index) {

                if (index === undefined) {
                    const ret = [];
                    for (let i = 0; i < this.triangles.length; ++i) {
                        const t = this.getTriangle(i);
                        if (t) ret.push(t);
                    }
                    return ret;
                }

                // Check if index is valid
                if (index < 0 || index >= this.triangles.length) return null;

                const triangle = this.triangles[index];

                // Check if this is an infinite triangle (containing -1)
                if (triangle.includes(-1)) return null;

                // Map triangle indices to actual positions
                return triangle.map(pointIndex => this.points[pointIndex]);
            };

            Voronoi.prototype.getPointTriangles = function (point_index) {
                // Check if point_index is valid
                if (point_index < 0 || point_index >= this.points.length) return [];

                const result = [];

                // Iterate through all triangles
                for (let i = 0; i < this.triangles.length; i++) {
                    const triangle = this.triangles[i];

                    // If the triangle contains our point and is finite, add it to results
                    if (triangle.includes(point_index) && !triangle.includes(-1)) {
                        result.push(this.getTriangle(i));
                    }
                }

                return result;
            };

            Snap.registerClass("Voronoi", Voronoi);

            Snap.voronoi = function (points) {
                const is_objPoint = points[0].hasOwnProperty("x");
                if (is_objPoint) points = toArrayPoints(points);
                const vor = _voronoi(points);
                if (is_objPoint) vor.positions = toObjPoints(vor.positions);
                return new Voronoi(points, vor.cells, vor.positions, vor.triangles);
            };

            function mergeSort(points, comp) {
                if (points.length < 2) return points;

                const n = points.length;
                let i = 0,
                    j = 0;
                const leftN = Math.floor(n / 2),
                    rightN = leftN;


                const leftPart = mergeSort(points.slice(0, leftN), comp),
                    rightPart = mergeSort(points.slice(rightN), comp);

                const sortedPart = [];

                while ((i < leftPart.length) && (j < rightPart.length)) {
                    if (comp(leftPart[i], rightPart[j]) < 0) {
                        sortedPart.push(leftPart[i]);
                        i += 1;
                    } else {
                        sortedPart.push(rightPart[j]);
                        j += 1;
                    }
                }
                while (i < leftPart.length) {
                    sortedPart.push(leftPart[i]);
                    i += 1;
                }
                while (j < rightPart.length) {
                    sortedPart.push(rightPart[j]);
                    j += 1;
                }
                return sortedPart;
            }

            function toObjPoints(point_arrray) {
                return point_arrray.map((p) => {
                    return {x: p[0], y: p[1]}
                })
            }

            function toArrayPoints(point_arrray) {
                return point_arrray.map((p) => {
                    return [p.x, p.y];
                })
            }

            function _closestPair(Px, Py) {
                let d;
                if (Px.length < 2) return {distance: Infinity, pair: [{x: 0, y: 0}, {x: 0, y: 0}]};
                if (Px.length < 3) {
                    //find euclid distance
                    d = Math.sqrt(Math.pow(Math.abs(Px[1].x - Px[0].x), 2) + Math.pow(Math.abs(Px[1].y - Px[0].y), 2));
                    return {
                        distance: d,
                        pair: [Px[0], Px[1]]
                    };
                }

                const n = Px.length,
                    leftN = Math.floor(n / 2),
                    rightN = leftN;

                const Xl = Px.slice(0, leftN),
                    Xr = Px.slice(rightN),
                    Xm = Xl[leftN - 1],
                    Yl = [],
                    Yr = [];
                //separate Py
                for (var i = 0; i < Py.length; i += 1) {
                    if (Py[i].x <= Xm.x)
                        Yl.push(Py[i]);
                    else
                        Yr.push(Py[i]);
                }

                const dLeft = _closestPair(Xl, Yl),
                    dRight = _closestPair(Xr, Yr);

                let minDelta = dLeft.distance,
                    clPair = dLeft.pair;
                if (dLeft.distance > dRight.distance) {
                    minDelta = dRight.distance;
                    clPair = dRight.pair;
                }


                //filter points around Xm within delta (minDelta)
                const closeY = [];
                for (i = 0; i < Py.length; i += 1) {
                    if (Math.abs(Py[i].x - Xm.x) < minDelta) closeY.push(Py[i]);
                }
                //find min within delta. 8 steps max
                for (i = 0; i < closeY.length; i += 1) {
                    for (let j = i + 1; j < Math.min((i + 8), closeY.length); j += 1) {
                        d = Math.sqrt(Math.pow(Math.abs(closeY[j].x - closeY[i].x), 2) + Math.pow(Math.abs(closeY[j].y - closeY[i].y), 2));
                        if (d < minDelta) {
                            minDelta = d;
                            clPair = [closeY[i], closeY[j]]
                        }
                    }
                }

                return {
                    distance: minDelta,
                    pair: clPair
                };
            }

            Snap.closestPair = function (points) {
                if (Array.isArray(points[0])) points = toObjPoints(Px);
                const sortX = function (a, b) {
                    return (a.x < b.x) ? -1 : ((a.x > b.x) ? 1 : 0);
                };
                const sortY = function (a, b) {
                    return (a.y < b.y) ? -1 : ((a.y > b.y) ? 1 : 0);
                };
                const Px = mergeSort(points, sortX);
                const Py = mergeSort(points, sortY);

                return _closestPair(Px, Py);
            };


            // function Node(obj, dimension, parent) {
            //     this.obj = obj;
            //     this.left = null;
            //     this.right = null;
            //     this.parent = parent;
            //     this.dimension = dimension;
            // }
            //
            // function KD_Tree(points, metric, dimensions) {
            //     if (Array.isArray(points[0])) points = toObjPoints(points);
            //     metric = metric || function (a, b) {
            //         return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
            //     }
            //     dimensions = dimensions || ["x", "y"]
            //
            //     var self = this;
            //
            //     function buildTree(points, depth, parent) {
            //         var dim = depth % dimensions.length,
            //             median,
            //             node;
            //
            //         if (points.length === 0) {
            //             return null;
            //         }
            //         if (points.length === 1) {
            //             return new Node(points[0], dim, parent);
            //         }
            //
            //         points.sort(function (a, b) {
            //             return a[dimensions[dim]] - b[dimensions[dim]];
            //         });
            //
            //         median = Math.floor(points.length / 2);
            //         node = new Node(points[median], dim, parent);
            //         node.left = buildTree(points.slice(0, median), depth + 1, node);
            //         node.right = buildTree(points.slice(median + 1), depth + 1, node);
            //
            //         return node;
            //     }
            //
            //     // Reloads a serialied tree
            //     function loadTree(data) {
            //         // Just need to restore the `parent` parameter
            //         self.root = data;
            //
            //         function restoreParent(root) {
            //             if (root.left) {
            //                 root.left.parent = root;
            //                 restoreParent(root.left);
            //             }
            //
            //             if (root.right) {
            //                 root.right.parent = root;
            //                 restoreParent(root.right);
            //             }
            //         }
            //
            //         restoreParent(self.root);
            //     }
            //
            //     // If points is not an array, assume we're loading a pre-built tree
            //     if (!Array.isArray(points)) loadTree(points, metric, dimensions);
            //     else this.root = buildTree(points, 0, null);
            //
            //     // Convert to a JSON serializable structure; this just requires removing
            //     // the `parent` property
            //     this.toJSON = function (src) {
            //         if (!src) src = this.root;
            //         var dest = new Node(src.obj, src.dimension, null);
            //         if (src.left) dest.left = self.toJSON(src.left);
            //         if (src.right) dest.right = self.toJSON(src.right);
            //         return dest;
            //     };
            //
            //     this.insert = function (point) {
            //         function innerSearch(node, parent) {
            //
            //             if (node === null) {
            //                 return parent;
            //             }
            //
            //             var dimension = dimensions[node.dimension];
            //             if (point[dimension] < node.obj[dimension]) {
            //                 return innerSearch(node.left, node);
            //             } else {
            //                 return innerSearch(node.right, node);
            //             }
            //         }
            //
            //         var insertPosition = innerSearch(this.root, null),
            //             newNode,
            //             dimension;
            //
            //         if (insertPosition === null) {
            //             this.root = new Node(point, 0, null);
            //             return;
            //         }
            //
            //         newNode = new Node(point, (insertPosition.dimension + 1) % dimensions.length, insertPosition);
            //         dimension = dimensions[insertPosition.dimension];
            //
            //         if (point[dimension] < insertPosition.obj[dimension]) {
            //             insertPosition.left = newNode;
            //         } else {
            //             insertPosition.right = newNode;
            //         }
            //     };
            //
            //     this.remove = function (point) {
            //         var node;
            //
            //         function nodeSearch(node) {
            //             if (node === null) {
            //                 return null;
            //             }
            //
            //             if (node.obj === point) {
            //                 return node;
            //             }
            //
            //             var dimension = dimensions[node.dimension];
            //
            //             if (point[dimension] < node.obj[dimension]) {
            //                 return nodeSearch(node.left, node);
            //             } else {
            //                 return nodeSearch(node.right, node);
            //             }
            //         }
            //
            //         function removeNode(node) {
            //             var nextNode,
            //                 nextObj,
            //                 pDimension;
            //
            //             function findMin(node, dim) {
            //                 var dimension,
            //                     own,
            //                     left,
            //                     right,
            //                     min;
            //
            //                 if (node === null) {
            //                     return null;
            //                 }
            //
            //                 dimension = dimensions[dim];
            //
            //                 if (node.dimension === dim) {
            //                     if (node.left !== null) {
            //                         return findMin(node.left, dim);
            //                     }
            //                     return node;
            //                 }
            //
            //                 own = node.obj[dimension];
            //                 left = findMin(node.left, dim);
            //                 right = findMin(node.right, dim);
            //                 min = node;
            //
            //                 if (left !== null && left.obj[dimension] < own) {
            //                     min = left;
            //                 }
            //                 if (right !== null && right.obj[dimension] < min.obj[dimension]) {
            //                     min = right;
            //                 }
            //                 return min;
            //             }
            //
            //             if (node.left === null && node.right === null) {
            //                 if (node.parent === null) {
            //                     self.root = null;
            //                     return;
            //                 }
            //
            //                 pDimension = dimensions[node.parent.dimension];
            //
            //                 if (node.obj[pDimension] < node.parent.obj[pDimension]) {
            //                     node.parent.left = null;
            //                 } else {
            //                     node.parent.right = null;
            //                 }
            //                 return;
            //             }
            //
            //             // If the right subtree is not empty, swap with the minimum element on the
            //             // node's dimension. If it is empty, we swap the left and right subtrees and
            //             // do the same.
            //             if (node.right !== null) {
            //                 nextNode = findMin(node.right, node.dimension);
            //                 nextObj = nextNode.obj;
            //                 removeNode(nextNode);
            //                 node.obj = nextObj;
            //             } else {
            //                 nextNode = findMin(node.left, node.dimension);
            //                 nextObj = nextNode.obj;
            //                 removeNode(nextNode);
            //                 node.right = node.left;
            //                 node.left = null;
            //                 node.obj = nextObj;
            //             }
            //
            //         }
            //
            //         node = nodeSearch(self.root);
            //
            //         if (node === null) {
            //             return;
            //         }
            //
            //         removeNode(node);
            //     };
            //
            //     this.nearest = function (point, maxNodes, maxDistance) {
            //         maxNodes = maxNodes || 1;
            //         if (Array.isArray(point)){
            //             let _p = point;
            //             point = {};
            //             _p.forEach((v,i)=>{
            //                 point[dimensions[i]] = v;
            //             })
            //         }
            //         var i,
            //             result,
            //             bestNodes;
            //
            //         bestNodes = new BinaryHeap(
            //             function (e) {
            //                 return -e[1];
            //             }
            //         );
            //
            //         function nearestSearch(node) {
            //             var bestChild,
            //                 dimension = dimensions[node.dimension],
            //                 ownDistance = metric(point, node.obj),
            //                 linearPoint = {},
            //                 linearDistance,
            //                 otherChild,
            //                 i;
            //
            //             function saveNode(node, distance) {
            //                 bestNodes.push([node, distance]);
            //                 if (bestNodes.size() > maxNodes) {
            //                     bestNodes.pop();
            //                 }
            //             }
            //
            //             for (i = 0; i < dimensions.length; i += 1) {
            //                 if (i === node.dimension) {
            //                     linearPoint[dimensions[i]] = point[dimensions[i]];
            //                 } else {
            //                     linearPoint[dimensions[i]] = node.obj[dimensions[i]];
            //                 }
            //             }
            //
            //             linearDistance = metric(linearPoint, node.obj);
            //
            //             if (node.right === null && node.left === null) {
            //                 if (bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) {
            //                     saveNode(node, ownDistance);
            //                 }
            //                 return;
            //             }
            //
            //             if (node.right === null) {
            //                 bestChild = node.left;
            //             } else if (node.left === null) {
            //                 bestChild = node.right;
            //             } else {
            //                 if (point[dimension] < node.obj[dimension]) {
            //                     bestChild = node.left;
            //                 } else {
            //                     bestChild = node.right;
            //                 }
            //             }
            //
            //             nearestSearch(bestChild);
            //
            //             if (bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) {
            //                 saveNode(node, ownDistance);
            //             }
            //
            //             if (bestNodes.size() < maxNodes || Math.abs(linearDistance) < bestNodes.peek()[1]) {
            //                 if (bestChild === node.left) {
            //                     otherChild = node.right;
            //                 } else {
            //                     otherChild = node.left;
            //                 }
            //                 if (otherChild !== null) {
            //                     nearestSearch(otherChild);
            //                 }
            //             }
            //         }
            //
            //         if (maxDistance) {
            //             for (i = 0; i < maxNodes; i += 1) {
            //                 bestNodes.push([null, maxDistance]);
            //             }
            //         }
            //
            //         if (self.root)
            //             nearestSearch(self.root);
            //
            //         result = [];
            //
            //         for (i = 0; i < Math.min(maxNodes, bestNodes.content.length); i += 1) {
            //             if (bestNodes.content[i][0]) {
            //                 result.push([bestNodes.content[i][0].obj, bestNodes.content[i][1]]);
            //             }
            //         }
            //         return result;
            //     };
            //
            //     this.balanceFactor = function () {
            //         function height(node) {
            //             if (node === null) {
            //                 return 0;
            //             }
            //             return Math.max(height(node.left), height(node.right)) + 1;
            //         }
            //
            //         function count(node) {
            //             if (node === null) {
            //                 return 0;
            //             }
            //             return count(node.left) + count(node.right) + 1;
            //         }
            //
            //         return height(self.root) / (Math.log(count(self.root)) / Math.log(2));
            //     };
            // }

            KDTree.prototype.attachPoints = function (points) {
                this.points = points;
            }

            KDTree.prototype.nearest = function (point, num) {
                num = Math.floor(num || 1);

                if (point.hasOwnProperty("x")) point = [point.x, point.y];

                if (this._ax) {
                    point = [point[this._ax - 1]];
                }

                let res;
                if (num > 1) {
                    res = this.kNearestNeighbors(num, point);
                    res = res.map((i) => this.points[i]);
                } else {
                    res = this.nearestNeighbor(point);
                    res = this.points[res];
                }

                return res;
            }

            function dist(p1, p2, sq) {
                if (sq) {
                    return Snap.len2(
                        p1.x || p1[0] || 0,
                        p1.y || p1[1] || 0,
                        p2.x || p2[0] || 0,
                        p2.y || p2[1] || 0,
                    )
                } else {
                    return Snap.len(
                        p1.x || p1[0] || 0,
                        p1.y || p1[1] || 0,
                        p2.x || p2[0] || 0,
                        p2.y || p2[1] || 0,
                    )
                }

            }

            KDTree.prototype.nearest_dist = function (point, num, sqere_dist) {
                num = Math.floor(num || 1);
                let points = this.nearest(point, num);

                switch (this._ax) {
                    case 1:
                        if (num > 1) {
                            return points.map((p) => [p,
                                Math.abs((point[0] || point.x || 0) - (p[0] || p.x || 0)),
                                dist(point, p)])
                        } else {
                            return [points,
                                Math.abs((point[0] || point.x || 0) - (points[0] || points.x || 0)),
                                dist(point, points, sqere_dist)]
                        }
                    case 2:
                       if (num > 1) {
                            return points.map((p) => [p,
                                Math.abs((point[1] || point.y || 0) - (p[1] || p.y || 0)),
                                dist(point, p)])
                        } else {
                            return [points,
                                Math.abs((point[1] || point.y || 0) - (points[1] || points.y || 0)),
                                dist(point, points, sqere_dist)]
                        }
                    default:
                        if (num > 1) {
                            return points.map((p) => [p, dist(point, p)])
                        } else {
                            return [points, dist(point, points, sqere_dist)]
                        }
                }
            }

            Snap.kdTree = function (points, dim) {
                let xs, ys, ax = [];
                const x_only = dim === 1 || dim === "x";
                const y_only = dim === 1 || dim === "y";
                if (!dim || x_only) {
                    xs = points.map((p) => (p.hasOwnProperty("x") ? p.x : p[0]));
                    ax.push(xs)
                }

                if (!dim || y_only) {
                    ys = points.map((p) => (p.hasOwnProperty("y") ? p.y : p[1]));
                    ax.push(ys)
                }

                let kd = KDTree.fromAxes(ax)
                kd._ax = (x_only) ? 1 : ((y_only) ? 2 : null)
                kd.attachPoints(points);

                return kd;
            }

            Snap.kdTreeX = function (points) {
                return Snap.kdTree(points, "x");
            }

            Snap.kdTreeY = function (points) {
                return Snap.kdTree(points, "y");
            }

            // Binary heap implementation from:
            // http://eloquentjavascript.net/appendix2.html

            function BinaryHeap(scoreFunction) {
                this.content = [];
                this.scoreFunction = scoreFunction;
            }

            BinaryHeap.prototype = {
                push: function (element) {
                    // Add the new element to the end of the array.
                    this.content.push(element);
                    // Allow it to bubble up.
                    this.bubbleUp(this.content.length - 1);
                },

                pop: function () {
                    // Store the first element so we can return it later.
                    var result = this.content[0];
                    // Get the element at the end of the array.
                    var end = this.content.pop();
                    // If there are any elements left, put the end element at the
                    // start, and let it sink down.
                    if (this.content.length > 0) {
                        this.content[0] = end;
                        this.sinkDown(0);
                    }
                    return result;
                },

                peek: function () {
                    return this.content[0];
                },

                remove: function (node) {
                    var len = this.content.length;
                    // To remove a value, we must search through the array to find
                    // it.
                    for (var i = 0; i < len; i++) {
                        if (this.content[i] == node) {
                            // When it is found, the process seen in 'pop' is repeated
                            // to fill up the hole.
                            var end = this.content.pop();
                            if (i != len - 1) {
                                this.content[i] = end;
                                if (this.scoreFunction(end) < this.scoreFunction(node))
                                    this.bubbleUp(i);
                                else
                                    this.sinkDown(i);
                            }
                            return;
                        }
                    }
                    throw new Error("Node not found.");
                },

                size: function () {
                    return this.content.length;
                },

                bubbleUp: function (n) {
                    // Fetch the element that has to be moved.
                    var element = this.content[n];
                    // When at 0, an element can not go up any further.
                    while (n > 0) {
                        // Compute the parent element's index, and fetch it.
                        var parentN = Math.floor((n + 1) / 2) - 1,
                            parent = this.content[parentN];
                        // Swap the elements if the parent is greater.
                        if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                            this.content[parentN] = element;
                            this.content[n] = parent;
                            // Update 'n' to continue at the new position.
                            n = parentN;
                        }
                        // Found a parent that is less, no need to move it further.
                        else {
                            break;
                        }
                    }
                },

                sinkDown: function (n) {
                    // Look up the target element and its score.
                    var length = this.content.length,
                        element = this.content[n],
                        elemScore = this.scoreFunction(element);

                    while (true) {
                        // Compute the indices of the child elements.
                        var child2N = (n + 1) * 2, child1N = child2N - 1;
                        // This is used to store the new position of the element,
                        // if any.
                        var swap = null;
                        // If the first child exists (is inside the array)...
                        if (child1N < length) {
                            // Look it up and compute its score.
                            var child1 = this.content[child1N],
                                child1Score = this.scoreFunction(child1);
                            // If the score is less than our element's, we need to swap.
                            if (child1Score < elemScore)
                                swap = child1N;
                        }
                        // Do the same checks for the other child.
                        if (child2N < length) {
                            var child2 = this.content[child2N],
                                child2Score = this.scoreFunction(child2);
                            if (child2Score < (swap == null ? elemScore : child1Score)) {
                                swap = child2N;
                            }
                        }

                        // If the element needs to be moved, swap it, and continue.
                        if (swap != null) {
                            this.content[n] = this.content[swap];
                            this.content[swap] = element;
                            n = swap;
                        }
                        // Otherwise, we are done.
                        else {
                            break;
                        }
                    }
                }
            };

            Snap.binaryHeap = function (score) {
                return new BinaryHeap(score);
            }

            Snap.randomPoints = function (num, x_dim, y_dim) {
                if (typeof x_dim === "number") x_dim = [0, x_dim];
                if (typeof y_dim === "number") y_dim = [0, y_dim];
                const res = [];
                const min_x = x_dim[0];
                const max_x = x_dim[1];
                const min_y = y_dim[0];
                const max_y = y_dim[1];
                for (let i = 0; i < num; ++i) {
                    res.push({
                        x: min_x + Math.random() * (max_x - min_x),
                        y: min_y + Math.random() * (max_y - min_y),
                    })
                }
                return res;
            }


            function clPairs_BF(ps1, ps2) {
                let d = Infinity,
                    p1, p2;
                ps1.forEach((p) => {
                    ps2.forEach((q) => {
                        const dis = Snap.len2(p.x, p.y, q.x, q.y);
                        if (dis < d) {
                            d = dis;
                            p1 = p;
                            p2 = q;
                        }
                    })
                })

                return {d: Math.sqrt(d), pair: [p1, p2]};
            }

            function clPairs_KD(ps1, ps2) {
                let swap = false
                if (ps2.length > ps1.length) {
                    [ps2, ps1] = [ps1, ps2];
                    swap = true;
                }

                let d = Infinity,
                    p1, p2;
                let kd = Snap.kdTree(ps1);
                for (let i = 0, l = ps2.length, nr; i < l; ++i) {
                    nr = kd.nearest_dist(ps2[i], 1, true);
                    if (nr[1] < d) {
                        d = nr[1];
                        p1 = nr[0];
                        p2 = ps2[i];
                    }
                }

                return {d: Math.sqrt(d), pair: (swap) ? [p2, p1] : [p1, p2]};
            }

            Snap.nearPairs = function (set1, set2) {
                if (set1.length * set2.length < 25000) {
                    return clPairs_BF(set1, set2);
                } else {
                    return clPairs_KD(set1, set2);
                }
            }
        });
    }, {"./voronoi.js": 27, "mnemonist/kd-tree": 8}],
    27: [function (require, module, exports) {
        "use strict"

        const triangulate = require("delaunay-triangulate");
        const circumcenter = require("circumcenter");
        const uniq = require("uniq");

        module.exports = voronoi

        function compareInt(a, b) {
            return a - b
        }

        function voronoi1D(points) {
            if (points.length === 1) {
                return {
                    cells: [[-1]],
                    positions: []
                }
            }
            const tagged = points.map(function (p, i) {
                return [p[0], i]
            });
            tagged.sort(function (a, b) {
                return a - b
            })
            const cells = new Array(points.length);
            for (var i = 0; i < cells.length; ++i) {
                cells[i] = [-1, -1]
            }
            const dualPoints = [];
            for (let j = 1; j < tagged.length; ++j) {
                var a = tagged[j - 1]
                var b = tagged[j]
                const center = 0.5 * (a[0] + b[0]);
                const n = dualPoints.length;
                dualPoints.push([center])
                cells[a[1]][1] = n
                cells[b[1]][0] = n
            }
            cells[tagged[0][1]][1] = 0
            cells[tagged[tagged.length - 1][1]][0] = dualPoints.length - 1
            return {
                cells: cells,
                positions: dualPoints
            }
        }


        function voronoi(points) {
            const n = points.length;
            if (n === 0) {
                return {cells: [], positions: []}
            }
            const d = points[0].length;
            if (d < 1) {
                return {cells: [], positions: []}
            }
            if (d === 1) {
                return voronoi1D(points)
            }

            //First delaunay triangulate all points including point at infinity
            const cells = triangulate(points, true);

            //Construct dual points
            const stars = new Array(n);
            for (var i = 0; i < n; ++i) {
                stars[i] = []
            }
            const nc = cells.length;
            const tuple = new Array(d + 1);
            const cellIndex = new Array(nc);
            const dualPoints = [];
            for (var i = 0; i < nc; ++i) {
                const verts = cells[i];
                let skip = false;
                for (var j = 0; j <= d; ++j) {
                    const v = verts[j];
                    if (v < 0) {
                        cellIndex[i] = -1
                        skip = true
                    } else {
                        stars[v].push(i)
                        tuple[j] = points[v]
                    }
                }
                if (skip) {
                    continue
                }
                cellIndex[i] = dualPoints.length
                dualPoints.push(circumcenter(tuple))
            }

            //Build dual cells
            let dualCells;
            if (d === 2) {
                dualCells = new Array(n)
                for (var i = 0; i < n; ++i) {
                    const dual = stars[i];
                    // Handle empty stars case
                    if (dual.length === 0) {
                        dualCells[i] = [];
                        continue;
                    }
                    const c = [cellIndex[dual[0]]];
                    var s = cells[dual[0]][(cells[dual[0]].indexOf(i) + 1) % 3]
                    for (var j = 1; j < dual.length; ++j) {
                        for (let k = 1; k < dual.length; ++k) {
                            const x = (cells[dual[k]].indexOf(i) + 2) % 3;
                            if (cells[dual[k]][x] === s) {
                                c.push(cellIndex[dual[k]])
                                s = cells[dual[k]][(x + 2) % 3]
                                break
                            }
                        }
                    }
                    dualCells[i] = c
                }
            } else {
                for (var i = 0; i < n; ++i) {
                    var s = stars[i]
                    for (var j = 0; j < s.length; ++j) {
                        s[j] = cellIndex[s[j]]
                    }
                    uniq(s, compareInt)
                }
                dualCells = stars
            }

            //Return the resulting cells
            return {
                cells: dualCells,
                positions: dualPoints,
                triangles: cells
            }
        }
    }, {"circumcenter": 2, "delaunay-triangulate": 3, "uniq": 25}]
}, {}, [26]);
