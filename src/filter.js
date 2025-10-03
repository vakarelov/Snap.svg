// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap_ia.plugin(function(Snap, Element, Paper, glob, Fragment, eve) {
  var elproto = Element.prototype,
      pproto = Paper.prototype,
      rgurl = /^\s*url\((.+)\)/,
      Str = String,
      $ = Snap._.$;
  Snap.filter = {};
  /**
   * Paper.filter @method
 *
   * Creates a `<filter>` element
 *
 * @param {string} filstr - SVG fragment of filter provided as a string
 * @returns {object} @Element
   * Note: It is recommended to use filters embedded into the page inside an empty SVG element.
   > Usage
   | var f = paper.filter('<feGaussianBlur stdDeviation="2"/>'),
   |     c = paper.circle(10, 10, 10).attr({
   |         filter: f
   |     });
  */
  pproto.filter = function(filstr, local) {
    var paper = this;
    if (paper.type != 'svg') {
      paper = paper.paper;
    }
    var f = Snap.parse(Str(filstr)),
        id = Snap._.id(),
        width = paper.node.offsetWidth,
        height = paper.node.offsetHeight,
        filter = $('filter');
    $(filter, {
      id: id,
      filterUnits: (local) ? 'objectBoundingBox' : 'userSpaceOnUse',
    });
    filter.appendChild(f.node);
    paper.defs.appendChild(filter);
    const ElementClass = Snap.getClass("Element");
    const element = new ElementClass(filter);
    let deffun = filter.querySelector('[deffun]');
    if (deffun) {
      let type = deffun.getAttribute('deffun');
      if (updates.hasOwnProperty(type)) element.update = updates[type].bind(
          element);
    }
    return element;
  };

  const updates = {};

  eve.on('snap.util.getattr.filter', function() {
    eve.stop();
    var p = $(this.node, 'filter');
    if (p) {
      var match = Str(p).match(rgurl);
      return match && Snap.select(match[1]);
    }
  })(-1);
  eve.on('snap.util.attr.filter', function(value) {
    if (value instanceof Element && value.type == 'filter') {
      eve.stop();
      var id = value.node.id;
      if (!id) {
        $(value.node, {id: value.id});
        id = value.id;
      }
      $(this.node, {
        filter: Snap.url(id),
      });
    }
    if (!value || value == 'none') {
      eve.stop();
      this.node.removeAttribute('filter');
    }
  })(-1);
  /**
   * Snap.filter.blur @method
 *
   * Returns an SVG markup string for the blur filter
 *
 * @param {number} x - amount of horizontal blur, in pixels
 * @param {number} y - #optional amount of vertical blur, in pixels
 * @returns {string} filter representation
   > Usage
   | var f = paper.filter(Snap.filter.blur(5, 10)),
   |     c = paper.circle(10, 10, 10).attr({
   |         filter: f
   |     });
  */
  Snap.filter.blur = function(x, y) {
    if (x == null) {
      x = 2;
    }
    var def = y == null ? x : [x, y];
    const filter_str = Snap.format(
        '\<feGaussianBlur deffun="blur" stdDeviation="{def}"/>', {
          def: def,
        });

    return filter_str;
  };
  Snap.filter.blur.toString = function() {
    return this();
  };
  updates.blur = function blur_update(x, y) {
    if (x == null) {
      x = 2;
    }
    var def = y == null ? x : [x, y];
    let feGaussianBlur = this.select('feGaussianBlur');
    feGaussianBlur.node.setAttribute('stdDeviation',
        Snap.format('{def}', {def: def}));
  };
  /**
   * Snap.filter.shadow @method
 *
   * Returns an SVG markup string for the shadow filter
 *
 * @param {number} dx - #optional horizontal shift of the shadow, in pixels
 * @param {number} dy - #optional vertical shift of the shadow, in pixels
 * @param {number} blur - #optional amount of blur
 * @param {string} color - #optional color of the shadow
 * @param {number} opacity - #optional `0..1` opacity of the shadow
   * or
 * @param {number} dx - #optional horizontal shift of the shadow, in pixels
 * @param {number} dy - #optional vertical shift of the shadow, in pixels
 * @param {string} color - #optional color of the shadow
 * @param {number} opacity - #optional `0..1` opacity of the shadow
   * which makes blur default to `4`. Or
 * @param {number} dx - #optional horizontal shift of the shadow, in pixels
 * @param {number} dy - #optional vertical shift of the shadow, in pixels
 * @param {number} opacity - #optional `0..1` opacity of the shadow
 * @returns {string} filter representation
   > Usage
   | var f = paper.filter(Snap.filter.shadow(0, 2, .3)),
   |     c = paper.circle(10, 10, 10).attr({
   |         filter: f
   |     });
  */
  Snap.filter.shadow = function(dx, dy, blur, color, opacity) {
    if (opacity == null) {
      if (color == null) {
        opacity = blur;
        blur = 4;
        color = '#000';
      } else {
        opacity = color;
        color = blur;
        blur = 4;
      }
    }
    if (blur == null) {
      blur = 4;
    }
    if (opacity == null) {
      opacity = 1;
    }
    if (dx == null) {
      dx = 0;
      dy = 2;
    }
    if (dy == null) {
      dy = dx;
    }
    color = Snap.color(color);
    return Snap.format(
        '<feGaussianBlur deffun="shadow" in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="offsetblur"/><feFlood flood-color="{color}"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="{opacity}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>',
        {
          color: color,
          dx: dx,
          dy: dy,
          blur: blur,
          opacity: opacity,
        });
  };
  Snap.filter.shadow.toString = function() {
    return this();
  };
  /**
   * Snap.filter.grayscale @method
 *
   * Returns an SVG markup string for the grayscale filter
 *
 * @param {number} amount - amount of filter (`0..1`)
 * @returns {string} filter representation
  */
  Snap.filter.grayscale = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return Snap.format(
        '<feColorMatrix deffun="grayscale" type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0"/>',
        {
          a: 0.2126 + 0.7874 * (1 - amount),
          b: 0.7152 - 0.7152 * (1 - amount),
          c: 0.0722 - 0.0722 * (1 - amount),
          d: 0.2126 - 0.2126 * (1 - amount),
          e: 0.7152 + 0.2848 * (1 - amount),
          f: 0.0722 - 0.0722 * (1 - amount),
          g: 0.2126 - 0.2126 * (1 - amount),
          h: 0.0722 + 0.9278 * (1 - amount),
        });
  };
  Snap.filter.grayscale.toString = function() {
    return this();
  };
  /**
   * Snap.filter.sepia @method
 *
   * Returns an SVG markup string for the sepia filter
 *
 * @param {number} amount - amount of filter (`0..1`)
 * @returns {string} filter representation
  */
  Snap.filter.sepia = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return Snap.format(
        '<feColorMatrix deffun="sepia" type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0"/>',
        {
          a: 0.393 + 0.607 * (1 - amount),
          b: 0.769 - 0.769 * (1 - amount),
          c: 0.189 - 0.189 * (1 - amount),
          d: 0.349 - 0.349 * (1 - amount),
          e: 0.686 + 0.314 * (1 - amount),
          f: 0.168 - 0.168 * (1 - amount),
          g: 0.272 - 0.272 * (1 - amount),
          h: 0.534 - 0.534 * (1 - amount),
          i: 0.131 + 0.869 * (1 - amount),
        });
  };
  Snap.filter.sepia.toString = function() {
    return this();
  };
  /**
   * Snap.filter.saturate @method
 *
   * Returns an SVG markup string for the saturate filter
 *
 * @param {number} amount - amount of filter (`0..1`)
 * @returns {string} filter representation
  */
  Snap.filter.saturate = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return Snap.format('<feColorMatrix type="saturate" values="{amount}"/>', {
      amount: 1 - amount,
    });
  };
  Snap.filter.saturate.toString = function() {
    return this();
  };
  /**
   * Snap.filter.hueRotate @method
 *
   * Returns an SVG markup string for the hue-rotate filter
 *
 * @param {number} angle - angle of rotation
 * @returns {string} filter representation
  */
  Snap.filter.hueRotate = function(angle) {
    angle = angle || 0;
    return Snap.format(
        '<feColorMatrix deffun="hueRotate" type="hueRotate" values="{angle}"/>',
        {
          angle: angle,
        });
  };
  Snap.filter.hueRotate.toString = function() {
    return this();
  };
  /**
   * Snap.filter.invert @method
 *
   * Returns an SVG markup string for the invert filter
 *
 * @param {number} amount - amount of filter (`0..1`)
 * @returns {string} filter representation
  */
  Snap.filter.invert = function(amount) {
    if (amount == null) {
      amount = 1;
    }
//        <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" color-interpolation-filters="sRGB"/>
    return Snap.format(
        '<feComponentTransfer deffun="invert"><feFuncR type="table" tableValues="{amount} {amount2}"/><feFuncG type="table" tableValues="{amount} {amount2}"/><feFuncB type="table" tableValues="{amount} {amount2}"/></feComponentTransfer>',
        {
          amount: amount,
          amount2: 1 - amount,
        });
  };
  Snap.filter.invert.toString = function() {
    return this();
  };
  /**
   * Snap.filter.brightness @method
 *
   * Returns an SVG markup string for the brightness filter
 *
 * @param {number} amount - amount of filter (`0..1`)
 * @returns {string} filter representation
  */
  Snap.filter.brightness = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return Snap.format(
        '<feComponentTransfer deffun="brightness"><feFuncR type="linear" slope="{amount}"/><feFuncG type="linear" slope="{amount}"/><feFuncB type="linear" slope="{amount}"/></feComponentTransfer>',
        {
          amount: amount,
        });
  };
  Snap.filter.brightness.toString = function() {
    return this();
  };
  /**
   * Snap.filter.contrast @method
 *
   * Returns an SVG markup string for the contrast filter
 *
 * @param {number} amount - amount of filter (`0..1`)
 * @returns {string} filter representation
  */
  Snap.filter.contrast = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return Snap.format(
        '<feComponentTransfer deffun="contrast"><feFuncR type="linear" slope="{amount}" intercept="{amount2}"/><feFuncG type="linear" slope="{amount}" intercept="{amount2}"/><feFuncB type="linear" slope="{amount}" intercept="{amount2}"/></feComponentTransfer>',
        {
          amount: amount,
          amount2: .5 - amount / 2,
        });
  };
  Snap.filter.contrast.toString = function() {
    return this();
  };
});
