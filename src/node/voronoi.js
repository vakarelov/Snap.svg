"use strict"

const triangulate = require("delaunay-triangulate");
const circumcenter = require("circumcenter");
const uniq = require("uniq");

/** @type {Function} */
module.exports = voronoi

/**
 * Numerical comparator optimized for integer values.
 *
 * Used to deduplicate Voronoi star indices when the geometry has a dimensionality greater than two.
 * Keeping the comparator inline allows {@link module:uniq} to short-circuit quickly, reducing allocations
 * in heavy diagram workloads.
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function compareInt(a, b) {
  return a - b
}

/**
 * Specialized Voronoi computation for the one-dimensional case.
 *
 * While uncommon, 1D inputs appear when snapping along a guide or evaluating parametric curves.  This
 * helper arranges breakpoints along the line and computes midpoint separators without performing a full
 * 2D triangulation.
 *
 * @param {Array<Array<number>>} points One-dimensional points expressed as `[x]` tuples.
 * @returns {{cells:Array<Array<number>>, positions:Array<Array<number>>}} Voronoi descriptors for 1D.
 * @example
 * const {cells, positions} = voronoi1D([[0], [10], [35]]);
 * // Each cell stores indices into `positions`, describing intervals on the line.
 */
function voronoi1D(points) {
  if(points.length === 1) {
    return {
      cells: [ [-1] ],
      positions: []
    }
  }
  const tagged = points.map(function (p, i) {
    return [p[0], i]
  });
  tagged.sort(function(a,b) {
    return a-b
  })
  const cells = new Array(points.length);
  for(var i=0; i<cells.length; ++i) {
    cells[i] = [-1,-1]
  }
  const dualPoints = [];
  for(let j=1; j<tagged.length; ++j) {
    var a = tagged[j-1]
    var b = tagged[j]
    const center = 0.5 * (a[0] + b[0]);
    const n = dualPoints.length;
    dualPoints.push([center])
    cells[a[1]][1] = n
    cells[b[1]][0] = n
  }
  cells[tagged[0][1]][1] = 0
  cells[tagged[tagged.length-1][1]][0] = dualPoints.length-1
  return {
    cells: cells,
    positions: dualPoints
  }
}



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
function voronoi(points) {
  const n = points.length;
  if(n === 0) {
    return { cells: [], positions: [] }
  }
  const d = points[0].length;
  if(d < 1) {
    return { cells: [], positions: [] }
  }
  if(d === 1) {
    return voronoi1D(points)
  }

  //First delaunay triangulate all points including point at infinity
  const cells = triangulate(points, true);

  //Construct dual points
  const stars = new Array(n);
  for(var i=0; i<n; ++i) {
    stars[i] = []
  }
  const nc = cells.length;
  const tuple = new Array(d + 1);
  const cellIndex = new Array(nc);
  const dualPoints = [];
  for(var i=0; i<nc; ++i) {
    const verts = cells[i];
    let skip = false;
    for(var j=0; j<=d; ++j) {
      const v = verts[j];
      if(v < 0) {
        cellIndex[i] = -1
        skip = true
      } else {
        stars[v].push(i)
        tuple[j] = points[v]
      }
    }
    if(skip) {
      continue
    }
    cellIndex[i] = dualPoints.length
    dualPoints.push(circumcenter(tuple))
  }

  //Build dual cells
  let dualCells;
  if(d === 2) {
    dualCells = new Array(n)
    for(var i=0; i<n; ++i) {
      const dual = stars[i];

      // Handle empty stars case
      if(dual.length === 0) {
        dualCells[i] = [];
        continue;
      }

      const c = [cellIndex[dual[0]]];
      var s = cells[dual[0]][(cells[dual[0]].indexOf(i)+1) % 3]
      for(var j=1; j<dual.length; ++j) {
        for(let k=1; k<dual.length; ++k) {
          const x = (cells[dual[k]].indexOf(i) + 2) % 3;
          if(cells[dual[k]][x] === s) {
            c.push(cellIndex[dual[k]])
            s = cells[dual[k]][(x+2)%3]
            break
          }
        }
      }
      dualCells[i] = c
    }
  } else {
    for(var i=0; i<n; ++i) {
      var s = stars[i]
      for(var j=0; j<s.length; ++j) {
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