# Styling and Attributes

This is the **second tutorial** in our Snap.svg series. In the first part we learned how to build hierarchical SVG structures with `g()`, `g_a()`, and `Snap.FORCE_AFTER`. Now we want to make those shapes **look good** by learning how to:

- set visual attributes like `fill`, `stroke`, `opacity`, etc. using `attr()`,
- apply inline styles directly to the `style` property with `setStyle()`,
- understand the **style precedence hierarchy** (inline style > CSS > attribute),
- manage CSS classes with `addClass()`, `removeClass()`, `toggleClass()`,
- automatically generate and retrieve element IDs with `getId()`,
- build an interactive color palette that responds to user clicks.

The underlying theme is that Snap.svg gives you **fine-grained control** over how attributes and styles are applied, with clear methods for each approach.

---

## 1. Understanding the Style Precedence Hierarchy

Before we dive into code, it's important to understand how browsers determine which styles to apply when multiple sources define the same property. The precedence order is:

1. **Inline `style` attribute** (highest priority)
2. **CSS rules** (from `<style>` tags or external stylesheets)
3. **SVG presentation attributes** (like `fill="red"`)

This means:
- If you set `fill` via `setStyle()` (inline style), it will override any CSS rules or attributes
- If you set `fill` via CSS, it will override attribute values
- Attribute values are the baseline and have lowest priority

Snap.svg respects this hierarchy and provides methods to target each level explicitly.

---

## 2. Basic Attribute Styling with `attr()`

The `attr()` method is **both a getter and a setter** for attributes. It intelligently decides whether to set values as presentation attributes or route them to the style property. These have the lowest precedence but are the most common way to style SVG elements.

```html
<div id="container">
  <svg id="mySvg" width="400" height="300" style="border: 1px solid #ccc;"></svg>
</div>

<script src="https://iaesth.ca/dist/snap.svg_ia.min.js"></script>
<script src="basic-attr.js"></script>
```

### Example: Colored Rectangles with Attributes

```js
// basic-attr.js
var s = Snap("#mySvg");

// Create a group to hold our shapes
var group = s.g().attr({ id: "attrGroup" });

// Rectangle 1: Basic fill and stroke via attr() - object syntax
group
  .rect(20, 20, 80, 60)
  .attr({
    fill: "#3498db",        // blue fill
    stroke: "#2c3e50",      // dark border
    strokeWidth: 2
  });

// Rectangle 2: Using attr() with key-value syntax (alternative way)
var rect2 = group.rect(120, 20, 80, 60);
rect2.attr("fill", "#e74c3c");           // Set fill
rect2.attr("opacity", 0.7);              // Set opacity
rect2.attr("stroke", "#c0392b");
rect2.attr("strokeWidth", 3);
rect2.attr("strokeDasharray", "5,3");    // dashed: 5px dash, 3px gap


// Rectangle 3: No fill, thick rounded stroke
group
  .rect(220, 20, 80, 60)
  .attr({
    fill: "none",
    stroke: "#2ecc71",
    strokeWidth: 4,
    strokeLinecap: "round",  // rounded ends
    strokeLinejoin: "round"  // rounded corners
  });

// Rectangle 4: Gradient-ready (we'll use a color for now)
group
  .rect(320, 20, 80, 60)
  .attr({
    fill: "#f39c12",
    stroke: "#e67e22",
    strokeWidth: 2,
    rx: 10,                  // rounded corners
    ry: 10
  });
```

**Output**: Four rectangles in a row, each with different fill, stroke, and opacity settings applied as attributes.

{% codepen html="demos/basic-attr.html" js="js/basic-attr.js" %}

---

### `attr()` as Getter and Setter

The `attr()` method has two forms:

```js
// Setter: attr(key, value) or attr({key: value, ...})
element.attr("fill", "red");              // Set single attribute
element.attr({ fill: "red", opacity: 0.5 }); // Set multiple attributes

// Getter: attr(key)
var currentFill = element.attr("fill");   // Get attribute value
var currentOpacity = element.attr("opacity");
```

