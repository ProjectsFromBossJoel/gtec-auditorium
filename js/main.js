document.addEventListener("DOMContentLoaded", function () {

  // ==================================================
  // LOADER FUNCTIONS
  // ==================================================
  const loadingOverlay = document.getElementById('loadingOverlay');
  function showLoader() { if (loadingOverlay) loadingOverlay.style.display = "flex"; }
  function hideLoader() { if (loadingOverlay) loadingOverlay.style.display = "none"; }

  // ==================================================
  // HELPER FUNCTIONS (SAFE DATE & TIME FORMAT)
  // ==================================================
  function formatDateWithOrdinal(dateStr) {
    if (!dateStr) return "";

    // Ensure dateStr is in YYYY-MM-DD format
    const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = dateStr.match(regex);
    if (!match) return dateStr; // fallback if format is wrong

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
    const day = parseInt(match[3], 10);

    const date = new Date(year, month, day);
    const monthName = date.toLocaleString("en-GB", { month: "long" });

    const ordinal = (n) => {
      if (n > 3 && n < 21) return n + "th";
      switch (n % 10) {
        case 1: return n + "st";
        case 2: return n + "nd";
        case 3: return n + "rd";
        default: return n + "th";
      }
    };

    return `${ordinal(day)} ${monthName}, ${year}`;
  }

  function formatTime12H(timeStr) {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    if (parts.length !== 2) return timeStr;

    let hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    hour = ((hour + 11) % 12) + 1;

    return `${hour}:${minute.toString().padStart(2, "0")} ${suffix}`;
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
      const startParts = startDateInput.value.split("-");
      const endParts = endDateInput.value.split("-");

      const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
      const end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));

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
    e.stopImmediatePropagation(); // 🔥 CRITICAL

    const submitBtn = document.getElementById("submitBooking");
    if (submitBtn) submitBtn.disabled = true;

    // ---- Guidelines validation ----
    const confirmCheckbox = document.getElementById("guidelinesConfirm");
    if (!confirmCheckbox || !confirmCheckbox.checked) {
      alert("Please download and confirm the booking guidelines before submitting.");
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

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
        foldableChairQty: formData.get('foldableChairQty') || "0",
        marqueeCanopyQty: formData.get('marqueeCanopyQty') || "0",
        eventDescription: formData.get('eventDescription'),
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
