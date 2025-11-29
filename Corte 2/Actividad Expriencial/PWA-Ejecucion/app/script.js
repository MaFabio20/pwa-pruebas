const USERS = {
  "admin": { password: "admin", name: "Administrador" },
  "fmahecha": { password: "1234", name: "Fabio Mahecha" },
  "jramirez": { password: "1234", name: "Juan Ramírez" }
};


const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const inputUser = document.getElementById('inputUser');
const inputPass = document.getElementById('inputPass');

const displayName = document.getElementById('displayName');
const ticketAssign = document.getElementById('ticketAssign');
const ticketTitle = document.getElementById('ticketTitle');
const ticketDesc = document.getElementById('ticketDesc');
const ticketPriority = document.getElementById('ticketPriority');
const btnCreateTicket = document.getElementById('btnCreateTicket');
const ticketsContainer = document.getElementById('ticketsContainer');
const filterState = document.getElementById('filterState');


let currentUser = null;


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(reg => console.log('Registro de SW exitoso', reg))
    .catch(err => console.warn('Error al tratar de registrar el sw', err))
}


function loadTickets() {
  return JSON.parse(localStorage.getItem('colviseg_tickets') || '[]');
}
function saveTickets(tickets) {
  localStorage.setItem('colviseg_tickets', JSON.stringify(tickets));
}

function fillAssignSelect() {
  ticketAssign.innerHTML = '';
  const optPlaceholder = document.createElement('option');
  optPlaceholder.value = '';
  optPlaceholder.textContent = '-- seleccionar usuario --';
  ticketAssign.appendChild(optPlaceholder);

  Object.keys(USERS).forEach(u => {
    const opt = document.createElement('option');
    opt.value = u;
    opt.textContent = `${USERS[u].name} (${u})`;
    ticketAssign.appendChild(opt);
  });
}

btnLogin.addEventListener('click', () => {
  const user = inputUser.value.trim();
  const pass = inputPass.value.trim();

  if (!user || !pass) return alert('Ingrese usuario y contraseña');

  const found = USERS[user];
  if (!found || found.password !== pass) {
    return alert('Usuario o contraseña incorrectos');
  }

  currentUser = user;
  localStorage.setItem('colviseg_user', currentUser);
  enterApp();
});

btnLogout.addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('colviseg_user');
  appSection.classList.add('hidden');
  loginSection.classList.remove('hidden');
  inputPass.value = '';
  inputUser.value = '';
});

function enterApp() {
  displayName.textContent = `${USERS[currentUser].name} (${currentUser})`;
  loginSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  fillAssignSelect();
  renderTickets();
}

btnCreateTicket.addEventListener('click', () => {
  const title = ticketTitle.value.trim();
  const desc = ticketDesc.value.trim();
  const priority = ticketPriority.value || 'Media';
  const assigned = ticketAssign.value;

  if (!title || !desc) return alert('Complete título y descripción');
  if (!assigned) return alert('Seleccione usuario asignado');

  const tickets = loadTickets();
  const newTicket = {
    id: Date.now(),
    title,
    desc,
    priority,
    status: 'abierto', 
    creator: currentUser,
    assigned,
    createdAt: new Date().toLocaleString(),
    history: [
      { status: 'abierto', date: new Date().toLocaleString(), user: currentUser }
    ]
  };

  tickets.unshift(newTicket);
  saveTickets(tickets);

  ticketTitle.value = '';
  ticketDesc.value = '';
  ticketAssign.value = '';

  renderTickets();
});


function changeState(id, newState) {
  const tickets = loadTickets();
  const idx = tickets.findIndex(t => t.id === id);
  if (idx === -1) return;

  const ticket = tickets[idx];

  if (ticket.assigned !== currentUser) {
    alert('Solo el usuario asignado puede cambiar el estado de este ticket.');
    return;
  }

  
  if (ticket.status === 'finalizado') return;

  ticket.status = newState;
  ticket.history.unshift({ status: newState, date: new Date().toLocaleString(), user: currentUser });

  
  tickets[idx] = ticket;
  saveTickets(tickets);
  renderTickets();
}


function renderTickets() {
  ticketsContainer.innerHTML = '';
  const tickets = loadTickets();
  const filter = filterState?.value || 'todos';

  
  let visible = tickets.filter(t => t.creator === currentUser || t.assigned === currentUser);

  
  if (filter !== 'todos') visible = visible.filter(t => t.status === filter);

  if (visible.length === 0) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'No hay tickets para mostrar.';
    ticketsContainer.appendChild(p);
    return;
  }

  visible.forEach(ticket => {
    const card = document.createElement('div');
    card.className = 'ticket';

    
    const statusClass = ticket.status === 'abierto' ? 'status-abierto'
                      : ticket.status === 'en_proceso' ? 'status-en_proceso'
                      : 'status-finalizado';

    const historyHTML = ticket.history.map(h => `<li>${h.date} — ${USERS[h.user]?.name || h.user} ➜ <b>${formatStatus(h.status)}</b></li>`).join('');

    
    let buttonsHTML = '';
    if (ticket.assigned === currentUser && ticket.status !== 'finalizado') {
      buttonsHTML = `
        <div class="ticket-actions">
          <button class="small-btn btn-proceso" data-id="${ticket.id}" data-action="en_proceso">Marcar En proceso</button>
          <button class="small-btn btn-final" data-id="${ticket.id}" data-action="finalizado">Marcar Finalizado</button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="ticket-row">
        <div>
          <div class="ticket-title">${escapeHtml(ticket.title)}</div>
          <div class="ticket-meta">${escapeHtml(ticket.desc)}</div>
        </div>
        <div style="text-align:right">
          <div class="ticket-meta">Prioridad: <strong>${escapeHtml(ticket.priority)}</strong></div>
          <div style="margin-top:8px"><span class="status-pill ${statusClass}">${formatStatus(ticket.status)}</span></div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;gap:12px;margin-top:10px;align-items:center">
        <div class="ticket-meta">Creado por: <strong>${USERS[ticket.creator]?.name || ticket.creator}</strong><br>Asignado a: <strong>${USERS[ticket.assigned]?.name || ticket.assigned}</strong></div>
        <div class="ticket-meta">Creado: ${ticket.createdAt}</div>
      </div>

      ${buttonsHTML}

      <details style="margin-top:10px" class="historial">
        <summary><strong>Historial (${ticket.history.length})</strong></summary>
        <ul>${historyHTML}</ul>
      </details>
    `;

    ticketsContainer.appendChild(card);
  });

  
  ticketsContainer.querySelectorAll('button[data-action]').forEach(btn => {
    btn.onclick = (e) => {
      const id = Number(btn.getAttribute('data-id'));
      const action = btn.getAttribute('data-action');
      if (action === 'en_proceso') changeState(id, 'en_proceso');
      if (action === 'finalizado') changeState(id, 'finalizado');
    };
  });
}


function formatStatus(s){
  return s === 'abierto' ? 'Abierto' : s === 'en_proceso' ? 'En proceso' : 'Finalizado';
}


function escapeHtml(str){
  if (!str) return '';
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}


filterState.addEventListener('change', renderTickets);


window.addEventListener('load', () => {
  const stored = localStorage.getItem('colviseg_user');
  if (stored && USERS[stored]) {
    currentUser = stored;
    enterApp();
  } else {
  
    loginSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }
});
