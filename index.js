const express = require('express');
const cors = require('cors');
const { constants, bookdbconstants } = require('./env');
const mongoose = require('mongoose');
const booksRouter = require('./routes/books');
const bookingsRouter = require('./routes/bookings');
const userRoutes = require("./routes/userRoutes");
const messageRoute = require("./routes/messagesRoute");

const app = express();
const socket = require("socket.io");

mongoose.connect(bookdbconstants.MONGODB_CONNECTION_URL);
mongoose.connection.on('error', err => {
    console.log('connection failed');
});
mongoose.connection.on('connected', connected => {
    console.log("connected with database");
});

app.use(cors('*'));
app.use(express.json());
app.use('/api/books', booksRouter);
app.use('/api/bookings', bookingsRouter);
app.use("/api/auth", userRoutes);
app.use("/api/messages", messageRoute);

const server = app.listen(constants.SERVER_PORT, '0.0.0.0', () => {
    console.log("server started at "+constants.SERVER_PORT+"...");
});

const io = socket(server, {
    cors: {
        origin: "*",
        credentials: true,
    },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
    global.chatSocket = socket;
    socket.on("add-user", (userId) => {
        onlineUsers.set(userId, socket.id);
    });

    socket.on("send-msg", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if(sendUserSocket){
            socket.to(sendUserSocket).emit("msg-receive", data.message);
        }
    });
});