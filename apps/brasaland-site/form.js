const form = document.getElementById("application-form");
const feedback = document.getElementById("submit-feedback");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s0-9]{6,20}$/;

function getField(id) {
  return document.getElementById(id);
}

function setError(id, message) {
  const input = getField(id);
  const error = getField(`${id}-error`);
  if (input) {
    input.setAttribute("aria-invalid", message ? "true" : "false");
    input.classList.toggle("border-red-600", Boolean(message));
  }
  if (error) {
    error.textContent = message;
  }
}

function setGroupError(id, message) {
  const error = getField(id);
  if (error) {
    error.textContent = message;
  }
}

function validateTextField(id, minLength, label) {
  const value = getField(id).value.trim();
  if (!value) {
    setError(id, `${label} is required.`);
    return false;
  }
  if (value.length < minLength) {
    setError(id, `${label} must be at least ${minLength} characters.`);
    return false;
  }
  setError(id, "");
  return true;
}

function validateSelect(id, label) {
  const value = getField(id).value.trim();
  if (!value) {
    setError(id, `Please select ${label.toLowerCase()}.`);
    return false;
  }
  setError(id, "");
  return true;
}

function validateEmail() {
  const id = "email";
  const value = getField(id).value.trim();
  if (!value) {
    setError(id, "Email address is required.");
    return false;
  }
  if (!emailRegex.test(value)) {
    setError(id, "Enter a valid email address.");
    return false;
  }
  setError(id, "");
  return true;
}

function validatePhone() {
  const id = "phone";
  const value = getField(id).value.trim();
  if (!value) {
    setError(id, "Phone number is required.");
    return false;
  }
  if (!phoneRegex.test(value)) {
    setError(id, "Enter a valid phone number with country code.");
    return false;
  }
  setError(id, "");
  return true;
}

function validateChallenge() {
  const id = "challenge";
  const value = getField(id).value.trim();
  if (!value) {
    setError(id, "This field is required.");
    return false;
  }
  if (value.length < 40) {
    setError(id, "Please provide at least 40 characters.");
    return false;
  }
  setError(id, "");
  return true;
}

function validateMarkets() {
  const markets = Array.from(document.querySelectorAll('input[name="markets"]'));
  const selected = markets.some((item) => item.checked);
  if (!selected) {
    setGroupError("markets-error", "Select at least one service option.");
    return false;
  }
  setGroupError("markets-error", "");
  return true;
}

function validateWorkMode() {
  const modes = Array.from(document.querySelectorAll('input[name="workMode"]'));
  const selected = modes.some((item) => item.checked);
  if (!selected) {
    setGroupError("workMode-error", "Select your preferred communication channel.");
    return false;
  }
  setGroupError("workMode-error", "");
  return true;
}

function validateConsent() {
  const marketingConsent = getField("legalWork").checked;
  const dataConsent = getField("dataConsent").checked;
  if (!marketingConsent || !dataConsent) {
    setGroupError("consent-error", "You must accept communications and data consent.");
    return false;
  }
  setGroupError("consent-error", "");
  return true;
}

function validateForm() {
  const checks = [
    validateTextField("fullName", 3, "Full name"),
    validateEmail(),
    validatePhone(),
    validateTextField("city", 2, "City"),
    validateSelect("country", "country"),
    validateSelect("preferredLanguage", "preferred language"),
    validateSelect("favoriteMenu", "favorite menu category"),
    validateSelect("visitFrequency", "visit frequency"),
    validateSelect("preferredLocation", "preferred location area"),
    validateSelect("birthMonth", "birth month"),
    validateMarkets(),
    validateChallenge(),
    validateSelect("availability", "preferred contact time"),
    validateWorkMode(),
    validateConsent(),
  ];

  return checks.every(Boolean);
}

const fieldValidators = {
  fullName: () => validateTextField("fullName", 3, "Full name"),
  email: validateEmail,
  phone: validatePhone,
  city: () => validateTextField("city", 2, "City"),
  country: () => validateSelect("country", "country"),
  preferredLanguage: () => validateSelect("preferredLanguage", "preferred language"),
  favoriteMenu: () => validateSelect("favoriteMenu", "favorite menu category"),
  visitFrequency: () => validateSelect("visitFrequency", "visit frequency"),
  preferredLocation: () => validateSelect("preferredLocation", "preferred location area"),
  birthMonth: () => validateSelect("birthMonth", "birth month"),
  challenge: validateChallenge,
  availability: () => validateSelect("availability", "preferred contact time"),
};

Object.entries(fieldValidators).forEach(([id, validator]) => {
  const field = getField(id);
  if (!field) {
    return;
  }
  field.addEventListener("blur", validator);
  field.addEventListener("input", () => {
    if (getField(`${id}-error`)?.textContent) {
      validator();
    }
  });
});

document.querySelectorAll('input[name="markets"]').forEach((el) => {
  el.addEventListener("change", validateMarkets);
});

document.querySelectorAll('input[name="workMode"]').forEach((el) => {
  el.addEventListener("change", validateWorkMode);
});

getField("legalWork").addEventListener("change", validateConsent);
getField("dataConsent").addEventListener("change", validateConsent);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  feedback.textContent = "";
  feedback.className = "text-sm font-medium";

  const isValid = validateForm();
  if (!isValid) {
    feedback.textContent = "Please review the highlighted fields and try again.";
    feedback.classList.add("text-red-700");
    const firstInvalid = form.querySelector('[aria-invalid="true"]');
    if (firstInvalid) {
      firstInvalid.focus();
    }
    return;
  }

  feedback.textContent = "Thanks for joining Brasaland. We will share updates with you soon.";
  feedback.classList.add("text-emerald-700");
  form.reset();
});
