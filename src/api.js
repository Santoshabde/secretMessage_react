// ------------------------------------------------------------------
// TEMPORARY FAKE BACKEND
// Everything here pretends to be the Spring Boot server.
// Later we will replace these functions with real calls (fetch)
// to your Spring Boot app. The pages will not need to change.
//
// Users and inboxes are kept in this browser's localStorage, so you can
// send a secret, log out, log in as the other person, and read it.
// ------------------------------------------------------------------

const USERS_KEY = "sm_fake_users";
const INBOX_KEY = "sm_fake_inboxes";
const pendingCodes = {}; // phone -> code waiting to be verified

const SAMPLE_TEXT =
  "Meet me at the old bookshop on MG Road at 6. Come alone and bring the blue notebook. " +
  "Once you finish reading this, it will be gone for good.";

// ---------- storage helpers ----------
function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// Older test accounts had a name but no username. Give them one.
function loadUsers() {
  const users = load(USERS_KEY);
  for (const u of Object.values(users)) {
    if (!u.username) u.username = cleanUsername(u.name || "user" + u.phone.slice(-4));
  }
  return users;
}

function wait(ms = 600) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Lowercase letters, numbers, dot and underscore. Nothing else.
export function cleanUsername(value) {
  return value.toLowerCase().replace(/^@/, "").replace(/[^a-z0-9._]/g, "").slice(0, 20);
}

function userByUsername(users, username) {
  const wanted = cleanUsername(username);
  return Object.values(users).find((u) => u.username === wanted) || null;
}

// Puts the demo secret from Arjun in the inbox if it isn't there already.
function seedSampleMessage(phone) {
  const inboxes = load(INBOX_KEY);
  const list = inboxes[phone] || [];
  if (!list.some((m) => m.demo)) {
    list.push({
      id: "demo-" + Date.now(),
      demo: true,
      fromName: "Arjun",
      sentAt: Date.now() - 2 * 60 * 1000,
      burnAfterSeconds: 10,
      text: SAMPLE_TEXT,
    });
  }
  inboxes[phone] = list;
  save(INBOX_KEY, inboxes);
}

// ---------- register ----------
// Step 1: check the username and number are free, then "send" a code.
export async function requestRegisterCode(username, phone) {
  await wait();
  const users = loadUsers();
  const clean = cleanUsername(username);
  if (clean.length < 3) {
    throw new Error("Usernames need at least 3 letters or numbers.");
  }
  if (users[phone]) {
    throw new Error("This number already has an account. Log in instead.");
  }
  if (userByUsername(users, clean)) {
    throw new Error(`@${clean} is taken. Try another username.`);
  }
  const code = makeCode();
  pendingCodes[phone] = { code, username: clean };
  console.log(`[fake SMS] Code for ${phone}: ${code}`);
  return { devCode: code }; // the real server will NOT return this
}

// Step 2: check the code and create the account.
export async function verifyRegisterCode(phone, code) {
  await wait();
  const pending = pendingCodes[phone];
  if (!pending || pending.code !== code) {
    throw new Error("That code is wrong. Check the SMS and try again.");
  }
  const users = loadUsers();
  users[phone] = { username: pending.username, name: pending.username, phone };
  save(USERS_KEY, users);
  delete pendingCodes[phone];
  seedSampleMessage(phone);
  return users[phone];
}

// ---------- login ----------
export async function requestLoginCode(phone) {
  await wait();
  const users = loadUsers();
  if (!users[phone]) {
    throw new Error("No account with this number. Create one first.");
  }
  const code = makeCode();
  pendingCodes[phone] = { code };
  console.log(`[fake SMS] Code for ${phone}: ${code}`);
  return { devCode: code };
}

export async function verifyLoginCode(phone, code) {
  await wait();
  const pending = pendingCodes[phone];
  if (!pending || pending.code !== code) {
    throw new Error("That code is wrong. Check the SMS and try again.");
  }
  delete pendingCodes[phone];
  const users = loadUsers();
  save(USERS_KEY, users); // keeps any username we just filled in
  seedSampleMessage(phone);
  return users[phone];
}

// ---------- sending ----------
// Checks whether someone has this username. Returns their public info only.
export async function findUser(username) {
  await wait(250);
  const u = userByUsername(loadUsers(), username);
  return u ? { username: u.username, name: u.name } : null;
}

export async function sendMessage(fromUser, toUsername, text, burnAfterSeconds) {
  await wait(500);
  const users = loadUsers();
  const to = userByUsername(users, toUsername);
  if (!to) {
    throw new Error(`No one is called @${cleanUsername(toUsername)}. Check the username.`);
  }
  if (!text.trim()) {
    throw new Error("Write something before sending.");
  }
  const inboxes = load(INBOX_KEY);
  inboxes[to.phone] = inboxes[to.phone] || [];
  inboxes[to.phone].push({
    id: "m-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    fromName: "@" + fromUser.username,
    sentAt: Date.now(),
    burnAfterSeconds,
    text: text.trim(),
  });
  save(INBOX_KEY, inboxes);
  return { to: to.username };
}

// ---------- receiving ----------
// List of secrets waiting for this user, newest first. The text is NOT
// included, so nobody can read a secret without opening (and burning) it.
export async function getInbox(phone) {
  await wait(300);
  const list = load(INBOX_KEY)[phone] || [];
  return list
    .map(({ text, ...rest }) => rest)
    .sort((a, b) => b.sentAt - a.sentAt);
}

// Opening a secret removes it from the "server" straight away.
// It can never be fetched again, even if the page is refreshed.
export async function openMessage(phone, id) {
  await wait(400);
  const inboxes = load(INBOX_KEY);
  const list = inboxes[phone] || [];
  const index = list.findIndex((m) => m.id === id);
  if (index === -1) {
    throw new Error("This secret has already been burned.");
  }
  const [message] = list.splice(index, 1);
  inboxes[phone] = list;
  save(INBOX_KEY, inboxes);
  return message;
}
