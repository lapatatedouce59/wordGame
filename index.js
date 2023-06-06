let data=false
//let ws = new WebSocket('ws://localhost:8081')
let uuid = false


let loggedUser = document.getElementById('loggedUser')
loggedUser.innerText=localStorage.getItem('dUsername')

let discordAvatar = document.getElementById('discordAvatar')
discordAvatar.src=localStorage.getItem('dAvatar')

let joinParty = document.getElementById('joinParty')
let errorMsg = document.getElementById('errorMsg')


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
            data=data.content
            errorMsg.innerText=data.error
        }else if(data.op===4){
            document.location.href('./waiting.html')
        }
    })
})

joinParty.addEventListener('click',()=>{
    ws.send(JSON.stringify({
        op: 3,
        uuid: uuid,
    }));
})
