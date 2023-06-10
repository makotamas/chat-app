import './scss/style.scss';
import config from './db_config.js';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import scrollIntoView from 'scroll-into-view-if-needed';

const app = initializeApp(config);

const db = getFirestore(app);

/**
 * sends the message to the database
 * @param {object} message the message to send
 */
async function sendMessage(message) {
  const docRef = await addDoc(collection(db, 'messages'), message);
  console.log('Document written with ID: ', docRef.id);
}

function createMessage() {
  const message = document.querySelector('#message').value;
  const username = document.querySelector('#nickname').value;
  const date = Timestamp.now();
  return { message, username, date };
}

/**
 * downloads all messages from the database and displays them ordered by date
 */
async function displayAllMessages() {
  const q = query(collection(db, 'messages'), orderBy('date', 'asc'));
  const messages = await getDocs(q);
  document.querySelector('#messages').innerHTML = '';
  messages.forEach((doc) => {
    displayMessage(doc.data(), doc.id);
  });
}

function displayMessage(message, messageId) {
  const messageDate = message.date.toDate();
  const dateText = messageDate.toLocaleString('hu-HU');
  const messageHTML = /*html*/ `
    <div class="message" data-id= ${messageId}>
      <i class="fas fa-user"></i>
      <div>
        <span class="username">${message.username}
          <time>${dateText}</time>
        </span>
        <br>
        <span class="message-text">
          ${message.message}
        </span>
      </div>
      <div class="message-edit-buttons">
        <i class="fas fa-trash-alt"></i>
        <i class="fas fa-pen"></i>
      </div>
    </div>
  `;
  document.querySelector('#messages').insertAdjacentHTML('beforeend', messageHTML);
  scrollIntoView(document.querySelector('#messages'), {
    scrollMode: 'if-needed',
    block: 'end'
  });

  const trashBin = document.querySelector(`[data-id="${messageId}"] .fa-trash-alt`);
  trashBin.addEventListener('click', () => deleteMessage(messageId));

  const editPen = document.querySelector(`[data-id="${messageId}"] .fa-pen`);
  editPen.addEventListener('click', () => displayEditMessage(messageId));
}

function displayEditMessage(id) {
  const editPopupHTML = /*html*/ `
    <div class="popup-container" id="popup">
      <div class="edit-message" id="edit-message" data-id="${id}">
        <div id="close-popup" class="button">
          Close <i class="fa fa-window-close" aria-hidden="true"></i>
        </div>
        <textarea id="edit" name="" cols="30" rows="10">${document
          .querySelector(`.message[data-id="${id}"] .message-text`)
          .textContent.trim()}</textarea>
        <div id="save-message" class="button">
          Save message<i class="fas fa-save"></i>
        </div>
      </div>
    </div>
`;
  document.querySelector('#messages').insertAdjacentHTML('beforeend', editPopupHTML);

  document
    .querySelector(`[data-id="${id}"] .fa-window-close`)
    .addEventListener('click', () => {
      document.querySelector('#popup').remove();
    });

  document.querySelector(`[data-id="${id}"] .fa-save`).addEventListener('click', () => {
    const newMessage = document.getElementById('edit').value;
    document.querySelector(`.message[data-id="${id}"] .message-text`).textContent =
      newMessage;
    modifyMessage(newMessage, id);
    document.querySelector('#popup').remove();
  });
}
async function modifyMessage(newMessage, id) {
  const docRef = doc(db, 'messages', id);
  await updateDoc(docRef, {
    message: newMessage
  });
}

async function deleteMessage(id) {
  const docRef = doc(db, 'messages', id);
  console.log('Document deleted with ID: ', docRef.id);
  await deleteDoc(docRef);
}

function removeMessage(messageId) {
  const element = document.querySelector(`[data-id="${messageId}"]`);
  //console.log(element);
  element.remove();
}

function handleSubmit() {
  const message = createMessage();
  sendMessage(message);
  //displayMessage(message);
}

document.querySelector('#send').addEventListener('click', handleSubmit);

// send the message if the enter key is pressed
document.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    handleSubmit();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  // the document is fully loaded
  displayAllMessages();
});

// document.querySelector('#messages').innerHTML = '';

let initialLoad = true;

const q = query(collection(db, 'messages'), orderBy('date', 'asc'));
onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      console.log('added');
      if (!initialLoad) {
        displayMessage(change.doc.data(), change.doc.id);
      }
    }
    if (change.type === 'modified') {
      console.log('Modified');
    }
    if (change.type === 'removed') {
      removeMessage(change.doc.id);
      console.log('Removed');
    }
  });
  initialLoad = false;
});
