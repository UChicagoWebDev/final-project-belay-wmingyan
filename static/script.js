const UNAUTHPAGE = document.querySelector(".unauth");
const AUTHPAGE = document.querySelector(".auth");
const WORKSPACE = document.querySelector(".workspace");
const PROFILE = document.querySelector(".profile");

let CURRENT_CHANNEL = -1;
let LOGIN_STATE = false;
let MAX_MESSAGE_ID = 0;
let MAX_REPLY_ID = 0;
let CURRENT_MESSAGE = -1;

function router(path) {
  //console.log("line11"+LOGIN_STATE);

  UNAUTHPAGE.classList.add("hide");
  AUTHPAGE.classList.add("hide");
  WORKSPACE.classList.add("hide");
  PROFILE.classList.add("hide");
  closeChannel();
  closeThread();

  document.querySelector(".channelsbox").classList.add("narrowhide");
  document.querySelector(".messagesbox").classList.add("narrowhide");
  document.querySelector(".threadbox").classList.add("narrowhide");

  //console.log("router: " + path);
  if (localStorage.getItem("mingyan_belay_auth_key") != null) {
    LOGIN_STATE = true;
  }

  if (LOGIN_STATE) {
    //console.log("line29");
    AUTHPAGE.classList.remove("hide");
    UNAUTHPAGE.classList.add("hide");
  } 
  else {
    //console.log("line34");
    AUTHPAGE.classList.add("hide");
    UNAUTHPAGE.classList.remove("hide");
    showSignupLogin();
  }

  if (path == null) {
    path = window.location.pathname;
    //console.log(path);
  }
  window.history.pushState(null, null, path);

  CURRENT_CHANNEL = -1;
  MAX_MESSAGE_ID = 0;
  MAX_REPLY_ID = 0;
  CURRENT_MESSAGE = -1;
  if (LOGIN_STATE) {
    //console.log("line45"+LOGIN_STATE);
    if (path == "/") {
      WORKSPACE.classList.remove("hide");
      document.querySelector(".channelsbox").classList.remove("narrowhide");
    } 
    else if (path == "/profile") {
      PROFILE.classList.remove("hide");
    }
    else if (path.startsWith("/channels/")) {
      WORKSPACE.classList.remove("hide");
      let parts = path.split("/");
      //console.log(parts);
      CURRENT_CHANNEL = parseInt(parts[2])
      document.querySelector(".messagesbox").classList.remove("narrowhide");
      openChannel(CURRENT_CHANNEL);
      if (parts.length > 4 && parts[3] == "replies") {
        CURRENT_MESSAGE = parseInt(parts[4]);
        document.querySelector(".messagesbox").classList.add("narrowhide");
        document.querySelector(".threadbox").classList.remove("narrowhide");
        openThread(CURRENT_MESSAGE);
      }
    }
    else {
      window.location.replace("/404");
    }
  }
}

window.addEventListener("DOMContentLoaded", router());
window.addEventListener("popstate", () => router());

setInterval(() => {
  if (CURRENT_CHANNEL == -1) {
    return;
  }
  getMessages(CURRENT_CHANNEL);
}, 1000);

setInterval(() => {
  if (CURRENT_MESSAGE == -1) {
    return;
  }
  getReplies(CURRENT_MESSAGE);
}, 1000);

setInterval(() => {
  if (LOGIN_STATE == false) {
    return;
  }
  getChannelUnreads();
}, 1000);


function gohome() {
  router("/");
}

function gotologin() {
  document.querySelector(".gotologin").classList.add("hide");
  document.querySelector(".gotosignup").classList.add("hide");
  document.querySelector(".loginForm").classList.remove("hide");
}

function gotosignup() {
  document.querySelector(".gotologin").classList.add("hide");
  document.querySelector(".gotosignup").classList.add("hide");
  document.querySelector(".signupForm").classList.remove("hide");
}

function showSignupLogin() {
  document.querySelector(".gotologin").classList.remove("hide");
  document.querySelector(".gotosignup").classList.remove("hide");
  document.querySelector(".signupForm").classList.add("hide");
  document.querySelector(".loginForm").classList.add("hide");
}

