const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = [
    {
      mode:'development',
      entry:'./client',
      target: 'web', //https://gist.github.com/msafi/d1b8571aa921feaaa0f893ab24bb727b
      output:{
        filename:"index.js",
        path: __dirname + '/build/client'
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
          },
        ],
      },
      resolve: {
        extensions: ['.tsx', '.ts', '.js'],
      },
      plugins: [
        new NodePolyfillPlugin(),
        new HtmlWebpackPlugin({
          filename: 'index.html',
          template: './public/index.html',
        }),
      ]
    }
]
