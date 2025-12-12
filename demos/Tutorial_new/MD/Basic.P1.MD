# Building Your First SVG 

This is the **first in a series of tutorials** on how to use Snap.svg to build SVG graphics programmatically. In this initial part we keep the technical ambitions modest: we want to understand how to

- create a simple SVG on a page,
- build groups and shapes with `g()` and chaining,
- add **another group after** a group with `g_a()`, and
- insert a **shape after** a group using `Snap.FORCE_AFTER`.

Once we have this basic control over structure, we will close with a more elaborate example: a relatively large and visually interesting SVG built from **one nested, multi-line chain** of Snap calls.

The underlying theme is that you can treat Snap.svg not only as a drawing API, but as a compact syntax for specifying **hierarchical SVG structure**.

---

## 1. HTML: starting from an empty `<svg>`

We begin with the minimal HTML needed for our example: a container and an empty `<svg>` element that Snap will populate.

```html
<div id="container">
  <svg id="mySvg" width="320" height="180" style="border: 1px solid #ccc;"></svg>
</div>

<script src="https://iaesth.ca/dist/snap.svg_ia.min.js"></script>
<script src="main.js"></script>
```

The `<svg>` starts empty. All groups and shapes will be created by the JavaScript in `main.js`.

---

## 2. One inner group via `g().attr().rect().line()...`

The first structural step is to create a **single inner group** inside the SVG. Everything else will live under this group, rather than being attached directly to the root `<svg>`. This will matter later when we start adding more groups and using `g_a()`.

```js
// Wrap the <svg id="mySvg"> element with Snap.
var s = Snap("#mySvg");

// Create an inner group to hold the rest of the scene.
// (We call g() on 's' only once here.)
var rootGroup = s
  .g()
  .attr({
    id: "rootGroup"
  });
```

Now we build a **first logical group** inside `rootGroup`, and we populate it with a rectangle and a line. Every call is anchored on `rootGroup`, so that the resulting elements sit *inside* it.

```js
// First inner group inside rootGroup.
var group1 = rootGroup
  .g()
  .attr({
    id: "group1"
  });

// A rectangle inside group1.
group1
  .rect(20, 20, 100, 50) // x, y, width, height
  .attr({
    fill: "steelblue"
  });

// A line inside group1.
group1
  .line(20, 80, 200, 80) // x1, y1, x2, y2
  .attr({
    stroke: "black",
    strokeWidth: 2
  });
```

If we translate this back into plain SVG, we get essentially:

```html
<svg id="mySvg">
  <g id="rootGroup">
    <g id="group1">
      <rect x="20" y="20" width="100" height="50" fill="steelblue" />
      <line x1="20" y1="80" x2="200" y2="80" stroke="black" stroke-width="2" />
    </g>
  </g>
</svg>
```

So far the hierarchy is simple:

- `rootGroup` (inner wrapper group)
    - `group1`
        - one rect
        - one line

---

## 3. Adding another group after `group1` with `g_a()`

Now we want to place **another group after `group1`** as a sibling, but still inside `rootGroup`. Conceptually, the result should be:

```html
<g id="rootGroup">
  <g id="group1">...</g>
  <g id="group2">...</g>
</g>
```

This is exactly the role of `.g_a()` in our setup: it is meaningful only when we already have an inner group structure to attach to. We do **not** call `g_a()` on the raw SVG; we call it on the inner grouping layer.

```js
// Second group as a sibling of group1, inside rootGroup.
var group2 = rootGroup
  .g_a()
  .attr({
    id: "group2",
    transform: "translate(140, 0)" // move it to the right
  });

// A rectangle inside group2.
group2
  .rect(20, 20, 100, 50)
  .attr({
    fill: "tomato"
  });

// A line inside group2.
group2
  .line(20, 80, 200, 80)
  .attr({
    stroke: "gray",
    strokeWidth: 2
  });
```

The structural effect is:

```html
<svg id="mySvg">
  <g id="rootGroup">
    <g id="group1">
      <!-- rect, line -->
    </g>
    <g id="group2" transform="translate(140, 0)">
      <!-- rect, line -->
    </g>
  </g>
</svg>
```

