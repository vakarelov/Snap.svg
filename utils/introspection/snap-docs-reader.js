/**
 * Snap.svg Documentation Reader
 *
 * Reads and queries JSDoc documentation from documentation.json
 * Works in browser and Node.js environments
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
        root.SnapDocsReader = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

    let docsData = null;
    let docsIndex = null;

    /**
     * Load documentation from JSON data or URL
     * @param {Object|string} data - Documentation JSON object or URL to fetch
     * @returns {Promise} Promise that resolves when documentation is loaded
     */
    function load(data) {
        if (typeof data === 'string') {
            // URL provided - fetch it
            return fetch(data)
                .then(response => response.json())
                .then(json => {
                    docsData = json;
                    buildIndex();
                    return docsData;
                });
        } else {
            // Data object provided
            docsData = data;
            buildIndex();
            return Promise.resolve(docsData);
        }
    }

    /**
     * Build index for faster lookups
     */
    function buildIndex() {
        docsIndex = {
            byName: {},
            byLongname: {},
            byKind: {},
            byMemberof: {}
        };

        if (!docsData) return;

        docsData.forEach((item, idx) => {
            // Index by name
            if (item.name) {
                if (!docsIndex.byName[item.name]) {
                    docsIndex.byName[item.name] = [];
                }
                if (Array.isArray(docsIndex.byName[item.name])) {
                    docsIndex.byName[item.name].push(idx);
                }
            }

            // Index by longname
            if (item.longname) {
                if (!docsIndex.byLongname[item.longname]) {
                    docsIndex.byLongname[item.longname] = [];
                }
                if (Array.isArray(docsIndex.byLongname[item.longname])) {
                    docsIndex.byLongname[item.longname].push(idx);
                }
            }

            // Index by kind
            if (item.kind) {
                if (!docsIndex.byKind[item.kind]) {
                    docsIndex.byKind[item.kind] = [];
                }
                if (Array.isArray(docsIndex.byKind[item.kind])) {
                    docsIndex.byKind[item.kind].push(idx);
                }
            }

            // Index by memberof
            if (item.memberof) {
                if (!docsIndex.byMemberof[item.memberof]) {
                    docsIndex.byMemberof[item.memberof] = [];
                }
                if (Array.isArray(docsIndex.byMemberof[item.memberof])) {
                    docsIndex.byMemberof[item.memberof].push(idx);
                }
            }
        });
    }

    /**
     * Find documentation by exact longname
     * @param {string} longname - The longname to search for (e.g., "Element#attr")
     * @returns {Object|null} Documentation object or null
     */
    function findByLongname(longname) {
        if (!docsIndex || !docsIndex.byLongname[longname]) {
            return null;
        }
        const idx = docsIndex.byLongname[longname][0];
        return docsData[idx];
    }

    /**
     * Find all items by name
     * @param {string} name - Name to search for
     * @returns {Array} Array of documentation objects
     */
    function findByName(name) {
        if (!docsIndex || !docsIndex.byName[name]) {
            return [];
        }
        return docsIndex.byName[name].map(idx => docsData[idx]);
    }

    /**
     * Find class documentation
     * @param {string} className - Class name (e.g., "Element", "Paper", "element", "paper")
     * @returns {Object|null} Class documentation or null
     */
    function findClass(className) {
        // Snap.getClass() returns lowercase names, but JSDoc uses proper case
        // Try both the provided name and capitalized version
        const capitalizedName = className.charAt(0).toUpperCase() + className.slice(1);
        const lowerName = className.toLowerCase();

        const namesToTry = [className, capitalizedName];
        if (className !== lowerName) {
            namesToTry.push(lowerName);
        }

        // Try various patterns with each name variant
        for (let name of namesToTry) {
            const patterns = [
                name,                           // "Element" or "element"
                'Snap.' + name,                 // "Snap.Element"
                name + '.prototype',            // "Element.prototype"
                'Snap.' + name + '.prototype',  // "Snap.Element.prototype"
                '<anonymous>~' + name           // "<anonymous>~Element"
            ];

            // Try exact longname matches
            for (let pattern of patterns) {
                let doc = findByLongname(pattern);
                if (doc && doc.kind === 'class') {
                    return doc;
                }
            }
        }

        // Search by name as fallback
        for (let name of namesToTry) {
            const results = findByName(name);
            for (let item of results) {
                if (item.kind === 'class') {
                    return item;
                }
            }
        }

        return null;
    }

    /**
     * Find method documentation for a class
     * @param {string} className - Class name (lowercase or capitalized)
     * @param {string} methodName - Method name
     * @returns {Object|null} Method documentation or null
     */
    function findMethod(className, methodName) {
        // Snap.getClass() returns lowercase names, but JSDoc uses proper case
        const capitalizedName = className.charAt(0).toUpperCase() + className.slice(1);
        const lowerName = className.toLowerCase();

        const namesToTry = [className, capitalizedName];
        if (className !== lowerName) {
            namesToTry.push(lowerName);
        }

        // Try various patterns with each name variant
        for (let name of namesToTry) {
            const patterns = [
                `${name}#${methodName}`,
                `${name}.prototype.${methodName}`,
                `${name}.${methodName}`,
                `Snap.${name}#${methodName}`,
                `Snap.${name}.prototype.${methodName}`,
                `Snap.${name}.${methodName}`,
                `<anonymous>~${name}#${methodName}`,
                `<anonymous>~${name}.prototype.${methodName}`
            ];

            for (let pattern of patterns) {
                const doc = findByLongname(pattern);
                if (doc) {
                    return doc;
                }
            }
        }

        // Search in class members as fallback
        const members = findClassMembers(className);
        for (let member of members) {
            if (member.name === methodName && member.kind === 'function') {
                return member;
            }
        }

        return null;
    }

    /**
     * Find all members of a class
     * @param {string} className - Class name (lowercase or capitalized)
     * @returns {Array} Array of member documentation objects
     */
    function findClassMembers(className) {
        if (!docsIndex) {
            return [];
        }

        // Snap.getClass() returns lowercase names, but JSDoc uses proper case
        const capitalizedName = className.charAt(0).toUpperCase() + className.slice(1);
        const lowerName = className.toLowerCase();

        const namesToTry = [className, capitalizedName];
        if (className !== lowerName) {
            namesToTry.push(lowerName);
        }

        const members = [];
        const seen = new Set();

        // Try various patterns with each name variant
        namesToTry.forEach(name => {
            const patterns = [
                name,                           // "Element" or "element"
                name + '.prototype',            // "Element.prototype"
                name + '#',                     // "Element#"
                'Snap.' + name,                 // "Snap.Element"
                'Snap.' + name + '.prototype',  // "Snap.Element.prototype"
                'Snap.' + name + '#',           // "Snap.Element#"
                '<anonymous>~' + name           // "<anonymous>~Element"
            ];

            patterns.forEach(pattern => {
                if (docsIndex.byMemberof[pattern]) {
                    docsIndex.byMemberof[pattern].forEach(idx => {
                        const item = docsData[idx];
                        if (!seen.has(item.longname)) {
                            members.push(item);
                            seen.add(item.longname);
                        }
                    });
                }
            });
        });

        return members;
    }

    /**
     * Find all methods of a class
     * @param {string} className - Class name
     * @returns {Array} Array of method documentation objects
     */
    function findClassMethods(className) {
        return findClassMembers(className).filter(item =>
            item.kind === 'function' && !item.undocumented
        );
    }

    /**
     * Extract method signature from documentation
     * @param {Object} doc - Documentation object
     * @returns {string} Method signature
     */
    function getSignature(doc) {
        if (!doc) return '';

        const name = doc.name || '';
        const params = doc.params || [];

        const paramStr = params.map(param => {
            let str = param.name || '';
            if (param.optional) {
                str = `[${str}]`;
            }
            if (param.type && param.type.names) {
                str += `: ${param.type.names.join('|')}`;
            }
            return str;
        }).join(', ');

        let returnType = '';
        if (doc.returns && doc.returns.length > 0) {
            const ret = doc.returns[0];
            if (ret.type && ret.type.names) {
                returnType = ` → ${ret.type.names.join('|')}`;
            }
        }

        return `${name}(${paramStr})${returnType}`;
    }

    /**
     * Get formatted documentation comment
     * @param {Object} doc - Documentation object
     * @returns {string} Formatted comment
     */
    function getComment(doc) {
        if (!doc) return '';
        return doc.comment || doc.description || '';
    }

    /**
     * Get description from documentation
     * @param {Object} doc - Documentation object
     * @returns {string} Description text
     */
    function getDescription(doc) {
        if (!doc) return '';
        return doc.description || '';
    }

    /**
     * Get parameters from documentation
     * @param {Object} doc - Documentation object
     * @returns {Array} Array of parameter objects
     */
    function getParams(doc) {
        if (!doc) return [];
        return doc.params || [];
    }

    /**
     * Get return information from documentation
     * @param {Object} doc - Documentation object
     * @returns {Object|null} Return information or null
     */
    function getReturns(doc) {
        if (!doc || !doc.returns || doc.returns.length === 0) {
            return null;
        }
        return doc.returns[0];
    }

    /**
     * Search documentation by text
     * @param {string} query - Search query
     * @returns {Array} Array of matching documentation objects
     */
    function search(query) {
        if (!docsData) return [];

        query = query.toLowerCase();
        return docsData.filter(item => {
            if (item.undocumented) return false;

            return (item.name && item.name.toLowerCase().includes(query)) ||
                   (item.longname && item.longname.toLowerCase().includes(query)) ||
                   (item.description && item.description.toLowerCase().includes(query)) ||
                   (item.comment && item.comment.toLowerCase().includes(query));
        });
    }

    /**
     * Get all documented classes
     * @returns {Array} Array of class documentation objects
     */
    function getAllClasses() {
        if (!docsIndex || !docsIndex.byKind['class']) {
            return [];
        }
        return docsIndex.byKind['class']
            .map(idx => docsData[idx])
            .filter(item => !item.undocumented);
    }

    /**
     * Check if documentation is loaded
     * @returns {boolean} True if loaded
     */
    function isLoaded() {
        return docsData !== null;
    }

    /**
     * Get raw documentation data
     * @returns {Array|null} Documentation data or null
     */
    function getRawData() {
        return docsData;
    }

    // Public API
    return {
        load: load,
        findByLongname: findByLongname,
        findByName: findByName,
        findClass: findClass,
        findMethod: findMethod,
        findClassMembers: findClassMembers,
        findClassMethods: findClassMethods,
        getSignature: getSignature,
        getComment: getComment,
        getDescription: getDescription,
        getParams: getParams,
        getReturns: getReturns,
        search: search,
        getAllClasses: getAllClasses,
        isLoaded: isLoaded,
        getRawData: getRawData,
        version: '1.0.0'
    };
}));

