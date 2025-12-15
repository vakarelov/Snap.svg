// Tutorial 2 - Example 3: Enhanced CSS Classes
// Demonstrates addClass, removeClass with arrays and prefix, matchClass, hasClass

var s = Snap("#mySvg");
var group = s.g().attr({ id: "classGroup" });

// Create rectangles for basic class demo
var rect1 = group.rect(20, 220, 70, 50).attr({ fill: "#95a5a6" });
var rect2 = group.rect(110, 220, 70, 50).attr({ fill: "#95a5a6" });
var rect3 = group.rect(200, 220, 70, 50).attr({ fill: "#95a5a6" });
var rect4 = group.rect(290, 220, 70, 50).attr({ fill: "#95a5a6" });

// Apply single class
rect2.addClass("highlighted");

// Apply multiple classes (space-separated string)
rect3.addClass("dimmed fancy-stroke");

// Apply multiple classes using ARRAY (enhanced feature!)
rect4.addClass(["highlighted", "fancy-stroke"]);

// Toggle a class on click
rect1.click(function() {
  this.toggleClass("highlighted");
});

// Add labels
group.text(55, 285, "Click me!").attr({ fontSize: 10, textAnchor: "middle", fill: "#333" });
group.text(145, 285, "Single Class").attr({ fontSize: 10, textAnchor: "middle", fill: "#333" });
group.text(235, 285, "String Multi").attr({ fontSize: 10, textAnchor: "middle", fill: "#333" });
group.text(325, 285, "Array Multi").attr({ fontSize: 10, textAnchor: "middle", fill: "#333" });

// Demonstrate advanced features with additional shapes
var advGroup = s.g().attr({ id: "advancedClassDemo", transform: "translate(420, 0)" });

// Circle for prefix removal demo
var circle = advGroup.circle(50, 50, 30).attr({ fill: "#bdc3c7" });
circle.addClass(["state-active", "state-warning", "theme-dark"]);

// After 1 second, remove all "state-" classes using prefix
setTimeout(function() {
  circle.removeClass("state-", true);  // Remove all classes starting with "state-"
}, 1000);

// Rectangle for matchClass demo
var matchRect = advGroup.rect(10, 100, 80, 40).attr({ fill: "#95a5a6" });
matchRect.addClass(["user-admin", "user-editor", "status-online", "theme-blue"]);

// Find classes matching pattern
var userClasses = matchRect.matchClass(/^user-/);
var statusClasses = matchRect.classesStartWith("status-");

// Ellipse for hasClass with conjunctive demo
var ellipse = advGroup.ellipse(50, 180, 40, 25).attr({ fill: "#bdc3c7" });
ellipse.addClass(["active", "visible", "enabled"]);

// Check if ANY of these exist (OR logic)
var hasAny = ellipse.hasClass(["active", "hidden"], false);

// Check if ALL exist (AND logic)
var hasAll = ellipse.hasClass(["active", "visible"], true);

var hasAllMissing = ellipse.hasClass(["active", "hidden"], true);

