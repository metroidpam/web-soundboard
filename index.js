// Require the libraries:
const SocketIOFileUpload = require('socketio-file-upload');
const express = require('express');
//db
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)

db.defaults({ sounds: [] })
  .write()


var app = express()
    .use(SocketIOFileUpload.router)
    .use(express.static(__dirname + "/www"))
    .use(express.static(__dirname + "/uploads"))
    .listen(8090);

var io = require('socket.io')(app);
io.sockets.on("connection", function(socket){
    var uploader = new SocketIOFileUpload();
    uploader.dir = "www/uploads/";
    uploader.listen(socket);

    socket.emit("soundList", db.get('sounds').value());

    uploader.on("start", function(event){
        if (!/\.mp3$/.test(event.file.name)) {
            uploader.abort(event.file.id, socket);
        }
    });

    socket.on('rename', (data) => {
	db.get('sounds').find({name: data.item.name, path: data.item.path}).assign({name: data.rename}).write();
	io.emit('rename', data)
    })

    uploader.on("saved", function(event){
        let x = {name: event.file.name.slice(0, -4), path: event.file.pathName.substr(4)};
        db.get('sounds').push(x).write();
        socket.broadcast.emit('newSound', x);
    });

    uploader.on("error", function(event){
        console.log("Error from uploader", event);
    });
});