### Using `attr_force()` for Pure Presentation Attributes

The `attr()` method is **smart** - it may automatically route some properties to the style attribute for better CSS interaction. If you need to **force** a value to be a presentation attribute (not in the style), use `attr_force()`:

```js
// Smart attr() - may route to style or attribute
element.attr("fill", "blue");

// Force as presentation attribute
element.attr_force("fill", "blue");  // Guarantees attribute, not style

// This is useful when you explicitly want:
// <rect fill="blue" /> 
// instead of:
// <rect style="fill: blue" />
```

**When to use `attr_force()`**:
- When you specifically need a presentation attribute (e.g., for SVG manipulation)
- When you want CSS to easily override (attributes have lowest precedence)
- When working with SVG editors or tools that expect presentation attributes

### Common Attributes

- **Fill**: `fill` - color, gradient, pattern, or `"none"`
- **Stroke**: `stroke`, `strokeWidth`, `strokeDasharray`, `strokeLinecap`, `strokeLinejoin`
- **Opacity**: `opacity` (0 to 1), `fillOpacity`, `strokeOpacity`
- **Geometry**: Element-specific like `x`, `y`, `width`, `height`, `rx`, `ry`, `r`, `cx`, `cy`

---

## 3. Inline Styles with `setStyle()` - Flexible Input

The `setStyle()` method sets properties directly on the element's `style` attribute, giving them **highest priority** in the cascade. What makes `setStyle()` powerful is its **flexibility** - it accepts multiple input formats.

### Multiple Ways to Use `setStyle()`

```js
// inline-style.js
var s = Snap("#mySvg");
var group = s.g().attr({ id: "styleGroup" });

// Create circles for demonstration
var circle1 = group.circle(60, 140, 30);
var circle2 = group.circle(160, 140, 30);
var circle3 = group.circle(260, 140, 30);
var circle4 = group.circle(360, 140, 30);

// Method 1: Object with multiple properties
circle1.setStyle({
  fill: "red",
  stroke: "#c0392b",
  strokeWidth: 3,
  opacity: 0.8
});

// Method 2: Single property with key-value syntax
circle2.setStyle("fill", "green");
circle2.setStyle("strokeWidth", "2");
circle2.setStyle("stroke", "#27ae60");

// Method 3: CSS string (like inline style attribute)
circle3.setStyle("fill: blue; stroke: navy; stroke-width: 2;");

// Method 4: Mixed - single property can also use object
circle4.setStyle({ fill: "orange" });
circle4.setStyle("stroke", "darkorange");

// All circles have inline styles that override any CSS or attributes
```

### Understanding the Flexibility

```js
// All these are equivalent and set inline styles:

// Style 1: Object notation (most common)
element.setStyle({
  fill: "purple",
  strokeWidth: 4,
  opacity: 0.5
});

// Style 2: Property-value pairs (useful for single properties)
element.setStyle("fill", "purple");
element.setStyle("strokeWidth", 4);
element.setStyle("opacity", 0.5);

// Style 3: CSS string (useful when copying from CSS)
element.setStyle("fill: purple; stroke-width: 4; opacity: 0.5");

// Note: CSS properties use hyphens (stroke-width), 
// but object properties use camelCase (strokeWidth)
```

### Demonstrating Style Override

Let's see how inline styles from `setStyle()` override attributes:

```js
// Start with attribute styling
var circle = s.circle(200, 100, 40);
circle.attr("fill", "lightblue");  // Attribute: lightblue

// Override with inline style (highest priority)
circle.setStyle("fill", "darkred");  // Now displays darkred

// The attribute is still there, but style takes precedence
// Reading attr() will still show "lightblue"
// But the rendered color is darkred due to inline style
```

