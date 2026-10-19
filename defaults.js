// Centralized default values for Wolvo Plan.
// Change a value here to update both the initial form values and the
// "Reset" buttons. Keys map directly to the element IDs in index.html.
const DEFAULTS = {
  // Interactive break-even calculator
  calculator: {
    fee: "1",
    orders: "80",
    cost: "332",
    clients: "1",
    target: "500",
    manualRevenue: ""
  },

  // Immediate cash bridge (prefilled working estimate)
  cashBridge: {
    bridgeCash: "0",
    bridgeRestore: "834.238",
    bridgeArrears: "0",
    bridgeBills: "630",
    bridgeReceipts: "0",
    bridgeDate: "2026-10-31"
  },

  // Weekly scorecard
  scorecard: {
    cashOnHand: "",
    collected: "",
    invoiced: "",
    pipeline: "",
    activeClients: "1",
    outreachCount: "",
    demosCount: "",
    overdueBills: "",
    scorecardDate: ""
  },

  // Configuration
  config: {
    configServer: "834.238",
    configEmail: "94.800",
    configDomain: "54",
    configTax: "30",
    configPremises: "600",
    configVatRate: "19",
    configReturnedFee: "0.500",
    configExchangeFee: "0.500"
  },

  // 90-day execution plan checklist
  execution: {
    checked: false
  }
};
