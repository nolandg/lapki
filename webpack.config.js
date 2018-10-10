const path = require('path');

const outputPath = path.resolve(__dirname, 'build');
const libraryTarget = 'commonjs2';

const common = {
  // devtool: 'cheap-module-eval-source-map',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /(node_modules|bower_components|build)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 20e6,
            },
          },
        ],
      },
    ],
  },
};

const client = {
  target: 'web',
  entry: {
    client: './src/client.js',
  },
  output: {
    path: outputPath,
    filename: '[name].js',
    libraryTarget,
  },
  ...common,
};

const server = {
  target: 'node',
  entry: {
    server: './src/server.js',
  },
  output: {
    path: outputPath,
    filename: '[name].js',
    libraryTarget,
  },
  ...common,
};

module.exports = [client, server];
