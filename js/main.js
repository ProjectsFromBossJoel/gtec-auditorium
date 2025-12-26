document.addEventListener("DOMContentLoaded", function () {

function showLoader() {
  if (loadingOverlay) loadingOverlay.style.display = "flex";
}

function hideLoader() {
  if (loadingOverlay) loadingOverlay.style.display = "none";
}

  
  // ==================================================
  // INITIALIZE YEAR IN FOOTER
  // ==================================================
  ['year','year2','year3','year4','year5'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = new Date().getFullYear();
  });

  // ==================================================
  // MODAL HANDLING
  // ==================================================
  const bookingModal = document.getElementById('bookingModal');
  const closeBtn = document.getElementById('closeModal');

  function openBookingModal(defaultHall = "") {
    if (!bookingModal) return;

    bookingModal.style.display = "block";

    const venueSelect = bookingModal.querySelector('select[name="venue"]');
    if (venueSelect && defaultHall) {
      venueSelect.value = defaultHall;
    }
  }

  function closeBookingModal() {
    if (!bookingModal) return;
    bookingModal.style.display = "none";
  }

  // expose globally for inline onclick
  window.openBookingModal = openBookingModal;

  if (closeBtn) {
    closeBtn.addEventListener('click', closeBookingModal);
  }

  window.addEventListener('click', function (e) {
    if (e.target === bookingModal) {
      closeBookingModal();
    }
  });

  // ==================================================
  // HEADER & HERO "BOOK NOW" BUTTONS
  // ==================================================
  const openBooking = document.getElementById("openBooking");
  const openBookingHero = document.getElementById("openBookingHero");

  if (openBooking) {
    openBooking.addEventListener("click", () => openBookingModal());
  }

  if (openBookingHero) {
    openBookingHero.addEventListener("click", () => openBookingModal());
  }

  // ==================================================
  // CALCULATE EVENT DAYS
  // ==================================================
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const daysInput = document.getElementById('eventDays');

  function calculateDays() {
    if (startDateInput.value && endDateInput.value) {
      const start = new Date(startDateInput.value);
      const end = new Date(endDateInput.value);

      if (end >= start) {
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        daysInput.value = days;
      } else {
        alert("End date cannot be earlier than start date.");
        endDateInput.value = "";
        daysInput.value = "";
      }
    }
  }

  if (startDateInput && endDateInput) {
    startDateInput.addEventListener('change', calculateDays);
    endDateInput.addEventListener('change', calculateDays);
  }

  // ==================================================
  // SUBMIT BOOKING FORM
  // ==================================================
  const form = document.getElementById("bookingForm");

  if (form) {
    form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(form);
  const services = formData.getAll("additionalServices[]");

const booking = {
  id: Date.now(),
  applicantName: formData.get('applicantName'),
  telephone: formData.get('telephone'),
  email: formData.get('email'),
  bookingType: formData.get('bookingType'),
  institutionName: formData.get('institutionName'),
  participants: formData.get('participants'),
  venue: formData.get('venue'),

  additionalServices: services.length ? services.join(", ") : "None",

  standardChair: formData.get('standardChair') || "0",
  executiveChair: formData.get('executiveChair') || "0",
  tableQty: formData.get('tableQty') || "0",
  tableClothQty: formData.get('tableClothQty') || "0",

  eventDescription: formData.get('eventDescription'),
  startDate: formData.get('startDate'),
  endDate: formData.get('endDate'),
  days: formData.get('days'),
  startTime: formData.get('startTime'),
  endTime: formData.get('endTime'),
  invoiceName: formData.get('invoiceName'),
  invoiceEmail: formData.get('invoiceEmail')
};


  

  saveLocal(booking);
  await sendToSheet(booking);

  form.reset();
  if (daysInput) daysInput.value = "";
  closeBookingModal();
});

  }

  // ==================================================
  // SAVE TO LOCAL STORAGE
  // ==================================================
  function saveLocal(booking) {
    const all = JSON.parse(localStorage.getItem('gtec_bookings') || '[]');
    all.push(booking);
    localStorage.setItem('gtec_bookings', JSON.stringify(all));
  }



// Preview PDF Document
function openDocumentPreview() {
  document.getElementById("docModal").style.display = "block";
}

function closeDocumentPreview() {
  document.getElementById("docModal").style.display = "none";
}

  

  
  // ==================================================
  // SEND TO GOOGLE SHEETS
  // ==================================================
  async function sendToSheet(booking) {
    const sheetURL = "https://script.google.com/macros/s/AKfycbwsV3UX76hZaQaacIXFkr_7dDiso8dgXP3bNC2Jchql_51SdWtsLKjJXFkYv83zsUbJmw/exec";

    try {
      await fetch(sheetURL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking)
      });
    } catch (err) {
      console.error("Failed to send booking", err);
    }
  }

});



