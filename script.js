'use strict';

document.documentElement.classList.add('js');

const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#nav');
const compactNav = window.matchMedia('(max-width: 850px)');

const layerToggle = document.querySelector('.layer-toggle');
layerToggle.hidden = false;
layerToggle.addEventListener('click', () => {
  const compact = layerToggle.closest('.hero-board').classList.toggle('is-compact');
  layerToggle.firstElementChild.textContent = compact ? 'Разнести слои' : 'Сблизить слои';
});

const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
if (motion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  }, { threshold: .15 });
  document.querySelectorAll('.service, .process-list li, .request, .about-layout, .gallery-tile, .reviews, .closing, .contact-grid')
    .forEach((element) => observer.observe(element));
}

function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  menu.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  nav.classList.toggle('is-open', open);
}

menu.hidden = false;
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') === 'false'));
compactNav.addEventListener('change', () => setMenu(false));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) {
    setMenu(false);
    menu.focus();
  }
});
nav.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || !compactNav.matches) return;
  setMenu(false);
  const target = document.querySelector(link.hash);
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});

const devices = {
  phone: { label: 'Смартфон', issues: ['Разбит экран', 'Не заряжается', 'Не включается', 'Быстро разряжается'] },
  laptop: { label: 'Ноутбук', issues: ['Не включается', 'Нет изображения', 'Не заряжается', 'Перегревается'] },
  desktop: { label: 'Компьютер', issues: ['Не включается', 'Нет изображения', 'Не загружается система', 'Выключается во время работы'] },
  other: { label: 'Другая техника', issues: ['Не включается', 'Работает с перебоями', 'Не реагирует на управление', 'Показывает ошибку'] }
};
const dataIssues = ['Пропали файлы', 'Носитель не определяется', 'Нет доступа к файлам'];

const form = document.querySelector('#repair-form');
const panels = [...form.querySelectorAll('.form-panel')];
const steps = [...form.querySelectorAll('.steps li')];
const progress = form.querySelector('.progress-track');
const count = form.querySelector('#step-count');
const deviceOptions = form.querySelector('#device-options');
const issueOptions = form.querySelector('#issue-options');
const back = form.querySelector('.back');
const next = form.querySelector('.next');
const send = form.querySelector('.send');
const model = form.elements.model;
const details = form.elements.details;
const message = document.querySelector('#message');
const copyStatus = form.querySelector('.copy-status');
const errors = {
  device: form.querySelector('#device-error'),
  issue: form.querySelector('#issue-error'),
  details: form.querySelector('#details-error')
};
let step = 0;
let service = '';

function makeChoice(name, value, caption) {
  const label = document.createElement('label');
  label.className = 'choice';
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = name;
  input.value = value;
  label.append(input, document.createTextNode(caption));
  return label;
}

function selected(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value || '';
}

function clearError(name) {
  errors[name].hidden = true;
  const field = name === 'details' ? details : errors[name].previousElementSibling;
  field.removeAttribute('aria-invalid');
}

function showError(name, field, focusTarget = field) {
  field.setAttribute('aria-invalid', 'true');
  errors[name].hidden = false;
  focusTarget.focus();
}

function setStep(index, moveFocus = true) {
  step = index;
  panels.forEach((panel, i) => { panel.hidden = i !== index; });
  steps.forEach((item, i) => {
    if (i === index) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
    item.classList.toggle('done', i < index);
  });
  const direction = service === 'data' ? ' · Восстановление данных' : '';
  count.textContent = `Шаг ${index + 1} из ${steps.length}${direction}`;
  progress.style.setProperty('--progress', (index + 1) / steps.length);
  back.hidden = index === 0;
  next.hidden = index === steps.length - 1;
  send.hidden = !next.hidden;
  copyStatus.textContent = '';
  if (moveFocus) panels[index].querySelector('[tabindex="-1"]').focus();
}

function updateIssues() {
  const key = selected('device');
  const issues = service === 'data' ? dataIssues : devices[key].issues;
  issueOptions.replaceChildren(...[...issues, 'Другая проблема'].map((issue) => makeChoice('issue', issue, issue)));
  clearError('issue');
}

deviceOptions.replaceChildren(...Object.entries(devices).map(([key, device]) => makeChoice('device', key, device.label)));
form.hidden = false;
setStep(0, false);

form.addEventListener('change', (event) => {
  if (event.target.name === 'device') {
    clearError('device');
    updateIssues();
  }
  if (event.target.name === 'issue') clearError('issue');
});
details.addEventListener('input', () => clearError('details'));

