const express = require("express")
const app = express()
const util = require("util")
const http = require("http")
const server = http.createServer(app);
const connection = require("./db/mysql").promise()
const cors = require("cors")
const moment = require("moment")
const io = require("socket.io")(server, {
    cors: {
        origin:'*',
    }
})
require("dotenv").config()

moment.locale("en")


app.use(cors())
app.use(express.json())

app.get("/" , (req,res) => { 
    res.send({message: "api for websocket"})
})


app.post("/savechat", async(req,res) => { 
    
    const {message, receiver, sender} = req.body
    const time = moment().format("h:mm A")
    console.log(time)
    await connection.query(`
  INSERT INTO tbl_chat (chat, sender, receiver, time)
  VALUES (?, ?, ?, ?);
`, [message, sender, receiver, time]);
    res.send({
        status:"susccess",
        message: "chat has been saved successfully"
    })
})

app.get("/getchat", async(req,res) => { 

    const {receiver, sender} =req.query
    const [fields] = await connection.query(`
    SELECT * FROM tbl_chat
    WHERE (receiver = ? AND sender = ?)
       OR (receiver = ? AND sender = ?)
  `, [receiver, sender, sender, receiver]);

    res.send({
        "result": fields
    })
})

app.post("/lastchat", async(req,res) => { 

    const {receiver,sender} = req.body;
    const [fields] = await connection.query(`
    SELECT * FROM tbl_chat
    WHERE (receiver = ? AND sender = ?)
       OR (receiver = ? AND sender = ?)
    ORDER BY id DESC
    LIMIT 1;
  `, [receiver, sender, sender, receiver]);
    res.send({
        data:fields,
    })
})

app.get("/users",async (req,res) => { 
    const [fields] = await connection.query("SELECT * FROM users where name LIKE ? AND role= ?", [`${req.query["name"]}%`, req.query["role"]])

    res.send({
        status:'success',
        data: fields,
    })
})
const userConnected = new Map();

io.on("connection", (socket) => {

    socket.on("register", (username) => {
        console.log(`user ${username} connected`)
        if (!userConnected.get(username)) { 
            userConnected.set(username, socket.id);
            // console.log("New user has been connected: " + username);
        }
    });

    socket.on("checkonline", ({receiver,sender}) => {
        const targetSocketId = userConnected.get(sender);
        console.log(targetSocketId);
        const target = io.to(targetSocketId);
        if(userConnected.get(receiver)){ 
         
            target.emit('validateonline', {'message': 'online'});
        }else { 
            target.emit('validateonline', {'message': 'offline'})
        }

    })

    socket.on("sendmessage", ({ to, message, from }) => {
        
        const targetSocketId = userConnected.get(to);

        if (targetSocketId) {
            const target = io.to(targetSocketId);
            target.emit('receivemessage', { from, message });
        } else {
            // console.log(`User ${to} not found.`);
        }
    });

    socket.on("disconnect", function () {
        // Remove the disconnected user from the map
        Array.from(userConnected.entries()).forEach(([key, value]) => {
            if (value === socket.id) {

                userConnected.delete(key);
                console.log(`User ${key} disconnected.`);
            }
        });
    });
});

const port = process.env.PORT || 3001;

server.listen(port, () => {
    console.log("server is listening" + " " + port)
})