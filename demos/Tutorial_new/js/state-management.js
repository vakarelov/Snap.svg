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
