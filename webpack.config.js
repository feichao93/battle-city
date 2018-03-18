const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
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

// --env.prod --env.stories --env.editor
module.exports = function(env) {
  env = env || {}

  const prod = env.production

  const entry = {}
  entry.main = ['react-hot-loader/patch', __dirname + '/app/main.tsx']
  if (env.stories) {
    entry.stories = path.resolve(__dirname, 'app/stories.tsx')
  }
  if (env.editor) {
    entry.editor = path.resolve(__dirname, 'app/editor.tsx')
  }

  const plugins = []

  plugins.push(
    new webpack.DefinePlugin({
      COMPILE_VERSION: JSON.stringify(packageInfo.version),
      COMPILE_DATE: JSON.stringify(moment().format('YYYY-MM-DD HH:mm:ss')),
      'process.env.NODE_ENV': JSON.stringify(prod ? 'production' : 'development'),
      // 将 devConfig.js 中的配置数据加入到 DefinePlugin 中
      ...processDevConfig(getDevConfig(prod)),
    }),
  )
  plugins.push(
    new HtmlWebpackPlugin({
      title: 'battle-city',
      filename: 'index.html',
      template: path.resolve(__dirname, 'app/index.tmpl.html'),
      chunks: ['commons', 'main'],
    }),
  )
  if (env.stories) {
    plugins.push(
      new HtmlWebpackPlugin({
        title: 'stories',
        filename: 'stories.html',
        template: path.resolve(__dirname, 'app/index.tmpl.html'),
        chunks: ['commons', 'stories'],
      }),
    )
  }
  if (env.editor) {
    plugins.push(
      new HtmlWebpackPlugin({
        title: 'editor',
        filename: 'editor.html',
        template: path.resolve(__dirname, 'app/index.tmpl.html'),
        chunks: ['commons', 'editor'],
      }),
    )
  }

  if (!prod) {
    plugins.push(new webpack.HotModuleReplacementPlugin())
  } else {
    plugins.push(
      new webpack.optimize.CommonsChunkPlugin({
        name: 'commons',
        filename: 'commons.js',
      }),
      new ExtractTextPlugin('[name]-[contenthash:6].css'),
      new UglifyJsPlugin({ uglifyOptions: { compress: { inline: false } } }),
    )
  }

  return {
    context: __dirname,
    target: 'web',
    devtool: prod ? false : 'source-map',

    entry,

    output: {
      path: path.resolve(__dirname, 'build', packageInfo.version),
      filename: prod ? '[name]-[chunkhash:6].js' : '[name].js',
    },

    resolve: {
      modules: [path.resolve(__dirname, 'app'), 'node_modules'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'awesome-typescript-loader',
              options: {
                transpileOnly: true,
              },
            },
          ],
          exclude: /node_modules/,
        },
      ].concat(
        prod
          ? [
              {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                  fallback: 'style-loader',
                  use: 'css-loader',
                }),
              },
            ]
          : [
              {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
              },
            ],
      ),
    },

    plugins,

    devServer: {
      contentBase: __dirname,
      host: '0.0.0.0',
      hot: true,
    },
  }
}
