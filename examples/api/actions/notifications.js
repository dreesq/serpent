const { config } = require('../../../index');

const makeAction = config({
     transports: [
          'socket'
     ],
     middleware: [
          'auth',
          (req, res, next) => {
               next();
          }
     ],
     validate: {
          async id(value) {
               return !isNaN(value);
          }
     }
});

const getNotifications = async ({ socket, user, input }) => {
     user.emit(input);
};

const createNotification = async ({ socket, user, input }) => {
     user.join('a');
     socket.to('a').emit('b', 'b');

     user.emit('A', 'b');
     user.emit(input);

     return {

     };
};

module.exports = {
     getNotifications: makeAction(getNotifications),
     createNotification: makeAction(createNotification)
};


/*
const client = Serpent('http://localhost:3000', { socket: true });
const notifications = await client.getNotifications();

client.on('createNotification', data => {

});*/
