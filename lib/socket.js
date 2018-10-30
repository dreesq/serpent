const io = require('socket.io');
const {SERVER_LISTENING} = require('../constants');

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
          io(server);
     });
};