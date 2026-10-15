
/* =========================================================
   LUMORA — Weekly & Monthly Trend Comparison
   Independent module for the dashboard.
   ========================================================= */

'use strict';

document.addEventListener('DOMContentLoaded', initLumoraTrends);

async function initLumoraTrends() {
  const statsGrid = document.querySelector('.stats-grid');

  if (!statsGrid || document.getElementById('lumoraTrendCard')) {
    return;
  }

  // Create the card immediately, even before data is loaded.
  const card = document.createElement('section');
  card.id = 'lumoraTrendCard';
  card.setAttribute('aria-labelledby', 'lumoraTrendTitle');

  card.style.cssText = `
    margin: 0 0 24px;
    padding: 22px;
    border: 1px solid var(--border-color, rgba(148,163,184,.18));
    border-radius: 18px;
    background: var(--panel-bg, #101b2d);
    color: var(--text-primary, #f3f7fb);
    box-sizing: border-box;
    width: 100%;
  `;

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;
      align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px;">
      <div>
        <p style="margin:0 0 6px;color:#22d3ee;font-size:11px;
          font-weight:700;letter-spacing:1.4px;">
          PERSONAL ANALYTICS
        </p>
        <h2 id="lumoraTrendTitle"
          style="margin:0;font-size:21px;font-weight:600;">
          Usage trend comparison
        </h2>
        <p style="margin:7px 0 0;color:var(--text-secondary,#91a2b8);
          font-size:13px;">
          Compare your recorded electricity consumption.
        </p>
      </div>
      <span style="padding:6px 10px;border-radius:999px;
        background:rgba(34,211,238,.10);color:#22d3ee;
        font-size:10px;font-weight:700;letter-spacing:.5px;">
        ACCOUNT DATA
      </span>
    </div>

    <div id="lumoraTrendGrid" style="display:grid;
      grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));
      gap:14px;">
      <div style="padding:17px;border-radius:13px;
        background:var(--card-bg,rgba(148,163,184,.06));">
        Loading your usage trends...
      </div>
    </div>

    <p id="lumoraTrendNote" style="margin:16px 0 0;
      color:var(--text-secondary,#91a2b8);font-size:11px;line-height:1.6;">
      Trends are based on readings saved to your account.
    </p>
  `;

  statsGrid.insertAdjacentElement('afterend', card);

  const grid = document.getElementById('lumoraTrendGrid');
  const note = document.getElementById('lumoraTrendNote');

  function showMessage(message) {
    grid.innerHTML = '';
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.cssText =
      'margin:0;padding:16px;color:var(--text-secondary,#91a2b8);' +
      'font-size:13px;line-height:1.6;';
    grid.appendChild(messageElement);
  }

  const formatNumber = value =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(value);

  const dateString = date =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const parseDate = value => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getMonday = date => {
    const monday = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    monday.setDate(
      monday.getDate() - ((monday.getDay() + 6) % 7)
    );
    return monday;
  };

  const sumBetween = (totals, start, end, today) => {
    let total = 0;

    totals.forEach((units, dateValue) => {
      const date = parseDate(dateValue);
      if (date >= start && date < end && date <= today) {
        total += units;
      }
    });

    return total;
  };

  function makePeriodCard(label, current, previous, hasCurrent, hasPrevious) {
    const panel = document.createElement('article');
    panel.style.cssText = `
      padding:17px;
      border-radius:13px;
      background:var(--card-bg,rgba(148,163,184,.06));
      border:1px solid var(--border-color,rgba(148,163,184,.12));
      min-width:0;
    `;

    const period = document.createElement('p');
    period.textContent = label;
    period.style.cssText =
      'margin:0 0 10px;color:var(--text-secondary,#91a2b8);' +
      'font-size:12px;font-weight:600;';

    const usage = document.createElement('p');
    usage.textContent = hasCurrent ? `${formatNumber(current)} kWh` : '—';
    usage.style.cssText =
      'margin:0 0 8px;font-size:27px;font-weight:700;';

    const status = document.createElement('p');
    status.style.cssText =
      'margin:0 0 7px;font-size:13px;font-weight:700;';

    const detail = document.createElement('p');
    detail.style.cssText =
      'margin:0;color:var(--text-secondary,#91a2b8);' +
      'font-size:12px;line-height:1.6;overflow-wrap:anywhere;';

    if (!hasCurrent) {
      status.textContent = 'No readings yet';
      status.style.color = '#91a2b8';
      detail.textContent = 'Add a reading for this period to see your trend.';
    } else if (!hasPrevious) {
      status.textContent = 'Comparison not available';
      status.style.color = '#91a2b8';
      detail.textContent =
        `Recorded usage: ${formatNumber(current)} kWh. ` +
        'More historical readings are needed for comparison.';
    } else if (previous === 0) {
      status.textContent = 'Baseline is zero';
      status.style.color = '#91a2b8';
      detail.textContent =
        'There is no previous-period usage for calculating a percentage change.';
    } else {
      const change = ((current - previous) / previous) * 100;

      status.textContent = change > 0
        ? `↑ ${Math.abs(change).toFixed(1)}% higher`
        : change < 0
          ? `↓ ${Math.abs(change).toFixed(1)}% lower`
          : 'Usage unchanged';

      status.style.color = change > 0
        ? '#f59e0b'
        : change < 0
          ? '#34d399'
          : '#91a2b8';

      detail.textContent =
        `${formatNumber(current)} kWh now vs ` +
        `${formatNumber(previous)} kWh previously.`;
    }

    panel.append(period, usage, status, detail);
    return panel;
  }

  try {
    const config = window.LUMORA_SUPABASE_CONFIG;

    if (!config || !window.supabase?.createClient) {
      showMessage(
        'Supabase configuration could not be loaded. Please refresh the page.'
      );
      return;
    }

    // Reuse an existing client if the main dashboard created one.
    // Otherwise create a separate client for this module.
    let client = window.lumoraSupabaseClient;

    if (!client) {
      client = window.supabase.createClient(
        config.url,
        config.publishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            storageKey: 'lumora-trend-auth'
          }
        }
      );
    }

    const { data: sessionData, error: sessionError } =
      await client.auth.getSession();

    if (sessionError) {
      console.error('Lumora trends: session error', sessionError);
      showMessage('Could not verify your account. Please refresh the page.');
      return;
    }

    if (!sessionData?.session?.user) {
      showMessage('Please log in to view your personal usage trends.');
      return;
    }

    const user = sessionData.session.user;

    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const thisWeekStart = getMonday(today);
    const nextWeekStart = new Date(thisWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    const previousWeekStart = new Date(thisWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const elapsedWeekDays =
      Math.floor((today - thisWeekStart) / 86400000) + 1;

    const previousWeekEnd = new Date(previousWeekStart);
    previousWeekEnd.setDate(
      previousWeekEnd.getDate() + elapsedWeekDays
    );

    const thisMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const nextMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1
    );

    const previousMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );

    const elapsedMonthDays =
      Math.floor((today - thisMonthStart) / 86400000) + 1;

    const previousMonthEnd = new Date(previousMonthStart);
    previousMonthEnd.setDate(
      previousMonthEnd.getDate() + elapsedMonthDays
    );

    const { data: rows, error } = await client
      .from('lumora_readings')
      .select('reading_date, units')
      .eq('user_id', user.id)
      .gte('reading_date', dateString(previousMonthStart))
      .lte('reading_date', dateString(today))
      .order('reading_date', { ascending: true });

    if (error) {
      console.error('Lumora trend comparison failed:', error);
      showMessage(
        'Could not load your readings. Please check your connection and try refreshing.'
      );
      return;
    }

    const totals = new Map();

    (rows || []).forEach(row => {
      const units = Number(row.units);

      if (
        !row.reading_date ||
        !Number.isFinite(units) ||
        units <= 0
      ) {
        return;
      }

      const date = parseDate(row.reading_date);

      if (date > today) return;

      totals.set(
        row.reading_date,
        (totals.get(row.reading_date) || 0) + units
      );
    });

    const hasDataBetween = (start, end) =>
      [...totals.keys()].some(dateValue => {
        const date = parseDate(dateValue);
        return date >= start && date < end && date <= today;
      });

    const thisWeek = sumBetween(
      totals, thisWeekStart, nextWeekStart, today
    );

    const previousWeek = sumBetween(
      totals, previousWeekStart, previousWeekEnd, today
    );

    const thisMonth = sumBetween(
      totals, thisMonthStart, nextMonthStart, today
    );

    const previousMonth = sumBetween(
      totals, previousMonthStart, previousMonthEnd, today
    );

    grid.innerHTML = '';

    grid.append(
      makePeriodCard(
        'THIS WEEK · WEEK TO DATE',
        thisWeek,
        previousWeek,
        hasDataBetween(thisWeekStart, nextWeekStart),
        hasDataBetween(previousWeekStart, thisWeekStart)
      ),
      makePeriodCard(
        'THIS MONTH · MONTH TO DATE',
        thisMonth,
        previousMonth,
        hasDataBetween(thisMonthStart, nextMonthStart),
        hasDataBetween(previousMonthStart, thisMonthStart)
      )
    );

    note.textContent =
      'Comparisons use the same elapsed number of days in each period. ' +
      'Trends reflect saved readings, not the cause of usage changes.';

    console.info('Lumora trend comparison loaded.');
  } catch (error) {
    console.error('Lumora trend comparison failed:', error);
    showMessage(
      'Something went wrong while loading trends. Please refresh and try again.'
    );
  }
}
