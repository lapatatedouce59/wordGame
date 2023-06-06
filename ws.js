const fs = require('fs')
const logger = require('./logger')
const https = require('https')
const {v4} = require('uuid')
const clients = new Map();
const {WebSocket, WebSocketServer} = require('ws');
const wss = new WebSocket.Server({ port: 8081 });
const game=require('./server.json');
const users=require('./user.json');
const presets=require('./presets.json');
/*const server = https.createServer({
    cert: fs.readFileSync('/etc/letsencrypt/live/patate.ddns.net/fullchain.pem'),
    key: fs.readFileSync('/etc/letsencrypt/live/patate.ddns.net/privkey.pem')
})

const wss = new WebSocketServer({server});

server.listen(8081, function listening() {
    console.log('Address: ', wss.address());
});*/

function apiSave(){
    fs.writeFileSync('./server.json', JSON.stringify(pccApi, null, 2));

    wss.broadcast(JSON.stringify({
        op: 300,
        content: pccApi
    }))
    logger.message('broadcast','NEW SERVER DATA => REFRESH')
    //ws.send();
}

wss.broadcast = function broadcast(msg) {
    wss.clients.forEach(function each(client) {
        client.send(msg);
    });
};

wss.on('connection', (ws, req) => {
    let newUUID;
    logger.client(true)
    let clientIp=req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    newUUID = v4();

    ws.on('message', msg => {
        let data = false
        try{
            data = JSON.parse(msg);
        } catch (error) {
            logger.error(error)
        }
        op = data.op;

        if(op==='100') return;

        switch(op){
            case 1 :
                console.log(clientIp)
                let client = {uuid: newUUID, ip: clientIp, instance:data.from, uname: data.uname};
                clients.set(newUUID,client)
                console.log(clients)
                logger.identify(clientIp, newUUID, clients.get(newUUID).instance)
                logger.message('outcome','server.json')
                //ws.send(JSON.stringify(pccApi));
                ws.send(JSON.stringify({game: game, users: users}));
                break;
        }
    })
}) //! todo refonte systeme login