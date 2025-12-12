# Snap.svg Filter Reference

Complete reference for predefined SVG filters in Snap.svg.

## Basic Filters

### blur
Gaussian blur effect.
```javascript
Snap.filter.blur(x, y)
```
- `x` - amount of horizontal blur in pixels (default: 2)
- `y` - amount of vertical blur in pixels (optional, defaults to x)

**Example:**
```javascript
var f = paper.filter(Snap.filter.blur(5, 10));
circle.attr({filter: f});
```

---

### shadow
Drop shadow effect with full control.
```javascript
Snap.filter.shadow(dx, dy, blur, color, opacity)
```
- `dx` - horizontal offset (default: 0)
- `dy` - vertical offset (default: 2)
- `blur` - blur amount (default: 4)
- `color` - shadow color (default: "#000")
- `opacity` - shadow opacity 0..1 (default: 1)

**Overloads:**
- `shadow(dx, dy)` - basic shadow
- `shadow(dx, dy, opacity)` - shadow with opacity
- `shadow(dx, dy, color, opacity)` - shadow with color

**Example:**
```javascript
var f = paper.filter(Snap.filter.shadow(2, 2, 3, '#000', 0.5));
circle.attr({filter: f});
```

---

### dropShadow
Efficient drop shadow using feDropShadow (modern SVG).
```javascript
Snap.filter.dropShadow(dx, dy, blur, color, opacity)
```
- `dx` - horizontal offset (default: 2)
- `dy` - vertical offset (default: 2)
- `blur` - blur amount (default: 3)
- `color` - shadow color (default: "#000")
- `opacity` - shadow opacity 0..1 (default: 0.5)

---

## Color Adjustment Filters

### brightness
Adjust image brightness.
```javascript
Snap.filter.brightness(amount)
```
- `amount` - brightness multiplier (0..2+, default: 1)
  - 0 = black
  - 1 = original
  - 2+ = brighter

**Example:**
```javascript
var f = paper.filter(Snap.filter.brightness(1.5)); // 50% brighter
```

---

### contrast
Adjust image contrast.
```javascript
Snap.filter.contrast(amount)
```
- `amount` - contrast level (0..2+, default: 1)
  - <1 = less contrast
  - 1 = original
  - >1 = more contrast

---

### saturate
Adjust color saturation.
```javascript
Snap.filter.saturate(amount)
```
- `amount` - saturation level (0..1, default: 1)
  - 0 = fully desaturated (grayscale)
  - 1 = original colors

**Note:** The parameter is inverted internally, so 1 = original saturation.

---

### hueRotate
Rotate hue around the color wheel.
```javascript
Snap.filter.hueRotate(angle)
```
- `angle` - rotation angle in degrees (default: 0)
  - 0 = original
  - 180 = complementary colors
  - 360 = back to original

**Example:**
```javascript
var f = paper.filter(Snap.filter.hueRotate(90)); // 90° hue shift
```

---

### invert
Invert colors.
```javascript
Snap.filter.invert(amount)
```
- `amount` - inversion amount (0..1, default: 1)
  - 0 = original
  - 1 = fully inverted

---

### grayscale
Convert to grayscale.
```javascript
Snap.filter.grayscale(amount)
```
- `amount` - grayscale amount (0..1, default: 1)
  - 0 = original colors
  - 1 = full grayscale

---

### sepia
Apply sepia tone effect.
```javascript
Snap.filter.sepia(amount)
```
- `amount` - sepia amount (0..1, default: 1)
  - 0 = original
  - 1 = full sepia

---

### duotone
Two-color toning effect.
```javascript
Snap.filter.duotone(color1, color2)
```
- `color1` - shadow color (default: "#00f")
- `color2` - highlight color (default: "#f00")

**Example:**
```javascript
var f = paper.filter(Snap.filter.duotone('#004', '#ff0'));
```

---

### colorize
Colorize image with a specific color.
```javascript
Snap.filter.colorize(color, amount)
```
- `color` - target color (default: "#f00")
- `amount` - colorization amount (0..1, default: 1)

---

## Artistic Filters

### glow
Outer glow effect.
```javascript
Snap.filter.glow(color, width, opacity)
```
- `color` - glow color (default: "#fff")
- `width` - glow width in pixels (default: 5)
- `opacity` - glow opacity (0..1, default: 0.8)

---

### innerGlow
Inner glow effect.
```javascript
Snap.filter.innerGlow(color, width, opacity)
```
- `color` - glow color (default: "#fff")
- `width` - glow width in pixels (default: 5)
- `opacity` - glow opacity (0..1, default: 0.8)

---

### neon
Neon glow effect with multiple blur layers.
```javascript
Snap.filter.neon(color, width)
```
- `color` - neon color (default: "#0ff")
- `width` - glow width in pixels (default: 3)

**Example:**
```javascript
var f = paper.filter(Snap.filter.neon('#0ff', 4));
text.attr({filter: f, fill: '#fff'});
```

---

### emboss
3D emboss effect.
```javascript
Snap.filter.emboss(strength)
```
- `strength` - emboss strength (default: 1)

---

### blur3d
3D-like blur effect with shadow offset.
```javascript
Snap.filter.blur3d(depth, color)
```
- `depth` - depth of 3D effect (default: 5)
- `color` - shadow color (default: "#000")

---

## Edge Detection & Sharpening

