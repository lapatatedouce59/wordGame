let data=false
let ws = new WebSocket('ws://localhost:8081')
let uuid = false
let role='user'

let loggedUser = document.getElementById('loggedUser')
loggedUser.innerText=localStorage.getItem('dUsername')

let discordAvatar = document.getElementById('discordAvatar')
discordAvatar.src=localStorage.getItem('dAvatar')

let nextDiapo = document.getElementById('nextDiapo')

let masterDiv = document.getElementById('masterDiv')

let actualRound = document.getElementById('actualRound')
let maxround = document.getElementById('maxround')

let TEST = document.getElementById('TEST')


ws.addEventListener('open', ()=> {
    console.log('Connecté au WS')
    const weweOnAttends = async() => {
        ws.send(JSON.stringify({
            op: 20,
            from: "RESULTS",
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
        } else if (data.op===21){
            actualRound.innerText=data.round
            maxround.innerText=data.maxrounds

            masterDiv.innerHTML=''
            let row=0
            let elems = 0
            for (let response of data.responses){
                console.log(row)
                console.log(elems)
                if(elems<3&&!(row===0)){
                    elems++
                    let divElem=document.getElementById('divElem'+row)
                    let divContent = document.createElement('div')
                    divContent.classList.add('responseDiv')
                    let divHead=document.createElement('div')
                    divHead.classList.add('nameHead')
                    let imgAvatar = document.createElement('img')
                    imgAvatar.src='https://cdn.discordapp.com/avatars/'+response.user.id+'/'+response.user.avatar+'.png'
                    imgAvatar.classList.add('imgAvatar')
                    let uName = document.createElement('p')
                    uName.style.fontWeight='bold'
                    uName.innerText=response.user.username
                    divHead.appendChild(imgAvatar)
                    divHead.appendChild(uName)
                    divElem.appendChild(divHead)
                    divElem.id=('divElem'+row)
                    let question = document.createElement('p')
                    let uResponse = document.createElement('span')
                    let parsedResponse = data.question.replace('§', response.hole)
                    question.innerText=parsedResponse
                    divContent.appendChild(divHead)
                    divContent.appendChild(question)
                    divElem.appendChild(divContent)
                    masterDiv.appendChild(divElem)
                } else {
                    elems=1
                    row++
                    let divElem=document.createElement('div')
                    let divContent = document.createElement('div')
                    divContent.classList.add('responseDiv')
                    let divHead=document.createElement('div')
                    divHead.classList.add('nameHead')
                    let imgAvatar = document.createElement('img')
                    imgAvatar.src='https://cdn.discordapp.com/avatars/'+response.user.id+'/'+response.user.avatar+'.png'
                    imgAvatar.classList.add('imgAvatar')
                    let uName = document.createElement('p')
                    uName.style.fontWeight='bold'
                    uName.innerText=response.user.username
                    divHead.appendChild(imgAvatar)
                    divHead.appendChild(uName)
                    divElem.id=('divElem'+row)
                    let question = document.createElement('p')
                    let parsedResponse = data.question.replace('§', response.hole)
                    question.innerText=parsedResponse
                    divElem.classList.add('listDiv')
                    console.log(divElem)
                    divContent.appendChild(divHead)
                    divContent.appendChild(question)
                    divElem.appendChild(divContent)
                    masterDiv.appendChild(divElem)
                }
            }
            let parsedSentence= data.question.replace('§', "<input type='text' id='responseInput' placeholder='Amaury...'>")
            sm.playSound('beep')
            sentence.innerHTML=parsedSentence
        } else if (data.op===25){
            document.location.href='index.html'
        }
    })
})

function update(){
    
}

nextDiapo.addEventListener('click',()=>{
    ws.send(JSON.stringify({
        op: 22,
        uuid: uuid,
    }));
})

TEST.addEventListener('click',()=>{
    ws.send(JSON.stringify({
        op: 40,
    }));
})