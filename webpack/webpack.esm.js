const { merge } = require("webpack-merge");
const common = require("./webpack.common");

/**
 * ESM build — consumed by SPFx solutions and modern bundlers (Vite, Rollup, etc.)
 *
 * All peer dependencies are externalised so they are NOT bundled.
 * The SPFx / consumer project's own copy of @pnp/sp is used at runtime.
 */
module.exports = merge(common, {
  mode: "production",
  output: {
    filename: "monarch-notifications.esm.js",
    library: {
      type: "module",
    },
  },
  // Native ESM output requires this Webpack 5 experiment flag
  experiments: {
    outputModule: true,
  },
  externals: {
    "@pnp/sp": "@pnp/sp",
    "@pnp/core": "@pnp/core",
    // @microsoft/microsoft-graph-client is also externalised in the ESM build
    // because we use raw fetch in GraphAdapter — no SDK is needed at all.
    "@microsoft/microsoft-graph-client": "@microsoft/microsoft-graph-client",
  },
  devtool: "source-map",
  optimization: {
    minimize: true,
  },
});
