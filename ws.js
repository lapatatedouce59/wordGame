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
    console.log('action')
    fs.writeFileSync('./server.json', JSON.stringify(game, null, 2));

    wss.broadcast(JSON.stringify({
        op: 100,
        content: game
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
                let dUser=false
                try{
                    dUser = JSON.parse(data.user)
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
                    ws.send(JSON.stringify({op: 2, uuid: newUUID, content: game, role: role}));
                    break;
                } catch (error) {
                    logger.error(error)
                    ws.send(JSON.stringify({op: 5, error: "Une erreur est survenue lors de l'identification. Merci de reload votre page. Erreur: [NO-DUSER]"}));
                    break;
                }
            case 3 :
                if(game.onlineUsers.length>=game.maxusers){
                    ws.send(JSON.stringify({op: 5, error: "La partie est complète. Merci de patienter. Erreur: [MAX-PLAYERS]"}));
                    return;
                }
                if(data.uuid===false){
                    ws.send(JSON.stringify({op: 5, error: "Une erreur est survenue lors de l'identification. Merci de reload votre page. Erreur: [NO-UUID]"}));
                    return;
                }
                console.log(data)
                if(game.onlineUsers.length===0){
                    console.log('ok')
                    ws.send(JSON.stringify({op: 4}));
                    game.onlineUsers.push({user: clients.get(data.uuid).dUser, pseudo: data.pseudo, uuid: data.uuid})
                    apiSave()
                    return;
                } else {
                    for(let user of game.onlineUsers){
                        if(user.user.id===clients.get(data.uuid).uid){
                            ws.send(JSON.stringify({op: 5, error: "Vous êtes déjà connecté sur la partie. Erreur: [ALREADY-IG]"}));
                            return;
                        } else {
                            ws.send(JSON.stringify({op: 4}));
                            game.onlineUsers.push({user: clients.get(data.uuid).dUser, pseudo: data.pseudo, uuid: data.uuid})
                            apiSave()
                            return;
                        }
                    }
                }
                break;
            case 6 :
                if(!data.uuid){
                    ws.send(JSON.stringify({op: 5, error: "Une erreur est survenue lors de l'identification. Merci de reload votre page. Erreur: [NO-UUID]"}));
                    return;
                }
                if(clients.get(data.uuid).role==='admin'){
                    //? peut etre s'amuser a config la partie avec le <dialog>, comme ça on met une config
                    startGame()

                }
        }
    })
})

function startGame(){

}
