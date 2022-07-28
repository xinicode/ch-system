const config = {
  resolve: {
    alias: {},
  },
  plugins: [],
};

if (process.env.npm_config_report) {
  const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
    .BundleAnalyzerPlugin;
  config.plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: "static",
    })
  );
}

module.exports = config;
