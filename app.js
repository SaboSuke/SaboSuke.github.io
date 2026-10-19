// Wolvo Plan - Main Application Logic
(function () {
  const $ = (id) => document.getElementById(id);
  const money = (n) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n) + " DT";
  const num = (id) => Math.max(0, Number($(id).value) || 0);
  const signedMoney = (n) => (n < 0 ? "−" : "") + money(Math.abs(n));

  // Storage keys
  const STORAGE_KEY = 'wolvo_plan_data';
  const CONFIG_KEY = 'wolvo_config_data';
  const TASKS_KEY = 'wolvo_tasks';

  // =====================
  // Configuration Functions
  // =====================
  function saveConfig() {
    const config = {
      server: $("configServer").value,
      tax: $("configTax").value,
      premises: $("configPremises").value,
      vatRate: $("configVatRate").value,
      returnedFee: $("configReturnedFee").value,
      exchangeFee: $("configExchangeFee").value
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    const savedMsg = $("configSaved");
    savedMsg.style.display = 'block';
    setTimeout(() => { savedMsg.style.display = 'none'; }, 3000);
    updateFinancialsFromConfig();
  }

  function loadConfig() {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        if (config.server) $("configServer").value = config.server;
        if (config.tax) $("configTax").value = config.tax;
        if (config.premises) $("configPremises").value = config.premises;
        if (config.vatRate) $("configVatRate").value = config.vatRate;
        if (config.returnedFee) $("configReturnedFee").value = config.returnedFee;
        if (config.exchangeFee) $("configExchangeFee").value = config.exchangeFee;
      } catch (e) {
        console.error('Error loading config:', e);
      }
    }
  }

  function resetConfig() {
    $("configServer").value = 834.238;
    $("configTax").value = 30;
    $("configPremises").value = 600;
    $("configVatRate").value = 19;
    $("configReturnedFee").value = 0.500;
    $("configExchangeFee").value = 0.500;
    saveConfig();
  }

  function updateFinancialsFromConfig() {
    const server = Number($("configServer").value) || 834.238;
    const tax = Number($("configTax").value) || 30;
    const premises = Number($("configPremises").value) || 600;

    const monthlyServer = server / 6;
    const monthlyPremisesLow = premises / 6;
    const monthlyPremisesHigh = premises / 3;
    const monthlyTotalLow = monthlyServer + tax + monthlyPremisesLow;
    const monthlyTotalHigh = monthlyServer + tax + monthlyPremisesHigh;

    // Update financial baseline section
    const serverEl = document.querySelector('#financials .card:nth-child(1) .metric');
    const taxEl = document.querySelector('#financials .card:nth-child(2) .metric');
    const premisesEl = document.querySelector('#financials .card:nth-child(3) .metric');
    const totalEl = document.querySelector('#financials .card:nth-child(4) .metric');

    if (serverEl) serverEl.textContent = money(monthlyServer);
    if (taxEl) taxEl.textContent = money(tax);
    if (premisesEl) premisesEl.textContent = money(monthlyPremisesLow) + '–' + money(monthlyPremisesHigh);
    if (totalEl) totalEl.textContent = money(monthlyTotalLow) + '–' + money(monthlyTotalHigh);

    // Update cost chart
    drawBars($("costChart"), [
      { label: "Server", value: monthlyServer, color: "#3157d5" },
      { label: "Tax", value: tax, color: "#98a2b3" },
      { label: "Premises", value: (monthlyPremisesLow + monthlyPremisesHigh) / 2, color: "#d97706" },
    ]);

    // Update cost input in calculator to match
    const avgCost = (monthlyTotalLow + monthlyTotalHigh) / 2;
    $("cost").value = Math.round(avgCost);
    updateCalc();
  }

  // =====================
  // Storage Functions
  // =====================
  function saveToStorage() {
    const data = {
      calculator: {
        fee: $("fee").value,
        orders: $("orders").value,
        cost: $("cost").value,
        clients: $("clients").value,
        target: $("target").value,
        manualRevenue: $("manualRevenue").value
      },
      scorecard: {
        cashOnHand: $("cashOnHand").value,
        collected: $("collected").value,
        invoiced: $("invoiced").value,
        pipeline: $("pipeline").value
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.calculator) {
          if (data.calculator.fee) $("fee").value = data.calculator.fee;
          if (data.calculator.orders) $("orders").value = data.calculator.orders;
          if (data.calculator.cost) $("cost").value = data.calculator.cost;
          if (data.calculator.clients) $("clients").value = data.calculator.clients;
          if (data.calculator.target) $("target").value = data.calculator.target;
          if (data.calculator.manualRevenue !== undefined) $("manualRevenue").value = data.calculator.manualRevenue;
        }
        if (data.scorecard) {
          if (data.scorecard.cashOnHand) $("cashOnHand").value = data.scorecard.cashOnHand;
          if (data.scorecard.collected) $("collected").value = data.scorecard.collected;
          if (data.scorecard.invoiced) $("invoiced").value = data.scorecard.invoiced;
          if (data.scorecard.pipeline) $("pipeline").value = data.scorecard.pipeline;
        }
      } catch (e) {
        console.error('Error loading from storage:', e);
      }
    }
  }

  // =====================
  // Chart Drawing
  // =====================
  function drawBars(canvas, items) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect(),
      dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(300, rect.width) * dpr;
    canvas.height = Math.max(180, rect.height) * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const w = canvas.width / dpr,
      h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);
    const pad = { l: 40, r: 12, t: 18, b: 36 },
      pw = w - pad.l - pad.r,
      ph = h - pad.t - pad.b;
    const max = Math.max(1, ...items.map((x) => x.value)) * 1.18;
    ctx.font = "11px system-ui";
    ctx.fillStyle = "#667085";
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      let y = pad.t + (ph * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
      ctx.fillText(Math.round(max * (1 - i / 4)), 3, y + 4);
    }
    const step = pw / items.length,
      bw = Math.min(54, step * 0.56);
    items.forEach((it, i) => {
      let x = pad.l + i * step + (step - bw) / 2,
        bh = (it.value / max) * ph,
        y = pad.t + ph - bh;
      ctx.fillStyle = it.color || "#3157d5";
      ctx.beginPath();
      ctx.roundRect(x, y, bw, bh, 4);
      ctx.fill();
      ctx.fillStyle = "#344054";
      ctx.textAlign = "center";
      ctx.fillText(it.label, x + bw / 2, h - 12);
    });
    ctx.textAlign = "left";
  }

  // =====================
  // Calculator Functions
  // =====================
  function updateCalc() {
    const fee = num("fee"),
      orders = num("orders"),
      cost = num("cost"),
      clients = num("clients"),
      target = num("target");
    const manual = $("manualRevenue").value.trim();
    const rev =
      manual !== "" ? Math.max(0, Number(manual) || 0) : fee * orders;
    $("feeOut").textContent = fee.toFixed(3) + " DT";
    $("ordersOut").textContent = orders + " orders";
    $("costOut").textContent = money(cost);
    $("clientsOut").textContent =
      clients + " client" + (clients === 1 ? "" : "s");
    $("targetOut").textContent = money(target);
    $("manualOut").textContent =
      manual === ""
        ? "Auto: " + money(fee * orders)
        : "Override: " + money(rev);
    $("revPerClient").textContent = money(rev);
    $("breakeven").textContent = rev > 0 ? Math.ceil(cost / rev) : "—";
    $("targetClients").textContent =
      rev > 0 ? Math.ceil(target / rev) : "—";
    const result = clients * rev - cost;
    $("monthlyResult").textContent = signedMoney(result);
    $("monthlyResult").style.color = result >= 0 ? "#087443" : "#b42318";
    const n = Math.max(1, Math.ceil(target / Math.max(rev, 1)));
    let counts = [
      0,
      Math.max(1, Math.ceil(cost / Math.max(rev, 1)) - 1),
      Math.ceil(cost / Math.max(rev, 1)),
      Math.ceil(target / Math.max(rev, 1)),
      Math.max(n + 2, 6),
    ];
    counts = [...new Set(counts)].sort((a, b) => a - b);
    drawBars(
      $("scenarioChart"),
      counts.map((c) => ({
        label: c + " clients",
        value: c * rev,
        color: c * rev >= cost ? "#12b76a" : "#3157d5",
      })),
    );
    updateScore();
  }

  function updateScore() {
    const cash = num("cashOnHand"),
      col = num("collected"),
      inv = num("invoiced"),
      pipeline = num("pipeline"),
      cost = num("cost");
    $("collectionRate").textContent =
      inv > 0 ? Math.round((col / inv) * 100) + "%" : "—";
    const gap = col - cost;
    $("scoreGap").textContent = signedMoney(gap);
    $("scoreGap").style.color = gap >= 0 ? "#087443" : "#b42318";
    $("runway").textContent =
      cost > 0 ? (cash / cost).toFixed(1) + " months" : "—";
    $("pipelineOut").textContent = pipeline;
  }

  // =====================
  // Task Management
  // =====================
  let tasks = [];

  function loadTasks() {
    const saved = localStorage.getItem(TASKS_KEY);
    if (saved) {
      try {
        tasks = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading tasks:', e);
        tasks = [];
      }
    }
    renderTasks();
  }

  function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  function addTask() {
    const title = $("taskTitle").value.trim();
    if (!title) return;

    const task = {
      id: Date.now(),
      title: title,
      assignee: $("taskAssignee").value,
      priority: $("taskPriority").value,
      notes: $("taskNotes").value.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: []
    };

    tasks.push(task);
    saveTasks();
    renderTasks();

    $("taskTitle").value = "";
    $("taskNotes").value = "";
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }

  function addSubtask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const subtaskTitle = prompt("Enter subtask:");
      if (subtaskTitle && subtaskTitle.trim()) {
        task.subtasks.push({
          id: Date.now(),
          title: subtaskTitle.trim(),
          completed: false
        });
        saveTasks();
        renderTasks();
      }
    }
  }

  function toggleSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const subtask = task.subtasks.find(st => st.id === subtaskId);
      if (subtask) {
        subtask.completed = !subtask.completed;
        saveTasks();
        renderTasks();
      }
    }
  }

  function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
  }

  function renderTasks() {
    const container = $("taskList");
    if (tasks.length === 0) {
      container.innerHTML = '<p class="muted">No tasks yet. Add a task above to get started.</p>';
      return;
    }

    const assigneeNames = {
      issam: 'Issam (CEO)',
      jawher: 'Jawher',
      nasim: 'Nasim'
    };

    const priorityClass = {
      urgent: 'urgent',
      next: 'next',
      normal: ''
    };

    container.innerHTML = tasks.map(task => `
      <div class="task" style="${task.completed ? 'opacity: 0.6;' : ''}">
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})" />
        <div style="flex: 1;">
          <span class="status ${priorityClass[task.priority]}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
          <strong>${task.title}</strong>
          <p>
            <strong>Assigned to:</strong> ${assigneeNames[task.assignee]}<br/>
            ${task.notes ? '<strong>Notes:</strong> ' + task.notes + '<br/>' : ''}
            <strong>Created:</strong> ${new Date(task.createdAt).toLocaleDateString()}
          </p>
          ${task.subtasks.length > 0 ? `
            <div style="margin-left: 20px; margin-top: 8px;">
              ${task.subtasks.map(st => `
                <div style="display: flex; gap: 8px; align-items: center; margin: 4px 0;">
                  <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="toggleSubtask(${task.id}, ${st.id})" />
                  <span style="${st.completed ? 'text-decoration: line-through; color: var(--muted);' : ''}">${st.title}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <button class="btn" style="font-size: 11px; padding: 4px 8px; margin-top: 8px;" onclick="addSubtask(${task.id})">+ Add subtask</button>
          <button class="btn" style="font-size: 11px; padding: 4px 8px; margin-top: 8px; background: #fff0ee; border-color: #fecaca; color: #b42318;" onclick="deleteTask(${task.id})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  // Make task functions globally accessible
  window.toggleTask = toggleTask;
  window.deleteTask = deleteTask;
  window.addSubtask = addSubtask;
  window.toggleSubtask = toggleSubtask;

  // =====================
  // Export/Import Functions
  // =====================
  function exportCsv() {
    const rows = [
      ["Wolvo turnaround calculator assumptions", "Value"],
      ["Fee per delivered order (DT)", num("fee")],
      ["Delivered orders per client / month", num("orders")],
      ["Monthly operating costs (DT)", num("cost")],
      ["Current paying clients", num("clients")],
      ["Target monthly revenue (DT)", num("target")],
      [
        "Revenue override (DT; blank means auto)",
        $("manualRevenue").value,
      ],
      ["Revenue per client (DT)", $("revPerClient").textContent],
      ["Break-even clients", $("breakeven").textContent],
      ["Clients for target", $("targetClients").textContent],
    ];
    const csv = rows
      .map((r) =>
        r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(","),
      )
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wolvo-turnaround-assumptions.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportJson() {
    const allData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      calculator: {
        fee: $("fee").value,
        orders: $("orders").value,
        cost: $("cost").value,
        clients: $("clients").value,
        target: $("target").value,
        manualRevenue: $("manualRevenue").value
      },
      scorecard: {
        cashOnHand: $("cashOnHand").value,
        collected: $("collected").value,
        invoiced: $("invoiced").value,
        pipeline: $("pipeline").value
      },
      config: {
        server: $("configServer").value,
        tax: $("configTax").value,
        premises: $("configPremises").value,
        vatRate: $("configVatRate").value,
        returnedFee: $("configReturnedFee").value,
        exchangeFee: $("configExchangeFee").value
      },
      tasks: tasks
    };

    const json = JSON.stringify(allData, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "wolvo-plan-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // Load calculator data
        if (data.calculator) {
          if (data.calculator.fee) $("fee").value = data.calculator.fee;
          if (data.calculator.orders) $("orders").value = data.calculator.orders;
          if (data.calculator.cost) $("cost").value = data.calculator.cost;
          if (data.calculator.clients) $("clients").value = data.calculator.clients;
          if (data.calculator.target) $("target").value = data.calculator.target;
          if (data.calculator.manualRevenue !== undefined) $("manualRevenue").value = data.calculator.manualRevenue;
        }

        // Load scorecard data
        if (data.scorecard) {
          if (data.scorecard.cashOnHand) $("cashOnHand").value = data.scorecard.cashOnHand;
          if (data.scorecard.collected) $("collected").value = data.scorecard.collected;
          if (data.scorecard.invoiced) $("invoiced").value = data.scorecard.invoiced;
          if (data.scorecard.pipeline) $("pipeline").value = data.scorecard.pipeline;
        }

        // Load config data
        if (data.config) {
          if (data.config.server) $("configServer").value = data.config.server;
          if (data.config.tax) $("configTax").value = data.config.tax;
          if (data.config.premises) $("configPremises").value = data.config.premises;
          if (data.config.vatRate) $("configVatRate").value = data.config.vatRate;
          if (data.config.returnedFee) $("configReturnedFee").value = data.config.returnedFee;
          if (data.config.exchangeFee) $("configExchangeFee").value = data.config.exchangeFee;
          saveConfig();
        }

        // Load tasks
        if (data.tasks && Array.isArray(data.tasks)) {
          tasks = data.tasks;
          saveTasks();
          renderTasks();
        }

        // Update all displays
        updateCalc();
        updateScore();
        updateFinancialsFromConfig();
        saveToStorage();

        alert("Data imported successfully!");
      } catch (error) {
        alert("Error importing data: " + error.message);
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset file input
  }

  // =====================
  // Language Functions
  // =====================
  let currentLang = 'en';

  function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];

    // Update navigation
    document.querySelectorAll('#sideNav a').forEach((link, index) => {
      const keys = ['overview', 'financials', 'calculator', 'config', 'pricing', 'execution', 'executionPlan', 'sales', 'operations', 'legal', 'governance', 'scorecard', 'tasks', 'sources'];
      if (keys[index]) {
        link.textContent = t[keys[index]];
      }
    });

    // Update hero section
    const heroTitle = document.querySelector('#overview h1');
    const heroDesc = document.querySelector('#overview p');
    if (heroTitle) heroTitle.textContent = t.heroTitle;
    if (heroDesc) heroDesc.textContent = t.heroDesc;

    // Update pills
    const pills = document.querySelectorAll('.pill');
    if (pills[0]) pills[0].textContent = t.priorityCash;
    if (pills[1]) pills[1].textContent = t.earlyAccess;
    if (pills[2]) pills[2].textContent = t.planningEstimate;
    if (pills[3]) pills[3].textContent = t.dayHorizon;

    // Update callout
    const callout = document.querySelector('#overview .callout');
    if (callout) {
      callout.innerHTML = `<strong>${t.decisionRule}</strong> ${t.decisionDesc}`;
    }

    // Update buttons
    const buttons = document.querySelectorAll('.action-row .btn');
    if (buttons[0]) buttons[0].textContent = t.printPdf;
    if (buttons[1]) buttons[1].textContent = t.exportCsv;
    if (buttons[2]) buttons[2].textContent = t.exportJson;
    if (buttons[3]) buttons[3].textContent = t.importJson;
    if (buttons[4]) buttons[4].textContent = t.resetCalc;

    // Update section headers
    const sections = [
      { id: 'financials', key: 'financialTitle', descKey: 'financialDesc' },
      { id: 'config', key: 'configTitle', descKey: 'configDesc' },
      { id: 'execution', key: 'teamTitle', descKey: 'teamDesc' },
      { id: 'execution-plan', key: 'executionTitle', descKey: 'executionDesc' },
      { id: 'sales', key: 'salesTitle', descKey: 'salesDesc' },
      { id: 'operations', key: 'operationsTitle', descKey: 'operationsDesc' },
      { id: 'legal', key: 'legalTitle', descKey: 'legalDesc' },
      { id: 'governance', key: 'governanceTitle', descKey: 'governanceDesc' },
      { id: 'scorecard', key: 'scorecardTitle', descKey: 'scorecardDesc' },
      { id: 'tasks', key: 'tasksTitle', descKey: 'tasksDesc' },
      { id: 'sources', key: 'sourcesTitle', descKey: 'sourcesDesc' }
    ];

    sections.forEach(section => {
      const el = document.getElementById(section.id);
      if (el) {
        const h2 = el.querySelector('h2');
        const p = el.querySelector('.section-intro');
        if (h2) h2.textContent = t[section.key];
        if (p) p.textContent = t[section.descKey];
      }
    });

    // Update config labels
    const configLabels = document.querySelectorAll('#config label');
    const configKeys = ['serverCost', 'monthlyTax', 'premisesCost', 'vatRate', 'returnedFee', 'exchangeFee'];
    configLabels.forEach((label, i) => {
      if (configKeys[i]) label.textContent = t[configKeys[i]];
    });

    const configButtons = document.querySelectorAll('#config .btn');
    if (configButtons[0]) configButtons[0].textContent = t.saveConfig;
    if (configButtons[1]) configButtons[1].textContent = t.resetConfig;

    // Update task labels
    const taskLabels = document.querySelectorAll('#tasks label');
    const taskKeys = ['newTask', 'assignTo', 'priority', 'notes'];
    taskLabels.forEach((label, i) => {
      if (taskKeys[i]) label.textContent = t[taskKeys[i]];
    });

    const taskButtons = document.querySelectorAll('#tasks .btn');
    if (taskButtons[0]) taskButtons[0].textContent = t.addTask;
    if (taskButtons[1]) taskButtons[1].textContent = t.clearCompleted;

    // Update scorecard labels
    const scorecardLabels = document.querySelectorAll('#scorecard label');
    const scorecardKeys = ['cashAvailable', 'revenueCollected', 'revenueInvoiced', 'qualifiedProspects'];
    scorecardLabels.forEach((label, i) => {
      if (scorecardKeys[i]) label.textContent = t[scorecardKeys[i]];
    });

    // Update language button
    $("langToggle").textContent = lang === 'en' ? '🇫🇷 Français' : '🇬🇧 English';
  }

  // =====================
  // Navigation
  // =====================
  function setupNavigation() {
    const links = [...document.querySelectorAll("#sideNav a")];
    const sections = links
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              links.forEach((a) =>
                a.classList.toggle(
                  "active",
                  a.getAttribute("href") === "#" + e.target.id,
                ),
              );
            }
          }),
        { rootMargin: "-15% 0px -70% 0px" },
      );
      sections.forEach((s) => io.observe(s));
    }
  }

  // =====================
  // Initialization
  // =====================
  function init() {
    // Load saved data
    loadFromStorage();
    loadConfig();
    loadTasks();

    // Update displays
    updateFinancialsFromConfig();
    drawBars($("costChart"), [
      { label: "Server", value: 139.04, color: "#3157d5" },
      { label: "Tax", value: 30, color: "#98a2b3" },
      { label: "Premises", value: 150, color: "#d97706" },
    ]);
    updateCalc();

    // Event listeners
    ["fee", "orders", "cost", "clients", "target", "manualRevenue"].forEach(
      (id) => $(id).addEventListener("input", () => { updateCalc(); saveToStorage(); }),
    );
    ["cashOnHand", "collected", "invoiced", "pipeline"].forEach((id) =>
      $(id).addEventListener("input", () => { updateScore(); saveToStorage(); }),
    );

    $("resetCalc").addEventListener("click", () => {
      $("fee").value = 1;
      $("orders").value = 80;
      $("cost").value = 320;
      $("clients").value = 1;
      $("target").value = 500;
      $("manualRevenue").value = "";
      updateCalc();
    });

    $("exportCsv").addEventListener("click", exportCsv);
    $("exportJson").addEventListener("click", exportJson);
    $("importJson").addEventListener("click", () => $("jsonFileInput").click());
    $("jsonFileInput").addEventListener("change", importJson);

    $("saveConfig").addEventListener("click", saveConfig);
    $("resetConfig").addEventListener("click", resetConfig);

    $("addTask").addEventListener("click", addTask);
    $("clearCompleted").addEventListener("click", clearCompleted);

    $("langToggle").addEventListener("click", () => {
      setLanguage(currentLang === 'en' ? 'fr' : 'en');
    });

    window.addEventListener("resize", () => {
      drawBars($("costChart"), [
        { label: "Server", value: 139.04, color: "#3157d5" },
        { label: "Tax", value: 30, color: "#98a2b3" },
        { label: "Premises", value: 150, color: "#d97706" },
      ]);
      updateCalc();
    });

    setupNavigation();
  }

  // Start the app
  init();
})();
