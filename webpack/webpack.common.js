const path = require("path");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
  entry: path.resolve(__dirname, "../src/index.ts"),
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: path.resolve(__dirname, "../tsconfig.build.json"),
            // transpileOnly delegates type checking to ForkTsCheckerWebpackPlugin,
            // which runs in a separate process and doesn't block the build
            transpileOnly: true,
          },
        },
      },
    ],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: path.resolve(__dirname, "../tsconfig.build.json"),
      },
    }),
  ],
  output: {
    path: path.resolve(__dirname, "../dist"),
    // clean: false — each config writes its own file; they must not wipe each other
    clean: false,
  },
};
