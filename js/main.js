document.addEventListener("DOMContentLoaded", function () {

  // ==================================================
  // LOADER FUNCTIONS
  // ==================================================
  const loadingOverlay = document.getElementById('loadingOverlay');
  function showLoader() { if (loadingOverlay) loadingOverlay.style.display = "flex"; }
  function hideLoader() { if (loadingOverlay) loadingOverlay.style.display = "none"; }

  // ==================================================
  // HELPER FUNCTIONS (DATE & TIME FORMAT)
  // ==================================================
  function formatDateWithOrdinal(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-"); // "YYYY-MM-DD"
    if (parts.length !== 3) return "";
    const [year, month, day] = parts.map(Number);

    const date = new Date(year, month - 1, day);
    const monthName = date.toLocaleString("en-GB", { month: "long" });

    function ordinal(n) {
      if (n > 3 && n < 21) return n + "th";
      switch (n % 10) {
        case 1: return n + "st";
        case 2: return n + "nd";
        case 3: return n + "rd";
        default: return n + "th";
      }
    }

    return `${ordinal(day)} ${monthName}, ${year}`;
  }

  function formatTime12H(timeStr) {
    if (!timeStr) return "";
    const [hourStr, minuteStr] = timeStr.split(":");
    if (!hourStr || !minuteStr) return "";
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = ((hour + 11) % 12) + 1;
    return `${hour12}:${minute.toString().padStart(2, "0")} ${suffix}`;
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
    if (venueSelect && defaultHall) venueSelect.value = defaultHall;
  }

  function closeBookingModal() {
    if (!bookingModal) return;
    bookingModal.style.display = "none";
  }

  window.openBookingModal = openBookingModal;

  if (closeBtn) closeBtn.addEventListener('click', closeBookingModal);

  window.addEventListener('click', function (e) {
    if (e.target === bookingModal) closeBookingModal();
  });

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
        if (daysInput) daysInput.value = days;
      } else {
        alert("End date cannot be earlier than start date.");
        if (endDateInput) endDateInput.value = "";
        if (daysInput) daysInput.value = "";
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
        // ✅ FORMATTED DATE & TIME
        startDate: formatDateWithOrdinal(formData.get('startDate')),
        endDate: formatDateWithOrdinal(formData.get('endDate')),
        days: daysInput ? daysInput.value : "",
        startTime: formatTime12H(formData.get('startTime')),
        endTime: formatTime12H(formData.get('endTime')),
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
