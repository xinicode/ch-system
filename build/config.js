module.exports = {
  "moduleDependencies": [],
  "moduleExcludes": [],
  "npmPacks": [
    "vue",
    "vue-router",
    "vuex",
    "axios",
    "dayjs",
    "lodash",
    "isarray",
    "crypto-js",
    "js-cookie",
    "path-to-regexp",
    "store2",
    "vue-i18n",
    "query-string",
    "vue-property-decorator",
    "vue-class-component",
    "@vue/composition-api"
  ],
  "port": 8080,
  "iviewLoaderOptions": {
    "prefix": false
  },
  "mock": [],
  "i18n": true,
  "markdown": true,
  "eslint": false,
  "distPath": "../dist",
  "modulePath": "../module",
  "moduleEntry": "../module/index.ts",
  "srcPath": "../src",
  "srcEntry": "../src/main.ts",
  "proxy": "./proxy.conf",
  "webpack": "./webpack.conf",
  "chainWebpack": "./chain.webpack"
}
