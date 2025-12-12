/**
 * Snap.svg Introspection Library
 *
 * A reusable library for extracting class hierarchies, methods, and metadata
 * from Snap.svg and related libraries (eve, mina).
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
        root.SnapIntrospection = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

    /**
     * Get all methods from an object's prototype chain
     * @param {Object} obj - The object to introspect
     * @returns {Array<string>} Sorted array of method names
     */
    function getAllMethods(obj) {
        const methods = [];
        let proto = obj;

        while (proto && proto !== Object.prototype) {
            Object.getOwnPropertyNames(proto).forEach(name => {
                if (name !== 'constructor' && typeof proto[name] === 'function') {
                    if (!methods.includes(name)) {
                        methods.push(name);
                    }
                }
            });
            proto = Object.getPrototypeOf(proto);
        }

        return methods.sort();
    }

    /**
     * Get all function properties from an object (non-recursive)
     * @param {Object} obj - The object to introspect
     * @returns {Array<string>} Sorted array of method names
     */
    function getObjectMethods(obj) {
        const methods = [];
        for (let key in obj) {
            if (typeof obj[key] === 'function') {
                methods.push(key);
            }
        }
        return methods.sort();
    }

    /**
     * Extract Snap object methods
     * @param {Object} Snap - The Snap.svg object
     * @returns {Object} Object containing method names and metadata
     */
    function extractSnapMethods(Snap) {
        if (!Snap) {
            return { methods: [], count: 0 };
        }

        const methods = getObjectMethods(Snap);
        return {
            methods: methods,
            count: methods.length
        };
    }

    /**
     * Extract eve global object methods
     * @param {Object} eve - The eve event library object
     * @returns {Object} Object containing method names and metadata
     */
    function extractEveMethods(eve) {
        if (!eve || typeof eve === 'undefined') {
            return { methods: [], count: 0 };
        }

        const methods = getObjectMethods(eve);
        return {
            methods: methods,
            count: methods.length
        };
    }

    /**
     * Extract mina animation library methods with easing detection
     * @param {Object} mina - The mina animation library object
     * @returns {Object} Object containing method names, easing functions, and metadata
     */
    function extractMinaMethods(mina) {
        if (!mina || typeof mina === 'undefined') {
            return { methods: [], easingMethods: [], count: 0, easingCount: 0 };
        }

        const methods = [];
        const easingMethods = [];

        for (let key in mina) {
            if (typeof mina[key] === 'function') {
                methods.push(key);

                // Check if it's an easing function
                if (typeof mina.isEasing === 'function' && mina.isEasing(key)) {
                    easingMethods.push(key);
                }
            }
        }

        methods.sort();
        easingMethods.sort();

        // Build method details
        const methodDetails = methods.map(method => {
            const isEasing = easingMethods.includes(method);
            const hasWithParams = mina[method] && typeof mina[method].withParams === 'function';

            return {
                name: method,
                isEasing: isEasing,
                hasWithParams: hasWithParams
            };
        });

        return {
            methods: methods,
            methodDetails: methodDetails,
            easingMethods: easingMethods,
            count: methods.length,
            easingCount: easingMethods.length
        };
    }

    /**
     * Extract all classes and their methods from Snap
     * @param {Object} Snap - The Snap.svg object
     * @returns {Object} Object containing class information and methods
     */
    function extractClasses(Snap) {
        if (!Snap || typeof Snap.getClass !== 'function') {
            return { classes: {}, classNames: [] };
        }

        const classes = Snap.getClass();
        if (!classes || typeof classes !== 'object') {
            return { classes: {}, classNames: [] };
        }

        const classNames = Object.keys(classes).sort();
        const classData = {};

        // Extract Paper methods for comparison
        const PaperClass = classes['paper'];
        const paperMethods = PaperClass && PaperClass.prototype
            ? getAllMethods(PaperClass.prototype)
            : [];

        classNames.forEach(className => {
            const ClassFunc = classes[className];
            const displayName = className.charAt(0).toUpperCase() + className.slice(1);

            if (ClassFunc && ClassFunc.prototype) {
                const methods = getAllMethods(ClassFunc.prototype);

                // Build method details with metadata
                const methodDetails = methods.map(method => {
                    const detail = {
                        name: method,
                        isFromPaper: false,
                        isElementSpecific: false
                    };

                    // Special handling for Element class
                    if (className.toLowerCase() === 'element') {
                        detail.isFromPaper = paperMethods.includes(method) && method !== 'animate';

                        if (method === 'animate_el') {
                            detail.isElementSpecific = true;
                            detail.note = 'Element version of Paper.animate()';
                        }
                    }

                    return detail;
                });

                classData[className] = {
                    name: className,
                    displayName: displayName,
                    methods: methods,
                    methodDetails: methodDetails,
                    count: methods.length,
                    hasPrototype: true
                };
            } else {
                classData[className] = {
                    name: className,
                    displayName: displayName,
                    methods: [],
                    methodDetails: [],
                    count: 0,
                    hasPrototype: false
                };
            }
        });

        return {
            classes: classData,
            classNames: classNames,
            paperMethods: paperMethods
        };
    }

    /**
     * Extract all navigation items (classes and globals)
     * @param {Object} Snap - The Snap.svg object
     * @param {Object} options - Options for navigation extraction
     * @param {boolean} options.includeSnap - Include Snap object
     * @param {boolean} options.includeEve - Include eve global
     * @param {boolean} options.includeMina - Include mina global
     * @returns {Array} Array of navigation items
     */
    function extractNavigation(Snap, options) {
        options = options || {};
        const navigation = [];

        if (options.includeSnap !== false) {
            navigation.push({ id: 'snap', name: 'Snap', isGlobal: false });
        }

        if (options.includeEve !== false && typeof eve !== 'undefined') {
            navigation.push({ id: 'eve', name: 'eve', isGlobal: true });
        }

        if (options.includeMina !== false && typeof mina !== 'undefined') {
            navigation.push({ id: 'mina', name: 'mina', isGlobal: true });
        }

        if (Snap && typeof Snap.getClass === 'function') {
            const classes = Snap.getClass();
            if (classes && typeof classes === 'object') {
                Object.keys(classes).sort().forEach(className => {
                    const displayName = className.charAt(0).toUpperCase() + className.slice(1);
                    navigation.push({
                        id: className,
                        name: displayName,
                        isGlobal: false,
                        isClass: true
                    });
                });
            }
        }

        return navigation;
    }

    /**
     * Extract complete introspection data
     * @param {Object} context - Context object with Snap, eve, mina
     * @returns {Object} Complete introspection data
     */
    function extractAll(context) {
        context = context || {};
        const Snap = context.Snap || (typeof window !== 'undefined' && window.Snap);
        const eve = context.eve || (typeof window !== 'undefined' && window.eve);
        const mina = context.mina || (typeof window !== 'undefined' && window.mina);

        return {
            snap: extractSnapMethods(Snap),
            eve: extractEveMethods(eve),
            mina: extractMinaMethods(mina),
            classes: extractClasses(Snap),
            navigation: extractNavigation(Snap, {
                includeSnap: true,
                includeEve: !!eve,
                includeMina: !!mina
            }),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Export as JSON
     * @param {Object} data - Introspection data
     * @returns {string} JSON string
     */
    function toJSON(data) {
        return JSON.stringify(data, null, 2);
    }

    /**
     * Export as plain object structure
     * @param {Object} context - Context object with Snap, eve, mina
     * @returns {Object} Plain object with all data
     */
    function toObject(context) {
        return extractAll(context);
    }

    // Public API
    return {
        // Low-level extraction functions
        getAllMethods: getAllMethods,
        getObjectMethods: getObjectMethods,
        extractSnapMethods: extractSnapMethods,
        extractEveMethods: extractEveMethods,
        extractMinaMethods: extractMinaMethods,
        extractClasses: extractClasses,
        extractNavigation: extractNavigation,

        // High-level functions
        extractAll: extractAll,
        toJSON: toJSON,
        toObject: toObject,

        // Version
        version: '1.0.0'
    };
}));

