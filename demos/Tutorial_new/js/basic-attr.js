// Tutorial 2 - Example 1: Basic Attribute Styling
// Demonstrates setting visual attributes on rectangles and attr() as getter/setter

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

// Rectangle 4: Rounded corners with gradient-ready styling
group
  .rect(320, 20, 80, 60)
  .attr({
    fill: "#f39c12",
    stroke: "#e67e22",
    strokeWidth: 2,
    rx: 10,                  // rounded corners
    ry: 10
  });

