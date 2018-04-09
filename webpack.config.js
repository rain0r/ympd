const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  devtool: 'eval',
  entry: [
    './client/app.js',
  ],
  performance: {hints: false}
  ,
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
    }),
    new UglifyJsPlugin({
      parallel: true,
      uglifyOptions: {
        ecma: 8,
        keep_classnames: false,
      },
    }),
  ],
  output: {
    filename: 'ympd.js',
    path: path.resolve(__dirname, 'dist',),
  },
  target: 'web',
};