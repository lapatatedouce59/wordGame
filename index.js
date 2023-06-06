let loggedUser = document.getElementById('loggedUser')
loggedUser.innerText=localStorage.getItem('dUsername')
let discordAvatar = document.getElementById('discordAvatar')
discordAvatar.src=localStorage.getItem('dAvatar')