function openChannel(channel_id) {
  fetch("/api/channel/get_channel_name/" + channel_id, {
    method: "GET",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    },
  })
  .then(response => response.json())
  .then(responseBody => {
    //console.log("openChannel: " + responseBody.name);
    let channelTitle = document.querySelector(".channelTitle");
    channelTitle.replaceChildren();
    channelTitle.appendChild(document.createTextNode(responseBody.name));
    document.querySelector(".inChannelView").classList.remove("hide");
    document.querySelector(".outChannelView").classList.add("hide");
    document.querySelector(".postMessage > button").setAttribute("onclick", "postMessage(" + channel_id + ")");
    document.querySelector(".postReply > button").setAttribute("onclick", "postReplies(" + channel_id + ")");
    document.querySelector(".messagesList").replaceChildren();
  });
}

function closeChannel() {
  document.querySelector(".inChannelView").classList.add("hide");
  document.querySelector(".outChannelView").classList.remove("hide");
  document.querySelector(".messagesList").replaceChildren();
  CURRENT_CHANNEL = -1;
  MAX_MESSAGE_ID = 0;
  MAX_REPLY_ID = 0;
}

function openThread(message_id) {
  document.querySelector(".threadbox").classList.remove("hide");
  MAX_REPLY_ID = 0;
  document.querySelector("input#replies_to").setAttribute("value", message_id);
  getReplies(message_id);
  CURRENT_MESSAGE = message_id;
  document.querySelector(".threadTitle > button.narrowhide").setAttribute("onclick",  "router('/channels/" + CURRENT_CHANNEL + "')");
  document.querySelector(".threadTitle > button.widehide").setAttribute("onclick",  "router('/channels/" + CURRENT_CHANNEL + "')");
  
}

function closeThread() {
  document.querySelector(".threadbox").classList.add("hide");
  MAX_REPLY_ID = 0;
  CURRENT_MESSAGE = -1;
}

function signup() {
  fetch("/api/user/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({username: document.querySelector("input#signupUsername").value, password: document.querySelector("input#signupPassword").value})
  })
  .then(response => response.json())
  .then(responseBody => {
    //console.log(responseBody);
    if (responseBody.auth_key == "") {
      //console.log("auth key empty");
    }
    else {
      localStorage.setItem("mingyan_belay_auth_key", responseBody.auth_key);
      document.cookie = "mingyan_belay_auth_key=" + responseBody.auth_key;
      // AUTHPAGE.classList.remove("hide");
      // UNAUTHPAGE.classList.add("hide");
      LOGIN_STATE = true;
      gohome();
    }
  });
}

function login() {
  fetch("/api/user/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({username: document.querySelector("input#loginUsername").value, password: document.querySelector("input#loginPassword").value})
  })
  .then(response => response.json())
  .then(responseBody => {
    //console.log(responseBody);
    if (responseBody.auth_key == "") {
      //console.log("auth key empty");
      alert("bad credentials");
    }
    else {
      localStorage.setItem("mingyan_belay_auth_key", responseBody.auth_key);
      document.cookie = "mingyan_belay_auth_key=" + responseBody.auth_key;
      // AUTHPAGE.classList.remove("hide");
      // UNAUTHPAGE.classList.add("hide");
      LOGIN_STATE = true;
      //console.log("line136"+LOGIN_STATE);
      gohome();
    }
  });
}

function logout() {
  fetch("/api/user/logout", {
    method: "POST",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    },
  })
  .then(response => response.json())
  .then(responseBody => {
    //console.log("logout" + responseBody);
    localStorage.removeItem("mingyan_belay_auth_key");
    document.cookie = document.cookie + ";max-age=0";
    // AUTHPAGE.classList.add("hide");
    // UNAUTHPAGE.classList.remove("hide");
    // showSignupLogin();
    LOGIN_STATE = false;
    gohome();
  });
}

function authenticate() {
  fetch("/api/user/authentication", {
    method: "GET",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    },
  })
  .then(response => response.json())
  .then(responseBody => {
    //console.log("authenticate: " + responseBody.status);
    if (responseBody.status == "success") {
      LOGIN_STATE = true;
    } else {
      LOGIN_STATE = false;
    }
  });
}

function changeUsername() {
  fetch("/api/user/change_username", {
    method: "POST",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({username: document.querySelector("input#changeUsername").value})
  });
}

function changePassword() {
  fetch("/api/user/change_password", {
    method: "POST",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({password: document.querySelector("input#changePassword").value})
  });
}

function openCreateChannel() {
  document.querySelector(".createChannelButton").classList.add("hide");
  document.querySelector(".channelCreateForm").classList.remove("hide");
}

function closeCreateChannel() {
  document.querySelector(".createChannelButton").classList.remove("hide");
  document.querySelector(".channelCreateForm").classList.add("hide");
}

