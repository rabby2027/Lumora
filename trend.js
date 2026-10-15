
/* =========================================================
   LUMORA — Weekly & Monthly Trend Comparison
   Separate module; leaves the existing dashboard script intact.
   ========================================================= */

'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const config = window.LUMORA_SUPABASE_CONFIG;

  if (!config || !window.supabase?.createClient) {
    console.warn('Lumora trends: Supabase configuration unavailable.');
    return;
  }

  const supabase = window.supabase.createClient(
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
    await supabase.auth.getSession();

  if (sessionError || !sessionData.session) return;

  const user = sessionData.session.user;

  const dateString = date =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const parseDate = value => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const moneyNumber = value =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(value);

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

  // Only query dates up to today. Future-dated entries are excluded.
  const { data: rows, error } = await supabase
    .from('lumora_readings')
    .select('reading_date, units')
    .eq('user_id', user.id)
    .gte('reading_date', dateString(previousMonthStart))
    .lte('reading_date', dateString(today))
    .order('reading_date', { ascending: true });

  if (error) {
    console.error('Lumora trend comparison failed:', error);
    return;
  }

  const readings = (rows || [])
    .filter(row => {
      const date = parseDate(row.reading_date);

      return (
        Number.isFinite(Number(row.units)) &&
        Number(row.units) > 0 &&
        date <= today
      );
    })
    .map(row => ({
      date: row.reading_date,
      units: Number(row.units)
    }));

  // Aggregate multiple readings on the same date.
  const dailyTotals = new Map();

  readings.forEach(reading => {
    dailyTotals.set(
      reading.date,
      (dailyTotals.get(reading.date) || 0) + reading.units
    );
  });

  const sumBetween = (start, end) => {
    let total = 0;

    dailyTotals.forEach((units, dateStringValue) => {
      const date = parseDate(dateStringValue);

      if (date >= start && date < end && date <= today) {
        total += units;
      }
    });

    return total;
  };

  // Compare equal elapsed periods, avoiding partial-period bias.
  const elapsedDaysThisWeek =
    Math.floor((today - thisWeekStart) / 86400000) + 1;

  const elapsedDaysThisMonth =
    Math.floor((today - thisMonthStart) / 86400000) + 1;

  const previousWeekEnd = new Date(previousWeekStart);
  previousWeekEnd.setDate(
    previousWeekEnd.getDate() + elapsedDaysThisWeek
  );

  const previousMonthEnd = new Date(previousMonthStart);
  previousMonthEnd.setDate(
    previousMonthEnd.getDate() + elapsedDaysThisMonth
  );

  const thisWeek = sumBetween(thisWeekStart, nextWeekStart);
  const previousWeek = sumBetween(
    previousWeekStart,
    previousWeekEnd
  );

  const thisMonth = sumBetween(thisMonthStart, nextMonthStart);
  const previousMonth = sumBetween(
    previousMonthStart,
    previousMonthEnd
  );

  const recordedDates = [...dailyTotals.keys()];

  const hasWeekData = recordedDates.some(date => {
    const parsed = parseDate(date);
    return parsed >= thisWeekStart && parsed <= today;
  });

  const hasPreviousWeekData = recordedDates.some(date => {
    const parsed = parseDate(date);
    return parsed >= previousWeekStart && parsed < thisWeekStart;
  });

  const hasMonthData = recordedDates.some(date => {
    const parsed = parseDate(date);
    return parsed >= thisMonthStart && parsed <= today;
  });

  const hasPreviousMonthData = recordedDates.some(date => {
    const parsed = parseDate(date);
    return parsed >= previousMonthStart && parsed < thisMonthStart;
  });

  const comparison = (current, previous, hasCurrent, hasPrevious) => {
    if (!hasCurrent || !hasPrevious) {
      return {
        status: 'Insufficient data',
        detail: !hasCurrent
          ? 'No readings recorded in this period.'
          : 'No readings recorded in the comparison period.',
        direction: 'neutral',
        percent: null
      };
    }

    if (previous === 0) {
      return {
        status: 'Baseline is zero',
        detail: `Current period: ${moneyNumber(current)} kWh. Percentage change cannot be calculated from a zero baseline.`,
        direction: 'neutral',
        percent: null
      };
    }

    const change = ((current - previous) / previous) * 100;

    return {
      status: change > 0
        ? 'Usage increased'
        : change < 0
          ? 'Usage decreased'
          : 'Usage unchanged',
      detail: `${Math.abs(change).toFixed(1)}% ${change > 0 ? 'higher' : change < 0 ? 'lower' : 'change'} · ${moneyNumber(current)} vs ${moneyNumber(previous)} kWh`,
      direction: change > 0
        ? 'up'
        : change < 0
          ? 'down'
          : 'neutral',
      percent: change
    };
  };

  const weekly = comparison(
    thisWeek,
    previousWeek,
    hasWeekData,
    hasPreviousWeekData
  );

  const monthly = comparison(
    thisMonth,
    previousMonth,
    hasMonthData,
    hasPreviousMonthData
  );

  // Create the card without replacing the existing dashboard markup.
  const statsGrid = document.querySelector('.stats-grid');

  if (!statsGrid || document.getElementById('lumoraTrendCard')) {
    return;
  }

  const card = document.createElement('section');
  card.id = 'lumoraTrendCard';
  card.setAttribute('aria-labelledby', 'lumoraTrendTitle');

  card.style.cssText = [
    'margin:0 0 24px',
    'padding:22px',
    'border:1px solid var(--border-color, rgba(148,163,184,.18))',
    'border-radius:18px',
    'background:var(--panel-bg, #101b2d)',
    'color:var(--text-primary, #f3f7fb)'
  ].join(';');

  const heading = document.createElement('div');
  heading.style.cssText =
    'display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px;';

  const titleGroup = document.createElement('div');

  const eyebrow = document.createElement('p');
  eyebrow.textContent = 'PERSONAL ANALYTICS';
  eyebrow.style.cssText =
    'margin:0 0 6px;color:#22d3ee;font-size:11px;font-weight:700;letter-spacing:1.4px;';

  const title = document.createElement('h2');
  title.id = 'lumoraTrendTitle';
  title.textContent = 'Usage trend comparison';
  title.style.cssText =
    'margin:0;font-size:21px;font-weight:600;';

  const subtitle = document.createElement('p');
  subtitle.textContent =
    'Compare recorded consumption with the preceding period.';
  subtitle.style.cssText =
    'margin:7px 0 0;color:var(--text-secondary, #91a2b8);font-size:13px;';

  titleGroup.append(eyebrow, title, subtitle);

  const badge = document.createElement('span');
  badge.textContent = 'ACCOUNT DATA';
  badge.style.cssText =
    'padding:6px 10px;border-radius:999px;background:rgba(34,211,238,.10);color:#22d3ee;font-size:10px;font-weight:700;letter-spacing:.5px;';

  heading.append(titleGroup, badge);

  const grid = document.createElement('div');
  grid.style.cssText =
    'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;';

  const makeTrendCard = (label, current, result, hasCurrent) => {
    const panel = document.createElement('article');
    panel.style.cssText =
      'padding:17px;border-radius:13px;background:var(--card-bg, rgba(148,163,184,.06));border:1px solid var(--border-color, rgba(148,163,184,.12));min-width:0;';

    const periodLabel = document.createElement('p');
    periodLabel.textContent = label;
    periodLabel.style.cssText =
      'margin:0 0 10px;color:var(--text-secondary, #91a2b8);font-size:12px;font-weight:600;';

    const usage = document.createElement('p');
    usage.textContent = hasCurrent
      ? `${moneyNumber(current)} kWh`
      : '—';
    usage.style.cssText =
      'margin:0 0 8px;font-size:27px;font-weight:700;letter-spacing:-.5px;';

    const status = document.createElement('p');
    status.textContent = result.status;

    const statusColor = result.direction === 'up'
      ? '#f59e0b'
      : result.direction === 'down'
        ? '#34d399'
        : '#91a2b8';

    status.style.cssText =
      `margin:0 0 7px;font-size:13px;font-weight:700;color:${statusColor};`;

    const detail = document.createElement('p');
    detail.textContent = result.detail;
    detail.style.cssText =
      'margin:0;color:var(--text-secondary, #91a2b8);font-size:12px;line-height:1.6;overflow-wrap:anywhere;';

    panel.append(periodLabel, usage, status, detail);

    return panel;
  };

  grid.append(
    makeTrendCard(
      'THIS WEEK · WEEK-TO-DATE',
      thisWeek,
      weekly,
      hasWeekData
    ),
    makeTrendCard(
      'THIS MONTH · MONTH-TO-DATE',
      thisMonth,
      monthly,
      hasMonthData
    )
  );

  const note = document.createElement('p');
  note.textContent =
    'Comparisons use the same elapsed number of days in each period. Trends describe recorded usage, not its cause.';

  note.style.cssText =
    'margin:16px 0 0;color:var(--text-secondary, #91a2b8);font-size:11px;line-height:1.6;';

  card.append(heading, grid, note);

  statsGrid.insertAdjacentElement('afterend', card);

  // Keep the separate card aligned with the current page theme.
  window.addEventListener('storage', event => {
    if (event.key === 'lumora-theme') {
      // Theme variables are managed by Lumora's existing theme system.
      card.style.background =
        'var(--panel-bg, #101b2d)';
    }
  });

  console.info('Lumora trend comparison initialized.');
});
