const fs = require('fs')
const logger = require('./logger')
const https = require('https')
const {v4} = require('uuid')
//const clients = new Map();
const clients = {}
const {WebSocket, WebSocketServer} = require('ws');
const wss = new WebSocket.Server({ port: 8081 });
const game=require('./server.json');
game.countdown=10
game.responseCountdown=10
game.responses=[]
game.questions=[]
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

let connectedPlayers = 0
let players = []
let canGameBeStarted=false
let verifStatus=false

let uresponses = new Array()

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
                var dUser=false
                try{
                    dUser = JSON.parse(data.user)
                    let role = 'user'
                    if (dUser.id==='383637400099880964'||dUser.id==='1095283865964269598'){
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
                if(game.status==='ongoing'||game.status==='starting'){
                    ws.send(JSON.stringify({op: 5, error: "La partie est déjà commencée. Erreur: [GAME-STARTED]"}));
                    return;
                }
                if(data.uuid===false){
                    ws.send(JSON.stringify({op: 5, error: "Une erreur est survenue lors de l'identification. Merci de reload votre page. Erreur: [NO-UUID]"}));
                    return;
                }
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
                    game.config.tpq=data.config.tpq
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
            case 11 :
                var dUser=false
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
                    console.log(clients)
                    console.log(wss)
                    logger.identify(clientIp, newUUID, ws.instance, ws.uname)
                    logger.message('outcome','server.json')
                    ws.send(JSON.stringify({op: 2, uuid: newUUID, content: game, role: role}));

                    for(let players of game.onlineUsers){
                        if(!(players.user.id===ws.dUser.id)) continue;
                        if(players.user.id===ws.dUser.id){
                            connectedPlayers++
                        } else {
                            ws.send(JSON.stringify({op: 5, error: "Vous n'êtes pas inscrit dans la partie! Erreur: [NOT-IG]"}));
                        }
                    }
                    if(verifStatus===false) {
                        verify()
                        verifStatus=true
                    }
                    break;
                } catch (error) {
                    logger.error(error)
                    ws.send(JSON.stringify({op: 5, error: "Une erreur est survenue lors de l'identification. Merci de reload votre page. Erreur: [NO-DUSER]"}));
                    break;
                }
            case 12 :
                for(let players of game.onlineUsers){
                    if(!(players.user.id===ws.dUser.id)) continue;
                    if(players.user.id===ws.dUser.id){

                        if(game.responseCountdown===0){
                            console.log(ws.id+' has responded.')
                            uresponses.push({ hole: data.completed, user: ws.dUser })
                            if(uresponses.length===game.onlineUsers.length){
                                game.responses.push(uresponses)
                                fs.writeFileSync('./server.json', JSON.stringify(game, null, 2));
                                uresponses=[]
                                question()
                            }
                        } else {
                            ws.send(JSON.stringify({op: 5, error: "Vous avez envoyé votre reponse trop tôt! [COUNTDOWN-NOT0]"}));
                        }
                    } else {
                        ws.send(JSON.stringify({op: 5, error: "Mdr t'es pas dans la partie qu'est-ce que tu me bidouille là? Erreur: [NOT-IG]"}));
                    }
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
    game.status='starting'
    fs.writeFileSync('./server.json', JSON.stringify(game, null, 2));
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
                players.push(client[1].id)
            }
            logger.message('broadcast','Player mooved')
            game.status='ongoing';
            fs.writeFileSync('./server.json', JSON.stringify(game, null, 2));
            wss.broadcast(JSON.stringify({
                op: 9,
                content: game
            }))
        }
    },1000)
}

function verify(){
    const startDate = Date.now()
    let verifyPlayers = setInterval(()=>{
        if(connectedPlayers===players.length){
            clearInterval(verifyPlayers)
            const endDate = Date.now()
            console.log('All players are connected. Time elapsed: '+(endDate-startDate)+' ms.')
            game.countdown=10
            canGameBeStarted=true
            console.log('------------------------------------ GAME CAN START ------------------------------------')
            question()
        }
    })
}



let actualRound=0
async function question(){
    game.responseCountdown=game.config.tpq
    fs.writeFileSync('./server.json', JSON.stringify(game, null, 2));
    if(actualRound<game.config.rounds){
        actualRound++
        let randomQuestion = getRandomQuestion()
        game.questions.push(randomQuestion)
        for(let client of Object.entries(clients)){
            if(!(client[1].instance==='GAME')) continue;
            client[1].send(JSON.stringify({op: 12, question: randomQuestion, round: actualRound, maxrounds: game.config.rounds}))
            console.log('Question '+actualRound+' envoyée à '+client[1].id)
        }
        let countDown = setInterval(()=>{
            game.responseCountdown--
            fs.writeFileSync('./server.json', JSON.stringify(game, null, 2));
            wss.broadcast(JSON.stringify({
                op: 13,
                count: game.responseCountdown
            }))
            console.log('Time left: '+game.responseCountdown+' seconds')
            if(game.responseCountdown<=0){
                clearInterval(countDown)
                for(let client of Object.entries(clients)){
                    if(!(client[1].instance==='GAME')) continue;
                    client[1].send(JSON.stringify({op: 14}))
                    console.log('requested response to '+client[1].id+' and ask for new round')
                }
            }
        },1000)
    } else {
        //finir la partie
        for(let client of Object.entries(clients)){
            if(!(client[1].instance==='GAME')) continue;
            client[1].send(JSON.stringify({op: 16}))
            console.log(client[1].id+' sent to game ending')
        }
    }
}

function getRandomQuestion(){
    let randomIndex = Math.floor(Math.random() * presets.length);
    let theChoosenOne = presets[randomIndex]
    return theChoosenOne;
}