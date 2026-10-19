// Wolvo Plan - Main Application Logic
(function () {
  const $ = (id) => document.getElementById(id);
  const money = (n) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(n) + " DT";
  const num = (id) => Math.max(0, Number($(id).value) || 0);
  const signedMoney = (n) => (n < 0 ? "−" : "") + money(Math.abs(n));

  // Storage keys
  const STORAGE_KEY = 'wolvo_plan_data';
  const CONFIG_KEY = 'wolvo_config_data';
  const TASKS_KEY = 'wolvo_tasks';
  const TASK_STARTER_MIGRATION_KEY = 'wolvo_urgent_tasks_seed_v3';
  const PAGE_KEY = 'wolvo_plan_active_page';
  const BRIDGE_PREFILL_KEY = 'wolvo_plan_bridge_prefill_v1';

  // =====================
  // Configuration Functions
  // =====================
  function saveConfig() {
    const config = {
      server: $("configServer").value,
      email: $("configEmail").value,
      domain: $("configDomain").value,
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
        if (config.server !== undefined) $("configServer").value = config.server;
        if (config.email !== undefined) $("configEmail").value = config.email;
        if (config.domain !== undefined) $("configDomain").value = config.domain;
        if (config.tax !== undefined) $("configTax").value = config.tax;
        if (config.premises !== undefined) $("configPremises").value = config.premises;
        if (config.vatRate !== undefined) $("configVatRate").value = config.vatRate;
        if (config.returnedFee !== undefined) $("configReturnedFee").value = config.returnedFee;
        if (config.exchangeFee !== undefined) $("configExchangeFee").value = config.exchangeFee;
      } catch (e) {
        console.error('Error loading config:', e);
      }
    }
  }

  function resetConfig() {
    $("configServer").value = 834.238;
    $("configEmail").value = 94.8;
    $("configDomain").value = 54;
    $("configTax").value = 30;
    $("configPremises").value = 600;
    $("configVatRate").value = 19;
    $("configReturnedFee").value = 0.500;
    $("configExchangeFee").value = 0.500;
    saveConfig();
  }

  function updateFinancialsFromConfig() {
    const server = Math.max(0, Number($("configServer").value) || 0);
    const email = Math.max(0, Number($("configEmail").value) || 0);
    const domain = Math.max(0, Number($("configDomain").value) || 0);
    const tax = Math.max(0, Number($("configTax").value) || 0);
    const premises = Math.max(0, Number($("configPremises").value) || 0);

    const monthlyServer = server / 6;
    const monthlyEmail = email / 12;
    const monthlyDomain = domain / 12;
    const monthlyPremisesLow = premises / 6;
    const monthlyPremisesHigh = premises / 3;
    const monthlyTotalLow = monthlyServer + monthlyEmail + monthlyDomain + tax + monthlyPremisesLow;
    const monthlyTotalHigh = monthlyServer + monthlyEmail + monthlyDomain + tax + monthlyPremisesHigh;

    // Update financial baseline section
    const serverEl = $("financialServerValue");
    const emailEl = $("financialEmailValue");
    const domainEl = $("financialDomainValue");
    const taxEl = $("financialTaxValue");
    const premisesEl = $("financialPremisesValue");
    const totalEl = $("financialTotalValue");

    if (serverEl) serverEl.textContent = money(monthlyServer);
    if (emailEl) emailEl.textContent = money(monthlyEmail);
    if (domainEl) domainEl.textContent = money(monthlyDomain);
    if (taxEl) taxEl.textContent = money(tax);
    if (premisesEl) premisesEl.textContent = money(monthlyPremisesLow) + '–' + money(monthlyPremisesHigh);
    if (totalEl) totalEl.textContent = money(monthlyTotalLow) + '–' + money(monthlyTotalHigh);

    const fmt = new Intl.NumberFormat(currentLang === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 3 });
    const formulas = document.querySelectorAll("#financials .formula");
    const formulaValues = {
      server: fmt.format(server), monthlyServer: fmt.format(monthlyServer),
      email: fmt.format(email), monthlyEmail: fmt.format(monthlyEmail),
      domain: fmt.format(domain), monthlyDomain: fmt.format(monthlyDomain),
      premises: fmt.format(premises), premisesLow: fmt.format(monthlyPremisesLow),
      premisesHigh: fmt.format(monthlyPremisesHigh), totalLow: fmt.format(monthlyTotalLow),
      totalHigh: fmt.format(monthlyTotalHigh),
    };
    ["costFormula1", "costFormula2", "costFormula3", "costFormula4", "costFormula5"].forEach((key, i) => {
      if (formulas[i]) formulas[i].textContent = translations[currentLang][key].replace(/\{(\w+)\}/g, (_, name) => formulaValues[name]);
    });
    const caption = document.getElementById("costChartCaption");
    if (caption) caption.textContent = translations[currentLang].costChartCaption.replace(/\{(\w+)\}/g, (_, name) => ({
      ...formulaValues, tax: fmt.format(tax), premisesMid: fmt.format((monthlyPremisesLow + monthlyPremisesHigh) / 2),
      totalMid: fmt.format((monthlyTotalLow + monthlyTotalHigh) / 2),
    })[name]);

    const lowValue = document.getElementById("lowCostValue");
    const highValue = document.getElementById("highCostValue");
    const maxCost = Math.max(1, monthlyTotalHigh);
    if (lowValue) lowValue.textContent = money(monthlyTotalLow);
    if (highValue) highValue.textContent = money(monthlyTotalHigh);
    const lowBar = document.getElementById("lowCostBar");
    const highBar = document.getElementById("highCostBar");
    if (lowBar) lowBar.style.width = `${Math.min(100, monthlyTotalLow / maxCost * 100)}%`;
    if (highBar) highBar.style.width = `${Math.min(100, monthlyTotalHigh / maxCost * 100)}%`;
    const revenueValue = document.getElementById("revenueValue");
    if (revenueValue) revenueValue.textContent = "80–150 DT";
    const revenueBar = document.querySelector("#financials .barrow .barfill");
    if (revenueBar) revenueBar.style.width = `${Math.min(100, 115 / maxCost * 100)}%`;
    const gapValue = document.getElementById("monthlyGapValue");
    if (gapValue) gapValue.textContent = translations[currentLang].gapDesc
      .replace("{low}", signedMoney(monthlyTotalLow - 150))
      .replace("{high}", signedMoney(monthlyTotalHigh - 80));
    const gapLabel = document.getElementById("monthlyGapLabel");
    if (gapLabel) gapLabel.textContent = translations[currentLang].monthlyGap;

    // Update cost chart
    drawBars($("costChart"), [
      { label: translations[currentLang].chartServer, value: monthlyServer, color: "#3157d5" },
      { label: translations[currentLang].chartEmail, value: monthlyEmail, color: "#7c3aed" },
      { label: translations[currentLang].chartDomain, value: monthlyDomain, color: "#0891b2" },
      { label: translations[currentLang].chartTax, value: tax, color: "#98a2b3" },
      { label: translations[currentLang].chartPremises, value: (monthlyPremisesLow + monthlyPremisesHigh) / 2, color: "#d97706" },
    ]);

    // Update cost input in calculator to match
    const avgCost = (monthlyTotalLow + monthlyTotalHigh) / 2;
    $("cost").value = Math.ceil(avgCost);
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
        pipeline: $("pipeline").value,
        activeClients: $("activeClients").value, outreachCount: $("outreachCount").value,
        demosCount: $("demosCount").value, overdueBills: $("overdueBills").value, scorecardDate: $("scorecardDate").value
      },
      cashBridge: Object.fromEntries(["bridgeCash", "bridgeRestore", "bridgeArrears", "bridgeBills", "bridgeReceipts", "bridgeDate"].map(id => [id, $(id).value])),
      executionChecks: [...document.querySelectorAll("#execution-plan .task input[type=checkbox]")].map(input => input.checked)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.calculator) {
          if (data.calculator.fee !== undefined) $("fee").value = data.calculator.fee;
          if (data.calculator.orders !== undefined) $("orders").value = data.calculator.orders;
          if (data.calculator.cost !== undefined) $("cost").value = data.calculator.cost;
          if (data.calculator.clients !== undefined) $("clients").value = data.calculator.clients;
          if (data.calculator.target !== undefined) $("target").value = data.calculator.target;
          if (data.calculator.manualRevenue !== undefined) $("manualRevenue").value = data.calculator.manualRevenue;
        }
        if (data.scorecard) {
          if (data.scorecard.cashOnHand !== undefined) $("cashOnHand").value = data.scorecard.cashOnHand;
          if (data.scorecard.collected !== undefined) $("collected").value = data.scorecard.collected;
          if (data.scorecard.invoiced !== undefined) $("invoiced").value = data.scorecard.invoiced;
          if (data.scorecard.pipeline !== undefined) $("pipeline").value = data.scorecard.pipeline;
          ["activeClients", "outreachCount", "demosCount", "overdueBills", "scorecardDate"].forEach(id => { if (data.scorecard[id] !== undefined) $(id).value = data.scorecard[id]; });
        }
        if (data.cashBridge) Object.entries(data.cashBridge).forEach(([id, value]) => { if ($(id) && value !== undefined) $(id).value = value; });
        if (Array.isArray(data.executionChecks)) document.querySelectorAll("#execution-plan .task input[type=checkbox]").forEach((input, i) => { input.checked = Boolean(data.executionChecks[i]); });
      } catch (e) {
        console.error('Error loading from storage:', e);
      }
    }
    if (!localStorage.getItem(BRIDGE_PREFILL_KEY)) {
      const bridgeIds = ["bridgeCash", "bridgeRestore", "bridgeArrears", "bridgeBills", "bridgeReceipts", "bridgeDate"];
      if (bridgeIds.every(id => $(id).value === "")) {
        $("bridgeCash").value = "0";
        $("bridgeRestore").value = "834.238";
        $("bridgeArrears").value = "0";
        $("bridgeBills").value = "630";
        $("bridgeReceipts").value = "0";
        $("bridgeDate").value = "2026-10-31";
        saveToStorage();
      }
      localStorage.setItem(BRIDGE_PREFILL_KEY, "1");
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
    $("ordersOut").textContent = orders + " " + translations[currentLang].deliveredOrders;
    $("costOut").textContent = money(cost);
    $("clientsOut").textContent =
      clients + " " + (clients === 1 ? translations[currentLang].clientSingular : translations[currentLang].clientPlural);
    $("targetOut").textContent = money(target);
    $("manualOut").textContent =
      manual === ""
        ? translations[currentLang].autoPrefix + " " + money(fee * orders)
        : translations[currentLang].overridePrefix + " " + money(rev);
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
        label: c + " " + translations[currentLang].clientPlural,
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
    const collectionsKnown = $("collected").value !== "";
    const invoicesKnown = $("invoiced").value !== "";
    const cashKnown = $("cashOnHand").value !== "";
    const pipelineKnown = $("pipeline").value !== "";
    $("collectionRate").textContent = collectionsKnown && invoicesKnown && inv > 0 ? Math.round((col / inv) * 100) + "%" : "—";
    const gap = col - cost;
    $("scoreGap").textContent = collectionsKnown ? signedMoney(gap) : "—";
    $("scoreGap").style.color = collectionsKnown ? (gap >= 0 ? "#087443" : "#b42318") : "var(--warn)";
    $("runway").textContent =
      cashKnown && cost > 0 ? (cash / cost).toFixed(1) + " " + translations[currentLang].runwayMonth : "—";
    $("pipelineOut").textContent = pipelineKnown ? pipeline : "—";
  }

  function updateCashBridge() {
    const requiredFields = ["bridgeCash", "bridgeRestore", "bridgeArrears", "bridgeBills", "bridgeReceipts"];
    const complete = requiredFields.every(id => $(id).value !== "");
    if (!complete) {
      $("bridgeRequired").textContent = "—";
      $("bridgeAvailable").textContent = "—";
      $("bridgeGap").textContent = "—";
      $("bridgeGap").style.color = "var(--warn)";
      return;
    }
    const required = num("bridgeRestore") + num("bridgeArrears") + num("bridgeBills");
    const available = num("bridgeCash") + num("bridgeReceipts");
    const gap = Math.max(0, required - available);
    const fmt = (n) => money(n);
    $("bridgeRequired").textContent = fmt(required);
    $("bridgeAvailable").textContent = fmt(available);
    $("bridgeGap").textContent = fmt(gap);
    $("bridgeGap").style.color = gap > 0 ? "var(--bad)" : "var(--good)";
  }

  // =====================
  // Task Management
  // =====================
  let tasks = [];
  const expandedTaskIds = new Set();
  const openSubtaskFormTaskIds = new Set();
  const editingSubtaskByTask = new Map();
  const replyComposerByTask = new Map();
  let activeTaskView = "all";
  const starterTasks = [
    {
      id: 26000000000001, seedKey: "urgent-hosting-recovery", title: "Get written confirmation of server suspension and recovery terms",
      assignees: ["issam"], priority: "urgent", status: "backlog", completed: false,
      notes: "Contact the host before paying. Confirm the exact amount due, whether service returns immediately after payment, any reactivation delay, data and backup status, and the next renewal date. Do not assume payment alone restores service.",
      createdAt: "2026-10-19T09:00:00.000Z", subtasks: [
        { id: 26000000000011, title: "Send the support ticket asking for the exact recovery steps and timeline", completed: false },
        { id: 26000000000012, title: "Confirm whether data, backups, and server configuration are still intact", completed: false },
        { id: 26000000000013, title: "Record the confirmed amount, payment method, and next renewal date", completed: false }
      ]
    },
    {
      id: 26000000000002, seedKey: "urgent-cash-bridge", title: "Confirm the cash bridge and decide what the company can safely pay",
      assignees: ["issam"], priority: "urgent", status: "backlog", completed: false,
      notes: "Replace the prefilled estimates with confirmed cash, bills, and dates. Make a written go/no-go decision on restoring the server that includes the next six-month renewal and a credible way to cover ongoing costs.",
      createdAt: "2026-10-19T09:00:00.000Z", subtasks: [
        { id: 26000000000021, title: "Confirm available company cash and any committed contribution", completed: false },
        { id: 26000000000022, title: "Verify tax, premises, hosting, email, domain, and overdue bill amounts and due dates", completed: false },
        { id: 26000000000023, title: "Update the Immediate cash bridge and record the payment decision", completed: false }
      ]
    },
    {
      id: 26000000000003, seedKey: "urgent-protect-active-client", title: "Protect and retain the active paying client",
      assignees: ["issam", "nasim"], priority: "urgent", status: "backlog", completed: false,
      notes: "Contact the client promptly, explain the confirmed service status clearly, and agree on the next operating and payment steps. Confirm how the client uses Intigo and avoid promising a restoration time until the host confirms it.",
      createdAt: "2026-10-19T09:00:00.000Z", subtasks: [
        { id: 26000000000031, title: "Check the client's immediate support needs and Intigo order workflow", completed: false },
        { id: 26000000000032, title: "Confirm current monthly usage, amount due, and expected payment date", completed: false },
        { id: 26000000000033, title: "Agree on a client update plan tied to the host's confirmed response", completed: false }
      ]
    },
    {
      id: 26000000000004, seedKey: "first-merchant-outreach-sprint", title: "Start a focused merchant outreach sprint",
      assignees: ["jawher"], priority: "next", status: "backlog", completed: false,
      notes: "Prioritize merchant referrals through Intigo and direct outreach to merchants already shipping with Intigo. Focus on recurring delivery volume and a clear need for order tracking, delivery insights, or repeat-purchase campaigns. Keep the offer simple and do not promise unready features.",
      createdAt: "2026-10-19T09:00:00.000Z", subtasks: [
        { id: 26000000000041, title: "Build a shortlist of 20 suitable Intigo merchants and warm introductions", completed: false },
        { id: 26000000000042, title: "Contact the first five qualified merchants already using Intigo and log responses", completed: false },
        { id: 26000000000043, title: "Schedule a product demo and record objections and next steps", completed: false }
      ]
    },
    {
      id: 26000000000005, seedKey: "billing-and-accounting-workflow", title: "Validate the separate client invoicing workflow",
      assignees: ["issam", "nasim"], priority: "next", status: "backlog", completed: false,
      notes: "Prepare a practical monthly process where Intigo pays merchants directly under its payout schedule and Wolvo invoices for its platform service. Have the Tunisian accountant confirm invoicing, tax treatment, records, agreement terms, due dates, reminders, and any suspension rules before rollout.",
      createdAt: "2026-10-19T09:00:00.000Z", subtasks: [
        { id: 26000000000051, title: "Draft the monthly Intigo delivered-order report and reconciliation steps", completed: false },
        { id: 26000000000052, title: "Ask the accountant to confirm invoice, tax, and recordkeeping requirements", completed: false },
        { id: 26000000000053, title: "Document client payment terms, reminders, grace period, and data access", completed: false }
      ]
    },
    {
      id: 26000000000006, seedKey: "shareholder-deadlock-advice", title: "Get legal advice on shareholder deadlock and decision authority",
      assignees: ["issam"], priority: "next", status: "backlog", completed: false,
      notes: "Clarify the company's legal form, voting thresholds, signature requirements, and lawful options before approaching investors or attempting any shareholder change. Do not assume unanimous signatures are required for every action.",
      createdAt: "2026-10-19T09:00:00.000Z", subtasks: [
        { id: 26000000000061, title: "Gather the statutes, shareholder agreements, cap table, and meeting records", completed: false },
        { id: 26000000000062, title: "Ask a Tunisian corporate lawyer which decisions need which approvals", completed: false },
        { id: 26000000000063, title: "Write down lawful next steps and any investor-facing constraints", completed: false }
      ]
    },
    {
      id: 26000000000007, seedKey: "mohamed-interim-role", title: "Define a short-term support assignment for Mohamed Ahmed",
      assignees: ["issam", "mohamed"], priority: "normal", status: "backlog", completed: false,
      notes: "His ongoing role is undecided. Agree on a small, time-limited assignment that uses his operations and client coordination experience, with a clear owner and deliverable, before adding open-ended responsibilities.",
      createdAt: "2026-10-19T09:00:00.000Z", subtasks: [
        { id: 26000000000071, title: "Review the most urgent client or Intigo coordination work", completed: false },
        { id: 26000000000072, title: "Agree on one deliverable, time commitment, and review date", completed: false }
      ]
    },
    {
      id: 26000000000008, seedKey: "business-bank-account", title: "Open a dedicated business bank account and set payment controls",
      assignees: ["issam"], priority: "next", status: "backlog", completed: false,
      notes: "Confirm the company's account requirements with the bank and accountant, then use the account for Wolvo's own service revenue and bills. Keep Intigo paying merchants directly; do not route client order proceeds through Wolvo.",
      createdAt: "2026-10-19T09:00:00.000Z", subtasks: [
        { id: 26000000000081, title: "Ask the bank and accountant for company documents and signatory requirements", completed: false },
        { id: 26000000000082, title: "Open the account in the company's legal name and secure online access", completed: false },
        { id: 26000000000083, title: "Confirm how invoices, client payments, and business expenses will be recorded", completed: false }
      ]
    },
    {
      id: 26000000000009, seedKey: "delivery-partner-onboarding", title: "Set up Intigo contacts and merchant onboarding",
      assignees: ["jawher", "nasim"], priority: "next", status: "backlog", completed: false,
      notes: "Establish accountable commercial and operational contacts at Intigo. Document Intigo's merchant signup, account setup, technical access, service coverage, payout schedule, and support process before promising onboarding timelines to clients.",
      createdAt: "2026-10-19T09:00:00.000Z", subtasks: [
        { id: 26000000000091, title: "Confirm Intigo commercial and operations contacts", completed: false },
        { id: 26000000000092, title: "Document Intigo merchant onboarding, integration, and service coverage requirements", completed: false },
        { id: 26000000000093, title: "Record Intigo escalation channels, response expectations, and follow-up cadence", completed: false }
      ]
    },
    {
      id: 26000000000010, seedKey: "client-onboarding-checklist", title: "Create a repeatable client onboarding checklist",
      assignees: ["nasim", "issam"], priority: "next", status: "backlog", completed: false,
      notes: "Make every new merchant setup consistent from signed agreement to first successful delivery through Intigo. Include Intigo account setup, testing, training, Wolvo billing expectations, and the support contact. Keep the checklist short enough to use for every client.",
      createdAt: "2026-10-19T09:00:00.000Z", subtasks: [
        { id: 26000000000101, title: "List the client details, agreement, pricing, and permissions needed before setup", completed: false },
        { id: 26000000000102, title: "Document Intigo account connection and a first test order", completed: false },
        { id: 26000000000103, title: "Add client training, support escalation, and first invoice handoff steps", completed: false }
      ]
    },
    {
      id: 26000000000011, seedKey: "production-recovery-checklist", title: "Prepare a production recovery and continuity checklist",
      assignees: ["issam"], priority: "urgent", status: "backlog", completed: false,
      notes: "Before paying for restoration, confirm the host's recovery and backup status. After service is restored, verify the core client workflow and record the next renewal, backup location, responsible contacts, and recovery steps so a future suspension or outage is less disruptive.",
      createdAt: "2026-10-19T09:00:00.000Z", subtasks: [
        { id: 26000000000111, title: "Confirm backup availability and the safest restoration path with the host", completed: false },
        { id: 26000000000112, title: "After restoration, test login, order flow, Intigo connection, and tracking", completed: false },
        { id: 26000000000113, title: "Record renewal date, backup checks, recovery contacts, and access ownership", completed: false }
      ]
    },
    {
      id: 26000000000012, seedKey: "support-and-reclamation-process", title: "Document the client support and reclamation handling process",
      assignees: ["nasim"], priority: "next", status: "backlog", completed: false,
      notes: "Set one clear path for clients to report Intigo delivery issues, reclamations, and platform problems. Define how each case is recorded, who follows up with Intigo, when the client receives an update, and when an issue is escalated.",
      createdAt: "2026-10-19T09:00:00.000Z", subtasks: [
        { id: 26000000000121, title: "Define the minimum issue details and evidence to collect from the client", completed: false },
        { id: 26000000000122, title: "Set triage, Intigo escalation, client update, and closure steps", completed: false },
        { id: 26000000000123, title: "Create a simple issue log and weekly review of recurring problems", completed: false }
      ]
    }
  ];

  const starterTaskFrench = {
    "urgent-hosting-recovery": { title: "Obtenir une confirmation écrite de la suspension du serveur et des conditions de rétablissement", notes: "Contactez l’hébergeur avant tout paiement. Confirmez le montant exact, le délai de réactivation après paiement, l’état des données et des sauvegardes ainsi que la prochaine échéance. Ne supposez pas que le paiement rétablit immédiatement le service.", subtasks: ["Envoyer le ticket au support pour demander les étapes et le délai exacts de rétablissement", "Confirmer que les données, sauvegardes et la configuration du serveur sont toujours intactes", "Noter le montant confirmé, le moyen de paiement et la prochaine date de renouvellement"] },
    "urgent-cash-bridge": { title: "Confirmer le besoin de trésorerie et décider ce que l’entreprise peut payer sans risque", notes: "Remplacez les estimations préremplies par la trésorerie, les factures et les échéances confirmées. Prenez une décision écrite sur la réactivation du serveur en tenant compte du prochain renouvellement semestriel et d’un moyen crédible de couvrir les coûts courants.", subtasks: ["Confirmer la trésorerie disponible de l’entreprise et tout apport réellement engagé", "Vérifier les montants et échéances des impôts, locaux, serveur, e-mails, domaine et factures en retard", "Mettre à jour le plan de trésorerie immédiat et noter la décision de paiement"] },
    "urgent-protect-active-client": { title: "Fidéliser la cliente actuellement active et payante", notes: "Contactez rapidement la cliente, expliquez clairement l’état confirmé du service et convenez des prochaines étapes opérationnelles et de paiement. Confirmez comment elle utilise Intigo et ne promettez aucun délai de réactivation avant confirmation de l’hébergeur.", subtasks: ["Vérifier les besoins immédiats de la cliente et son processus de commandes avec Intigo", "Confirmer l’utilisation mensuelle, le montant dû et la date de paiement prévue", "Convenir d’un plan de communication lié à la réponse confirmée de l’hébergeur"] },
    "first-merchant-outreach-sprint": { title: "Lancer une prospection ciblée auprès des commerçants", notes: "Priorisez les mises en relation par Intigo et le contact direct de commerçants qui expédient déjà avec Intigo. Ciblez les volumes réguliers et les besoins de suivi des commandes, d’analyse des livraisons ou de fidélisation. Présentez une offre simple sans promettre de fonctionnalités qui ne sont pas prêtes.", subtasks: ["Établir une liste de 20 commerçants Intigo adaptés et de contacts à recommander", "Contacter les cinq premiers prospects qualifiés utilisant Intigo et noter leurs réponses", "Planifier une démonstration et consigner les objections et prochaines étapes"] },
    "billing-and-accounting-workflow": { title: "Valider le processus de facturation directe des clients", notes: "Préparez un processus mensuel où Intigo paie directement les commerçants et Wolvo facture séparément son service de plateforme. Avant le lancement, demandez au comptable tunisien de confirmer la facturation, le traitement fiscal, les justificatifs, les conditions contractuelles, les échéances, les relances et les règles de suspension.", subtasks: ["Préparer le rapport mensuel des commandes livrées via Intigo et les étapes de rapprochement", "Demander au comptable de confirmer les règles de facturation, fiscales et de conservation des justificatifs", "Documenter les conditions de paiement, relances, délai de grâce et accès aux données"] },
    "shareholder-deadlock-advice": { title: "Obtenir un avis juridique sur le blocage des actionnaires et les pouvoirs de décision", notes: "Clarifiez la forme juridique de l’entreprise, les seuils de vote, les exigences de signature et les options légales avant de contacter des investisseurs ou d’envisager un changement d’actionnariat. Ne supposez pas que l’unanimité est requise pour chaque décision.", subtasks: ["Rassembler les statuts, pactes d’actionnaires, la répartition du capital et les procès-verbaux", "Demander à un avocat tunisien quelles décisions exigent quelles approbations", "Noter les prochaines étapes légales et les contraintes pour les investisseurs"] },
    "mohamed-interim-role": { title: "Définir une mission de soutien temporaire pour Mohamed Ahmed", notes: "Son rôle à long terme reste à définir. Convenez d’une mission courte et limitée qui utilise son expérience en opérations et coordination client, avec un responsable et un livrable précis, avant de lui confier des responsabilités ouvertes.", subtasks: ["Examiner les besoins urgents de coordination client ou avec Intigo", "Définir un livrable, un temps consacré et une date de bilan"] },
    "business-bank-account": { title: "Ouvrir un compte bancaire professionnel dédié et définir les contrôles de paiement", notes: "Confirmez auprès de la banque et du comptable les exigences du compte de l’entreprise, puis utilisez-le pour les revenus de service et les dépenses de Wolvo. Intigo doit continuer à payer directement les commerçants; ne faites pas transiter les recettes des commandes des clients par Wolvo.", subtasks: ["Demander à la banque et au comptable les documents de l’entreprise et les exigences de signature", "Ouvrir le compte au nom légal de l’entreprise et sécuriser l’accès en ligne", "Confirmer le suivi comptable des factures, paiements clients et dépenses professionnelles"] },
    "delivery-partner-onboarding": { title: "Établir les contacts Intigo et le processus d’intégration des commerçants", notes: "Identifiez les contacts commerciaux et opérationnels responsables chez Intigo. Documentez l’inscription des commerçants, la création de compte, les accès techniques, les zones desservies, le calendrier de paiement et le support avant de promettre un délai d’intégration aux clients.", subtasks: ["Confirmer les contacts commerciaux et opérationnels d’Intigo", "Documenter les exigences Intigo d’inscription, d’intégration et de couverture des services", "Noter les canaux d’escalade d’Intigo, les délais de réponse attendus et le rythme de suivi"] },
    "client-onboarding-checklist": { title: "Créer une liste de contrôle réutilisable pour l’intégration des clients", notes: "Rendez chaque configuration de commerçant cohérente, de la signature du contrat à la première livraison réussie via Intigo. Incluez la configuration du compte Intigo, les tests, la formation, les modalités de facturation Wolvo et le contact support. Gardez une liste assez courte pour chaque client.", subtasks: ["Lister les informations client, le contrat, le tarif et les accès nécessaires avant la configuration", "Documenter la connexion du compte Intigo et une première commande de test", "Ajouter la formation client, l’escalade du support et le passage à la première facture"] },
    "production-recovery-checklist": { title: "Préparer une liste de contrôle pour le rétablissement et la continuité du service", notes: "Avant de payer la réactivation, confirmez avec l’hébergeur l’état des sauvegardes et les étapes de récupération. Après le rétablissement, vérifiez le parcours client essentiel et consignez le prochain renouvellement, l’emplacement des sauvegardes, les contacts responsables et les étapes de reprise.", subtasks: ["Confirmer avec l’hébergeur la disponibilité des sauvegardes et la méthode de restauration la plus sûre", "Après le rétablissement, tester la connexion, les commandes, la connexion Intigo et le suivi", "Noter la date de renouvellement, les contrôles de sauvegarde, les contacts et les responsables des accès"] },
    "support-and-reclamation-process": { title: "Documenter le processus de support client et de gestion des réclamations", notes: "Définissez un parcours clair pour les clients qui signalent des problèmes de livraison Intigo, des réclamations ou des incidents de plateforme. Précisez comment chaque cas est enregistré, qui relance Intigo, quand le client reçoit une mise à jour et quand le problème est escaladé.", subtasks: ["Définir les informations et justificatifs minimums à recueillir auprès du client", "Établir les étapes de triage, d’escalade auprès d’Intigo, d’information client et de clôture", "Créer un registre simple des incidents et une revue hebdomadaire des problèmes récurrents"] }
  };

  starterTasks.forEach(task => {
    const french = starterTaskFrench[task.seedKey];
    if (!french) return;
    task.titleTranslations = { en: task.title, fr: french.title };
    task.notesTranslations = { en: task.notes, fr: french.notes };
    task.subtasks.forEach((subtask, index) => {
      subtask.titleTranslations = { en: subtask.title, fr: french.subtasks[index] || subtask.title };
    });
  });

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
    if (!Array.isArray(tasks)) tasks = [];
    if (localStorage.getItem(TASK_STARTER_MIGRATION_KEY) !== "1") {
      const templates = new Map(starterTasks.map(task => [task.seedKey, task]));
      tasks = tasks.map(task => {
        const template = templates.get(task.seedKey);
        if (!template) return task;
        const translatedSubtasks = new Map(template.subtasks.map(subtask => [Number(subtask.id), subtask.titleTranslations]));
        const refreshTitle = task.seedKey === "delivery-partner-onboarding" && /Intigo\s+(?:and|et)\s+/i.test(`${task.title || ""} ${task.titleTranslations?.en || ""} ${task.titleTranslations?.fr || ""}`);
        const legacyFocusNotes = task.seedKey === "urgent-protect-active-client" && task.notes?.startsWith("Contact the client promptly, explain the confirmed service status clearly") || task.seedKey === "first-merchant-outreach-sprint" && task.notes?.startsWith("Focus on merchants with recurring delivery volume");
        const refreshNotes = Boolean((template.notes?.includes("Intigo") && /partner|partenaire|delivery partner|partenaire de livraison/i.test(`${task.notes || ""} ${task.notesTranslations?.en || ""} ${task.notesTranslations?.fr || ""}`) && !/Intigo/i.test(`${task.notes || ""} ${task.notesTranslations?.en || ""} ${task.notesTranslations?.fr || ""}`)) || legacyFocusNotes);
        return {
          ...task,
          ...(refreshTitle ? { title: template.title, titleTranslations: template.titleTranslations } : { titleTranslations: task.titleTranslations || template.titleTranslations }),
          ...(refreshNotes ? { notes: template.notes, notesTranslations: template.notesTranslations } : { notesTranslations: task.notesTranslations || template.notesTranslations }),
          subtasks: (Array.isArray(task.subtasks) ? task.subtasks : []).map(subtask => {
            const translatedTemplate = template.subtasks.find(item => Number(item.id) === Number(subtask.id));
        const refreshSubtask = Boolean(translatedTemplate?.title?.includes("Intigo") && (refreshTitle || refreshNotes || /partner|partenaire|delivery/i.test(`${subtask.title || ""} ${subtask.titleTranslations?.en || ""} ${subtask.titleTranslations?.fr || ""}`)) && !/Intigo/i.test(`${subtask.title || ""} ${subtask.titleTranslations?.en || ""} ${subtask.titleTranslations?.fr || ""}`));
            return {
              ...subtask,
              ...(refreshSubtask ? { title: translatedTemplate.title, titleTranslations: translatedTemplate.titleTranslations } : { titleTranslations: subtask.titleTranslations || translatedSubtasks.get(Number(subtask.id)) || { en: subtask.title || "", fr: subtask.title || "" } })
            };
          })
        };
      });
      const existingSeedKeys = new Set(tasks.map(task => task.seedKey).filter(Boolean));
      tasks.push(...starterTasks.filter(task => !existingSeedKeys.has(task.seedKey)));
      saveTasks();
      localStorage.setItem(TASK_STARTER_MIGRATION_KEY, "1");
    }
    renderTasks();
  }

  function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  function addTask() {
    const titleEn = $("taskTitleEn").value.trim();
    const titleFr = $("taskTitleFr").value.trim();
    if (!titleEn || !titleFr) {
      const error = $("taskTitleError");
      error.textContent = translations[currentLang].taskTitleTranslationRequired;
      error.hidden = false;
      (!titleEn ? $("taskTitleEn") : $("taskTitleFr")).focus();
      return;
    }
    const notesEn = $("taskNotesEn").value.trim();
    const notesFr = $("taskNotesFr").value.trim();
    if (Boolean(notesEn) !== Boolean(notesFr)) {
      const error = $("taskDescriptionError");
      error.textContent = translations[currentLang].taskDescriptionTranslationRequired;
      error.hidden = false;
      (!notesEn ? $("taskNotesEn") : $("taskNotesFr")).focus();
      return;
    }
    const assignees = [...document.querySelectorAll(".task-assignee-checkbox:checked")].map(input => input.value);
    if (assignees.length === 0) {
      const error = $("taskAssigneeError");
      error.textContent = translations[currentLang].taskAssigneeRequired;
      error.hidden = false;
      document.querySelector(".task-assignee-checkbox")?.focus();
      return;
    }

    const task = {
      id: Date.now(),
      title: titleEn,
      titleTranslations: { en: titleEn, fr: titleFr },
      assignees,
      priority: $("taskPriority").value,
      status: "backlog",
      notes: notesEn,
      notesTranslations: { en: notesEn, fr: notesFr },
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: [],
      comments: []
    };

    tasks.push(task);
    expandedTaskIds.add(Number(task.id));
    saveTasks();
    renderTasks();

    $("taskTitleEn").value = "";
    $("taskTitleFr").value = "";
    $("taskNotesEn").value = "";
    $("taskNotesFr").value = "";
    if ($("taskTitleError")) $("taskTitleError").hidden = true;
    if ($("taskDescriptionError")) $("taskDescriptionError").hidden = true;
    closeTaskForm();
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.status = task.status === "done" || task.completed ? "backlog" : "done";
      task.completed = task.status === "done";
      saveTasks();
      renderTasks();
    }
  }

  function setTaskStatus(id, status) {
    const task = tasks.find(t => t.id === id);
    if (!task || !["backlog", "in-progress", "done"].includes(status)) return;
    task.status = status;
    task.completed = status === "done";
    saveTasks();
    renderTasks();
  }

  function deleteTask(id) {
    const task = tasks.find(t => Number(t.id) === Number(id));
    if (!task || task.deletedAt) return;
    task.deletedAt = new Date().toISOString();
    expandedTaskIds.delete(id);
    saveTasks();
    renderTasks();
  }

  function restoreTask(id) {
    const task = tasks.find(t => Number(t.id) === Number(id));
    if (!task || !task.deletedAt) return;
    delete task.deletedAt;
    saveTasks();
    renderTasks();
  }

  function permanentlyDeleteTask(id) {
    const task = tasks.find(t => Number(t.id) === Number(id));
    if (!task || !task.deletedAt || !window.confirm(translations[currentLang].confirmPermanentTaskDelete)) return;
    tasks = tasks.filter(t => Number(t.id) !== Number(id));
    saveTasks();
    renderTasks();
  }

  function toggleTaskDetails(id) {
    if (expandedTaskIds.has(id)) expandedTaskIds.delete(id);
    else expandedTaskIds.add(id);
    renderTasks();
  }

  function hasPendingResponse(task) {
    return (Array.isArray(task.comments) ? task.comments : []).some(comment =>
      comment.needsResponse && !comment.resolved
    );
  }

  function setTaskView(view) {
    if (!['all', 'needs-response', 'trash'].includes(view)) return;
    activeTaskView = view;
    renderTasks();
  }

  function addTaskComment(taskId) {
    const task = tasks.find(item => Number(item.id) === taskId);
    const body = $(`task-comment-draft-${taskId}`)?.value.trim();
    if (!task || !body) return;
    const author = $(`task-comment-author-${taskId}`)?.value || "issam";
    const needsResponse = $(`task-comment-type-${taskId}`)?.value === "response";
    if (!Array.isArray(task.comments)) task.comments = [];
    task.comments.push({
      id: Date.now(), author, body, needsResponse, resolved: false,
      createdAt: new Date().toISOString(), replies: []
    });
    expandedTaskIds.add(taskId);
    saveTasks();
    renderTasks();
  }

  function toggleReplyComposer(taskId, commentId) {
    if (replyComposerByTask.get(taskId) === commentId) replyComposerByTask.delete(taskId);
    else replyComposerByTask.set(taskId, commentId);
    renderTasks();
  }

  function addTaskReply(taskId, commentId) {
    const task = tasks.find(item => Number(item.id) === taskId);
    const comment = task?.comments?.find(item => Number(item.id) === commentId);
    const body = $(`task-reply-draft-${taskId}-${commentId}`)?.value.trim();
    if (!comment || !body) return;
    const author = $(`task-comment-author-${taskId}`)?.value || "issam";
    if (!Array.isArray(comment.replies)) comment.replies = [];
    comment.replies.push({ id: Date.now(), author, body, createdAt: new Date().toISOString() });
    replyComposerByTask.delete(taskId);
    saveTasks();
    renderTasks();
  }

  function markCommentResponded(taskId, commentId) {
    const task = tasks.find(item => Number(item.id) === taskId);
    const comment = task?.comments?.find(item => Number(item.id) === commentId);
    if (!comment) return;
    comment.resolved = true;
    saveTasks();
    renderTasks();
  }

  function deleteTaskComment(taskId, commentId) {
    const task = tasks.find(item => Number(item.id) === taskId);
    if (!task) return;
    task.comments = (Array.isArray(task.comments) ? task.comments : []).filter(comment => Number(comment.id) !== commentId);
    if (replyComposerByTask.get(taskId) === commentId) replyComposerByTask.delete(taskId);
    saveTasks();
    renderTasks();
  }

  function deleteTaskReply(taskId, commentId, replyId) {
    const task = tasks.find(item => Number(item.id) === taskId);
    const comment = task?.comments?.find(item => Number(item.id) === commentId);
    if (!comment) return;
    comment.replies = (Array.isArray(comment.replies) ? comment.replies : []).filter(reply => Number(reply.id) !== replyId);
    saveTasks();
    renderTasks();
  }

  function toggleSubtaskForm(taskId) {
    if (openSubtaskFormTaskIds.has(taskId)) openSubtaskFormTaskIds.delete(taskId);
    else openSubtaskFormTaskIds.add(taskId);
    renderTasks();
  }

  function addSubtask(taskId) {
    const task = tasks.find(item => Number(item.id) === taskId);
    const titleEn = $(`task-subtask-en-${taskId}`)?.value.trim();
    const titleFr = $(`task-subtask-fr-${taskId}`)?.value.trim();
    if (!task) return;
    if (!titleEn || !titleFr) {
      const error = $(`task-subtask-error-${taskId}`);
      if (error) {
        error.textContent = translations[currentLang].subtaskTranslationRequired;
        error.hidden = false;
      }
      (!titleEn ? $(`task-subtask-en-${taskId}`) : $(`task-subtask-fr-${taskId}`))?.focus();
      return;
    }
    if (!Array.isArray(task.subtasks)) task.subtasks = [];
    task.subtasks.push({
      id: Date.now(), title: titleEn, titleTranslations: { en: titleEn, fr: titleFr }, completed: false
    });
    openSubtaskFormTaskIds.delete(taskId);
    saveTasks();
    renderTasks();
  }

  function editSubtask(taskId, subtaskId) {
    const normalizedSubtaskId = Number(subtaskId);
    if (editingSubtaskByTask.get(taskId) === normalizedSubtaskId) editingSubtaskByTask.delete(taskId);
    else editingSubtaskByTask.set(taskId, normalizedSubtaskId);
    renderTasks();
  }

  function saveEditedSubtask(taskId, subtaskId) {
    const task = tasks.find(item => Number(item.id) === taskId);
    const subtask = task?.subtasks?.find(item => Number(item.id) === Number(subtaskId));
    const titleEn = $(`task-subtask-edit-en-${taskId}-${subtaskId}`)?.value.trim();
    const titleFr = $(`task-subtask-edit-fr-${taskId}-${subtaskId}`)?.value.trim();
    if (!subtask) return;
    if (!titleEn || !titleFr) {
      const error = $(`task-subtask-edit-error-${taskId}-${subtaskId}`);
      if (error) {
        error.textContent = translations[currentLang].subtaskTranslationRequired;
        error.hidden = false;
      }
      (!titleEn ? $(`task-subtask-edit-en-${taskId}-${subtaskId}`) : $(`task-subtask-edit-fr-${taskId}-${subtaskId}`))?.focus();
      return;
    }
    subtask.title = titleEn;
    subtask.titleTranslations = { en: titleEn, fr: titleFr };
    editingSubtaskByTask.delete(taskId);
    saveTasks();
    renderTasks();
  }

  function deleteSubtask(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    task.subtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
    saveTasks();
    renderTasks();
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
    const trashedAt = new Date().toISOString();
    tasks.forEach(task => {
      if (!task.deletedAt && (task.status || (task.completed ? "done" : "backlog")) === "done") task.deletedAt = trashedAt;
    });
    saveTasks();
    renderTasks();
  }

  function taskAssigneeIds(task) {
    const ids = Array.isArray(task.assignees) ? task.assignees : (task.assignee ? [task.assignee] : []);
    return [...new Set(ids.filter(id => ["issam", "jawher", "nasim", "mohamed"].includes(id)))];
  }

  function localizedTaskField(item, field) {
    const value = item?.[`${field}Translations`]?.[currentLang];
    if (typeof value === "string" && value.trim()) return value;
    const legacy = item?.[field];
    if (typeof legacy === "string" && legacy.trim()) return legacy;
    const fallback = item?.[`${field}Translations`]?.en || item?.[`${field}Translations`]?.fr;
    return typeof fallback === "string" ? fallback : "";
  }

  function setTaskAssignees(taskId) {
    const task = tasks.find(item => Number(item.id) === taskId);
    const editor = $(`task-assignee-editor-${taskId}`);
    if (!task || !editor) return;
    task.assignees = [...editor.querySelectorAll(".task-assignee-edit-checkbox:checked")].map(input => input.value);
    delete task.assignee;
    saveTasks();
    renderTasks();
  }

  function updateTaskViewSwitcher() {
    const activeTasks = tasks.filter(task => !task.deletedAt);
    const trashedTasks = tasks.filter(task => task.deletedAt);
    const pendingCount = activeTasks.filter(hasPendingResponse).length;
    const count = $("needsResponseCount");
    const totalCount = $("allTasksCount");
    const trashCount = $("trashTasksCount");
    const t = translations[currentLang];
    if ($("taskViewAllLabel")) $("taskViewAllLabel").textContent = t.taskViewAll;
    if ($("taskViewNeedsResponseLabel")) $("taskViewNeedsResponseLabel").textContent = t.taskViewNeedsResponse;
    if ($("taskViewTrashLabel")) $("taskViewTrashLabel").textContent = t.taskViewTrash;
    if ($("taskViewSwitcher")) $("taskViewSwitcher").setAttribute("aria-label", t.taskViewsAria);
    if (count) count.textContent = pendingCount;
    if (totalCount) totalCount.textContent = activeTasks.length;
    if (trashCount) trashCount.textContent = trashedTasks.length;
    if ($("clearCompleted")) $("clearCompleted").hidden = activeTaskView === "trash";
    document.querySelectorAll("[data-task-view]").forEach(button => {
      const selected = button.dataset.taskView === activeTaskView;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function renderTasks() {
    const container = $("taskList");
    updateTaskViewSwitcher();
    const t = translations[currentLang];
    const titleQuery = $("taskSearch").value.trim().toLocaleLowerCase(currentLang === "fr" ? "fr-FR" : "en-US");
    const priorityFilter = $("taskPriorityFilter").value;
    const assigneeFilter = $("taskAssigneeFilter").value;
    const viewTasks = tasks.filter(task => activeTaskView === "trash" ? Boolean(task.deletedAt) : !task.deletedAt);
    const visibleTasks = viewTasks.filter((task) =>
      (activeTaskView !== "needs-response" || hasPendingResponse(task)) &&
      (priorityFilter === "all" || task.priority === priorityFilter) &&
      (assigneeFilter === "all" || (assigneeFilter === "unassigned" ? taskAssigneeIds(task).length === 0 : taskAssigneeIds(task).includes(assigneeFilter))) &&
      localizedTaskField(task, "title").toLocaleLowerCase(currentLang === "fr" ? "fr-FR" : "en-US").includes(titleQuery)
    );
    if (visibleTasks.length === 0) {
      const hasPendingTasks = tasks.some(task => !task.deletedAt && hasPendingResponse(task));
      const emptyMessage = activeTaskView === "trash" && viewTasks.length === 0 ? t.trashEmpty
        : activeTaskView === "needs-response" && !hasPendingTasks ? t.noTasksNeedResponse
        : viewTasks.length === 0 ? t.noTasks : t.noMatchingTasks;
      container.innerHTML = `<p class="muted">${emptyMessage}</p>`;
      return;
    }
    const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
    const assigneeNames = {
      issam: t.assigneeIssam,
      jawher: t.assigneeJawher,
      nasim: t.assigneeNasim,
      mohamed: t.assigneeMohamed
    };
    const assigneeShortNames = {
      issam: t.teamMemberIssam,
      jawher: t.teamMemberJawher,
      nasim: t.teamMemberNasim,
      mohamed: t.teamMemberMohamed
    };
    const commentAuthorNames = assigneeNames;
    const formatDate = (date) => {
      const parsed = new Date(date);
      return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleString(currentLang === "fr" ? "fr-FR" : "en-US", { dateStyle: "medium", timeStyle: "short" });
    };

    const priorityClass = { urgent: "urgent", next: "next", normal: "normal" };
    const validStatuses = ["backlog", "in-progress", "done"];
    container.innerHTML = visibleTasks.map(task => {
      const taskId = Number(task.id);
      const isExpanded = expandedTaskIds.has(taskId);
      const isTrashed = Boolean(task.deletedAt);
      const status = validStatuses.includes(task.status) ? task.status : (task.completed ? "done" : "backlog");
      const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
      const comments = Array.isArray(task.comments) ? task.comments : [];
      const pendingComments = comments.filter(comment => comment.needsResponse && !comment.resolved).length;
      const assignees = taskAssigneeIds(task).map(id => `<span class="task-assignee-chip">${escapeHTML(assigneeShortNames[id])}</span>`).join("");
      const assignedIds = new Set(taskAssigneeIds(task));
      const assigneeEditor = ["issam", "jawher", "nasim", "mohamed"].map(id => `<label class="task-assignee-option"><input class="task-assignee-edit-checkbox" type="checkbox" value="${id}" ${assignedIds.has(id) ? "checked" : ""} onchange="setTaskAssignees(${taskId})"><span>${escapeHTML(assigneeShortNames[id])}</span></label>`).join("");
      const statusOptions = validStatuses.map(value => `<option value="${value}" ${status === value ? "selected" : ""}>${t[`taskStatus_${value.replace(/-/g, "_")}`]}</option>`).join("");
      const subtaskMarkup = subtasks.length ? subtasks.map(st => {
        const subtaskId = Number(st.id);
        const isEditingSubtask = editingSubtaskByTask.get(taskId) === subtaskId;
        if (isEditingSubtask) return `<li class="subtask-item subtask-edit-item"><div class="subtask-edit-fields"><div class="task-bilingual-pair subtask-edit-pair"><div class="task-form-group"><label class="task-form-label" for="task-subtask-edit-en-${taskId}-${subtaskId}">${t.subtaskTitleEnglishLabel}</label><input class="task-form-input" id="task-subtask-edit-en-${taskId}-${subtaskId}" value="${escapeHTML(st.titleTranslations?.en || st.title || "")}" /></div><div class="task-form-group"><label class="task-form-label" for="task-subtask-edit-fr-${taskId}-${subtaskId}">${t.subtaskTitleFrenchLabel}</label><input class="task-form-input" id="task-subtask-edit-fr-${taskId}-${subtaskId}" value="${escapeHTML(st.titleTranslations?.fr || "")}" /></div></div><small class="field-help task-bilingual-error" id="task-subtask-edit-error-${taskId}-${subtaskId}" role="alert" hidden></small><div class="subtask-add-actions"><button class="btn task-small-button" type="button" onclick="editSubtask(${taskId}, ${subtaskId})">${t.cancelSubtask}</button><button class="btn primary task-small-button" type="button" onclick="saveEditedSubtask(${taskId}, ${subtaskId})">${t.saveSubtask}</button></div></div></li>`;
        return `<li class="subtask-item ${st.completed ? "is-done" : ""}"><label class="subtask-check-row"><input type="checkbox" ${st.completed ? "checked" : ""} onchange="toggleSubtask(${taskId}, ${subtaskId})"><span>${escapeHTML(localizedTaskField(st, "title"))}</span></label><div class="subtask-actions"><button class="btn task-small-button" type="button" onclick="editSubtask(${taskId}, ${subtaskId})">${t.editSubtask}</button><button class="btn task-small-button danger" type="button" onclick="deleteSubtask(${taskId}, ${subtaskId})">${t.deleteSubtask}</button></div></li>`;
      }).join("") : `<li class="subtask-empty">${t.noSubtasks}</li>`;
      const commentMarkup = comments.length ? comments.map(comment => {
        const commentId = Number(comment.id);
        const replies = Array.isArray(comment.replies) ? comment.replies : [];
        const isReplying = replyComposerByTask.get(taskId) === commentId;
        return `<li class="task-comment ${comment.needsResponse && !comment.resolved ? "needs-response" : ""}">
          <div class="task-comment-header"><strong>${escapeHTML(commentAuthorNames[comment.author] || comment.author || t.assigneeFormer)}</strong><time>${escapeHTML(formatDate(comment.createdAt))}</time></div>
          <div class="task-comment-badges">${comment.needsResponse ? `<span class="comment-type-badge response">${comment.resolved ? t.commentResponded : t.responseNeeded}</span>` : `<span class="comment-type-badge">${t.commentNoResponseNeeded}</span>`}</div>
          <p class="task-comment-body">${escapeHTML(comment.body || "")}</p>
          ${replies.length ? `<ol class="task-comment-replies">${replies.map(reply => `<li><div class="task-comment-header"><strong>${escapeHTML(commentAuthorNames[reply.author] || reply.author || t.assigneeFormer)}</strong><time>${escapeHTML(formatDate(reply.createdAt))}</time></div><p class="task-comment-body">${escapeHTML(reply.body || "")}</p><div class="task-comment-actions"><button class="btn task-small-button danger" type="button" onclick="deleteTaskReply(${taskId}, ${commentId}, ${Number(reply.id)})">${t.deleteReply}</button></div></li>`).join("")}</ol>` : ""}
          <div class="task-comment-actions"><button class="btn task-small-button" type="button" onclick="toggleReplyComposer(${taskId}, ${commentId})">${isReplying ? t.cancelReply : t.replyToComment}</button>${comment.needsResponse && !comment.resolved ? `<button class="btn task-small-button response-done-button" type="button" onclick="markCommentResponded(${taskId}, ${commentId})">${t.markCommentResponded}</button>` : ""}<button class="btn task-small-button danger" type="button" onclick="deleteTaskComment(${taskId}, ${commentId})">${t.deleteComment}</button></div>
          ${isReplying ? `<div class="task-reply-composer"><label class="task-form-label" for="task-reply-draft-${taskId}-${commentId}">${t.replyToComment}</label><textarea class="task-form-input" id="task-reply-draft-${taskId}-${commentId}" rows="2" placeholder="${t.replyPlaceholder}"></textarea><button class="btn primary task-small-button" type="button" onclick="addTaskReply(${taskId}, ${commentId})">${t.postReply}</button></div>` : ""}
        </li>`;
      }).join("") : `<li class="task-comment-empty">${t.noTaskComments}</li>`;
      const authorOptions = ["issam", "jawher", "nasim", "mohamed"].map(id => `<option value="${id}">${escapeHTML(commentAuthorNames[id])}</option>`).join("");
      const subtaskFormMarkup = openSubtaskFormTaskIds.has(taskId) ? `<div class="subtask-add-form"><div class="task-bilingual-pair"><div class="task-form-group"><label class="task-form-label" for="task-subtask-en-${taskId}">${t.subtaskTitleEnglishLabel}</label><input class="task-form-input" id="task-subtask-en-${taskId}" placeholder="${t.subtaskTitleEnglishPlaceholder}" /></div><div class="task-form-group"><label class="task-form-label" for="task-subtask-fr-${taskId}">${t.subtaskTitleFrenchLabel}</label><input class="task-form-input" id="task-subtask-fr-${taskId}" placeholder="${t.subtaskTitleFrenchPlaceholder}" /></div></div><small class="field-help task-bilingual-error" id="task-subtask-error-${taskId}" role="alert" hidden></small><div class="subtask-add-actions"><button class="btn task-small-button" type="button" onclick="toggleSubtaskForm(${taskId})">${t.cancelSubtask}</button><button class="btn primary task-small-button" type="button" onclick="addSubtask(${taskId})">${t.saveSubtask}</button></div></div>` : "";
      return `
        <article class="task-card task-card-${status}">
          <header class="task-card-header">
            <div class="task-card-main">
              <div class="task-card-badges"><span class="task-status-badge status-${status}">${t[`taskStatus_${status.replace(/-/g, "_")}`]}</span><span class="task-priority-badge priority-${escapeHTML(priorityClass[task.priority] || "normal")}">${t[task.priority] || escapeHTML(task.priority)}</span>${pendingComments ? `<span class="task-attention-badge">${t.responseNeeded} · ${pendingComments}</span>` : ""}</div>
          <h3 class="task-card-title">${escapeHTML(localizedTaskField(task, "title"))}</h3>
              <div class="task-assignee-chips">${assignees || `<span class="muted">${t.unassigned}</span>`}<span class="task-subtask-count">${subtasks.length} ${t.subtasksLabel.toLocaleLowerCase(currentLang === "fr" ? "fr-FR" : "en-US")}</span></div>
            </div>
            <div class="task-card-controls"><label class="task-status-control"><span>${t.taskStatusLabel}</span><select class="task-form-input task-status-select" aria-label="${t.taskStatusLabel}" onchange="setTaskStatus(${taskId}, this.value)">${statusOptions}</select></label><button class="btn task-small-button task-expand-button" type="button" aria-expanded="${isExpanded}" aria-controls="task-details-${taskId}" onclick="toggleTaskDetails(${taskId})">${isExpanded ? t.collapseTask : t.expandTask}</button></div>
          </header>
          <div class="task-details" id="task-details-${taskId}" ${isExpanded ? "" : "hidden"}>
            ${localizedTaskField(task, "notes") ? `<p class="task-card-notes">${escapeHTML(localizedTaskField(task, "notes"))}</p>` : ""}
            <div class="task-card-meta">${t.createdLabel} ${escapeHTML(new Date(task.createdAt).toLocaleDateString())}</div>
            <section class="task-assignee-editor-section"><div class="task-assignee-editor-heading"><h4>${t.taskAssigneeEditorTitle}</h4></div><div class="task-assignee-editor" id="task-assignee-editor-${taskId}">${assigneeEditor}</div></section>
            <section class="subtask-section"><div class="subtask-section-heading"><h4>${t.subtasksLabel} <span>${subtasks.length}</span></h4><button class="btn task-small-button" type="button" onclick="toggleSubtaskForm(${taskId})">${openSubtaskFormTaskIds.has(taskId) ? t.cancelSubtask : t.addSubtask}</button></div><ul class="subtask-list">${subtaskMarkup}</ul>${subtaskFormMarkup}</section>
            <section class="task-comments"><div class="task-comments-heading"><h4>${t.taskComments} <span>${comments.length}</span></h4>${pendingComments ? `<span class="task-attention-badge">${t.needsAttention} · ${pendingComments}</span>` : ""}</div><ul class="task-comment-list">${commentMarkup}</ul><div class="task-comment-composer"><label class="task-form-label" for="task-comment-draft-${taskId}">${t.addComment}</label><textarea class="task-form-input" id="task-comment-draft-${taskId}" rows="3" placeholder="${t.commentPlaceholder}"></textarea><div class="task-comment-controls"><label class="task-comment-author"><span class="task-form-label">${t.commentAs}</span><select class="task-form-input" id="task-comment-author-${taskId}">${authorOptions}</select></label><label class="task-comment-type"><span class="task-form-label">${t.commentType}</span><select class="task-form-input" id="task-comment-type-${taskId}"><option value="note">${t.commentNoResponseNeeded}</option><option value="response">${t.commentNeedsResponse}</option></select></label><button class="btn primary task-small-button" type="button" onclick="addTaskComment(${taskId})">${t.postComment}</button></div></div></section>
            <footer class="task-card-footer"><span>${t[task.priority] || escapeHTML(task.priority)}</span>${isTrashed ? `<div class="task-toolbar-actions"><button class="btn task-small-button" type="button" onclick="restoreTask(${taskId})">${t.restoreTask}</button><button class="btn task-small-button danger" type="button" onclick="permanentlyDeleteTask(${taskId})">${t.deleteTaskPermanently}</button></div>` : `<button class="btn task-small-button danger" type="button" onclick="deleteTask(${taskId})">${t.moveToTrash}</button>`}</footer>
          </div>
        </article>`;
    }).join("");
  }

  function closeTaskForm() {
    const panel = $("taskFormPanel");
    if (panel) panel.hidden = true;
    if ($("taskTitleEn")) $("taskTitleEn").value = "";
    if ($("taskTitleFr")) $("taskTitleFr").value = "";
    if ($("taskNotesEn")) $("taskNotesEn").value = "";
    if ($("taskNotesFr")) $("taskNotesFr").value = "";
    if ($("taskTitleError")) $("taskTitleError").hidden = true;
    if ($("taskDescriptionError")) $("taskDescriptionError").hidden = true;
    document.querySelectorAll(".task-assignee-checkbox").forEach(input => { input.checked = false; });
    const assigneeError = $("taskAssigneeError");
    if (assigneeError) assigneeError.hidden = true;
    const showButton = $("newTaskButton");
    if (showButton) showButton.hidden = false;
  }

  function openTaskForm() {
    const panel = $("taskFormPanel");
    if (panel) panel.hidden = false;
    const showButton = $("newTaskButton");
    if (showButton) showButton.hidden = true;
    $("taskTitleEn").focus();
  }

  // Make task functions globally accessible
  window.toggleTask = toggleTask;
  window.setTaskStatus = setTaskStatus;
  window.setTaskAssignees = setTaskAssignees;
  window.toggleTaskDetails = toggleTaskDetails;
  window.addTaskComment = addTaskComment;
  window.toggleReplyComposer = toggleReplyComposer;
  window.addTaskReply = addTaskReply;
  window.markCommentResponded = markCommentResponded;
  window.deleteTaskComment = deleteTaskComment;
  window.deleteTaskReply = deleteTaskReply;
  window.setTaskView = setTaskView;
  window.deleteTask = deleteTask;
  window.restoreTask = restoreTask;
  window.permanentlyDeleteTask = permanentlyDeleteTask;
  window.addSubtask = addSubtask;
  window.toggleSubtaskForm = toggleSubtaskForm;
  window.saveEditedSubtask = saveEditedSubtask;
  window.editSubtask = editSubtask;
  window.deleteSubtask = deleteSubtask;
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
        pipeline: $("pipeline").value,
        activeClients: $("activeClients").value, outreachCount: $("outreachCount").value,
        demosCount: $("demosCount").value, overdueBills: $("overdueBills").value, scorecardDate: $("scorecardDate").value
      },
      cashBridge: Object.fromEntries(["bridgeCash", "bridgeRestore", "bridgeArrears", "bridgeBills", "bridgeReceipts", "bridgeDate"].map(id => [id, $(id).value])),
      executionChecks: [...document.querySelectorAll("#execution-plan .task input[type=checkbox]")].map(input => input.checked),
      config: {
        server: $("configServer").value,
        email: $("configEmail").value,
        domain: $("configDomain").value,
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
          if (data.calculator.fee !== undefined) $("fee").value = data.calculator.fee;
          if (data.calculator.orders !== undefined) $("orders").value = data.calculator.orders;
          if (data.calculator.cost !== undefined) $("cost").value = data.calculator.cost;
          if (data.calculator.clients !== undefined) $("clients").value = data.calculator.clients;
          if (data.calculator.target !== undefined) $("target").value = data.calculator.target;
          if (data.calculator.manualRevenue !== undefined) $("manualRevenue").value = data.calculator.manualRevenue;
        }

        // Load scorecard data
        if (data.scorecard) {
          if (data.scorecard.cashOnHand !== undefined) $("cashOnHand").value = data.scorecard.cashOnHand;
          if (data.scorecard.collected !== undefined) $("collected").value = data.scorecard.collected;
          if (data.scorecard.invoiced !== undefined) $("invoiced").value = data.scorecard.invoiced;
          if (data.scorecard.pipeline !== undefined) $("pipeline").value = data.scorecard.pipeline;
          ["activeClients", "outreachCount", "demosCount", "overdueBills", "scorecardDate"].forEach(id => { if (data.scorecard[id] !== undefined) $(id).value = data.scorecard[id]; });
        }
        if (data.cashBridge) Object.entries(data.cashBridge).forEach(([id, value]) => { if ($(id) && value !== undefined) $(id).value = value; });
        if (Array.isArray(data.executionChecks)) document.querySelectorAll("#execution-plan .task input[type=checkbox]").forEach((input, i) => { input.checked = Boolean(data.executionChecks[i]); });

        // Load config data
        if (data.config) {
          if (data.config.server) $("configServer").value = data.config.server;
          if (data.config.email !== undefined) $("configEmail").value = data.config.email;
          if (data.config.domain !== undefined) $("configDomain").value = data.config.domain;
          if (data.config.tax) $("configTax").value = data.config.tax;
          if (data.config.premises) $("configPremises").value = data.config.premises;
          if (data.config.vatRate !== undefined) $("configVatRate").value = data.config.vatRate;
          if (data.config.returnedFee !== undefined) $("configReturnedFee").value = data.config.returnedFee;
          if (data.config.exchangeFee !== undefined) $("configExchangeFee").value = data.config.exchangeFee;
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
        updateCashBridge();
        updateFinancialsFromConfig();
        saveToStorage();

        alert(translations[currentLang].importSuccess);
      } catch (error) {
        alert(translations[currentLang].importError + error.message);
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

    // Update sidebar
    document.querySelector('.brand').textContent = t.brand;
    document.querySelector('.brand-sub').textContent = t.brandSub;
    document.querySelector('.nav-label').textContent = t.navLabel;

    // Update navigation
    document.documentElement.lang = lang;
    document.querySelectorAll('#sideNav a').forEach((link) => {
    const keys = { overview: 'overview', financials: 'financials', 'cash-bridge': 'cashBridgeNav', calculator: 'calculator', pricing: 'pricing', execution: 'execution', 'execution-plan': 'executionPlan', sales: 'sales', operations: 'operations', legal: 'legal', governance: 'governance', scorecard: 'scorecard', tasks: 'tasks', sources: 'sources', config: 'config' };
      const id = link.getAttribute('href')?.slice(1);
      if (keys[id]) link.textContent = t[keys[id]];
    });

    // Update hero section
    const heroEyebrow = document.querySelector('#overview .eyebrow');
    const heroTitle = document.querySelector('#overview h1');
    const heroDesc = document.querySelector('#overview p');
    if (heroEyebrow) heroEyebrow.textContent = t.eyebrow;
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
    if ($("resetCalc")) $("resetCalc").textContent = t.resetCalc;
    if ($("resetBridge")) $("resetBridge").textContent = t.resetBridge;
    if ($("resetScorecard")) $("resetScorecard").textContent = t.resetScorecard;
    if ($("resetExecution")) $("resetExecution").textContent = t.resetExecution;

    // Update process flow
    const processTitle = document.getElementById('processFlowTitle');
    if (processTitle) processTitle.textContent = t.processFlowTitle;
    const processDescription = document.getElementById('processFlowDescription');
    if (processDescription) processDescription.textContent = t.processFlowDescription;

    const stepKeys = ['step1Title', 'step2Title', 'step3Title', 'step4Title', 'step5Title', 'step6Title', 'step7Title', 'step8Title', 'step9Title', 'step10Title'];
    const stepDescKeys = ['step1Desc', 'step2Desc', 'step3Desc', 'step4Desc', 'step5Desc', 'step6Desc', 'step7Desc', 'step8Desc', 'step9Desc', 'step10Desc'];

    stepKeys.forEach((key, i) => {
      const title = document.getElementById(`flowStep${i + 1}Title`);
      const desc = document.getElementById(`flowStep${i + 1}Desc`);
      if (title) title.textContent = t[key];
      if (desc) desc.textContent = t[stepDescKeys[i]];
    });
    const lifecycleTitle = document.getElementById('processFlowTitle');
    if (lifecycleTitle) lifecycleTitle.textContent = t.processFlowTitle;

    const processCallout = document.querySelector('#overview ~ .card .callout');
    if (processCallout) {
      const strong = processCallout.querySelector('strong');
      const ul = processCallout.querySelector('ul');
      if (strong) strong.textContent = t.keyPoints;
      if (ul) {
        const lis = ul.querySelectorAll('li');
        if (lis[0]) lis[0].textContent = t.keyPoint1;
        if (lis[1]) lis[1].textContent = t.keyPoint2;
        if (lis[2]) lis[2].textContent = t.keyPoint3;
        if (lis[3]) lis[3].textContent = t.keyPoint4;
        if (lis[4]) lis[4].textContent = t.keyPoint5;
      }
    }

    // Update section headers
    const sections = [
      { id: 'financials', key: 'financialTitle', descKey: 'financialDesc' },
      { id: 'cash-bridge', key: 'cashBridgeTitle', descKey: 'cashBridgeDesc' },
      { id: 'calculator', key: 'calcTitle', descKey: 'calcDesc' },
      { id: 'config', key: 'configTitle', descKey: 'configDesc' },
      { id: 'pricing', key: 'pricingTitle', descKey: 'pricingDesc' },
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

    const bridgeText = {
      cashBridgeTitle: 'cashBridgeTitle', cashBridgeDesc: 'cashBridgeDesc', bridgeCashLabel: 'bridgeCashLabel',
      bridgeRestoreLabel: 'bridgeRestoreLabel', bridgeArrearsLabel: 'bridgeArrearsLabel', bridgeBillsLabel: 'bridgeBillsLabel',
      bridgeReceiptsLabel: 'bridgeReceiptsLabel', bridgeDateLabel: 'bridgeDateLabel', bridgeRequiredLabel: 'bridgeRequiredLabel',
      bridgeAvailableLabel: 'bridgeAvailableLabel', bridgeGapLabel: 'bridgeGapLabel', bridgeDecision: 'bridgeDecision', bridgeAssumptionNote: 'bridgeAssumptionNote'
    };
    Object.entries(bridgeText).forEach(([id, key]) => { if ($(id) && t[key]) $(id).textContent = t[key]; });
    ["bridgeCashHelp", "bridgeRestoreHelp", "bridgeArrearsHelp", "bridgeBillsHelp", "bridgeReceiptsHelp", "bridgeDateHelp", "bridgeFormulaTitle", "bridgeFormulaRequired", "bridgeFormulaAvailable", "bridgeFormulaGap"].forEach((id) => {
      if ($(id) && t[id]) $(id).textContent = t[id];
    });
    const bridgePlaceholders = ['bridgeCashPlaceholder', 'bridgeRestorePlaceholder', 'bridgeArrearsPlaceholder', 'bridgeBillsPlaceholder', 'bridgeReceiptsPlaceholder'];
    ['bridgeCash', 'bridgeRestore', 'bridgeArrears', 'bridgeBills', 'bridgeReceipts'].forEach((id, i) => { if ($(id)) $(id).placeholder = t[bridgePlaceholders[i]]; });
    if ($('historyWarning')) $('historyWarning').textContent = t.historyWarning;
    const navLabel = document.querySelector('.nav-label');
    if (navLabel) navLabel.textContent = t.navLabel;
    const navBrand = document.querySelector('.brand');
    if (navBrand) navBrand.textContent = t.brand;
    const navSub = document.querySelector('.brand-sub');
    if (navSub) navSub.textContent = t.brandSub;

    // Update financials labels
    const finLabels = document.querySelectorAll('#financials .metric-label');
    const finLabelKeys = ['server', 'email', 'domain', 'taxes', 'premises', 'knownTotal'];
    finLabels.forEach((label, i) => {
      if (finLabelKeys[i]) label.textContent = t[finLabelKeys[i]];
    });

    const finTiny = document.querySelectorAll('#financials .tiny');
    if (finTiny[0]) finTiny[0].textContent = t.serverBasis;
    if (finTiny[1]) finTiny[1].textContent = t.emailBasis;
    if (finTiny[2]) finTiny[2].textContent = t.domainBasis;
    if (finTiny[3]) finTiny[3].textContent = t.taxBasis;
    if (finTiny[4]) finTiny[4].textContent = t.premisesBasis;
    if (finTiny[5]) finTiny[5].textContent = t.excludes;

    const finH3 = document.querySelectorAll('#financials h3');
    if (finH3[0]) finH3[0].textContent = t.costComposition;
    const finChartCaption = document.getElementById('costChartCaption');
    if (finChartCaption) finChartCaption.textContent = t.costChartCaption;
    if (finH3[1]) finH3[1].textContent = t.currentPosition;

    const barSpans = document.querySelectorAll('#financials .barrow span');
    if (barSpans[0]) barSpans[0].textContent = t.revenue;
    if (barSpans[1]) barSpans[1].textContent = t.lowCost;
    if (barSpans[2]) barSpans[2].textContent = t.highCost;


    const finSubH3 = document.querySelector('#financials .subsection h3');
    if (finSubH3) finSubH3.textContent = t.costFormulas;

    const finFormulas = document.querySelectorAll('#financials .formula');
    ["costFormula1", "costFormula2", "costFormula3", "costFormula4", "costFormula5"].forEach((key, i) => { if (finFormulas[i]) finFormulas[i].textContent = t[key]; });

    const finWarning = document.querySelector('#financials .callout.warning');
    if (finWarning) finWarning.textContent = t.taxWarning;

    // Update calculator labels
    const calcControls = document.querySelectorAll('#calculator .control label');
    const calcKeys = ['feeLabel', 'ordersLabel', 'costLabel', 'clientsLabel', 'targetLabel', 'manualLabel'];
    calcControls.forEach((label, i) => {
      if (calcKeys[i]) {
        label.childNodes[0].textContent = t[calcKeys[i]];
      }
    });
    ["feeHelp", "ordersHelp", "costHelp", "clientsHelp", "targetHelp", "manualRevenueHelp"].forEach((id) => {
      const help = document.getElementById(id);
      if (help) help.textContent = t[id];
    });

    const calcManual = document.getElementById('manualRevenue');
    if (calcManual) calcManual.placeholder = t.manualPlaceholder;

    const calcResults = document.querySelectorAll('#calculator .result .metric-label');
    const resultKeys = ['revPerClient', 'breakeven', 'targetClients', 'monthlyResult'];
    calcResults.forEach((label, i) => {
      if (resultKeys[i]) label.textContent = t[resultKeys[i]];
    });

    const calcSubH3 = document.querySelectorAll('#calculator .subsection h3');
    if (calcSubH3[0]) calcSubH3[0].textContent = t.scenarioChart;
    if (calcSubH3[1]) calcSubH3[1].textContent = t.formulae;

    const calcFormulas = document.querySelectorAll('#calculator .formula');
    if (calcFormulas[0]) calcFormulas[0].textContent = t.formula1;
    if (calcFormulas[1]) calcFormulas[1].textContent = t.formula2;
    if (calcFormulas[2]) calcFormulas[2].textContent = t.formula3;
    if (calcFormulas[3]) calcFormulas[3].textContent = t.formula4;

    const calcGood = document.querySelector('#calculator .callout.good');
    if (calcGood) calcGood.textContent = t.defaultExample;

    // Update config labels
    const configLabels = document.querySelectorAll('#config .control label');
    const configKeys = ['serverCost', 'emailCost', 'domainCost', 'monthlyTax', 'premisesCost', 'vatRate', 'returnedFee', 'exchangeFee'];
    configLabels.forEach((label, i) => {
      if (configKeys[i]) label.textContent = t[configKeys[i]];
    });

    const configButtons = document.querySelectorAll('#config .btn');
    if (configButtons[0]) configButtons[0].textContent = t.saveConfig;
    if (configButtons[1]) configButtons[1].textContent = t.resetConfig;

    const configSaved = document.getElementById('configSaved');
    if (configSaved) {
      const strong = configSaved.querySelector('strong');
      if (strong) strong.textContent = t.configSaved;
    }

    const configHelp = document.getElementById("configHelp");
    if (configHelp) configHelp.textContent = t.configDesc;
    ["configServerHelp", "configEmailHelp", "configDomainHelp", "configTaxHelp", "configPremisesHelp", "configVatRateHelp", "configReturnedFeeHelp", "configExchangeFeeHelp"].forEach((id) => {
      const help = document.getElementById(id);
      if (help) help.textContent = t[id];
    });

    // Update pricing
    const pricingH3 = document.querySelectorAll('#pricing h3');
    if (pricingH3[0]) pricingH3[0].textContent = t.commercialRule;
    if (pricingH3[1]) pricingH3[1].textContent = t.validateBefore;

    const pricingUL1 = document.querySelectorAll('#pricing ul');
    if (pricingUL1[0]) {
      const lis = pricingUL1[0].querySelectorAll('li');
      if (lis[0]) lis[0].textContent = t.commercialRule1;
      if (lis[1]) lis[1].textContent = t.commercialRule2;
      if (lis[2]) lis[2].textContent = t.commercialRule3;
      if (lis[3]) lis[3].textContent = t.commercialRule4;
    }
    if (pricingUL1[1]) {
      const lis = pricingUL1[1].querySelectorAll('li');
      if (lis[0]) lis[0].textContent = t.validate1;
      if (lis[1]) lis[1].textContent = t.validate2;
      if (lis[2]) lis[2].textContent = t.validate3;
      if (lis[3]) lis[3].textContent = t.validate4;
    }

    const pricingWarning = document.querySelector('#pricing .callout.warning');
    if (pricingWarning) pricingWarning.textContent = t.pricingWarning;

    // Update team
    const teamLabels = document.querySelectorAll('#execution .metric-label');
    const teamLabelKeys = ['ceo', 'commercial', 'qa', 'flexibleSupport'];
    teamLabels.forEach((label, i) => {
      if (teamLabelKeys[i]) label.textContent = t[teamLabelKeys[i]];
    });

    const teamH3 = document.querySelectorAll('#execution h3');
    if (teamH3[0]) teamH3[0].textContent = t.ceoName;
    if (teamH3[1]) teamH3[1].textContent = t.jawherName;
    if (teamH3[2]) teamH3[2].textContent = t.qaName;
    if (teamH3[3]) teamH3[3].textContent = t.operationsName;

    const teamP = document.querySelectorAll('#execution .card p');
    if (teamP[0]) teamP[0].textContent = t.ceoDesc;
    if (teamP[1]) teamP[1].textContent = t.jawherDesc;
    if (teamP[2]) teamP[2].textContent = t.qaDesc;
    if (teamP[3]) teamP[3].textContent = t.operationsDesc;

    const teamCallout = document.querySelector('#execution .callout');
    if (teamCallout) teamCallout.innerHTML = `<strong>${t.delegation}</strong> ${t.delegationDesc}`;

    // Update execution plan tasks
    const executionTasks = document.querySelectorAll('#execution-plan .task strong');
    const taskKeys = ['task1', 'task2', 'task3', 'task4', 'task5', 'task6', 'task7', 'task8', 'task9'];
    executionTasks.forEach((strong, i) => {
      if (taskKeys[i]) strong.textContent = t[taskKeys[i]];
    });

    const executionTaskPs = document.querySelectorAll('#execution-plan .task p');
    const taskDescKeys = ['task1Desc', 'task2Desc', 'task3Desc', 'task4Desc', 'task5Desc', 'task6Desc', 'task7Desc', 'task8Desc', 'task9Desc'];
    executionTaskPs.forEach((p, i) => {
      if (taskDescKeys[i]) p.textContent = t[taskDescKeys[i]];
    });

    // Update sales
    const salesCardLabels = document.querySelectorAll('#sales .metric-label');
    const salesLabelKeys = ['priority1', 'priority2', 'priority3'];
    salesCardLabels.forEach((label, i) => {
      if (salesLabelKeys[i]) label.textContent = t[salesLabelKeys[i]];
    });

    const salesCardH3 = document.querySelectorAll('#sales h3');
    if (salesCardH3[0]) salesCardH3[0].textContent = t.activeRetention;
    if (salesCardH3[1]) salesCardH3[1].textContent = t.intigoReferrals;
    if (salesCardH3[2]) salesCardH3[2].textContent = t.merchantReferrals;
    if (salesCardH3[3]) salesCardH3[3].textContent = t.weeklyRoutine;

    const salesCardP = document.querySelectorAll('#sales .card p');
    if (salesCardP[0]) salesCardP[0].textContent = t.activeRetentionDesc;
    if (salesCardP[1]) salesCardP[1].textContent = t.intigoReferralsDesc;
    if (salesCardP[2]) salesCardP[2].textContent = t.merchantReferralsDesc;

    const salesTh = document.querySelectorAll('#sales th');
    if (salesTh[0]) salesTh[0].textContent = t.activity;
    if (salesTh[1]) salesTh[1].textContent = t.time;
    if (salesTh[2]) salesTh[2].textContent = t.output;

    const salesTd = document.querySelectorAll('#sales td');
    if (salesTd[0]) salesTd[0].textContent = t.prospecting;
    if (salesTd[1]) salesTd[1].textContent = t.demo;
    if (salesTd[2]) salesTd[2].textContent = t.cashReview;
    if (salesTd[3]) salesTd[3].textContent = t.outreachTarget;
    if (salesTd[4]) salesTd[4].textContent = t.scheduledSession;
    if (salesTd[5]) salesTd[5].textContent = t.updatedScorecard;

    const salesCallout = document.querySelector('#sales .callout');
    if (salesCallout) salesCallout.textContent = t.pitchFirst;

    // Update operations
    const opsMetricLabels = document.querySelectorAll('#operations .metric-label');
    if (opsMetricLabels[0]) opsMetricLabels[0].textContent = t.step1;
    if (opsMetricLabels[1]) opsMetricLabels[1].textContent = t.step2;
    if (opsMetricLabels[2]) opsMetricLabels[2].textContent = t.step3;

    const opsH3 = document.querySelectorAll('#operations h3');
    if (opsH3[0]) opsH3[0].textContent = t.deliveryPartner;
    if (opsH3[1]) opsH3[1].textContent = t.wolvoMeasures;
    if (opsH3[2]) opsH3[2].textContent = t.wolvoInvoice;
    if (opsH3[3]) opsH3[3].textContent = t.minBilling;

    const opsP = document.querySelectorAll('#operations .card p');
    if (opsP[0]) opsP[0].textContent = t.deliveryPartnerDesc;
    if (opsP[1]) opsP[1].textContent = t.wolvoMeasuresDesc;
    if (opsP[2]) opsP[2].textContent = t.wolvoInvoiceDesc;

    const opsUL = document.querySelector('#operations .subsection ul');
    if (opsUL) {
      const lis = opsUL.querySelectorAll('li');
      if (lis[0]) lis[0].textContent = t.minBilling1;
      if (lis[1]) lis[1].textContent = t.minBilling2;
      if (lis[2]) lis[2].textContent = t.minBilling3;
      if (lis[3]) lis[3].textContent = t.minBilling4;
      if (lis[4]) lis[4].textContent = t.minBilling5;
    }

    const opsWarning = document.querySelector('#operations .callout.warning');
    if (opsWarning) opsWarning.textContent = t.operationsWarning;

    // Update legal
    const legalSubH3 = document.querySelectorAll('#legal .subsection h3');
    if (legalSubH3[0]) legalSubH3[0].textContent = t.invoicingTax;
    if (legalSubH3[1]) legalSubH3[1].textContent = t.companyBank;
    if (legalSubH3[2]) legalSubH3[2].textContent = t.recordsPrepare;

    const legalULs = document.querySelectorAll('#legal .subsection ul');
    if (legalULs[0]) {
      const lis = legalULs[0].querySelectorAll('li');
      if (lis[0]) lis[0].textContent = t.invoicingTax1;
      if (lis[1]) lis[1].textContent = t.invoicingTax2;
      if (lis[2]) lis[2].textContent = t.invoicingTax3;
      if (lis[3]) lis[3].textContent = t.invoicingTax4;
      if (lis[4]) lis[4].textContent = t.invoicingTax5;
    }
    if (legalULs[1]) {
      const lis = legalULs[1].querySelectorAll('li');
      if (lis[0]) lis[0].textContent = t.companyBank1;
      if (lis[1]) lis[1].textContent = t.companyBank2;
      if (lis[2]) lis[2].textContent = t.companyBank3;
    }
    if (legalULs[2]) {
      const lis = legalULs[2].querySelectorAll('li');
      if (lis[0]) lis[0].textContent = t.records1;
      if (lis[1]) lis[1].textContent = t.records2;
      if (lis[2]) lis[2].textContent = t.records3;
      if (lis[3]) lis[3].textContent = t.records4;
    }

    const legalWarning = document.querySelector('#legal .callout.warning');
    if (legalWarning) legalWarning.textContent = t.legalWarning;

    // Update governance
    const govH3 = document.querySelector('#governance h3');
    if (govH3) govH3.textContent = t.actionList;

    const govOL = document.querySelector('#governance ol');
    if (govOL) {
      const lis = govOL.querySelectorAll('li');
      if (lis[0]) lis[0].textContent = t.action1;
      if (lis[1]) lis[1].textContent = t.action2;
      if (lis[2]) lis[2].textContent = t.action3;
      if (lis[3]) lis[3].textContent = t.action4;
      if (lis[4]) lis[4].textContent = t.action5;
    }

    const govWarning = document.querySelector('#governance .callout.warning');
    if (govWarning) govWarning.textContent = t.governanceWarning;

    // Update scorecard
    const scorecardLabels = document.querySelectorAll('#scorecard .control label');
    const scorecardKeys = ['cashAvailable', 'revenueCollected', 'revenueInvoiced', 'qualifiedProspects', 'activeClientsLabel', 'outreachCountLabel', 'demosCountLabel', 'overdueBillsLabel', 'scorecardDateLabel'];
    scorecardLabels.forEach((label, i) => {
      if (scorecardKeys[i]) label.textContent = t[scorecardKeys[i]];
    });
    const scorecardPlaceholders = ['cashAvailablePlaceholder', 'revenueCollectedPlaceholder', 'revenueInvoicedPlaceholder', 'qualifiedProspectsPlaceholder'];
    ['cashOnHand', 'collected', 'invoiced', 'pipeline'].forEach((id, i) => { if ($(id)) $(id).placeholder = t[scorecardPlaceholders[i]]; });
    ["cashOnHandHelp", "collectedHelp", "invoicedHelp", "pipelineHelp", "activeClientsHelp", "outreachCountHelp", "demosCountHelp", "overdueBillsHelp", "scorecardDateHelp"].forEach((id) => {
      const help = document.getElementById(id);
      if (help) help.textContent = t[id];
    });

    const scorecardResultLabels = document.querySelectorAll('#scorecard .result .metric-label');
    const scorecardResultKeys = ['collectionRate', 'monthlyGap', 'runway', 'qualifiedProspects'];
    scorecardResultLabels.forEach((label, i) => {
      if (scorecardResultKeys[i]) label.textContent = t[scorecardResultKeys[i]];
    });

    const scorecardTiny = document.querySelector('#scorecard .tiny');
    if (scorecardTiny) scorecardTiny.textContent = t.runwayDesc;

    // Update task labels
    const taskFormLabels = {
      taskTitleEnglishLabel: "taskTitleEnglishLabel",
      taskTitleFrenchLabel: "taskTitleFrenchLabel",
      taskDescriptionEnglishLabel: "taskDescriptionEnglishLabel",
      taskDescriptionFrenchLabel: "taskDescriptionFrenchLabel",
      taskAssigneeLabel: "assignTo",
      taskPriorityLabel: "priority"
    };
    Object.entries(taskFormLabels).forEach(([id, key]) => { if ($(id)) $(id).textContent = t[key]; });

    const taskAssigneeLabels = document.querySelectorAll('[data-assignee-label]');
    const assigneeLabelKeys = { issam: 'assigneeIssam', jawher: 'assigneeJawher', nasim: 'assigneeNasim', mohamed: 'assigneeMohamed' };
    taskAssigneeLabels.forEach((label) => { label.textContent = t[assigneeLabelKeys[label.dataset.assigneeLabel]]; });

    const taskSelectPriority = document.querySelectorAll('#taskPriority option');
    if (taskSelectPriority[0]) taskSelectPriority[0].textContent = t.urgent;
    if (taskSelectPriority[1]) taskSelectPriority[1].textContent = t.next;
    if (taskSelectPriority[2]) taskSelectPriority[2].textContent = t.normal;

    if ($("taskTitleEn")) $("taskTitleEn").placeholder = t.taskTitleEnglishPlaceholder;
    if ($("taskTitleFr")) $("taskTitleFr").placeholder = t.taskTitleFrenchPlaceholder;
    if ($("taskNotesEn")) $("taskNotesEn").placeholder = t.taskDescriptionEnglishPlaceholder;
    if ($("taskNotesFr")) $("taskNotesFr").placeholder = t.taskDescriptionFrenchPlaceholder;
    if ($("taskTitleError")?.textContent) $("taskTitleError").textContent = t.taskTitleTranslationRequired;
    if ($("taskDescriptionError")?.textContent) $("taskDescriptionError").textContent = t.taskDescriptionTranslationRequired;
    if ($("taskAssigneeError")?.textContent) $("taskAssigneeError").textContent = t.taskAssigneeRequired;
    if ($("taskFormHeading")) $("taskFormHeading").textContent = t.createTask;
    if ($("taskAssigneeHelp")) $("taskAssigneeHelp").textContent = t.taskAssigneeHelp;
    if ($("newTaskButton")) $("newTaskButton").textContent = t.addNewTask;
    if ($("addTask")) $("addTask").textContent = t.addTask;
    if ($("cancelTaskForm")) $("cancelTaskForm").textContent = t.cancelTask;
    if ($("clearCompleted")) $("clearCompleted").textContent = t.clearCompleted;
    if ($("taskSearchLabel")) $("taskSearchLabel").textContent = t.searchTaskTitle;
    if ($("taskSearch")) $("taskSearch").placeholder = t.searchTasksPlaceholder;
    if ($("taskPriorityFilterLabel")) $("taskPriorityFilterLabel").textContent = t.filterByPriority;
    if ($("taskAssigneeFilterLabel")) $("taskAssigneeFilterLabel").textContent = t.filterByAssignee;
    if ($("allPrioritiesOption")) $("allPrioritiesOption").textContent = t.allPriorities;
    if ($("allAssigneesOption")) $("allAssigneesOption").textContent = t.allAssignees;
    const filterAssignees = document.querySelectorAll('#taskAssigneeFilter option');
    if (filterAssignees[1]) filterAssignees[1].textContent = t.assigneeIssam;
    if (filterAssignees[2]) filterAssignees[2].textContent = t.assigneeJawher;
    if (filterAssignees[3]) filterAssignees[3].textContent = t.assigneeNasim;
    if (filterAssignees[4]) filterAssignees[4].textContent = t.assigneeMohamed;
    if (filterAssignees[5]) filterAssignees[5].textContent = t.unassigned;
    const filterPriorities = document.querySelectorAll('#taskPriorityFilter option');
    if (filterPriorities[1]) filterPriorities[1].textContent = t.urgent;
    if (filterPriorities[2]) filterPriorities[2].textContent = t.next;
    if (filterPriorities[3]) filterPriorities[3].textContent = t.normal;

    // Update sources
    const sourcesH3 = document.querySelectorAll('#sources h3');
    if (sourcesH3[0]) sourcesH3[0].textContent = t.sourcesHeading;
    if (sourcesH3[1]) sourcesH3[1].textContent = t.assumptionsHeading;

    const sourcesOL = document.querySelector('#sources ol');
    if (sourcesOL) {
      const lis = sourcesOL.querySelectorAll('li');
      if (lis[0]) lis[0].textContent = t.source1;
      if (lis[1]) lis[1].textContent = t.source2;
      if (lis[2]) lis[2].textContent = t.source3;
    }

    const sourcesUL = document.querySelector('#sources ul');
    if (sourcesUL) {
      const lis = sourcesUL.querySelectorAll('li');
      if (lis[0]) lis[0].textContent = t.assumption1;
      if (lis[1]) lis[1].textContent = t.assumption2;
      if (lis[2]) lis[2].textContent = t.assumption3;
      if (lis[3]) lis[3].textContent = t.assumption4;
      if (lis[4]) lis[4].textContent = t.assumption5;
      if (lis[5]) lis[5].textContent = t.assumption6;
    }

    const sourcesWarning = document.querySelector('#sources .callout.warning');
    if (sourcesWarning) sourcesWarning.textContent = t.sourcesWarning;

    // Update footer
    const footer = document.querySelector('.footer');
    if (footer) footer.textContent = t.footer;

    // Refresh canvas labels after the language change.
    updateFinancialsFromConfig();

    renderTasks();

    document.title = t.pageTitle;
    ["invoicingRef", "taxRef", "companiesCodeRef"].forEach((id) => {
      const link = document.getElementById(id);
      if (link) link.textContent = t[id];
    });
    const officialReference = document.getElementById("invoicingRef")?.parentElement;
    if (officialReference?.firstChild) officialReference.firstChild.textContent = t.officialReference + " ";
    const companyReference = document.getElementById("companiesCodeRef")?.parentElement;
    if (companyReference?.firstChild) companyReference.firstChild.textContent = t.legalReference + " ";
    document.querySelector("#costChart")?.setAttribute("aria-label", t.costChartAria);
    document.querySelector("#scenarioChart")?.setAttribute("aria-label", t.scenarioChartAria);
    const tabsLabel = document.getElementById("pageTabs");
    if (tabsLabel) tabsLabel.setAttribute("aria-label", t.pageTabsLabel);
    document.querySelectorAll("#pageTabs .page-tab").forEach((tab) => {
      const keys = { recovery: "pageRecovery", commercial: "pageCommercial", operations: "pageOperations", execution: "pageExecution", tasks: "pageTasks", config: "pageConfiguration" };
      if (keys[tab.dataset.pageTarget]) tab.textContent = t[keys[tab.dataset.pageTarget]];
    });
    $("previousPage").textContent = t.previousPage;
    $("nextPage").textContent = t.nextPage;
    updatePageControls();
    document.querySelectorAll("#execution-plan .status").forEach((badge, i) => {
      if (t[`stage${i + 1}`]) badge.textContent = t[`stage${i + 1}`];
    });

    // Update language button
    $("langToggle").textContent = lang === 'en' ? '🇫🇷 Français' : '🇬🇧 English';
  }

  // =====================
  // Navigation
  // =====================
  const planPageOrder = ["recovery", "commercial", "operations", "execution", "tasks", "config"];
  let activePlanPage = "recovery";

  function updatePageControls() {
    const t = translations[currentLang];
    const pageKeys = {
      recovery: "pageRecovery", commercial: "pageCommercial",
      operations: "pageOperations", execution: "pageExecution", tasks: "pageTasks", config: "pageConfiguration",
    };
    const index = planPageOrder.indexOf(activePlanPage);
    const title = $("currentPageTitle");
    const progress = $("pageProgress");
    if (title) title.textContent = t[pageKeys[activePlanPage]];
    if (progress) progress.textContent = t.pageCount
      .replace("{current}", index + 1).replace("{total}", planPageOrder.length);
    document.querySelectorAll(".page-tab").forEach((tab) => {
      const selected = tab.dataset.pageTarget === activePlanPage;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    document.querySelectorAll("#sideNav a[data-section-page]").forEach((link) => {
      link.hidden = link.dataset.sectionPage !== activePlanPage;
      if (link.hidden) link.classList.remove("active");
    });
    const previous = $("previousPage");
    const next = $("nextPage");
    if (previous) previous.disabled = index === 0;
    if (next) next.disabled = index === planPageOrder.length - 1;
  }

  function activatePlanPage(pageName, targetId = null, shouldScroll = true) {
    if (!planPageOrder.includes(pageName)) return;
    activePlanPage = pageName;
    localStorage.setItem(PAGE_KEY, pageName);
    document.querySelectorAll(".plan-page").forEach((page) => {
      page.hidden = page.dataset.page !== pageName;
    });
    updatePageControls();
    if (targetId) {
      document.querySelectorAll("#sideNav a").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${targetId}`));
      requestAnimationFrame(() => $(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } else if (shouldScroll) {
      const firstLink = document.querySelector(`#sideNav a[data-section-page="${pageName}"]`);
      document.querySelectorAll("#sideNav a").forEach((link) => link.classList.toggle("active", link === firstLink));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function setupNavigation() {
    const links = [...document.querySelectorAll("#sideNav a")];
    links.forEach((link) => link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      const page = target?.closest(".plan-page");
      if (!target || !page) return;
      event.preventDefault();
      activatePlanPage(page.dataset.page, target.id);
      links.forEach((item) => item.classList.toggle("active", item === link));
    }));

    document.querySelectorAll(".page-tab").forEach((tab) => {
      tab.addEventListener("click", () => activatePlanPage(tab.dataset.pageTarget));
    });
    $("previousPage").addEventListener("click", () => {
      const index = planPageOrder.indexOf(activePlanPage);
      if (index > 0) activatePlanPage(planPageOrder[index - 1]);
    });
    $("nextPage").addEventListener("click", () => {
      const index = planPageOrder.indexOf(activePlanPage);
      if (index < planPageOrder.length - 1) activatePlanPage(planPageOrder[index + 1]);
    });

    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href")))
      .filter(Boolean);
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.target.closest(".plan-page")?.dataset.page !== activePlanPage) return;
          links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id));
        });
      }, { rootMargin: "-15% 0px -70% 0px" });
      sections.forEach((section) => io.observe(section));
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
    updateCalc();
    updateCashBridge();

    // Event listeners
    ["fee", "orders", "cost", "clients", "target", "manualRevenue"].forEach(
      (id) => $(id).addEventListener("input", () => { updateCalc(); saveToStorage(); }),
    );
    ["cashOnHand", "collected", "invoiced", "pipeline", "activeClients", "outreachCount", "demosCount", "overdueBills", "scorecardDate"].forEach((id) =>
      $(id).addEventListener("input", () => { updateScore(); saveToStorage(); }),
    );
    ["bridgeCash", "bridgeRestore", "bridgeArrears", "bridgeBills", "bridgeReceipts", "bridgeDate"].forEach((id) => $(id).addEventListener("input", () => { updateCashBridge(); saveToStorage(); }));
    document.querySelectorAll("#execution-plan .task input[type=checkbox]").forEach((input) => input.addEventListener("change", saveToStorage));

    $("resetCalc").addEventListener("click", () => {
      $("fee").value = 1;
      $("orders").value = 80;
      $("cost").value = 332;
      $("clients").value = 1;
      $("target").value = 500;
      $("manualRevenue").value = "";
      updateCalc();
    });

    $("resetBridge").addEventListener("click", () => {
      $("bridgeCash").value = "0";
      $("bridgeRestore").value = "834.238";
      $("bridgeArrears").value = "0";
      $("bridgeBills").value = "630";
      $("bridgeReceipts").value = "0";
      $("bridgeDate").value = "2026-10-31";
      updateCashBridge();
      saveToStorage();
    });

    $("resetScorecard").addEventListener("click", () => {
      ["cashOnHand", "collected", "invoiced", "pipeline", "outreachCount", "demosCount", "overdueBills", "scorecardDate"].forEach((id) => { $(id).value = ""; });
      $("activeClients").value = "1";
      updateScore();
      saveToStorage();
    });

    $("resetExecution").addEventListener("click", () => {
      document.querySelectorAll("#execution-plan .task input[type=checkbox]").forEach((input) => { input.checked = false; });
      saveToStorage();
    });

    $("exportCsv").addEventListener("click", exportCsv);
    $("exportJson").addEventListener("click", exportJson);
    $("importJson").addEventListener("click", () => $("jsonFileInput").click());
    $("jsonFileInput").addEventListener("change", importJson);

    ["configServer", "configEmail", "configDomain", "configTax", "configPremises"].forEach((id) =>
      $(id).addEventListener("input", updateFinancialsFromConfig),
    );
    $("saveConfig").addEventListener("click", saveConfig);
    $("resetConfig").addEventListener("click", resetConfig);

    $("addTask").addEventListener("click", addTask);
    $("newTaskButton").addEventListener("click", openTaskForm);
    $("cancelTaskForm").addEventListener("click", closeTaskForm);
    $("clearCompleted").addEventListener("click", clearCompleted);
    $("taskSearch").addEventListener("input", renderTasks);
    $("taskPriorityFilter").addEventListener("change", renderTasks);
    $("taskAssigneeFilter").addEventListener("change", renderTasks);
    document.querySelectorAll("[data-task-view]").forEach(button => button.addEventListener("click", () => setTaskView(button.dataset.taskView)));
    document.querySelectorAll(".task-assignee-checkbox").forEach((input) => input.addEventListener("change", () => {
      const error = $("taskAssigneeError");
      if (error) error.hidden = true;
    }));

    $("langToggle").addEventListener("click", () => {
      setLanguage(currentLang === 'en' ? 'fr' : 'en');
    });

    window.addEventListener("resize", () => {
      drawBars($("costChart"), [
        { label: translations[currentLang].chartServer, value: Number($("configServer").value) / 6, color: "#3157d5" },
        { label: translations[currentLang].chartTax, value: Number($("configTax").value), color: "#98a2b3" },
        { label: translations[currentLang].chartPremises, value: Number($("configPremises").value) / 4, color: "#d97706" },
      ]);
      updateCalc();
    });

    setupNavigation();
    setLanguage(currentLang);
    const savedPage = localStorage.getItem(PAGE_KEY);
    activatePlanPage(planPageOrder.includes(savedPage) ? savedPage : "recovery", null, false);
    document.documentElement.dataset.appReady = "true";
  }

  // Start the app
  init();
})();
