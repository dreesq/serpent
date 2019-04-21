/**
 * Default config
 */

module.exports = () => {
  return {
    debug: true,
    baseUrl: 'http://localhost:3004',
    server: {
      port: 3004,
      helmet: true,
      parsers: true,
      ssl: false,
      cors: {
        origin: '*',
        credentials: true
      },
      session: {
        resave: false,
        saveUninitialized: false,
        secret: 'mySecret'
      }
    },
    plugins: {
      stripe: {
        secretKey: ''
      },
      validator: {
        gcaptcha: {
          secret: ''
        }
      },
      db: {
        server: 'mongodb://127.0.0.1/database'
      },
      auth: {
        confirm: false,
        reset: true,
        refresh: true,
        devices: true,
        jwt: {
          secret: 'mySecret',
          duration: '1d'
        },
        strategies: [
          'local',
          'fb'
        ]
      },
      mail: {
        enabled: true,
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'mnxf2ak2zdjjc5kc@ethereal.email',
          pass: 'ueHQVpx7FxkbsSzp5n'
        }
      },
      logger: {
        path: 'storage/logs.out',
        maxsize: 10000000,
        zippedArchive: true,
        maxFiles: 5
      },
      redis: {},
      socket: {},
      i18n: {
        serveTranslations: true,
        defaultLocale: 'en',
        path: 'res/locales',
        locales: [
          'en',
          'de'
        ]
      },
      es: {}
    }
  };
};