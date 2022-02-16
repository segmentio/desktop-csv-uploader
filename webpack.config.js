const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode:'development',
  entry: path.join(__dirname, 'src/main.ts'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'index.js'
  },
  devtool:'inline-source-map',
  resolve: {
    extensions:['.tsx','.ts','.js'],
    fallback:{
      "util": require.resolve("util/"),
      "path": false,
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'templates', 'uiWindow.html')
    })
  ]
};
