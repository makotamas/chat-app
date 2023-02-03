/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
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
  onSnapshot
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
  // const timestamp = firebase.firestore.Timestamp.fromDate(new Date());
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
    displayMessage(doc.data());
    displayEditMessage(doc.data());
    modifyMessage(userId);
  });
}

function displayMessage(message) {
  const messageHTML = /*html*/ `
    <div class="message">
      <i class="fas fa-user"></i>
      <div>
        <span class="username">${message.username}
          <time>20:12 PM</time>
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
document.querySelector('#edit-message #close-popup').addEventListener('click', function() {
  document.querySelector('#popup').remove();
});

document.querySelector('#edit-message #save-message').addEventListener('click', function() {
  const newMessage = document.querySelector('#edit').value;
  document.querySelector(`.message[data-id="${id}"] .message-text`).textContent = newMessage;
});
const userId = document.querySelector('#edit-message').dataset.id;

document.querySelector('#messages').insertAdjacentHTML('beforeend', editPopupHTML);
}

async function modifyMessage(id, newMessage) {
  try {
    await updateDoc(id, { message: newMessage });
  } catch (error) {
    console.error(error);
  }
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
        displayMessage(change.doc.data());
      }
    }
    if (change.type === 'modified') {
      console.log('Modified');
    }
    if (change.type === 'removed') {
      console.log('Removed');
    }
  });
  initialLoad = false;
});