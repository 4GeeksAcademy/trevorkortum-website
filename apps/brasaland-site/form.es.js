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
    setError(id, `${label} es obligatorio.`);
    return false;
  }
  if (value.length < minLength) {
    setError(id, `${label} debe tener al menos ${minLength} caracteres.`);
    return false;
  }
  setError(id, "");
  return true;
}

function validateSelect(id, label) {
  const value = getField(id).value.trim();
  if (!value) {
    setError(id, `Selecciona ${label.toLowerCase()}.`);
    return false;
  }
  setError(id, "");
  return true;
}

function validateEmail() {
  const id = "email";
  const value = getField(id).value.trim();
  if (!value) {
    setError(id, "El correo electronico es obligatorio.");
    return false;
  }
  if (!emailRegex.test(value)) {
    setError(id, "Ingresa un correo electronico valido.");
    return false;
  }
  setError(id, "");
  return true;
}

function validatePhone() {
  const id = "phone";
  const value = getField(id).value.trim();
  if (!value) {
    setError(id, "El telefono es obligatorio.");
    return false;
  }
  if (!phoneRegex.test(value)) {
    setError(id, "Ingresa un telefono valido con codigo de pais.");
    return false;
  }
  setError(id, "");
  return true;
}

function validateChallenge() {
  const id = "challenge";
  const value = getField(id).value.trim();
  if (!value) {
    setError(id, "Este campo es obligatorio.");
    return false;
  }
  if (value.length < 40) {
    setError(id, "Comparte al menos 40 caracteres.");
    return false;
  }
  setError(id, "");
  return true;
}

function validateMarkets() {
  const markets = Array.from(document.querySelectorAll('input[name="markets"]'));
  const selected = markets.some((item) => item.checked);
  if (!selected) {
    setGroupError("markets-error", "Selecciona al menos un servicio de interes.");
    return false;
  }
  setGroupError("markets-error", "");
  return true;
}

function validateWorkMode() {
  const modes = Array.from(document.querySelectorAll('input[name="workMode"]'));
  const selected = modes.some((item) => item.checked);
  if (!selected) {
    setGroupError("workMode-error", "Selecciona tu canal de contacto preferido.");
    return false;
  }
  setGroupError("workMode-error", "");
  return true;
}

function validateConsent() {
  const marketingConsent = getField("legalWork").checked;
  const dataConsent = getField("dataConsent").checked;
  if (!marketingConsent || !dataConsent) {
    setGroupError("consent-error", "Debes aceptar comunicaciones y consentimiento de datos.");
    return false;
  }
  setGroupError("consent-error", "");
  return true;
}

function validateForm() {
  const checks = [
    validateTextField("fullName", 3, "Nombre completo"),
    validateEmail(),
    validatePhone(),
    validateTextField("city", 2, "Ciudad"),
    validateSelect("country", "el pais"),
    validateSelect("preferredLanguage", "el idioma preferido"),
    validateSelect("favoriteMenu", "la categoria de menu favorita"),
    validateSelect("visitFrequency", "la frecuencia de visita"),
    validateSelect("preferredLocation", "la zona de sede preferida"),
    validateSelect("birthMonth", "el mes de cumpleanos"),
    validateMarkets(),
    validateChallenge(),
    validateSelect("availability", "el horario de contacto preferido"),
    validateWorkMode(),
    validateConsent(),
  ];

  return checks.every(Boolean);
}

const fieldValidators = {
  fullName: () => validateTextField("fullName", 3, "Nombre completo"),
  email: validateEmail,
  phone: validatePhone,
  city: () => validateTextField("city", 2, "Ciudad"),
  country: () => validateSelect("country", "el pais"),
  preferredLanguage: () => validateSelect("preferredLanguage", "el idioma preferido"),
  favoriteMenu: () => validateSelect("favoriteMenu", "la categoria de menu favorita"),
  visitFrequency: () => validateSelect("visitFrequency", "la frecuencia de visita"),
  preferredLocation: () => validateSelect("preferredLocation", "la zona de sede preferida"),
  birthMonth: () => validateSelect("birthMonth", "el mes de cumpleanos"),
  challenge: validateChallenge,
  availability: () => validateSelect("availability", "el horario de contacto preferido"),
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
    feedback.textContent = "Revisa los campos marcados e intenta de nuevo.";
    feedback.classList.add("text-red-700");
    const firstInvalid = form.querySelector('[aria-invalid="true"]');
    if (firstInvalid) {
      firstInvalid.focus();
    }
    return;
  }

  feedback.textContent = "Gracias por unirte a Brasaland. Pronto te compartiremos novedades.";
  feedback.classList.add("text-emerald-700");
  form.reset();
});