### sharpen
Sharpen image details.
```javascript
Snap.filter.sharpen(amount)
```
- `amount` - sharpening amount (default: 1)

---

### edge
Edge detection filter.
```javascript
Snap.filter.edge(strength)
```
- `strength` - edge detection strength (default: 0.9)

---

### sobel
Sobel edge detection with directional support.
```javascript
Snap.filter.sobel(strength, rotation)
```
- `strength` - edge strength (default: 1)
- `rotation` - edge direction (0, 45, 135, default: 0)
  - 0 = standard Sobel (horizontal/vertical)
  - 45 = diagonal ↘
  - 135 = diagonal ↙

---

## Special Effects

### motionBlur
Motion blur in a specific direction.
```javascript
Snap.filter.motionBlur(angle, distance)
```
- `angle` - motion angle in degrees (default: 0 = horizontal)
- `distance` - blur distance (default: 10)

**Example:**
```javascript
var f = paper.filter(Snap.filter.motionBlur(45, 15)); // 45° motion blur
```

---

### turbulence
Turbulence/noise texture effect.
```javascript
Snap.filter.turbulence(baseFrequency, numOctaves, type)
```
- `baseFrequency` - noise frequency (default: 0.05)
- `numOctaves` - number of octaves (default: 2)
- `type` - "fractalNoise" or "turbulence" (default: "turbulence")

---

### pixelate
Pixelation effect.
```javascript
Snap.filter.pixelate(size)
```
- `size` - pixel size (default: 5)

---

### posterize
Reduce number of colors (posterization).
```javascript
Snap.filter.posterize(levels)
```
- `levels` - number of color levels 2-10 (default: 4)

---

### chromaticAberration
RGB channel separation effect.
```javascript
Snap.filter.chromaticAberration(amount)
```
- `amount` - separation amount in pixels (default: 2)

**Example:**
```javascript
var f = paper.filter(Snap.filter.chromaticAberration(3));
image.attr({filter: f});
```

---

### vignette
Darkened corners effect.
```javascript
Snap.filter.vignette(intensity, radius)
```
- `intensity` - vignette darkness (0..1, default: 0.5)
- `radius` - vignette radius (0..1, default: 0.7)

---

### oldFilm
Old film effect with grain and sepia.
```javascript
Snap.filter.oldFilm(grainAmount, sepiaAmount)
```
- `grainAmount` - grain/noise amount (0..1, default: 0.3)
- `sepiaAmount` - sepia tone amount (0..1, default: 0.8)

**Example:**
```javascript
var f = paper.filter(Snap.filter.oldFilm(0.4, 0.9));
photo.attr({filter: f});
```

---

## Usage Patterns

### Basic Usage
```javascript
// Create filter
var filter = paper.filter(Snap.filter.blur(5));

// Apply to element
circle.attr({filter: filter});
```

### Combining Filters
```javascript
// Combine multiple filter strings
var combined = 
    Snap.filter.grayscale(1) +
    Snap.filter.contrast(1.2) +
    Snap.filter.blur(1);

var filter = paper.filter(combined);
element.attr({filter: filter});
```

### Dynamic Updates
Some filters support dynamic updates:
```javascript
var filter = paper.filter(Snap.filter.blur(0));
circle.attr({filter: filter});

// Update blur amount
if (filter.update) {
    filter.update(5, 5); // Update to blur(5, 5)
}
```

### Removing Filters
```javascript
// Remove filter
element.attr({filter: 'none'});
// or
element.attr({filter: null});
```

---

## Filter Categories Summary

| Category | Filters |
|----------|---------|
| **Blur** | blur, motionBlur, blur3d |
| **Shadow** | shadow, dropShadow, glow, innerGlow, neon |
| **Color** | brightness, contrast, saturate, hueRotate, invert |
| **Tone** | grayscale, sepia, duotone, colorize |
| **Artistic** | emboss, turbulence, pixelate, posterize, oldFilm |
| **Edge** | sharpen, edge, sobel |
| **Distortion** | chromaticAberration, vignette |

---

## Performance Notes

1. **Simple filters** (brightness, contrast, hue) are typically faster
2. **Blur-based filters** (shadow, glow, neon) are more expensive
3. **Convolution filters** (emboss, sharpen, edge) are moderately expensive
4. **Combined filters** multiply the performance cost
5. Use `dropShadow` instead of `shadow` when possible for better performance

---

## Browser Compatibility

- All filters require SVG filter support
- `feDropShadow` is modern (IE/Edge 18+, Chrome 68+, Firefox 62+)
- Older browsers may need fallbacks
- Test filters across target browsers

---

## Examples

### Photo Effect
```javascript
var vintage = 
    Snap.filter.sepia(0.7) +
    Snap.filter.contrast(1.1) +
    Snap.filter.vignette(0.4, 0.8);
var f = paper.filter(vintage);
image.attr({filter: f});
```

### Glowing Text
```javascript
var glow = paper.filter(Snap.filter.neon('#0ff', 4));
text.attr({
    filter: glow,
    fill: '#fff',
    stroke: '#0ff',
    strokeWidth: 0.5
});
```

### Sketch Effect
```javascript
var sketch = 
    Snap.filter.edge(1.2) +
    Snap.filter.invert(1) +
    Snap.filter.brightness(1.5);
var f = paper.filter(sketch);
photo.attr({filter: f});
```

