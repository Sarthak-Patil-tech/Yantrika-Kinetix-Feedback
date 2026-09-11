/* =========================================================
   YANTRIKA — WALL·E Edition · one file powers every page:
     · index.html     → intro page + quick general feedback (Sheet 2)
     · botfeed.html   → 10 bot stations, batch transmit (Sheet 1 "bot feedback")
     · finalfeed.html → final overall feedback (Sheet 2 "General feedback")
     · thankyou.html  → thank-you page (no logic needed)
     · reviews.html   → password gate + reviews for BOTH sheets
   ========================================================= */

/* =========================================================
   CONFIGURATION — EDIT THESE TWO LINES (see README step 5-6)
   ========================================================= */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwcRl05y356F5uqOYB5sEfTHguoH-hVGeC1CbDgbkbVYo-jHzgbOMtcjlpxzefEEFnb/exec";   // ← paste your Google Apps Script Web App URL
const REVIEWS_PASSWORD = "yantrika26";    // ← change the reviews page password

/* ---------------------------------------------------------
   HONEST SECURITY WARNING (please read)

   The password above lives in FRONTEND JavaScript.
   Anyone can open the browser's "View Source" / DevTools
   and read it. This is BASIC access protection only —
   fine for a small college project, NOT real security.

   Therefore:
     · Do NOT collect sensitive information.
     · Only collect: name, branch, rating, feedback, bot.
     · Anyone determined enough can also call the Apps
       Script URL directly and read the reviews.
   --------------------------------------------------------- */

/* While APPS_SCRIPT_URL is not a real http(s) URL the site runs in
   DEMO MODE: submissions are simulated locally (nothing is sent) and
   reviews.html shows sample data with the demo banner. */
function ykConfigured() {
  return typeof APPS_SCRIPT_URL === "string" && /^https?:\/\//.test(APPS_SCRIPT_URL);
}

function ykDemoNote() {
  window.dispatchEvent(new CustomEvent("cv:toast", {
    detail: "DEMO MODE — transmission logged locally. Paste your Apps Script URL into script.js to go live."
  }));
}

/* =========================================================
   SHARED — star rating rows
   Returns a controller: { get(), set(), reset() }
   ========================================================= */
function ykBindStars(row, onRate) {
  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  if (!row) return { get: () => 0, set: function () {}, reset: function () {} };

  const stars = Array.from(row.querySelectorAll(".star"));
  const text  = row.querySelector(".rating-text");
  let value = 0;

  function paint(n) {
    stars.forEach(function (s, i) { s.classList.toggle("active", i < n); });
    if (text) {
      text.textContent = n
        ? "You selected: " + n + " ★ — " + labels[n]
        : "Select your rating";
    }
  }

  stars.forEach(function (star, index) {
    const v = index + 1;
    star.addEventListener("click", function () {
      value = v;
      paint(v);
      star.classList.add("pop");
      setTimeout(function () { star.classList.remove("pop"); }, 420);
      if (onRate) onRate(v);
    });
    star.addEventListener("mouseenter", function () { paint(v); });
  });
  row.addEventListener("mouseleave", function () { paint(value); });

  return {
    get:   function () { return value; },
    set:   function (v) { value = v; paint(v); },
    reset: function () { value = 0; paint(0); }
  };
}

