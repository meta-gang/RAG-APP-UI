const { merge } = require("webpack-merge");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    open: false,
    hot: true,
    compress: true,
    port: 8080,
    historyApiFallback: true,
    liveReload: true,
  },
  output: {
    filename: "[name].[contenthash].js",
    publicPath: "/",
  },
  module: {
    rules: [
      // .scss와 .sass 파일을 위한 규칙
      {
        test: /\.(sa|sc)ss$/i,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
});