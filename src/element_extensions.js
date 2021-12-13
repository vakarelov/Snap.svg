(function(root) {
//Element Extansions
  Snap_ia.plugin(function(Snap, Element, Paper, global, Fragment, eve) {

    const STRICT_MODE = true;
    //ELEMENT Functions

    let _ = {};

    Element.prototype.getId = function() {
      let id = this.attr('id');
      if (!id) {
        id = this.id;
        this.attr('id', id);
      }
      return id;
    };

    /**
     * Sets the id of the element and adjusts any references of the object.
     *
     * @param {String | undefined} id the new id, if undefined a unique
     * variation if the id is created.
     * @param {Element | undefined} from_group a limiting group where to
     * look for references. This is useful if the elements of the group have
     * been added form another file and we need to change ids to avoid
     * conflicts
     * @return {Element} this
     */
    Element.prototype.setIdFollowRefs = function(id, from_group) {
      if (id instanceof Element) {
        from_group = id;
        id = undefined;
      }
      let orig = this.getId();

      if (!id) {
        let rand = String.rand || function() {
          let inc = 1;
          return () => {
            return String(inc++);
          };
        }();

        id = orig + '_' + rand(4);
        while (this.paper.selectAll('#' + id).length) {
          id = orig + '_' + rand(4);
        }
      }

      const references = this.getReferringToMe(from_group);
      this.attr('id', id);
      const type = this.type;
      references.forEach((ref) => {
        switch (type) {
          case 'clipPath': {
            const attr = 'url("#' + orig + '")';
            const new_attr = 'url("#' + id + '")';
            if (ref.attr('clip-path') === attr) {
              ref.attr('clip-path', new_attr);
            }
            if (ref.node.style.clipPath === attr) {
              ref.node.style.clipPath = new_attr;
            }
            break;
          }
          case 'mask': {
            const attr = 'url("#' + orig + '")';
            const new_attr = 'url("#' + id + '")';
            if (ref.attr('clip-path') === attr) {
              ref.attr('clip-path', new_attr);
            }
            if (ref.node.style.clipPath === attr) {
              ref.node.style.clipPath = new_attr;
            }
            break;
          }
          case 'pattern':
          case 'linearGradient':
          case 'radialGradient': {
            const attr = 'url("#' + orig + '")';
            const new_attr = 'url("#' + id + '")';
            const attr1 = ref.attr('fill');
            if (attr1 === attr) {
              ref.attr('fill', new_attr);
            }
            if (ref.node.style.fill === attr) {
              ref.node.style.fill = new_attr;
            }
            if (ref.attr('stroke') === attr) {
              ref.attr('stroke', new_attr);
            }
            if (ref.node.style.stroke === attr) {
              ref.node.style.stroke = new_attr;
            }
            if (ref.attr('href') === attr) {
              ref.attr('href', new_attr);
            }
            break;
          }
          case 'symbol':
          default: {
            const attr = '#' + orig;
            const new_attr = '#' + id;
            if (ref.attr('href') === attr) {
              ref.attr('href', new_attr);
            }
            if (ref.attr('xlink:href') === attr) {
              ref.attr('xlink:href', new_attr);
            }
          }
        }

      });

      return this;
    };

    Element.prototype.getTopSVG = function() {
      return Snap(this.paper.node);
    };

    /**
     * Gets all elements that use the five element as a reference.
     * This is useful mainly for clipPath, mask, pattern, gradients or symbol element,
     * however, it can be used with any other element for a <use> tag.
     * @param {Element | undefined} in_group optional group where to search
     * for reference.
     * @returns {Iterable} The element having the reference.
     */
    Element.prototype.getReferringToMe = function(in_group) {
      in_group = in_group || this.paper;
      const id = this.getId();
      switch (this.type) {
        case 'clipPath': {
          const css = '[clip-path="url(#' + id + ')"]';
          // + ','+ '[style*="clip-path: url(#' + id + ')"]'
          // + ','+ '[style*="clip-path:url(#' + id + ')"]';
          let found = in_group.selectAll(css);
          if (found.length === 0) {
            found = in_group.selectAll('[style*="clip-path:"]');
            found = found.filter((el) => {
              let cp_val = el.node.style.clipPath;
              if (cp_val) cp_val = cp_val.replace('url("#', '').
                  replace('")', '');
              return cp_val === id;
            });
          }
          return found;
        }
        case 'mask': {
          let found = in_group.selectAll(
              '[mask="url(#' + id + ')"]',
              // + ',' + '[style*="mask: url(#' + id + ')"]' + ',',
              // + '[style*="mask:url(#' + id + ')"]',
          );
          if (found.length === 0) {
            found = in_group.selectAll('[style*="mask:"]');
            found = found.filter((el) => {
              let cp_val = el.node.style.mask;
              if (cp_val) cp_val = cp_val.replace('url("#', '').
                  replace('")', '');
              return cp_val === id;
            });
          }
          return found;
        }
        case 'pattern':
        case 'linearGradient':
        case 'radialGradient': {
          let found = in_group.selectAll(
              '[fill="url(#' + id + ')"]'
              + ',' + '[href="url(#' + id + ')"]'
              + ',' + '[style*="fill: url(#' + id + ')"]'
              + ',' + '[style*="fill:url(#' + id + ')"]'
              + ',' + '[stroke="url(#' + id + ')"]'
              + ',' + '[style*="stroke: url(#' + id + ')"]'
              + ',' + '[style*="stroke:url(#' + id + ')"]',
          );
          return found;
        }
        case 'symbol':
        default: {
          const css = 'use[*|href="#' + id + '"]';
          let found = in_group.selectAll(css);
          return found;
        }
      }

    };

    Element.prototype.repositionInGroup = function(group) {
      if (group.type !== 'g') return;
      const diffMatrix = this.transform().diffMatrix;
      const gr_Matrix = group.transform().globalMatrix;
      const new_trans = diffMatrix.multLeft(gr_Matrix.invert());
      group.add(this);
      this.addTransform(new_trans);
    };

    Element.prototype.globalToLocal = function(globalPoint, coordTarget) {
      const globalToLocal = this.node.getTransformToElement(
          coordTarget.node).inverse();
      globalToLocal.e = globalToLocal.f = 0;
      return globalPoint.matrixTransform(globalToLocal);
    };

    Element.prototype.getCursorPoint = function(x, y, coordTarget) {
      const pt = this.paper.node.createSVGPoint();
      coordTarget = coordTarget || this;

      pt.x = x;
      pt.y = y;
      return pt.matrixTransform(coordTarget.node.getScreenCTM().inverse()); //paper
    };

    /**
     * Converts a screen distance to a distance in the local coord system of this element
     * @param {number} d the distance
     * @return {number}
     */
    function fromScreenDistance(d) {
      if (this.type !== 'svg' && this.type !== 'g') return this.parent().
          getFromScreenDistance(d);
      let pt = this.paper.node.createSVGPoint();

      pt.x = d;
      pt.y = 0;

      const matrix = this.node.getScreenCTM().inverse();
      matrix.e = 0;
      matrix.f = 0;

      pt = pt.matrixTransform(matrix);
      return (pt.y) ? Math.sqrt(pt.x * pt.x + pt.y * pt.y) : Math.abs(pt.x);
    }

    Element.prototype.getFromScreenDistance = fromScreenDistance;

    Element.prototype.isInRect = function(rect) {
      // var box = rect.node.getBBox(); //get a proper SVGRect element
      if (this.type == 'g') {
        const children = this.getChildren();
        let i = 0;
        const max = children.length;
        for (; i < max; ++i) {
          if (children[i].isInRect(rect)) return true;
        }
        return false;
      } else {
        // var node = el.paper.node;
        // var checkEnclosure = node.checkEnclosure(el.node, box);
        // var checkIntersection = node.checkIntersection(el.node, box);
        return this.isOverlapRect(rect);
      }
    };

    Element.prototype.getDirectionLine = function(sample) {
      if (!root.ss) return null;
      sample = sample || 100;
      let el = this;
      let line_slope_intersect = null;
      switch (this.type) {
        case 'polygon':
        case 'polyline':
        case 'path':
          const l = el.getTotalLength();
          const inc = l / sample;
          const points = [];
          for (let i = 0, d = 0, p; i < sample; ++i, d += inc) {
            p = el.getPointAtLength(d);
            let c = this.paper.circle(p.x, p.y, .3).
                attr({id: 'c' + i, fill: 'red'});
            points.push([p.x, p.y]);
          }

          line_slope_intersect = ss.linearRegression(points);

          if (isNaN(line_slope_intersect.m)
              || Math.abs(line_slope_intersect.m) === Infinity) {
            line_slope_intersect.m = 90;
            break;
          }

          line_slope_intersect.m = Snap.deg(
              Math.atan(line_slope_intersect.m));
          line_slope_intersect = [
            line_slope_intersect.m,
            line_slope_intersect.b];
          break;
        case 'ellipse':
          //todo
          break;
        case 'rect':
          //todo
        case 'g':
      }

      return line_slope_intersect;
    };

    Element.prototype.setCursor = function(cursorStyle, apply_to_children) {
      //todo: allow url.

      this.addClass('IA_Designer_Cursor_' + cursorStyle);

      // if (cursorStyle === 'inherit') {
      //     const parent = this.parent();
      //     if (parent)
      //         return this.setCursor(parent.node.style.cursor);
      // }
      //
      // if (cursorStyle) {
      //     this.node.style.cursor = cursorStyle;
      // } else {
      //     this.node.style.cursor = 'default';
      // }

      if (apply_to_children) {
        const children = this.getChildren();

        for (let i = 0; i < children.length; ++i) {
          children[i].setCursor(cursorStyle);
        }
      }

      return this;
    };

    Element.prototype.centerOfMass = function() {
      const cm = this.paper.node.createSVGPoint();
      if (this.attr('center_mass_x') !== null &&
          this.attr('center_mass_y') !== null) {
        cm.x = Number(this.attr('center_mass_x'));
        cm.y = Number(this.attr('center_mass_y'));
        // return cm;
        return this.getLocalMatrix(STRICT_MODE).apply(cm);
        // return this.data("center_mass");
      }
      const bBox = this.getBBox();
      cm.x = bBox.cx;
      cm.y = bBox.cy;

      // this.attr("center_mass_x", cm.x);
      // this.attr("center_mass_y", cm.y);
      //This is temporary, it should get the center from the object attributes and apply transform to it.
      return cm;
    };

    Element.prototype.centerRotation = function() {
      //todo: fix this
      return this.centerOfMass();
    };

    Element.prototype.setPartner = function(el_dom) {
      if (el_dom.paper || el_dom.translate) {
        const el_part = this.data('element_partner') || [];
        el_part.push(el_dom);
        this.data('element_partner', el_part);
      } else if (el_dom instanceof Element || global.jQuery || el_dom instanceof
          jQuery ||
          el_dom.css) {
        const dom_part = this.data('dom_partner') || [];
        if (el_dom instanceof Element) el_dom = jQuery(el_dom);
        dom_part.push(el_dom);
        this.data('dom_partner', dom_part);
      }
    };

    let old_remove = Element.prototype.remove;

    Element.prototype.remove = function(skip_linked) {
      if (!skip_linked && IA_Designer &&
          IA_Designer.class_defs.LINKED_RESOURCE) {
        let recourse_class = this.data(
            IA_Designer.class_defs.LINKED_RESOURCE) || [];
        if (!Array.isArray(
            recourse_class)) recourse_class = [recourse_class];

        if (this.isGroupLike()) {
          this.selectAll('.' + IA_Designer.class_defs.HAS_LINKED_RESOURCE).
              forEach(
                  (el) => recourse_class.push(
                      el.data(IA_Designer.class_defs.LINKED_RESOURCE)),
              );
        }
        if (recourse_class.length) {
          recourse_class.forEach(
              (class_name) => {
                if (class_name) {
                  let linked = this.paper.selectAll('.' + recourse_class);
                  if (linked.length) {
                    linked.forEach((el) => el.remove());
                  }
                }
              },
          );
        }
      }

      return old_remove.bind(this)();
    };

    Element.prototype.removePartner = function(el_type, remove_elements) {

      if (typeof el_type === 'boolean') {
        remove_elements = el_type;
        el_type = undefined;
      }
      if (!el_type) {
        this.removePartner('dom');
        this.removePartner('element');
      } else if (el_type === 'dom') {
        remove_elements && this.data('dom_partner') &&
        this.data('dom_partner').forEach((el) => el.remove());
        this.removeData('dom_partner');
      } else if (el_type === 'element') {
        remove_elements && this.data('element_partner') &&
        this.data('element_partner').forEach((el) => el.remove());
        this.removeData('element_partner');
      } else if (global.jQuery && el_type instanceof jQuery) {
        let dom_parts = this.data('dom_partner');
        if (dom_parts) {
          const jq_el = jQuery(el_type);
          const index = dom_parts.findIndex((el) => el[0] === jq_el[0]);
          if (index >= 0) {
            remove_elements && dom_parts[index].remove();
            dom_parts.splice(index, 1);
            if (!dom_parts.length) {
              this.removeData('dom_partner');
            }
          }
        }
      } else if (el_type instanceof Element) {
          let dom_parts = this.data('dom_partner');
          if (dom_parts) {
              const index = dom_parts.findIndex((el) => el === el_type);
              if (index >= 0) {
                  remove_elements && dom_parts[index].remove();
                  dom_parts.splice(index, 1);
                  if (!dom_parts.length) {
                      this.removeData('dom_partner');
                  }
              }
          }
      } else if (el_type.paper || el_type.remove) {
        let element_partner = this.data('element_partner');
        if (element_partner) {
          const index = element_partner.findIndex((el) => el === el_type);
          if (index >= 0) {
            remove_elements && element_partner[index].remove();
            element_partner.splice(index, 1);
            if (!element_partner.length) {
              this.removeData('element_partner');
            }
          }
        }
      }
    };

    Element.prototype.hasPartner = function() {
      return !!(this.data('dom_partner') || this.data('element_partner'));
    };

    Element.prototype.setPartnerStyle = function(style_obj) {
      let obj = {};
      if (style_obj.hasOwnProperty(
          'opacity')) obj.opacity = style_obj.opacity;
      if (style_obj.hasOwnProperty(
          'display')) obj.display = style_obj.display;
      let dom = this.data('dom_partner');
      dom && dom.forEach((e) => e.css(obj));
      let el = this.data('element_partner');
      el && el.forEach((e) => e.attr(obj));
    };

    Element.prototype.flatten = function() {
      if (!this.isGroupLike()) return;
      let children = this.getChildren();
      let after_el = this;
      let trans = this.getLocalMatrix();
      if (trans.isIdentity()) trans = undefined;
      for (let i = 0, l = children.length; i < l; ++i) {
        const child = children[i];
        if (trans) child.addTransform(trans);
        after_el.after(child);
        after_el = child;
      }
      this.remove();
    };

    Element.prototype.anchorEmbed = function(href, target) {
      let a = this.paper.a(href, target);
      this.after(a);
      a.add(this);
    };

    Element.prototype.localOnly = function(reverse) {
      this.attr({local: (reverse) ? '' : 1});
      return this;
    };

    Element.prototype.isLocal = function(node) {
      if (node) {
        if (node.tagName.toLowerCase() === 'svg') return false;
        return node.hasAttribute('local') ||
            (node.parentElement && this.isLocal(node.parentElement));
      }

      return this.node.hasAttribute('local') ||
          this.isLocal(this.node.parentElement);
    };

    Element.prototype.pathFirstPoint = function(x, y) { //Avoid setting the first point of a poly object
      const type = this.type;

      if (type !== 'path' && type !== 'polycurve' && type !==
          'polyline') return this;
      let points, regex, isPath, m, path;
      regex = /(M?\s*(-?\d*\.?\d+)[,|\s]+(-?\d*\.?\d+))(.+)/;
      isPath = (type == 'path');
      points = (isPath) ? this.attr('path') : this.attr('points');
      if ((m = regex.exec(points)) !== null) {
        if (x == undefined && y == undefined) { // A getter method.
          return {
            x: Number(m[2]),
            y: Number(m[3]),
          };
        } else { //set the first point
          if (typeof x == 'object') {
            y = x.y || x[1] || undefined;
            x = x.x || x[0] || undefined;
          }

          if (isPath) {
            path = 'M ' + x + ' ' + y + ' ' + m[4];
            this.attr('path', path);
          } else {
            path = x + ', ' + y + ' ' + m[4];
            this.attr('points', path);
          }
        }
      }
      return this;
    };

    Element.prototype.makePath = function() {
      if (this.isGroupLike() || this.type === 'path') return this;

      let path_str = Snap.path.toPath(this, true);

      const geom = this.getGeometryAttr(true);
      let attr_obj = {};
      geom.forEach((attr) => attr_obj[attr] = '');
      this.attr(attr_obj);
      this.attr({path: path_str});

      this.node.outerHTML = this.node.outerHTML.replace(this.type,
          'path data-temp="temp"');

      let node = document.querySelector('[data-temp="temp"]');

      this.node = node;
      this.attr('data-temp', '');

      this.type = 'path';

      return this;
    };

    Element.prototype.createClipPath = function(path, id) {
      const clipPath = this.clipPath();
      if (id) {
        clipPath.attr({id: id});
      } else {
        id = clipPath.getId();
      }
      this.before(clipPath);
      clipPath.add(path);
      this.attr('clip-path', 'url(#' + id + ')');
      return clipPath;
    };

    Element.prototype.createMask = function(path, id) {
      const mask = this.mask();
      if (id) {
        mask.attr({id: id});
      } else {
        id = mask.getId();
      }
      this.before(mask);
      mask.add(path);
      this.attr('mask', 'url(#' + id + ')');
      return mask;
    };

    Element.prototype.toPolyBezier = function() {
      return Snap.polyBezier(this.toBeziers());
    };

    Element.prototype.getFirstPoint = function(use_local_transform) {
      const type = this.type;
      let point;
      if (type === 'path' || type === 'polycurve' || type === 'polyline') {
        point = _.svgPoint(this.pathFirstPoint(), this);
      } else if (this.node.attributes.hasOwnProperty('x') &&
          this.node.attributes.hasOwnProperty('y')) {
        point = _.svgPoint(Number(this.attr('x')), Number(this.attr('y')),
            this);
      } else if (type === 'g') {
        const children = this.getChildren;
        const first = children()[0];
        let second;
        if (first.node.covpoly && children.length > 1 &&
            (second = children[1]).type === 'polygon') {
          point = second.getFirstPoint();
        } else {
          point = (first).getFirstPoint();
        }

      } else {
        const bBox = this.getBBox();
        point = _.svgPoint(bBox);
      }

      if (use_local_transform) {
        point = this.getLocalMatrix(STRICT_MODE).apply(point);
      }

      return point;
    };

    Element.prototype.setFirstPoint = function(x, y) {
      if (typeof x == 'object') {
        y = x.y || x[1] || undefined;
        x = x.x || x[0] || undefined;
      }

      if (this.type == 'path') { //If the path is not defined in relative coordinates the operation will modify the geometry
        this.pathFirstPoint(x, y);
      }

      if (this.node.attributes.hasOwnProperty('x') &&
          this.node.attributes.hasOwnProperty('y')) {
        this.attr({x: x, y: y});
      }

      if (this.node.attributes.hasOwnProperty('cx') &&
          this.node.attributes.hasOwnProperty('cy')) {
        this.attr({cx: x, cy: y});
      }

      return this;
    };

    Element.prototype.getLastPoint = function(use_local_transform) {
      let points = this.getControlPoints();
      let point = points[points.length - 1];
      if (use_local_transform) {
        point = this.getLocalMatrix(STRICT_MODE).apply(point);
      }
      point = _.svgPoint(point.x || point[0], point.y || point[1]);

      return point;
    };
    /**
     * Returns a map of the values of the list of attribute names
     * @param  attributes [array] the list of attribute names
     * @param  inverse [boolean] if true, it returns all attributes except the ones in the attribute list
     */
    Element.prototype.attrs = function(attributes, inverse) {
      const result = {};
      const handler = (attr) => {
        const value = this.attr(attr);
        if (value !== undefined) result[attr] = value;
      };
      if (!inverse) {
        if (attributes.forEach) {
          attributes.forEach(handler);
        } else {
          Object.keys(attributes).forEach(handler);
        }
      }
      if (inverse) {
        Array.from(this.node.attributes).forEach(function(attr) {
          attr = attr.nodeName;
          if ((attributes.indexOf && attributes.indexOf(attr) === -1) ||
              !attributes.hasOwnProperty(attr)) {
            handler(attr);
          }
        });
      }

      return result;
    };

    Element.prototype.getGeometryAttr = function(names_only) {
      const el = this;

      let attributes;
      switch (this.type) {
        case 'rect':
          attributes = ['x', 'y', 'width', 'height', 'rx', 'ry'];
          return names_only ? attributes : this.attrs(attributes);
        case 'ellipse':
          attributes = ['cx', 'cy', 'rx', 'ry'];
          return names_only ? attributes : this.attrs(attributes);
        case 'circle':
          attributes = ['cx', 'cy', 'r'];
          return names_only ? attributes : this.attrs(attributes);
        case 'line':
          attributes = ['x1', 'y1', 'x2', 'y2'];
          return names_only ? attributes : this.attrs(attributes);
        case 'path':
          attributes = ['d'];
          return names_only ? attributes : this.attrs(attributes);
        case 'polygon':
        case 'polyline':
          attributes = ['points'];
          return names_only ? attributes : this.attrs(attributes);
        case 'image':
        case 'use':
          attributes = ['x', 'y', 'width', 'height'];
          return names_only ? attributes : this.attrs(attributes);
        case 'text':
        case 'tspan':
          attributes = ['x', 'y', 'dx', 'dy'];
          return names_only ? attributes : this.attrs(attributes);
      }
      return [];
    };

    Element.prototype.getAttributes = function() {
      const ret = {};
      const attrMap = this.node.attributes;
      for (let i = 0, l = attrMap.length, name; i < l; ++i) {
        name = attrMap[i].name;
        ret[name] = (name !== 'style') ?
            attrMap[i].nodeValue :
            Snap.convertStyleFormat(attrMap[i].nodeValue);
      }

      return ret;
    };

    Element.prototype.transparentToMouse = function(remove = false, type) {
      if (remove) {
        this.attr('pointer-events', type || '');
      } else {
        this.attr('pointer-events', 'none');
      }
    };

    Element.prototype.isOverlapRect = function(rect) {
      return Snap.path.isPathOverlapRect(this, rect);
    };

    //Actions
    Element.prototype.move = function(el, mcontext, scontext, econtext) {
      if (el == undefined) {
        el = this;
      }
      let limits, coordTarget;
      if (mcontext) {
        if (mcontext.limits) {
          if (!scontext) scontext = {};
          scontext.limits = mcontext.limits;
        }
        if (mcontext.coordTarget) {
          coordTarget = mcontext.coordTarget;
        }
        if (mcontext.use_cache) {
          econtext = econtext || {};
          econtext.use_cache = true;
        }
      } else {
        coordTarget = el.paper;
      }

      const mv = _.move.bind(mcontext || {});
      const smv = _.startMove.bind(scontext || {});
      const emv = _.endMove.bind(econtext || {});

      return this.drag(function(dx, dy, x, y, ev) {
            ev.stopPropagation();
            mv(dx, dy, x, y, el, coordTarget, limits);
          }, function(x, y, ev) {
            ev.stopPropagation();
            smv(x, y, ev, el, select, coordTarget);
          }, function(ev) {
            ev.stopPropagation();
            emv(ev, el, select);
          }, mcontext, scontext, econtext,
      );
    };

    Element.prototype.revolve = function(
        center, coordTarget, mcontext, scontext, econtext) {

      if (center === undefined) {
        let bbox = el.getBBox();
        center = {x: bbox.cx, y: bbox.cy};
      }
      let limits,
          initial_angle = 0;
      if (mcontext) {
        if (mcontext.limits) {
          limits = mcontext.limits;
        }
        if (mcontext.coordTarget) {
          coordTarget = mcontext.coordTarget;
        }
        if (mcontext.initial) {
          if (!scontext) scontext = {};
          scontext.initial = mcontext.initial;
        }
      }
      coordTarget = coordTarget || el.paper;

      const el = this;

      const rev = _.revolve.bind(mcontext || {});
      const srev = _.startRevolve.bind(scontext || {});
      const erev = _.endRevolve.bind(econtext || {});

      return this.drag(function(dx, dy, x, y, ev) {
            ev.stopPropagation();
            rev(dx, dy, x, y, el, center, coordTarget);
          }, function(x, y, ev) {
            ev.stopPropagation();
            srev(x, y, ev, el, center, coordTarget, coordTarget);
          }, function(ev) {
            ev.stopPropagation();
            erev(ev, el, center, coordTarget);
          }, mcontext, scontext, econtext,
      );
    };

    //Helper Functions
    _.move = function(xxdx, xxdy, ax, ay, el, coordTarget) {
      // var tdx, tdy;
      if (coordTarget === undefined) {
        coordTarget = el.paper;
      }
      const cursorPoint = el.getCursorPoint(ax, ay, coordTarget);
      const pt = el.paper.node.createSVGPoint();

      pt.x = cursorPoint.x - el.data('op').x;
      pt.y = cursorPoint.y - el.data('op').y;

      const localPt = el.globalToLocal(pt, coordTarget),
          lim = el.data('relative_limit');

      if (lim) {
        if (lim.dim) {
          if (lim.dim == 'x') {
            localPt.y = 0;
          } else if (lim.dim == 'y') {
            localPt.x = 0;
          }
        }

        let dist, dist_lim;

        if (lim.max_y != undefined) {
          dist_lim = (lim.max_y instanceof Function) ?
              lim.max_y() :
              lim.max_y;
          localPt.y = Math.min(localPt.y, dist_lim);
        }

        if (lim.min_y != undefined) {
          dist_lim = (lim.bottom instanceof Function) ?
              lim.min_y() :
              lim.min_y;
          localPt.y = Math.max(localPt.y, dist_lim);
        }

        if (lim.min_x != undefined) {
          dist_lim = (lim.min_x instanceof Function) ?
              lim.min_x() :
              lim.min_x;
          localPt.x = Math.max(localPt.x, dist_lim);
        }

        if (lim.max_x != undefined) {
          dist_lim = (lim.max_x instanceof Function) ?
              lim.max_x() :
              lim.max_x;
          localPt.x = Math.min(localPt.x, dist_lim);
        }

        // console.log("Local point: " + localPt.y);
      }

      // el.transform(el.data('ot').toTransformString() + "t" + [localPt.x, localPt.y]);
      if (el.data('change_xy_attributes')) {
        const ox = el.data('ox');
        el.attr({
          x: localPt.x + ox,
          y: localPt.y + el.data('oy'),
        });
      } else {
        el.translate_glob(localPt.x, localPt.y, el.data('ot'));
        // el.rotate(.2*(Date.now() - el.data("t")), localPt.x + el.data('op').x, localPt.y + el.data('op').y)
      }

      eve(['drag', 'move', 'ongoing', el.id], el);
    };

    _.startMove = function(x, y, ev, el, select, coordTarget) {
      if (el.data('active')) return;
      // console.log("StartRotDrag in");
      el.data('active', true);
      el.data('s', true);
      el.data('t', Date.now());

      // el.data('ibb', el.getBBox());
      el.data('op', el.getCursorPoint(x, y, coordTarget));
      const localMatrix = el.getLocalMatrix(STRICT_MODE);
      el.data('ot', localMatrix);
      if (select) {
        eve(['drag', 'move', 'select', 'start'], el, [localMatrix]);
      } else {
        eve(['drag', 'move', 'start', el.id], el);
      }

      const limits = this.limits;
      if (limits) {
        let bbox;

        if (select) {
          bbox = select.getBBox();
        } else {
          bbox = el.getBBox();
        }

        const relative_limit = {};

        if (limits.min_x !== undefined) {
          relative_limit.min_x = (limits.min_x instanceof Function) ?
              (limits.min_x() - ((limits.center) ? bbox.cx : bbox.x))
              //     function () {
              //     return (limits.min_x()  - ((limits.center)? bbox.cx : bbox.x));
              // }
              : (limits.min_x - ((limits.center) ? bbox.cx : bbox.x));
        }

        if (limits.max_x !== undefined) {
          relative_limit.max_x = (limits.max_x instanceof Function) ?
              (limits.max_x() - ((limits.center) ? bbox.cx : bbox.x2))
              // function () {
              //     return (limits.max_x() - ((limits.center)? bbox.cx : bbox.x2));
              // }
              : (limits.max_x - ((limits.center) ? bbox.cx : bbox.x2));
        }

        if (limits.min_y !== undefined) {
          relative_limit.min_y = (limits.min_y instanceof Function) ?
              (limits.min_y() - ((limits.center) ? bbox.cy : bbox.y))
              // function () {
              //     return (limits.min_y() - ((limits.center)? bbox.cy : bbox.y));
              // }
              : (limits.min_y - ((limits.center) ? bbox.cy : bbox.y));
        }

        if (limits.max_y !== undefined) {
          relative_limit.max_y = (limits.max_y instanceof Function) ?
              (limits.max_y() - ((limits.center) ? bbox.cy : bbox.y2))
              // function () {
              //     return (limits.max_y() - ((limits.center)? bbox.cy : bbox.y2));
              // }
              : (limits.max_y - ((limits.center) ? bbox.cy : bbox.y2));
          // var maxY = limits.max_y  - ((limits.center) ? bbox.cy : bbox.y2);
          // relative_limit.max_y = maxY;
        }

        // console.log("Rel Limits: " + [relative_limit.min_y, relative_limit.max_y]);

        relative_limit.dim = limits.dim;
        relative_limit.snap_y = relative_limit.snap_y = function(val) {
          return val;
        };
        if (limits.snap) {
          if (Array.isArray(limits.snap)) {
            relative_limit.snap_y = relative_limit.snap_y = function(val) {
              return Snap.snapTo(limits.snap, val);
            };
          } else if (typeof limits.snap === 'object') {
            if (Array.isArray(limits.snap.x)) {
              relative_limit.snap_x = function(val) {
                return Snap.snapTo(limits.snap.x, val);
              };
            }
            if (Array.isArray(limits.snap.y)) {
              relative_limit.snap_y = function(val) {
                return Snap.snapTo(limits.snap.y, val);
              };
            }
          }
        }

        el.data('relative_limit', relative_limit);
      }

      if (el.data('change_xy_attributes')) {
        el.data('ox', Number(el.attr('x')));
        el.data('oy', Number(el.attr('y')));
      }
      el.data('s', false);
    };

    _.endMove = function(ev, el, select) {
      if (el.data('active')) {
        while (el.data('s') || (Date.now() - el.data('t') < 200)) {
        }
        if (this.use_cache) el.updateBBoxCache(undefined, true);
        if (select) {
          const cur_matrix = el.getLocalMatrix(STRICT_MODE);
          const old_matrix = el.data('ot');
          // el.updateBBoxCache(old_matrix.invert().multLeft(cur_matrix), true);
          eve(['drag', 'move', 'select', 'end'], el,
              [cur_matrix, old_matrix]);
        } else {
          eve(['drag', 'move', 'end', el.id], el);
        }
        el.data('active', false);
      }
    };

    _.revolve = function(dx, dy, ax, ay, el, center, coordTarget) {

      const limits = this.limits;
      const newPoint = el.getCursorPoint(ax, ay, coordTarget);
      const tcr = el.data('tcr');
      let d_angle = (Snap.angle(tcr.x, tcr.y, newPoint.x, newPoint.y) -
          90) - el.data('pointer_angle');
      const abs_angle = el.data('angle');
      let abs_angle_new = (abs_angle + d_angle === 360) ?
          360 :
          (abs_angle + d_angle + 360) % 360;
      let adjusted_new = abs_angle_new;
      if (limits) {
        let dist, angle_lim_min, angle_lim_max;
        angle_lim_min = (limits.min instanceof Function) ?
            limits.min() :
            limits.min;
        angle_lim_max = (limits.max instanceof Function) ?
            limits.max() :
            limits.max;

        const barrier = angle_lim_min + 360 === angle_lim_max;
        const rel_angle = (abs_angle_new - angle_lim_min === 360) ?
            360 :
            (abs_angle_new - angle_lim_min + 360) % 360;

        if (abs_angle_new > angle_lim_max ||
            (abs_angle_new < angle_lim_min && abs_angle_new + 360 >
                angle_lim_max)) {
          if (abs_angle_new > angle_lim_max) {
            // console.log("lim: ", abs_angle_new, angle_lim_max);
            abs_angle_new = (abs_angle_new - angle_lim_max < angle_lim_min -
                (abs_angle_new - 360)) ? angle_lim_max : angle_lim_min;

          } else {
            abs_angle_new = (angle_lim_min - abs_angle_new > abs_angle_new +
                360 - angle_lim_max) ? angle_lim_max : angle_lim_min;
            // console.log("lim2: ", abs_angle_new)
          }
          adjusted_new = rel_angle;
        } else if (barrier) {
          const last_rel = (el.data('last_angle')[0] - angle_lim_min ===
              360) ?
              360 :
              (el.data('last_angle')[0] - angle_lim_min + 360) % 360;
          // let diff = abs_angle_new - last;
          // if (diff > 180) {
          //     diff -= 360
          // } else if (diff < -180) {
          //     diff += 360
          // }

          // const decreasing = diff <= 0;
          // console.log(rel_angle, last_rel);
          if (rel_angle > 180 && last_rel < 10) {
            abs_angle_new = angle_lim_min;
            adjusted_new = 0;
          } else if (rel_angle < 180 && last_rel > 350) {
            abs_angle_new = angle_lim_max;
            adjusted_new = 360;
          } else {
            adjusted_new = rel_angle;
          }
        }

        d_angle = abs_angle_new - abs_angle;

      }

      el.rotate(d_angle, tcr.x, tcr.y, el.data('tot'));

      el.data('last_angle', [abs_angle_new, adjusted_new]);
      eve(['drag', 'revolve', 'ongoing', el.id], el, abs_angle_new,
          adjusted_new);
    };

    _.startRevolve = function(x, y, ev, el, center, coordTarget) {

      if (el.data('active')) return;
      // console.log("StartRotDrag in");
      el.data('active', true);
      el.data('s', true);
      el.data('t', Date.now());

      el.data('tcr', center);
      const op = el.getCursorPoint(x, y, coordTarget);

      el.data('op', op);
      const localMatrix = el.getLocalMatrix(STRICT_MODE);
      el.data('tot', localMatrix);
      const initial_angle = this.initial || 0;
      const angle_measure = round(
          localMatrix.split().rotate + initial_angle, 2); //Rounding to avoid numerical instability
      el.data('angle', (angle_measure + 360) % 360);
      el.data('last_angle', [(angle_measure + 360) % 360, undefined]);
      // const el_fp = el.getFirstPoint();
      const angle = Snap.angle(center.x, center.y, op.x, op.y) - 90;
      el.data('pointer_angle', angle);

      el.data('s', false);

      eve(['drag', 'revolve', 'start', el.id], el);

    };

    _.endRevolve = function(ev, el, center) {

      if (el.data('active')) {
        while (el.data('s') || (Date.now() - el.data('t') < 200)) {
        }
        el.data('active', false);
        eve(['drag', 'revolve', 'end', el.id], el, el.data('last_angle')[0],
            el.data('last_angle')[1]);
      }
    };

    _.svgPoint = function(x, y, node) {
      if (arguments.length === 1 && typeof x === 'object' &&
          x.hasOwnProperty('paper')) {
        node = x;
        x = undefined;
      }
      if (x === undefined && y === undefined) {
        x = y = 0;
      }
      if (typeof x == 'object') {
        y = x.y;
        x = x.x;
      }
      let pt = {};
      if (node) {
        pt = node.paper.node.createSVGPoint();
      }

      pt.x = x;
      pt.y = y;
      return pt;
    };

    Element.prototype.scale = function(
        x, y, cx, cy, prev_trans, use_cache) {
      if (typeof prev_trans === 'boolean') {
        use_cache = prev_trans;
        prev_trans = undefined;
      }
      if (prev_trans === undefined) {
        prev_trans = this.getLocalMatrix(STRICT_MODE);
      }
      if (prev_trans == 'id') {
        prev_trans = Snap.matrix();
      }
      //TODO processes input.

      const scale_matrix = Snap.matrix().scale(x, y, cx, cy);

      const matrix = prev_trans.clone().multLeft(scale_matrix);
      this.transform(matrix, use_cache, true);
      // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")));
      return this;

    };

    Element.prototype.translate = function(
        x, y, prev_trans, cx, cy, use_bbox_cache) {

      if (typeof cx === 'boolean') {
        use_bbox_cache = cx;
        cx = 0;
        cy = 0;
      } else if (isNaN(cx) || isNaN(cy)) {
        cx = 0;
        cy = 0;
      }
      // if (this.data("change_xy_attributes")) {
      //     this.attr({x: Number(this.attr('x')) + (x - cx),
      //     y: Number(this.attr('y')) + (y - cy)});
      //     return this;
      // }

      if (prev_trans === undefined) {
        prev_trans = this.getLocalMatrix(STRICT_MODE);
      }
      if (prev_trans == 'id') {
        prev_trans = Snap.matrix();
      }
      let trans_matrix;
      trans_matrix = Snap.matrix().translate(x - cx, y - cy);

      // const matrix = trans_matrix.multLeft(prev_trans);
      const matrix = prev_trans.clone().multLeft(trans_matrix);

      this.transform(matrix, use_bbox_cache, true); //The last parameter forces change of cache

      // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")))
      return this;

    };

    Element.prototype.translateAnimate = function(duration,
                                                  x, y, prev_trans, cx, cy,
                                                  use_bbox_cache) {

      let easing = mina.easeinout;
      if (Array.isArray(duration)) {
        easing = duration[1];
        duration = duration[0];
      }

      if (typeof cx === 'boolean') {
        use_bbox_cache = cx;
        cx = 0;
        cy = 0;
      } else if (isNaN(cx) || isNaN(cy)) {
        cx = 0;
        cy = 0;
      }

      if (prev_trans === undefined) {
        prev_trans = this.getLocalMatrix(STRICT_MODE);
      }
      if (prev_trans == 'id') {
        prev_trans = Snap.matrix();
      }
      let trans_matrix;
      trans_matrix = Snap.matrix().translate(x - cx, y - cy);

      // const matrix = trans_matrix.multLeft(prev_trans);
      const matrix = prev_trans.clone().multLeft(trans_matrix);

      let cache_function;
      if (use_bbox_cache) cache_function = () => this.transform(matrix,
          use_bbox_cache, true); //The last parameter forces change of cache

      this.animateTransform(matrix, duration, easing, cache_function);

      // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")))
      return this;

    };

    Element.prototype.translate_glob = function(
        x, y, prev_trans, cx, cy, use_cache) {

      if (typeof cx === 'boolean') {
        use_cache = cx;
        cx = 0;
        cy = 0;
      } else if (isNaN(cx) || isNaN(cy)) {
        cx = 0;
        cy = 0;
      }
      // if (this.data("change_xy_attributes")) {
      //     this.attr({x: Number(this.attr('x')) + (x - cx),
      //     y: Number(this.attr('y')) + (y - cy)});
      //     return this;
      // }

      if (prev_trans === undefined) {
        prev_trans = this.getLocalMatrix(STRICT_MODE);
      }
      if (prev_trans == 'id') {
        prev_trans = Snap.matrix();
      }
      let trans_matrix;
      trans_matrix = Snap.matrix().translate(x - cx, y - cy);

      const matrix = trans_matrix.multLeft(prev_trans);
      // const matrix = prev_trans.clone().multLeft(trans_matrix);

      this.transform(matrix, use_cache, true);
      // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")))
      return this;

    };

    Element.prototype.rotate = function(
        ang, cx, cy, prev_trans, use_cache) {
      if (typeof prev_trans === 'boolean') {
        use_cache = prev_trans;
        prev_trans = undefined;
      }
      if (prev_trans === undefined) {
        prev_trans = this.getLocalMatrix(STRICT_MODE);
      }

      if (prev_trans == 'id') {
        prev_trans = Snap.matrix();
      }
      // console.log("Mathrix 2: " + prev_trans.toString());
      const rot_matrix = Snap.matrix().rotate(ang, cx, cy);

      // const matrix = prev_trans.clone().multLeft(rot_matrix);
      const matrix = rot_matrix.multLeft(prev_trans);

      this.transform(matrix, use_cache);
      // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")))
      return this;
    };

    Element.prototype.reflect = function(
        direction, cx, cy, prev_trans, use_catch) {
      if (typeof prev_trans === 'boolean') {
        use_catch = prev_trans;
        prev_trans = undefined;
      }

      let bbox;
      if (cx == null) {
        bbox = this.getBBox();
        cx = bbox.cx;
      }
      if (cy == null) {
        bbox = bbox || this.getBBox();
        cy = bbox.cy;
      }

      if (direction === 'x' || direction === 'vertical') {
        return this.scale(1, -1, cx, cy, prev_trans, use_catch);
      }
      if (direction === 'y' || direction === 'horizontal') {
        return this.scale(-1, 1, cx, cy, prev_trans, use_catch);
      }
      if (typeof direction === 'number') { //angle
        return this.rotate(-direction, cx, cy, prev_trans, use_catch).
            reflect('x', cx, cy, use_catch).
            rotate(direction, cx, cy, use_catch);
      }
      if (typeof direction === 'object' && direction.type === 'line') {
        const line = direction;
        const x1 = Number(line.attr('x1'));
        const y1 = Number(line.attr('y1'));
        const x2 = Number(line.attr('x2'));
        const y2 = Number(line.attr('y2'));
        return this.reflect(Snap.angle(x1, y1, x2, y2), x1, x2, prev_trans,
            use_catch);
      }
    };

    Element.prototype.addTransform = function(matrix, prev_trans) {
      if (prev_trans === undefined) {
        prev_trans = this.getLocalMatrix(); // this.getLocalMatrix(STRICT_MODE);
      }

      matrix = prev_trans.clone().multLeft(matrix);
      this.transform(matrix);
      return this;
    };

    if (false) { //todo: finish convertion
      Element.prototype.ellipseTransform = function(m) {
        this.addTransform(m);
        m = this.getLocalMatrix();

        let new_center, m_noTrans, cosrot, sinrot, A, a_m_noTrans,
            determinant, angle, V, rx, ry, coeff, Q,
            invm,
            temp_val;

        // Drop the translation component of the transformation.

        //It remains to figure out what the new angle and radii must be.

        let split = m.split();

        m.translate(-split.dx, -split.dy);

        angle = Snap.rad(split.rotation);

        // Check the degenerate case where the transformation colapses the ellipse to line

        cosrot = Math.cos(this.angle);
        sinrot = Math.sin(this.angle);

        rx = +this.attr('rx');
        ry = +this.attr('ry');

        A = Snap.matrix( //moves the coord-system to match the ellipse dimensions and angle.

            rx * cosrot,  // The invere of this will map the ellipese (at origine) to the unit circle

            ry * sinrot,
            -ry * sinrot,
            ry * cosrot,
            0,
            0,
        );
        a_m_noTrans = A.multLeft(m);

        determinant = a_m_noTrans.determinant();
        //non-invertible transformation. Collapses the ellipse to a line

        if (Math.sqrt(Math.abs(determinant)) < 1e-5) {
          if (a_m_noTrans.a != 0) {
            angle = Math.atan2(a_m_noTrans[2], a_m_noTrans[0]);  //angle between x-axis and (a,c)

          } else {
            if (a_m_noTrans.get6V(1) != 0) {
              angle = atan2(a_m_noTrans.get6V(3), a_m_noTrans.get6V(1)); //angle between x-axis and (b,d)

            } else {
              angle = M_PI_2;
            }
          }
          V = new Point(Math.cos(angle), Math.sin(angle));
          a_m_noTrans.transform(V);
          rx = V.length();
          angle = atan2(V.y, V.x);

          this.center = new_center;
          this.radius_x = rx;
          this.radius_y = 0;
          this.setAngle(angle);
          return this;
        }

        //Now lets do the work for the non-degenerate case.

        //Move the to implicit form: Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0

        // We only care about A, B and C because they are the non-translational coefficients.

        coeff = this.implicitFormCoefficients();

        Q = new AffineTransformation([
          coeff[0],
          coeff[1] / 2,
          coeff[1] / 2,
          coeff[2],
          0,
          0,
        ]);

        //Get the inverse of the transformation. The new ellipse will be such that if its points are taken back (by the inverse)

        //the will fall on the original ellipse, i.e. they will satisfy the original equation.

        invm = m_noTrans.inverse();
        //C++ code        Q = invm * Q;

        Q = AffineTransformation.composeTransformations([Q, invm]);

        //C++ code:          swap(invm[1], invm[2]);

        temp_val = invm.get6V(1);
        invm.set6V(1, invm.get6V(2));
        invm.set6V(2, temp_val);
        Q = AffineTransformation.composeTransformations([invm, Q]);
        //C++ code           Ellipse e(Q[0], 2 * Q[1], Q[3], 0, 0, -1);

        this.setFromEquation(Q.get6V(0), 2 * Q.get6V(1), Q.get6V(3), 0, 0,
            -1);
        this.setCenter(new_center);

        return this;
      };
    }

    /**
     * Creates an array of all leafs in the dom tree of the element.
     * @param invisible if invisible elements should be included
     * @param {Array|undefined} _arr for the recursive process, but it can be used to pass an array where to store the element
     * @return {*|Array} an array of the element
     */
    Element.prototype.getLeafs = function(invisible, _arr) {
      _arr = _arr || [];
      if (this.type !== 'g') {
        _arr.push(this);
        return _arr;
      }

      this.getChildren(!invisible).
          forEach((ch) => ch.getLeafs(invisible, _arr));

      return _arr;
    };

    /**
     * Gets the chain of element parents, ending with this, but not including the top SVG element.
     * @param callback is callback provided, taking an element and the order from below as arguments (el,i),
     *  it will return the result of the collback, as in array.map.
     * @param include_top_sag if true, adds the top svg element as well
     * @return {*[]}
     */
    Element.prototype.getParentChain = function(
        callback, skip_current, toCoord, include_top_svg) {
      if (typeof callback !== 'function') {
        include_top_svg = toCoord;
        toCoord = skip_current;
        skip_current = callback;
        callback = undefined;
      }
      let parent = (skip_current && this.type !== 'svg') ?
          this.parent() :
          this;
      let i = 0;
      let ret = [];
      while (parent) {
        if (toCoord && parent.coordRoot) break;

        if (parent.type === 'svg' && !include_top_svg) break;

        if (callback) {
          ret.push(callback(parent, i));
        } else {
          ret.push(parent);
        }

        if (parent.type === 'svg') break;

        parent = parent.parent();
        ++i;

      }
      return ret.reverse();
    };

    Element.prototype.getCoordMatrix = function(strict, full) {
      strict = strict || STRICT_MODE;
      let parent_matrixes = this.getParentChain(
          (el) => el.getLocalMatrix(true), !full, true);
      parent_matrixes = parent_matrixes.filter((m) => !m.isIdentity());
      return Snap.matrix().multLeft(parent_matrixes);
    };

    Element.prototype.getRealBBox = function() {
      return this.getBBoxApprox({relative_coord: true});
    };

    Element.prototype.getRealBBoxExact = function() {
      return this.getBBoxExact({relative_coord: true});
    };

    /**
     * Pushes all transforms to the leafes of the group tree
     * @param exclude_attribute
     * @param _transform
     * @param full propagates the transform inside lines, paths, polygons and polylines
     */
    Element.prototype.propagateTransform = function(
        exclude_attribute, _transform, full) {
      if (typeof exclude_attribute === 'boolean') {
        full = exclude_attribute;
        exclude_attribute = undefined;
      }
      if (_transform) this.addTransform(_transform);
      //The transform should not be propagate if a clip or a mask is defined.
      // Otherwise, it will not be applied correctly.
      if (this.attr('clip-path') !== 'none' || this.attr('mask') !==
          'none') {
        let cp = this.attr('clip-path'), mk = this.attr('mask');
        return;
      }
      if (exclude_attribute && this.attr(exclude_attribute)) return;
      const local_transform = this.getLocalMatrix();
      const is_identity = local_transform.isIdentity();
      if (this.type === 'g') {
        if (!is_identity) {
          const units = this.data('units') ||
              {x: {x: 1, y: 0}, y: {x: 0, y: 1}};
          const u_x = local_transform.apply(units.x);
          const u_y = local_transform.apply(units.y);
          const origin = local_transform.apply({x: 0, y: 0});

          units.x = {x: u_x.x - origin.x, y: u_x.y - origin.y};
          units.y = {x: u_y.x - origin.x, y: u_y.y - origin.y};
          this.data('units', units);
        }
        if (!is_identity || full) {
          this.getChildren(/*true*/).forEach(function(el) {
            el.propagateTransform(exclude_attribute, local_transform, full);
          });
        }
        this.attr('transform', '');
      } else if (full && !is_identity) {
        if (this.type === 'path') {
          const original = this.attr('d');
          const d = Snap.path.map(original, local_transform);
          this.attr({'d': d, 'transform': ''});
          // console.log("Fixing", original, d, local_transform.toString());
        } else if (this.type === 'polygone' || this.type === 'polyline') {
          let points = this.attr('points');
          for (let i = 0, l = points.length(); i < l; ++i) {
            if (i % 2) {
              points[i / 2] = [+points[i]];
            } else {
              points[(i - 1) / 2].push(+points[i]);
            }
          }
          points.splice(Math.floor(points.length / 2));
          points = points.map((p) => local_transform.apply(p));
          this.attr({points: points});
          this.transform(Snap.matrix());

        } else if (this.type === 'line') {
          let p1 = local_transform.apply(
                  {x: +this.attr('x1'), y: +this.attr('y1')}),
              p2 = local_transform.apply(
                  {x: +this.attr('x2'), y: +this.attr('y2')});
          this.attr(
              {x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, transform: ''});
          this.transform(Snap.matrix());
        }
      }
      return this;
    };

    /**
     * Fits the element inside the bouding box.
     * @param {Element | Object} external_bBox The bounding box to fit. Must have width, height, cx and cy as properties. Or, it must be an element with getBBox method.
     * @param preserve_proportions, if true, preserve the original proportions of the element. In that case,
     * the object is centered in the smaller dimension.
     * @param {boolean} scale_down if true, only reduces the size of the object to fit in the box.
     * If the object is smaller, it is not scaled up. The object will still be centered in the box.
     */
    Element.prototype.fitInBox = function(
        external_bBox, preserve_proportions, scale_down) {
      if (external_bBox.paper) {
        // var matrix = external_bBox.getLocalMatrix();
        external_bBox = external_bBox.getBBox();
      }

      if (external_bBox.height && external_bBox.width) {
        let bBox = this.getBBox();

        let x_scale = external_bBox.width / bBox.width;
        let y_scale = external_bBox.height / bBox.height;

        if (preserve_proportions) {
          x_scale = y_scale = Math.min(x_scale, y_scale);
        }

        if (scale_down) {
          x_scale = Math.min(x_scale, 1);
          y_scale = Math.min(y_scale, 1);
        }

        this.scale(x_scale, y_scale, bBox.cx, bBox.cy);
        // this.translate( bBox.cx, bBox.cy, undefined, external_bBox.cx, external_bBox.cy);
        this.translate((external_bBox.cx - bBox.cx),
            (external_bBox.cy - bBox.cy));
      }
    };

    /**
     * Fills the element inside the bounding box, making it sufficiently large to fill the entire. The element
     * may stick out of the box.
     * @param {Element | Object} external_bBox The bounding box to fit. Must have width, height, cx and cy as properties. Or, it must be an element with getBBox method.
     * @param {boolean} scale_up if true, only increase the size of the object to fit in the box.
     * If the object is bigger, it is not scaled up. The object will still be centered in the box.
     */
    Element.prototype.fillInBox = function(external_bBox, scale_up) {
      if (external_bBox.paper) {
        // var matrix = external_bBox.getLocalMatrix();
        external_bBox = external_bBox.getBBox();
      }

      if (external_bBox.height && external_bBox.width) {
        let bBox = this.getBBox();

        let x_scale = external_bBox.width / bBox.width;
        let y_scale = external_bBox.height / bBox.height;

        x_scale = y_scale = Math.max(x_scale, y_scale);

        if (scale_up) {
          x_scale = Math.max(x_scale, 1);
          y_scale = Math.max(y_scale, 1);
        }

        this.scale(x_scale, y_scale, bBox.cx, bBox.cy);
        // this.translate( bBox.cx, bBox.cy, undefined, external_bBox.cx, external_bBox.cy);
        this.translate((external_bBox.cx - bBox.cx),
            (external_bBox.cy - bBox.cy));
      }
    };

    /**
     * Emulates an image fill of an element (that supports a fill attribute) by creating a group surrogate for the
     * object and overimposing it on a clipped image.
     * This overcomes some limitations is using a pattern as a fill.
     * @param image the image element, or an id of an image. The image can be used for only one fill. If the same
     * image must be used in multiple fills, use a patters instead, or clone.
     * @param fit_element whether to rescale the image to fit the element.
     * @param preserve_proportons whether to preserve proportions when fitting
     * @return {Element} returns the element surrogate group.
     */
    Element.prototype.fillImage = function(
        image, fit_element, preserve_proportons) {
      if (this.type === 'g') return this;

      //process image
      if (typeof image === 'string') {
        let topSVG = this.getTopSVG();
        const temp_im = topSVG.select('#' + image);
        if (!temp_im) return this;

        image = temp_im;
      }

      //create surrogate

      let id = this.getId();
      const group_placement = this.paper.g().attr({
        id: id,
        target_id: '_' + id,
        surrogate: 1,
        transform: this.getLocalMatrix(),
      });
      this.attr({id: '_' + id, transform: '', fill: 'none'});
      this.after(group_placement);

      const clip = this.paper.clipPath().attr({id: id + '_clip'});
      clip.add(this.clone());

      group_placement.add(clip);

      const clip_group = group_placement.g();
      clip_group.add(image);

      clip_group.attr({clipPath: 'url(#' + clip.getId() + ')'});

      if (fit_element) {
        if (preserve_proportons) {
          image.fillInBox(this.getBBox(true));
        } else {
          mage.fitInBox(this.getBBox(true));
        }

      }

      group_placement.add(this);
      return group_placement;

    };

    Element.prototype.isClockwise = function(other_points) {
      const points = other_points || this.getControlPoints();
      let sum = 0, nx, ny, px, py;
      for (let i = 0, l = points.length, p, n; i < l; ++i) {
        p = points[i];
        n = points[(i + 1) % l];
        nx = n[0] || n.x || 0;
        ny = n[1] || n.y || 0;
        px = p[0] || p.x || 0;
        py = p[1] || p.y || 0;
        sum += (nx - px) * (ny + py);
      }
      return sum >= 0;
    };

    Element.prototype.distanceTo = function(x, y) {
      if (typeof x === 'object' && x.x !== undefined && x.y !== undefined) {
        y = x.y;
        x = x.x;
      }

      switch (this.type) {
        case 'line':
          const x1 = this.attr('x1');
          const y1 = this.attr('y1');
          const x2 = this.attr('x2');
          const y2 = this.attr('y2');

          if ((x1 - x1) === 0 && (y1 - y2) === 0) {
            return Snap.len(x, y, x1, y1);
          }

          let angle = Math.abs(Snap.angle(x, y, x1, y1, x2, y2));
          angle = (angle < 180) ? angle : (360 - angle);
          if (angle > 90) {
            return Snap.len(x, y, x1, y1);
          }

          angle = Math.abs(Snap.angle(x, y, x2, y2, x1, y1));
          angle = (angle < 180) ? angle : (360 - angle);
          if (angle > 90) {
            return Snap.len(x, y, x2, y2);
          }

          const num = Math.abs(
              (y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
          const denum = Math.sqrt(
              Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

          return num / denum;

          //TODO: other cases
      }

      return null;

    };

    const style_reforamt = function(style, val) {
      switch (style) {
        case 'opacity':
          val = String(val);
          if (val.charAt(val.length - 1) === '%') {
            val = Number(val.substring(0, val.length - 1)) / 100;
          }
          break;
      }
      return val;
    };

    Element.prototype.setStyle = function(style, value) {
      if (!style) return this;
      let that = this; //we may need change the object to a surrogate;
      if (typeof style === 'string') {
        const isStyleAttribute = style.indexOf(':') === -1;
        if (isStyleAttribute) {
          const obj = {};
          obj[style] = value;
          style = obj;
        }

        if (!isStyleAttribute) {
          style = Snap.convertStyleFormat(style);
        }
      }

      if (typeof style === 'object') {
        for (let style_name in style) {
          if (style.hasOwnProperty(style_name)) {
            if (style_name === 'imageFill') {
              if (typeof style[style_name] === 'string') {
                that = that.fillImage(style[style_name], true, true);
              } else {
                const im_id = style[style_name]['id'];
                const fit = style[style_name]['fit'];
                const aspect = style[style_name]['preserveAspectRatio'];
                that = that.fillImage(im_id, fit, aspect);
              }
              continue;
            }
            // if (style[style_name] === "" || style[style_name] === undefined) {
            //     delete that.node.style[style];
            // } else
            {
              if (style_name === 'class') {
                const class_name = style[style_name];
                if (/-?[_a-zA-Z]+[_a-zA-Z0-9-]*/gm.test(class_name)) {
                  //is string is passed that does not generate a style, we assume that this is a class name instead
                  this.addClass(class_name);
                }
              } else {
                const stl = style_reforamt(style_name, style[style_name]) ||
                    '';
                if (that.type === 'jquery') {
                  that.node.each((_, el) => el.style[style_name] = stl);
                } else {
                  that.node.style[style_name] = stl;
                }
              }
            }

          }
        }
        if (this.hasPartner()) this.setPartnerStyle(style);
      }

      return that;
    };

    Element.prototype.getStyle = function(properties) {
      /*Explicit list of properties we get from computed style*/
      if (properties) {
        if (typeof properties === 'object' && !Array.isArray(properties)) {
          properties = Object.keys(properties);
        }
        let ret = {};
        const node = (this.type === 'jquery') ? this.node[0] : this.node;
        const comp_style = root.getComputedStyle(node);
        for (let i = 0, style, val; i < properties.length; ++i) {
          style = properties[i];
          val = comp_style[style];
          if (val !== undefined) {
            ret[style] = val;
          }
        }
        return ret;
      }

      let style = this.attr('style');
      let ret = {};

      if (style) {
        style = style.split(';');
        style.forEach((st) => {
          if (st) {
            let pair = st.split(':', 2);
            ret[[pair[0].trim()]] = (pair[1]) ? pair[1].trim() : '';
          }
        });
      }

      return ret;
    };

    const styles = {
      'alignment-baseline': true,
      'baseline-shift': true,
      'clip-path': true,
      'clip-rule': true,
      'color': true,
      'color-interpolation': true,
      'color-interpolation-filters': true,
      'color-rendering': true,
      'cursor': true,
      'direction': true,
      'display': true,
      'dominant-baseline': true,
      'fill': true,
      'fill-opacity': true,
      'fill-rule': true,
      'filter': true,
      'flood-color': true,
      'flood-opacity': true,
      'font-family': true,
      'font-size': true,
      'font-size-adjust': true,
      'font-stretch': true,
      'font-style': true,
      'font-variant': true,
      'font-weight': true,
      'glyph-orientation-horizontal': true,
      'glyph-orientation-vertical': true,
      'image-rendering': true,
      'letter-spacing': true,
      'lighting-color': true,
      'marker-end': true,
      'marker-mid': true,
      'marker-start': true,
      'mask': true,
      'opacity': true,
      'overflow': true,
      'paint-order': true,
      'pointer-events': true,
      'shape-rendering': true,
      'stop-color': true,
      'stop-opacity': true,
      'stroke': true,
      'stroke-dasharray': true,
      'stroke-dashoffset': true,
      'stroke-linecap': true,
      'stroke-linejoin': true,
      'stroke-miterlimit': true,
      'stroke-opacity': true,
      'stroke-width': true,
      'text-anchor': true,
      'text-decoration': true,
      'text-rendering': true,
      'unicode-bidi': true,
      'vector-effect': true,
      'visibility': true,
      'word-spacing': true,
      'writing-mode': true,
    };
    Element.prototype.moveAttrToStyle = function(recursive) {
      const attrs = this.getAttributes();
      let found = false;
      for (let attr in attrs) if (attrs.hasOwnProperty(attr)) {
        if (styles[attr]) {
          found = true;
          if (!attrs.style) {
            attrs.style = {};
          }
          attrs.style[attr] = attrs[attr];

          attrs[attr] = '';
        }
      }
      if (found) {
        const style = attrs.style;
        delete attrs.style;
        this.attr(attrs);
        this.setStyle(style);
        const st = this.attr('style');
        this.recordChange('style', 'attributes');
      }

      if (recursive && this.isGroupLike()) {
        this.getChildren().forEach((ch) => ch.moveAttrToStyle(recursive));
      }

      return this;
    };

    /**
     * May not change the attribute string. Should be used only for display
     * @param source
     */
    Element.prototype.copyComStyle = function(source) {
      const styles = root.getComputedStyle(source.node);
      if (styles.cssText !== '') {
        this.node.style.cssText = styles.cssText;
      } else {
        const cssText = Array.from(styles).reduce(
            (css, propertyName) =>
                `${css}${propertyName}:${styles.getPropertyValue(
                    propertyName,
                )};`,
        );

        this.node.style.cssText = cssText;
      }
      return this;
    };

    // Element.prototype.addClass = function (class_name) {
    //     if (this.node.classList) {
    //         this.node.classList.add(class_name);
    //     } else {
    //         let current_classes = this.node.className.split(" ");
    //         if (current_classes.indexOf(name) === -1) {
    //             this.node.className += " " + name;
    //         }
    //     }
    //     return this;
    // };

    Element.prototype.getBitmap = function(
        width, border, gui, callback, base64) {
      let height;
      let bbox;
      border = border || 0;
      if (width) {
        width = Math.min(width, gui.panelWidth * 2);
        bbox = this.getBBoxApprox();
        height = (bbox.height + 2 * border) *
            (width / (bbox.width + 2 * border));
        // console.log("ratios", width / height, bbox.width / bbox.height);
      }
      let disp = this.attr('display');
      this.attr({display: ''});
      let svg_data = gui._.svgEncapsulateBox(this, border, width, height,
          bbox);
      this.attr({display: disp});

      let canvas = document.createElement('canvas');

      // canvas_div.append(canvas);
      // canvas = canvas[0];
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');

      const img = new Image();

      let svg = new Blob([svg_data], {type: 'image/svg+xml'});
      const DOMURL = root.URL || root.webkitURL || root;
      const url = DOMURL.createObjectURL(svg);

      let time = performance.now();

      const that = this;
      img.addEventListener('load', function() {
        context.drawImage(img, 0, 0, width, height, 0, 0, width, height);
        // that.temp_image_canvas = canvas;
        DOMURL.revokeObjectURL(url);
        // console.log(performance.now() - time);
        let ret = (base64) ? canvas.toDataURL() :
            context.getImageData(0, 0, width, height);
        callback(ret);
        canvas.remove();
      });

      img.onerror = function() {
        console.log('problem with svg');
        console.log(svg_data);
        callback(null);
        canvas.remove();
      };

      img.src = url;

    };

    Element.prototype.getCanvasOverly = function(
        scale, width_pix, height_pix) {
      let scalex, scaley;
      scale = scale || 1;
      if (Array.isArray(scale) && scale.length === 2) {
        scalex = scale[0];
        scaley = scale[1];
      } else {
        scalex = scaley = scale;
      }

      // let bbox = this.getBBoxRot(this.transform().globalMatrix.split().rotate);
      let bbox = this.getBBox();
      // console.log("co", bbox, width_pix, height_pix, bbox.width / bbox.height, width_pix / height_pix);
      // this.after(bbox.rect(this.paper).attr({fill: "none", stroke: "black"}));
      width_pix = width_pix || bbox.width;
      height_pix = height_pix || bbox.height;

      const html = '<canvas id="' + this.getId() + '_canvas" ' +
          'width="' + width_pix + '" ' +
          'height="' + height_pix + '"></canvas>';
      const fo = this.htmlInsert(Snap.FORCE_AFTER, 0, 0, width_pix,
          height_pix, html);

      fo.fitInBox({
        width: bbox.width * scalex,
        height: bbox.height * scaley,
        cx: bbox.cx,
        cy: bbox.cy,
      }, true);

      let canvas = fo.select('canvas');
      canvas = canvas.node;

      return {container: fo, canvas: canvas};
    };

    /**
     * Creates a rastezied image of the element and places it in front ot the element.
     * @param gui
     * @param scale
     * @param border
     * @param remove
     * @returns {Promise<Element>} When created, the new image will be returned by the promise
     */
    Element.prototype.rasterize = function(gui, scale, border, remove) {
      scale = scale || 1;

      let that = this;
      border = border || 0;
      let bbox = this.getBBox();
      if (typeof border === 'string' &&
          border.endsWith('%')) border = Math.ceil(
          bbox.r2() * (+border.replace('%', '')) / 100);
      const promise = new Promise((resolve, reject) => {
        let make = function(base64) {
          let img = that.image(Snap.FORCE_AFTER, base64, bbox.x - border,
              bbox.y - border,
              bbox.width + 2 * border, bbox.height + 2 * border);
          img.attr({id: that.getId() + '_raster'});
          console.log(bbox, img.getBBox());
          if (remove) that.remove();
          resolve(img);
        };

        this.getBitmap(bbox.width * scale, border, gui, make, true);
      });

      return promise;
    };

    Element.prototype.isAbove = function(el) {
      return Snap.positionComparator(this, el) > 0;
    };

    Element.prototype.isBelow = function(el) {
      return Snap.positionComparator(el, this) > 0;
    };

    Element.prototype.isParentOf = function(el) {
      return !!(Snap._compareDomPosition(this, el) & 16);
    };

    Element.prototype.isChildOf = function(el) {
      return !!(Snap._compareDomPosition(this, el) & 8);
    };

    Element.prototype.selectParent = function(css_select) {
      if (this.type === 'svg') return null;

      if (typeof css_select === 'function') {
        if (css_select(this)) return this;
      } else {
        if (this.node.matches(css_select)) return this;
      }

      return this.parent().selectParent(css_select);
    };

    Element.prototype.getBBoxRot = function(angle, cx, cy, aprox) {
      if (typeof cx === 'boolean') {
        aprox = cx;
        cx = undefined;
      }
      angle = (angle + 360) % 180;
      if (angle < 1e-5) return (aprox) ?
          this.getBBoxApprox() :
          this.getBBoxExact();

      let bbox;
      if (cx == undefined) {
        bbox = this.getBBox();
        cx = bbox.cx;
        cy = bbox.cy;
      }
      if (typeof cx === 'object' && cx.x != undefined && cx.y !=
          undefined) {
        cy = cx.y;
        cx = cx.y;
      }

      const old_transform = this.getLocalMatrix(STRICT_MODE);
      this.rotate(-angle, cx, cy);
      bbox = (aprox) ? this.getBBoxApprox() : this.getBBoxExact();
      this.attr({transform: old_transform});

      return bbox;
    };

    Element.prototype.animateTransform = function(
        matrix, duration, easing, after_callback, easing_direct_matrix,
        procesor) {

      if (typeof after_callback === 'boolean') {
        procesor = easing_direct_matrix;
        easing_direct_matrix = after_callback;
        after_callback = undefined;
      }

      const dom_partner = this.data('dom_partner');
      const element_partner = this.data('element_partner');

      if (easing_direct_matrix) {
        console.log(easing_direct_matrix);
      }

      easing_direct_matrix = easing && easing_direct_matrix;

      // const fps = (IA_Designer && IA_Designer.is_safari) ? 24 : 30; //12
      // const ts = 1000 / fps; //time step;
      const loc = this.getLocalMatrix(true);
      const dif = {
        a: matrix.a - loc.a,
        b: matrix.b - loc.b,
        c: matrix.c - loc.c,
        d: matrix.d - loc.d,
        e: matrix.e - loc.e,
        f: matrix.f - loc.f,
      };

      if (easing_direct_matrix) {
        easing = easing(loc, matrix);
      }

      if (!duration) {
        console.log('Zero duration');
      }

      // const steps = Math.ceil(duration / ts) || 1;

      // let cur = 0;
      const that = this;
      let init_time;
      // let id = this.getId();
      const handler = function(time) {
        // console.log("anim", cur);

        if (init_time === undefined) init_time = time;

        let t = time - init_time;

        let done = false;
        if (t >= duration - 30) {
          t = duration;
          done = true;
        }

        t /= duration;

        let step_matrix;

        if (!done) {
          if (easing_direct_matrix) {
            step_matrix = easing(t).toString();
            // console.log(id, done, t, step_matrix);
          } else {
            if (easing) t = easing(t, loc, matrix);
            step_matrix = 'matrix('
                + (loc.a + dif.a * t) + ','
                + (loc.b + dif.b * t) + ','
                + (loc.c + dif.c * t) + ','
                + (loc.d + dif.d * t) + ','
                + (loc.e + dif.e * t) + ','
                + (loc.f + dif.f * t) + ')';
            // console.log(id, done, t, step_matrix);
          }
        } else {
          step_matrix = matrix.toString();
          // console.log(id, done, t, step_matrix);
        }

        if (isNaN(loc.a + dif.a * t)) {
          // console.log("problem", loc, dif, t);
        }

        if (!procesor) {
          // that.node.setAttribute("transform", step_matrix);
          // that.node.style.transform = step_matrix;
          that.node.setAttribute('transform', step_matrix);
          that.matrix = (done) ? matrix : undefined;
        } else {
          let processed_matrix = procesor(step_matrix);
          if (processed_matrix) {
            step_matrix = processed_matrix;
            that.node.setAttribute('transform', step_matrix);
            that.matrix = (done) ? matrix : undefined;
          }
        }

        if (dom_partner) dom_partner.forEach(
            (dom) => dom.css('transform', step_matrix));
        if (element_partner) element_partner.forEach((el) => {
          // el.node.setAttribute("transform", step_matrix);
          // el.node.style.transform = step_matrix;
          that.node.setAttribute('transform', step_matrix);
          el.matrix = (done) ? matrix : undefined;
        });

        if (done) {
          if (after_callback && typeof after_callback === 'function') {
            after_callback(that);
          }
        } else {
          requestAnimationFrame(handler);
        }

// console.log(new_time - time, ts);
// time = new_time;
      };
      // handler();
      //
      // let timer = setInterval(handler, ts);

      requestAnimationFrame(handler);

      // this.data("on_move", timer);

    };

    function val_generator(path, default_val) {
      let length, factor = 1, as_function = false;
      if (Array.isArray(path)) {
        factor = path[1] || 1;
        as_function = path[2] || false;
        path = path[0];
      }

      if (as_function) {
        const scp0 = path.getFirstPoint();
        const scp1 = path.getLastPoint();
        length = Math.abs(scp1.x - scp0.x);
        path = path.toPolyBezier();
      } else {
        length = (path.getTotalLength) ?
            path.getTotalLength() :
            path.length();
      }

      let fun = function(t) {
        let val = default_val;
        if (as_function) {
          const p0 = path.getFirstPoint();
          let x = p0.x + t * length;
          const interset = path.lineIntersects(
              [{x: x, y: -100000}, {x: x, y: 100000}]);
          if (interset.length) {
            let int_p = interset[0].curve.compute(interset[0].t);
            val = factor * int_p.y;
          } else {
            // if there if no intersect, nudge x a bit.
            let x_eps = (t === 0) ? x + 1e-5 : x - 1e-5;
            const interset = path.lineIntersects(
                [{x: x_eps, y: -100000}, {x: x_eps, y: 100000}]);
            if (interset.length) {
              let int_p = interset[0].curve.compute(interset[0].t);
              val = factor * int_p.y;
            }
          }
        } else {
          let p = path.getPointAtLength(length * t);
          val = factor * p.y;
        }
        return val;
      };

      return fun;
    }

    let _animateOnPath = function(el, absolute, path, duration, scale_path,
                                  rot_path,
                                  easing, after_callback) {
      if (typeof scale_path === 'function') {
        after_callback = easing;
        easing = scale_path;
        scale_path = undefined;
      }
      if (easing == null) {
        easing = mina.linear;
      }
      let init_time;
      // let id = el.getId();
      const p_length = (path.getTotalLength) ? path.getTotalLength() :
          path.length();
      const p0 = path.getFirstPoint(true);
      let p_last;

      let scale_fun, rot_fun;

      const bbox = el.getBBox();
      const initial_matrix = el.getLocalMatrix();

      if (scale_path) {
        if (absolute) {
          const split = initial_matrix.split();

          initial_matrix.multLeft(Snap.matrix().
              scale(1 / split.scalex, 1 / split.scaley, bbox.cx, bbox.cy));
        }
        scale_fun = (typeof scale_path === 'function') ?
            scale_path :
            val_generator(scale_path, 1);
      }

      if (rot_path) {
        if (absolute) {
          const split = initial_matrix.split();

          initial_matrix.multLeft(
              Snap.matrix().rotate(-split.rotate, bbox.cx, bbox.cy));
        }
        if (rot_path === true || !isNaN(rot_path)) {
          const angle_inc = (rot_path === true) ? 0 : rot_path;
          rot_fun = function(t, p, length) {
            if (p && Snap.is(p, 'Element')) {
              p = p.getPointAtLength(t * length);
            }
            if (p && p.hasOwnProperty('alpha')) {
              return p.alpha + 180 + angle_inc;
            }
            if (p && Snap.is(p, 'PolyBezier')) {

            }

          };
        } else {
          rot_fun = (typeof rot_path === 'function') ?
              rot_path :
              val_generator(rot_path, 0);
        }
      }

      if (absolute) initial_matrix.multLeft(
          Snap.matrix().translate(p0.x - bbox.cx, p0.y - bbox.cy));

      const center = (absolute) ? p0 : el.getBBox().center();

      const dom_partner = el.data('dom_partner');
      const element_partner = el.data('element_partner');

      const handler = function(time) {
        // console.log("anim", cur);

        if (init_time === undefined) init_time = time;

        let t = time - init_time;

        let done = false;
        if (t >= duration - 30) {
          t = duration;
          done = true;
        }

        t /= duration;

        t = easing(t);
        let extra = 0;
        if (t > 1) {
          extra = 1;
          t = 2 - t;// 1 - (t - 1)
        } else if (t < 0) {
          extra = -1;
          t = -t;
        }

        let pt = path.getPointAtLength(p_length * t);

        if (extra > 0) {
          p_last = p_last || path.getLastPoint(true);
          pt = {
            x: 2 * p_last.x - pt.x,
            y: 2 * p_last.y - pt.y,
            alpha: pt.alpha,
          };
        }

        if (extra < 0) {
          pt = {
            x: 2 * p0.x - pt.x,
            y: 2 * p0.y - pt.y,
            alpha: pt.alpha,
          };
        }

        let transl = Snap.matrix().translate(pt.x - p0.x, pt.y - p0.y);

        if (scale_fun) {
          let scale = scale_fun(t);

          const new_c = transl.apply(center);
          if (scale !== 1) {
            const trans_scl = Snap.matrix().
                scale(scale, scale, new_c.x, new_c.y);

            transl.multLeft(trans_scl);
          }
        }

        if (rot_fun) {
          let angle = rot_fun(t, pt);
          const new_c = transl.apply(center);
          if (angle !== 0) {
            const trans_rot = Snap.matrix().rotate(angle, new_c.x, new_c.y);

            transl.multLeft(trans_rot);
          }
        }

        const step_matrix = initial_matrix.clone().multLeft(transl);

        el.node.setAttribute('transform', step_matrix);
        el.matrix = (done) ? step_matrix : undefined;

        if (dom_partner) dom_partner.forEach(
            (dom) => dom.css('transform', step_matrix));
        if (element_partner) element_partner.forEach((el) => {
          // el.node.setAttribute("transform", step_matrix);
          // el.node.style.transform = step_matrix;
          el.node.setAttribute('transform', step_matrix);
          el.matrix = (done) ? step_matrix : undefined;
        });

        if (done) {
          if (after_callback && typeof after_callback === 'function') {
            after_callback(el);
          }
        } else {
          requestAnimationFrame(handler);
        }

      };

      requestAnimationFrame(handler);

    };
    Element.prototype.animateOnPath = function(path, duration, scale_path,
                                               rot_path,
                                               easing, after_callback) {
      _animateOnPath(this, false, path, duration, scale_path,
          rot_path,
          easing, after_callback);
    };

    Element.prototype.animateOnPathAbsolute = function(path, duration,
                                                       scale_path,
                                                       rot_path,
                                                       easing,
                                                       after_callback) {
      _animateOnPath(this, true, path, duration, scale_path,
          rot_path,
          easing, after_callback);
    };

    Element.prototype.jiggle = function(zoom_factor) {
      // return;

      zoom_factor = zoom_factor || 1;
      // var save_tras = this.attr("transform") || "";
      const el = this;
      if (this.data('jig')) return;
      this.data('jig', true);
      const old_trans = el.getLocalMatrix(STRICT_MODE);
      const jig = old_trans.clone();

      const x_disp = 1 / zoom_factor;
      const y_disp = 3 / zoom_factor;

      jig.e = old_trans.e - x_disp;
      jig.f = old_trans.f - y_disp;

      el.animate({transform: jig}, 50, mina.linear,
          function() {
            el.animate({transform: old_trans}, 50, mina.linear
                , function() {
                  el.data('jig', '');
                },
            );
          });

    };

    Element.prototype.forEach = function(callback, apply_to_root) {
      if (apply_to_root) callback(this);
      const children = this.getChildren();
      for (let i = 0, l = children.length; i < l; ++i) {
        children[i].forEach(callback, true);
      }
    };

    Element.prototype.g_a = function() {
      let args = Array.from(arguments);
      args.unshift(Snap.FORCE_AFTER);
      return this.g.apply(this, args);
    };

    Element.prototype.group = function() {
      let g = this.g_a();
      g.add(this);
      return g;
    };

  });
}(window || this));