/* Shared smooth-scroll helper (guarded for very old embedded browsers) */
function ykScrollToCenter(el) {
  if (el && typeof el.scrollIntoView === "function") {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/* Shared submit-button label helper (keeps the svg icon alive) */
function ykBtnLabel(btn, msg) {
  const label = btn.querySelector(".btn-label");
  if (label) label.textContent = msg;
  else btn.textContent = msg;
}

/* =========================================================
   PAGE: index.html + finalfeed.html — general feedback form
   (runs wherever a form#feedbackForm or form#finalForm exists)
   ========================================================= */
(function () {
  const form = document.getElementById("feedbackForm") || document.getElementById("finalForm");
  if (!form) return;

  const isFinal     = form.id === "finalForm";
  const nameInput   = document.getElementById(isFinal ? "fName"     : "name");
  const branchInput = document.getElementById(isFinal ? "fBranch"   : "branch");
  const feedbackInp = document.getElementById(isFinal ? "fFeedback" : "feedback");
  const errorBox    = document.getElementById(isFinal ? "finalError" : "formError");
  const successBox  = document.getElementById(isFinal ? "finalSuccess" : "formSuccess");
  const submitBtn   = document.getElementById(isFinal ? "finalSubmit"  : "submitBtn");

  const rating = ykBindStars(document.getElementById(isFinal ? "fStarRow" : "starRow"));

  /* finalfeed: prefill pilot identity from the bot journey */
  if (isFinal) {
    try {
      const n = localStorage.getItem("yk_name");
      const b = localStorage.getItem("yk_branch");
      if (n) nameInput.value = n;
      if (b) branchInput.value = b;
    } catch (e) { /* private mode etc. — ignore */ }
  }

  function showErrors(messages) {
    errorBox.innerHTML = messages.map(function (m) { return "<li>" + m + "</li>"; }).join("");
    errorBox.hidden = messages.length === 0;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    successBox.hidden = true;

    const name     = nameInput.value.trim();
    const branch   = branchInput.value;
    const feedback = feedbackInp.value.trim();

    /* ---- Validate ---- */
    const errors = [];
    if (!name)              errors.push("Please enter your name.");
    if (!branch)            errors.push("Please select your branch.");
    if (rating.get() < 1)   errors.push("Please choose a star rating (1–5).");
    if (!feedback)          errors.push("Please write your feedback.");
    if (errors.length > 0) { showErrors(errors); return; }
    showErrors([]);

    /* ---- Send (form-data POST avoids CORS issues with Apps Script) ---- */
    const body = new URLSearchParams();
    body.append("type", "general");
    body.append("name", name);
    body.append("branch", branch);
    body.append("rating", rating.get());
    body.append("feedback", feedback);

    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    ykBtnLabel(submitBtn, "TRANSMITTING…");

    function done() {
      successBox.hidden = false;
      form.reset();
      rating.reset();
      try {
        localStorage.setItem("yk_name", name);
        localStorage.setItem("yk_branch", branch);
      } catch (e) { /* ignore */ }
      window.dispatchEvent(new CustomEvent("cv:success"));   // star confetti + WALL-E cheer
      ykScrollToCenter(successBox);

      if (isFinal) {
        /* the drawing: final overall feedback → Thankyou page */
        setTimeout(function () { window.location.href = "thankyou.html"; }, 1600);
      }
    }

    if (!ykConfigured()) {
      setTimeout(function () {                                 // demo mode
        done();
        ykDemoNote();
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
        ykBtnLabel(submitBtn, isFinal ? "TRANSMIT FINAL VERDICT" : "TRANSMIT FEEDBACK");
      }, 700);
      return;
    }

    fetch(APPS_SCRIPT_URL, { method: "POST", body: body })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (json && json.result === "error") { showErrors(["The Axiom reports: " + (json.message || "unknown error")]); return; }
        done();
      })
      .catch(function () {
        showErrors(["Something went wrong. Please check your internet connection and try again."]);
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
        ykBtnLabel(submitBtn, isFinal ? "TRANSMIT FINAL VERDICT" : "TRANSMIT FEEDBACK");
      });
  });
})();


/* =========================================================
   PAGE: botfeed.html — the 10 bot stations
   One batch POST (type=botbatch) writes one row per bot
   into Sheet 1 "bot feedback".
   ========================================================= */
(function () {
  const botForm = document.getElementById("botForm");
  if (!botForm) return;

  const nameInput   = document.getElementById("botName");
  const branchInput = document.getElementById("botBranch");
  const errorBox    = document.getElementById("botError");
  const successBox  = document.getElementById("botSuccess");
  const proceed     = document.getElementById("proceedFinal");
  const submitBtn   = document.getElementById("botSubmit");

  const doneEl = document.getElementById("fleetDone");
  const barEl  = document.getElementById("fleetBar");
  const listEl = document.getElementById("fleetList");

  /* bind every station card */
  const stations = Array.from(botForm.querySelectorAll(".station")).map(function (st) {
    return {
      el:   st,
      bot:  st.getAttribute("data-bot"),
      note: st.querySelector("textarea"),
      chip: st.querySelector(".st-status"),
      rating: ykBindStars(st.querySelector(".star-row"), function () { refresh(); })
    };
  });

  function refresh() {
    const done = stations.filter(function (s) { return s.rating.get() > 0; }).length;
    if (doneEl) doneEl.textContent = done + "/" + stations.length;
    if (barEl)  barEl.style.width = (done / stations.length * 100).toFixed(1) + "%";
    stations.forEach(function (s) {
      const ok = s.rating.get() > 0;
      s.el.classList.toggle("is-done", ok);
      if (s.chip) s.chip.textContent = ok ? "LOGGED ✓" : "STANDBY";
      if (listEl) {
        const li = listEl.querySelector('li[data-bot="' + s.bot + '"]');
        if (li) li.classList.toggle("done", ok);
      }
    });
  }
  refresh();

  function showErrors(messages) {
    errorBox.innerHTML = messages.map(function (m) { return "<li>" + m + "</li>"; }).join("");
    errorBox.hidden = messages.length === 0;
    if (messages.length) ykScrollToCenter(errorBox);
  }

  botForm.addEventListener("submit", function (event) {
    event.preventDefault();
    successBox.hidden = true;

    const name   = nameInput.value.trim();
    const branch = branchInput.value;

    const errors = [];
    if (!name)   errors.push("Please enter your name.");
    if (!branch) errors.push("Please select your branch.");
    stations.forEach(function (s) {
      if (s.rating.get() < 1) errors.push("Rate the " + s.bot + " station (1–5 stars).");
    });
    if (errors.length > 0) { showErrors(errors); return; }
    showErrors([]);

    const rows = stations.map(function (s) {
      return { bot: s.bot, rating: s.rating.get(), feedback: (s.note ? s.note.value.trim() : "") };
    });

    const body = new URLSearchParams();
    body.append("type", "botbatch");
    body.append("name", name);
    body.append("branch", branch);
    body.append("payload", JSON.stringify(rows));

    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    ykBtnLabel(submitBtn, "TRANSMITTING " + rows.length + " REPORTS…");

    function done() {
      try {
        localStorage.setItem("yk_name", name);
        localStorage.setItem("yk_branch", branch);
        localStorage.setItem("yk_bots_done", "1");
      } catch (e) { /* ignore */ }
      successBox.hidden = false;
      if (proceed) proceed.hidden = false;
      window.dispatchEvent(new CustomEvent("cv:success"));
      ykScrollToCenter(successBox);
    }

    if (!ykConfigured()) {
      setTimeout(function () {                                 // demo mode
        done();
        ykDemoNote();
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
        ykBtnLabel(submitBtn, "TRANSMIT ALL BOT REPORTS");
      }, 900);
      return;
    }

    fetch(APPS_SCRIPT_URL, { method: "POST", body: body })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (json && json.result === "error") { showErrors(["The Axiom reports: " + (json.message || "unknown error")]); return; }
        done();
      })
      .catch(function () {
        showErrors(["Something went wrong. Please check your internet connection and try again."]);
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
        ykBtnLabel(submitBtn, "TRANSMIT ALL BOT REPORTS");
      });
  });
})();


