var express = require('express');
var app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views','./views');
var server = require('http').Server(app);
var io = require('socket.io')(server);
server.listen(3000);//lắng nghe port 80

let hashMap = new Map();
let chats = new Map();
io.on('connection', (socket) => {
    socket.on('create-user',(data) => {
        console.log(socket.id + ' đã kết nối !!!');
        data.id = socket.id;
        hashMap.set(socket.id, data);
        let json = [];
        if(chats.has('cmn'));
            json = chats.get('cmn');
        socket.emit('res-user',{"message": "Login success"});
        io.sockets.emit('data-user',{"users": Array.from(hashMap.values())});
        socket.emit('res-list-message',{"data": json?json:[],"idUser": socket.id,'idRoom': 'cmn'});
    });

    socket.on('send-message',(data) => {
        if(hashMap.has(socket.id))
        {
            let user = hashMap.get(socket.id);
            if(!chats.has(data.id))
                chats.set(data.id,[]);
            chats.get(data.id).push({'user': user,'message': data.message});
            socket.emit('res-message', {'user': user,'message': data.message,'idRoom': data.id});
            socket.broadcast.emit('res-all-message', {'user': user,'message': data.message,'idRoom': data.id});
        }
    });

    socket.on('get-user',(data) => {
        if(hashMap.has(data))
        {
            let user = hashMap.get(data);
            socket.emit('info-user', {'user': user});
        }
    });

    socket.on('private-send',(data) => {
        if(hashMap.has(socket.id))
        {
            let user = hashMap.get(socket.id);
            let id = (socket.id + '' + data.id).split('').sort().join('');
            if(!chats.has(id))
                chats.set(id,[]);
            chats.get(id).push({'user': user,'message': data.message});
            socket.to(data.id).emit('res-all-message', {'user': user,'message': data.message,'idRoom': socket.id});
            socket.emit('res-message', {'user': user,'message': data.message,'idRoom': data.id});
        }
    });
    socket.on('get-list-message',(data) => {
        if(hashMap.has(socket.id))
        {
            let res = [];
            let id = data;
            if(id != 'cmn')
                id = (data + '' + socket.id).split('').sort().join('');
            if(chats.has(id))
                res = chats.get(id);
            socket.emit('res-list-message',{"data": res,"idUser": socket.id,'idRoom': data});
        }
    });

    socket.on('req-change',(data) => {
        if(hashMap.has(socket.id))
        {
            let id = data;
            if(id == 'cmn')
                socket.broadcast.emit('res-change', id);
            else
                socket.to(id).emit('res-change',socket.id);
        }
    });

    socket.on('disconnect',() => {
        if(hashMap.has(socket.id))
            hashMap.delete(socket.id);
        io.sockets.emit('data-user',{"users": Array.from(hashMap.values())});
    });
});

app.get('/', (req, res) => {
    res.render('index');
});