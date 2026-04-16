const { merge } = require("webpack-merge");
const common = require("./webpack.common");

/**
 * UMD build — loaded via a CDN <script> tag in standalone web apps.
 * Exposes the library as window.MonarchNotifications.
 *
 * @pnp/sp is always external (nobody loads PnP from a CDN script tag).
 * Graph dependencies are NOT external — they are bundled into the UMD output
 * so the CDN consumer needs only this single file.
 *
 * Note: GraphAdapter uses raw fetch (no Graph SDK), so there are no
 * heavy SDK dependencies to bundle.
 */
module.exports = merge(common, {
  mode: "production",
  output: {
    filename: "monarch-notifications.umd.js",
    library: {
      name: "MonarchNotifications",
      type: "umd",
      umdNamedDefine: true,
    },
    // Safe globalObject for browsers, web workers, and SharePoint Online pages.
    // Webpack's default of `window` breaks in non-window contexts.
    globalObject: "typeof self !== 'undefined' ? self : this",
  },
  externals: {
    // PnP is always external — SPFx already has it; CDN consumers don't use it
    "@pnp/sp": {
      root: "pnp.sp",
      commonjs: "@pnp/sp",
      commonjs2: "@pnp/sp",
      amd: "@pnp/sp",
    },
    "@pnp/core": {
      root: "pnp.core",
      commonjs: "@pnp/core",
      commonjs2: "@pnp/core",
      amd: "@pnp/core",
    },
    // @microsoft/microsoft-graph-client is intentionally NOT listed here.
    // GraphAdapter uses raw fetch so there is nothing to bundle from the SDK.
  },
  devtool: "source-map",
  optimization: {
    minimize: true,
  },
});
