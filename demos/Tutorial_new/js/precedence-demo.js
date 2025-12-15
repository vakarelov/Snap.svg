// Tutorial 2 - Example 4: Style Precedence Demo
// Demonstrates attribute < CSS < inline style hierarchy

var s = Snap("#mySvg");
var group = s.g().attr({ id: "precedenceDemo", transform: "translate(0, 0)" });

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
group.text(80, 130, "Attribute").attr({ fontSize: 12, textAnchor: "middle", fill: "#333" });
group.text(200, 130, "CSS Override").attr({ fontSize: 12, textAnchor: "middle", fill: "#333" });
group.text(320, 130, "Style Override").attr({ fontSize: 12, textAnchor: "middle", fill: "#333" });

// Add sublabels explaining
group.text(80, 145, "(lightblue)").attr({ fontSize: 10, textAnchor: "middle", fill: "#666" });
group.text(200, 145, "(orange from CSS)").attr({ fontSize: 10, textAnchor: "middle", fill: "#666" });
group.text(320, 145, "(purple inline)").attr({ fontSize: 10, textAnchor: "middle", fill: "#666" });