**Result**:
- Circle 1: red with stroke (object notation)
- Circle 2: green with stroke (property-value pairs)
- Circle 3: blue with navy stroke (CSS string)
- Circle 4: orange (mixed approach)

{% codepen html="demos/inline-style.html" js="js/inline-style.js" %}

**Why `setStyle()` flexibility matters**: 
- **Object notation**: Best for multiple properties at once
- **Key-value pairs**: Best for single dynamic property updates
- **CSS strings**: Useful when copying styles from CSS or other sources
- All formats result in **inline style attribute** with highest precedence

---

## 4. CSS Classes with Enhanced Class Management

CSS classes provide **reusable styling** that sits between inline styles and attributes in precedence. Snap.svg makes class management powerful and flexible:

```html
<style>
  /* CSS rules for our classes */
  .highlighted {
    fill: #f1c40f !important;
    stroke: #f39c12 !important;
    stroke-width: 4;
  }
  
  .dimmed {
    opacity: 0.3;
  }
  
  .fancy-stroke {
    stroke: #9b59b6;
    stroke-width: 3;
    stroke-dasharray: 10,5;
  }
  
  .state-active { fill: #2ecc71; }
  .state-warning { fill: #f39c12; }
  .state-error { fill: #e74c3c; }
  
  .theme-dark { stroke: #2c3e50; }
  .theme-light { stroke: #ecf0f1; }
</style>
```

### Basic Class Operations

```js
// css-classes.js
var s = Snap("#mySvg");
var group = s.g().attr({ id: "classGroup" });

// Create rectangles
var rect1 = group.rect(20, 220, 70, 50).attr({ fill: "#95a5a6" });
var rect2 = group.rect(110, 220, 70, 50).attr({ fill: "#95a5a6" });
var rect3 = group.rect(200, 220, 70, 50).attr({ fill: "#95a5a6" });
var rect4 = group.rect(290, 220, 70, 50).attr({ fill: "#95a5a6" });

// Apply single class
rect2.addClass("highlighted");              // yellow with thick stroke

// Apply multiple classes (space-separated string)
rect3.addClass("dimmed fancy-stroke");      // semi-transparent with dashed stroke

// Apply multiple classes (array) - Enhanced feature!
rect4.addClass(["highlighted", "fancy-stroke"]); // array syntax


// Toggle a class on click
rect1.click(function() {
  this.toggleClass("highlighted");
});
```

{% codepen html="demos/css-classes.html" js="js/css-classes.js" css="css/tutorial2.css" %}

### Advanced: Working with Arrays

Both `addClass()` and `removeClass()` accept **arrays** for batch operations:

```js
var shape = s.circle(200, 100, 40);

// Add multiple classes at once using array
shape.addClass(["state-active", "theme-dark", "animated"]);

// Remove multiple classes using array
shape.removeClass(["animated", "theme-dark"]);

// Result: shape only has "state-active" class
```

### Advanced: Prefix-Based Class Removal

The `removeClass()` method has a powerful **prefix** parameter that removes all classes starting with a given prefix:

```js
var element = s.rect(50, 50, 100, 100);

// Add multiple state classes
element.addClass(["state-active", "state-warning", "theme-dark", "theme-light"]);

// Remove all classes starting with "state-" using prefix=true
element.removeClass("state-", true);  // Removes state-active and state-warning

// Result: element only has theme-dark and theme-light

// You can also remove all "theme-" classes
element.removeClass("theme-", true);  // Now no classes remain
```

**Use case for prefix removal**: When you have mutually exclusive class groups (like `state-*` or `theme-*`), you can clear all variants at once before applying a new one.

### Advanced: Pattern Matching with `matchClass()`

The `matchClass()` method finds classes matching a **regular expression**:

```js
var element = s.circle(150, 150, 50);
element.addClass(["user-admin", "user-editor", "status-online", "theme-blue"]);

// Find all classes starting with "user-"
var userClasses = element.matchClass(/^user-/);
// Returns: ["user-admin", "user-editor"]

// Find all classes ending with "-online"
var statusClasses = element.matchClass(/-online$/);
// Returns: ["status-online"]

// Find all classes containing "theme"
var themeClasses = element.matchClass(/theme/);
// Returns: ["theme-blue"]
```

