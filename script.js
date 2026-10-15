
/* =========================================================
   LUMORA — Energy Analytics Dashboard
   Real analytics based on saved personal readings
   ========================================================= */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const money = (value) =>
    new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 2
    }).format(Number(value) || 0).replace('BDT', '৳');

  const number = (value, digits = 1) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: digits
    }).format(Number(value) || 0);

  const localDate = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const parseDate = (value) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const dateKey = (date) => localDate(date);

  const escapeHTML = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));

  // ---------------------------------------------------------
  // Date chip
  // ---------------------------------------------------------

  const dateChip = $('#dateChip');

  if (dateChip) {
    dateChip.textContent = new Intl.DateTimeFormat('en-BD', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date());
  }

  // ---------------------------------------------------------
  // Toast notification
  // ---------------------------------------------------------

  let toastTimeout;

  const showToast = (message) => {
    const toast = $('#toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  };

  // ---------------------------------------------------------
  // Mobile sidebar and navigation
  // ---------------------------------------------------------

  const sidebar = $('#sidebar');
  const menuToggle = $('#menuToggle');

  if (sidebar && menuToggle) {
    menuToggle.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    $$('.nav-link', sidebar).forEach((link) => {
      link.addEventListener('click', () => {
        sidebar.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const navLinks = $$('.nav-link');

  const setActiveNav = (hash) => {
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === hash;

      link.classList.toggle('active', active);

      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      setActiveNav(link.getAttribute('href'));
    });
  });

  window.addEventListener('hashchange', () => {
    setActiveNav(window.location.hash || '#overview');
  });

  // ---------------------------------------------------------
  // Bill calculator
  // ---------------------------------------------------------

  const billForm = $('#billForm');
  const unitsInput = $('#units');
  const tariffInput = $('#tariff');
  const estimatedBill = $('#estimatedBill');

  const calculateBill = (event) => {
    if (event) event.preventDefault();

    if (!unitsInput || !tariffInput) return;

    const units = Number(unitsInput.value);
    const tariff = Number(tariffInput.value);

    if (
      unitsInput.value.trim() === '' ||
      tariffInput.value.trim() === '' ||
      !Number.isFinite(units) ||
      !Number.isFinite(tariff) ||
      units < 0 ||
      tariff < 0
    ) {
      showToast('Enter valid non-negative units and rate.');
      return;
    }

    if (estimatedBill) {
      estimatedBill.textContent = money(units * tariff);
    }

    showToast('Bill estimate updated.');
  };

  if (billForm) {
    billForm.addEventListener('submit', calculateBill);
  }

  // ---------------------------------------------------------
  // Personal readings and local storage
  // ---------------------------------------------------------

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

    if (Array.isArray(saved)) {
      readings = saved
        .filter((item) =>
          item &&
          typeof item.date === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
          Number.isFinite(Number(item.units)) &&
          Number(item.units) > 0
        )
        .map((item) => ({
          id: String(item.id || `${Date.now()}-${Math.random()}`),
          date: item.date,
          units: Number(item.units)
        }));
    }
  } catch (error) {
    console.warn('Lumora could not read saved readings:', error);
    readings = [];
  }

  if (readingDate && !readingDate.value) {
    readingDate.value = localDate();
  }

  const saveReadings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
    } catch (error) {
      console.error('Lumora could not save readings:', error);
      showToast('Could not save data in this browser.');
    }
  };

  const sortedReadings = () =>
    [...readings].sort((a, b) =>
      b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
    );

  const renderReadings = () => {
    if (!readingsTableBody || !readingsSummary) return;

    const sorted = sortedReadings();
    const total = readings.reduce((sum, item) => sum + item.units, 0);

    readingsSummary.textContent = readings.length
      ? `${readings.length} reading${readings.length === 1 ? '' : 's'} saved · ${number(total, 2)} kWh total`
      : 'Your saved readings will appear here.';

    if (!sorted.length) {
      readingsTableBody.innerHTML =
        '<tr><td colspan="3" class="empty-state">No personal readings yet. Add your first reading above.</td></tr>';
      return;
    }

    readingsTableBody.innerHTML = sorted.map((item) => `
      <tr>
        <td>${escapeHTML(item.date)}</td>
        <td>${number(item.units, 2)} kWh</td>
        <td class="reading-actions">
          <button type="button"
            class="reading-action"
            data-action="edit"
            data-id="${escapeHTML(item.id)}"
            aria-label="Edit reading from ${escapeHTML(item.date)}">Edit</button>
          <button type="button"
            class="reading-action delete"
            data-action="delete"
            data-id="${escapeHTML(item.id)}"
            aria-label="Delete reading from ${escapeHTML(item.date)}">Delete</button>
        </td>
      </tr>
    `).join('');
  };

  const resetReadingForm = () => {
    editingId = null;

    if (readingForm) {
      readingForm.reset();

      const submitButton = $('button[type="submit"]', readingForm);

      if (submitButton) {
        submitButton.innerHTML = 'Add reading <span aria-hidden="true">＋</span>';
      }
    }

    if (readingDate) {
      readingDate.value = localDate();
    }
  };

  // ---------------------------------------------------------
  // Real analytics: aggregate actual saved readings
  // ---------------------------------------------------------

  const chartCanvas = $('#usageChart');
  const chartTotal = $('#chartTotal');
  const chartCaption = $('#chartCaption');
  const rangeButtons = $$('.range-btn');

  let usageChart = null;
  let currentRange = 'week';

  // Week starts on Monday.
  const startOfWeek = (date) => {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = result.getDay();
    result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
    return result;
  };

  const formatShortDate = (date) =>
    new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short'
    }).format(date);

  const getChartData = (range) => {
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const data = [];

    if (range === 'day') {
      // Last seven calendar days, including today.
      for (let i = 6; i >= 0; i--) {
        const date = new Date(todayStart);
        date.setDate(date.getDate() - i);

        data.push({
          key: dateKey(date),
          label: formatShortDate(date),
          value: 0
        });
      }
    } else if (range === 'week') {
      // Current week plus seven previous weeks.
      const currentMonday = startOfWeek(todayStart);

      for (let i = 7; i >= 0; i--) {
        const start = new Date(currentMonday);
        start.setDate(start.getDate() - i * 7);

        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        data.push({
          start,
          end,
          label: formatShortDate(start),
          value: 0
        });
      }
    } else if (range === 'month') {
      // Current month plus five previous months.
      for (let i = 5; i >= 0; i--) {
        const start = new Date(
          today.getFullYear(),
          today.getMonth() - i,
          1
        );

        const end = new Date(
          start.getFullYear(),
          start.getMonth() + 1,
          1
        );

        data.push({
          start,
          end,
          label: new Intl.DateTimeFormat('en', {
            month: 'short',
            year: '2-digit'
          }).format(start),
          value: 0
        });
      }
    }

    // Put each saved reading into the matching date/week/month.
    readings.forEach((reading) => {
      const date = parseDate(reading.date);

      if (range === 'day') {
        const bucket = data.find((item) => item.key === reading.date);
        if (bucket) bucket.value += reading.units;
      } else {
        const bucket = data.find((item) =>
          date >= item.start && date < item.end
        );

        if (bucket) bucket.value += reading.units;
      }
    });

    return {
      labels: data.map((item) => item.label),
      values: data.map((item) => Number(item.value.toFixed(2)))
    };
  };

  const rangeCaptions = {
    day: 'Daily usage · last 7 days',
    week: 'Weekly usage · last 8 weeks',
    month: 'Monthly usage · last 6 months'
  };

  const updateChartTotal = (range) => {
    const data = getChartData(range);
    const total = data.values.reduce((sum, value) => sum + value, 0);

    if (chartTotal) {
      chartTotal.innerHTML = `${number(total, 2)} <span>kWh</span>`;
    }

    if (chartCaption) {
      chartCaption.textContent = rangeCaptions[range];
    }

    return data;
  };

  const setActiveRangeButtons = (range) => {
    rangeButtons.forEach((button) => {
      const active = button.dataset.range === range;

      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  const refreshAnalyticsChart = () => {
    const data = updateChartTotal(currentRange);

    setActiveRangeButtons(currentRange);

    if (usageChart) {
      usageChart.data.labels = data.labels;
      usageChart.data.datasets[0].data = data.values;
      usageChart.update();
    }
  };

  const setChartRange = (range) => {
    if (!['day', 'week', 'month'].includes(range)) return;

    currentRange = range;
    refreshAnalyticsChart();
  };

  rangeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setChartRange(button.dataset.range);
    });
  });

  if (chartCanvas && typeof window.Chart === 'function') {
    const context = chartCanvas.getContext('2d');

    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 280);
      gradient.addColorStop(0, 'rgba(34, 211, 238, 0.28)');
      gradient.addColorStop(1, 'rgba(34, 211, 238, 0.01)');

      const initialData = getChartData(currentRange);

      usageChart = new window.Chart(context, {
        type: 'line',
        data: {
          labels: initialData.labels,
          datasets: [{
            label: 'Electricity usage (kWh)',
            data: initialData.values,
            borderColor: '#22d3ee',
            backgroundColor: gradient,
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#22d3ee',
            pointBorderColor: '#0b1220',
            pointBorderWidth: 2,
            fill: true,
            tension: 0.38
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#111c2e',
              titleColor: '#f3f7fb',
              bodyColor: '#b9c6d8',
              borderColor: 'rgba(148, 163, 184, 0.2)',
              borderWidth: 1,
              padding: 10,
              callbacks: {
                label: (context) =>
                  ` ${number(context.parsed.y, 2)} kWh`
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              border: {
                display: false
              },
              ticks: {
                color: '#91a2b8',
                font: {
                  family: 'DM Sans'
                }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(148, 163, 184, 0.10)'
              },
              border: {
                display: false,
                dash: [4, 4]
              },
              ticks: {
                color: '#91a2b8',
                padding: 8,
                font: {
                  family: 'DM Sans'
                }
              }
            }
          }
        }
      });
    }
  } else if (chartCanvas) {
    console.warn('Lumora: Chart.js was not loaded.');
  }

  // ---------------------------------------------------------
  // Dashboard summary: saved readings, not demo values
  // ---------------------------------------------------------

  const totalCost = $('#totalCost');
  const totalUsage = $('#totalUsage');
  const dailyAverage = $('#dailyAverage');

  const updateDashboardSummary = () => {
    const total = readings.reduce((sum, item) => sum + item.units, 0);
    const tariff = Number(tariffInput?.value);

    const validTariff =
      tariffInput &&
      tariffInput.value.trim() !== '' &&
      Number.isFinite(tariff) &&
      tariff >= 0;

    const dates = [...new Set(readings.map((item) => item.date))];

    if (totalUsage) {
      totalUsage.textContent = number(total, 2);
    }

    if (totalCost) {
      totalCost.textContent = number(
        validTariff ? total * tariff : 0,
        2
      );
    }

    if (dailyAverage) {
      dailyAverage.textContent = number(
        dates.length ? total / dates.length : 0,
        2
      );
    }
  };

  const refreshAllAnalytics = () => {
    renderReadings();
    refreshAnalyticsChart();
    updateDashboardSummary();
  };

  // Update estimate if the tariff changes.
  if (tariffInput) {
    tariffInput.addEventListener('input', updateDashboardSummary);
  }

  // ---------------------------------------------------------
  // Add and edit readings
  // ---------------------------------------------------------

  if (readingForm && readingDate && readingUnits) {
    readingForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const date = readingDate.value;
      const unitsText = readingUnits.value.trim();
      const units = Number(unitsText);

      if (
        !date ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        unitsText === '' ||
        !Number.isFinite(units) ||
        units <= 0
      ) {
        showToast('Choose a date and enter usage greater than zero.');
        return;
      }

      if (editingId) {
        readings = readings.map((item) =>
          item.id === editingId
            ? { ...item, date, units }
            : item
        );

        showToast('Reading updated.');
      } else {
        readings.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          date,
          units
        });

        showToast('Reading added.');
      }

      saveReadings();
      refreshAllAnalytics();
      resetReadingForm();
    });
  }

  // ---------------------------------------------------------
  // Edit and delete buttons
  // ---------------------------------------------------------

  if (readingsTableBody) {
    readingsTableBody.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;

      const item = readings.find(
        (reading) => reading.id === button.dataset.id
      );

      if (!item) return;

      if (button.dataset.action === 'edit') {
        editingId = item.id;

        if (readingDate) readingDate.value = item.date;
        if (readingUnits) readingUnits.value = item.units;

        const submitButton = readingForm
          ? $('button[type="submit"]', readingForm)
          : null;

        if (submitButton) {
          submitButton.innerHTML =
            'Save changes <span aria-hidden="true">✓</span>';
        }

        readingForm?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        if (readingUnits) {
          readingUnits.focus({ preventScroll: true });
        }
      } else if (button.dataset.action === 'delete') {
        if (!window.confirm(`Delete the reading for ${item.date}?`)) {
          return;
        }

        readings = readings.filter(
          (reading) => reading.id !== item.id
        );

        saveReadings();
        refreshAllAnalytics();

        if (editingId === item.id) {
          resetReadingForm();
        }

        showToast('Reading deleted.');
      }
    });
  }

  // ---------------------------------------------------------
  // Export readings to CSV
  // ---------------------------------------------------------

  if (exportReadings) {
    exportReadings.addEventListener('click', () => {
      if (!readings.length) {
        showToast('Add at least one reading before exporting.');
        return;
      }

      const rows = [
        ['Date', 'Usage (kWh)'],
        ...sortedReadings().map((item) => [item.date, item.units])
      ];

      const csv = rows
        .map((row) =>
          row.map((cell) =>
            `"${String(cell).replace(/"/g, '""')}"`
          ).join(',')
        )
        .join('\r\n');

      const blob = new Blob(['\uFEFF', csv], {
        type: 'text/csv;charset=utf-8;'
      });

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download = `lumora-readings-${localDate()}.csv`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      showToast('CSV export downloaded.');
    });
  }

  // ---------------------------------------------------------
  // Initial render
  // ---------------------------------------------------------

  refreshAllAnalytics();

  if (window.location.hash) {
    setActiveNav(window.location.hash);
  }

  console.info('Lumora loaded. Analytics use saved personal readings.');
});
