document.addEventListener("DOMContentLoaded", function () {
  var unitsInput = document.getElementById("units");
  var tariffInput = document.getElementById("tariff");
  var billForm = document.getElementById("billForm");
  var estimatedBill = document.getElementById("estimatedBill");
  var totalCost = document.getElementById("totalCost");
  var totalUsage = document.getElementById("totalUsage");
  var chartCanvas = document.getElementById("usageChart");
  var chartTotal = document.getElementById("chartTotal");
  var chartCaption = document.getElementById("chartCaption");
  var dateChip = document.getElementById("dateChip");
  var toast = document.getElementById("toast");
  var sidebar = document.getElementById("sidebar");
  var menuToggle = document.getElementById("menuToggle");

  function formatMoney(amount) {
    return "৳" + amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(function () {
      toast.classList.remove("show");
    }, 2500);
  }

  // Display current date
  if (dateChip) {
    dateChip.textContent = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date());
  }

  // Bill calculator
  if (billForm) {
    billForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var units = Number(unitsInput.value);
      var rate = Number(tariffInput.value);

      if (
        unitsInput.value.trim() === "" ||
        tariffInput.value.trim() === "" ||
        !Number.isFinite(units) ||
        !Number.isFinite(rate) ||
        units < 0 ||
        rate < 0 ||
        units > 1000000 ||
        rate > 100000
      ) {
        showToast("Please enter valid non-negative values.");
        return;
      }

      var amount = units * rate;

      if (!Number.isFinite(amount)) {
        showToast("Please enter smaller values.");
        return;
      }

      if (estimatedBill) {
        estimatedBill.textContent = formatMoney(amount);
      }

      if (totalCost) {
        totalCost.textContent = amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      }

      if (totalUsage) {
        totalUsage.textContent = units.toLocaleString("en-US", {
          maximumFractionDigits: 2
        });
      }

      showToast("Estimated energy charge updated.");
    });
  }

  // Sample electricity usage data
  var chartData = {
    day: {
      labels: ["12 AM", "3 AM", "6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"],
      values: [0.3, 0.2, 0.4, 0.8, 1.2, 1.0, 1.6, 1.1],
      caption: "Total today"
    },
    week: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [5.2, 6.1, 4.8, 7.4, 5.9, 8.0, 6.1],
      caption: "Total this week"
    },
    month: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      values: [39.6, 45.2, 41.8, 43.5],
      caption: "Total this month"
    }
  };

  var usageChart = null;

  function updateChart(range) {
    var selected = chartData[range];

    if (!selected) return;

    var sum = selected.values.reduce(function (total, value) {
      return total + value;
    }, 0);

    if (chartTotal) {
      chartTotal.textContent = sum.toFixed(1) + " kWh";
    }

    if (chartCaption) {
      chartCaption.textContent = selected.caption;
    }

    document.querySelectorAll(".range-btn").forEach(function (button) {
      var active = button.getAttribute("data-range") === range;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (!chartCanvas) return;

    if (typeof Chart === "undefined") {
      console.error("Chart.js could not load. Check your internet connection.");
      showToast("Chart library unavailable. Check your internet connection.");
      return;
    }

    if (usageChart) {
      usageChart.data.labels = selected.labels;
      usageChart.data.datasets[0].data = selected.values;
      usageChart.update();
      return;
    }

    usageChart = new Chart(chartCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels: selected.labels,
        datasets: [{
          label: "Energy usage",
          data: selected.values,
          borderColor: "#75dce8",
          backgroundColor: "rgba(117, 220, 232, 0.12)",
          borderWidth: 2.5,
          fill: true,
          tension: 0.38,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: "#75dce8",
          pointBorderColor: "#111c2c",
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index"
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: "#152236",
            titleColor: "#f0f5fa",
            bodyColor: "#c3d0e0",
            borderColor: "#29374a",
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label: function (context) {
                return " " + context.parsed.y.toFixed(1) + " kWh";
              }
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
              color: "#9baac0",
              maxRotation: 0
            }
          },
          y: {
            beginAtZero: true,
            border: {
              display: false
            },
            grid: {
              color: "rgba(155, 170, 192, 0.12)"
            },
            ticks: {
              color: "#9baac0",
              padding: 10
            }
          }
        }
      }
    });
  }

  // Chart range buttons
  document.querySelectorAll(".range-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      updateChart(button.getAttribute("data-range"));
    });
  });

  updateChart("week");

  // Mobile navigation
  function closeSidebar() {
    if (sidebar) {
      sidebar.classList.remove("sidebar-open");
    }

    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
    }
  }

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", function () {
      var isOpen = sidebar.classList.toggle("sidebar-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.querySelectorAll(".nav-link, .sidebar-note a").forEach(function (link) {
      link.addEventListener("click", closeSidebar);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeSidebar();
      }
    });
  }

  // Active navigation link
  document.querySelectorAll(".nav-link").forEach(function (link) {
    link.addEventListener("click", function () {
      document.querySelectorAll(".nav-link").forEach(function (item) {
        item.classList.remove("active");
        item.removeAttribute("aria-current");
      });

      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    });
  });

  // Initial calculator result
  if (unitsInput && tariffInput && estimatedBill) {
    var initialUnits = Number(unitsInput.value);
    var initialRate = Number(tariffInput.value);

    if (
      Number.isFinite(initialUnits) &&
      Number.isFinite(initialRate) &&
      initialUnits >= 0 &&
      initialRate >= 0
    ) {
      estimatedBill.textContent = formatMoney(initialUnits * initialRate);
    }
  }

  console.info("Lumora loaded. All readings are sample data.");
});