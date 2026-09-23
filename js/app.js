(function () {
  "use strict";

  var STORAGE_KEY = "pincard.cards.v1";
  var SETTINGS_KEY = "pincard.settings.v1";

  var PRESETS = {
    stern: { label: "Stern Pinball (Modern)", w: 140, h: 75 },
    bally_wpc: { label: "Bally (WPC) / Williams (WPC)", w: 152, h: 82 },
    bally_ss: { label: "Bally (SS Series)", w: 140, h: 83 },
    data_east: { label: "Data East / GamePlan", w: 140, h: 76 },
    gottlieb_instruction: { label: "Gottlieb – Instruction Card", w: 154, h: 108 },
    gottlieb_score: { label: "Gottlieb – Score Card", w: 154, h: 57 },
    williams_standard: { label: "Williams (Standard)", w: 154, h: 83 },
    custom: { label: "Custom size", w: 140, h: 75 }
  };

  var state = {
    cards: [],
    selectedId: null,
    settings: { paper: "letter" },
    sharedCards: [],
    activeTab: "mine",
    selectedSharedIndex: null
  };

  // ---------- persistence ----------

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      state.cards = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.cards = [];
    }
    try {
      var s = localStorage.getItem(SETTINGS_KEY);
      if (s) state.settings = Object.assign(state.settings, JSON.parse(s));
    } catch (e) {}
    state.cards.forEach(function (card) {
      var preset = PRESETS[card.preset];
      if (preset && card.preset !== "custom") {
        card.widthMm = preset.w;
        card.heightMm = preset.h;
      }
    });
    if (state.cards.length && !state.selectedId) {
      state.selectedId = state.cards[0].id;
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cards));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  }

  function uid() {
    return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function newCard() {
    return {
      id: uid(),
      preset: "stern",
      widthMm: PRESETS.stern.w,
      heightMm: PRESETS.stern.h,
      title: "New Game",
      logo: "",
      priceRows: [
        { amt: "$0.75", desc: "3 Balls (1 Game)" },
        { amt: "$2.00", desc: "3 Games" }
      ],
      showPrices: true,
      qrUrl: "",
      accent: "#1d4ed8",
      copies: 1
    };
  }

  function getSelected() {
    return state.cards.find(function (c) { return c.id === state.selectedId; }) || null;
  }

  function getSharedSelected() {
    return state.selectedSharedIndex != null ? (state.sharedCards[state.selectedSharedIndex] || null) : null;
  }

  function getPreviewCard() {
    return state.activeTab === "shared" ? getSharedSelected() : getSelected();
  }

  // ---------- QR ----------

  function buildQrSvg(text, sizeMm) {
    if (!text) return "";
    var qr;
    for (var type = 1; type <= 40; type++) {
      try {
        qr = qrcode(type, "M");
        qr.addData(text);
        qr.make();
        break;
      } catch (e) {
        qr = null;
      }
    }
    if (!qr) return "";
    var moduleCount = qr.getModuleCount();
    var cell = sizeMm / moduleCount;
    var svg = '<svg viewBox="0 0 ' + sizeMm + ' ' + sizeMm + '" width="' + sizeMm + 'mm" height="' + sizeMm + 'mm" xmlns="http://www.w3.org/2000/svg">';
    svg += '<rect width="' + sizeMm + '" height="' + sizeMm + '" fill="#fff"/>';
    var path = "";
    for (var r = 0; r < moduleCount; r++) {
      for (var c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          var x = (c * cell).toFixed(3);
          var y = (r * cell).toFixed(3);
          path += "M" + x + "," + y + "h" + cell.toFixed(3) + "v" + cell.toFixed(3) + "h" + (-cell).toFixed(3) + "z";
        }
      }
    }
    svg += '<path d="' + path + '" fill="#000"/></svg>';
    return svg;
  }

  // ---------- rendering a card ----------

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  function renderCardNode(card) {
    var showPrices = card.showPrices !== false;

    var el = document.createElement("div");
    el.className = "pin-card" + (showPrices ? "" : " no-price");
    el.style.width = card.widthMm + "mm";
    el.style.height = card.heightMm + "mm";

    var qrSize = showPrices
      ? Math.max(12, Math.min(card.widthMm, card.heightMm) * 0.32)
      : Math.max(14, Math.min(card.heightMm * 0.55, card.widthMm * 0.42));

    var logoMaxH = showPrices
      ? Math.max(8, card.heightMm * 0.32)
      : Math.max(10, card.heightMm * 0.46);

    var html = "";
    html += '<div class="accent-bar" style="background:' + escapeHtml(card.accent || "#1d4ed8") + '"></div>';

    html += '<div class="top-section">';
    html += '<div class="logo-wrap">';
    if (card.logo) {
      html += '<img src="' + card.logo + '" alt="logo" style="max-height:' + logoMaxH.toFixed(2) + 'mm">';
    } else {
      html += '<div class="logo-placeholder">LOGO</div>';
    }
    html += "</div>";
    html += '<div class="title">' + escapeHtml(card.title || "") + "</div>";
    html += "</div>";

    html += '<div class="bottom-row' + (showPrices ? "" : " center-qr") + '">';
    if (showPrices) {
      html += '<div class="prices">';
      (card.priceRows || []).forEach(function (row) {
        if (!row.amt && !row.desc) return;
        html += '<div class="price-line"><span class="amt">' + escapeHtml(row.amt) + '</span><span class="desc">' + escapeHtml(row.desc) + "</span></div>";
      });
      html += "</div>";
    }
    html += '<div class="footer">';
    if (card.qrUrl) {
      html += '<div class="qr">' + buildQrSvg(card.qrUrl, qrSize) + "</div>";
      html += '<div class="qr-caption"><strong>Problem with this game?</strong>Scan to report it</div>';
    } else {
      html += '<div class="qr-caption" style="color:#b8bcc4">Add a report URL to show a QR code here.</div>';
    }
    html += "</div>";
    html += "</div>";

    el.innerHTML = html;
    return el;
  }

  // ---------- UI: card list ----------

  var listEl = document.getElementById("card-list");
  var emptyHint = document.getElementById("empty-hint");

  function renderList() {
    listEl.innerHTML = "";
    if (!state.cards.length) {
      emptyHint.style.display = "block";
    } else {
      emptyHint.style.display = "none";
    }
    state.cards.forEach(function (card) {
      var item = document.createElement("div");
      item.className = "card-list-item" + (card.id === state.selectedId ? " active" : "");
      item.innerHTML =
        '<div class="meta"><div class="name">' + escapeHtml(card.title || "Untitled") + '</div>' +
        '<div class="sub">' + card.widthMm + "×" + card.heightMm + " mm · ×" + (card.copies || 1) + " copies</div></div>" +
        '<div class="row-actions">' +
        '<button class="small dup" title="Duplicate">⧉</button>' +
        '<button class="small danger del" title="Delete">✕</button>' +
        "</div>";
      item.addEventListener("click", function (e) {
        if (e.target.closest(".dup") || e.target.closest(".del")) return;
        state.selectedId = card.id;
        state.activeTab = "mine";
        save();
        renderAll();
      });
      item.querySelector(".dup").addEventListener("click", function () {
        var copy = JSON.parse(JSON.stringify(card));
        copy.id = uid();
        copy.title = card.title + " (copy)";
        var idx = state.cards.indexOf(card);
        state.cards.splice(idx + 1, 0, copy);
        state.selectedId = copy.id;
        state.activeTab = "mine";
        save();
        renderAll();
      });
      item.querySelector(".del").addEventListener("click", function () {
        if (!confirm('Delete "' + (card.title || "Untitled") + '"?')) return;
        var idx = state.cards.indexOf(card);
        state.cards.splice(idx, 1);
        if (state.selectedId === card.id) {
          state.selectedId = state.cards.length ? state.cards[Math.max(0, idx - 1)].id : null;
        }
        state.activeTab = "mine";
        save();
        renderAll();
      });
      listEl.appendChild(item);
    });
  }

  // ---------- UI: editor form ----------

  var sharedListSideEl = document.getElementById("shared-list-side");
  var sharedEmptyHint = document.getElementById("shared-empty-hint");
  var sharedDetailPanel = document.getElementById("shared-detail-panel");
  var sharedDetailMeta = document.getElementById("shared-detail-meta");
  var sharedAddBtn = document.getElementById("shared-add-btn");

  var editorPanel = document.getElementById("editor-panel");
  var editorEmpty = document.getElementById("editor-empty");
  var presetSelect = document.getElementById("preset-select");
  var widthInput = document.getElementById("width-input");
  var heightInput = document.getElementById("height-input");
  var titleInput = document.getElementById("title-input");
  var qrInput = document.getElementById("qr-input");
  var accentInput = document.getElementById("accent-input");
  var copiesInput = document.getElementById("copies-input");
  var priceRowsEl = document.getElementById("price-rows");
  var addPriceRowBtn = document.getElementById("add-price-row");
  var showPricesInput = document.getElementById("show-prices-input");
  var logoDrop = document.getElementById("logo-drop");
  var logoFile = document.getElementById("logo-file");
  var removeLogoBtn = document.getElementById("remove-logo");

  Object.keys(PRESETS).forEach(function (key) {
    var opt = document.createElement("option");
    opt.value = key;
    opt.textContent = PRESETS[key].label + (key === "custom" ? "" : " — " + PRESETS[key].w + "×" + PRESETS[key].h + " mm");
    presetSelect.appendChild(opt);
  });

  function renderEditor() {
    var card = getSelected();
    if (!card) {
      editorPanel.style.display = "none";
      editorEmpty.style.display = "block";
      return;
    }
    editorPanel.style.display = "block";
    editorEmpty.style.display = "none";

    presetSelect.value = card.preset;
    widthInput.value = card.widthMm;
    heightInput.value = card.heightMm;
    titleInput.value = card.title;
    qrInput.value = card.qrUrl;
    accentInput.value = card.accent;
    copiesInput.value = card.copies;
    showPricesInput.checked = card.showPrices !== false;

    priceRowsEl.innerHTML = "";
    (card.priceRows || []).forEach(function (row, i) {
      var rowEl = document.createElement("div");
      rowEl.className = "price-row";
      rowEl.innerHTML =
        '<input type="text" class="p-amt" placeholder="$0.75" value="' + escapeHtml(row.amt) + '">' +
        '<input type="text" class="p-desc" placeholder="3 Balls (1 Game)" value="' + escapeHtml(row.desc) + '">' +
        '<button class="small danger p-del" title="Remove">✕</button>';
      rowEl.querySelector(".p-amt").addEventListener("input", function (e) {
        card.priceRows[i].amt = e.target.value;
        save();
        renderPreview();
      });
      rowEl.querySelector(".p-desc").addEventListener("input", function (e) {
        card.priceRows[i].desc = e.target.value;
        save();
        renderPreview();
      });
      rowEl.querySelector(".p-del").addEventListener("click", function () {
        card.priceRows.splice(i, 1);
        save();
        renderEditor();
        renderPreview();
      });
      priceRowsEl.appendChild(rowEl);
    });

    if (card.logo) {
      logoDrop.innerHTML = '<img src="' + card.logo + '" alt="logo preview"><div>Click to replace logo</div>';
      removeLogoBtn.style.display = "inline-block";
    } else {
      logoDrop.innerHTML = "<div>Click or drop an image here to add a logo</div>";
      removeLogoBtn.style.display = "none";
    }
  }

  presetSelect.addEventListener("change", function () {
    var card = getSelected();
    if (!card) return;
    card.preset = presetSelect.value;
    if (card.preset !== "custom") {
      card.widthMm = PRESETS[card.preset].w;
      card.heightMm = PRESETS[card.preset].h;
    }
    save();
    renderEditor();
    renderAll();
  });

  function markCustomOnDimensionEdit() {
    var card = getSelected();
    if (!card) return;
    card.preset = "custom";
    presetSelect.value = "custom";
  }

  widthInput.addEventListener("input", function () {
    var card = getSelected();
    if (!card) return;
    card.widthMm = parseFloat(widthInput.value) || card.widthMm;
    markCustomOnDimensionEdit();
    save();
    renderAll();
  });
  heightInput.addEventListener("input", function () {
    var card = getSelected();
    if (!card) return;
    card.heightMm = parseFloat(heightInput.value) || card.heightMm;
    markCustomOnDimensionEdit();
    save();
    renderAll();
  });
  titleInput.addEventListener("input", function () {
    var card = getSelected();
    if (!card) return;
    card.title = titleInput.value;
    save();
    renderList();
    renderPreview();
  });
  qrInput.addEventListener("input", function () {
    var card = getSelected();
    if (!card) return;
    card.qrUrl = qrInput.value;
    save();
    renderPreview();
  });
  accentInput.addEventListener("input", function () {
    var card = getSelected();
    if (!card) return;
    card.accent = accentInput.value;
    save();
    renderPreview();
  });
  copiesInput.addEventListener("input", function () {
    var card = getSelected();
    if (!card) return;
    card.copies = Math.max(1, parseInt(copiesInput.value, 10) || 1);
    save();
    renderList();
    renderSheet();
  });

  showPricesInput.addEventListener("change", function () {
    var card = getSelected();
    if (!card) return;
    card.showPrices = showPricesInput.checked;
    save();
    renderPreview();
  });

  addPriceRowBtn.addEventListener("click", function () {
    var card = getSelected();
    if (!card) return;
    card.priceRows.push({ amt: "", desc: "" });
    save();
    renderEditor();
    renderPreview();
  });

  logoDrop.addEventListener("click", function () { logoFile.click(); });
  logoDrop.addEventListener("dragover", function (e) { e.preventDefault(); });
  logoDrop.addEventListener("drop", function (e) {
    e.preventDefault();
    var file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleLogoFile(file);
  });
  logoFile.addEventListener("change", function () {
    if (logoFile.files[0]) handleLogoFile(logoFile.files[0]);
  });
  removeLogoBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    var card = getSelected();
    if (!card) return;
    card.logo = "";
    save();
    renderEditor();
    renderPreview();
  });

  function handleLogoFile(file) {
    if (!/^image\//.test(file.type)) {
      alert("Please choose an image file.");
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var card = getSelected();
      if (!card) return;
      card.logo = reader.result;
      save();
      renderEditor();
      renderPreview();
    };
    reader.readAsDataURL(file);
  }

  // ---------- preview + sheet ----------

  var singlePreviewWrap = document.getElementById("single-preview");
  var sheetPage = document.getElementById("sheet-page");
  var paperSelect = document.getElementById("paper-select");
  var pageSizeStyle = document.getElementById("page-size-style");

  function renderPreview() {
    singlePreviewWrap.innerHTML = "";
    var card = getPreviewCard();
    if (card) singlePreviewWrap.appendChild(renderCardNode(card));
    renderSheet();
  }

  function renderSheet() {
    sheetPage.innerHTML = "";
    sheetPage.className = state.settings.paper === "a4" ? "paper-a4" : "paper-letter";
    state.cards.forEach(function (card) {
      var n = card.copies || 1;
      for (var i = 0; i < n; i++) {
        sheetPage.appendChild(renderCardNode(card));
      }
    });
    pageSizeStyle.textContent = "@page { size: " + (state.settings.paper === "a4" ? "A4" : "letter") + "; margin: 0; }";
  }

  paperSelect.addEventListener("change", function () {
    state.settings.paper = paperSelect.value;
    save();
    renderSheet();
  });

  // ---------- top actions ----------

  document.getElementById("add-card-btn").addEventListener("click", function () {
    var card = newCard();
    state.cards.push(card);
    state.selectedId = card.id;
    save();
    switchTab("mine");
  });

  document.getElementById("print-btn").addEventListener("click", function () {
    window.print();
  });

  document.getElementById("export-btn").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify({ cards: state.cards, settings: state.settings }, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "pincard-export.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("import-btn").addEventListener("click", function () {
    document.getElementById("import-file").click();
  });

  document.getElementById("import-file").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!Array.isArray(data.cards)) throw new Error("bad file");
        state.cards = state.cards.concat(data.cards.map(function (c) {
          c.id = uid();
          return c;
        }));
        save();
        switchTab("mine");
      } catch (err) {
        alert("Could not read that file as a PinCard export.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  // ---------- shared card library (Community tab) ----------

  function renderSharedSideList() {
    sharedListSideEl.innerHTML = "";
    sharedEmptyHint.style.display = state.sharedCards.length ? "none" : "block";
    state.sharedCards.forEach(function (card, idx) {
      var item = document.createElement("div");
      item.className = "card-list-item" + (state.selectedSharedIndex === idx ? " active" : "");
      item.innerHTML =
        '<div class="meta"><div class="name">' + escapeHtml(card.title || "Untitled") + '</div>' +
        '<div class="sub">' + card.widthMm + "×" + card.heightMm + " mm</div></div>";
      item.addEventListener("click", function () {
        state.selectedSharedIndex = idx;
        state.activeTab = "shared";
        renderSharedSideList();
        renderRightPanel();
        renderPreview();
      });
      sharedListSideEl.appendChild(item);
    });
  }

  function renderSharedDetail() {
    var card = getSharedSelected();
    if (!card) {
      sharedDetailMeta.textContent = "Select a card from the list to preview it here.";
      sharedAddBtn.style.display = "none";
      return;
    }
    sharedAddBtn.style.display = "block";
    var html = "<strong>" + escapeHtml(card.title || "Untitled") + "</strong>";
    html += '<div class="sub" style="margin:2px 0 8px;">' + card.widthMm + "×" + card.heightMm + " mm</div>";
    (card.priceRows || []).forEach(function (row) {
      if (!row.amt && !row.desc) return;
      html += '<div class="price-line-view"><span class="amt">' + escapeHtml(row.amt) + '</span><span class="desc">' + escapeHtml(row.desc) + "</span></div>";
    });
    sharedDetailMeta.innerHTML = html;
  }

  function renderRightPanel() {
    if (state.activeTab === "shared") {
      editorPanel.style.display = "none";
      editorEmpty.style.display = "none";
      sharedDetailPanel.style.display = "block";
      renderSharedDetail();
    } else {
      sharedDetailPanel.style.display = "none";
      renderEditor();
    }
  }

  function switchTab(tab) {
    state.activeTab = tab;
    renderAll();
  }

  sharedAddBtn.addEventListener("click", function () {
    var card = getSharedSelected();
    if (!card) return;
    var copy = JSON.parse(JSON.stringify(card));
    copy.id = uid();
    state.cards.push(copy);
    state.selectedId = copy.id;
    save();
    switchTab("mine");
  });

  function loadSharedLibrary() {
    fetch("data/manifest.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (files) {
        if (!Array.isArray(files) || !files.length) return [];
        return Promise.all(files.map(function (name) {
          return fetch("data/" + name, { cache: "no-store" })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) {
              if (!data) return [];
              if (Array.isArray(data)) return data;
              if (Array.isArray(data.cards)) return data.cards;
              return [];
            })
            .catch(function () { return []; });
        }));
      })
      .then(function (fileResults) {
        state.sharedCards = (fileResults || []).reduce(function (acc, cards) {
          return acc.concat(cards);
        }, []);
        renderSharedSideList();
        renderRightPanel();
      })
      .catch(function () {
        // shared library is optional; ignore fetch/parse failures (e.g. opened via file://)
      });
  }

  // ---------- init ----------

  function renderAll() {
    renderList();
    renderSharedSideList();
    renderRightPanel();
    renderPreview();
    renderSheet();
  }

  loadState();
  paperSelect.value = state.settings.paper;
  renderAll();
  loadSharedLibrary();
})();
