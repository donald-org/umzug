import { readFileSync, writeFileSync, rmSync, readdirSync } from 'fs';
import './md';
import { toHtml as bbcodeToHtml, toMd } from './bbcode';
import { toHtml } from './md';

for (let path of [
  'data/output/users',
  'data/output/threads',
  'data/output/posts',
  'data/output/dms',
  'data/output/images',
  'data/output/urls',
  'data/output/image-data',
]) {
  readdirSync(path).forEach((file) => rmSync(`${path}/${file}`));
}

const json = readFileSync('data/input/donaldsql1.json', 'utf8');
const data: {
  type: string;
  name: string;
  data: unknown[];
}[] = JSON.parse(json);

const datetime = (date: Date) =>
  date.toISOString().slice(0, 19).replace('T', ' ');

type User = {
  name: string;
  password: string | null;
  email: string;
  googleEmail: string | null;
  githubEmail: string | null;
  discordEmail: string | null;
  displayName: string;
  groups: string;
  buttons: string;
  lastActive: string;
  created: string;
  biography: string | null;
  avatarId: string | null;
  url: string | null;
  legacyId: number | null;
  legacyPassword: string | null;
  public: boolean;
};
type Thread = {
  id: string;
  title: string;
  author: string;
  posts: number;
  created: string;
  updated: string;
  parent: string | null;
  root: string | null;
  mode: string;
  closed: boolean;
  pinned: boolean;
};
type Post = {
  id: string;
  thread: string;
  author: string;
  md: string;
  html: string;
  created: string;
  updated: string;
};

const users: Record<string, User> = {};
const threads: Thread[] = [];
const posts: Post[] = [];
const dms = [];
const urls: { hash: string; url: string }[] = [];
const images: Record<string, Buffer> = {};

function generateFileId(i: number) {
  const str = i.toString(36);
  return '0'.repeat(4 - str.length) + str;
}

function numberToId(n: number) {
  const hexString = n.toString(16);
  const bytes = new Uint8Array(
    hexString.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
  );
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(bytes)));
  return base64.replace(/=/g, '').replace(/\//g, '_').replace(/\+/g, '-');
}

function parseUsers(data: unknown[]) {
  (
    data as {
      user_id: string;
      username: string;
      password: string;
      email: string;
      admin: string;
      date_added: string;
      date_last_active: string;
      real_name: string;
    }[]
  ).forEach((user, i) => {
    console.log(
      `Konvertiere Nutzerkonto "${user.username}"... (${i + 1}/${data.length})`
    );
    if (user.user_id === '7084') return; // wir haben schon nen Admin-Account
    users[user.user_id] = {
      name: user.username
        .toLowerCase()
        .replaceAll(' ', '_')
        .replaceAll('ö', 'oe')
        .replaceAll('ä', 'ae')
        .replaceAll('ü', 'ue')
        .replaceAll('ß', 'ss')
        .replaceAll(/[^a-z0-9_]/g, ''),
      password: user.password,
      email: user.email,
      googleEmail: null,
      githubEmail: null,
      discordEmail: null,
      displayName: user.username,
      groups: user.admin === '1' ? 'admin' : '',
      buttons: '',
      lastActive: datetime(new Date(parseInt(user.date_last_active) * 1000)),
      created: datetime(new Date(parseInt(user.date_added) * 1000)),
      biography: null,
      avatarId: null,
      url: null,
      legacyId: parseInt(user.user_id),
      legacyPassword: user.password,
      public: false,
    };
  });
}

