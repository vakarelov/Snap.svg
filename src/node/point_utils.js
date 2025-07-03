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

        if (num > 1) {
            return points.map((p) => [p, dist(point, p)])
        } else {
            return [points, dist(point, points, sqere_dist)]
        }
    }

    Snap.kdTree = function (points) {
        const xs = points.map((p) => (p.hasOwnProperty("x") ? p.x : p[0]));
        const ys = points.map((p) => (p.hasOwnProperty("y") ? p.y : p[1]));

        let kd = KDTree.fromAxes([xs, ys])
        kd.attachPoints(points);

        return kd;
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