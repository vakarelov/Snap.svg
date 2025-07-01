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
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    const elproto = Element.prototype,
        has = "hasOwnProperty";
    // const supportsTouch = matchMedia('(hover: none)').matches;

    const supportsTouch = 'ontouchstart' in glob.win || (glob.win.navigator && navigator.maxTouchPoints > 0);

    const supportsPointer = false && !!glob.win.PointerEvent;
    Snap.supportsTouch = supportsTouch;
    Snap.poinertSupport = supportsPointer;
    const events = [
            "click", "dblclick", "mousedown", "mousemove", "mouseout", "mouseleave",
            "mouseover", "mouseenter", "mouseup", "touchstart", "touchmove", "touchend",
            "touchcancel"
        ],
        touchMap = {
            mousedown: "touchstart",
            mousemove: "touchmove",
            mouseup: "touchend"
        },
        pointerMap = {
            mousedown: 'pointerdown',
            mousemove: 'pointermove',
            mouseup: 'pointerup',
            mouseout: 'pointerout',
            mouseover: 'pointerover',
            mouseenter: 'pointerenter',
            mouseleave: 'pointerleave',
        },
        getScroll = function (xy, el) {
            const name = xy == "y" ? "scrollTop" : "scrollLeft",
                doc = el && el.node ? el.node.ownerDocument : Snap.document();
            return doc[name in doc.documentElement ? "documentElement" : "body"][name];
        },
        preventDefault = function () {
            this.returnValue = false;
        },
        preventTouch = function () {
            console.log("prevent touch");
            return this.originalEvent.preventDefault();
        },
        stopPropagation = function () {
            this.cancelBubble = true;
        },
        stopTouch = function () {
            return this.originalEvent.stopPropagation();
        },
        addEvent = function (obj, type, fn, element) {
            let realName = (supportsPointer && pointerMap[type])
                ? pointerMap[type] : (supportsTouch && touchMap[type] ? touchMap[type] : type);
            const snap = Snap(element);
            // console.log("add event", type, realName, snap && snap.id);
            const f = function (e) {
                // console.log(type, e.currentTarget.id);
                const scrollY = getScroll("y", element),
                    scrollX = getScroll("x", element);
                // if (supportsPointer && pointerMap[has](type)){
                //     //todo
                // }
                if (supportsTouch && touchMap[has](type)) {
                    for (let i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; ++i) {
                        if (e.targetTouches[i].target === obj || obj.contains(e.targetTouches[i].target)) {
                            const olde = e;
                            e = e.targetTouches[i];
                            e.originalEvent = olde;
                            e.preventDefault = preventTouch;
                            e.stopPropagation = stopTouch;
                            break;
                        }
                    }
                }
                const x = e.clientX + scrollX,
                    y = e.clientY + scrollY;
                const resutl = fn.call(element, e, x, y);
                // e.preventDefault();
                return resutl;
            };


            if (type !== realName) {
                const f_touch = function (e) {
                    // console.log(type, realName, e.currentTarget.id);
                    const scrollY = getScroll("y", element),
                        scrollX = getScroll("x", element);
                    for (let i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; ++i) {
                        if (e.targetTouches[i].target === obj || obj.contains(e.targetTouches[i].target)) {
                            const olde = e;
                            e = e.targetTouches[i];
                            e.originalEvent = olde;
                            e.preventDefault = preventTouch;
                            e.stopPropagation = stopTouch;
                            break;
                        }
                    }
                    const x = e.clientX + scrollX,
                        y = e.clientY + scrollY;
                    const result = fn.call(element, e, x, y);
                    // e.preventDefault();
                    return result;
                }
                // obj.addEventListener(type, f, false);
                obj.addEventListener(type, f_touch, false);
                // console.log("add touch event", type, realName);
            }

            obj.addEventListener(realName, f, false);

            return function () {
                // console.log("remove event", type, realName, snap && snap.id);

                if (type !== realName) {
                    obj.removeEventListener(type, f, false);
                }

                obj.removeEventListener(realName, f, false);

                return true;
            };
        };
    let drag = [];
    const dragMove = function (e) {
            let x = e.clientX,
                y = e.clientY;
            const scrollY = getScroll("y"),
                scrollX = getScroll("x");
            let dragi,
                j = drag.length;
            while (j--) {
                dragi = drag[j];
                if (supportsTouch) {
                    let i = e.touches && e.touches.length,
                        touch;
                    while (i--) {
                        touch = e.touches[i];
                        if (touch.identifier == dragi.el._drag.id || dragi.el.node.contains(touch.target)) {
                            x = touch.clientX;
                            y = touch.clientY;
                            (e.originalEvent ? e.originalEvent : e).preventDefault();
                            break;
                        }
                    }
                } else {
                    e.preventDefault();
                }
                const node = dragi.el.node;
                // let o;
                // const next = node.nextSibling,
                //     parent = node.parentNode,
                //     display = node.style.display;
                // glob.win.opera && parent.removeChild(node);
                // node.style.display = "none";
                // o = dragi.el.paper.getElementByPoint(x, y);
                // node.style.display = display;
                // glob.win.opera && (next ? parent.insertBefore(node, next) : parent.appendChild(node));
                // o && eve(["snap","drag","over",dragi.el.id], dragi.el, o);
                x += scrollX;
                y += scrollY;
                eve(["snap", "drag", "move", dragi.el.id], dragi.move_scope || dragi.el, x - dragi.el._drag.x, y - dragi.el._drag.y, x, y, e);
                // console.log("drag move", dragi.el.id, x, y);
            }
        },
        dragUp = function (e) {
            Snap.unmousemove(dragMove).unmouseup(dragUp);
            let i = drag.length,
                dragi;
            while (i--) {
                dragi = drag[i];
                dragi.el._drag = {};
                eve(["snap", "drag", "end", dragi.el.id], dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el, e);
                eve.off("snap.drag.*." + dragi.el.id);
            }
            drag = [];
        };
    /*\
     * Element.click
     [ method ]
     **
     * Adds a click event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unclick
     [ method ]
     **
     * Removes a click event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.dblclick
     [ method ]
     **
     * Adds a double click event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.undblclick
     [ method ]
     **
     * Removes a double click event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mousedown
     [ method ]
     **
     * Adds a mousedown event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousedown
     [ method ]
     **
     * Removes a mousedown event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mousemove
     [ method ]
     **
     * Adds a mousemove event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousemove
     [ method ]
     **
     * Removes a mousemove event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mouseout
     [ method ]
     **
     * Adds a mouseout event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseout
     [ method ]
     **
     * Removes a mouseout event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mouseover
     [ method ]
     **
     * Adds a mouseover event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseover
     [ method ]
     **
     * Removes a mouseover event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mouseup
     [ method ]
     **
     * Adds a mouseup event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseup
     [ method ]
     **
     * Removes a mouseup event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchstart
     [ method ]
     **
     * Adds a touchstart event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchstart
     [ method ]
     **
     * Removes a touchstart event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchmove
     [ method ]
     **
     * Adds a touchmove event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchmove
     [ method ]
     **
     * Removes a touchmove event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchend
     [ method ]
     **
     * Adds a touchend event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchend
     [ method ]
     **
     * Removes a touchend event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchcancel
     [ method ]
     **
     * Adds a touchcancel event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchcancel
     [ method ]
     **
     * Removes a touchcancel event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    for (var i = events.length; i--;) {
        (function (eventName) {
            Snap[eventName] = elproto[eventName] = function (fn, scope, data) {
                if (Snap.is(fn, "function")) {
                    this.events = this.events || [];
                    const remove_event_fun = addEvent(this.node || Snap.document(), eventName, fn, scope || this);
                    this.events.push({
                        name: eventName,
                        f: fn,
                        unbind: remove_event_fun,
                        scope: scope,
                        data: data
                    });
                } else {
                    let i = 0;
                    const ii = this.events.length;
                    for (; i < ii; ++i) if (this.events[i].name == eventName) {
                        try {
                            this.events[i].f.call(this);
                        } catch (e) {
                            eve("global.error", undefined, e, this.events[i].f);
                        }
                    }
                }
                return this;
            };
            Snap["un" + eventName] =
                elproto["un" + eventName] = function (fn) {
                    const events = this.events || [];
                    let l = events.length;
                    while (l--) if (events[l].name == eventName &&
                        (events[l].f == fn || !fn)) {
                        events[l].unbind();
                        events.splice(l, 1);
                        !events.length && delete this.events;
                        return this;
                    }
                    return this;
                };
        })(events[i]);
    }
    /*\
     * Element.hover
     [ method ]
     **
     * Adds hover event handlers to the element
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     - icontext (object) #optional context for hover in handler
     - ocontext (object) #optional context for hover out handler
     = (object) @Element
    \*/
    elproto.hover = function (f_in, f_out, scope_in, scope_out) {
        return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
    };
    /*\
     * Element.unhover
     [ method ]
     **
     * Removes hover event handlers from the element
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     = (object) @Element
    \*/
    elproto.unhover = function (f_in, f_out) {
        return this.unmouseover(f_in).unmouseout(f_out);
    };
    const draggable = [];
    // SIERRA unclear what _context_ refers to for starting, ending, moving the drag gesture.
    // SIERRA Element.drag(): _x position of the mouse_: Where are the x/y values offset from?
    // SIERRA Element.drag(): much of this member's doc appears to be duplicated for some reason.
    // SIERRA Unclear about this sentence: _Additionally following drag events will be triggered: drag.start.<id> on start, drag.end.<id> on end and drag.move.<id> on every move._ Is there a global _drag_ object to which you can assign handlers keyed by an element's ID?
    /*\
     * Element.drag
     [ method ]
     **
     * Adds event handlers for an element's drag gesture
     **
     - onmove (function) handler for moving
     - onstart (function) handler for drag start
     - onend (function) handler for drag end
     - mcontext (object) #optional context for moving handler
     - scontext (object) #optional context for drag start handler
     - econtext (object) #optional context for drag end handler
     * Additionaly following `drag` events are triggered: `drag.start.<id>` on start, 
     * `drag.end.<id>` on end and `drag.move.<id>` on every move. When element is dragged over another element 
     * `drag.over.<id>` fires as well.
     *
     * Start event and start handler are called in specified context or in context of the element with following parameters:
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * Move event and move handler are called in specified context or in context of the element with following parameters:
     o dx (number) shift by x from the start point
     o dy (number) shift by y from the start point
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * End event and end handler are called in specified context or in context of the element with following parameters:
     o event (object) DOM event object
     = (object) @Element
    \*/
    elproto.drag = function (onmove, onstart, onend, move_scope, start_scope, end_scope) {
        const el = this;
        if (!arguments.length) {
            let origTransform;
            return el.drag(function (dx, dy) {
                this.attr({
                    transform: origTransform + (origTransform ? "T" : "t") + [dx, dy]
                });
            }, function () {
                origTransform = this.transform().local;
            });
        }

        function start(e, x, y) {
            // (e.originalEvent || e).preventDefault();

            el._drag.x = x;
            el._drag.y = y;
            el._drag.id = e.identifier;
            !drag.length && Snap.mousemove(dragMove)
                .mouseup(dragUp);
            drag.push({el: el, move_scope: move_scope, start_scope: start_scope, end_scope: end_scope});
            onstart && eve.on("snap.drag.start." + el.id, onstart);
            onmove && eve.on("snap.drag.move." + el.id, onmove);
            onend && eve.on("snap.drag.end." + el.id, onend);
            eve(["snap", "drag", "start", el.id], start_scope || move_scope || el, x, y, e);
        }

       function init(e, x, y) {
            // Prevent execution if more than one button or finger is pressed
            if ((e.touches && e.touches.length > 1) || (e.buttons && e.buttons > 1)) {
                return;
            }
            eve(["drag", "init", el.id], el, e, x, y);
        }

        eve.on(["drag", "init", el.id], start);
        el._drag = {};
        draggable.push({el: el, start: start, init: init});
        el.mousedown(init, undefined, {
            type: "drag",
            params: [onmove, onstart, onend, move_scope, start_scope, end_scope]
        });
        return el;
    };
    /*
     * Element.onDragOver
     [ method ]
     **
     * Shortcut to assign event handler for `drag.over.<id>` event, where `id` is the element's `id` (see @Element.id)
     - f (function) handler for event, first argument would be the element you are dragging over
    \*/
    // elproto.onDragOver = function (f) {
    //     f ? eve.on("snap.drag.over." + this.id, f) : eve.unbind("snap.drag.over." + this.id);
    // };
    /*\
     * Element.undrag
     [ method ]
     **
     * Removes all drag event handlers from the given element
    \*/
    elproto.undrag = function () {
        let i = draggable.length;
        while (i--) if (draggable[i].el == this) {
            this.unmousedown(draggable[i].init);
            draggable.splice(i, 1);
            eve.unbind("drag.*." + this.id);
            eve.unbind("drag.init." + this.id);
        }
        !draggable.length && Snap.unmousemove(dragMove).unmouseup(dragUp);
        return this;
    };

    elproto.removeAllMouseListeners = function () {
        const events = this.events || [];
        let l = events.length;
        while (l--) {
            const event = events[l];
            this["un" + event.name] && this["un" + event.name](event.f)
        }

        this.undrag();
        this.unhover();
    }

    elproto.copyListeners = function (el, preserveScopes, skip_drag) {
        if (!el.events) return this;

        el.events.forEach((ev) => {
            if (ev.data && ev.data.type === "drag") {
                if (!skip_drag) this.drag.apply(this, ev.data.params)
            } else {
                this[ev.name](ev.f, (preserveScopes) ? ev.scope : undefined);
            }
        })
    }
});
