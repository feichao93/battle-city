const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const moment = require('moment')
const packageInfo = require('./package.json')
const getDevConfig = require('./devConfig')

moment.locale('zh-cn')

function processDevConfig(config) {
  const result = {}
  for (const [key, value] of Object.entries(config)) {
    result[key] = JSON.stringify(value)
  }
  return result
}

module.exports = function(env = {}) {
  const prod = Boolean(env.prod)

  const plugins = [
    new webpack.DefinePlugin({
      COMPILE_VERSION: JSON.stringify(packageInfo.version),
      COMPILE_DATE: JSON.stringify(moment().format('YYYY-MM-DD HH:mm:ss')),
      // 将 devConfig.js 中的配置数据加入到 DefinePlugin 中
      ...processDevConfig(getDevConfig(!prod)),
    }),
    new HtmlWebpackPlugin({
      title: 'battle-city',
      filename: 'index.html',
      template: path.resolve(__dirname, 'app/index.tmpl.html'),
    }),
    !prod && new webpack.HotModuleReplacementPlugin(),
  ].filter(Boolean)

  return {
    mode: prod ? 'production' : 'development',
    devtool: prod ? false : 'source-map',
    context: __dirname,
    target: 'web',

    entry: path.resolve(__dirname, 'app/main.tsx'),

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: prod ? '[name]-[chunkhash:6].js' : '[name].js',
    },

    resolve: {
      modules: [path.resolve(__dirname, 'app'), 'node_modules'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },

    module: {
      rules: [
        { test: /\.json$/, type: 'javascript/auto', loader: 'json-loader' },
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                plugins: ['react-hot-loader/babel'],
              },
            },
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },

    plugins,

    devServer: {
      contentBase: __dirname,
      host: '0.0.0.0',
      hot: true,
    },
  }
}
