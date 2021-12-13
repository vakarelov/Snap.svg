(function(root) {
  //Paper functions, require snap_extensions and element_extensions
  Snap_ia.plugin(function(Snap, Element, Paper, global, Fragment, eve) {

    Paper.prototype.clipPath = function(first) {
      let attr;
      const el = this.el('clipPath');
      if (first && !first.paper) {
        el.attr(first);
      } else if (first && first.paper) {
        el.add(first);
      }
      return el;
    };

    Paper.prototype.a = function(href, target) {
      const el = this.el('a');
      if (href || target) {
        const attr = {};
        href && (attr.href = href);
        target && (attr.target = target);
        el.attr(attr);
      }
      return el;
    };

    Paper.prototype.foreignObject = function(x, y, width, height, html) {
      if (typeof width === 'string' && height === undefined && html ===
          undefined) {
        html = width;
        width = undefined;
        height = undefined;
      }
      let attr = {};
      if (Snap.is(x, 'object')) {
        attr = x;
      } else if (x != null) {
        attr = {
          x: x,
          y: y,
          width: width || '',
          height: height || '',
        };
      }
      const el = this.el('foreignObject', attr);
      el.node.innerHTML = html || '';
      return el;
    };

    Paper.prototype.htmlInsert = function(
        x, y, width, height, html, style) {
      const div = '<div xmlns="http://www.w3.org/1999/xhtml" class="IA_Designer_html"></div>';
      const el = this.foreignObject(x, y, width, height, div);
      el.div = Snap(el.node.firstChild);
      if (html) {
        const type = typeof html;
        if (type === 'string') {
          el.div.node.innerHTML = html;
        } else if (type === 'object' && html.paper || Array.isArray(html)) {
          el.div.add(html);
        } else if (type === 'object' && global.jQuery && html instanceof jQuery) {
          el.div.add(html.toArray());
        }
      }
      if (style) el.div.setStyle(style);
      return el;
    };

    Paper.prototype.embeddedSVG = function(
        x, y, width, height, element, viewBox) {
      if (viewBox && viewBox.getBBox) {
        let bb = viewBox.getBBox;
        viewBox = [bb.x, bb.y, bb.width, bb.height];
      }
      !viewBox && (viewBox = [0, 0, width, height]);

      let el = this.htmlInsert(x, y, width, height);
      let embedded_svg = Snap(width, height);
      embedded_svg.attr({id: this.getId() + '_innersvg'});
      el.div.append(embedded_svg.node);
      el.embeddedSvg = embedded_svg;
      embedded_svg.embedded = true;
      if (element) {
        embedded_svg.add(element);
        element.paper = embedded_svg.paper;
      }

      return el;
    };

    Paper.prototype.canvas = function(x, y, width, height, id) {
      id = id || String.rand(8, 'alpha');
      const html = '<canvas id="' + id + '_canvas" ' +
          'width="' + width + '" ' +
          'height="' + height + '"></canvas>';
      const fo = this.foreignObject(0, 0, width, height, html);
      fo.attr({id: id});
      fo.canvas = fo.select('canvas').node;
      return fo;
    };

    const textInputBox = function(id, x, y, width, height) {
      const html = '<div id ="' + id +
          '" xmlns="http://www.w3.org/1999/xhtml">' +
          '<form>' +
          '<input type="text" value="test">' +
          '</form>' +
          '</div>';
      return this.foreignObject(x, y, width, height, html);
    };
    // textInputBox.skip = true;
    Paper.prototype.textInputBox = textInputBox;

    Paper.prototype.point = function(
        group, x, y, color, size, label, label_style) {
      if (typeof group !== 'object' || !group.paper) {
        label_style = label;
        label = size;
        size = color;
        color = y;
        y = x;
        x = group;
        group = this;
      }
      if (typeof x === 'object') {
        label_style = label;
        label = size;
        size = color;
        color = y;
        y = x[1] || x.y;
        x = x[0] || x.x;
      }
      if (typeof color === 'number') {
        label_style = label;
        label = size;
        size = color;
        color = undefined;
      }
      size = size || 1;
      const r = group.getFromScreenDistance(size);
      let pt = this.circle(x, y, r);
      pt.attr({
        stroke: 'white',
        fill: color || 'black',
        strokeWidth: size / 2 || 1,
        is_point: 1,
        'vector-effect': 'non-scaling-stroke',
        class: 'IA_Designer_point',
      });

      if (label !== null) {
        const pt_gr = pt.g();
        pt_gr.add(pt);
        let dx = 5;
        let dy = 5;
        if (label_style) {
          dx = label_style.dx || 5;
          dy = label_style.dy || 5;
        }
        let lb = pt_gr.text(x + dx, y + dy, label);
        if (label_style) lb.setStyle(label_style);
        pt = pt_gr;
      }

      group.add(pt);
      return pt;
    };

    /**
     * Overwrite all circles to be ellipses for geometric simplicity
     * @param x
     * @param y
     * @param r
     * @param attr
     * @return {*}
     */
    Paper.prototype.circle = function(x, y, r, attr) {
      return this.ellipse(x, y, r, r, attr);
    };

    const measureText = function(text, font_style, group) {
      const text_el = this.text(0, 0, text);
      if (font_style) text_el.attr(font_style);
      if (group) group.add(text_el);
      const box = text_el.getBBox();
      text_el.remove();
      return box;
    };
    measureText.skip = true; //Do not transfer to Element
    Paper.prototype.measureText = measureText;

    Paper.prototype.multilineText = function(
        x, y, text, attr, linespace, first_tab) {
      linespace = linespace || 1.2;
      first_tab = first_tab || 0;
      if (typeof text === 'string') text = text.split(/\\n/g);
      let text_tab = this.text(x, y, text, attr);
      let tspans = text_tab.getChildren(true);
      for (let i = 0, l = tspans.length; i < l; ++i) {
        tspans[i].attr({
          x: x + ((i) ? 0 : first_tab),
          dy: (i) ? (linespace + 'em') : '.6em',
        });
      }

      return text_tab;
    };

  });

  //Shape builders
  Snap_ia.plugin(function(Snap, Element, Paper, global, Fragment, eve) {

        /**
         * Creates a circle from a center and a point on it
         * @param cx x coord of center or a point {x:,y:} representing the center.
         * @param cy y coord of center or a point {x:,y:} representing the point on the circle.
         * @param px x coord of the point on the circle
         * @param p2 y coord of the point on the circle
         * @returns {Element} a circle.
         */
        Paper.prototype.circleCentPoint = function(cx, cy, px, p2) {
          if (typeof cy === 'object' && cy.hasOwnProperty('x')) {
            px = cy.x;
            p2 = cy.y;
          }

          if (typeof cx === 'object' && cy.hasOwnProperty('x')) {
            cy = cx.y;
            cx = cx.x;
          }

          return this.circle(cx, cy, Snap.len(cx, cy, px, p2));
        };

        /**
         * A circle defined by two points specifying its diameter.
         * @param x1 x coord of first point or a point {x:,y:} representing the first point.
         * @param y1 y coord of first or a point {x:,y:} representing the second point.
         * @param x2 x coord of the second point on the circle
         * @param y2 y coord of the second point on the circle
         * @returns {Element} a circle
         */
        Paper.prototype.circleTwoPoints = function(x1, y1, x2, y2) {
          if (typeof y1 === 'object' && y1.hasOwnProperty('x')) {
            x2 = y1.x;
            y2 = y1.y;
          }

          if (typeof x1 === 'object' && y1.hasOwnProperty('x')) {
            y1 = x1.y;
            x1 = x1.x;
          }

          return this.circle((x1 + x2) / 2, (y1 + y2) / 2,
              Snap.len(x1, y1, x2, y2) / 2);
        };

        /**
         * A circle from three non-collinear points
         * @param x1 x coord of first point or a point {x:,y:} representing the first point.
         * @param y1 y coord of first or a point {x:,y:} representing the second point.
         * @param x2 x coord of second or a point {x:,y:} representing the third point.
         * @param y2 y coord of second point
         * @param x3 x coord of third point
         * @param y3 y coord of third point
         * @param {number} max_radius Default is 100000. The maximum radius of the circle. If the resultant
         * circle has bigger radius, it is considered degenerate and null will be returned.
         * @returns {Element|null} A Circle or null if the points are (almost) collinear
         */
        Paper.prototype.circleThreePoints = function(
            x1, y1, x2, y2, x3, y3, max_radius) {

          max_radius = max_radius || 100000;
          if (typeof x2 === 'object' && x2.hasOwnProperty('x')) {
            x3 = x2.x;
            y3 = x2.y;
          }

          if (typeof y1 === 'object' && y1.hasOwnProperty('x')) {
            x2 = y1.x;
            y2 = y1.y;
          }

          if (typeof x1 === 'object' && y1.hasOwnProperty('x')) {
            y1 = x1.y;
            x1 = x1.x;
          }

          const yDelta_a = y2 - y1;
          const xDelta_a = x2 - x1;
          const yDelta_b = y3 - y2;
          const xDelta_b = x3 - x2;

          const aSlope = yDelta_a / xDelta_a;
          const bSlope = yDelta_b / xDelta_b;

          const c_x = (aSlope * bSlope * (y1 - y3) + bSlope * (x1 + x2) - aSlope *
              (x2 + x3)) / (2 * (bSlope - aSlope));
          const c_y = -1 * (c_x - (x1 + x2) / 2) / aSlope + (y1 + y2) / 2;

          if (c_x === Infinity || c_y === Infinity) return null;

          const r = Snap.len(c_x, c_y, x1, y1);

          if (r > max_radius) return null;

          return this.circle(c_x, c_y, r);
        };

        /**
         * Generates an ellipse from an elliptical equation:
         *    Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0 or
         *    Ax^2 + Bxy + Cy^2 + Dx + Ey  = -F
         * @param {number} A
         * @param {number} B
         * @param {number} C
         * @param {number} D
         * @param {number} E
         * @param {number|boolean} F may be omitted, in which case F = -1 (unit ellipse)
         * @param {boolean} properties_only if true, only the properties of the ellipse are returned, in the form:
         * {rx: number, ry: number, x: number, y: number, angle: degree}.
         * @returns {Element|{rx: number, ry: number, x: number, y: number, angle: *}|null}
         */
        Paper.prototype.ellipseFromEquation = function(
            A, B, C, D, E, F, properties_only) {
          if (typeof F === 'boolean') {
            properties_only = F;
            F = -1;
          }

          if (F === undefined) F = -1;

          let den = 4 * A * C - B * B;
          if (den == 0) {
            return null;
          }
          let cx = (B * E - 2 * C * D) / den;
          let cy = (B * D - 2 * A * E) / den;

          // evaluate the a coefficient of the ellipse equation in normal form
          // E(x,y) = a*(x-cx)^2 + b*(x-cx)*(y-cy) + c*(y-cy)^2 = 1
          // where b = a*B , c = a*C, (cx,cy) == centre
          let num = A * cx * cx
              + B * cx * cy
              + C * cy * cy
              - F;

          //evaluate ellipse rotation angle
          let rot = Math.atan2(-B, -(A - C)) / 2;
//      cerr << "rot = " << rot << endl;
          let swap_axes = false;
          if (Math.abs(rot - 0) < 1e-6) {
            rot = 0;
          }
          if (Math.abs(rot - Math.PI / 2) < 1e-12 || rot < 0) {
            swap_axes = true;
          }

          // evaluate the length of the ellipse rays
          const cosrot = Math.cos(rot);
          const sinrot = Math.sin(rot);
          const cos2 = cosrot * cosrot;
          const sin2 = sinrot * sinrot;
          const cossin = cosrot * sinrot;

          den = A * cos2 + B * cossin + C * sin2;

//
//        rx2 = num/roots[0];
//        ry2 = num/roots[1];

          if (den === 0) {
            return null;
          }
          const rx2 = num / den;
          if (rx2 < 0) {
            return null;
          }
          let rx = Math.sqrt(rx2);

          den = C * cos2 - B * cossin + A * sin2;
          if (den === 0) {
            return null;
          }
          const ry2 = num / den;
          if (ry2 < 0) {
            return null;
          }

          let ry = Math.sqrt(ry2);

          // the solution is not unique so we choose always the ellipse
          // with a rotation angle between 0 and PI/2
          if (swap_axes) {
            //swap(rx, ry);
            const temp = rx;
            rx = ry;
            ry = temp;
          }
          if (Math.abs(rot - Math.PI / 2) < 1e-6
              || Math.abs(rot - Math.PI / 2) < 1e-6
              || Math.abs(rx - ry) < 1e-12
          ) {
            rot = 0;
          } else {
            if (rot < 0) {
              rot += Math.PI / 2;
            }
          }

          if (properties_only) {
            return {
              x: cx,
              y: cy,
              rx: rx,
              ry: ry,
              angle: Snap.deg(rot),
            };
          } else {
            return this.ellipse(cx, cy, rx, ry).rotate(Snap.deg(rot), cx, cy);
          }
        };

        Paper.prototype.diskSegments = function(
            num_segments, angle, start_angle, inner_rad, outer_rad, style, id,
            group) {
          if (!group && num_segments > 1) {
            group = this.g();
          }

          if (!id && group) id = group.getId();

          if (!angle) angle = 2 * Math.PI / num_segments;

          let d, p1, p2, p3, p4, c, angle_step, insc_rad, path, place;
          for (let i = 0; i < num_segments; ++i) {
            angle_step = angle * i + start_angle; //Adding Pi to reposition upwards.
            p1 = Snap.fromPolar(inner_rad, angle_step - angle / 2);
            p2 = Snap.fromPolar(outer_rad, angle_step - angle / 2);
            p3 = Snap.fromPolar(outer_rad, angle_step + angle / 2);
            p4 = Snap.fromPolar(inner_rad, angle_step + angle / 2);

            d = 'M ' + p1.x + ',' + p1.y +
                ' L ' + p2.x + ',' + p2.y +
                ' A ' + outer_rad + ',' + outer_rad + ',0,0,1,' + p3.x + ',' +
                p3.y +
                ' L ' + p4.x + ',' + p4.y +
                ' A ' + (inner_rad) + ',' + (inner_rad) + ',0,0,0,' + p1.x + ',' +
                p1.y;

            path = this.paper.path(d);
            if (id) path.attr('id', id + '_' + i);
            if (style) {
              if (Array.isArray(style)) {
                path.attr('style', style[i]);
              } else if (typeof style === 'function') {
                style(path, group, i, inner_rad, outer_rad, angle_step, angle,
                    [p1, p2, p3, p4]);
              } else {
                path.setStyle(style);
              }
            }

            if (group) group.add(path);
          }

          return (group) ? group : path;
        };

        Paper.prototype.disk = function(cx, cy, our_rad, inner_rad) {
          const outer = this.circle(cx, cy, our_rad).toDefs();
          const inner = this.circle(cx, cy, inner_rad).toDefs();

          const d = Snap.path.toPath(outer, true) + ' ' +
              Snap.path.toPath(inner, true);

          outer.remove();
          inner.remove();

          return this.path(d).attr({fillRule: 'evenodd'});
        };

        Paper.prototype.arcFan = function(
            rad, angle, step, symbol, style, id, group) {
          if (!group) {
            group = this.g();
          }

          if (!id) id = group.getId();

          let processor;

          const that = this;
          if (symbol.paper) {
            const box = symbol.getBBox();
            processor = function(p, angle, id) {
              const copy = symbol.clone().attr('id', id);
              copy.translate(p.x, p.y, undefined, box.cx, box.y2);
              copy.rotate(angle, p.x, p.y);
              return copy;
            };
          } else if (symbol.type === 'line') {
            processor = function(p, angle, id) {
              const p2 = {
                x: p.x + symbol.l * Math.cos(angle * Math.PI * 2 / 360),
                y: p.y + symbol.l * Math.sin(angle * Math.PI * 2 / 360),
              };
              return that.line(p.x, p.y, p2.x, p2.y).attr('id', id);
            };
          } else if (symbol.type === 'circle') {
            processor = function(p, angle, id) {
              return that.circle(p.x, p.y, symbol.r).attr('id', id);
            };
          } else {
            return undefined;
          }

          for (let a = -angle / 2, i = 0, inc = angle / (step - 1); i <
          step; ++i, a += inc) {
            const p = Snap.fromPolar(rad, Snap.rad(a));
            const el = processor(p, a, id + '_' + i);
            if (style) {
              if (Array.isArray(style)) {
                el.attr('style', style[i]);
              } else if (typeof style === 'function') {
                style(el, group, i, a, p);
              } else {
                el.setStyle(style);
              }
            }
            group.add(el);
          }

          return group;
        };

        /**
         * Creates a rectangular grid.
         *
         * @param {number} width
         * @param {number} height
         * @param {number} rows
         * @param {number} cols
         * @param {function, object} style
         * @param {string} id
         * @param {Element} group
         * @return {*}
         */
        Paper.prototype.grid = function(
            width, height, rows, cols, style, id, group) {
          if (!group) {
            group = this.g();
          }

          if (!id) id = group.getId();

          let style_fun;
          if (typeof style !== 'function') {
            style_fun = function(rect) {
              rect.setStyle(style);
            };
          } else {
            style_fun = style;
          }

          const rect_w = width / cols;
          const rect_h = height / rows;

          for (let i = 0, j, rect; i < cols; ++i) {
            for (j = 0; j < rows; j++) {
              rect = this.rect(i * rect_w, j * rect_h, rect_w, rect_h).attr({
                id: id + '_' + i + '_' + j,
                position: i + ', ' + j,
              });

              style_fun(rect, i, j);
              group.add(rect);
            }
          }

          return group;
        };

        Paper.prototype.zigzag = function(
            p1, p2_width, period, amplitude, reverice) {
          const p2 = (typeof p2_width === 'number') ?
              {x: p1.x + p2_width, y: p1.y} :
              p2_width;

          const length = (typeof p2_width === 'number') ?
              p2_width :
              Snap.len(p1.x, p1.y, p2.x, p2.y);

          const num_periods = round(length / period);
          period = length / num_periods;

          amplitude = (reverice) ? -amplitude : amplitude;

          const v = {
            x: period / 2 * (p2.x - p1.x) / length,
            y: period / 2 * (p2.y - p1.y) / length,
          };
          const norm = {
            x: -amplitude * (p2.y - p1.y) / length,
            y: amplitude * (p2.x - p1.x) / length,
          };

          const points = [p1.x, p1.y];
          for (let i = 1, px, py, amp_dir; i < 2 * num_periods; ++i) {
            amp_dir = (-1) * (i % 2);
            px = (i * v.x + p1.x) + (norm.x) * amp_dir;
            py = (i * v.y + p1.y) + (norm.y) * amp_dir;
            points.push(px);
            points.push(py);
          }
          points.push(p2.x);
          points.push(p2.y);

          return this.polyline(points);
        };
      },
  );

  Snap_ia.plugin(function(Snap, Element, Paper, global, Fragment, eve) {
    //Add paper functions to elements

    /**
     * If placed as the first argument for an element constructor function called on a element, the new element is
     * placed after current. This overrides the behaviour where the new element will be added inside group-like elements.
     * @type {string}
     */
    Snap.FORCE_AFTER = '__force_after';

    /*
    * Functions that should not be transferred to element should have a property "skip" set to true.
    * */

    function paperMetForEl(method) {
      return function() {
        let force_after = false;
        if (arguments[0] === Snap.FORCE_AFTER) {
          force_after = true;
          Array.prototype.shift.apply(arguments);
        }
        const result = method.apply(this, arguments);
        if (!force_after && this.isGroupLike()) {
          return result;
        } else {
          this.after(result);
          return result;
        }

      };
    }

    for (var method in Paper.prototype) if (Paper.prototype.hasOwnProperty(
        method)) {
      if (!Paper.prototype[method].skip) {
        Element.prototype[method] = Element.prototype[method] ||
            paperMetForEl(Paper.prototype[method]);
      }
    }
  });

}(window || this));