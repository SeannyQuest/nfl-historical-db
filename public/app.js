/* ═══════════════════════════════════════════════════════════════
   NFL Historical Database — App Engine
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  // ── Constants ──
  const WEEK_ORDER = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18",
    "WildCard","Wild Card","Division","Divisional","ConfChamp","Conference","SuperBowl","Super Bowl","Champ"];
  const PLAYOFF_WEEKS = new Set(["WildCard","Wild Card","Division","Divisional","ConfChamp","Conference","SuperBowl","Super Bowl","Champ"]);
  const GE_PAGE_SIZE = 50;

  // ── Indices (built once) ──
  let teamNames = [];
  let franchiseNames = []; // sorted franchise display labels
  let gamesByTeam = {};    // teamName -> [{game, isHome}]
  let franchiseToTeams = {}; // "Raiders" -> ["Oakland Raiders",...]
  let franchiseLabels = {};  // "Raiders" -> "Raiders (OAK/LA/LV)"
  let allSeasons = [];
  let allWeeks = [];
  let allDays = [];

  // ── State ──
  let geSortCol = "dt";
  let geSortDir = "desc";
  let gePage = 1;
  let quickStatsComputed = false;

  // ═══════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════

  function init() {
    buildIndices();
    populateDropdowns();
    setupTabs();
    setupRecordFinder();
    setupHeadToHead();
    setupGameExplorer();
  }

  function buildIndices() {
    const teamSet = new Set();
    gamesByTeam = {};

    NFL_GAMES.forEach(g => {
      teamSet.add(g.h);
      teamSet.add(g.a);
      if (!gamesByTeam[g.h]) gamesByTeam[g.h] = [];
      if (!gamesByTeam[g.a]) gamesByTeam[g.a] = [];
      gamesByTeam[g.h].push({ game: g, isHome: true });
      gamesByTeam[g.a].push({ game: g, isHome: false });
    });

    teamNames = [...teamSet].sort();
    allSeasons = [...new Set(NFL_GAMES.map(g => g.s))].sort((a, b) => a - b);
    allWeeks = WEEK_ORDER.filter(w => NFL_GAMES.some(g => g.w === w));
    allDays = [...new Set(NFL_GAMES.map(g => g.d))].sort((a, b) => {
      const order = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return (order[a] ?? 9) - (order[b] ?? 9);
    });

    // Build franchise reverse map
    franchiseToTeams = {};
    const handled = new Set();
    for (const [team, fKey] of Object.entries(FRANCHISE_MAP)) {
      if (!franchiseToTeams[fKey]) franchiseToTeams[fKey] = [];
      if (teamSet.has(team)) {
        franchiseToTeams[fKey].push(team);
        handled.add(team);
      }
    }
    // Teams not in FRANCHISE_MAP map to themselves
    teamNames.forEach(t => {
      if (!handled.has(t)) {
        const key = t;
        if (!franchiseToTeams[key]) franchiseToTeams[key] = [];
        franchiseToTeams[key].push(t);
      }
    });

    // Build franchise labels
    franchiseLabels = {};
    for (const [fKey, teams] of Object.entries(franchiseToTeams)) {
      if (teams.length <= 1) {
        franchiseLabels[fKey] = teams[0] || fKey;
      } else {
        // Use cities: "Raiders (Oakland/LA/Las Vegas)"
        const cities = teams.map(t => t.replace(/ (Colts|Raiders|Chargers|Rams|Titans|Oilers|Cardinals|Commanders|Football Team|Redskins|Patriots)$/,"")).sort();
        franchiseLabels[fKey] = `${fKey} (${[...new Set(cities)].join(" / ")})`;
      }
    }
    franchiseNames = Object.keys(franchiseToTeams).sort();
  }

  function getFranchiseKey(teamName) {
    return FRANCHISE_MAP[teamName] || teamName;
  }

  function getTeamNamesForSelection(selection, franchiseMode) {
    if (!franchiseMode) return [selection];
    const fKey = getFranchiseKey(selection);
    return franchiseToTeams[fKey] || [selection];
  }

  // ── Populate shared dropdowns ──
  function populateDropdowns() {
    // Seasons
    const fromSel = document.getElementById("rf-season-from");
    const toSel = document.getElementById("rf-season-to");
    allSeasons.forEach(y => {
      fromSel.add(new Option(y, y));
      toSel.add(new Option(y, y));
    });
    fromSel.value = allSeasons[0];
    toSel.value = allSeasons[allSeasons.length - 1];

    // Teams (initial: individual names)
    populateTeamDropdown("rf-team", false);
    populateTeamDropdown("rf-opponent", false, true);
    populateTeamDropdown("h2h-teamA", false);
    populateTeamDropdown("h2h-teamB", false);

    // Weeks checkboxes
    const weeksDiv = document.getElementById("rf-weeks");
    allWeeks.forEach(w => {
      const lbl = document.createElement("label");
      lbl.innerHTML = `<input type="checkbox" value="${w}"> <span>${w}</span>`;
      weeksDiv.appendChild(lbl);
    });

    // Days checkboxes
    const daysDiv = document.getElementById("rf-days");
    allDays.forEach(d => {
      const lbl = document.createElement("label");
      lbl.innerHTML = `<input type="checkbox" value="${d}"> <span>${d}</span>`;
      daysDiv.appendChild(lbl);
    });

    // Primetime checkboxes
    const ptDiv = document.getElementById("rf-primetime");
    ["MNF", "SNF", "TNF", "Non-Primetime"].forEach(p => {
      const lbl = document.createElement("label");
      lbl.innerHTML = `<input type="checkbox" value="${p}"> <span>${p}</span>`;
      ptDiv.appendChild(lbl);
    });

    // Game Explorer dropdowns
    const geSeason = document.getElementById("ge-season");
    [...allSeasons].reverse().forEach(y => geSeason.add(new Option(y, y)));
    const geWeek = document.getElementById("ge-week");
    allWeeks.forEach(w => geWeek.add(new Option(w, w)));
    populateTeamDropdown("ge-team", false, true);
    const geDay = document.getElementById("ge-day");
    allDays.forEach(d => geDay.add(new Option(d, d)));
  }

  function populateTeamDropdown(id, franchiseMode, hasAll) {
    const sel = document.getElementById(id);
    const currentVal = sel.value;
    // Keep first option
    while (sel.options.length > 1) sel.remove(1);

    if (franchiseMode) {
      franchiseNames.forEach(fKey => {
        sel.add(new Option(franchiseLabels[fKey], fKey));
      });
    } else {
      teamNames.forEach(t => sel.add(new Option(t, t)));
    }
    sel.value = currentVal;
  }

  // ═══════════════════════════════════════════════
  // TAB MANAGEMENT
  // ═══════════════════════════════════════════════

  function setupTabs() {
    document.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");

        // Lazy-compute quick stats on first visit
        if (btn.dataset.tab === "quick-stats" && !quickStatsComputed) {
          setTimeout(computeQuickStats, 50);
        }
        // Trigger Game Explorer render on first visit
        if (btn.dataset.tab === "game-explorer") {
          renderGameExplorer();
        }
      });
    });
  }

  // ═══════════════════════════════════════════════
  // CORE ENGINE: computeRecord()
  // ═══════════════════════════════════════════════

  function computeRecord(teamOrKey, filters) {
    const tNames = getTeamNamesForSelection(teamOrKey, filters.franchiseMode);

    // Gather all game entries for these team names
    let entries = [];
    tNames.forEach(tn => {
      if (gamesByTeam[tn]) entries.push(...gamesByTeam[tn]);
    });

    // Apply filters
    const matched = entries.filter(({ game: g, isHome }) => {
      if (filters.location === "home" && !isHome) return false;
      if (filters.location === "away" && isHome) return false;
      if (g.s < filters.seasonFrom || g.s > filters.seasonTo) return false;
      if (filters.weeks && filters.weeks.size > 0 && !filters.weeks.has(g.w)) return false;
      if (filters.days && filters.days.size > 0 && !filters.days.has(g.d)) return false;

      if (filters.primetime && filters.primetime.size > 0) {
        const slot = g.pt || "Non-Primetime";
        if (!filters.primetime.has(slot)) return false;
      }

      if (filters.gameType === "regular" && PLAYOFF_WEEKS.has(g.w)) return false;
      if (filters.gameType === "playoffs" && !PLAYOFF_WEEKS.has(g.w)) return false;

      if (filters.opponent) {
        const opp = isHome ? g.a : g.h;
        if (filters.franchiseMode) {
          if (getFranchiseKey(opp) !== getFranchiseKey(filters.opponent)) return false;
        } else {
          if (opp !== filters.opponent) return false;
        }
      }

      return true;
    });

    // Compute stats
    let wins = 0, losses = 0, ties = 0, pf = 0, pa = 0;
    let atsCov = 0, atsLost = 0, atsPush = 0;
    let ouOver = 0, ouUnder = 0, ouPush = 0;
    matched.forEach(({ game: g, isHome }) => {
      const myPts = isHome ? g.hs : g.as;
      const oppPts = isHome ? g.as : g.hs;
      pf += myPts; pa += oppPts;
      if (myPts > oppPts) wins++;
      else if (myPts < oppPts) losses++;
      else ties++;
      // ATS stats (spread is always from home perspective)
      if (g.sr) {
        const sr = isHome ? g.sr : (g.sr === "Covered" ? "Lost" : g.sr === "Lost" ? "Covered" : g.sr);
        if (sr === "Covered") atsCov++;
        else if (sr === "Lost") atsLost++;
        else atsPush++;
      }
      if (g.our) {
        if (g.our === "Over") ouOver++;
        else if (g.our === "Under") ouUnder++;
        else ouPush++;
      }
    });

    const total = wins + losses + ties;
    const winPct = total > 0 ? (wins + ties * 0.5) / total : 0;

    // Streak (most recent first)
    const sorted = [...matched].sort((a, b) => {
      const cmp = b.game.dt.localeCompare(a.game.dt);
      return cmp !== 0 ? cmp : b.game.s - a.game.s;
    });
    let streakType = null, streakCount = 0;
    for (const { game: g, isHome } of sorted) {
      const myPts = isHome ? g.hs : g.as;
      const oppPts = isHome ? g.as : g.hs;
      const r = myPts > oppPts ? "W" : myPts < oppPts ? "L" : "T";
      if (!streakType) { streakType = r; streakCount = 1; }
      else if (r === streakType) streakCount++;
      else break;
    }

    const atsTotal = atsCov + atsLost + atsPush;
    const ouTotal = ouOver + ouUnder + ouPush;

    return {
      wins, losses, ties, total, winPct,
      ppgFor: total > 0 ? pf / total : 0,
      ppgAgainst: total > 0 ? pa / total : 0,
      avgMargin: total > 0 ? (pf - pa) / total : 0,
      streak: streakCount > 0 ? `${streakType}${streakCount}` : "--",
      atsCov, atsLost, atsPush, atsTotal,
      ouOver, ouUnder, ouPush, ouTotal,
      games: sorted,
    };
  }

  // ═══════════════════════════════════════════════
  // TAB 1: RECORD FINDER
  // ═══════════════════════════════════════════════

  function setupRecordFinder() {
    const ids = ["rf-team", "rf-season-from", "rf-season-to", "rf-opponent"];
    ids.forEach(id => document.getElementById(id).addEventListener("change", updateRecordFinder));

    document.querySelectorAll('input[name="rf-location"], input[name="rf-gametype"], input[name="rf-result"]')
      .forEach(el => el.addEventListener("change", updateRecordFinder));

    document.querySelectorAll("#rf-weeks input, #rf-days input, #rf-primetime input")
      .forEach(el => el.addEventListener("change", updateRecordFinder));

    document.getElementById("rf-franchise-mode").addEventListener("change", (e) => {
      const fm = e.target.checked;
      populateTeamDropdown("rf-team", fm);
      populateTeamDropdown("rf-opponent", fm, true);
      updateRecordFinder();
    });

    document.getElementById("rf-clear").addEventListener("click", () => {
      document.getElementById("rf-team").value = "";
      document.getElementById("rf-season-from").value = allSeasons[0];
      document.getElementById("rf-season-to").value = allSeasons[allSeasons.length - 1];
      document.getElementById("rf-opponent").value = "";
      document.querySelector('input[name="rf-location"][value="all"]').checked = true;
      document.querySelector('input[name="rf-gametype"][value="all"]').checked = true;
      document.querySelectorAll("#rf-weeks input, #rf-days input, #rf-primetime input")
        .forEach(cb => cb.checked = false);
      updateRecordFinder();
    });

    document.getElementById("rf-toggle-games").addEventListener("click", () => {
      const c = document.getElementById("rf-games-container");
      c.style.display = c.style.display === "none" ? "block" : "none";
    });
  }

  function getCheckedValues(containerId) {
    const els = document.querySelectorAll(`#${containerId} input:checked`);
    if (els.length === 0) return null;
    return new Set([...els].map(e => e.value));
  }

  function updateRecordFinder() {
    const team = document.getElementById("rf-team").value;
    if (!team) {
      document.getElementById("rf-results").style.display = "none";
      document.getElementById("rf-placeholder").style.display = "block";
      return;
    }
    document.getElementById("rf-results").style.display = "block";
    document.getElementById("rf-placeholder").style.display = "none";

    const franchiseMode = document.getElementById("rf-franchise-mode").checked;
    const filters = {
      franchiseMode,
      location: document.querySelector('input[name="rf-location"]:checked').value,
      gameType: document.querySelector('input[name="rf-gametype"]:checked').value,
      seasonFrom: parseInt(document.getElementById("rf-season-from").value),
      seasonTo: parseInt(document.getElementById("rf-season-to").value),
      weeks: getCheckedValues("rf-weeks"),
      days: getCheckedValues("rf-days"),
      primetime: getCheckedValues("rf-primetime"),
      opponent: document.getElementById("rf-opponent").value || "",
    };

    const result = computeRecord(team, filters);
    renderRecordFinder(team, filters, result);
  }

  function renderRecordFinder(team, filters, r) {
    // Team name
    const fm = filters.franchiseMode;
    const displayName = fm ? (franchiseLabels[getFranchiseKey(team)] || team) : team;
    document.getElementById("rf-display-team").textContent = displayName;

    // Record
    document.getElementById("rf-w").textContent = r.wins;
    document.getElementById("rf-l").textContent = r.losses;
    document.getElementById("rf-t").textContent = r.ties;
    document.getElementById("rf-pct").textContent = r.total > 0 ? r.winPct.toFixed(3) : ".000";

    // Stats
    document.getElementById("rf-ppg-for").textContent = r.ppgFor.toFixed(1);
    document.getElementById("rf-ppg-against").textContent = r.ppgAgainst.toFixed(1);
    const marginEl = document.getElementById("rf-avg-margin");
    marginEl.textContent = (r.avgMargin >= 0 ? "+" : "") + r.avgMargin.toFixed(1);
    marginEl.className = "stat-value " + (r.avgMargin >= 0 ? "positive" : "negative");
    document.getElementById("rf-streak").textContent = r.streak;

    // Filter summary
    const parts = [];
    if (filters.location !== "all") parts.push(filters.location === "home" ? "at Home" : "on the Road");
    if (filters.gameType !== "all") parts.push(filters.gameType === "regular" ? "Regular Season" : "Playoffs");
    if (filters.weeks) parts.push("Wk " + [...filters.weeks].join(", "));
    if (filters.days) parts.push([...filters.days].join(", "));
    if (filters.primetime) parts.push([...filters.primetime].join(", "));
    if (filters.opponent) parts.push("vs " + (fm ? franchiseLabels[getFranchiseKey(filters.opponent)] || filters.opponent : filters.opponent));
    if (filters.seasonFrom !== allSeasons[0] || filters.seasonTo !== allSeasons[allSeasons.length - 1]) {
      parts.push(`${filters.seasonFrom}–${filters.seasonTo}`);
    }
    document.getElementById("rf-summary").textContent = parts.length > 0 ? parts.join("  |  ") : "All Games";

    // ATS stats
    const atsRow = document.getElementById("rf-ats-row");
    if (r.atsTotal > 0) {
      atsRow.style.display = "";
      document.getElementById("rf-ats-record").textContent = `${r.atsCov}-${r.atsLost}-${r.atsPush}`;
      const atsPct = r.atsTotal > 0 ? (r.atsCov / (r.atsCov + r.atsLost)) * 100 : 0;
      const atsPctEl = document.getElementById("rf-ats-pct");
      atsPctEl.textContent = atsPct.toFixed(1) + "%";
      atsPctEl.className = "stat-value " + (atsPct >= 50 ? "positive" : "negative");
      document.getElementById("rf-ou-record").textContent = `${r.ouOver}-${r.ouUnder}-${r.ouPush}`;
      const ouPct = r.ouTotal > 0 ? (r.ouOver / (r.ouOver + r.ouUnder)) * 100 : 0;
      document.getElementById("rf-ou-pct").textContent = ouPct.toFixed(1) + "%";
    } else {
      atsRow.style.display = "none";
    }

    // Game count
    document.getElementById("rf-game-count").textContent = r.total;

    // Games table
    const tbody = document.getElementById("rf-games-body");
    if (r.total === 0) {
      tbody.innerHTML = '<tr><td colspan="16" style="text-align:center;color:#556;padding:1.5rem">No matching games</td></tr>';
      return;
    }

    // Determine which team names we're looking at
    const myTeams = new Set(getTeamNamesForSelection(
      document.getElementById("rf-team").value,
      filters.franchiseMode
    ));

    tbody.innerHTML = r.games.map(({ game: g, isHome }) => {
      const myPts = isHome ? g.hs : g.as;
      const oppPts = isHome ? g.as : g.hs;
      const opp = isHome ? g.a : g.h;
      const res = myPts > oppPts ? "W" : myPts < oppPts ? "L" : "T";
      const cls = res === "W" ? "win-cell" : res === "L" ? "loss-cell" : "tie-cell";
      const ptBadge = g.pt ? `<span class="badge badge-${g.pt.toLowerCase().replace(/\s+/g,'')}">${g.pt}</span>` : "";

      // Spread data (flip for away team perspective)
      let spreadDisplay = "";
      let ouDisplay = "";
      let atsDisplay = "";
      let ourDisplay = "";
      if (g.sp != null) {
        const teamSpread = isHome ? g.sp : -g.sp;
        spreadDisplay = (teamSpread > 0 ? "+" : "") + teamSpread;
      }
      if (g.ou != null) ouDisplay = g.ou;
      if (g.sr) {
        const sr = isHome ? g.sr : (g.sr === "Covered" ? "Lost" : g.sr === "Lost" ? "Covered" : g.sr);
        const srCls = sr === "Covered" ? "win-cell" : sr === "Lost" ? "loss-cell" : "tie-cell";
        atsDisplay = `<span class="${srCls}">${sr}</span>`;
      }
      if (g.our) {
        ourDisplay = g.our;
      }

      // Weather data
      const tempDisplay = g.tp != null ? g.tp + "°" : "";
      const windDisplay = g.wi || "";
      const condDisplay = g.cd || "";

      return `<tr>
        <td>${g.s}</td><td>${g.w}</td><td>${g.dt}</td><td>${g.d}</td>
        <td>${esc(opp)}</td><td>${isHome ? "Home" : "Away"}</td>
        <td>${myPts} – ${oppPts}</td><td class="${cls}">${res}</td><td>${ptBadge}</td>
        <td>${spreadDisplay}</td><td>${ouDisplay}</td><td>${atsDisplay}</td><td>${ourDisplay}</td>
        <td>${tempDisplay}</td><td>${windDisplay}</td><td>${condDisplay}</td>
      </tr>`;
    }).join("");
  }

  // ═══════════════════════════════════════════════
  // TAB 2: HEAD TO HEAD
  // ═══════════════════════════════════════════════

  function setupHeadToHead() {
    ["h2h-teamA", "h2h-teamB"].forEach(id =>
      document.getElementById(id).addEventListener("change", updateH2H));
    document.getElementById("h2h-franchise-mode").addEventListener("change", (e) => {
      const fm = e.target.checked;
      populateTeamDropdown("h2h-teamA", fm);
      populateTeamDropdown("h2h-teamB", fm);
      updateH2H();
    });
  }

  function updateH2H() {
    const a = document.getElementById("h2h-teamA").value;
    const b = document.getElementById("h2h-teamB").value;
    if (!a || !b || a === b) {
      document.getElementById("h2h-results").style.display = "none";
      document.getElementById("h2h-placeholder").style.display = "block";
      return;
    }
    document.getElementById("h2h-results").style.display = "block";
    document.getElementById("h2h-placeholder").style.display = "none";

    const fm = document.getElementById("h2h-franchise-mode").checked;
    const aNamesSet = new Set(getTeamNamesForSelection(a, fm));
    const bNamesSet = new Set(getTeamNamesForSelection(b, fm));

    // Find all games between A and B
    const matchups = [];
    NFL_GAMES.forEach(g => {
      const homeIsA = aNamesSet.has(g.h) && bNamesSet.has(g.a);
      const homeIsB = bNamesSet.has(g.h) && aNamesSet.has(g.a);
      if (homeIsA) matchups.push({ game: g, aIsHome: true });
      else if (homeIsB) matchups.push({ game: g, aIsHome: false });
    });

    matchups.sort((x, y) => x.game.dt.localeCompare(y.game.dt));

    // Compute overall
    let wA = 0, wB = 0, ties = 0;
    let wA_atA = 0, wB_atA = 0, tA = 0; // at A's home
    let wA_atB = 0, wB_atB = 0, tB = 0; // at B's home
    let wA_p = 0, wB_p = 0, tP = 0;     // playoffs
    const byDecade = {};

    matchups.forEach(({ game: g, aIsHome }) => {
      const aPts = aIsHome ? g.hs : g.as;
      const bPts = aIsHome ? g.as : g.hs;
      const res = aPts > bPts ? "A" : aPts < bPts ? "B" : "T";

      if (res === "A") wA++; else if (res === "B") wB++; else ties++;

      if (aIsHome) {
        if (res === "A") wA_atA++; else if (res === "B") wB_atA++; else tA++;
      } else {
        if (res === "A") wA_atB++; else if (res === "B") wB_atB++; else tB++;
      }

      if (PLAYOFF_WEEKS.has(g.w)) {
        if (res === "A") wA_p++; else if (res === "B") wB_p++; else tP++;
      }

      const decade = Math.floor(g.s / 10) * 10;
      if (!byDecade[decade]) byDecade[decade] = { a: 0, b: 0, t: 0 };
      if (res === "A") byDecade[decade].a++; else if (res === "B") byDecade[decade].b++; else byDecade[decade].t++;
    });

    const nameA = fm ? (franchiseLabels[getFranchiseKey(a)] || a) : a;
    const nameB = fm ? (franchiseLabels[getFranchiseKey(b)] || b) : b;

    // Render overall
    document.getElementById("h2h-nameA").textContent = nameA;
    document.getElementById("h2h-nameB").textContent = nameB;
    document.getElementById("h2h-winsA").textContent = wA;
    document.getElementById("h2h-winsB").textContent = wB;
    document.getElementById("h2h-ties").textContent = ties;

    // Breakdowns
    const renderCard = (el, label, wAv, wBv, tv) => {
      el.innerHTML = `<div class="stat-label">${esc(label)}</div><div class="stat-value">${wAv} – ${wBv}${tv > 0 ? ` – ${tv}` : ""}</div>`;
    };
    renderCard(document.getElementById("h2h-at-a"), `At ${nameA}'s Home`, wA_atA, wB_atA, tA);
    renderCard(document.getElementById("h2h-at-b"), `At ${nameB}'s Home`, wA_atB, wB_atB, tB);
    renderCard(document.getElementById("h2h-playoffs"), "Playoff Meetings", wA_p, wB_p, tP);

    // Decade table
    document.getElementById("h2h-dec-colA").textContent = nameA;
    document.getElementById("h2h-dec-colB").textContent = nameB;
    const decades = Object.keys(byDecade).sort();
    document.getElementById("h2h-decade-body").innerHTML = decades.map(d =>
      `<tr><td>${d}s</td><td>${byDecade[d].a}</td><td>${byDecade[d].b}</td><td>${byDecade[d].t}</td></tr>`
    ).join("");

    // Last 10
    const recent = [...matchups].reverse().slice(0, 10);
    document.getElementById("h2h-recent-body").innerHTML = renderMatchupRows(recent);

    // All matchups
    document.getElementById("h2h-total").textContent = matchups.length;
    document.getElementById("h2h-all-body").innerHTML = renderMatchupRows([...matchups].reverse(), true);
  }

  function renderMatchupRows(matchups, showPT) {
    return matchups.map(({ game: g }) => {
      const winner = g.hs > g.as ? "h" : g.as > g.hs ? "a" : "";
      const hCls = winner === "h" ? "win-cell" : winner === "a" ? "loss-cell" : "";
      const aCls = winner === "a" ? "win-cell" : winner === "h" ? "loss-cell" : "";
      const pt = showPT && g.pt ? `<td><span class="badge badge-${g.pt.toLowerCase().replace(/\s+/g,'')}">${g.pt}</span></td>` : (showPT ? "<td></td>" : "");
      return `<tr><td>${g.dt}</td><td>${g.s}</td><td>${g.w}</td><td>${esc(g.h)}</td><td class="${hCls}">${g.hs}</td><td>${esc(g.a)}</td><td class="${aCls}">${g.as}</td>${pt}</tr>`;
    }).join("");
  }

  // ═══════════════════════════════════════════════
  // TAB 3: GAME EXPLORER
  // ═══════════════════════════════════════════════

  function setupGameExplorer() {
    ["ge-search"].forEach(id => document.getElementById(id).addEventListener("input", () => { gePage = 1; renderGameExplorer(); }));
    ["ge-season", "ge-week", "ge-team", "ge-day", "ge-primetime"].forEach(id =>
      document.getElementById(id).addEventListener("change", () => { gePage = 1; renderGameExplorer(); }));

    document.getElementById("ge-clear").addEventListener("click", () => {
      document.getElementById("ge-search").value = "";
      ["ge-season", "ge-week", "ge-team", "ge-day", "ge-primetime"].forEach(id =>
        document.getElementById(id).value = "");
      gePage = 1;
      renderGameExplorer();
    });

    document.querySelectorAll("#ge-table th.sortable").forEach(th => {
      th.addEventListener("click", () => {
        const col = th.dataset.sort;
        if (geSortCol === col) geSortDir = geSortDir === "asc" ? "desc" : "asc";
        else { geSortCol = col; geSortDir = "asc"; }
        document.querySelectorAll("#ge-table th").forEach(h => h.classList.remove("sort-asc", "sort-desc"));
        th.classList.add(geSortDir === "asc" ? "sort-asc" : "sort-desc");
        renderGameExplorer();
      });
    });
  }

  function getGEFiltered() {
    const search = document.getElementById("ge-search").value.toLowerCase().trim();
    const season = document.getElementById("ge-season").value;
    const week = document.getElementById("ge-week").value;
    const team = document.getElementById("ge-team").value;
    const day = document.getElementById("ge-day").value;
    const pt = document.getElementById("ge-primetime").value;

    return NFL_GAMES.filter(g => {
      if (search && !g.h.toLowerCase().includes(search) && !g.a.toLowerCase().includes(search)) return false;
      if (season && g.s !== Number(season)) return false;
      if (week && g.w !== week) return false;
      if (team && g.h !== team && g.a !== team) return false;
      if (day && g.d !== day) return false;
      if (pt === "none" && g.pt) return false;
      if (pt && pt !== "none" && g.pt !== pt) return false;
      return true;
    });
  }

  function sortGEGames(games) {
    const dir = geSortDir === "asc" ? 1 : -1;
    return games.sort((a, b) => {
      let va = a[geSortCol], vb = b[geSortCol];
      if (geSortCol === "w") {
        va = WEEK_ORDER.indexOf(a.w); vb = WEEK_ORDER.indexOf(b.w);
        if (va < 0) va = 99; if (vb < 0) vb = 99;
      }
      if (typeof va === "number") return dir * (va - vb);
      return dir * String(va || "").localeCompare(String(vb || ""));
    });
  }

  function renderGameExplorer() {
    const filtered = sortGEGames(getGEFiltered());
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / GE_PAGE_SIZE));
    gePage = Math.min(gePage, totalPages);

    const start = (gePage - 1) * GE_PAGE_SIZE;
    const pageGames = filtered.slice(start, start + GE_PAGE_SIZE);

    document.getElementById("ge-showing").textContent = total;
    document.getElementById("ge-total").textContent = NFL_GAMES.length;

    const tbody = document.getElementById("ge-body");
    if (total === 0) {
      tbody.innerHTML = '<tr><td colspan="18" style="text-align:center;color:#556;padding:1.5rem">No games match</td></tr>';
    } else {
      tbody.innerHTML = pageGames.map(g => {
        const diff = Math.abs(g.hs - g.as);
        const winner = g.hs > g.as ? "h" : g.as > g.hs ? "a" : "";
        const hCls = winner === "h" ? "win-cell" : winner === "a" ? "loss-cell" : "";
        const aCls = winner === "a" ? "win-cell" : winner === "h" ? "loss-cell" : "";
        const ptBadge = g.pt ? `<span class="badge badge-${g.pt.toLowerCase().replace(/\s+/g,'')}">${g.pt}</span>` : "";

        // Spread data
        const spreadDisplay = g.sp != null ? ((g.sp > 0 ? "+" : "") + g.sp) : "";
        const ouDisplay = g.ou != null ? g.ou : "";
        const srCls = g.sr === "Covered" ? "win-cell" : g.sr === "Lost" ? "loss-cell" : g.sr === "Push" ? "tie-cell" : "";
        const srDisplay = g.sr || "";
        const ourDisplay = g.our || "";

        // Weather data
        const tempDisplay = g.tp != null ? g.tp + "°" : "";
        const windDisplay = g.wi || "";
        const condDisplay = g.cd || "";

        return `<tr>
          <td>${g.s}</td><td>${g.w}</td><td>${g.dt}</td><td>${g.d}</td>
          <td class="${aCls}">${esc(g.a)}</td><td class="${aCls}">${g.as}</td>
          <td class="at-col">@</td>
          <td class="${hCls}">${esc(g.h)}</td><td class="${hCls}">${g.hs}</td>
          <td>${diff}</td><td>${ptBadge}</td>
          <td>${spreadDisplay}</td><td>${ouDisplay}</td>
          <td class="${srCls}">${srDisplay}</td><td>${ourDisplay}</td>
          <td>${tempDisplay}</td><td>${windDisplay}</td><td>${condDisplay}</td>
        </tr>`;
      }).join("");
    }

    // Pagination
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    const container = document.getElementById("ge-pagination");
    if (totalPages <= 1) { container.innerHTML = ""; return; }

    let html = `<button ${gePage <= 1 ? "disabled" : ""} data-page="${gePage - 1}">&laquo; Prev</button>`;

    // Smart page range
    const range = [];
    range.push(1);
    for (let i = Math.max(2, gePage - 2); i <= Math.min(totalPages - 1, gePage + 2); i++) range.push(i);
    if (totalPages > 1) range.push(totalPages);
    const unique = [...new Set(range)].sort((a, b) => a - b);

    let prev = 0;
    unique.forEach(p => {
      if (p - prev > 1) html += `<span style="color:#556;padding:0 0.3rem">...</span>`;
      html += `<button class="${p === gePage ? "active" : ""}" data-page="${p}">${p}</button>`;
      prev = p;
    });

    html += `<button ${gePage >= totalPages ? "disabled" : ""} data-page="${gePage + 1}">Next &raquo;</button>`;
    container.innerHTML = html;

    container.querySelectorAll("button[data-page]").forEach(btn => {
      btn.addEventListener("click", () => {
        gePage = parseInt(btn.dataset.page);
        renderGameExplorer();
        document.getElementById("ge-table").scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  // ═══════════════════════════════════════════════
  // TAB 4: QUICK STATS
  // ═══════════════════════════════════════════════

  function computeQuickStats() {
    const cards = [];

    // 1. Best Home Record (min 100 games)
    const homeRecords = computeTeamRecords(true, false, null);
    const bestHome = homeRecords.filter(r => r.total >= 100).sort((a, b) => b.winPct - a.winPct)[0];
    if (bestHome) {
      cards.push(makeQSCard("Best Home Record (All-Time)", `${bestHome.wins}-${bestHome.losses}-${bestHome.ties}`,
        `${bestHome.name}`, `${bestHome.winPct.toFixed(3)} win% | ${bestHome.total} games`));
    }

    // 2. Best Road Record (min 100 games)
    const roadRecords = computeTeamRecords(false, true, null);
    const bestRoad = roadRecords.filter(r => r.total >= 100).sort((a, b) => b.winPct - a.winPct)[0];
    if (bestRoad) {
      cards.push(makeQSCard("Best Road Record (All-Time)", `${bestRoad.wins}-${bestRoad.losses}-${bestRoad.ties}`,
        `${bestRoad.name}`, `${bestRoad.winPct.toFixed(3)} win% | ${bestRoad.total} games`));
    }

    // 3. Best MNF Record (min 15 games)
    const mnfRecords = computeTeamRecords(null, null, "MNF");
    const bestMNF = mnfRecords.filter(r => r.total >= 15).sort((a, b) => b.winPct - a.winPct)[0];
    if (bestMNF) {
      cards.push(makeQSCard("Best Monday Night Record", `${bestMNF.wins}-${bestMNF.losses}-${bestMNF.ties}`,
        `${bestMNF.name}`, `${bestMNF.winPct.toFixed(3)} win% | ${bestMNF.total} MNF games`));
    }

    // 4. Longest Winning Streak
    const streak = findLongestStreak();
    if (streak) {
      cards.push(makeQSCard("Longest Winning Streak", `${streak.count} games`,
        `${streak.name}`, `${streak.startDate} to ${streak.endDate}`));
    }

    // 5. Biggest Blowout
    let biggestGame = null, biggestDiff = 0;
    NFL_GAMES.forEach(g => {
      const diff = Math.abs(g.hs - g.as);
      if (diff > biggestDiff) { biggestDiff = diff; biggestGame = g; }
    });
    if (biggestGame) {
      const w = biggestGame.hs > biggestGame.as ? biggestGame.h : biggestGame.a;
      const wPts = Math.max(biggestGame.hs, biggestGame.as);
      const lPts = Math.min(biggestGame.hs, biggestGame.as);
      cards.push(makeQSCard("Biggest Blowout", `${biggestDiff} points`,
        `${wPts} – ${lPts}`, `${w} | ${biggestGame.dt}`));
    }

    // 6. Most Common Final Score
    const scoreCounts = {};
    NFL_GAMES.forEach(g => {
      const hi = Math.max(g.hs, g.as), lo = Math.min(g.hs, g.as);
      const key = `${hi}-${lo}`;
      scoreCounts[key] = (scoreCounts[key] || 0) + 1;
    });
    const topScore = Object.entries(scoreCounts).sort((a, b) => b[1] - a[1])[0];
    if (topScore) {
      cards.push(makeQSCard("Most Common Final Score", topScore[0],
        `${topScore[1]} games`, `out of ${NFL_GAMES.length} total`));
    }

    // 7. Highest Scoring Game
    let highGame = null, highTotal = 0;
    NFL_GAMES.forEach(g => {
      const t = g.hs + g.as;
      if (t > highTotal) { highTotal = t; highGame = g; }
    });
    if (highGame) {
      cards.push(makeQSCard("Highest Scoring Game", `${highTotal} points`,
        `${highGame.a} ${highGame.as} @ ${highGame.h} ${highGame.hs}`, highGame.dt));
    }

    // 8. Best ATS Record (min 50 games with spread data, since 2014)
    const atsRecords = computeATSRecords();
    const bestATS = atsRecords.filter(r => r.total >= 50).sort((a, b) => b.atsPct - a.atsPct)[0];
    if (bestATS) {
      cards.push(makeQSCard("Best ATS Record (2014+)", `${bestATS.cov}-${bestATS.lost}-${bestATS.push}`,
        `${bestATS.name}`, `${bestATS.atsPct.toFixed(1)}% cover rate | ${bestATS.total} games`));
    }

    // 9. Lowest Scoring Game
    let lowGame = null, lowTotal = Infinity;
    NFL_GAMES.forEach(g => {
      const t = g.hs + g.as;
      if (t > 0 && t < lowTotal) { lowTotal = t; lowGame = g; }
    });
    if (lowGame) {
      cards.push(makeQSCard("Lowest Scoring Game", `${lowTotal} points`,
        `${lowGame.a} ${lowGame.as} @ ${lowGame.h} ${lowGame.hs}`, lowGame.dt));
    }

    // Render
    document.getElementById("qs-grid").innerHTML = cards.join("");
    quickStatsComputed = true;
  }

  function makeQSCard(title, value, detail, sub) {
    return `<div class="qs-card">
      <div class="qs-title">${esc(title)}</div>
      <div class="qs-value">${esc(value)}</div>
      <div class="qs-detail">${esc(detail)}</div>
      ${sub ? `<div class="qs-sub">${esc(sub)}</div>` : ""}
    </div>`;
  }

  function computeTeamRecords(homeOnly, awayOnly, primetimeSlot) {
    // Compute per-franchise records
    const records = {};
    for (const [fKey, teams] of Object.entries(franchiseToTeams)) {
      let w = 0, l = 0, t = 0;
      teams.forEach(tn => {
        (gamesByTeam[tn] || []).forEach(({ game: g, isHome }) => {
          if (homeOnly === true && !isHome) return;
          if (awayOnly === true && isHome) return;
          if (primetimeSlot && g.pt !== primetimeSlot) return;
          const myPts = isHome ? g.hs : g.as;
          const oppPts = isHome ? g.as : g.hs;
          if (myPts > oppPts) w++; else if (myPts < oppPts) l++; else t++;
        });
      });
      const total = w + l + t;
      records[fKey] = { name: franchiseLabels[fKey] || fKey, wins: w, losses: l, ties: t, total, winPct: total > 0 ? (w + t * 0.5) / total : 0 };
    }
    return Object.values(records);
  }

  function findLongestStreak() {
    let best = { name: "", count: 0, startDate: "", endDate: "" };
    for (const [fKey, teams] of Object.entries(franchiseToTeams)) {
      // Collect all games for this franchise, sorted by date
      let allEntries = [];
      teams.forEach(tn => {
        (gamesByTeam[tn] || []).forEach(e => allEntries.push(e));
      });
      allEntries.sort((a, b) => a.game.dt.localeCompare(b.game.dt));

      let streak = 0, startDt = "";
      for (const { game: g, isHome } of allEntries) {
        const myPts = isHome ? g.hs : g.as;
        const oppPts = isHome ? g.as : g.hs;
        if (myPts > oppPts) {
          if (streak === 0) startDt = g.dt;
          streak++;
          if (streak > best.count) {
            best = { name: franchiseLabels[fKey] || fKey, count: streak, startDate: startDt, endDate: g.dt };
          }
        } else {
          streak = 0;
        }
      }
    }
    return best.count > 0 ? best : null;
  }

  function computeATSRecords() {
    const records = {};
    for (const [fKey, teams] of Object.entries(franchiseToTeams)) {
      let cov = 0, lost = 0, push = 0;
      teams.forEach(tn => {
        (gamesByTeam[tn] || []).forEach(({ game: g, isHome }) => {
          if (!g.sr) return;
          // Flip result for away team
          const sr = isHome ? g.sr : (g.sr === "Covered" ? "Lost" : g.sr === "Lost" ? "Covered" : g.sr);
          if (sr === "Covered") cov++;
          else if (sr === "Lost") lost++;
          else push++;
        });
      });
      const total = cov + lost + push;
      records[fKey] = {
        name: franchiseLabels[fKey] || fKey,
        cov, lost, push, total,
        atsPct: (cov + lost) > 0 ? (cov / (cov + lost)) * 100 : 0
      };
    }
    return Object.values(records);
  }

  // ── Utility ──
  function esc(s) {
    const d = document.createElement("div");
    d.textContent = String(s || "");
    return d.innerHTML;
  }

  // ── Boot ──
  document.addEventListener("DOMContentLoaded", init);
})();