### Convenience Method: `classesStartWith()`

For the common pattern of finding classes by prefix, there's a helper:

```js
var element = s.rect(10, 10, 80, 80);
element.addClass(["btn-primary", "btn-large", "icon-check", "theme-dark"]);

// Get all classes starting with "btn-"
var buttonClasses = element.classesStartWith("btn-");
// Returns: ["btn-primary", "btn-large"]

// Equivalent to: element.matchClass(/^btn-/)
```

### Advanced: `hasClass()` with Multiple Classes

The `hasClass()` method can check multiple classes with **conjunctive** (AND/OR) logic:

```js
var element = s.ellipse(200, 200, 60, 40);
element.addClass(["active", "visible", "enabled"]);

// Check if ANY of the classes exist (OR logic, default)
var hasAny = element.hasClass(["active", "hidden"], false);
// Returns: true (has "active")

// Check if ALL classes exist (AND logic, conjunctive=true)
var hasAll = element.hasClass(["active", "visible"], true);
// Returns: true (has both)

var hasAllIncludingMissing = element.hasClass(["active", "hidden"], true);
// Returns: false (missing "hidden")
```

### Complete Example: State Management

Here's a practical example using all the class features:

```js
// state-management.js
var s = Snap("#mySvg");

// State management system - circle that changes based on state
var statusIndicator = s.circle(100, 75, 40).attr({ fill: "#95a5a6" });

// Create clickable state buttons
var buttonData = [
  { x: 200, state: "active", label: "Active", color: "#27ae60" },
  { x: 300, state: "warning", label: "Warning", color: "#f39c12" },
  { x: 400, state: "error", label: "Error", color: "#e74c3c" },
  { x: 500, state: "inactive", label: "Inactive", color: "#95a5a6" }
];

function setState(element, newState, color) {
  // Remove all previous state classes using prefix
  element.removeClass("state-", true);
  
  // Add the new state class
  element.addClass("state-" + newState);
  
  // Update visual appearance
  element.attr({ fill: color });
  
  // Update info text
  infoText.attr({ text: "Click buttons to change state. Current: " + newState });
}

// Create buttons
buttonData.forEach(function(btn) {
  var rect = s.rect(btn.x, 50, 80, 30, 5).attr({
    fill: "#3498db",
    stroke: "#2980b9",
    strokeWidth: 2,
    cursor: "pointer"
  });
  
  var label = s.text(btn.x + 40, 70, btn.label).attr({
    fontSize: 12,
    fill: "white",
    textAnchor: "middle",
    pointerEvents: "none"
  });
  
  // Add click handler
  rect.click(function() {
    setState(statusIndicator, btn.state, btn.color);
  });
});

// Info text
var infoText = s.text(20, 130, "Click buttons to change state. Current: inactive").attr({ 
  fontSize: 14, 
  fill: "#333"
});

// Set initial state
setState(statusIndicator, "inactive", "#95a5a6");
```
{% codepen html="demos/state-management.html" js="js/state-management.js" %}

**Interactive Demo**: 
- Click buttons to change the state indicator color
- Uses `removeClass("state-", true)` to remove all state classes by prefix
- Uses `addClass()` to set new state
- State changes update both the class and visual appearance

**Note**: CSS with `!important` can override inline styles, but generally inline styles have highest priority.

### Summary of Enhanced Class Methods

- **`addClass(value)`**: value can be string or array
- **`removeClass(value, prefix)`**: value can be string or array; prefix=true removes by prefix
- **`hasClass(value, conjunctive)`**: value can be string or array; conjunctive=true requires all
- **`toggleClass(value, flag)`**: add/remove based on presence or flag
- **`matchClass(regex)`**: find classes matching regex pattern
- **`classesStartWith(prefix)`**: shorthand for common prefix matching

