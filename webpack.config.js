const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const moment = require('moment')
const packageInfo = require('./package.json')

moment.locale('zh-cn')

const isProduction = process.env.NODE_ENV === 'production'

const commonPlugins = [
  new webpack.DefinePlugin({
    COMPILE_VERSION: JSON.stringify(packageInfo.version),
    COMPILE_DATE: JSON.stringify(moment().format('YYYY-MM-DD HH:mm:ss')),
  }),
  // default value of process.env.NODE_ENV is 'development'
  new webpack.EnvironmentPlugin({ NODE_ENV: 'development' }),
  new HtmlWebpackPlugin({
    title: 'battle-city',
    filename: 'index.html',
    template: path.resolve(__dirname, 'app/index.tmpl.html'),
    chunks: ['commons', 'main'],
  }),
  new HtmlWebpackPlugin({
    title: 'stories',
    filename: 'stories.html',
    template: path.resolve(__dirname, 'app/index.tmpl.html'),
    chunks: ['commons', 'stories'],
  }),
  new HtmlWebpackPlugin({
    title: 'editor',
    filename: 'editor.html',
    template: path.resolve(__dirname, 'app/index.tmpl.html'),
    chunks: ['commons', 'editor'],
  }),
]

const devPlugins = [
  new webpack.HotModuleReplacementPlugin(),
]

const productionPlugins = [
  new webpack.optimize.CommonsChunkPlugin({
    name: 'commons',
    filename: 'commons.js',
  }),
  new ExtractTextPlugin('[name].css'),
]

module.exports = {
  context: __dirname,
  target: 'web',
  devtool: isProduction ? false : 'source-map',

  entry: {
    main: [
      'react-hot-loader/patch',
      __dirname + '/app/main.tsx'
    ],
    stories: path.resolve(__dirname, 'app/stories.tsx'),
    editor: path.resolve(__dirname, 'app/editor.tsx'),
  },

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

  plugins: commonPlugins.concat(isProduction ? productionPlugins : devPlugins),

  devServer: {
    contentBase: __dirname,
    host: '0.0.0.0',
    hot: true,
  }
}
