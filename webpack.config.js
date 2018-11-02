const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const packageInfo = require('./package.json')
const getDevConfig = require('./devConfig')

function getNow() {
  const d = new Date()
  const YYYY = d.getFullYear()
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const DD = String(d.getDate()).padStart(2, '0')
  const HH = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`
}

function processDevConfig(config) {
  const result = {}
  for (const [key, value] of Object.entries(config)) {
    result[key] = JSON.stringify(value)
  }
  return result
}

module.exports = function(env = {}, argv) {
  const prod = argv.mode === 'production'

  const plugins = [
    new webpack.DefinePlugin({
      COMPILE_VERSION: JSON.stringify(packageInfo.version),
      COMPILE_DATE: JSON.stringify(getNow()),
      // 将 devConfig.js 中的配置数据加入到 DefinePlugin 中
      ...processDevConfig(getDevConfig(!prod)),
    }),
    new HtmlWebpackPlugin({
      title: 'battle-city',
      filename: 'index.html',
      template: path.resolve(__dirname, `app/index.html`),
    }),
    !prod && new webpack.HotModuleReplacementPlugin(),
  ].filter(Boolean)

  return {
    context: __dirname,
    target: 'web',

    entry: [path.resolve(__dirname, 'app/main.tsx'), path.resolve(__dirname, 'app/polyfills.ts')],

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: prod ? '[name]-[chunkhash:6].js' : '[name].js',
    },

    resolve: {
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
      hot: true,
    },
  }
}
