/* ============================================================================
   Family tree viewer — app logic
   Library: family-chart by donatso (MIT). Loaded globally as `f3`.
   Data:    window.FAMILY_DATA (see js/data.js)
   ==========================================================================*/
(function () {
  "use strict";

  // The person the tree opens on. Tapping any card re-centers on them instead.
  var INITIAL_FOCUS_ID = "john";

  // The recenter slide is FUNCTIONAL motion — it shows WHERE the newly focused
  // person sits relative to the old one, so tapping across the family reads as
  // travel, not teleport. It therefore always animates at the same duration,
  // independent of the OS "reduce motion" setting (this restores the feel the
  // tree shipped with; a prior build zeroed it under reduce-motion, which turned
  // every recenter into a hard snap). Reduce-motion is still honored for the
  // DECORATIVE micro-motion (card hover-lift, panel + input transitions) over in
  // css/styles.css. The perf win is independent of this number: it comes from
  // the static card shadow + the motion-window GPU promotion below, not from a
  // short tween — so keeping the full slide costs nothing in raster.
  var TRANSITION_MS = 700;

  /* ---- helpers ---------------------------------------------------------- */

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // "1980-05-23" -> "May 23, 1980"; "1976-12" -> "Dec 1976"; null -> ""
  function formatBirthday(iso) {
    if (!iso) return "";
    var parts = String(iso).split("-");
    var y = parts[0], m = parts[1], d = parts[2];
    if (!y) return "";
    if (!m) return y;
    var mon = MONTHS[parseInt(m, 10) - 1] || "";
    if (!d) return mon + " " + y;
    return mon + " " + parseInt(d, 10) + ", " + y;
  }

  function initials(first, last) {
    var a = (first || "").trim().charAt(0);
    var b = (last || "").trim().charAt(0);
    return (a + b).toUpperCase() || "?";
  }

  // Deterministic chip color from an id, so a person's monogram chip is always
  // the same across renders (hash the id, never re-roll on refresh). Maps to one
  // of the seven muted --chip-N tokens in css/styles.css via a .ft-chip-N class.
  var CHIP_COUNT = 7;
  function chipIndex(id) {
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return (h % CHIP_COUNT) + 1;   // 1..7
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // "1980-05-23" -> "1980"; "1976" -> "1976"; null/partial -> ""
  function birthYear(iso) {
    if (!iso) return "";
    var y = String(iso).split("-")[0];
    return /^\d{4}$/.test(y) ? y : "";
  }

  /* ---- person index ----------------------------------------------------- */
  // id -> the raw person record ({ id, data, rels }). Precomputed once so the
  // search and relative-traversal below stay O(1) per lookup at 130 people.
  var byId = Object.create(null);
  (window.FAMILY_DATA || []).forEach(function (p) { byId[p.id] = p; });

  // The family-chart library NORMALIZES each person's `rels` in place when it
  // renders: it collapses `father`/`mother` into a single `parents` array (and
  // tags the focused node). That mutation happens on the very objects `byId`
  // points at, so by the time a detail panel opens, `rels.father`/`rels.mother`
  // are gone. Snapshot the raw parent/child/spouse links NOW, before the chart
  // is built, so relative traversal reads a stable shape regardless of what the
  // library does to `rels` afterward. father/mother collapse into `parents`
  // here too, which is exactly the graph shape the traversal wants.
  var rawRels = Object.create(null);
  (window.FAMILY_DATA || []).forEach(function (p) {
    var r = (p && p.rels) || {};
    rawRels[p.id] = {
      parents: [r.father, r.mother].filter(Boolean),
      children: (r.children || []).slice(),
      spouses: (r.spouses || []).slice()
    };
  });

  function personData(id) { var p = byId[id]; return p ? p.data : null; }
  function fullName(id) {
    var p = personData(id); if (!p) return "";
    return ((p["first name"] || "") + " " + (p["last name"] || "")).trim();
  }

  /* ---- relative traversal ----------------------------------------------- *
     Pure, in-memory graph walk over the existing rels (spouses/father/mother/
     children). Categories are computed by structure, deduped (a person lands in
     only ONE category, closest-first), and ghost/placeholder connectors are
     traversed THROUGH but never listed by name. A category that resolves to
     nothing (or only ghosts) is omitted entirely, so sparse-data people don't
     show a wall of empty headers. Deeper tiers (2nd cousins, grandparents'
     siblings) stay sparse until more ancestors are entered. */
  function computeRelatives(focusId) {
    function exists(id) { return !!byId[id]; }
    function isGhost(id) { var p = byId[id]; return !!(p && p.data && p.data.placeholder === true); }
    // Read the pre-chart snapshot, not the live (library-mutated) `rels`.
    function rels(id) { return rawRels[id] || {}; }
    function parentsOf(id) {                 // includes ghost parents (for traversal)
      var r = rels(id), out = [];
      (r.parents || []).forEach(function (p) { if (exists(p)) out.push(p); });
      return out;
    }
    function childrenOf(id) {
      var r = rels(id), out = [];
      (r.children || []).forEach(function (c) { if (exists(c)) out.push(c); });
      return out;
    }
    function spousesOf(id) {
      var r = rels(id), out = [];
      (r.spouses || []).forEach(function (s) { if (exists(s)) out.push(s); });
      return out;
    }
    // Everyone sharing >=1 parent with `id` (parents include ghosts, so siblings
    // linked only through a placeholder connector still surface).
    function siblingIdsOf(id) {
      var set = Object.create(null);
      parentsOf(id).forEach(function (p) {
        childrenOf(p).forEach(function (c) { if (c !== id) set[c] = true; });
      });
      return Object.keys(set);
    }
    // Are a and b HALF-siblings? Full = both parents shared; half = exactly one
    // shared AND positive evidence of a distinct KNOWN (non-ghost) other parent.
    // Sharing one parent where the other side is only unknown/ghost is treated as
    // full (the connector case). Shared by Siblings, Aunts/Uncles, and the
    // spouse-side nieces below so "half" is decided one consistent way everywhere.
    function siblingHalf(aId, bId) {
      var ap = parentsOf(aId), bp = parentsOf(bId);
      var shared = bp.filter(function (p) { return ap.indexOf(p) >= 0; });
      if (shared.length >= 2) return false;
      var distinct = ap.concat(bp).filter(function (p) { return shared.indexOf(p) < 0; });
      return distinct.some(function (p) { return !isGhost(p); });
    }
    function keys(o) { return Object.keys(o); }

    // Grandparents = parents' parents.
    var grand = Object.create(null);
    parentsOf(focusId).forEach(function (p) {
      parentsOf(p).forEach(function (gp) { grand[gp] = true; });
    });

    // Parents.
    var parents = parentsOf(focusId);

    // Siblings, flagged full vs half via the shared siblingHalf rule above.
    var myParents = parentsOf(focusId);
    var sibs = siblingIdsOf(focusId).map(function (sid) {
      return { id: sid, half: siblingHalf(focusId, sid) };
    });

    // Aunts/uncles = blood siblings of the parents, plus their spouses (by
    // marriage). A blood aunt/uncle is HALF when they're a half-sibling of the
    // parent they connect through; if reachable as a full sibling via any parent
    // path, full wins.
    var auBlood = Object.create(null);   // id -> present
    var auHalf  = Object.create(null);   // id -> half-blood aunt/uncle?
    parentsOf(focusId).forEach(function (p) {
      siblingIdsOf(p).forEach(function (s) {
        var h = siblingHalf(p, s);
        if (auBlood[s]) auHalf[s] = auHalf[s] && h;
        else { auBlood[s] = true; auHalf[s] = h; }
      });
    });
    var auMarriage = Object.create(null);
    keys(auBlood).forEach(function (au) {
      spousesOf(au).forEach(function (sp) { if (!auBlood[sp]) auMarriage[sp] = true; });
    });

    /* ---- blood kinship via most-recent-common-ancestor (MRCA) -------------
       The old cousin walks only bucketed SAME-generation cousins (1st/2nd), so
       anyone "removed" (a different generation — e.g. a parent's first cousin's
       child) fell through and vanished. This replaces them with the canonical
       kinship formula. For each person X, walk both ancestor chains up through
       father/mother (ghost connectors INCLUDED as real generations, min distance
       to each ancestor), find the common ancestor minimizing a+b (the MOST recent
       one), and read the relationship straight off its two leg-lengths:
           a = focus->CA,  b = X->CA,  cousinDegree = min(a,b) - 1,  removed = |a-b|.
       Direct line, siblings, and (blood + by-marriage) aunts/uncles keep their
       existing explicit walks above; the engine EMITS only the tiers those don't
       cover, and the shared `seen` dedupe below lets the closer/explicit category
       win for anyone reachable two ways. Only 1st/2nd cousins and up-to-TWICE
       removed are shown (per John); anything more distant is counted, not listed. */
    function ancestorsOf(id) {                 // {ancestorId: minDistance}, self at 0
      var dist = Object.create(null);
      dist[id] = 0;
      var queue = [id], head = 0;
      while (head < queue.length) {
        var cur = queue[head++], cd = dist[cur];
        parentsOf(cur).forEach(function (p) {
          if (dist[p] === undefined || cd + 1 < dist[p]) { dist[p] = cd + 1; queue.push(p); }
        });
      }
      return dist;
    }
    var ancFocus = ancestorsOf(focusId);
    var nieces      = Object.create(null);     // sibling's descendant, 1 down  (removed 1)
    var grandNieces = Object.create(null);     //                       2 down  (removed 2)
    var grandAunts  = Object.create(null);     // grandparent's sibling, up     (removed 2)
    var cousins = {                            // cousins[degree][removed] -> id set
      1: [Object.create(null), Object.create(null), Object.create(null)],
      2: [Object.create(null), Object.create(null), Object.create(null)]
    };
    // Blood-relative half flags for the MRCA tiers (cousins, nieces/nephews,
    // grand-nieces, grand-aunts). HALF when the most-recent common ancestor is a
    // SINGLE person, not a full ancestral COUPLE: i.e. the two lines share only
    // ONE ancestor at the MRCA generation (bestA/bestB legs), not that ancestor's
    // partner. Counting common ancestors at exactly those legs gives 2 for a
    // shared couple (full) and 1 for a lone shared ancestor (half). This is the
    // same idea as siblingHalf, generalized one tier out and up.
    var half = Object.create(null);            // id -> half blood relationship?
    keys(byId).forEach(function (xid) {
      if (xid === focusId) return;
      var ancX = ancestorsOf(xid);
      var bestA = -1, bestB = -1, bestSum = Infinity, bestMax = Infinity;
      keys(ancFocus).forEach(function (ca) {   // pick the most-recent common ancestor
        if (ancX[ca] === undefined) return;
        var a = ancFocus[ca], b = ancX[ca], sum = a + b, mx = a > b ? a : b;
        if (sum < bestSum || (sum === bestSum && mx < bestMax)) {
          bestSum = sum; bestMax = mx; bestA = a; bestB = b;
        }
      });
      if (bestSum === Infinity) return;         // no common ancestor: unrelated by blood
      var coupleCount = 0;                      // shared ancestors at the MRCA generation
      keys(ancFocus).forEach(function (ca) {
        if (ancX[ca] !== undefined && ancFocus[ca] === bestA && ancX[ca] === bestB) coupleCount++;
      });
      half[xid] = coupleCount < 2;
      var minAB   = bestA < bestB ? bestA : bestB;
      var removed = bestA > bestB ? bestA - bestB : bestB - bestA;
      if (minAB === 0) return;                  // direct line: grandparents/parents/children/etc.
      if (minAB === 1) {                        // sibling line
        if (removed === 0) return;              //   sibling: existing (keeps "(half)")
        if (bestA > bestB) {                    //   ancestor side (up)
          if (removed === 1) return;            //     aunt/uncle: existing (keeps by-marriage)
          else if (removed === 2) grandAunts[xid] = true;
          //   else great-grand-aunt/uncle+ : omit (too distant to list)
        } else {                                //   descendant side (down)
          if (removed === 1) nieces[xid] = true;
          else if (removed === 2) grandNieces[xid] = true;
          //   else great-grand-niece/nephew+ : omit
        }
        return;
      }
      var degree = minAB - 1;                   // minAB >= 2: cousins
      if (degree > 2 || removed > 2) return;    // only 1st/2nd, <= twice removed; farther omitted
      cousins[degree][removed][xid] = true;
    });

    // Direct descendants: children, then their children.
    var children = childrenOf(focusId);
    var grandchildren = Object.create(null);
    children.forEach(function (c) { childrenOf(c).forEach(function (gc) { grandchildren[gc] = true; }); });

    // Nieces/nephews BY MARRIAGE = children of the focus's SPOUSE's siblings.
    // Half when the spouse's sibling is a half-sibling. Kept separate from the
    // blood `nieces` bucket and merged into one category below, blood-first so
    // blood always wins the shared dedupe.
    var marNieces = Object.create(null);       // id -> reached via a half-sibling?
    spousesOf(focusId).forEach(function (sp) {
      siblingIdsOf(sp).forEach(function (sib) {
        var h = siblingHalf(sp, sib);
        childrenOf(sib).forEach(function (c) {
          if (c in marNieces) marNieces[c] = marNieces[c] && h;
          else marNieces[c] = h;
        });
      });
    });

    /* ---- step relations ---------------------------------------------------
       Anchored on STEP-PARENTS = a blood parent's partner who isn't themselves a
       blood parent (the parent's later/other spouse), and on STEP-SIBLINGS = a
       step-parent's children who share NO blood parent (a shared blood parent
       makes them a HALF-sibling, which stays under Siblings). Both are computed
       for ANY person via the helpers below, not just the focus, because step
       aunts/uncles reach the focus through BOTH the focus's own step-parents AND
       the focus's blood parents' step-siblings. Ghosts are traversed THROUGH
       here just like blood links; they're dropped when members are taken below. */
    function stepParentsOf(id) {
      var mine = parentsOf(id), out = Object.create(null);
      mine.forEach(function (p) {
        spousesOf(p).forEach(function (sp) { if (mine.indexOf(sp) < 0) out[sp] = true; });
      });
      return out;
    }
    function stepSiblingsOf(id) {
      var mine = parentsOf(id), out = Object.create(null);
      keys(stepParentsOf(id)).forEach(function (sp) {
        childrenOf(sp).forEach(function (c) {
          if (c === id) return;
          var sharesBlood = parentsOf(c).some(function (pp) { return mine.indexOf(pp) >= 0; });
          if (!sharesBlood) out[c] = true;
        });
      });
      return out;
    }
    // STEP-CHILDREN = the inverse of stepParentsOf: a child of my spouse who isn't
    // also my blood child (my partner's kid from another relationship). Y is X's
    // step-parent EXACTLY when X is Y's step-child, so this is stepParentsOf run
    // the other way down the graph — the downward mirror the step-grandchild tier
    // needs. Ghosts are traversed THROUGH (dropped later by take()).
    function stepChildrenOf(id) {
      var mine = childrenOf(id), out = Object.create(null);
      spousesOf(id).forEach(function (sp) {
        childrenOf(sp).forEach(function (c) { if (mine.indexOf(c) < 0) out[c] = true; });
      });
      return out;
    }

    var stepParents = stepParentsOf(focusId);
    var stepSiblings = stepSiblingsOf(focusId);
    // Step aunts/uncles = UNION of two routes:
    //   (1) blood siblings of the focus's OWN step-parent(s), and
    //   (2) the step-siblings of the focus's blood parent(s) — a parent's
    //       step-sibling is one generation up from the focus, i.e. a step
    //       aunt/uncle. Route 2 is why John's children (who have no step-parent
    //       of their own) still reach the James/Markham side.
    var stepAU = Object.create(null);
    keys(stepParents).forEach(function (sp) { siblingIdsOf(sp).forEach(function (s) { stepAU[s] = true; }); });
    myParents.forEach(function (p) { keys(stepSiblingsOf(p)).forEach(function (s) { stepAU[s] = true; }); });
    // Spouses of the step aunts/uncles come in as step aunts/uncles (by marriage),
    // the same way blood aunts/uncles pull in their spouses. Ghosts are dropped by
    // take() below.
    var stepAUMarriage = Object.create(null);
    keys(stepAU).forEach(function (au) {
      spousesOf(au).forEach(function (sp) { if (!stepAU[sp]) stepAUMarriage[sp] = true; });
    });
    // Step cousins = children of ALL step aunts/uncles (from both routes).
    var stepCousins = Object.create(null);
    keys(stepAU).forEach(function (au) { childrenOf(au).forEach(function (c) { stepCousins[c] = true; }); });

    // Step-grandparents = UNION of two routes, one tier up from the step-parent /
    // step-aunt logic above:
    //   (A) the step-parents of the focus's BLOOD parents (a parent's step-parent
    //       is the focus's grandparent's later spouse — one gen up = step-grandparent),
    //   (B) the blood parents of the focus's OWN step-parents (your step-parent's
    //       parents). Union + dedupe; blood grandparents are claimed first below so
    //       they never land here.
    var stepGrandparents = Object.create(null);
    myParents.forEach(function (p) { keys(stepParentsOf(p)).forEach(function (s) { stepGrandparents[s] = true; }); });
    keys(stepParents).forEach(function (sp) { parentsOf(sp).forEach(function (s) { stepGrandparents[s] = true; }); });
    // Step-grandchildren = the exact downward mirror:
    //   (A) the step-children of the focus's BLOOD children (a child's step-child
    //       is that child's spouse's kid from another relationship — one gen down),
    //   (B) the children of the focus's OWN step-children.
    // NOTE: route (A) is the step-CHILD of a blood child (child-of-that-child's-
    // spouse), i.e. the true grandchild-generation mirror of route (A) up top. The
    // brief's parenthetical ("children of the child's step-parent") describes a
    // same-generation step-sibling instead, which is the wrong tier; the primary
    // wording and the stated mirror both mean the grandchild-generation tie coded
    // here. Flagged to Ethan/John in the handoff.
    var stepGrandchildren = Object.create(null);
    children.forEach(function (c) { keys(stepChildrenOf(c)).forEach(function (s) { stepGrandchildren[s] = true; }); });
    keys(stepChildrenOf(focusId)).forEach(function (sc) { childrenOf(sc).forEach(function (s) { stepGrandchildren[s] = true; }); });

    // Assemble. `take()` shares one `seen` set (focus excluded) so nobody is
    // listed twice and ghosts are dropped. Members are RESOLVED in priority
    // order — every blood tier closest-first, THEN every step tier — so a blood
    // or closer relationship always wins the dedupe. The sections are EMITTED in
    // the requested display order afterward (only the non-empty ones).
    var seen = Object.create(null); seen[focusId] = true;
    function take(entries, labelFn) {
      var out = [];
      entries.forEach(function (e) {
        var id = typeof e === "string" ? e : e.id;
        if (!exists(id) || isGhost(id) || seen[id]) return;
        seen[id] = true;
        out.push({ id: id, label: labelFn ? labelFn(e) : "" });
      });
      return out;
    }
    // "(half)" for a lone-shared-ancestor blood tie; "" otherwise. Feeds the
    // cousin and grand-niece/aunt tiers, which pass bare ids through take().
    function halfTag(id) { return half[id] ? "(half)" : ""; }

    // Blood aunts/uncles (half-flagged) + their spouses (by marriage), one list.
    var auEntries = keys(auBlood).map(function (id) { return { id: id, label: auHalf[id] ? "(half)" : "" }; })
      .concat(keys(auMarriage).map(function (id) { return { id: id, label: "(by marriage)" }; }));
    // Blood nieces/nephews (half-flagged) + spouse-side nieces/nephews (by
    // marriage, half where the spouse's sibling is a half-sibling). Blood first
    // so it wins the shared dedupe.
    var nieceEntries = keys(nieces).map(function (id) { return { id: id, label: halfTag(id) }; })
      .concat(keys(marNieces).map(function (id) {
        return { id: id, label: marNieces[id] ? "(half, by marriage)" : "(by marriage)" };
      }));
    // Blood step aunts/uncles + their spouses (by marriage).
    var stepAUEntries = keys(stepAU).map(function (id) { return { id: id, label: "" }; })
      .concat(keys(stepAUMarriage).map(function (id) { return { id: id, label: "(by marriage)" }; }));
    function labelOf(e) { return e.label; }

    // RESOLVED in priority order: every blood tier (closest first) THEN every
    // step tier, so a closer/blood relationship always wins the shared `seen`
    // dedupe — e.g. a blood cousin is never pulled into a step bucket. The
    // MRCA buckets are mutually exclusive (one MRCA per person) and disjoint
    // from the explicit walks above, so their order here is safe.
    var resolved = Object.create(null);
    resolved["Grandparents"]             = take(keys(grand));
    resolved["Parents"]                  = take(parents);
    resolved["Siblings"]                 = take(sibs, function (e) { return e.half ? "(half)" : ""; });
    resolved["Children"]                 = take(children);
    resolved["Grandchildren"]            = take(keys(grandchildren));
    resolved["Aunts & Uncles"]           = take(auEntries, labelOf);
    resolved["Nieces & Nephews"]         = take(nieceEntries, labelOf);
    resolved["Grand-Aunts & Uncles"]     = take(keys(grandAunts), halfTag);
    resolved["Grand-Nieces & Nephews"]   = take(keys(grandNieces), halfTag);
    resolved["1st Cousins"]              = take(keys(cousins[1][0]), halfTag);
    resolved["1st Cousins Once Removed"] = take(keys(cousins[1][1]), halfTag);
    resolved["1st Cousins Twice Removed"]= take(keys(cousins[1][2]), halfTag);
    resolved["2nd Cousins"]              = take(keys(cousins[2][0]), halfTag);
    resolved["2nd Cousins Once Removed"] = take(keys(cousins[2][1]), halfTag);
    resolved["2nd Cousins Twice Removed"]= take(keys(cousins[2][2]), halfTag);
    resolved["Step-parents"]             = take(keys(stepParents));
    resolved["Step-siblings"]            = take(keys(stepSiblings));
    resolved["Step Aunts & Uncles"]      = take(stepAUEntries, labelOf);
    resolved["Step Cousins"]             = take(keys(stepCousins));
    // Resolved LAST of all, so every blood tier and closer step tier (step-parents,
    // step-aunts) claims its people first — a blood grandparent/grandchild or a
    // step-parent is never pulled into these buckets by the shared `seen` dedupe.
    resolved["Step-grandparents"]        = take(keys(stepGrandparents));
    resolved["Step-grandchildren"]       = take(keys(stepGrandchildren));

    var order = [
      "Grandparents", "Step-grandparents", "Parents", "Step-parents", "Siblings", "Step-siblings",
      "Children", "Grandchildren", "Step-grandchildren",
      "Aunts & Uncles", "Step Aunts & Uncles", "Grand-Aunts & Uncles",
      "Nieces & Nephews", "Grand-Nieces & Nephews",
      "1st Cousins", "1st Cousins Once Removed", "1st Cousins Twice Removed",
      "2nd Cousins", "2nd Cousins Once Removed", "2nd Cousins Twice Removed",
      "Step Cousins"
    ];
    var cats = [];
    order.forEach(function (title) {
      var list = resolved[title];
      if (list && list.length) cats.push({ title: title, members: list });
    });
    return cats;
  }

  /* ---- auto photos: photos/<id>.<ext> ----------------------------------- *
     John drops a file named after a person's lowercase id into /photos and it
     shows up — no data edit needed. An explicit data.photo still wins as an
     override. The site is static (no directory listing), and our strict CSP
     forbids inline onerror handlers, so we can't guess the extension in markup.
     Instead we probe candidate URLs with an off-DOM Image() (which fires no
     broken-image icon on 404) and cache the winner by id. Cards render the
     initials chip first, then swap to the photo once it actually loads — so
     there's never a flash of broken or blank state. */

  var PHOTO_EXTS = ["jpg", "jpeg", "png", "webp"];
  // id -> resolved URL string, or false once every candidate has 404'd.
  var photoCache = Object.create(null);

  // A photo we can render right now, synchronously: explicit override wins,
  // else a previously auto-resolved file. null means "fall back to initials".
  function knownPhotoUrl(id, explicit) {
    if (explicit) return explicit;
    var hit = photoCache[id];
    return typeof hit === "string" ? hit : null;
  }

  // Try photos/<id>.jpg, .jpeg, .png, .webp in order; cb(url) on the first that
  // loads, cb(false) if none do. Uses a detached Image so failures are silent.
  function probePhoto(id, cb) {
    var i = 0;
    (function next() {
      if (i >= PHOTO_EXTS.length) { photoCache[id] = false; cb(false); return; }
      var url = "photos/" + id + "." + PHOTO_EXTS[i++];
      var probe = new Image();
      probe.onload = function () { photoCache[id] = url; cb(url); };
      probe.onerror = next;
      probe.src = url;
    })();
  }

  // Swap an initials chip for a resolved photo in place. encodeURI defends the
  // CSS url() string sink so it stays safe regardless of what feeds `url` later.
  function applyPhoto(el, url) {
    el.classList.remove("ft-avatar--placeholder", "ft-detail-avatar--placeholder",
                        "ft-rel-avatar--placeholder");
    el.textContent = "";
    el.style.backgroundImage = "url('" + encodeURI(url) + "')";
  }

  // Upgrade any initials chips tagged data-auto-photo within `root`, probing
  // once per id (results are cached, so re-renders and re-centers are cheap).
  function hydratePhotos(root) {
    var nodes = (root || document).querySelectorAll("[data-auto-photo]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var id = el.getAttribute("data-auto-photo");
      el.removeAttribute("data-auto-photo");        // don't probe this node twice
      var cached = photoCache[id];
      if (cached === false) continue;               // known: no file for this id
      if (typeof cached === "string") { applyPhoto(el, cached); continue; }
      (function (node, pid) {
        probePhoto(pid, function (url) { if (url) applyPhoto(node, url); });
      })(el, id);
    }
  }

  // Build an avatar's HTML. Resolution: explicit data.photo, else a known auto
  // photo, else the initials chip — tagged so hydratePhotos can upgrade it if a
  // photos/<id>.<ext> file turns up.
  function avatarHtml(id, first, last, explicit, baseCls, placeholderCls) {
    var url = knownPhotoUrl(id, explicit);
    if (url) {
      return '<div class="' + baseCls + '" style="background-image:url(\'' +
             escapeHtml(url) + '\')"></div>';
    }
    var auto = explicit ? "" : ' data-auto-photo="' + escapeHtml(id) + '"';
    return '<div class="' + baseCls + ' ' + placeholderCls + ' ft-chip-' + chipIndex(id) + '"' +
           auto + '>' + escapeHtml(initials(first, last)) + '</div>';
  }

  /* ---- custom card HTML ------------------------------------------------- */
  // `d` is a tree node; person fields live at d.data.data, id at d.data.id.
  function cardInnerHtml(d) {
    var p = d.data.data;
    var first = p["first name"] || "";
    var last = p["last name"] || "";
    var name = (first + " " + last).trim();
    var bday = formatBirthday(p.birthdate);

    var avatar = avatarHtml(d.data.id, first, last, p.photo,
                            "ft-avatar", "ft-avatar--placeholder");

    // Placeholder "connector" people (unknown real relatives) render de-emphasized.
    var innerCls = "ft-card-inner" + (p.placeholder ? " ft-card-inner--ghost" : "");

    return (
      '<div class="' + innerCls + '">' +
        avatar +
        '<div class="ft-card-text">' +
          '<div class="ft-card-name">' + escapeHtml(name) + '</div>' +
          (bday ? '<div class="ft-card-bday">' + escapeHtml(bday) + '</div>' : '') +
        '</div>' +
      '</div>'
    );
  }

  /* ---- detail panel ----------------------------------------------------- */
  var panel = document.getElementById("detail-panel");
  var panelBody = document.getElementById("detail-body");

  // One clickable relative row: small avatar chip + name (+ optional tag like
  // "(half)" / "(by marriage)") + birth year. data-focus-id drives the shared
  // click delegation below (CSP-safe: no inline handler).
  function relativeRowHtml(id, label) {
    var p = personData(id);
    var first = p["first name"] || "", last = p["last name"] || "";
    var name = (first + " " + last).trim();
    var year = birthYear(p.birthdate);
    var chip = avatarHtml(id, first, last, p.photo,
                          "ft-rel-avatar", "ft-rel-avatar--placeholder");
    return '<button type="button" class="ft-rel" data-focus-id="' + escapeHtml(id) + '">' +
             chip +
             '<span class="ft-rel-text">' +
               '<span class="ft-rel-name">' + escapeHtml(name) +
                 (label ? ' <span class="ft-rel-tag">' + escapeHtml(label) + '</span>' : '') +
               '</span>' +
               (year ? '<span class="ft-rel-year">' + escapeHtml(year) + '</span>' : '') +
             '</span>' +
           '</button>';
  }

  // Close/direct categories start expanded; everything wider starts collapsed
  // (but still shows its count). Collapsibles use native <details>/<summary> so
  // they're keyboard- and touch-accessible with NO inline handlers (CSP-safe).
  var OPEN_BY_DEFAULT = { "Parents": 1, "Siblings": 1, "Children": 1, "Grandchildren": 1 };
  function relativesHtml(id) {
    var cats = computeRelatives(id);
    if (!cats.length) return "";
    // Every category nests inside ONE outer collapsible section ("Relatives"),
    // open by default so the panel reads as populated rather than a blank click-
    // to-reveal. Each inner category stays individually collapsible exactly as
    // before (same OPEN_BY_DEFAULT set for the close/direct tiers).
    var inner = "";
    cats.forEach(function (c) {
      var open = OPEN_BY_DEFAULT[c.title] ? " open" : "";
      inner += '<details class="ft-rel-group"' + open + '>' +
                 '<summary class="ft-rel-heading">' +
                   '<span class="ft-rel-heading-title">' + escapeHtml(c.title) + '</span>' +
                   '<span class="ft-rel-heading-count">(' + c.members.length + ')</span>' +
                 '</summary>' +
                 '<div class="ft-rel-list">' +
                   c.members.map(function (m) { return relativeRowHtml(m.id, m.label); }).join("") +
                 '</div>' +
               '</details>';
    });
    return '<details class="ft-rel-outer" open>' +
             '<summary class="ft-rel-outer-summary">' +
               '<span class="ft-rel-outer-title">Relatives</span>' +
             '</summary>' +
             '<div class="ft-rel-groups">' + inner + '</div>' +
           '</details>';
  }

  function openDetail(person, id) {
    var first = person["first name"] || "";
    var last = person["last name"] || "";
    var name = (first + " " + last).trim();
    var bday = formatBirthday(person.birthdate);

    var media = avatarHtml(id, first, last, person.photo,
                           "ft-detail-avatar", "ft-detail-avatar--placeholder");

    panelBody.innerHTML =
      media +
      '<h2 class="ft-detail-name">' + escapeHtml(name) + '</h2>' +
      (bday ? '<p class="ft-detail-bday">Born ' + escapeHtml(bday) + '</p>'
            : '<p class="ft-detail-bday ft-muted">Birthday unknown</p>') +
      (person.notes ? '<p class="ft-detail-notes">' + escapeHtml(person.notes) + '</p>' : '') +
      relativesHtml(id);

    panelBody.scrollTop = 0;
    panel.classList.add("is-open");
    // Shift the tree canvas left by half the panel's actual rendered width so the
    // focused card lands in the CENTER of the free space beside the side sheet,
    // not under it. We read the live panel width rather than hardcoding 340. CSS
    // gates the shift to desktop: on mobile (<=640px) the panel is a full-width
    // bottom sheet, so `#FamilyChart.ft-shift` resolves to `transform: none` and
    // the tree stays true-centered (see the mobile media query). The shift stays
    // on across every recenter while the panel is open, and the library's own
    // recenter slide plays intact inside the offset container.
    cont.style.setProperty("--panel-shift", Math.round(panel.getBoundingClientRect().width / 2) + "px");
    cont.classList.add("ft-shift");
    hydratePhotos(panelBody);   // upgrade the chip if photos/<id>.<ext> exists
  }

  // Delegated: clicking any relative row re-centers the tree on that person and
  // refreshes the panel (same path as tapping a card or picking a search result).
  panelBody.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-focus-id]") : null;
    if (btn) focusPerson(btn.getAttribute("data-focus-id"));
  });

  function closeDetail() {
    panel.classList.remove("is-open");
    cont.classList.remove("ft-shift");   // panel gone: return to full-viewport centering
  }
  document.getElementById("detail-close").addEventListener("click", closeDetail);

  /* ---- build the chart -------------------------------------------------- */
  var cont = document.querySelector("#FamilyChart");

  var chart = f3.createChart("#FamilyChart", window.FAMILY_DATA)
    .setTransitionTime(TRANSITION_MS)
    .setCardXSpacing(196)
    .setCardYSpacing(250)
    .setOrientationVertical()
    .setSingleParentEmptyCard(false)
    // Show plenty of generations up and down from the focused person, and their
    // siblings, so the blended relationships (half-siblings, step-parents) are
    // visible at once. A person-centric tree can only show ONE person's
    // ancestors + descendants, so the far side of the family (e.g. the James
    // branch when focused on a Pruden) appears when you tap across to it.
    .setAncestryDepth(6)
    .setProgenyDepth(6)
    .setShowSiblingsOfMain(true);

  var card = chart.setCardHtml()
    .setCardDim({ w: 150, h: 184, img_w: 66, img_h: 66, img_x: 42, img_y: 14, text_x: 0 })
    .setMiniTree(true)              // little +/- to expand collapsed branches
    .setStyle("rect")
    .setCardInnerHtmlCreator(cardInnerHtml);

  // The one recenter path shared by card taps, search picks, and relative-row
  // clicks: move the tree's main person and open their detail panel.
  function focusPerson(id) {
    var p = byId[id];
    if (!p) return;
    markMotion(TRANSITION_MS + 150);   // GPU-promote moving cards for the recenter
    chart.updateMainId(id);
    chart.updateTree({ tree_position: "main_to_middle" });
    settleMarkers();   // reposition union diamonds once the transition lands
    openDetail(p.data, id);
  }

  // Tap a card: re-center the tree on that person AND open their detail panel.
  // Re-centering is the primary mobile interaction (the FamilySearch pattern).
  card.setOnCardClick(function (e, d) { focusPerson(d.data.id); });

  /* ---- connector styling ------------------------------------------------ *
     The library draws every connector as <path class="link"> with no type in
     the DOM, but the bound datum carries `spouse: true` on marriage/union
     links. Read that off each path's __data__ and tag it so CSS can paint
     unions terracotta and parent-child lines quiet neutral (Maya's rule: one
     strong color spent on exactly one thing). Geometry-free, so it's safe to
     run the instant cards are rebuilt. */
  function tagLinks() {
    var paths = cont.querySelectorAll("path.link");
    for (var i = 0; i < paths.length; i++) {
      var d = paths[i].__data__ || null;
      var isUnion = !!(d && (d.spouse || d.coparent));
      paths[i].classList.toggle("ft-link--union", isUnion);
      paths[i].classList.toggle("ft-link--parent", !isUnion);
    }
  }

  // A small filled diamond at each union's midpoint — the family-unit anchor
  // and where the drop-line to children originates. Position needs FINAL path
  // geometry, so this runs after the layout transition settles (see below),
  // not mid-animation. Markers are cleared and redrawn each pass.
  var SVGNS = "http://www.w3.org/2000/svg";
  var MARK = 7;
  function drawUnionMarkers() {
    var paths = cont.querySelectorAll("path.link.ft-link--union");
    // clear old markers wherever they live
    var old = cont.querySelectorAll(".ft-union-marker");
    for (var j = 0; j < old.length; j++) old[j].parentNode.removeChild(old[j]);
    for (var k = 0; k < paths.length; k++) {
      var p = paths[k], len = 0;
      try { len = p.getTotalLength(); } catch (e) { continue; }
      if (!len) continue;
      var mid = p.getPointAtLength(len / 2);
      var cx = mid.x, cy = mid.y;
      var rect = document.createElementNS(SVGNS, "rect");
      rect.setAttribute("class", "ft-union-marker");
      rect.setAttribute("x", (cx - MARK / 2).toFixed(2));
      rect.setAttribute("y", (cy - MARK / 2).toFixed(2));
      rect.setAttribute("width", MARK);
      rect.setAttribute("height", MARK);
      rect.setAttribute("transform", "rotate(45 " + cx.toFixed(2) + " " + cy.toFixed(2) + ")");
      p.parentNode.appendChild(rect);   // same group => same coordinate space
    }
  }

  // The library rebuilds cards on every re-center and mini-tree expand. Watch
  // the container and, per frame, hydrate freshly-injected chips + retag links
  // + redraw union markers. The observer is DISCONNECTED across our own DOM
  // writes so we never re-trigger ourselves into a loop. Resolved photo ids
  // come from cache, so this stays cheap at ~70 people.
  var observer;
  var hydrateQueued = false;
  function renderPass() {
    if (hydrateQueued) return;
    hydrateQueued = true;
    requestAnimationFrame(function () {
      hydrateQueued = false;
      observer.disconnect();
      hydratePhotos(cont);
      tagLinks();
      drawUnionMarkers();
      observer.observe(cont, { childList: true, subtree: true });
    });
  }
  observer = new MutationObserver(renderPass);
  observer.observe(cont, { childList: true, subtree: true });

  // Diamonds depend on post-transition geometry, and a settled layout emits no
  // childList change to wake the observer — so nudge one more pass after the
  // transition (matches setTransitionTime) whenever the tree re-centers.
  function settleMarkers() { setTimeout(renderPass, TRANSITION_MS + 90); }

  // Motion window: while the tree is moving (recenter, pan, or zoom) we flag the
  // chart with `.ft-anim`, which promotes each on-screen card to its own GPU
  // layer (see css). That turns the move into a pure composite — the soft card
  // shadow rasterizes once instead of every frame — and we drop the flag a beat
  // after motion stops so we never hold those layers (or their memory) at rest.
  var animOffTimer = null;
  function markMotion(ms) {
    // The tree always animates, so always promote the moving cards for the
    // duration of the motion — that's what keeps the slide a cheap composite
    // instead of a per-frame shadow repaint.
    cont.classList.add("ft-anim");
    if (animOffTimer) clearTimeout(animOffTimer);
    animOffTimer = setTimeout(function () {
      cont.classList.remove("ft-anim");
      animOffTimer = null;
    }, ms);
  }
  // Pan / zoom are driven by the library's own pointer + wheel handlers, so we
  // just watch the same gestures (passively) and keep the motion window open
  // until a short idle after the last move / wheel tick.
  cont.addEventListener("pointerdown", function () { markMotion(400); }, { passive: true });
  cont.addEventListener("pointermove", function (e) {
    if (e.buttons) markMotion(250);       // only while a button is held (dragging)
  }, { passive: true });
  cont.addEventListener("wheel", function () { markMotion(350); }, { passive: true });

  // Open focused on John, then let the whole connected tree render around him.
  markMotion(TRANSITION_MS + 150);   // promote cards for the opening animation
  chart.updateMainId(INITIAL_FOCUS_ID);
  chart.updateTree({ initial: true, tree_position: "main_to_middle" });
  hydratePhotos(cont);
  tagLinks();
  settleMarkers();

  // Close the panel when tapping empty canvas (a click not on a card).
  cont.addEventListener("click", function (e) {
    if (!e.target.closest || !e.target.closest(".card")) closeDetail();
  });

  /* ---- search / jump-to-person ------------------------------------------ *
     Type a name -> filtered dropdown; pick one (mouse, tap, or arrow-keys +
     Enter) to recenter the tree on them and open their panel. Placeholder/ghost
     connectors are excluded (they aren't real people to jump to). Many people
     share a first name, so every result shows full "First Last" plus birth year
     when known, which is what disambiguates the four Bobs, two Kellys, etc.
     CSP-safe: results are data-attribute rows wired via delegation, no inline JS. */
  (function initSearch() {
    var input = document.getElementById("ft-search-input");
    var listBox = document.getElementById("ft-search-results");
    if (!input || !listBox) return;

    var MAX_RESULTS = 8;
    // Prebuilt, lowercased index of real (non-ghost) people.
    var index = (window.FAMILY_DATA || [])
      .filter(function (p) { return !(p.data && p.data.placeholder); })
      .map(function (p) {
        var first = (p.data["first name"] || "").trim();
        var last = (p.data["last name"] || "").trim();
        var name = (first + " " + last).trim();
        return {
          id: p.id,
          name: name,
          year: birthYear(p.data.birthdate),
          first: first.toLowerCase(),
          last: last.toLowerCase(),
          full: name.toLowerCase()
        };
      })
      .filter(function (r) { return r.name; });

    var matches = [];     // current filtered result objects
    var active = -1;      // highlighted index within `matches`

    function label(r) { return r.name + (r.year ? " (" + r.year + ")" : ""); }

    function search(q) {
      q = q.trim().toLowerCase();
      if (!q) return [];
      var hits = index.filter(function (r) {
        return r.full.indexOf(q) >= 0 || r.first.indexOf(q) >= 0 || r.last.indexOf(q) >= 0;
      });
      // Prefix matches first, then alphabetical — the exact name you're typing
      // floats to the top even when it's a substring of longer names.
      hits.sort(function (a, b) {
        var ap = a.full.indexOf(q) === 0 ? 0 : 1;
        var bp = b.full.indexOf(q) === 0 ? 0 : 1;
        if (ap !== bp) return ap - bp;
        return a.name.localeCompare(b.name);
      });
      return hits.slice(0, MAX_RESULTS);
    }

    function render() {
      if (!matches.length) { close(); return; }
      var html = "";
      for (var i = 0; i < matches.length; i++) {
        var r = matches[i];
        html += '<li class="ft-search-item' + (i === active ? " ft-search-item--active" : "") + '"' +
                  ' role="option" id="ft-search-opt-' + i + '"' +
                  ' aria-selected="' + (i === active ? "true" : "false") + '"' +
                  ' data-focus-id="' + escapeHtml(r.id) + '">' +
                  '<span class="ft-search-item-name">' + escapeHtml(r.name) + '</span>' +
                  (r.year ? '<span class="ft-search-item-year">(' + escapeHtml(r.year) + ')</span>' : '') +
                '</li>';
      }
      listBox.innerHTML = html;
      listBox.hidden = false;
      input.setAttribute("aria-expanded", "true");
      input.setAttribute("aria-activedescendant", active >= 0 ? "ft-search-opt-" + active : "");
    }

    function close() {
      listBox.hidden = true;
      listBox.innerHTML = "";
      matches = [];
      active = -1;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }

    function pick(r) {
      if (!r) return;
      input.value = label(r);
      close();
      input.blur();
      focusPerson(r.id);
    }

    function setActive(i) {
      if (!matches.length) return;
      active = (i + matches.length) % matches.length;   // wrap around
      render();
      var el = document.getElementById("ft-search-opt-" + active);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    }

    input.addEventListener("input", function () {
      matches = search(input.value);
      active = -1;
      render();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); if (matches.length) setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (matches.length) setActive(active - 1); }
      else if (e.key === "Enter") {
        if (matches.length) { e.preventDefault(); pick(matches[active >= 0 ? active : 0]); }
      } else if (e.key === "Escape") {
        if (!listBox.hidden) { e.preventDefault(); close(); } else { input.value = ""; input.blur(); }
      }
    });

    input.addEventListener("focus", function () {
      if (input.value.trim()) { matches = search(input.value); active = -1; render(); }
    });

    // Pointer pick. mousedown (not click) so it fires before the input's blur
    // tears the list down; find the row by its stable id, not list position.
    listBox.addEventListener("mousedown", function (e) {
      var li = e.target.closest ? e.target.closest("[data-focus-id]") : null;
      if (!li) return;
      e.preventDefault();
      var id = li.getAttribute("data-focus-id");
      for (var i = 0; i < matches.length; i++) { if (matches[i].id === id) { pick(matches[i]); return; } }
    });

    // Close when focus/pointer leaves the search widget.
    input.addEventListener("blur", function () { setTimeout(close, 120); });
    document.addEventListener("click", function (e) {
      if (!e.target.closest || !e.target.closest(".ft-search")) close();
    });
  })();
})();
