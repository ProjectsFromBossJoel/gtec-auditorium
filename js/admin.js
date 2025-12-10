// admin page reads from localStorage and renders bookings and calendar
function renderAdmin(){
  const bookings = JSON.parse(localStorage.getItem('gtec_bookings')||'[]');
  const tbody = document.querySelector('#bookingsTable tbody');
  if(tbody){
    tbody.innerHTML = '';
    bookings.forEach((b,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i+1}</td><td>${b.hall}</td><td>${b.date}</td><td>${b.time}</td><td>${b.duration}h</td><td>${b.name} (${b.contact})</td><td>${b.services.join(', ')||'—'}</td>`;
      tbody.appendChild(tr);
    });
  }
  document.getElementById('totalBookings').textContent = bookings.length;
  const upcoming = bookings.filter(b=> new Date(b.date) >= new Date()).length;
  document.getElementById('upcomingCount').textContent = upcoming;
  renderMiniCalendar(bookings);
}

function renderMiniCalendar(bookings){
  const container = document.getElementById('miniCalendar');
  if(!container) return;
  // simple list grouped by date
  const byDate = {};
  bookings.forEach(b=>{ if(!byDate[b.date]) byDate[b.date]=[]; byDate[b.date].push(b); });
  container.innerHTML = Object.keys(byDate).sort().map(d=>{
    return `<div class="card" style="margin-bottom:10px"><strong>${d}</strong><ul>${byDate[d].map(x=>`<li>${x.time} — ${x.hall} (${x.name})</li>`).join('')}</ul></div>`
  }).join('') || '<p>No bookings yet.</p>';
}

// run on load
if(document.querySelector('#bookingsTable')){
  renderAdmin();
  // watch localStorage changes from other tabs
  window.addEventListener('storage', renderAdmin);
}
