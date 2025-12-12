/**
 * Snap.svg Introspection HTML Renderer
 *
 * HTML rendering utilities for displaying Snap.svg introspection data.
 * Works with snap-introspection.js
 *
 * @version 1.0.0
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS
        module.exports = factory();
    } else {
        // Browser globals
        root.SnapIntrospectionRenderer = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

    /**
     * Default rendering options
     */
    const defaultOptions = {
        showNavigation: true,
        showSnap: true,
        showEve: true,
        showMina: true,
        showClasses: true,
        highlightFromPaper: true,
        highlightEasing: true
    };

    /**
     * Render navigation menu
     * @param {Array} navigationItems - Array of navigation items
     * @returns {string} HTML string
     */
    function renderNavigation(navigationItems) {
        if (!navigationItems || navigationItems.length === 0) {
            return '';
        }

        let html = '<div class="nav-menu">';
        html += '<h3>Quick Navigation</h3>';
        html += '<div class="nav-links">';

        navigationItems.forEach(item => {
            const cssClass = item.isGlobal ? 'global' : '';
            html += `<a href="#${item.id}" class="${cssClass}">${item.name}</a>`;
        });

        html += '</div>';
        html += '</div>';

        return html;
    }

    /**
     * Render Snap object methods section
     * @param {Object} snapData - Snap methods data
     * @returns {string} HTML string
     */
    function renderSnapMethods(snapData) {
        if (!snapData || !snapData.methods || snapData.methods.length === 0) {
            return '';
        }

        let html = '<div class="class-section snap-methods" id="snap">';
        html += '<h2>Snap Object Methods</h2>';
        html += `<p class="count">Total methods: ${snapData.count}</p>`;
        html += '<ul class="method-list">';

        snapData.methods.forEach(method => {
            html += `<li>Snap.${method}()</li>`;
        });

        html += '</ul>';
        html += '</div>';

        return html;
    }

    /**
     * Render eve methods section
     * @param {Object} eveData - Eve methods data
     * @returns {string} HTML string
     */
    function renderEveMethods(eveData) {
        if (!eveData || !eveData.methods || eveData.methods.length === 0) {
            return '';
        }

        let html = '<div class="class-section global-methods" id="eve">';
        html += '<h2>eve (Global Event Library)</h2>';
        html += `<p class="count">Total methods: ${eveData.count}</p>`;
        html += '<ul class="method-list">';

        eveData.methods.forEach(method => {
            html += `<li>eve.${method}()</li>`;
        });

        html += '</ul>';
        html += '</div>';

        return html;
    }

    /**
     * Render mina methods section
     * @param {Object} minaData - Mina methods data
     * @param {Object} options - Rendering options
     * @returns {string} HTML string
     */
    function renderMinaMethods(minaData, options) {
        if (!minaData || !minaData.methods || minaData.methods.length === 0) {
            return '';
        }

        options = options || {};
        const highlightEasing = options.highlightEasing !== false;

        let html = '<div class="class-section global-methods" id="mina">';
        html += '<h2>mina (Animation Library)</h2>';
        html += `<p class="count">Total methods: ${minaData.count}`;

        if (minaData.easingCount > 0) {
            html += ` (Easing functions: ${minaData.easingCount})`;
        }

        html += '</p>';
        html += '<ul class="method-list">';

        if (minaData.methodDetails) {
            minaData.methodDetails.forEach(detail => {
                if (highlightEasing && detail.isEasing) {
                    html += `<li><strong>mina.${detail.name}()</strong> <em style="color: #4CAF50;">[Easing]</em>`;
                    if (detail.hasWithParams) {
                        html += ' <em style="color: #FF9800;">[has .withParams()]</em>';
                    }
                    html += '</li>';
                } else {
                    html += `<li>mina.${detail.name}()</li>`;
                }
            });
        } else {
            minaData.methods.forEach(method => {
                html += `<li>mina.${method}()</li>`;
            });
        }

        html += '</ul>';
        html += '</div>';

        return html;
    }

    /**
     * Render a single class section
     * @param {Object} classData - Class data
     * @param {Object} options - Rendering options
     * @returns {string} HTML string
     */
    function renderClass(classData, options) {
        if (!classData) {
            return '';
        }

        options = options || {};
        const highlightFromPaper = options.highlightFromPaper !== false;

        let html = `<div class="class-section" id="${classData.name}">`;
        html += `<h2>Class: ${classData.displayName}</h2>`;

        if (!classData.hasPrototype) {
            html += '<p>No prototype available for this class.</p>';
            html += '</div>';
            return html;
        }

        html += `<p class="count">Total methods: ${classData.count}</p>`;

        if (classData.methods.length === 0) {
            html += '<p>No methods found in prototype.</p>';
            html += '</div>';
            return html;
        }

        html += '<ul class="method-list">';

        if (classData.methodDetails) {
            classData.methodDetails.forEach(detail => {
                const isElement = classData.name.toLowerCase() === 'element';

                if (isElement && highlightFromPaper) {
                    if (detail.isElementSpecific) {
                        html += `<li><strong>${classData.displayName}.prototype.${detail.name}()</strong> `;
                        html += `<em style="color: #FF5722;">[${detail.note}]</em></li>`;
                    } else if (detail.isFromPaper) {
                        html += `<li><strong>${classData.displayName}.prototype.${detail.name}()</strong> `;
                        html += '<em style="color: #4CAF50;">[from Paper]</em></li>';
                    } else {
                        html += `<li>${classData.displayName}.prototype.${detail.name}()</li>`;
                    }
                } else {
                    html += `<li>${classData.displayName}.prototype.${detail.name}()</li>`;
                }
            });
        } else {
            classData.methods.forEach(method => {
                html += `<li>${classData.displayName}.prototype.${method}()</li>`;
            });
        }

        html += '</ul>';
        html += '</div>';

        return html;
    }

    /**
     * Render all classes
     * @param {Object} classesData - Classes data from introspection
     * @param {Object} options - Rendering options
     * @returns {string} HTML string
     */
    function renderClasses(classesData, options) {
        if (!classesData || !classesData.classNames || classesData.classNames.length === 0) {
            return '<p>No classes found or Snap.getClass() returned unexpected value.</p>';
        }

        options = options || {};
        let html = '';

        classesData.classNames.forEach(className => {
            const classData = classesData.classes[className];
            html += renderClass(classData, options);
        });

        return html;
    }

    /**
     * Render complete introspection data
     * @param {Object} data - Complete introspection data
     * @param {Object} options - Rendering options
     * @returns {string} Complete HTML string
     */
    function renderAll(data, options) {
        options = Object.assign({}, defaultOptions, options || {});
        let html = '';

        // Navigation
        if (options.showNavigation && data.navigation) {
            html += renderNavigation(data.navigation);
        }

        // Snap methods
        if (options.showSnap && data.snap) {
            html += renderSnapMethods(data.snap);
        }

        // Eve methods
        if (options.showEve && data.eve && data.eve.count > 0) {
            html += renderEveMethods(data.eve);
        }

        // Mina methods
        if (options.showMina && data.mina && data.mina.count > 0) {
            html += renderMinaMethods(data.mina, options);
        }

        // Classes
        if (options.showClasses && data.classes) {
            html += renderClasses(data.classes, options);
        }

        return html;
    }

    /**
     * Render to DOM element
     * @param {HTMLElement|string} target - Target element or selector
     * @param {Object} data - Introspection data
     * @param {Object} options - Rendering options
     */
    function renderToElement(target, data, options) {
        const element = typeof target === 'string'
            ? document.querySelector(target)
            : target;

        if (!element) {
            throw new Error('Target element not found');
        }

        const html = renderAll(data, options);
        element.innerHTML = html;
    }

    /**
     * Render error message
     * @param {Error} error - Error object
     * @returns {string} HTML string
     */
    function renderError(error) {
        return `
            <div class="class-section" style="background-color: #ffebee; border-left: 5px solid #f44336;">
                <h2>Error</h2>
                <p>An error occurred while loading classes and methods:</p>
                <pre>${error.message}</pre>
            </div>
        `;
    }

    // Public API
    return {
        // Individual renderers
        renderNavigation: renderNavigation,
        renderSnapMethods: renderSnapMethods,
        renderEveMethods: renderEveMethods,
        renderMinaMethods: renderMinaMethods,
        renderClass: renderClass,
        renderClasses: renderClasses,

        // Complete rendering
        renderAll: renderAll,
        renderToElement: renderToElement,
        renderError: renderError,

        // Default options
        defaultOptions: defaultOptions,

        // Version
        version: '1.0.0'
    };
}));

