// config/webpack.prod.js
const { merge } = require("webpack-merge");
const common = require("./webpack.common");
const path = require("path");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { GenerateSW } = require('workbox-webpack-plugin');

module.exports = merge(common, {
  mode: "production",
  devtool: "cheap-module-source-map",
  output: {
    filename: "[name].[contenthash].js",
    path: path.resolve(__dirname, "../dist"),
    publicPath: "./",
    clean: true,
  },
  module: {
    rules: [
      // 1. SCSS와 SASS 파일을 위한 규칙
      {
        test: /\.(sa|sc)ss$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
      // 2. CSS 파일만을 위한 규칙
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new GenerateSW({
      include: [/\.html$/, /\.js$/],
      maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
    }),
  ],
  optimization: {
    usedExports: true,
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: "all",
    },
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
});