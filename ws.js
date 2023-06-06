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

        if(op===100) return;

        switch(op){
            case 1 :
                let dUser = JSON.parse(data.user)
                console.log(dUser)
                console.log(clientIp)
                let role = 'user'
                if (dUser.id==='383637400099880964'){
                    role='admin'
                }
                let client = {uuid: newUUID, ip: clientIp, instance: data.from, uname: dUser.username, uid: dUser.id, role: role, dUser: dUser};
                clients.set(newUUID,client)
                console.log(clients)
                logger.identify(clientIp, newUUID, clients.get(newUUID).instance)
                logger.message('outcome','server.json')
                //ws.send(JSON.stringify(pccApi));
                ws.send(JSON.stringify({op: 2, uuid: newUUID, game: game, role: role}));
                break;
            case 3 :
                //! todo, vérif si l'user est déjà existant
                for(let user of game.onlineUsers){
                    if(user.dObject.id===clients.get(data.uuid).uid){
                        ws.send(JSON.stringify({op: 5, error: "Vous êtes déjà connecté sur la partie."}));
                    } else {
                        ws.send(JSON.stringify({op: 4}));
                        game.onlineUsers.push({user: clients.get(data.uuid).dUser, pseudo: data.pseudo})
                    }
                }
                ws.send(JSON.stringify({op: 2, uuid: newUUID, game: game, role: role}));
                break;
            
        }
    })
})
