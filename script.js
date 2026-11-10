"use strict";

const storageKeys = {
  favorites: "north-star-bakery.favorites",
  requestType: "north-star-bakery.request-type"
};

function readSaved(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);
    return savedValue === null ? fallback : JSON.parse(savedValue);
  } catch {
    return fallback;
  }
}

function saveValue(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function setUpFavorites(panel) {
  const buttons = Array.from(document.querySelectorAll("[data-favorite]"));
  const list = panel.querySelector("ul");
  const status = panel.querySelector("[role='status']");
  const saved = readSaved(storageKeys.favorites, []);
  let favorites = Array.isArray(saved)
    ? buttons.map(button => button.dataset.favorite).filter(name => saved.includes(name))
    : [];

  function renderFavorites(message = "") {
    list.replaceChildren();
    for (const button of buttons) {
      const name = button.dataset.favorite;
      const selected = favorites.includes(name);
      button.setAttribute("aria-pressed", String(selected));
      if (selected) {
        const item = document.createElement("li");
        item.textContent = name;
        list.append(item);
      }
    }
    const count = favorites.length;
    const summary = count === 0
      ? "Choose an item below to start your list."
      : `${count} ${count === 1 ? "favorite" : "favorites"} selected.`;
    status.textContent = [summary, message].filter(Boolean).join(" ");
  }

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const name = button.dataset.favorite;
      const selected = favorites.includes(name);
      favorites = selected ? favorites.filter(item => item !== name) : [...favorites, name];
      const savedChange = saveValue(storageKeys.favorites, favorites);
      const message = selected ? `Removed ${name}.` : `Added ${name}.`;
      renderFavorites(savedChange ? message : `${message} Changes could not be saved in this browser.`);
    });
    button.hidden = false;
  }
  renderFavorites(favorites.length ? "Restored your saved favorites." : "");
  panel.hidden = false;
}

function setUpRequestForm(form) {
  const fields = form.elements;
  const requestType = fields.request_type;
  const status = form.querySelector("[role='status']");
  const preference = document.querySelector("#request-type-preference");
  const availableTypes = Array.from(requestType.options, option => option.value);
  const savedType = readSaved(storageKeys.requestType, "");
  if (savedType && availableTypes.includes(savedType)) {
    requestType.value = savedType;
    preference.textContent = "Restored your saved request type.";
  }

  const checks = [
    { field: fields.name, error: field => field.value.trim().length < 2
      ? "Enter a name with at least 2 characters." : "" },
    { field: fields.email, error: field => {
      if (field.validity.valueMissing) return "Enter your email address.";
      return field.validity.typeMismatch ? "Enter an email address like name@example.com." : "";
    } },
    { field: requestType, error: field => field.value ? "" : "Choose a request type." },
    { field: fields.pickup_date, error: field => {
      if (field.validity.badInput) return "Enter a valid pickup date.";
      return requestType.value === "pre-order" && !field.value
        ? "Choose a pickup date for your pre-order." : "";
    } },
    { field: fields.details, error: field => field.value.trim().length < 10
      ? "Enter at least 10 characters describing your request." : "" }
  ];

  function validateField({ field, error }) {
    const message = error(field);
    document.getElementById(`${field.id}-error`).textContent = message;
    if (message) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
    return !message;
  }

  requestType.addEventListener("change", () => {
    preference.textContent = saveValue(storageKeys.requestType, requestType.value)
      ? "" : "Your request type could not be saved in this browser.";
    const dateCheck = checks.find(check => check.field === fields.pickup_date);
    if (dateCheck.field.hasAttribute("aria-invalid")) validateField(dateCheck);
  });

  form.addEventListener("input", event => {
    status.textContent = "";
    const check = checks.find(rule => rule.field === event.target);
    if (check && check.field.hasAttribute("aria-invalid")) validateField(check);
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    const invalid = checks.filter(check => !validateField(check));
    if (invalid.length) {
      status.textContent = "Review the highlighted fields and try again.";
      invalid[0].field.focus();
      return;
    }
    status.textContent = "Your practice request passed validation. The bakery has not received a request.";
  });

  // Enable custom feedback only after the form handlers are in place.
  form.noValidate = true;
}

const favoritesPanel = document.querySelector("#favorites");
if (favoritesPanel) setUpFavorites(favoritesPanel);

const requestForm = document.querySelector("#request-form");
if (requestForm) setUpRequestForm(requestForm);