So `g_a()` functions as “**another group after the previous group** under the same parent”.

{% codepen https://codepen.io/Vakarelov/pen/pvyqZbo %}

---

## 4. Adding a shape after the groups with `Snap.FORCE_AFTER`

So far, we can:

- add shapes *inside* a group (via `group1.rect(...)`, `group2.line(...)`, etc.), and
- add more groups *after* one another (via `rootGroup.g_a()`).

But hierarchies are not limited to groups. We may want a **shape** (for example, a rectangle) that is a sibling of those groups, rather than a child of one of them. Here we use `Snap.FORCE_AFTER`.

Any element constructor (e.g. `rect`, `circle`, `path`) can be instructed to insert its new node **after the previous child** of the same parent by passing `Snap.FORCE_AFTER` as the first argument:

```js
// A rectangle AFTER group2, still a child of rootGroup.
rootGroup
  .rect(Snap.FORCE_AFTER, 10, 120, 100, 30)
  .attr({
    fill: "lightgreen",
    stroke: "black",
    strokeWidth: 1
  });
```

Conceptually:

```html
<g id="rootGroup">
  <g id="group1">...</g>
  <g id="group2">...</g>
  <rect x="10" y="120" width="100" height="30" fill="lightgreen" ... />
</g>
```

The same pattern applies to other constructors:

```js
rootGroup
  .circle(Snap.FORCE_AFTER, 260, 140, 15)
  .attr({ fill: "gold" });

rootGroup
  .text(Snap.FORCE_AFTER, 130, 150, "After groups")
  .attr({ fontSize: 12 });
```

In each case, the **parent** (which can be accessed with ***.parent()***) remains `rootGroup`, but the new element is created *after* whatever the last child was.

---

## 5. A larger, nested-chain example

The previous sections were deliberately simple. The real payoff of this style shows up when you let yourself write **one nested, multi-line chain** that mirrors the grouping structure of a more complex scene.

What follows is an intentionally verbose example. The goal is not to be clever; the goal is to **see the hierarchy directly in the code** by aligning indentation with the group nesting. Think of it as a sketch of a small landscape:

- a sky and ground
- a sun with rays
- some clouds
- a house with a roof, door, and windows
- a couple of trees
- a path leading to the house

We write it as one chained expression, and we visually align it according to group depth.

```js
// Wrap the <svg id="mySvg"> element with Snap.
var s = Snap("#mySvg");
var scene =
  s.g().attr({
    id: "sceneRoot"
  })
    // Background: sky and ground
    .rect(0, 0, 320, 120).attr({
      fill: "#87ceeb" // sky
    })
    .rect(0, 120, 320, 60).attr({
      fill: "#228B22" // ground
    })

    // Sun group
    .g().attr({
      id: "sunGroup",
      transform: "translate(260, 30)"
    })
      .circle(0, 0, 14).attr({
        fill: "#FFD700",
        stroke: "#FFA500",
        strokeWidth: 2
      })
      .line(-24, 0, -14, 0).attr({ stroke: "#FFD700", strokeWidth: 2 })
      .line(14, 0, 24, 0).attr({ stroke: "#FFD700", strokeWidth: 2 })
      .line(0, -24, 0, -14).attr({ stroke: "#FFD700", strokeWidth: 2 })
      .line(0, 14, 0, 24).attr({ stroke: "#FFD700", strokeWidth: 2 })
      .line(-18, -18, -10, -10).attr({ stroke: "#FFD700", strokeWidth: 2 })
      .line(10, -10, 18, -18).attr({ stroke: "#FFD700", strokeWidth: 2 })
      .line(-18, 18, -10, 10).attr({ stroke: "#FFD700", strokeWidth: 2 })
      .line(10, 10, 18, 18).attr({ stroke: "#FFD700", strokeWidth: 2 })
    // refer to the parent (sunGroup) to add the next sibling
    .parent() //sunGroup
    // Clouds group (sibling of sunGroup)
    .g_a().attr({
      id: "cloudsGroup"
    })
      .g().attr({
        id: "cloud1",
        transform: "translate(70, 20)"
      })
        .ellipse(0, 0, 18, 10).attr({ fill: "white" })
        .ellipse(10, -5, 14, 9).attr({ fill: "white" })
        .ellipse(-10, -5, 14, 9).attr({ fill: "white" })
      .parent() //cloudsGroup
      .g_a().attr({
        id: "cloud2",
        transform: "translate(130, 30)"
      })
        .ellipse(0, 0, 16, 9).attr({ fill: "white" })
        .ellipse(9, -4, 12, 8).attr({ fill: "white" })
        .ellipse(-9, -4, 12, 8).attr({ fill: "white" })
      .parent() //cloud2
    .parent() //cloudsGroup
 
    // Path group (sibling of treesGroup)
    .g_a().attr({
      id: "pathGroup",
      transform: "translate(75, 115)"
    })
      .path("M -5,0 Q 0,10 5,20 T 15,40").attr({
        fill: "none",
        stroke: "#d2b48c",
        strokeWidth: 10,
        strokeLinecap: "round"
      })
    .parent() //pathGroup
    // House group (sibling of pathGroup)
    .g_a().attr({
      id: "houseGroup",
      transform: "translate(70, 80)"
    })
      .rect(-30, 0, 60, 40).attr({
        fill: "#ffe4c4",
        stroke: "#8b4513",
        strokeWidth: 2
      })
      .polygon("-34,0 0,-26 34,0").attr({
        fill: "#8b0000",
        stroke: "#5a0000",
        strokeWidth: 2
      })
      .rect(-8, 18, 16, 22).attr({
        fill: "#deb887",
        stroke: "#8b4513",
        strokeWidth: 1.5
      })
      .rect(-22, 10, 12, 10).attr({
        fill: "#add8e6",
        stroke: "#00008b",
        strokeWidth: 1
      })
      .rect(10, 10, 12, 10).attr({
        fill: "#add8e6",
        stroke: "#00008b",
        strokeWidth: 1
      })

    .parent() //houseGroup
    // Trees group (sibling of houseGroup)
    .g_a().attr({
      id: "treesGroup",
      transform: "translate(220, 90)"
    })
      .g().attr({ id: "tree1", transform: "translate(-20, 0)" })
        .rect(-3, 10, 6, 20).attr({
          fill: "#8b4513"
        })
        .circle(0, 4, 10).attr({
          fill: "#2e8b57"
        })
      .parent() //tree1
      .g_a().attr({ id: "tree2", transform: "translate(10, -4)" })
        .rect(-3, 12, 6, 22).attr({
          fill: "#8b4513"
        })
        .circle(0, 5, 11).attr({
          fill: "#2e8b57"
        });
```

A few observations about this pattern:

- The **left margin** of each method call tells you which group it belongs to. Deeper indentation corresponds to deeper nesting.
- Each `g()` introduces a new grouping context; each `g_a()` introduces another group at the same depth, i.e., a sibling.
- The result is a scene with more than 25 elements (backgrounds, sun, rays, multiple clouds, house details, trees, and a path), but the code is still *readable as structure* rather than a flat list of operations.

Nothing forces you to use exactly this layout; the point is that Snap’s API, extended with `g_a()` and `Snap.FORCE_AFTER`, allows you to treat JavaScript as a **hierarchy notation** for SVG, rather than an unstructured sequence of drawing calls.

{% codepen https://codepen.io/Vakarelov/pen/XJdoBEM %}

---

## 7. What comes next

In this first tutorial we:

- created an SVG and an inner group,
- built simple shapes inside a group with `g()` and `attr`,
- added a **sibling group** with `g_a()`,
- inserted a **shape after** existing groups with `Snap.FORCE_AFTER`, and
- sketched a larger scene using one nested, multi-line chain to make the grouping structure explicit.

In the next parts of this series we can push further:

- Styles
- Transforms
- Loading external SVG
- and more


The underlying strategy will remain the same: use Snap’s grouping and ordering primitives to keep the **structure of your SVG visible in the shape of your code**.