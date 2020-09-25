const path = require('path');
const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const formatMessage = require('./utils/message');
const {userJoin,getCurrentUser,userLeave,getRoomUsers} = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Set static express
app.use(express.static(path.join(__dirname,'public')));

const botName = 'ChatCord Bot';

//Run when client connects
io.on('connection',socket=>{
    // on:recieve, emit:send 
    socket.on('joinRoom',({username,room})=>{
        const user = userJoin(socket.id,username,room);
        socket.join(user.room);
        //emit to the current connecting user. Welcome current user
        socket.emit('message',formatMessage(botName,'Welcome to ChatCord!'));

        //Broadcast when a user connects
        //emit to all clients except the client it's connecting. (io.emit()-all clients)
        socket.broadcast
            .to(user.room)
            .emit(
                'message',
                formatMessage(botName,`${user.username} has joined the chat`)
            );
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        });
        
    });


    //Listen for chatMessage
    socket.on('chatMessage',(msg)=>{
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message',formatMessage(user.username,msg));
    })

     //Run when client disconnects
     socket.on('disconnect',()=>{
        const user = userLeave(socket.id);
        if(user){
            console.log('user leaving')
            io.to(user.room).emit('message',formatMessage(botName,`${user.username} has left the chat`));

            io.to(user.room).emit('roomUsers',{
                room:user.room,
                users:getRoomUsers(user.room)
            });
        }
    })

});


const PORT = process.env.PORT || 3000;

server.listen(PORT,()=>console.log(`Server running on port ${PORT}`));