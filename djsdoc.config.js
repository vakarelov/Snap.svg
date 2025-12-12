module.exports = {
    source: {
        include: ["src"],
        includePattern: "\\.js$",
        excludePattern: "(node_modules/|docs|dist|amd-banner\\.js|amd-footer\\.js|esm-.*\\.js|src/node/\\.js)"
    },
    opts: {
        destination: "./doc/reference",
        template: "node_modules/docdash",
        readme: "README.md",
        recurse: true
    },
    plugins: ["plugins/markdown"],
    templates: {
        default: {
            staticFiles: { include: ["doc/static"] }
        },
        docdash: {
            search: true,
            sectionOrder: ["Classes", "Namespaces", "Mixins", "Members", "Methods"],
            collapse: true,
            wrap: true,
            typedefs: true,
            navType: "vertical"
        }
    },
    markdown: {
        parser: "gfm"
    }
};

