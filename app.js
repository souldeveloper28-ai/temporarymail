const API = "https://api.mail.tm";
let token = "";
let inbox = [];
let seen = new Set();

// browser notification (optional but allowed)
if ("Notification" in window) {
  Notification.requestPermission();
}

async function newMail() {
  inbox = [];
  seen.clear();
  document.getElementById("inbox").innerHTML = "Loading...";

  const domains = await fetch(API + "/domains").then(r => r.json());
  const domain = domains["hydra:member"][0].domain;

  const email =
    Math.random().toString(36).slice(2, 10) + "@" + domain;
  const password = Math.random().toString(36);

  await fetch(API + "/accounts", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ address: email, password })
  });

  const t = await fetch(API + "/token", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ address: email, password })
  }).then(r => r.json());

  token = t.token;
  document.getElementById("email").innerText = email;
}

async function checkInbox() {
  if (!token) return;

  const res = await fetch(API + "/messages", {
    headers: { Authorization: "Bearer " + token }
  }).then(r => r.json());

  res["hydra:member"].forEach(m => {
    if (seen.has(m.id)) return;
    seen.add(m.id);
    inbox.unshift(m);

    if (Notification.permission === "granted") {
      new Notification("📩 New Mail", {
        body: m.subject || "New email received"
      });
    }
  });

  renderInbox();
}

function renderInbox() {
  const q = document.getElementById("search").value.toLowerCase();
  const box = document.getElementById("inbox");
  box.innerHTML = "";

  inbox
    .filter(m =>
      (m.subject || "").toLowerCase().includes(q) ||
      m.from.address.toLowerCase().includes(q)
    )
    .forEach(m => {
      const div = document.createElement("div");
      div.className = "mail";
      div.innerText = "📩 " + (m.subject || "(no subject)");
      div.onclick = () => readMail(m.id);
      box.appendChild(div);
    });
}

async function readMail(id) {
  const mail = await fetch(API + "/messages/" + id, {
    headers: { Authorization: "Bearer " + token }
  }).then(r => r.json());

  document.getElementById("mailContent").innerText =
    "From: " + mail.from.address + "\n\n" +
    (mail.text || mail.html || "");

  document.getElementById("mailView").classList.remove("hidden");
}

function closeMail() {
  document.getElementById("mailView").classList.add("hidden");
}

newMail();
setInterval(checkInbox, 1000); // ⚡ 1 second