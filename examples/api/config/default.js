/**
 * Default config
 */

module.exports = () => {
  return {
    name: 'app',
    debug: true,
    baseUrl: 'http://localhost:3000',
    server: {
      port: 3000,
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
        secretKey: '',
        whKey: ''
      },
      validator: {
        gcaptcha: {
          secret: ''
        }
      },
      db: {
        driver: 'nedb',
        path: './storage',
        //server: 'mongodb://127.0.0.1/database'
      },
      auth: {
        create: true,
        confirm: false,
        notify: true,
        update: true,
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
        driver: 'db',
        maxFiles: 5
      },
      crypto: {
        key: '',
        private: '',
        public: ''
      },
      socket: {},
      i18n: {
        serveTranslations: ['messages', 'validation'],
        driver: 'file',
        defaultLocale: 'en',
        path: 'res/locales',
        locales: [
          'en',
          'de'
        ]
      },
      // es: {},
      // redis: {}
    }
  };
};
