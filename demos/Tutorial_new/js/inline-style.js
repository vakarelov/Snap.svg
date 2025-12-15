// Tutorial 2 - Example 2: Inline Styles with setStyle()
// Demonstrates setStyle() flexibility and style precedence over attributes

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

// Add labels
group.text(60, 185, "Object").attr({ fontSize: 11, textAnchor: "middle", fill: "#333" });
group.text(160, 185, "Key-Value").attr({ fontSize: 11, textAnchor: "middle", fill: "#333" });
group.text(260, 185, "CSS String").attr({ fontSize: 11, textAnchor: "middle", fill: "#333" });
group.text(360, 185, "Mixed").attr({ fontSize: 11, textAnchor: "middle", fill: "#333" });

