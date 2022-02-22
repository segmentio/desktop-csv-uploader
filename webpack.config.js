const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = [
    {
      mode: 'development',
      entry: './src/main.ts',
      target: 'electron-main',
      module: {
        rules: [{
          test: /\.ts$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }]
        }]
      },
      output: {
        path: __dirname + '/build',
        filename: 'main.js'
      }
    },
    {
      mode: 'development',
      entry: './src/utils/preload.ts',
      target: 'electron-preload',
      module: {
        rules: [{
          test: /\.ts$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }]
        }]
      },
      output: {
        path: __dirname + '/build/utils',
        filename: 'preload.js'
      }
    },
    {
      mode:'development',
      entry:'./src/uiWindow/index.ts',
      target: 'web', //https://gist.github.com/msafi/d1b8571aa921feaaa0f893ab24bb727b
      output:{
        filename:"uiWindow.js",
        path: __dirname + '/build'
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
          filename: 'uiWindow.html',
          template: './src/uiWindow.html',
        }),
      ]
    },
      {
        mode:'development',
        entry:'./src/importerWindow/index.ts',
        target: 'electron-renderer',
        output:{
          filename:"importerWindow.js",
          path: __dirname + '/build'
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
          extensions: ['.ts', '.js'],
        },
        plugins: [
          new NodePolyfillPlugin(),
          new HtmlWebpackPlugin({
            filename: 'importerWindow.html',
            template: './src/importerWindow.html',
          })
        ],
        devServer: {
          static: {
            directory: path.join(__dirname, '.src/templates/uiWindow')
          },
          compress: true,
          port: 9000,
        }}
]
