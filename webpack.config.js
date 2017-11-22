const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const MinifyPlugin = require("babel-minify-webpack-plugin")
const moment = require('moment')
const packageInfo = require('./package.json')

moment.locale('zh-cn')

// --env.prod --env.stories --env.editor
module.exports = function (env) {
  env = env || {}

  const isProduction = env.production

  const entry = {}
  entry.main = [
    'react-hot-loader/patch',
    __dirname + '/app/main.tsx'
  ]
  if (env.stories) {
    entry.stories = path.resolve(__dirname, 'app/stories.tsx')
  }
  if (env.editor) {
    entry.editor = path.resolve(__dirname, 'app/editor.tsx')
  }

  const plugins = []

  plugins.push(new webpack.DefinePlugin({
    COMPILE_VERSION: JSON.stringify(packageInfo.version),
    COMPILE_DATE: JSON.stringify(moment().format('YYYY-MM-DD HH:mm:ss')),
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    DEV: JSON.stringify(!isProduction),
  }))
  plugins.push(new HtmlWebpackPlugin({
    title: 'battle-city',
    filename: 'index.html',
    template: path.resolve(__dirname, 'app/index.tmpl.html'),
    chunks: ['commons', 'main'],
  }))
  if (env.stories) {
    plugins.push(new HtmlWebpackPlugin({
      title: 'stories',
      filename: 'stories.html',
      template: path.resolve(__dirname, 'app/index.tmpl.html'),
      chunks: ['commons', 'stories'],
    }))
  }
  if (env.editor) {
    plugins.push(new HtmlWebpackPlugin({
      title: 'editor',
      filename: 'editor.html',
      template: path.resolve(__dirname, 'app/index.tmpl.html'),
      chunks: ['commons', 'editor'],
    }))
  }

  if (!isProduction) {
    plugins.push(new webpack.HotModuleReplacementPlugin())
  } else {
    plugins.push(
      new webpack.optimize.CommonsChunkPlugin({
        name: 'commons',
        filename: 'commons.js',
      }),
      new ExtractTextPlugin('[name].css'),
      new MinifyPlugin(),
    )
  }

  return {
    context: __dirname,
    target: 'web',
    devtool: isProduction ? false : 'source-map',

    entry,

    output: {
      path: path.resolve(__dirname, 'build', packageInfo.version),
      filename: '[name].js',
    },

    resolve: {
      modules: [
        path.resolve(__dirname, 'app'),
        'node_modules',
      ],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [{
            loader: 'awesome-typescript-loader',
            options: {
              transpileOnly: true,
            },
          }],
          exclude: /node_modules/,
        },
      ].concat(isProduction ? [
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: 'css-loader',
          })
        },
      ] : [
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
          },
        ]),
    },

    plugins,

    devServer: {
      contentBase: __dirname,
      host: '0.0.0.0',
      hot: true,
    }
  }
}
