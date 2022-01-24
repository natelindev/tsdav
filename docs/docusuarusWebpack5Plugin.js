// eslint-disable-next-line
module.exports = function (context, options) {
  return {
    name: 'docusaurus-webpack5-plugin',
    // eslint-disable-next-line
    configureWebpack(config, isServer, utils) {
      return {
        resolve: {
          // alias: {
          //   path: require.resolve('path-browserify'),
          // },
          fallback: {
            buffer: require.resolve('buffer/'),
            fs: false,
            stream: require.resolve('stream-browserify'),
            // http: require.resolve('stream-http'),
            // https: require.resolve('https-browserify'),
            // os: require.resolve('os-browserify/browser'),
          },
        },
      };
    },
  };
};
