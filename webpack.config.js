var webpack = require('webpack');

module.exports = {
  devtool: 'source-map',

  entry: [
    './src/index'
  ],

  output: {
    library: 'Stormpath'
  },

  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        retainLines: true,
        cacheDirectory: true
      }
    },
    {
      test: /\.svg/,
      loader: 'svg-url-loader'
    }],
    noParse: [
      /\/sinon\.js/,
    ],
  },

  resolve: {
    alias: {
      sinon: 'sinon/pkg/sinon',
    }
  },

  plugins: [
    new webpack.DefinePlugin({
      'pkg.version': JSON.stringify(require('./package.json').version),
      'pkg.name': JSON.stringify(require('./package.json').name)
    })
  ]
};
