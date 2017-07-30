const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const packageInfo = require('./package.json')

const isProduction = process.env.NODE_ENV === 'production'

const commonPlugins = [
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, 'app/index.tmpl.html'),
  }),
]

const devPlugins = [
  new webpack.HotModuleReplacementPlugin(),
]

const productionPlugins = [
  new webpack.EnvironmentPlugin({ NODE_ENV: 'development' }),
]

module.exports = {
  context: __dirname,
  target: 'web',
  devtool: isProduction ? false : 'source-map',

  entry: [
    'react-hot-loader/patch',
    __dirname + "/app/main.tsx"
  ],

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
        use: ['awesome-typescript-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  plugins: commonPlugins.concat(isProduction ? productionPlugins : devPlugins),

  devServer: {
    contentBase: __dirname,
    host: '0.0.0.0',
    hot: true,
  }
}