function parsePosts(data: unknown[]) {
  (
    data as {
      message_id: string;
      thread: string;
      subject: string;
      body: string;
      user_id: string;
      datestamp: string;
      modifystamp: string;
      closed: string;
    }[]
  ).forEach((post, i) => {
    console.log(`Konvertiere Post ${i + 1}/${data.length}...`);
    const threadId = parseInt(post.thread) - 1;
    const datestamp = parseInt(post.datestamp) * 1000;
    const modifystamp = parseInt(post.modifystamp);
    const created = datetime(new Date(datestamp));
    const updated = datetime(
      new Date(modifystamp > 0 ? modifystamp * 1000 : datestamp)
    );
    if (!threads[threadId]) {
      threads[threadId] = {
        id: numberToId(threadId),
        title: post.subject,
        author: users[post.user_id]?.name ?? ':-anonymous',
        posts: 1,
        created,
        updated,
        parent: null,
        root: null,
        mode: 'forum',
        closed: !!parseInt(post.closed),
        pinned: false, // muss manuell gemacht werden
      };
    }
    const postId = parseInt(post.message_id);
    const md = toMd(bbcodeToHtml(post.body));
    const html = toHtml(md);
    posts[postId] = {
      id: numberToId(postId),
      thread: threads[threadId].id,
      author: users[post.user_id]?.name ?? ':-anonymous',
      md,
      html: html.html,
      created,
      updated,
    };
    html.images.forEach(
      (image) => (images[image.hash] = Buffer.from(image.url, 'utf8'))
    );
    html.urls.forEach((url) => urls.push(url));
  });
}

let userTable: unknown[] | null = null;
let messageTable: unknown[] | null = null;

for (let table of data) {
  if (table.type !== 'table') continue;

  switch (table.name) {
    case 'phorum5_users':
      userTable = table.data;
      break;
    case 'phorum5_messages':
      messageTable = table.data;
      break;
  }
}

console.log('Nutzerkonten werden verarbeitet...');
parseUsers(userTable as unknown[]);
console.log('Posts & Threads werden verarbeitet...');
parsePosts(messageTable as unknown[]);

for (let i = 0; i < threads.length; i++) {
  if (!threads[i])
    threads[i] = {
      id: numberToId(i),
      title: null as unknown as string,
      author: ':-anonymous',
      posts: 0,
      created: datetime(new Date(0)),
      updated: datetime(new Date(0)),
      parent: null,
      root: null,
      mode: 'forum',
      closed: true,
      pinned: false,
    };
}

for (let i = 0; i < posts.length; i++) {
  if (!posts[i])
    posts[i] = {
      id: numberToId(i),
      thread: null as unknown as string,
      author: ':-anonymous',
      md: null as unknown as string,
      html: null as unknown as string,
      created: datetime(new Date(0)),
      updated: datetime(new Date(0)),
    };
}

const usersArray = Object.values(users);
const imagesArray = Object.keys(images);

for (let i = 0; i < usersArray.length; i += 100) {
  const chunk = usersArray.slice(i, i + 100);
  writeFileSync(
    `data/output/users/${generateFileId(i / 100)}.json`,
    JSON.stringify(chunk),
    'utf8'
  );
}

for (let i = 0; i < threads.length; i += 100) {
  const chunk = threads.slice(i, i + 100);
  writeFileSync(
    `data/output/threads/${generateFileId(i / 100)}.json`,
    JSON.stringify(chunk),
    'utf8'
  );
}

for (let i = 0; i < posts.length; i += 100) {
  const chunk = posts.slice(i, i + 100);
  writeFileSync(
    `data/output/posts/${generateFileId(i / 100)}.json`,
    JSON.stringify(chunk),
    'utf8'
  );
}

for (let i = 0; i < dms.length; i += 100) {
  const chunk = dms.slice(i, i + 100);
  writeFileSync(
    `data/output/dms/${generateFileId(i / 100)}.json`,
    JSON.stringify(chunk),
    'utf8'
  );
}

for (let i = 0; i < imagesArray.length; i += 100) {
  const chunk = imagesArray.slice(i, i + 100);
  writeFileSync(
    `data/output/images/${generateFileId(i / 100)}.json`,
    JSON.stringify(chunk),
    'utf8'
  );
  chunk.forEach((imageId) =>
    writeFileSync(`data/output/image-data/${imageId}`, images[imageId])
  );
}

for (let i = 0; i < urls.length; i += 100) {
  const chunk = urls.slice(i, i + 100);
  writeFileSync(
    `data/output/urls/${generateFileId(i / 100)}.json`,
    JSON.stringify(chunk),
    'utf8'
  );
}
