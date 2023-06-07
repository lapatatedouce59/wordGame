const fs = require('fs')
const logger = require('./logger')
const https = require('https')
const {v4} = require('uuid')
//const clients = new Map();
const clients = {}
const {WebSocket, WebSocketServer} = require('ws');
const wss = new WebSocket.Server({ port: 8081 });
const game=require('./server.json');
game.countdown=5
fs.writeFileSync('./server.json', JSON.stringify(game, null, 2));
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
    let clientIp=req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logger.client(true, clientIp)
    newUUID = v4();
    ws.id=newUUID

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
                    //let client = {uuid: newUUID, ip: clientIp, instance: data.from, uname: dUser.username, uid: dUser.id, role: role, dUser: dUser};
                    ws.ip = clientIp
                    ws.instance = data.from
                    ws.uname=dUser.username
                    ws.uid=dUser.id
                    ws.role=role
                    ws.dUser=dUser
                    clients[ws.id]=ws
                    //clients.set(newUUID,client)
                    console.log(clients)
                    console.log(wss)
                    logger.identify(clientIp, newUUID, ws.instance, ws.uname)
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
                    game.onlineUsers.push({user: clients[data.uuid].dUser, pseudo: data.pseudo, uuid: data.uuid})
                    apiSave()
                    ws.send(JSON.stringify({op: 4}));
                    return;
                } else {
                    for(let user of game.onlineUsers){
                        if(user.user.id===clients[data.uuid].uid){
                            ws.send(JSON.stringify({op: 5, error: "Vous êtes déjà connecté sur la partie. Erreur: [ALREADY-IG]"}));
                            return;
                        } else {
                            ws.send(JSON.stringify({op: 4}));
                            game.onlineUsers.push({user: clients[data.uuid].dUser, pseudo: data.pseudo, uuid: data.uuid})
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
                if(clients[data.uuid].role==='admin'){
                    startGame()
                } else {
                    ws.send(JSON.stringify({op: 5, error: "Vous n'avez pas la permission de changer cela! Erreur: [MISSING-PERMS]"}));
                }
                break;
            case 7 :
                if(!data.uuid){
                    ws.send(JSON.stringify({op: 5, error: "Une erreur est survenue lors de l'identification. Merci de reload votre page. Erreur: [NO-UUID]"}));
                    return;
                }
                if(clients[data.uuid].role==='admin'){
                    game.maxusers=data.config.maxplayer
                    game.config.rounds=data.config.rounds
                    apiSave()
                } else {
                    ws.send(JSON.stringify({op: 5, error: "Vous n'avez pas la permission de changer cela! Erreur: [MISSING-PERMS]"}));
                }
                break;
            case 8 :
                if(!data.uuid){
                    ws.send(JSON.stringify({op: 5, error: "Une erreur est survenue lors de l'identification. Merci de reload votre page. Erreur: [NO-UUID]"}));
                    return;
                }
                if(clients[data.uuid].role==='admin'){
                    for(let user in game.onlineUsers){
                        if(!(game.onlineUsers[user].pseudo===data.player)) continue;
                        game.onlineUsers.splice(user, 1)
                        console.log(data.player + ' bien kick')
                    }
                    apiSave()
                } else {
                    ws.send(JSON.stringify({op: 5, error: "Vous n'avez pas la permission de changer cela! Erreur: [MISSING-PERMS]"}));
                }
                break;
        }
    })
    ws.on("close", ()=>{
        delete clients[ws.id];
        console.log("[-] "+ws.id+", "+ws.uname+" logged out");
    });
})

function startGame(){
    let countDown = setInterval(()=>{
        game.countdown--
        wss.broadcast(JSON.stringify({
            op: 9,
            content: game
        }))
        fs.writeFileSync('./server.json', JSON.stringify(game, null, 2));
        console.log(game.countdown)
        if(game.countdown<=0){
            clearInterval(countDown)
            for(let client of Object.entries(clients)){
                console.log(client)
                if(!(client[1].instance==='WAITSCREEN')) continue;
                client[1].send(JSON.stringify({op: 10}))
                console.log(client[1].id+' mooved to game')
            }
    
            logger.message('broadcast','NEW SERVER DATA => REFRESH')
        }
    },1000)
}
