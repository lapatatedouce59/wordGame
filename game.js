let data=false
let ws = new WebSocket('ws://localhost:8082')
let uuid = false
let role='user'

import sm from './sm.js'
sm.init()
sm.registerSound("tick", './src/snds/tick.mp3');
sm.registerSound("beep", './src/snds/arival.mp3');


let loggedUser = document.getElementById('loggedUser')
loggedUser.innerText=localStorage.getItem('dUsername')

let discordAvatar = document.getElementById('discordAvatar')
discordAvatar.src=localStorage.getItem('dAvatar')

let responseCountdown = document.getElementById('responseCountdown')
let actualResponseCountdown = document.getElementById('actualResponseCountdown')

let sentence = document.getElementById('sentence')

let actualRound = document.getElementById('actualRound')
let maxround = document.getElementById('maxround')


ws.addEventListener('open', ()=> {
    console.log('Connecté au WS')
    const weweOnAttends = async() => {
        ws.send(JSON.stringify({
            op: 11,
            from: "GAME",
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
        } else if (data.op===12){
            actualRound.innerText=data.round
            maxround.innerText=data.maxrounds
            let parsedSentence= data.question.replace('§', "<input type='text' id='responseInput' placeholder='Amaury...'>")
            sm.playSound('beep')
            sentence.innerHTML=parsedSentence
        } else if (data.op===13){
            actualResponseCountdown.innerText=data.count
            sm.playSound('tick')
        } else if (data.op===14){
            let input = document.getElementById('responseInput')
            ws.send(JSON.stringify({
                op: 12,
                uuid: uuid,
                completed: input.value
            }));
            console.log('Sent "'+input.value+'" to server')
        } else if (data.op===16){
            document.location.href='results.html'
        }
    })
})

function update(){
    
}

let secoursBug = document.getElementById('secoursBug')

secoursBug.addEventListener('click',()=>{
    ws.send(JSON.stringify({
        op: 50,
        uuid: uuid,
    }));
})