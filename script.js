/* =========================================================
   LUMORA — Energy Analytics Dashboard
   Complete client-side JavaScript for the current index.html
   ========================================================= */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const money = (value) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 2 }).format(Number(value) || 0).replace('BDT', '৳');
  const number = (value, digits = 1) => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(Number(value) || 0);
  const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  const dateChip = $('#dateChip');
  if (dateChip) dateChip.textContent = new Intl.DateTimeFormat('en-BD', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());

  let toastTimeout;
  const showToast = (message) => {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
  };

  const sidebar = $('#sidebar');
  const menuToggle = $('#menuToggle');
  if (sidebar && menuToggle) {
    menuToggle.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    $$('.nav-link', sidebar).forEach((link) => link.addEventListener('click', () => {
      sidebar.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  const navLinks = $$('.nav-link');
  const setActiveNav = (hash) => navLinks.forEach((link) => {
    const active = link.getAttribute('href') === hash;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  navLinks.forEach((link) => link.addEventListener('click', () => setActiveNav(link.getAttribute('href'))));
  window.addEventListener('hashchange', () => setActiveNav(window.location.hash || '#overview'));

  const billForm = $('#billForm');
  const unitsInput = $('#units');
  const tariffInput = $('#tariff');
  const estimatedBill = $('#estimatedBill');
  const totalCost = $('#totalCost');
  const totalUsage = $('#totalUsage');
  const dailyAverage = $('#dailyAverage');
  const calculateBill = (event) => {
    if (event) event.preventDefault();
    if (!unitsInput || !tariffInput) return;
    const units = Number(unitsInput.value);
    const tariff = Number(tariffInput.value);
    if (!Number.isFinite(units) || !Number.isFinite(tariff) || units < 0 || tariff < 0) return showToast('Enter valid non-negative units and rate.');
    const estimate = units * tariff;
    if (estimatedBill) estimatedBill.textContent = money(estimate);
    if (totalUsage) totalUsage.textContent = number(units, 2);
    if (totalCost) totalCost.textContent = number(estimate, 2);
    if (dailyAverage) dailyAverage.textContent = number(units / 30, 2);
    showToast('Bill estimate updated.');
  };
  if (billForm) billForm.addEventListener('submit', calculateBill);

  const chartCanvas = $('#usageChart');
  const chartTotal = $('#chartTotal');
  const chartCaption = $('#chartCaption');
  const rangeButtons = $$('.range-btn');
  const chartData = {
    day: { labels: ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'], values: [0.3, 0.5, 0.7, 1.1, 0.8, 0.6, 1.3, 1.0, 0.4], caption: 'Total today' },
    week: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [5.2, 6.4, 5.7, 7.1, 4.9, 8.3, 5.9], caption: 'Total this week' },
    month: { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], values: [39.6, 42.8, 38.4, 43.5], caption: 'Total this month' }
  };
  let usageChart = null;
  let currentRange = 'week';
  const updateChartTotal = (range) => {
    const data = chartData[range];
    const sum = data.values.reduce((total, value) => total + value, 0);
    if (chartTotal) chartTotal.innerHTML = `${number(sum, 1)} <span>kWh</span>`;
    if (chartCaption) chartCaption.textContent = data.caption;
  };
  const setChartRange = (range) => {
    if (!chartData[range]) return;
    currentRange = range;
    rangeButtons.forEach((button) => {
      const active = button.dataset.range === range;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    updateChartTotal(range);
    if (usageChart) {
      usageChart.data.labels = chartData[range].labels;
      usageChart.data.datasets[0].data = chartData[range].values;
      usageChart.update();
    }
  };
  rangeButtons.forEach((button) => button.addEventListener('click', () => setChartRange(button.dataset.range)));

  if (chartCanvas && typeof window.Chart === 'function') {
    const context = chartCanvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(34, 211, 238, 0.28)');
    gradient.addColorStop(1, 'rgba(34, 211, 238, 0.01)');
    usageChart = new Chart(context, {
      type: 'line',
      data: { labels: chartData.week.labels, datasets: [{ label: 'Electricity usage (kWh)', data: chartData.week.values, borderColor: '#22d3ee', backgroundColor: gradient, borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: '#22d3ee', pointBorderColor: '#0b1220', pointBorderWidth: 2, fill: true, tension: 0.38 }] },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#111c2e', titleColor: '#f3f7fb', bodyColor: '#b9c6d8', borderColor: 'rgba(148, 163, 184, 0.2)', borderWidth: 1, padding: 10, callbacks: { label: (context) => ` ${number(context.parsed.y, 2)} kWh` } } },
        scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#91a2b8', font: { family: 'DM Sans' } } }, y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.10)' }, border: { display: false, dash: [4, 4] }, ticks: { color: '#91a2b8', padding: 8, font: { family: 'DM Sans' } } } }
      }
    });
    updateChartTotal(currentRange);
  }

  // My Readings: browser-local storage, editing, deletion and CSV export.
  const STORAGE_KEY = 'lumora-personal-readings-v1';
  const readingForm = $('#readingForm');
  const readingDate = $('#readingDate');
  const readingUnits = $('#readingUnits');
  const readingsSummary = $('#readingsSummary');
  const readingsTableBody = $('#readingsTableBody');
  const exportReadings = $('#exportReadings');
  let readings = [];
  let editingId = null;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(saved)) readings = saved.filter((item) => item && typeof item.date === 'string' && Number.isFinite(Number(item.units))).map((item) => ({ id: String(item.id || `${Date.now()}-${Math.random()}`), date: item.date, units: Number(item.units) }));
  } catch (error) { console.warn('Lumora could not read saved readings:', error); readings = []; }
  if (readingDate && !readingDate.value) readingDate.value = localDate();
  const saveReadings = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(readings)); }
    catch (error) { console.error('Lumora could not save readings:', error); showToast('Could not save data in this browser.'); }
  };
  const sortedReadings = () => [...readings].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const renderReadings = () => {
    if (!readingsTableBody || !readingsSummary) return;
    const sorted = sortedReadings();
    const total = readings.reduce((sum, item) => sum + Number(item.units), 0);
    readingsSummary.textContent = readings.length ? `${readings.length} reading${readings.length === 1 ? '' : 's'} saved · ${number(total, 2)} kWh total` : 'Your saved readings will appear here.';
    if (!sorted.length) {
      readingsTableBody.innerHTML = '<tr><td colspan="3" class="empty-state">No personal readings yet. Add your first reading above.</td></tr>';
      return;
    }
    readingsTableBody.innerHTML = sorted.map((item) => `<tr><td>${escapeHTML(item.date)}</td><td>${number(item.units, 2)} kWh</td><td class="reading-actions"><button type="button" class="reading-action" data-action="edit" data-id="${escapeHTML(item.id)}" aria-label="Edit reading from ${escapeHTML(item.date)}">Edit</button><button type="button" class="reading-action delete" data-action="delete" data-id="${escapeHTML(item.id)}" aria-label="Delete reading from ${escapeHTML(item.date)}">Delete</button></td></tr>`).join('');
  };
  const resetReadingForm = () => {
    editingId = null;
    if (readingForm) {
      readingForm.reset();
      const submitButton = $('button[type="submit"]', readingForm);
      if (submitButton) submitButton.innerHTML = 'Add reading <span aria-hidden="true">＋</span>';
    }
    if (readingDate) readingDate.value = localDate();
  };
  if (readingForm && readingDate && readingUnits) readingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const date = readingDate.value;
    const units = Number(readingUnits.value);
    if (!date || !Number.isFinite(units) || units <= 0) return showToast('Choose a date and enter usage greater than zero.');
    if (editingId) {
      readings = readings.map((item) => item.id === editingId ? { ...item, date, units } : item);
      showToast('Reading updated.');
    } else {
      readings.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, date, units });
      showToast('Reading added.');
    }
    saveReadings(); renderReadings(); resetReadingForm();
  });
  if (readingsTableBody) readingsTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const item = readings.find((reading) => reading.id === button.dataset.id);
    if (!item) return;
    if (button.dataset.action === 'edit') {
      editingId = item.id;
      if (readingDate) readingDate.value = item.date;
      if (readingUnits) readingUnits.value = item.units;
      const submitButton = readingForm ? $('button[type="submit"]', readingForm) : null;
      if (submitButton) submitButton.innerHTML = 'Save changes <span aria-hidden="true">✓</span>';
      readingForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (readingUnits) readingUnits.focus({ preventScroll: true });
    } else if (button.dataset.action === 'delete') {
      if (!window.confirm(`Delete the reading for ${item.date}?`)) return;
      readings = readings.filter((reading) => reading.id !== item.id);
      saveReadings(); renderReadings();
      if (editingId === item.id) resetReadingForm();
      showToast('Reading deleted.');
    }
  });
  if (exportReadings) exportReadings.addEventListener('click', () => {
    if (!readings.length) return showToast('Add at least one reading before exporting.');
    const rows = [['Date', 'Usage (kWh)'], ...sortedReadings().map((item) => [item.date, item.units])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `lumora-readings-${localDate()}.csv`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    showToast('CSV export downloaded.');
  });
  renderReadings();
  if (window.location.hash) setActiveNav(window.location.hash);
});
