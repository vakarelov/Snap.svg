module.exports = {
    source: {
        include: ["src"],
    includePattern: ".js$",
    excludePattern: "(node_modules/|docs|dist|amd-banner\\.js|amd-footer\\.js)"
    },
    opts: {
        destination: "./doc/reference",
        template: "node_modules/docdash",
        readme: "README.md"
    },
    templates: {
        default: {
            staticFiles: { include: ["doc/static"] }
        },
        docdash: {
            search: false,
            sectionOrder: ["Classes", "Namespaces", "Mixins", "Members", "Methods"],
            collapse: true
        }
    }
};

