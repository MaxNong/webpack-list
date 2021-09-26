const path = require('path');
const { MypackHtmlPlugin } = require("./lib/plugins/MypackHtmlPlugin")

const babelCore = require("@babel/core");

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },

  loaders: [
    {
      test: /\.(jsx)$/,
      handler: function (moduleCode) {
        return new Promise(function (resolve, reject) {
          babelCore.transform(moduleCode, {
            presets: ["@babel/preset-react"],
          }, function (err, result) {
            resolve(result.code)
          });
        })
      },
    },
  ],

  plugins: [
    new MypackHtmlPlugin("./src/index.html")
  ]
};