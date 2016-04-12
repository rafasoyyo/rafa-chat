
var colors = require('colors');

var users   = []
var sockets = []
var rooms 	= []

module.exports = function (io) {

	io.on('connection', function(socket){
		console.log('a user connected');
		socket.broadcast.emit('chat message', {nick:"INFO",message:"Nuevo usuario en la sala"});

		io.emit('chat users', io.engine.clientsCount);

		socket.on('new user', function(nickname){
			users.push(nickname.nick);
			sockets.push(socket.id);
			io.emit('user added', users);
		});

		socket.on('chat message', function(msg){
			io.emit('chat message', msg);
		});

		socket.on('chat friend', function(data){
			var direct  = data.emiter + '-' + data.receiver,
				inverse = data.receiver + '-' +  data.emiter,
				roomindex = (rooms.indexOf(direct) != -1) ? (rooms.indexOf(direct)) : ((rooms.indexOf(inverse) != -1 ) ? rooms.indexOf(inverse) : -1 );

			if( roomindex < 0){
				console.log('new: ' , data);
				roomindex = rooms.length;
				rooms.push(direct);
				var allSockets = io.sockets.clients().sockets;
				var socketFrom = sockets[users.indexOf( data.emiter   )];
				var socketTo   = sockets[users.indexOf( data.receiver )];

				allSockets[socketFrom].join( direct );
				allSockets[socketTo  ].join( direct );
			}

			console.log('existing: ' , data);
			io.to(rooms[roomindex]).emit('chat friend', {msg:data.message, emiter:data.emiter, receiver:data.receiver});
		});

		socket.on('disconnect', function(){
			console.log('user disconnected: ' + socket.id);
			io.emit('chat message', {nick:"INFO",message:"Un usuario ha abandonado la sala"});
			io.emit('chat users',io.engine.clientsCount);

			var index = sockets.indexOf(socket.id);
			if(index > -1){
				users.splice(index, 1);
				sockets.splice(index, 1);
			}

			io.emit('user added', users);
		});

	});
}