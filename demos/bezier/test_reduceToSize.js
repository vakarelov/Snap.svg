// Example usage of reduceToSize method

// Create a long bezier curve
const bezier = new Snap.bezier(
    100, 100,  // Start point
    300, 50,   // Control point 1
    500, 150,  // Control point 2
    700, 100   // End point
);

console.log('Original Bezier:', bezier);
console.log('Distance between first and last point:',
    Math.sqrt(
        Math.pow(bezier.points[0].x - bezier.points[3].x, 2) +
        Math.pow(bezier.points[0].y - bezier.points[3].y, 2)
    )
);

// Split into segments with max distance of 200
const maxSize = 200;
const segments = bezier.reduceToSize(maxSize);

console.log(`Split into ${segments.length} segments with maxSize=${maxSize}`);

segments.forEach((segment, index) => {
    const p1 = segment.points[0];
    const p2 = segment.points[segment.points.length - 1];
    const dist = Math.sqrt(
        Math.pow(p1.x - p2.x, 2) +
        Math.pow(p1.y - p2.y, 2)
    );
    console.log(`Segment ${index}: distance = ${dist.toFixed(2)} (max: ${maxSize})`);
});

// Visualize the segments
const s = Snap("#canvas");

// Draw original curve in light gray
const originalPath = s.path(bezier.toSVG());
originalPath.attr({
    stroke: '#ccc',
    strokeWidth: 2,
    fill: 'none'
});

// Draw segments in different colors
const colors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ffff00', '#00ffff'];
segments.forEach((segment, index) => {
    const path = s.path(segment.toSVG());
    path.attr({
        stroke: colors[index % colors.length],
        strokeWidth: 3,
        fill: 'none'
    });

    // Draw markers at start and end points
    const p1 = segment.points[0];
    const p2 = segment.points[segment.points.length - 1];

    s.circle(p1.x, p1.y, 5).attr({fill: colors[index % colors.length]});
    s.circle(p2.x, p2.y, 5).attr({fill: colors[index % colors.length]});

    // Draw line between start and end to show the measured distance
    s.line(p1.x, p1.y, p2.x, p2.y).attr({
        stroke: colors[index % colors.length],
        strokeWidth: 1,
        strokeDasharray: '5,5',
        opacity: 0.5
    });
});