---

## 5. Element IDs with `getId()`

Every Snap element has an internal ID, but it's not always set as a DOM attribute. The `getId()` method ensures the element has an `id` attribute set, auto-generating one if needed:

```js
// element-ids.js
var s = Snap("#mySvg");

var circle = s.circle(350, 50, 25).attr({ fill: "#e74c3c" });

// Get the ID (will auto-generate if not set)
var id = circle.getId();
// Returns something like: "Snapsvg_123"

// Now we can reference it
var found = document.getElementById(id);  // finds the element

// Set a custom ID
circle.attr({ id: "myCustomCircle" });
var newId = circle.getId();  // Returns: "myCustomCircle"
```

**Why this matters**: Some operations require elements to have DOM `id` attributes (like gradients, clips, masks). `getId()` ensures an ID exists without you having to manage it manually.

---

## 6. Style Precedence in Action

Let's see all three levels (attribute, CSS, inline style) working together:

```html
<style>
  .css-fill {
    fill: orange;
  }
</style>
```

```js
// precedence-demo.js
var s = Snap("#mySvg");
var group = s.g().attr({ id: "precedenceDemo", transform: "translate(0, 150)" });

// Create three circles to demonstrate precedence
var circles = [];
for (var i = 0; i < 3; i++) {
  circles[i] = group.circle(80 + i * 120, 80, 35);
}

// Circle 1: Attribute only (lowest priority)
circles[0].attr({
  fill: "lightblue",
  stroke: "#2980b9",
  strokeWidth: 2
});

// Circle 2: Attribute + CSS class (CSS wins)
circles[1].attr({
  fill: "lightblue"  // This will be overridden by CSS
});
circles[1].addClass("css-fill");

// Circle 3: Attribute + CSS + inline style (inline style wins)
circles[2].attr({
  fill: "lightblue"  // Lowest priority
});
circles[2].addClass("css-fill");  // Middle priority
circles[2].setStyle("fill", "purple");  // Highest priority - this wins!

// Add labels
group.text(45, 130, "Attribute").attr({ fontSize: 11, fill: "#333" });
group.text(155, 130, "CSS").attr({ fontSize: 11, fill: "#333" });
group.text(250, 130, "Inline Style").attr({ fontSize: 11, fill: "#333" });
```

**Result**:
- Circle 1: lightblue (from attribute)
- Circle 2: orange (CSS overrides attribute)
- Circle 3: purple (inline style overrides both)

This clearly demonstrates the precedence hierarchy!

{% codepen html="demos/precedence-demo.html" js="js/precedence-demo.js" css="css/tutorial2.css" %}

---

## 7. Interactive Color Palette

Now let's combine everything we've learned into an interactive demo where clicking rectangles changes colors using different styling methods:

