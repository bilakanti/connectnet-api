const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const PORT = 3000;

// ------------------ Customers ------------------
let customers = [
  {
    name: "Maria Gonzalez",
    phone: "216-555-0101",
    account: "R-4829-KT-371",
    type: "Residential",
    appointment: { day: "Day+1", slot: "morning" }
  },
  {
    name: "James Whitfield",
    phone: "518-797-1094",
    account: "M-7304-BJ-518",
    type: "Residential",
    appointment: { day: "Day+8", slot: "afternoon" }
  },
  {
    name: "Sandra Park",
    phone: "440-555-0234",
    account: "T-2951-NW-847",
    type: "Residential",
    appointment: null
  },
  {
    name: "Tom Nguyen",
    phone: "330-555-0156",
    account: "C-6183-DX-092",
    type: "Business",
    appointment: null
  }
];

// ------------------ Schedule ------------------
let schedule = {
  "Day+1": { morning: false, afternoon: true, evening: false },
  "Day+2": { morning: true, afternoon: false, evening: true },
  "Day+3": { morning: false, afternoon: true, evening: false },
  "Day+4": { morning: true, afternoon: true, evening: false },
  "Day+5": { morning: true, afternoon: false, evening: false },
  "Day+6": { morning: false, afternoon: false, evening: true },
  "Day+7": { morning: false, afternoon: true, evening: true },
  "Day+8": { morning: true, afternoon: false, evening: false },
  "Day+9": { morning: false, afternoon: true, evening: true },
  "Day+10": { morning: true, afternoon: false, evening: true },
  "Day+11": { morning: false, afternoon: true, evening: false },
  "Day+12": { morning: true, afternoon: true, evening: false },
  "Day+13": { morning: false, afternoon: true, evening: false },
  "Day+14": { morning: true, afternoon: false, evening: true }
};

// ------------------ AUTH (ANI) ------------------
app.post("/auth/ani", (req, res) => {
  const { phone } = req.body;

  const customer = customers.find(c => c.phone === phone);

  if (!customer) {
    return res.json({ success: false, message: "No ANI match" });
  }

  if (customer.type === "Business") {
    return res.json({
      transfer: true,
      message: "Routing to business support"
    });
  }

  res.json(customer);
});

// ------------------ AUTH FALLBACK ------------------
app.post("/auth/account", (req, res) => {
  const { phone, account } = req.body;

  const customer = customers.find(
    c => c.phone === phone || c.account === account
  );

  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  if (customer.type === "Business") {
    return res.json({ transfer: true });
  }

  res.json(customer);
});

// ------------------ GET AVAILABILITY ------------------
app.get("/availability", (req, res) => {
  res.json(schedule);
});

// ------------------ BOOK ------------------
app.post("/appointment/book", (req, res) => {
  const { account, day, slot } = req.body;

  if (!schedule[day]) {
    return res.status(400).json({ message: "Invalid day" });
  }

  if (!schedule[day][slot]) {
    return res.status(400).json({ message: "Slot not available" });
  }

  const customer = customers.find(c => c.account === account);

  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }

  schedule[day][slot] = false;
  customer.appointment = { day, slot };

  console.log("📩 SMS: Appointment booked");

  res.json({
    message: "Appointment booked",
    appointment: customer.appointment
  });
});

// ------------------ RESCHEDULE ------------------
app.post("/appointment/reschedule", (req, res) => {
  const { account, newDay, newSlot } = req.body;

  const customer = customers.find(c => c.account === account);

  if (!customer || !customer.appointment) {
    return res.status(400).json({ message: "No existing appointment" });
  }

  if (!schedule[newDay][newSlot]) {
    return res.status(400).json({ message: "New slot unavailable" });
  }

  const { day, slot } = customer.appointment;

  schedule[day][slot] = true;
  schedule[newDay][newSlot] = false;

  customer.appointment = { day: newDay, slot: newSlot };

  console.log("📩 SMS: Appointment rescheduled");

  res.json({
    message: "Rescheduled",
    appointment: customer.appointment
  });
});

// ------------------ CANCEL ------------------
app.post("/appointment/cancel", (req, res) => {
  const { account } = req.body;

  const customer = customers.find(c => c.account === account);

  if (!customer || !customer.appointment) {
    return res.status(400).json({ message: "No appointment found" });
  }

  const { day, slot } = customer.appointment;

  schedule[day][slot] = true;
  customer.appointment = null;

  console.log("📩 SMS: Appointment cancelled");

  res.json({ message: "Cancelled successfully" });
});

// ------------------ ESCALATION ------------------
app.post("/escalate", (req, res) => {
  res.json({
    message: "Connecting to live agent (simulated)"
  });
});

// ------------------ START SERVER ------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
