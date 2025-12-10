// Basic interactions, booking storage (localStorage) and hall-details renderer
const bookingModal = document.getElementById('bookingModal');
const bookingClose = document.getElementById('bookingClose');
const openBookingButtons = Array.from(document.querySelectorAll('#openBooking, #openBookingTop, #openBookingTop2, #openBookingTop3, #openBookingTop4, #openBookingHero'))
  .filter(Boolean);

function setYearIds(){
  ['year','year2','year3','year4','year5'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.textContent = new Date().getFullYear();
  })
}
setYearIds();

function buildModalContent(){
  // populate modal (only if it's empty) - used for pages where modal placeholder exists
  if(bookingModal && bookingModal.innerHTML.trim()===''){
    bookingModal.innerHTML = document.querySelector('body').contains(document.querySelector('#bookingForm'))
      ? '' // main already has modal
      : `
        <div class="modal-dialog">
          <button class="modal-close" id="bookingClose">✕</button>
          <h3>Book a Hall</h3>
          <form id="bookingForm">
            <label>Choose a Hall</label>
            <select id="hallSelect">
              <option value="Grand Auditorium">Grand Auditorium — ₵5,000/hr</option>
              <option value="Executive Boardroom">Executive Boardroom — ₵2,500/hr</option>
              <option value="Innovation Hub">Innovation Hub — ₵3,500/hr</option>
            </select>
            <label>Booking Date & Time</label>
            <input type="date" id="bookDate" required>
            <input type="time" id="bookTime" required>
            <label>Duration (hours)</label>
            <input type="number" id="duration" min="1" value="2" required>
            <label>Additional Services</label>
            <div class="services">
              <label><input type="checkbox" data-price="50" value="Extra Chairs"> Extra Chairs (₵50/chair)</label>
              <label><input type="checkbox" data-price="80" value="Extra Tables"> Extra Tables (₵80/table)</label>
              <label><input type="checkbox" data-price="200" value="Catering"> Catering (from ₵200)</label>
            </div>
            <label>Your Name</label>
            <input type="text" id="customerName" required>
            <label>Phone or Email</label>
            <input type="text" id="customerContact" required>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="previewBooking">Preview</button>
              <button type="submit" class="btn btn-primary">Confirm Booking</button>
            </div>
          </form>
          <div id="bookingPreview" class="booking-preview" hidden></div>
        </div>
      `;
  }
}

function openBookingModal(defaultHall){
  buildModalContent();
  bookingModal.setAttribute('aria-hidden','false');
  // set default
  const hallSelect = document.getElementById('hallSelect');
  if(hallSelect && defaultHall) hallSelect.value = defaultHall;
  attachModalEvents();
}

function closeBookingModal(){
  bookingModal.setAttribute('aria-hidden','true');
}

function attachModalEvents(){
  const closeBtn = bookingModal.querySelector('.modal-close');
  if(closeBtn) closeBtn.onclick = closeBookingModal;
  const form = document.getElementById('bookingForm');
  const previewBtn = document.getElementById('previewBooking');
  if(previewBtn) previewBtn.onclick = previewBooking;
  if(form){
    form.onsubmit = function(e){
      e.preventDefault();
      const booking = readBookingFromForm();
      saveBooking(booking);
      alert('Booking confirmed — it has been saved to the system.');
      closeBookingModal();
      // allow admin page to pick up changes from localStorage
    }
  }
}

function previewBooking(){
  const booking = readBookingFromForm();
  const preview = document.getElementById('bookingPreview');
  if(preview){
    preview.hidden = false;
    preview.innerHTML = `<strong>${booking.hall}</strong> on ${booking.date} at ${booking.time} for ${booking.duration} hour(s).<br>Services: ${booking.services.join(', ') || 'None'}<br>Total Est: ₵${booking.estimate}`
  }
}

function readBookingFromForm(){
  const hall = document.getElementById('hallSelect').value;
  const date = document.getElementById('bookDate').value;
  const time = document.getElementById('bookTime').value;
  const duration = Number(document.getElementById('duration').value) || 1;
  const servicesEl = Array.from(document.querySelectorAll('.services input[type="checkbox"]:checked'));
  const services = servicesEl.map(i=>i.value);
  let servicesCost = servicesEl.reduce((s,i)=>s + Number(i.dataset.price || 0),0);
  // base prices
  const base = hall.includes('Grand')?5000: hall.includes('Boardroom')?2500:3500;
  const estimate = (base * duration) + servicesCost;
  const name = document.getElementById('customerName').value;
  const contact = document.getElementById('customerContact').value;
  return {hall,date,time,duration,services,estimate,name,contact};
}