```js
// color-palette.js
var s = Snap("#mySvg");

// Create a clean canvas
s.clear();

var palette = s.g().attr({ id: "colorPalette" });

// Color options
var colors = [
  { name: "Attribute", fill: "#3498db", method: "attr" },
  { name: "Inline Style", fill: "#e74c3c", method: "style" },
  { name: "CSS Class", fill: "#2ecc71", method: "class" }
];

// Selected color indicator
var selectedColor = colors[0];

// Create color swatches
colors.forEach(function(color, i) {
  var swatch = palette
    .rect(20 + i * 130, 20, 100, 60)
    .attr({
      fill: color.fill,
      stroke: "#333",
      strokeWidth: 2,
      cursor: "pointer"
    });
  
  swatch.data("colorInfo", color);
  
  // Add click handler
  swatch.click(function() {
    // Remove highlight from all swatches
    palette.selectAll("rect").forEach(function(rect) {
      rect.attr({ strokeWidth: 2 });
    });
    
    // Highlight selected
    this.attr({ strokeWidth: 5 });
    selectedColor = this.data("colorInfo");
  });
  
  // Add label
  palette
    .text(20 + i * 130 + 50, 95, color.name)
    .attr({
      fontSize: 12,
      textAnchor: "middle",
      fill: "#333"
    });
});

// Create target shapes that will be colored
var targetGroup = s.g().attr({ id: "targets", transform: "translate(0, 130)" });

var shapes = [
  targetGroup.circle(70, 60, 30), 
  targetGroup.rect(120, 30, 60, 60),
  targetGroup.ellipse(250, 60, 40, 30), 
  targetGroup.polygon([[350,30], [390,50], [380,90], [320,90], [310,50]])
];

shapes.forEach(function(shape) {
  shape.attr({
    fill: "#bdc3c7",
    stroke: "#7f8c8d",
    strokeWidth: 2,
    cursor: "pointer"
  });
  
  // Click to apply selected color using selected method
  shape.click(function() {
    var color = selectedColor.fill;
    
    if (selectedColor.method === "attr") {
      // Method 1: Set as attribute (can be overridden by CSS/inline)
      this.attr({ fill: color });
      
    } else if (selectedColor.method === "style") {
      // Method 2: Set as inline style (highest priority)
      this.setStyle("fill", color);
      
    } else if (selectedColor.method === "class") {
      // Method 3: Use CSS class
      // First remove any previous color classes
      this.removeClass("color-blue color-red color-green");
      
      // Add appropriate class
      if (color === "#3498db") {
        this.addClass("color-blue");
      } else if (color === "#e74c3c") {
        this.addClass("color-red");
      } else if (color === "#2ecc71") {
        this.addClass("color-green");
      }
    }
  });
});

// Add instruction text
s.text(200, 240, "Click a color method above, then click shapes to apply")
  .attr({
    fontSize: 12,
    textAnchor: "middle",
    fill: "#666"
  });

// Highlight first swatch by default
palette.select("rect").attr({ strokeWidth: 5 });
```

```html
<style>
  .color-blue { fill: #3498db; }
  .color-red { fill: #e74c3c; }
  .color-green { fill: #2ecc71; }
</style>
```

**How it works**:
1. Click a color swatch at the top to select a coloring method
2. Click any shape below to apply the color using the selected method
3. Try different methods on the same shape to see precedence in action

{% codepen html="demos/color-palette.html" js="js/color-palette.js" css="css/tutorial2.css" %}

---

## 8. Best Practices Summary

### When to use `attr()`:
- Default styling for elements
- Geometry properties (x, y, width, height, etc.)
- When you want CSS to be able to override (lowest precedence)

### When to use `setStyle()`:
- When you need guaranteed priority over CSS
- Dynamic styling that must override everything
- When working with properties that must be inline

### When to use CSS classes:
- Reusable themes and styles
- State-based styling (hover, active, etc.)
- When you want semantic styling (`.highlighted`, `.disabled`, etc.)

### Key points:
- **Precedence**: Inline style > CSS > Attribute
- **`attr()` is smart**: It may route some properties to style automatically
- **`getId()`**: Ensures elements have DOM IDs when needed
- **Classes**: Use `addClass()`, `removeClass()`, `toggleClass()`, `hasClass()`

---

## 9. What's Next

In this tutorial we learned:

- Setting visual attributes with `attr()`
- Applying inline styles with `setStyle()`
- Understanding style precedence (inline > CSS > attribute)
- Managing CSS classes with `addClass()` and friends
- Working with element IDs using `getId()`
- Building an interactive color palette

In the next tutorial (**Transform System Deep Dive**) we'll learn how to:
- Position elements with direct transform methods (`translate()`, `scale()`, `rotate()`)
- Build and compose transformation matrices
- Animate transforms smoothly
- Work with local and global coordinate systems

The foundation of **structure** (Tutorial 1) and **styling** (Tutorial 2) will let us create visually interesting graphics. Adding **transforms** will give us full spatial control.

