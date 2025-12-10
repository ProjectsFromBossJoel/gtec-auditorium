// === Initialize Year in footer ===
['year','year2','year3','year4','year5'].forEach(id=>{
  const el = document.getElementById(id);
  if(el) el.textContent = new Date().getFullYear();
});

// === Calculate Event Days ===
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const daysInput = document.getElementById('eventDays');

function calculateDays(){
  if(startDateInput.value && endDateInput.value){
    const start = new Date(startDateInput.value);
    const end = new Date(endDateInput.value);
    if(end >= start){
      const days = Math.ceil((end - start)/(1000*60*60*24))+1;
      daysInput.value = days;
    } else {
      alert("End date cannot be earlier than start date.");
      endDateInput.value = "";
      daysInput.value = "";
    }
  }
}

startDateInput.addEventListener('change', calculateDays);
endDateInput.addEventListener('change', calculateDays);

// === Submit Booking Form ===
const form = document.getElementById("bookingForm");

form.addEventListener("submit", async function(e){
  e.preventDefault();

  const formData = new FormData(form);

  const booking = {
    id: Date.now(),
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

  saveLocal(booking);
  await sendToSheet(booking);

  alert("Booking successfully submitted!");
  form.reset();
  daysInput.value = "";
});

// === Save to localStorage ===
function saveLocal(booking){
  const all = JSON.parse(localStorage.getItem('gtec_bookings')||'[]');
  all.push(booking);
  localStorage.setItem('gtec_bookings',JSON.stringify(all));
}

// === Send Booking to Google Sheet ===
async function sendToSheet(booking){
  const sheetURL = "https://script.google.com/macros/s/AKfycbwsV3UX76hZaQaacIXFkr_7dDiso8dgXP3bNC2Jchql_51SdWtsLKjJXFkYv83zsUbJmw/exec"; // Replace with your Web App URL

  try {
    await fetch(sheetURL, {
      method: "POST",
      mode: "no-cors", // prevents CORS errors
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(booking)
    });
    console.log("Booking sent to Google Sheet successfully");
  } catch (err) {
    console.error("Failed to send booking to Google Sheet", err);
  }
}