const serviceLinks = [...document.querySelectorAll('[data-service]')];
serviceLinks.forEach((link) => {
  link.addEventListener('click', () => {
    service = link.dataset.service;
    const preset = { phone: 'phone', computers: 'laptop', other: 'other', data: 'other' }[service];
    serviceLinks.forEach((item) => item.classList.toggle('is-selected', item === link));
    for (const input of deviceOptions.querySelectorAll('input')) {
      input.checked = input.value === preset;
    }
    updateIssues();
    for (const name of Object.keys(errors)) clearError(name);
    setStep(service === 'phone' || service === 'other' ? 1 : 0, false);
    panels[step].querySelector('[tabindex="-1"]').focus({ preventScroll: true });
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const device = selected('device');
  const issue = selected('issue');
  if (step === 0) {
    if (!device) return showError('device', deviceOptions.parentElement, deviceOptions.querySelector('input'));
    if (!issueOptions.childElementCount) updateIssues();
  }
  if (step === 1 && !issue) {
    return showError('issue', issueOptions.parentElement, issueOptions.querySelector('input'));
  }
  if (step === 2) {
    const description = details.value.trim();
    if (!description) return showError('details', details);
    const brand = model.value.trim();
    message.value = [
      'Здравствуйте! Хочу обратиться в АМТ Сервис.',
      service === 'data' ? 'Направление: восстановление данных' : '',
      `Устройство: ${devices[device].label}`,
      `Проблема: ${issue}`,
      brand ? `Бренд и модель: ${brand}` : '',
      `Описание: ${description}`
    ].filter(Boolean).join('\n');
  }
  if (step < 3) setStep(step + 1);
});
back.addEventListener('click', () => setStep(step - 1));

form.querySelector('.copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(message.value);
    copyStatus.textContent = 'Текст скопирован.';
  } catch {
    message.focus();
    message.select();
    copyStatus.textContent = 'Текст выделен. Скопируйте его через меню или Ctrl+C.';
  }
});

// Add only approved files here. Keys correspond to data-photo in index.html.
const photos = {
  // hero: { file: 'hero.webp', small: 'hero-640.webp' },
  // entrance: { file: 'entrance.webp' }
};
const lightbox = document.querySelector('.lightbox');
const gallery = document.querySelector('.gallery');
const preview = lightbox.querySelector('img');
const caption = document.querySelector('#photo-caption');
const previousPhoto = lightbox.querySelector('.previous-photo');
const nextPhoto = lightbox.querySelector('.next-photo');
let activeTile;
const photoFolder = 'assets/photos/';

function galleryButtons() {
  return [...document.querySelectorAll('.photo-button:enabled')];
}

function showPhoto(tile) {
  activeTile = tile;
  const alt = tile.closest('[data-photo]').dataset.alt;
  caption.textContent = alt;
  preview.alt = alt;
  preview.src = tile.dataset.full;
  previousPhoto.hidden = nextPhoto.hidden = galleryButtons().length < 2;
  if (!lightbox.open) lightbox.showModal();
}

function shiftPhoto(offset) {
  const buttons = galleryButtons();
  const index = buttons.indexOf(activeTile);
  showPhoto(buttons[(index + offset + buttons.length) % buttons.length]);
}
previousPhoto.addEventListener('click', () => shiftPhoto(-1));
nextPhoto.addEventListener('click', () => shiftPhoto(1));
lightbox.querySelector('.close-photo').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});
lightbox.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') shiftPhoto(-1);
  if (event.key === 'ArrowRight') shiftPhoto(1);
});

document.querySelectorAll('[data-photo]').forEach((tile) => {
  const photo = photos[tile.dataset.photo];
  if (!photo) return;
  const isHero = tile.dataset.photo === 'hero';
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  const board = isHero ? tile.firstElementChild : null;
  const full = photoFolder + photo.file;
  const small = photo.small && photoFolder + photo.small;
  if (small) {
    img.srcset = `${small} 640w, ${full} 1280w`;
    img.sizes = isHero ? '(max-width: 700px) calc(100vw - 32px), 48vw' :
      '(max-width: 700px) 100vw, 50vw';
  }
  img.alt = isHero ? tile.dataset.alt : '';
  img.decoding = 'async';
  img.loading = isHero ? 'eager' : 'lazy';
  picture.append(img);
  if (isHero) {
    picture.hidden = true;
    tile.append(picture);
    img.addEventListener('load', () => {
      board.hidden = true;
      picture.hidden = false;
    }, { once: true });
    img.src = full;
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.disabled = true;
  button.className = 'photo-button';
  button.dataset.full = full;
  button.setAttribute('aria-label', `Увеличить фото «${tile.dataset.alt}»`);
  const zoom = document.createElement('span');
  zoom.className = 'zoom';
  zoom.setAttribute('aria-hidden', 'true');
  zoom.textContent = '+';
  button.append(picture, zoom);
  button.addEventListener('click', () => showPhoto(button));
  tile.prepend(button);
  tile.hidden = false;
  gallery.hidden = false;
  img.addEventListener('load', () => {
    button.disabled = false;
  }, { once: true });
  img.addEventListener('error', () => {
    tile.hidden = true;
    gallery.hidden = !gallery.querySelector('.gallery-tile:not([hidden])');
  }, { once: true });
  img.src = full;
});
