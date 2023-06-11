//let ws = new WebSocket('ws://localhost:8081')

//let wsOpen = false

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

let username = false

//ws.onopen=function(){wsOpen=true};

let cookies = {}

let whitelist = ['383637400099880964', '1109789034512920636', '291632492622905354']

for(const el of document.cookie.split("; ")){
    cookies[el.split("=")[0]] = el.split("=")[1]
}
console.log(cookies)

if(cookies.discord_token){
    fetch('https://discord.com/api/users/@me', {
        headers:{Authorization:'Bearer '+cookies.discord_token}
        }).then(res => {
            if(res.status===401){
                alert('Un problème est survenu. Merci de vous reconnecter.')
                document.location.href='https://discord.com/api/oauth2/authorize?client_id=1102519610848313344&redirect_uri=http%3A%2F%2F127.0.0.1%3A5500%2Fverify.html&response_type=token&scope=identify'
            } else {
                res.json().then(usr => { 
                    if(whitelist.includes(usr.id)){
                        console.log(usr)
                        const weweOnAttends = async() => {
                            let int = setInterval(function(){
                                if(true||wsOpen){
                                    function setLocalVars() {
                                        localStorage.setItem('dUsername',usr.username)
                                        localStorage.setItem('dId',usr.id)
                                        localStorage.setItem('dAvatarUrl',usr.avatar)
                                        localStorage.setItem('dAvatar', 'https://cdn.discordapp.com/avatars/'+usr.id+'/'+usr.avatar+'.png')
                                        localStorage.setItem('dObject',JSON.stringify(usr))
                                    }
                                    clearInterval(int)
                                    //ws.send(JSON.stringify({op: 1, exept: 'VERIFICATION', username: usr.username}))
                                    setInterval(setLocalVars)
                                }
                            })
                        }
                        weweOnAttends()
                    } else {
                        alert('Votre ID discord n\'est pas renseigné en whitelist.')
                        document.location.href='https://discord.com/api/oauth2/authorize?client_id=1102519610848313344&redirect_uri=http%3A%2F%2F127.0.0.1%3A5500%2Fverify.html&response_type=token&scope=identify'
                    }
                })
            }
        })
} else {
    alert('erreur 1')
    document.location.href='https://discord.com/api/oauth2/authorize?client_id=1102519610848313344&redirect_uri=http%3A%2F%2F127.0.0.1%3A5500%2Fverify.html&response_type=token&scope=identify'
}
