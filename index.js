let data=false
let ws = new WebSocket('ws://localhost:8081')
let uuid = false


let loggedUser = document.getElementById('loggedUser')
loggedUser.innerText=localStorage.getItem('dUsername')

let discordAvatar = document.getElementById('discordAvatar')
discordAvatar.src=localStorage.getItem('dAvatar')

let joinParty = document.getElementById('joinParty')
let errorMsg = document.getElementById('errorMsg')
let statusText = document.getElementById('statusText')


ws.addEventListener('open', ()=> {
    console.log('Connecté au WS')
    const weweOnAttends = async() => {
        ws.send(JSON.stringify({
            op: 1,
            from: "START",
            user: localStorage.getItem('dObject')
        }));
    }
    weweOnAttends()

    ws.addEventListener('message', msg =>{
        data = JSON.parse(msg.data);
        console.log(data);

        if(data.op===2){
            uuid=data.uuid
            if(data.role==='admin'){
                loggedUser.classList.add('superuser')
            }
        }else if (data.op===100){
            data=data.content
            update()
        }else if(data.op===5){
            errorMsg.innerText=data.error
            errorMsg.style.display='inline-block'
        }else if(data.op===4){
            document.location.href='./waiting.html'
        }
    })
})

joinParty.addEventListener('click',()=>{
    ws.send(JSON.stringify({
        op: 3,
        uuid: uuid,
        pseudo: document.getElementById('pseudoInput').value,
    }));
})

function update(){
    updateMisc()
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
}