function saveBooking(booking){
  const all = JSON.parse(localStorage.getItem('gtec_bookings')||'[]');
  all.push(Object.assign({id:Date.now()},booking));
  localStorage.setItem('gtec_bookings',JSON.stringify(all));
}

function loadBookings(){
  return JSON.parse(localStorage.getItem('gtec_bookings')||'[]');
}

// wire up open buttons
openBookingButtons.forEach(btn=>btn.addEventListener('click',()=>openBookingModal()));
// hero specific
const heroBtn = document.getElementById('openBookingHero'); if(heroBtn) heroBtn.onclick = ()=>openBookingModal();

// convenience functions used by inline onclicks
window.openBookingModal = openBookingModal;
window.openHallDetails = function(hallName){
  // simple redirect to details page with query
  window.location = 'hall-details.html?hall='+encodeURIComponent(hallName);
}

// render hall details if on page
function renderHallDetailsFromQuery(){
  const cont = document.getElementById('hallContent');
  if(!cont) return;
  const params = new URLSearchParams(location.search);
  const hall = params.get('hall') || 'Grand Auditorium';
  const data = {
    'Grand Auditorium':{title:'Paul Effah Hall- Full Capacity',img:'images/Paul_Effah-Ground_Floor.jpeg',desc:'Large auditorium suitable for conferences, seminars and large presentations. Capacity up to 300.',price:5000},
    'Executive Boardroom':{title:'Paul Effah Hall- Ground Floor',img:'images/Paul_Effah-Ground_Floor.jpeg',desc:'Premium boardroom with conferencing equipment, ideal for executive meetings.',price:2500},
    'Innovation Hub':{title:'Jinapor Hall',img:'images/Jinapor_Hall.jpeg',desc:'Flexible space for workshops, trainings and innovation sessions.',price:3500}
  };
  const d = data[hall] || data['Grand Auditorium'];
  cont.innerHTML = `
    <div class="card">
      <img src="${d.img}" style="width:100%;height:360px;object-fit:cover;border-radius:8px">
      <h2 style="margin-top:12px">${d.title}</h2>
      <p class="hall-meta">${d.desc}</p>
      <p><strong>Price:</strong> ₵${d.price}/hr</p>
      <div style="display:flex;gap:10px;margin-top:12px">
        <button class="btn btn-primary" onclick="openBookingModal('${d.title}')">Book Now</button>
        <a class="btn btn-outline" href="halls.html">Back to Halls</a>
      </div>
    </div>
  `;
}
renderHallDetailsFromQuery();

// admin helpers
window.fetchBookingsForAdmin = function(){
  return loadBookings();
}

// close modal when clicking outside
document.addEventListener('click',(e)=>{
  if(e.target === bookingModal) closeBookingModal();
});

// expose some utilities for admin page to use


const booking = {
  applicantName: formData.get('applicantName'),
  telephone: formData.get('telephone'),
  email: formData.get('email'),
  bookingType: formData.get('bookingType'),
  institutionName: formData.get('institutionName'),
  participants: formData.get('participants'),
  venue: formData.get('venue'),
  additionalServices: formData.get('additionalServices'),
  tables: formData.get('tables') || "0",
  chairs: formData.get('chairs') || "0",
  eventDescription: formData.get('eventDescription'),
  startDate: formData.get('startDate'),
  endDate: formData.get('endDate'),
  days: formData.get('days'),
  startTime: formData.get('startTime'),
  endTime: formData.get('endTime'),
  invoiceName: formData.get('invoiceName'),
  invoiceEmail: formData.get('invoiceEmail')
};

function saveBooking(booking){
  // Save to localStorage as before
  const all = JSON.parse(localStorage.getItem('gtec_bookings')||'[]');
  all.push(Object.assign({id:Date.now()},booking));
  localStorage.setItem('gtec_bookings',JSON.stringify(all));

  // === SEND TO GOOGLE SHEET ===
  const sheetURL = 'https://script.google.com/macros/s/AKfycbxVdFUL_KuHcEDzlWtfdPNJAQEO4HDTPvZSU5G9iRHWBZ3swX-FZp2-hDSSeEuATJ6S/exec'; // Replace with your Web App URL

  fetch(sheetURL, {
    method: 'POST',
    mode: 'no-cors', // Avoid CORS issues
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  })
  .then(() => {
    console.log('Booking sent to Google Sheet successfully');
  })
  .catch(err => {
    console.error('Failed to send booking to Google Sheet', err);
  });
}
