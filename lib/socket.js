const io = require('socket.io');
const {SERVER_LISTENING} = require('../constants');

/**
 * Socket server instance
 * @type {boolean}
 */

let sio = false;

/**
 * Socket server plugin
 * @param context
 */

exports.init = context => {
     const {events} = context.plugins;

     /**
      * After http server started listening
      */

     events.on(SERVER_LISTENING, () => {
          const {server} = context;
          sio = io(server);

         /**
          * If authorization is present, authenticate the user
          */

         sio.on('connection', socket => {
              socket.user = false;
         });
     });
};

exports.methods = {
     getSocket() {
          return sio;
     }
};