/* =========================================================
   PAGE: reviews.html — password gate + reviews (both sheets)
   ========================================================= */
const passwordForm = document.getElementById("passwordForm");

if (passwordForm) {

  const gate           = document.getElementById("passwordGate");
  const reviewsSection = document.getElementById("reviewsSection");
  const passwordInput  = document.getElementById("passwordInput");
  const passwordError  = document.getElementById("passwordError");
  const loadingText    = document.getElementById("loadingText");
  const emptyState     = document.getElementById("emptyState");
  const demoBanner     = document.getElementById("demoBanner");
  const grid           = document.getElementById("reviewsGrid");
  const branchFilter   = document.getElementById("branchFilter");
  const ratingFilter   = document.getElementById("ratingFilter");
  const sourceFilter   = document.getElementById("sourceFilter");
  const botFilterWrap  = document.getElementById("botFilterWrap");
  const botFilter      = document.getElementById("botFilter");

  let allReviews = [];                  // every review of the current source, newest first

  /* ---- sample data for demo mode ---- */
  const DEMO_GENERAL = [
    { id: 1, name: "Aarav",  branch: "CSE",         rating: 5, feedback: "The bot arena was electric. Best event of the year!", date: "2026-09-01" },
    { id: 2, name: "Priya",  branch: "ECE",         rating: 4, feedback: "Great demos, friendly seniors. Want longer sessions.", date: "2026-09-02" },
    { id: 3, name: "Rohan",  branch: "Mechanical",  rating: 5, feedback: "Held the robotic arm myself — never letting go of that memory.", date: "2026-09-03" },
    { id: 4, name: "Sana",   branch: "IT",          rating: 3, feedback: "Fun, but the queue at the RC bot stall was huge.", date: "2026-09-04" }
  ];
  const DEMO_BOT = [
    { id: 1, name: "Aarav", branch: "CSE",        bot: "Line Follower",      rating: 5, feedback: "It never left the line. Insane tuning.", date: "2026-09-01" },
    { id: 2, name: "Priya", branch: "ECE",        bot: "Soccer Bot",         rating: 4, feedback: "That goal in the last second? Unreal.", date: "2026-09-01" },
    { id: 3, name: "Rohan", branch: "Mechanical", bot: "Self-Balancing Bot", rating: 5, feedback: "Pushed it twice, it refused to fall. Respect.", date: "2026-09-02" },
    { id: 4, name: "Sana",  branch: "IT",         bot: "Maze Solver",        rating: 4, feedback: "Watched it map the maze in one run.", date: "2026-09-03" },
    { id: 5, name: "Kunal", branch: "CSE",        bot: "Duckietown",         rating: 5, feedback: "The little self-driving duck car is adorable.", date: "2026-09-04" },
    { id: 6, name: "Ira",   branch: "Civil",      bot: "Robotic Arm",        rating: 4, feedback: "Let visitors pick & place. Loved it.", date: "2026-09-05" }
  ];

  function currentSource() {
    return sourceFilter && sourceFilter.value === "bot" ? "bot" : "general";
  }

  /* ---- Password check (basic protection — see warning above) ---- */
  passwordForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (passwordInput.value === REVIEWS_PASSWORD) {
      passwordError.hidden = true;
      gate.hidden = true;
      reviewsSection.hidden = false;
      loadReviews();
    } else {
      passwordError.hidden = false;
      passwordInput.value = "";
      passwordInput.focus();
    }
  });

  /* ---- GET reviews from Google Apps Script ---- */
  function loadReviews() {
    const source = currentSource();
    if (botFilterWrap) botFilterWrap.hidden = source !== "bot";

    if (!ykConfigured()) {
      allReviews = (source === "bot" ? DEMO_BOT : DEMO_GENERAL).slice().reverse();
      if (demoBanner) demoBanner.hidden = false;
      loadingText.hidden = true;
      renderStats();
      renderCards();
      return;
    }

    if (demoBanner) demoBanner.hidden = true;
    loadingText.hidden = false;
    loadingText.textContent = "Loading reviews…";

    fetch(APPS_SCRIPT_URL + "?sheet=" + source)
      .then(function (res) { return res.json(); })
      .then(function (rows) {
        allReviews = rows.slice().reverse();   // newest review first
        loadingText.hidden = true;
        renderStats();
        renderCards();
      })
      .catch(function () {
        loadingText.textContent = "Could not load reviews. Check your Apps Script URL and internet connection.";
      });
  }

  /* ---- Statistics: total, average, per-star counts ---- */
  function renderStats() {
    const total = allReviews.length;
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    allReviews.forEach(function (r) {
      const rating = Number(r.rating) || 0;
      sum += rating;
      if (counts[rating] !== undefined) counts[rating]++;
    });

    document.getElementById("statTotal").textContent  = total;
    document.getElementById("statAverage").textContent = total ? (sum / total).toFixed(1) : "–";

    for (let s = 1; s <= 5; s++) {
      document.getElementById("count" + s).textContent = counts[s];
      document.getElementById("bar" + s).style.width = total ? (counts[s] / total * 100) + "%" : "0%";
    }
  }

  /* ---- Card helpers ---- */
  function buildStars(rating) {
    const wrap = document.createElement("div");
    wrap.className = "card-stars";

    const filled = document.createElement("span");
    filled.textContent = "★".repeat(rating);

    const empty = document.createElement("span");
    empty.className = "dim";
    empty.textContent = "★".repeat(5 - rating);

    wrap.appendChild(filled);
    wrap.appendChild(empty);
    return wrap;
  }

  function formatDate(value) {
    const d = new Date(value);
    if (isNaN(d)) return String(value);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  /* ---- Render cards, respecting all filters ---- */
  function renderCards() {
    const branch = branchFilter.value;
    const rating = ratingFilter.value;
    const bot    = botFilter ? botFilter.value : "All";
    const source = currentSource();

    const visible = allReviews.filter(function (r) {
      const branchOK = branch === "All" || r.branch === branch;
      const ratingOK = rating === "All" || Number(r.rating) === Number(rating);
      const botOK    = source !== "bot" || bot === "All" || r.bot === bot;
      return branchOK && ratingOK && botOK;
    });

    grid.innerHTML = "";
    emptyState.hidden = visible.length > 0;

    visible.forEach(function (r, i) {
      const card = document.createElement("article");
      card.className = "card review-card";
      card.style.setProperty("--i", Math.min(i, 12));

      const ratingNum = Math.min(5, Math.max(0, Number(r.rating) || 0));
      card.appendChild(buildStars(ratingNum));

      const head = document.createElement("div");
      head.className = "review-head";

      const name = document.createElement("h3");
      name.textContent = r.name || "Anonymous";
      head.appendChild(name);

      if (r.bot) {
        const botBadge = document.createElement("span");
        botBadge.className = "branch-badge bot-badge";
        botBadge.textContent = r.bot;
        head.appendChild(botBadge);
      }

      const badge = document.createElement("span");
      badge.className = "branch-badge";
      badge.textContent = r.branch || "";
      head.appendChild(badge);

      const quote = document.createElement("p");
      quote.className = "review-text";
      quote.textContent = r.feedback ? '"' + r.feedback + '"' : '"—"';

      const date = document.createElement("p");
      date.className = "review-date";
      date.textContent = formatDate(r.date);

      card.appendChild(head);
      card.appendChild(quote);
      card.appendChild(date);
      grid.appendChild(card);
    });
  }

  if (sourceFilter) sourceFilter.addEventListener("change", loadReviews);
  if (botFilter)    botFilter.addEventListener("change", renderCards);
  branchFilter.addEventListener("change", renderCards);
  ratingFilter.addEventListener("change", renderCards);
}
