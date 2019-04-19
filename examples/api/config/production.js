/**
 * Production config
 */

module.exports = () => {
  return {
    debug: false,
    server: {
      port: 3004,
      helmet: true,
      parsers: true,
      ssl: {
        cert: './ssl/cert',
        key: './ssl/key'
      },
      cors: {
        origin: '*',
        credentials: true
      },
      session: {
        enabled: true,
        resave: false,
        saveUninitialized: false,
        secret: 'mySecret'
      }
    }
  };
};