/** Laboratory Work 11: contact form, validation, formatting and results. */
(() => {
  'use strict';
  const form = document.getElementById('contact-form');
  if (!form) return;
  const fields = Array.from(form.querySelectorAll('input, textarea'));
  const phone = form.elements.phone;
  const submit = document.getElementById('contact-submit');
  const result = document.getElementById('contact-result');
  const dataOutput = document.getElementById('contact-data');
  const averageOutput = document.getElementById('rating-average');
  const touched = new Set();

  function errorFor(field) {
    const value = field.value.trim();
    if (!value) return 'This field is required.';
    if (['firstName', 'lastName'].includes(field.name) && !/^\p{L}+$/u.test(value)) {
      return 'Use letters only (no spaces, numbers or punctuation).';
    }
    if (field.name === 'email' && (field.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
      return 'Enter a valid email address, such as name@example.com.';
    }
    if (field.name === 'phone' && !/^\+370 6\d{2} \d{5}$/.test(value)) {
      return 'Enter a complete Lithuanian mobile number: +370 6xx xxxxx.';
    }
    if (field.name.startsWith('rating') && (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 10)) {
      return 'Enter a whole number from 1 to 10.';
    }
    return '';
  }

  function validate(field, showError) {
    const message = errorFor(field);
    field.setCustomValidity(message);
    const visible = showError && Boolean(message);
    field.classList.toggle('is-invalid', visible);
    field.setAttribute('aria-invalid', String(visible));
    document.getElementById(`${field.id}-error`).textContent = visible ? message : '';
    return !message;
  }

  function update() {
    // Validate every field, even when an earlier field is invalid.
    const valid = fields.map(field => validate(field, touched.has(field))).every(Boolean);
    submit.disabled = !valid;
  }

  function formatPhone() {
    const oldValue = phone.value;
    const caret = phone.selectionStart ?? oldValue.length;
    let digitsBeforeCaret = oldValue.slice(0, caret).replace(/\D/g, '').length;
    let digits = oldValue.replace(/\D/g, '');
    // Accept a pasted full international number as well as 8 local digits.
    if (digits.startsWith('00370')) { digits = digits.slice(2); digitsBeforeCaret = Math.max(0, digitsBeforeCaret - 2); }
    const hasCountryCode = digits.startsWith('370');
    const local = (hasCountryCode ? digits.slice(3) : digits).slice(0, 8);
    phone.value = local ? `+370 ${local.slice(0, 3)}${local.length > 3 ? ' ' + local.slice(3) : ''}` : '';
    if (phone.value) {
      const target = hasCountryCode ? digitsBeforeCaret : digitsBeforeCaret + 3;
      let count = 0;
      let position = 0;
      while (position < phone.value.length && count < target) {
        if (/\d/.test(phone.value[position])) count++;
        position++;
      }
      phone.setSelectionRange(position, position);
    }
  }

  fields.forEach(field => {
    field.addEventListener('input', () => {
      if (field === phone) formatPhone();
      else touched.add(field);
      update();
    });
    field.addEventListener('blur', () => { touched.add(field); update(); });
    field.addEventListener('change', () => {
      if (field === phone) formatPhone();
      touched.add(field);
      update();
    });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    fields.forEach(field => touched.add(field));
    update();
    if (submit.disabled) { fields.find(field => errorFor(field)).focus(); return; }
    const data = Object.fromEntries(fields.map(field => [field.name,
      field.name.startsWith('rating') ? Number(field.value) : field.value.trim()]));
    console.log(data);
    const labels = { firstName: 'First name', lastName: 'Last name', email: 'Email', phone: 'Phone number', address: 'Address', rating1: 'Content clarity rating', rating2: 'Navigation rating', rating3: 'Design rating' };
    dataOutput.replaceChildren();
    Object.entries(data).forEach(([key, value]) => {
      const line = document.createElement('p');
      // textContent displays user input as text, never as executable HTML.
      line.textContent = `${labels[key]}: ${value}`;
      dataOutput.append(line);
    });
    const average = (data.rating1 + data.rating2 + data.rating3) / 3;
    averageOutput.textContent = `${data.firstName} ${data.lastName}: ${average.toFixed(2)}`;
    result.hidden = false;
    result.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  });

  form.addEventListener('reset', () => {
    touched.clear();
    fields.forEach(field => {
      field.value = '';
      field.setCustomValidity('');
      field.classList.remove('is-invalid');
      field.removeAttribute('aria-invalid');
      document.getElementById(`${field.id}-error`).textContent = '';
    });
    dataOutput.replaceChildren();
    averageOutput.textContent = '';
    result.hidden = true;
    submit.disabled = true;
  });
  update();
  window.addEventListener('pageshow', update);
})();
