let data=false
let ws = new WebSocket('ws://localhost:8081')
let uuid = false
let role='user'


let loggedUser = document.getElementById('loggedUser')
loggedUser.innerText=localStorage.getItem('dUsername')

let discordAvatar = document.getElementById('discordAvatar')
discordAvatar.src=localStorage.getItem('dAvatar')

let users = document.getElementById('users')
let statusText = document.getElementById('statusText')

let playerTab = document.getElementById('playerTab')
let playerCount = document.getElementById('playerCount')
let playerLimit = document.getElementById('playerLimit')

let startGame = document.getElementById('startGame')
let gameConfig = document.getElementById('gameConfig')
let nbRounds = document.getElementById('nbRounds')
let maxPlayer = document.getElementById('maxPlayer')

let startDialog = document.getElementById('startDialog')
let cancelBtn = document.getElementById('cancelBtn')
let confirmBtn = document.getElementById('confirmBtn')



ws.addEventListener('open', ()=> {
    console.log('Connecté au WS')
    const weweOnAttends = async() => {
        ws.send(JSON.stringify({
            op: 1,
            from: "WAITSCREEN",
            user: localStorage.getItem('dObject')
        }));
    }
    weweOnAttends()

    ws.addEventListener('message', msg =>{
        data = JSON.parse(msg.data);
        console.log(data);

        if(data.op===2){
            uuid=data.uuid
            role=data.role
            if(data.role==='admin'){
                loggedUser.classList.add('superuser')
            }
            update()
        } else if (data.op===100){
            update()
        }
    })
})

function update(){
    updatePlayerNames()
    updateMisc()
}

function updatePlayerNames(){
    users.innerHTML=''
    for(let user of data.content.onlineUsers){
        let uname = document.createElement('p')
        let btnKick = document.createElement('button')
        btnKick.classList.add('adminBtns')
        btnKick.id='kickBtn'+user.pseudo
        btnKick.innerText='Kick player'
        uname.innerHTML=user.pseudo+'  '
        uname.appendChild(btnKick)
        users.appendChild(uname)
        console.log(user.pseudo)
        btnKick.addEventListener('click', ()=>{
            ws.send(JSON.stringify({
                op: 8,
                uuid: uuid,
                player: user.pseudo
            }));
        })
    }
    if(role==='user'){
        for(let btns of document.getElementsByClassName('adminBtns')){
            btns.classList.add('hidden')
        }
    }
}

function updateMisc(){
    if(data.content.status==='waiting'){
        statusText.innerText='Partie en attente...'
        statusText.style.color='#FFEA79'
    } else if(data.content.status==='ongoing'){
        statusText.innerText='Partie en cours.'
        statusText.style.color='#79FF7E'
    } else if(data.content.status==='end'){
        statusText.innerText='Hors ligne'
        statusText.style.color='#FF7979'
    }

    playerCount.innerText=data.content.onlineUsers.length
    playerLimit.innerText=data.content.maxusers
    if(data.content.onlineUsers.length>=data.content.maxusers){
        playerTab.style.color='#FF7979'
    }
}

let config = { rounds: 10, maxplayer: 10 }
startGame.addEventListener('click', ()=>{
    ws.send(JSON.stringify({
        op: 6,
        uuid: uuid
    }));
})
gameConfig.addEventListener('click', ()=>{
    startDialog.showModal()
})
confirmBtn.addEventListener('click', ()=>{
    let parsedNb = parseInt(nbRounds.value)
    let parsedMP = parseInt(maxPlayer.value)
    config.rounds=parsedNb
    config.maxplayer=parsedMP
    startDialog.close()
    ws.send(JSON.stringify({
        op: 7,
        uuid: uuid,
        config: config
    }));
})
cancelBtn.addEventListener('click', ()=>{
    startDialog.close()
})