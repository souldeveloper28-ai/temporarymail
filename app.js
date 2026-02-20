const API="https://api.mail.tm";
let token="", inbox=[], seen=new Set();

async function newMail(){
  inbox=[]; seen.clear(); renderInbox();

  const d=await fetch(API+"/domains").then(r=>r.json());
  const domain=d["hydra:member"][0].domain;

  const email=Math.random().toString(36).slice(2,10)+"@"+domain;
  const password=Math.random().toString(36);

  await fetch(API+"/accounts",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({address:email,password})
  });

  const t=await fetch(API+"/token",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({address:email,password})
  }).then(r=>r.json());

  token=t.token;
  document.getElementById("email").innerText=email;
}

async function refreshInbox(){
  if(!token) return;

  const r=await fetch(API+"/messages",{
    headers:{Authorization:"Bearer "+token}
  }).then(r=>r.json());

  r["hydra:member"].forEach(m=>{
    if(seen.has(m.id)) return;
    seen.add(m.id);
    inbox.unshift(m);
  });

  renderInbox();
}

function renderInbox(){
  const box=document.getElementById("inbox");
  box.innerHTML="";

  if(inbox.length===0){
    box.innerHTML=`<div class="empty">Your inbox is empty</div>`;
    return;
  }

  inbox.forEach(m=>{
    const d=document.createElement("div");
    d.className="mail";
    d.textContent="📩 "+(m.subject||"No subject");
    d.addEventListener("click",()=>openMail(m.id));
    box.appendChild(d);
  });
}

async function openMail(id){
  const r=await fetch(API+"/messages/"+id,{
    headers:{Authorization:"Bearer "+token}
  }).then(r=>r.json());

  document.getElementById("modal-subject").innerText=r.subject||"No subject";
  document.getElementById("modal-body").innerText=
    r.text || (r.html ? r.html.replace(/<[^>]*>/g,"") : "Empty mail");

  document.getElementById("modal").classList.remove("hidden");
}

function closeMail(){
  document.getElementById("modal").classList.add("hidden");
}

function copyMail(){
  navigator.clipboard.writeText(document.getElementById("email").innerText);
}

function clearInbox(){
  inbox=[]; seen.clear(); renderInbox();
}

newMail();
setInterval(refreshInbox,1000);
