/* eslint-disable class-methods-use-this */
/* eslint-disable no-console */
export default class Chat {
  constructor(element) {
    if (typeof element === 'string') {
      this.popup = document.querySelector(element);
    }
    this.popup = element;
    this.popupForm = document.forms.nickname;
    this.chatForm = document.forms.chat;
    this.popupInput = this.popupForm.elements.name;
    this.chatInput = this.chatForm.elements.message;
    this.user = null;
    this.ws = null;
    this.baseURL = 'wss://ahj-8-1-sse-ws-sergius.herokuapp.com/';
    this.listUsers = document.querySelector('.users__list');
    this.listMessages = document.querySelector('.messages__list');

    this.onMessage = this.onMessage.bind(this);
    this.onPopupSubmit = this.onPopupSubmit.bind(this);
    this.onChatSubmit = this.onChatSubmit.bind(this);
  }

  init() {
    this.popupForm.addEventListener('submit', this.onPopupSubmit);
    this.chatForm.addEventListener('submit', this.onChatSubmit);
    this.popupInput.focus();
  }

  onPopupSubmit(evt) {
    evt.preventDefault();
    if (this.popupInput.validity.valid) {
      this.popupInput.className = 'popup__input';
      this.popupInput.placeholder = 'Введите псевдоним';
      this.user = this.popupInput.value;
      console.log(this.user);
      this.ws = new WebSocket(this.baseURL);
      this.ws.binaryType = 'blob';

      this.ws.addEventListener('open', () => {
        const data = JSON.stringify({ type: 'registration', name: this.user });
        this.ws.send(data);
        console.log('connected');
      });

      this.ws.addEventListener('close', (e) => {
        console.log('connection closed', e);
      });

      this.ws.addEventListener('error', (e) => {
        console.log('error:', e);
      });

      this.ws.addEventListener('message', this.onMessage);
    } else {
      this.changePlaceholder('Заполните пожалуйста это поле');
    }
  }

  onChatSubmit(evt) {
    evt.preventDefault();
    if (this.chatInput.value !== '') {
      const data = JSON.stringify({
        type: 'message',
        content: this.chatInput.value,
        name: this.user,
      });
      this.ws.send(data);
      this.chatInput.value = '';
      console.log('Сообщение отправлено');
    }
  }

  onMessage(e) {
    const data = JSON.parse(e.data);
    if (data.type === 'registration') {
      if (data.success) {
        this.popupInput.value = '';
        this.hidePopup();
        this.chatInput.focus();
        this.drawListUsers(data.activeUsers);
        this.drawListMessages(data.messages);
      } else if (!data.error) {
        this.changePlaceholder('Это имя уже занято');
      } else {
        this.changePlaceholder('Ошибка сервера');
        console.log(data.error);
      }
    }
    if (data.type === 'message') {
      if (data.success) {
        this.drawListMessages(data.messages);
      } else {
        this.showError();
        console.log(data.error);
      }
    }
    if (data.type === 'update') {
      if (data.success) {
        this.drawListUsers(data.activeUsers);
      } else {
        this.showError();
        console.log(data.error);
      }
    }
  }

  showError() {
    this.listMessages.insertAdjacentHTML('beforeend', `<div class="error">
       <div class="error__body">
         <div class="error__content">Ошибка сервера</div>
       </div>
     </div>`);
    setTimeout(() => {
      this.hideError();
    }, 3000);
  }

  hideError() {
    document.querySelector('.error').remove();
  }

  markUpUser(name) {
    let temp;
    if (name === this.user) {
      temp = 'mine';
    } else {
      temp = '';
    }
    return `<li class="users__item ${temp}">
              <div class="users__avatar"></div>
              <div class="users__name">${name}</div>
            </li>`;
  }

  markUpMessage(name, date, message) {
    let temp;
    if (name === this.user) {
      temp = 'mine';
    } else {
      temp = '';
    }
    return `<li class="messages__item message ${temp}">
    <div class="message__wrapper">
      <div class="message__title">
        <span class="message__name">${name}</span>
        <span class="message__data">${this.cleanDate(date)}</span>
      </div>
      <div class="message__content">
        ${message}
      </div>
    </div>
  </li>`;
  }

  cleanDate(str) {
    const temp1 = str.split(' ');
    this.date = [temp1[1], temp1[0].slice(0, -1)].join(' ');
    return this.date;
  }

  changePlaceholder(text) {
    this.popupInput.className = 'popup__input';
    this.popupInput.value = '';
    this.popupInput.placeholder = text;
    this.popupInput.classList.add('red');
  }

  drawListMessages(data) {
    if (data.length > 0) {
      this.listMessages.innerHTML = '';
      data.forEach((e) => {
        this.listMessages.insertAdjacentHTML(
          'beforeend', this.markUpMessage(e.name, e.created, e.message),
        );
      });
    }
  }

  drawListUsers(activeUsers) {
    if (activeUsers.length > 0) {
      this.listUsers.innerHTML = '';
      activeUsers.forEach((e) => {
        this.listUsers.insertAdjacentHTML('beforeend', this.markUpUser(e));
      });
    }
  }

  hidePopup() {
    this.popup.className = 'popup visually_hidden';
  }
}