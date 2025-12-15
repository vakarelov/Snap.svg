// Tutorial 2 - Example 5: Interactive Color Palette
// Complete interactive demo combining all concepts

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
  targetGroup.polygon("350,30 390,50 380,90 320,90 310,50")
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

