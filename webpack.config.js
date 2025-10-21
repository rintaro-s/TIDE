const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const webpack = require('webpack');

const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: './src/renderer/index.tsx',
  target: 'electron-renderer',
  devtool: isDev ? 'source-map' : false,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.renderer.json',
            transpileOnly: true  // 型チェックをスキップして高速化
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.ttf$/,
        type: 'asset/resource'
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
    fallback: {
      "path": false,
      "fs": false,
      "global": false
    }
  },
  output: {
    filename: 'renderer.js',
    path: path.resolve(__dirname, 'dist/renderer'),
    clean: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      'global': 'window',
    }),
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
    new MonacoWebpackPlugin({
      languages: ['cpp', 'c', 'markdown', 'json', 'ini', 'plaintext'],
      features: ['coreCommands', 'find']
    })
  ],
  devServer: {
    port: 3000,
    hot: true,
    static: {
      directory: path.join(__dirname, 'dist/renderer'),
    },
  },
};