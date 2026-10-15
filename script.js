/* =========================================================
   LUMORA — Energy Analytics Dashboard
   Personal readings + cautious energy insights
   ========================================================= */

'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  // Authenticate before initializing the dashboard or loading private data.
  const config = window.LUMORA_SUPABASE_CONFIG;

  if (!config || !window.supabase || !window.supabase.createClient) {
    alert('Lumora could not load its authentication configuration. Please refresh the page.');
    window.location.replace('./auth.html');
    return;
  }

  const supabaseClient = window.supabase.createClient(
    config.url,
    config.publishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.replace('./auth.html');
    return;
  }

  const currentUser = sessionData.session.user;

  window.LUMORA_AUTH = {
    supabase: supabaseClient,
    user: currentUser
  };

  // Account identity and logout
  const accountArea = document.querySelector('.topbar-right');

  if (accountArea && !document.getElementById('lumoraLogout')) {
    const account = document.createElement('div');

    account.style.cssText =
      'display:flex;align-items:center;gap:10px;flex-wrap:wrap;';

    const email = document.createElement('span');
    email.textContent = currentUser.email || 'Lumora account';
    email.style.cssText =
      'color:#b9c6d8;font-size:12px;max-width:220px;overflow-wrap:anywhere;';

    const logout = document.createElement('button');
    logout.id = 'lumoraLogout';
    logout.type = 'button';
    logout.textContent = 'Logout';
    logout.style.cssText =
      'border:1px solid #26384f;background:#101d30;color:#f1f7ff;border-radius:9px;padding:8px 12px;cursor:pointer;font:inherit;font-size:12px;';

    logout.addEventListener('click', async () => {
      logout.disabled = true;
      logout.textContent = 'Logging out…';

      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        logout.disabled = false;
        logout.textContent = 'Logout';
        alert('Logout failed. Please try again.');
        return;
      }

      window.location.replace('./auth.html');
    });

    account.append(email, logout);
    accountArea.appendChild(account);
  }

  // Load only the signed-in user's readings.
  let remoteRows = [];

  const { data: initialRows, error: loadError } = await supabaseClient
    .from('lumora_readings')
    .select('id, reading_date, units')
    .eq('user_id', currentUser.id)
    .order('reading_date', { ascending: false });

  if (loadError) {
    console.error('Lumora reading load failed:', loadError);
    alert(
      'Could not load your cloud readings. Check the lumora_readings table and RLS policies.'
    );
    return;
  }

  remoteRows = initialRows || [];

  const legacyKey = 'lumora-personal-readings-v1';
  const userStorageKey = `${legacyKey}-${currentUser.id}`;

  // Offer to import older browser readings, without deleting the original.
  if (remoteRows.length === 0) {
    try {
      const legacyRows = JSON.parse(
        localStorage.getItem(legacyKey) || '[]'
      );

      if (
        Array.isArray(legacyRows) &&
        legacyRows.length > 0 &&
        window.confirm(
          `Lumora found ${legacyRows.length} older reading(s) saved in this browser. Import them into the currently signed-in account? Choose Cancel to keep this account empty.`
        )
      ) {
        const validLegacyRows = legacyRows
          .filter(item =>
            item &&
            /^\d{4}-\d{2}-\d{2}$/.test(String(item.date)) &&
            Number.isFinite(Number(item.units)) &&
            Number(item.units) > 0
          )
          .map(item => ({
            user_id: currentUser.id,
            reading_date: item.date,
            units: Number(item.units)
          }));

        if (validLegacyRows.length) {
          const { error: importError } = await supabaseClient
            .from('lumora_readings')
            .insert(validLegacyRows);

          if (importError) {
            alert(
              'The old readings could not be imported. Your browser copy has not been deleted.'
            );
          } else {
            const { data: importedRows, error: reloadError } =
              await supabaseClient
                .from('lumora_readings')
                .select('id, reading_date, units')
                .eq('user_id', currentUser.id)
                .order('reading_date', { ascending: false });

            if (!reloadError) {
              remoteRows = importedRows || [];
            }
          }
        }
      }
    } catch (error) {
      console.warn(
        'Lumora could not inspect legacy readings for import:',
        error
      );
    }
  }

  const mapCloudRows = rows => (rows || []).map(row => ({
    id: String(row.id),
    date: row.reading_date,
    units: Number(row.units)
  }));

  try {
    localStorage.setItem(
      userStorageKey,
      JSON.stringify(mapCloudRows(remoteRows))
    );
  } catch (error) {
    console.warn('Lumora local cache could not be updated:', error);
  }

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const money = value =>
    new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 2
    })
      .format(Number(value) || 0)
      .replace('BDT', '৳');

  const number = (value, digits = 1) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: digits
    }).format(Number(value) || 0);

  const localDate = (date = new Date()) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const parseDate = value => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const escapeHTML = value =>
    String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));

  const formatDate = value =>
    new Intl.DateTimeFormat('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(parseDate(value));

  const daysBetween = (first, second) =>
    Math.round(
      (parseDate(second).getTime() -
        parseDate(first).getTime()) / 86400000
    );

  // Date chip
  const dateChip = $('#dateChip');

  if (dateChip) {
    dateChip.textContent = new Intl.DateTimeFormat('en-BD', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date());
  }

  // Toast notification
  let toastTimeout;

  const showToast = message => {
    const toast = $('#toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  };

  // Navigation and mobile sidebar
  const sidebar = $('#sidebar');
  const menuToggle = $('#menuToggle');

  if (sidebar && menuToggle) {
    menuToggle.addEventListener('click', () => {
      const isOpen = sidebar.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    $$('.nav-link', sidebar).forEach(link => {
      link.addEventListener('click', () => {
        sidebar.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const navLinks = $$('.nav-link');

  const setActiveNav = hash => {
    navLinks.forEach(link => {
      const active = link.getAttribute('href') === hash;

      link.classList.toggle('active', active);

      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      setActiveNav(link.getAttribute('href'));
    });
  });

  window.addEventListener('hashchange', () => {
    setActiveNav(window.location.hash || '#overview');
  });

  // Bill calculator
  const billForm = $('#billForm');
  const unitsInput = $('#units');
  const tariffInput = $('#tariff');
  const estimatedBill = $('#estimatedBill');

  const calculateBill = event => {
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
  // My Readings — authenticated Supabase database
  // ---------------------------------------------------------

  const STORAGE_KEY = `lumora-personal-readings-v1-${currentUser.id}`;

  const readingForm = $('#readingForm');
  const readingDate = $('#readingDate');
  const readingUnits = $('#readingUnits');
  const readingsSummary = $('#readingsSummary');
  const readingsTableBody = $('#readingsTableBody');
  const exportReadings = $('#exportReadings');

  let readings = mapCloudRows(remoteRows);
  let editingId = null;

  if (readingDate && !readingDate.value) {
    readingDate.value = localDate();
  }

  const saveReadings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
    } catch (error) {
      console.warn('Lumora local cache could not be updated:', error);
    }
  };

  const sortedReadings = () =>
    [...readings].sort(
      (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
    );

  // Combine multiple entries recorded on the same date.
  const getDailyTotals = () => {
    const totals = new Map();

    readings.forEach(item => {
      totals.set(
        item.date,
        (totals.get(item.date) || 0) + item.units
      );
    });

    return [...totals.entries()]
      .map(([date, units]) => ({ date, units }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

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

    readingsTableBody.innerHTML = sorted.map(item => `
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
        submitButton.innerHTML =
          'Add reading <span aria-hidden="true">＋</span>';
      }
    }

    if (readingDate) {
      readingDate.value = localDate();
    }
  };

  // ---------------------------------------------------------
  // Energy usage analytics — personal readings only
  // ---------------------------------------------------------

  const chartCanvas = $('#usageChart');
  const chartTotal = $('#chartTotal');
  const chartCaption = $('#chartCaption');
  const rangeButtons = $$('.range-btn');

  let usageChart = null;
  let currentRange = 'week';

  const startOfWeek = date => {
    const result = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const day = result.getDay();
    result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));

    return result;
  };

  const formatShortDate = date =>
    new Intl.DateTimeFormat('en', {
      day: 'numeric',
      month: 'short'
    }).format(date);

  const getChartData = range => {
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const buckets = [];

    if (range === 'day') {
      // Daily totals for the last seven calendar days.
      for (let i = 6; i >= 0; i--) {
        const date = new Date(todayStart);
        date.setDate(date.getDate() - i);

        buckets.push({
          start: date,
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
          key: localDate(date),
          label: formatShortDate(date),
          value: 0
        });
      }
    } else if (range === 'week') {
      // Eight weekly buckets, starting Monday.
      const monday = startOfWeek(todayStart);

      for (let i = 7; i >= 0; i--) {
        const start = new Date(monday);
        start.setDate(start.getDate() - i * 7);

        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        buckets.push({
          start,
          end,
          label: formatShortDate(start),
          value: 0
        });
      }
    } else if (range === 'month') {
      // Six calendar months including the current month.
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

        buckets.push({
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

    readings.forEach(reading => {
      const date = parseDate(reading.date);

      const bucket = buckets.find(item =>
        date >= item.start && date < item.end
      );

      if (bucket) {
        bucket.value += reading.units;
      }
    });

    return {
      labels: buckets.map(item => item.label),
      values: buckets.map(item => Number(item.value.toFixed(2))),
      hasReadings: buckets.map(item => item.value > 0)
    };
  };

  const rangeCaptions = {
    day: 'Daily usage · last 7 days',
    week: 'Weekly usage · last 8 weeks',
    month: 'Monthly usage · last 6 months'
  };

  const updateChart = () => {
    const data = getChartData(currentRange);
    const total = data.values.reduce((sum, value) => sum + value, 0);
    const recordedBuckets = data.hasReadings.filter(Boolean).length;

    if (chartTotal) {
      chartTotal.innerHTML =
        `${number(total, 2)} <span>kWh</span>`;
    }

    if (chartCaption) {
      const average = data.values.length ? total / data.values.length : 0;

      chartCaption.textContent = readings.length
        ? `${rangeCaptions[currentRange]} · ${number(average, 2)} kWh per period`
        : `${rangeCaptions[currentRange]} · No personal readings yet`;
    }

    rangeButtons.forEach(button => {
      const active = button.dataset.range === currentRange;

      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    if (usageChart) {
      usageChart.data.labels = data.labels;
      usageChart.data.datasets[0].data = data.values;

      usageChart.update();
    }

    if (chartCanvas) {
      chartCanvas.setAttribute(
        'aria-label',
        readings.length
          ? `Personal electricity usage chart. ${number(total, 2)} kWh across the selected periods; ${recordedBuckets} periods contain readings.`
          : 'No personal electricity readings are available for this chart.'
      );
    }

    const chartPanel = chartCanvas?.closest('.chart-panel');
    let emptyMessage = chartPanel?.querySelector('.analytics-empty');

    if (chartPanel && !readings.length) {
      if (!emptyMessage) {
        emptyMessage = document.createElement('p');
        emptyMessage.className = 'analytics-empty';
        emptyMessage.setAttribute('role', 'status');
        emptyMessage.style.cssText =
          'margin:12px 0 0;color:#91a2b8;font-size:13px;text-align:center;';
        chartCanvas.parentElement?.insertAdjacentElement('afterend', emptyMessage);
      }

      emptyMessage.textContent =
        'Add a personal reading in My Readings to see your usage analytics.';
    } else if (emptyMessage) {
      emptyMessage.remove();
    }
  };

  rangeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const range = button.dataset.range;

      if (!['day', 'week', 'month'].includes(range)) return;

      currentRange = range;
      updateChart();
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
            pointHoverRadius: 6,
            pointBackgroundColor: '#22d3ee',
            pointBorderColor: '#0b1220',
            pointBorderWidth: 2,
            fill: true,
            tension: 0.38,
            spanGaps: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          animation: {
            duration: 350
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
              displayColors: false,
              callbacks: {
                label: context =>
                  ` Usage: ${number(context.parsed.y, 2)} kWh`
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
                },
                maxRotation: 0,
                autoSkip: true
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
  // Dashboard summary — personal readings only
  // ---------------------------------------------------------

  const totalCost = $('#totalCost');
  const totalUsage = $('#totalUsage');
  const dailyAverage = $('#dailyAverage');

  const updateDashboardSummary = () => {
    const total = readings.reduce((sum, item) => sum + item.units, 0);
    const dailyTotals = getDailyTotals();
    const tariff = Number(tariffInput?.value);

    const validTariff =
      tariffInput &&
      tariffInput.value.trim() !== '' &&
      Number.isFinite(tariff) &&
      tariff >= 0;

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
        dailyTotals.length ? total / dailyTotals.length : 0,
        2
      );
    }

    // Keep sample labels from implying a real measured trend.
    const statCards = $$('.stats-grid .stat-card');

    if (statCards[0]) {
      const trend = $('.trend', statCards[0]);
      const footer = $('.stat-footer', statCards[0]);

      if (trend) {
        trend.textContent = 'PERSONAL DATA';
        trend.classList.remove('positive');
      }

      if (footer) {
        footer.querySelector('.muted')?.remove();

        if (!footer.querySelector('.personal-data-label')) {
          const label = document.createElement('span');
          label.className = 'muted personal-data-label';
          label.textContent = readings.length
            ? `${dailyTotals.length} recorded day(s)`
            : 'No readings recorded yet';

          footer.appendChild(label);
        }
      }
    }

    if (statCards[1]) {
      const label = $('.stat-footer .muted', statCards[1]);
      const footnote = $('.stat-footnote', statCards[1]);

      if (label) {
        label.textContent = validTariff
          ? 'Estimate from personal readings'
          : 'Enter a valid rate to estimate cost';
      }

      if (footnote) {
        footnote.textContent = validTariff
          ? `Using ৳${number(tariff, 2)} per kWh`
          : 'Cost estimate unavailable';
      }
    }

    if (statCards[2]) {
      const label = $('.stat-footer .muted', statCards[2]);
      const track = $('.progress-track', statCards[2]);
      const footnote = $('.stat-footnote', statCards[2]);

      if (label) {
        label.textContent = dailyTotals.length
          ? 'Average per recorded day'
          : 'No personal readings yet';
      }

      if (track) {
        const fill = $('span', track);

        track.setAttribute(
          'aria-label',
          dailyTotals.length
            ? `Daily average ${number(total / dailyTotals.length, 2)} kWh; reference level 10 kWh`
            : 'No daily average available'
        );

        if (fill) {
          const percentage = dailyTotals.length
            ? Math.min(100, (total / dailyTotals.length / 10) * 100)
            : 0;

          fill.style.width = `${percentage}%`;
        }
      }

      if (footnote) {
        footnote.textContent = 'Reference level: 10 kWh/day';
      }
    }
  };

  if (tariffInput) {
    tariffInput.addEventListener('input', () => {
      updateDashboardSummary();

      // Update the bill estimate immediately as the rate changes.
      if (
        unitsInput &&
        unitsInput.value.trim() !== '' &&
        tariffInput.value.trim() !== '' &&
        Number(unitsInput.value) >= 0 &&
        Number(tariffInput.value) >= 0
      ) {
        if (estimatedBill) {
          estimatedBill.textContent = money(
            Number(unitsInput.value) * Number(tariffInput.value)
          );
        }
      }
    });
  }

  // ---------------------------------------------------------
  // Smart Energy Insights — cautious, data-based comparisons
  // ---------------------------------------------------------

  const insightsPanel = $('#insights');
  const insightsBadge = $('.insights-label', insightsPanel);
  const insightItems = $$('.insight-item', insightsPanel);
  const insightsFooter = $('.insights-footer', insightsPanel);

  const renderInsights = () => {
    if (insightItems.length < 3) return;

    const dailyTotals = getDailyTotals();
    const total = readings.reduce((sum, item) => sum + item.units, 0);
    const uniqueDays = dailyTotals.length;
    const average = uniqueDays ? total / uniqueDays : 0;

    const latest = dailyTotals[dailyTotals.length - 1];
    const previous = dailyTotals[dailyTotals.length - 2];

    let comparison = {
      title: 'Compare your readings',
      text: 'Add readings from different dates to begin comparing your usage.',
      type: 'WAITING FOR DATA',
      icon: '↔'
    };

    if (!latest) {
      comparison = {
        title: 'Start tracking your energy',
        text: 'No personal readings are saved yet. Add a date and kWh value in My Readings to begin.',
        type: 'NO PERSONAL DATA',
        icon: '+'
      };
    } else if (!previous) {
      comparison = {
        title: 'First recorded day',
        text: `Your saved data shows ${number(latest.units, 2)} kWh on ${formatDate(latest.date)}. Add a reading from another date to compare usage.`,
        type: 'EARLY DATA',
        icon: '•'
      };
    } else {
      const gap = daysBetween(previous.date, latest.date);
      const difference = latest.units - previous.units;

      if (gap === 1) {
        const percent = previous.units > 0
          ? Math.abs(difference / previous.units) * 100
          : null;

        if (difference > 0) {
          comparison = {
            title: 'Recorded usage increased',
            text: `Usage changed from ${number(previous.units, 2)} kWh on ${formatDate(previous.date)} to ${number(latest.units, 2)} kWh on ${formatDate(latest.date)}${percent === null ? '.' : `, an increase of ${number(percent, 1)}%`}. This comparison alone does not establish the cause.`,
            type: 'CONSECUTIVE-DAY COMPARISON',
            icon: '↗'
          };
        } else if (difference < 0) {
          comparison = {
            title: 'Recorded usage decreased',
            text: `Usage changed from ${number(previous.units, 2)} kWh on ${formatDate(previous.date)} to ${number(latest.units, 2)} kWh on ${formatDate(latest.date)}${percent === null ? '.' : `, a decrease of ${number(percent, 1)}%`}. Lower usage does not by itself prove energy savings.`,
            type: 'CONSECUTIVE-DAY COMPARISON',
            icon: '↘'
          };
        } else {
          comparison = {
            title: 'Recorded usage was unchanged',
            text: `Both ${formatDate(previous.date)} and ${formatDate(latest.date)} show ${number(latest.units, 2)} kWh. Continue recording comparable days to build a useful trend.`,
            type: 'CONSECUTIVE-DAY COMPARISON',
            icon: '→'
          };
        }
      } else {
        comparison = {
          title: 'Readings are not consecutive',
          text: `The latest recorded day was ${formatDate(latest.date)} (${number(latest.units, 2)} kWh). The previous recorded day was ${formatDate(previous.date)} (${number(previous.units, 2)} kWh), ${gap} days earlier. A direct percentage comparison may be misleading.`,
          type: `${gap}-DAY DATE GAP`,
          icon: '↔'
        };
      }
    }

    let summary;

    if (uniqueDays === 0) {
      summary = {
        title: 'No usage summary yet',
        text: 'Save personal readings to calculate total usage and average per recorded day.',
        type: 'WAITING FOR DATA',
        icon: '▤'
      };
    } else {
      summary = {
        title: 'Your recorded usage',
        text: `${number(total, 2)} kWh across ${uniqueDays} recorded ${uniqueDays === 1 ? 'day' : 'days'}. Average: ${number(average, 2)} kWh per recorded day.`,
        type: 'SAVED PERSONAL DATA',
        icon: '▤'
      };
    }

    let recommendation;

    if (uniqueDays < 2) {
      recommendation = {
        title: 'Build a useful history',
        text: 'Record usage on at least two different dates. Keep recording comparable days before drawing conclusions about changes or savings.',
        type: 'DATA QUALITY',
        icon: '+'
      };
    } else if (average > 10) {
      recommendation = {
        title: 'Review your recorded usage',
        text: `Your average is ${number(average, 2)} kWh per recorded day. If this reflects a full day of household usage, review appliance use and compare similar days before deciding whether changes helped.`,
        type: 'USAGE REVIEW',
        icon: '!'
      };
    } else {
      recommendation = {
        title: 'Keep tracking consistently',
        text: `Your average is ${number(average, 2)} kWh per recorded day. Continue logging comparable days; the current data is not enough to identify which appliances use the most electricity.`,
        type: 'PERSONALIZED TIP',
        icon: '✓'
      };
    }

    [comparison, summary, recommendation].forEach((card, index) => {
      const item = insightItems[index];
      const icon = $('.insight-icon', item);
      const title = $('h3', item);
      const paragraph = $('p', item);
      const type = $('.insight-type', item);

      if (icon) icon.textContent = card.icon;
      if (title) title.textContent = card.title;
      if (paragraph) paragraph.textContent = card.text;
      if (type) type.textContent = card.type;
    });

    if (insightsBadge) {
      insightsBadge.textContent = uniqueDays
        ? 'PERSONAL DATA'
        : 'NO DATA';
    }

    if (insightsFooter) {
      insightsFooter.textContent = uniqueDays
        ? `Rule-based insights · ${uniqueDays} recorded ${uniqueDays === 1 ? 'day' : 'days'} · Synced to your account`
        : 'Add personal readings to generate insights';
    }
  };
     // ---------------------------------------------------------
  // Add and edit readings — Supabase cloud storage
  // ---------------------------------------------------------

  if (readingForm && readingDate && readingUnits) {
    readingForm.addEventListener('submit', async event => {
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

      // Reject impossible calendar dates.
      const parsed = parseDate(date);

      if (localDate(parsed) !== date) {
        showToast('Please choose a valid calendar date.');
        return;
      }

      const submitButton = $('button[type="submit"]', readingForm);

      if (submitButton) submitButton.disabled = true;

      try {
        if (editingId) {
          const { data, error } = await supabaseClient
            .from('lumora_readings')
            .update({
              reading_date: date,
              units
            })
            .eq('id', editingId)
            .eq('user_id', currentUser.id)
            .select('id, reading_date, units')
            .single();

          if (error) throw error;

          readings = readings.map(item =>
            item.id === editingId
              ? {
                  id: String(data.id),
                  date: data.reading_date,
                  units: Number(data.units)
                }
              : item
          );

          showToast('Reading updated in your account.');
        } else {
          const { data, error } = await supabaseClient
            .from('lumora_readings')
            .insert({
              user_id: currentUser.id,
              reading_date: date,
              units
            })
            .select('id, reading_date, units')
            .single();

          if (error) throw error;

          readings.push({
            id: String(data.id),
            date: data.reading_date,
            units: Number(data.units)
          });

          showToast('Reading saved to your account.');
        }

        saveReadings();
        refreshAll();
        resetReadingForm();
      } catch (error) {
        console.error('Lumora reading save failed:', error);
        showToast('Could not save to cloud. Please try again.');
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  // ---------------------------------------------------------
  // Edit and delete saved readings
  // ---------------------------------------------------------

  if (readingsTableBody) {
    readingsTableBody.addEventListener('click', async event => {
      const button = event.target.closest('button[data-action]');

      if (!button) return;

      const item = readings.find(
        reading => reading.id === button.dataset.id
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

        button.disabled = true;

        try {
          const { error } = await supabaseClient
            .from('lumora_readings')
            .delete()
            .eq('id', item.id)
            .eq('user_id', currentUser.id);

          if (error) throw error;

          readings = readings.filter(
            reading => reading.id !== item.id
          );

          saveReadings();
          refreshAll();

          if (editingId === item.id) {
            resetReadingForm();
          }

          showToast('Reading deleted from your account.');
        } catch (error) {
          console.error('Lumora reading delete failed:', error);
          showToast('Could not delete from cloud. Please try again.');
        } finally {
          button.disabled = false;
        }
      }
    });
  }

  // ---------------------------------------------------------
  // CSV export
  // ---------------------------------------------------------

  if (exportReadings) {
    exportReadings.addEventListener('click', () => {
      if (!readings.length) {
        showToast('Add at least one reading before exporting.');
        return;
      }

      const rows = [
        ['Date', 'Usage (kWh)'],
        ...sortedReadings().map(item => [
          item.date,
          item.units
        ])
      ];

      const csv = rows
        .map(row =>
          row.map(cell =>
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
  // Refresh every data-dependent component
  // ---------------------------------------------------------

  function refreshAll() {
    renderReadings();
    updateChart();
    updateDashboardSummary();
    renderInsights();
  }

  // Initial render
  refreshAll();

  if (window.location.hash) {
    setActiveNav(window.location.hash);
  }

  console.info(
    'Lumora loaded. Personal analytics use saved account readings.'
  );
});
