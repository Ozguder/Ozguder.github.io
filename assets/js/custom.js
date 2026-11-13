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

/** Laboratory Work 12: dynamic skill board and persistent progress. */
(() => {
  'use strict';
  const module = document.getElementById('competency');
  if (!module) return;
  const statuses = ['Planned', 'In Progress', 'Completed'];
  const storageKey = 'ozguder.competency.statuses.v1';
  // Same eight skills, initial statuses and XP values as Laboratory Work 10.
  const skills = [
    { id: 'javascript-dom', name: 'JavaScript DOM Manipulation', status: 'Planned', xp: 60 },
    { id: 'software-testing', name: 'Automated Software Testing', status: 'Planned', xp: 40 },
    { id: 'python-data', name: 'Python Data Analysis', status: 'In Progress', xp: 70 },
    { id: 'kicad-pcb', name: 'KiCad PCB Design', status: 'In Progress', xp: 50 },
    { id: 'responsive-css', name: 'Responsive CSS Layouts', status: 'In Progress', xp: 40 },
    { id: 'semantic-html', name: 'Semantic HTML', status: 'Completed', xp: 50 },
    { id: 'git-pages', name: 'Git and GitHub Pages', status: 'Completed', xp: 40 },
    { id: 'matlab', name: 'MATLAB Programming', status: 'Completed', xp: 50 }
  ];
  const levels = [
    { level: 1, start: 0, next: 50, rank: 'Beginner' },
    { level: 2, start: 50, next: 150, rank: 'Trainee' },
    { level: 3, start: 150, next: 300, rank: 'Specialist' },
    { level: 4, start: 300, next: null, rank: 'Professional' }
  ];
  const columns = statuses.map(status => module.querySelector('#skills-' + status.toLowerCase().replaceAll(' ', '-')));
  const output = (id, value) => { document.getElementById(id).textContent = value; };

  function restoreSkillStatuses() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
      skills.forEach(skill => {
        if (Object.hasOwn(saved, skill.id) && statuses.includes(saved[skill.id])) skill.status = saved[skill.id];
      });
    } catch {
      output('competency-storage-note', 'Saved progress could not be loaded. Initial skill states are used.');
    }
  }

  function saveSkillStatuses() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(skills.map(skill => [skill.id, skill.status]))));
      output('competency-storage-note', 'Progress saved in this browser.');
    } catch {
      output('competency-storage-note', 'Progress updated for this visit. Browser storage is unavailable, so it cannot be saved.');
    }
  }

  function renderSkillCards() {
    columns.forEach(column => column.replaceChildren());
    skills.forEach(skill => {
      const card = document.createElement('article');
      card.className = 'competency-card';
      const title = document.createElement('h5');
      title.textContent = skill.name;
      const meta = document.createElement('div');
      meta.className = 'competency-card-meta';
      const badge = document.createElement('span');
      badge.className = 'competency-status';
      badge.textContent = skill.status;
      const xp = document.createElement('span');
      xp.className = 'competency-xp';
      xp.textContent = skill.xp + ' XP';
      meta.append(badge, xp);
      const label = document.createElement('label');
      label.className = 'competency-status-label';
      label.htmlFor = 'status-' + skill.id;
      label.textContent = 'Change status';
      const select = document.createElement('select');
      select.id = label.htmlFor;
      select.className = 'competency-status-select';
      select.setAttribute('aria-label', 'Status for ' + skill.name);
      statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        option.selected = status === skill.status;
        select.append(option);
      });
      select.addEventListener('change', () => {
        skill.status = select.value;
        renderSkillCards();
        updateProgressInfo();
        updateStatistics();
        saveSkillStatuses();
        // Keep keyboard focus on the control after its card moves.
        document.getElementById(select.id).focus({ preventScroll: true });
      });
      card.append(title, meta, label, select);
      columns[statuses.indexOf(skill.status)].append(card);
    });
    statuses.forEach((status, index) => {
      const count = skills.filter(skill => skill.status === status).length;
      columns[index].previousElementSibling.querySelector('span').textContent = count + (count === 1 ? ' skill' : ' skills');
    });
  }

  function updateProgressInfo() {
    // Derive XP from current state, avoiding accumulated or duplicated points.
    const totalXP = skills.filter(skill => skill.status === 'Completed').reduce((sum, skill) => sum + skill.xp, 0);
    const current = levels.find(level => level.next === null || totalXP < level.next);
    const percentage = current.next === null ? 100 : (totalXP - current.start) / (current.next - current.start) * 100;
    output('competency-total-xp', totalXP);
    output('competency-level', 'Level ' + current.level);
    output('competency-rank', current.rank);
    const progress = document.getElementById('competency-xp-progress');
    progress.max = 100;
    progress.value = percentage;
    progress.textContent = percentage.toFixed(1) + '%';
    module.querySelector('label[for="competency-xp-progress"]').textContent = current.next === null
      ? 'XP progress · Highest level reached' : 'XP progress · Level ' + current.level + ' to Level ' + (current.level + 1);
    output('competency-progress-text', totalXP + ' / ' + (current.next ?? current.start) + ' XP');
    output('competency-xp-note', current.next === null
      ? '100% · Professional starts at 300 XP. Highest level reached.'
      : Number(percentage.toFixed(1)) + '% · ' + (current.next - totalXP) + ' XP to Level ' + (current.level + 1) + ' (' + levels[current.level].rank + ').');
  }

  function updateStatistics() {
    const completed = skills.filter(skill => skill.status === 'Completed').length;
    output('competency-total-skills', skills.length);
    output('competency-completed-skills', completed);
    output('competency-completion', (skills.length ? completed / skills.length * 100 : 0) + '%');
  }

  restoreSkillStatuses();
  renderSkillCards();
  updateProgressInfo();
  updateStatistics();
})();