function createChannel() {
  fetch("/api/channel/create_channel", {
    method: "POST",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({name: document.querySelector("input#createChannelName").value})
  })
  .then(response => response.json())
  .then(responseBody => {
    //console.log(responseBody.id);
    joinChannel(responseBody.id);
  });
  closeCreateChannel();
}

function getChannelUnreads() {
  fetch("/api/channel/get_channel_unreads", {
    method: "GET",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(channels => {
    //console.log(channels);
    let channelsList = document.querySelector(".channelsList > ul");
    channelsList.replaceChildren();
    channels.map(chan => {
      //console.log(chan.name);
      let li = document.createElement("li");
      let p = document.createElement("p");
      if (chan.id == CURRENT_CHANNEL) {
        p.setAttribute("class", "channelName curChan");
      }
      else {
        p.setAttribute("class", "channelName");
      }
      p.setAttribute("onclick", "router('/channels/" + chan.id + "')");
      p.appendChild(document.createTextNode(chan.name));
      li.appendChild(p);
      if (chan.count != 0) {
        li.appendChild(document.createTextNode(" (" + chan.count + " unread)"));
      }
      channelsList.appendChild(li);
    })
  });
}


function getMessages(channel_id) {
  fetch("/api/message/get_messages", {
    method: "POST",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({channel_id: channel_id})
  })
  .then(response => response.json())
  .then(messages => {
    //console.log(messages);//jsonify([{"id": msg[0], "author_name": msg[1], "body": msg[2], "num_replies": msg[3],
                                  // "reactions": [e[0] for e in query_db("SELECT emoji FROM reactions WHERE message_id = (?) GROUP BY emoji", (str(msg[0]))) or []]}
                                  // for msg in msgs])
    let messagesList = document.querySelector(".messagesList");
    // messagesList.replaceChildren();
    if (messages.length == 0) {
      messagesList.replaceChildren();
      let p = document.createElement("p");
      p.appendChild(document.createTextNode("No message in the channel."))
      p.setAttribute("class", "nomessage center");
      p.setAttribute("style", "margin-top: 40vh;");
      messagesList.appendChild(p);
    }
    else {
      let nomsg = document.querySelector(".nomessage");
      if (nomsg != null) {
        nomsg.classList.add("hide");
      }
      messages.map(m => {
        if (m.id > MAX_MESSAGE_ID) {
          MAX_MESSAGE_ID = m.id;
          let messageEntry = document.createElement("div");
          messageEntry.setAttribute("id", m.id);
          messageEntry.setAttribute("class", "messageEntry"+m.id);
          let pname = document.createElement("p");
          pname.setAttribute("style", "font-weight: bold;");
          pname.appendChild(document.createTextNode("From: " + m.author_name));
          let pbody = document.createElement("p");
          pbody.appendChild(document.createTextNode(m.body));
          messageEntry.appendChild(pname);
          messageEntry.appendChild(pbody);
          let imageUrlRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif))/gi;
          let imageUrls = m.body.match(imageUrlRegex);
          if (imageUrls) {
              imageUrls.map(url => {
                  let img = document.createElement("img");
                  img.setAttribute("src", url);
                  messageEntry.append(img);
              });
          }
          if (m.num_replies != 0) {
            let pnum = document.createElement("p");
            pnum.setAttribute("style", "font-weight: lighter;");
            let a = document.createElement("a");
            a.setAttribute("href", "#");
            a.setAttribute("onclick", "router('/channels/"+ channel_id +"/replies/"+ m.id +"')");
            a.appendChild(document.createTextNode("View " + m.num_replies + " replies"));
            pnum.appendChild(a);
            messageEntry.appendChild(pnum);
          }
          let replybutton = document.createElement("button");
          replybutton.setAttribute("class", "replyButton right");
          replybutton.setAttribute("onclick", "router('/channels/"+ channel_id +"/replies/"+ m.id +"')");
          replybutton.appendChild(document.createTextNode("Reply"));
          messageEntry.appendChild(replybutton);
          let addReactionButton = document.createElement("button");
          addReactionButton.setAttribute("class", "right addReactionButton" + m.id);
          addReactionButton.setAttribute("onclick", "showAddReactions(" + m.id + ")");
          addReactionButton.appendChild(document.createTextNode("Add reaction"));
          messageEntry.appendChild(addReactionButton);
          messagesList.appendChild(messageEntry);
          let addedReactions = document.createElement("div");
          addedReactions.setAttribute("class", "addedReactions"+m.id);
          m.reactions.map(emoji => {
            let button = document.createElement("button");
            button.setAttribute("class", "emojiButton"+ m.id + emoji);
            button.setAttribute("onmouseover", "getReactionUsers(" + m.id + ", '" + emoji + "')");
            button.setAttribute("onmouseleave", "hideReactionUsers(" + m.id + ", '" + emoji + "')");
            button.appendChild(document.createTextNode(emoji));
            addedReactions.appendChild(button);
          })
          messageEntry.appendChild(addedReactions);
          let brdiv = document.createElement("div");
          brdiv.setAttribute("class", "brdiv"+m.id);
          if (m.reactions.length == 0) {
            brdiv.appendChild(document.createElement("br"));
            brdiv.appendChild(document.createElement("br"));
            messageEntry.appendChild(brdiv);
          }
          messagesList.appendChild(document.createElement("hr"));
        }
        else {
          let addedReactions = document.querySelector(".addedReactions" + m.id);
          if (addedReactions) {
            addedReactions.replaceChildren();
            m.reactions.map(emoji => {
              let button = document.createElement("button");
              button.setAttribute("class", "emojiButton"+ m.id + emoji);
              button.setAttribute("onmouseover", "getReactionUsers(" + m.id + ", '" + emoji + "')");
              button.setAttribute("onmouseleave", "hideReactionUsers(" + m.id + ", '" + emoji + "')");
              button.appendChild(document.createTextNode(emoji));
              addedReactions.appendChild(button);
            })
          }
          if (m.reactions.length != 0) {
            let brdiv = document.querySelector(".brdiv"+m.id);
            if (brdiv != null) {
              brdiv.replaceChildren();
            }
          }
        }
      })
    }
    
  });
}
                            

