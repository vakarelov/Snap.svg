# New Predefined Filters Documentation

## Date: December 9, 2025

This document describes the new predefined filters added to Snap.svg filter.js

---

## 1. Drop Shadow Filter
**Method**: `Snap.filter.dropShadow(dx, dy, blur, color, opacity)`

A more efficient alternative to the traditional shadow filter using the native `feDropShadow` element.

**Parameters**:
- `dx` - horizontal offset (default: 2)
- `dy` - vertical offset (default: 2)
- `blur` - blur amount (default: 3)
- `color` - shadow color (default: "#000")
- `opacity` - shadow opacity 0..1 (default: 0.5)

**Example**:
```javascript
var f = paper.filter(Snap.filter.dropShadow(3, 3, 5, "#f00", 0.7));
circle.attr({filter: f});
```

---

## 2. Glow Filter
**Method**: `Snap.filter.glow(color, width, opacity)`

Creates an outer glow effect around elements.

**Parameters**:
- `color` - glow color (default: "#fff")
- `width` - glow width (default: 5)
- `opacity` - glow opacity 0..1 (default: 0.8)

**Example**:
```javascript
var f = paper.filter(Snap.filter.glow("#00f", 8, 0.9));
text.attr({filter: f});
```

---

## 3. Inner Glow Filter
**Method**: `Snap.filter.innerGlow(color, width, opacity)`

Creates an inner glow effect inside elements.

**Parameters**:
- `color` - glow color (default: "#fff")
- `width` - glow width (default: 5)
- `opacity` - glow opacity 0..1 (default: 0.8)

**Example**:
```javascript
var f = paper.filter(Snap.filter.innerGlow("#ff0", 6, 0.7));
rect.attr({filter: f});
```

---

## 4. 3D Blur Filter
**Method**: `Snap.filter.blur3d(depth, color)`

Creates a 3D-like depth effect using offset blur.

**Parameters**:
- `depth` - depth of 3D effect (default: 5)
- `color` - shadow color (default: "#000")

**Example**:
```javascript
var f = paper.filter(Snap.filter.blur3d(10, "#333"));
circle.attr({filter: f});
```

---

## 5. Emboss Filter
**Method**: `Snap.filter.emboss(strength)`

Creates an embossed/raised effect using convolution matrix.

**Parameters**:
- `strength` - emboss strength (default: 1)

**Example**:
```javascript
var f = paper.filter(Snap.filter.emboss(1.5));
text.attr({filter: f});
```

---

## 6. Sharpen Filter
**Method**: `Snap.filter.sharpen(amount)`

Sharpens the element by enhancing edges.

**Parameters**:
- `amount` - sharpen amount (default: 1)

**Example**:
```javascript
var f = paper.filter(Snap.filter.sharpen(2));
image.attr({filter: f});
```

---

## 7. Edge Detection Filter
**Method**: `Snap.filter.edge(strength)`

Detects and highlights edges in the element.

**Parameters**:
- `strength` - edge detection strength (default: 1)

**Example**:
```javascript
var f = paper.filter(Snap.filter.edge(1.5));
image.attr({filter: f});
```

---

## 8. Motion Blur Filter
**Method**: `Snap.filter.motionBlur(angle, distance)`

Creates directional motion blur effect.

**Parameters**:
- `angle` - motion angle in degrees (default: 0 = horizontal)
- `distance` - blur distance (default: 10)

**Example**:
```javascript
// 45-degree motion blur
var f = paper.filter(Snap.filter.motionBlur(45, 15));
car.attr({filter: f});
```

---

## 9. Turbulence Filter
**Method**: `Snap.filter.turbulence(baseFrequency, numOctaves, type)`

Creates turbulent noise/distortion effect.

**Parameters**:
- `baseFrequency` - turbulence frequency (default: 0.05)
- `numOctaves` - number of octaves (default: 2)
- `type` - "fractalNoise" or "turbulence" (default: "turbulence")

**Example**:
```javascript
var f = paper.filter(Snap.filter.turbulence(0.03, 3, "fractalNoise"));
rect.attr({filter: f});
```

---

## 10. Duotone Filter
**Method**: `Snap.filter.duotone(color1, color2)`

Converts the element to two-color tone effect.

**Parameters**:
- `color1` - first color (default: "#00f")
- `color2` - second color (default: "#f00")

**Example**:
```javascript
var f = paper.filter(Snap.filter.duotone("#ff00ff", "#00ffff"));
image.attr({filter: f});
```

---

## 11. Colorize Filter
**Method**: `Snap.filter.colorize(color, amount)`

Tints the element with a specific color.

**Parameters**:
- `color` - target color (default: "#f00")
- `amount` - colorization amount 0..1 (default: 1)

**Example**:
```javascript
var f = paper.filter(Snap.filter.colorize("#0f0", 0.7));
image.attr({filter: f});
```

---

## 12. Pixelate Filter
**Method**: `Snap.filter.pixelate(size)`

Creates a pixelated/mosaic effect.

**Parameters**:
- `size` - pixel size (default: 5)

**Example**:
```javascript
var f = paper.filter(Snap.filter.pixelate(8));
image.attr({filter: f});
```

---

## 13. Posterize Filter
**Method**: `Snap.filter.posterize(levels)`

Reduces colors to create a poster-like effect.

**Parameters**:
- `levels` - number of color levels 2-10 (default: 4)

**Example**:
```javascript
var f = paper.filter(Snap.filter.posterize(3));
image.attr({filter: f});
```

---

## Filter Categories

### Shadow & Depth Effects
- `dropShadow` - Efficient drop shadow
- `shadow` - Traditional complex shadow
- `blur3d` - 3D depth effect

### Glow Effects
- `glow` - Outer glow
- `innerGlow` - Inner glow

### Image Enhancement
- `sharpen` - Sharpen edges
- `emboss` - Embossed effect
- `edge` - Edge detection

### Motion & Distortion
- `motionBlur` - Directional blur
- `turbulence` - Noise/distortion
- `pixelate` - Pixelation effect

### Color Effects
- `grayscale` - Grayscale conversion
- `sepia` - Sepia tone
- `invert` - Color inversion
- `duotone` - Two-color effect
- `colorize` - Color tinting
- `posterize` - Posterization
- `saturate` - Saturation adjustment
- `hueRotate` - Hue rotation
- `brightness` - Brightness adjustment
- `contrast` - Contrast adjustment

### Basic Effects
- `blur` - Gaussian blur (supports `.update()` method)

---

## Usage Tips

1. **Combining Filters**: You can combine multiple filter primitives:
```javascript
var filterStr = 
    Snap.filter.blur(3) + 
    Snap.filter.brightness(1.2);
var f = paper.filter(filterStr);
```

2. **Performance**: Simple filters like `dropShadow` perform better than complex multi-element filters like `shadow`.

3. **Browser Support**: Most filters work in all modern browsers, but some advanced features may have varying support.

4. **Animation**: The `blur` filter supports the `.update()` method for animation:
```javascript
var f = paper.filter(Snap.filter.blur(2));
circle.attr({filter: f});
// Later animate:
f.update(10);
```

---

## Total Filters Available

**22 predefined filters** covering:
- Basic adjustments (blur, brightness, contrast)
- Color manipulation (grayscale, sepia, invert, hueRotate, saturate)
- Artistic effects (duotone, colorize, posterize, pixelate)
- Enhancement (sharpen, emboss, edge)
- Effects (shadow, dropShadow, glow, innerGlow, blur3d)
- Distortion (turbulence, motionBlur)