function postMessage(channel_id) {
  fetch("/api/message/post_message", {
    method: "POST",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({channel_id: channel_id, body: document.querySelector("textarea#postMessage").value})
  })
  .then(response => response.json())
  .then(responseBody => {
    //console.log(responseBody.status);
  });
}

function getReplies(message_id) {
  fetch("/api/message/get_message/" + message_id, {
    method: "GET",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(m => {
    //console.log(m);
    let repliedMessageEntry = document.querySelector(".repliedMessageEntry");
    repliedMessageEntry.replaceChildren();
    let pname = document.createElement("p");
    pname.setAttribute("style", "font-weight: bold;");
    pname.appendChild(document.createTextNode("From: " + m.author_name));
    let pbody = document.createElement("p");
    pbody.appendChild(document.createTextNode(m.body));
    repliedMessageEntry.appendChild(pname);
    repliedMessageEntry.appendChild(pbody);
    //console.log("message done");
  });

  //console.log("going to get replies");
  fetch("/api/message/get_replies/" + message_id, {
    method: "GET",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(replies => {
    //console.log(replies);  //jsonify([{"id": reply[0], "author_id": reply[1], "body": reply[3],
                                // "reactions": [e[0] for e in query_db("SELECT emoji FROM reactions WHERE message_id = (?) GROUP BY emoji", (str(reply[0]))) or []]}
                                //   for reply in replies])
    
    //console.log("start working on replies");
    let repliesList = document.querySelector(".repliesList");
    if (replies.length == 0) {
      repliesList.replaceChildren();
      let p = document.createElement("p");
      p.appendChild(document.createTextNode("No reply to the message."))
      p.setAttribute("class", "noreply center");
      p.setAttribute("style", "margin-top: 20vh;");
      repliesList.appendChild(p);
    }
    else {
      let noreply = document.querySelector(".noreply");
      if (noreply != null) {
        noreply.classList.add("hide");
      }
      replies.map(m => {
        //console.log("m.id"+m.id);
        //console.log("MAX_REPLY_ID"+MAX_REPLY_ID);
        if (m.id > MAX_REPLY_ID) {

          MAX_REPLY_ID = m.id;
          let replyEntry = document.createElement("div");
          replyEntry.setAttribute("id", m.id);
          replyEntry.setAttribute("class", "replyEntry"+m.id);
          let pname = document.createElement("p");
          pname.setAttribute("style", "font-weight: bold;");
          pname.appendChild(document.createTextNode("From: " + m.author_name));
          let pbody = document.createElement("p");
          pbody.appendChild(document.createTextNode(m.body));
          
          replyEntry.appendChild(pname);
          replyEntry.appendChild(pbody);
          let addReactionButton = document.createElement("button");
          addReactionButton.setAttribute("class", "right addReactionButton" + m.id);
          addReactionButton.setAttribute("onclick", "showAddReactions(" + m.id + ")");
          addReactionButton.appendChild(document.createTextNode("Add reaction"));
          replyEntry.appendChild(addReactionButton);
          repliesList.appendChild(replyEntry);
          let addedReactions = document.createElement("div");
          addedReactions.setAttribute("class", "addedReactions"+m.id);
          m.reactions.map(emoji => {
            let button = document.createElement("button");
            button.setAttribute("class", "emojiButton"+ m.id + emoji);
            button.setAttribute("onmouseover", "getReactionUsers(" + m.id + ", '" + emoji + "')");
            button.setAttribute("onmouseleave", "hideReactionUsers(" + m.id + ", '" + emoji + "')");
            button.appendChild(document.createTextNode(emoji));
            addedReactions.appendChild(button);
          })
          replyEntry.appendChild(addedReactions);
          let brdiv = document.createElement("div");
          brdiv.setAttribute("class", "brdiv"+m.id);
          if (m.reactions.length == 0) {
            brdiv.appendChild(document.createElement("br"));
            brdiv.appendChild(document.createElement("br"));
            replyEntry.appendChild(brdiv);
          }
          repliesList.appendChild(document.createElement("hr"));
        }
        else {
          document.querySelector(".addedReactions" + m.id).replaceChildren();
          m.reactions.map(emoji => {
            let button = document.createElement("button");
            button.setAttribute("class", "emojiButton"+ m.id + emoji);
            button.setAttribute("onmouseover", "getReactionUsers(" + m.id + ", '" + emoji + "')");
            button.setAttribute("onmouseleave", "hideReactionUsers(" + m.id + ", '" + emoji + "')");
            button.appendChild(document.createTextNode(emoji));
            document.querySelector(".addedReactions" + m.id).appendChild(button);
          })
          if (m.reactions.length != 0) {
            let brdiv = document.querySelector(".brdiv"+m.id);
            if (brdiv != null) {
              brdiv.replaceChildren();
            }
          }
        }
      })
    }
  });
}


function postReplies(channel_id) {
  fetch("/api/message/post_reply", {
    method: "POST",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({channel_id: channel_id, 
                          body: document.querySelector("textarea#postReplies").value, 
                          replies_to: document.querySelector("input#replies_to").value})
  })
  .then(response => response.json())
  .then(responseBody => {
    //console.log(responseBody.status);
  });
}


function getReactionUsers(message_id, emoji) {
  fetch("/api/reactions/get_reaction_users/" + message_id + "/" + emoji, {
    method: "GET",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    }
  })
  .then(response => response.json())
  .then(usernames => {
    //console.log(usernames);  //jsonify([u[0] for u in usernames])
    let button = document.querySelector(".emojiButton" + message_id + emoji);
    button.replaceChildren();
    let text = "From: ";
    usernames.map(name => {
      text = text + name + ", "
    })
    text = text.slice(0, -2);
    button.appendChild(document.createTextNode(emoji + text));
  });
}

function hideReactionUsers(message_id, emoji) {
  let button = document.querySelector(".emojiButton" + message_id + emoji);
  button.replaceChildren();
  button.appendChild(document.createTextNode(emoji));
}

function showAddReactions(message_id) {
  let button = document.querySelector(".addReactionButton" + message_id);
  button.replaceChildren();
  let emojis = ["👍","✅","🙌","😀","👀"];
  emojis.map(e => {
    let eobj = document.createElement("b");
    eobj.setAttribute("class", "emoji");
    eobj.setAttribute("onclick", "addReaction(" + message_id + ", '" + e + "')");
    if (e == "👀") {
      eobj.appendChild(document.createTextNode(" " + e + " "));
    }
    else {
      eobj.appendChild(document.createTextNode(" " + e + " |"));
    }
    
    button.appendChild(eobj);
  })
}

function addReaction(message_id, emoji) {
  fetch("/api/reactions/add_reaction", {
    method: "POST",
    headers: {
      "X-API-KEY": localStorage.getItem("mingyan_belay_auth_key"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({emoji: emoji, message_id: message_id})
  })
  .then(response => response.json())
  .then(responseBody => {
    //console.log(responseBody.status);
    let button = document.querySelector(".addReactionButton" + message_id);
    button.appendChild(document.createTextNode(" Added: " + emoji + "+1"));
  });
}

