/* ============================================================================
   FAMILY DATA  —  hand-edit this file to update the tree
   ============================================================================

   HOW TO EDIT (no build step, no tools needed):
   - Each person is one object in the FAMILY array below.
   - After editing, save the file and refresh the page. That's it.

   PERSON SHAPE:
   {
     id: "unique-id",              // lowercase, no spaces. Used to link people.
     data: {
       gender: "M" | "F",          // required by the chart library
       "first name": "Jane",
       "last name":  "Doe",
       birthdate: "1980-05-23",    // ISO date. Month only ok: "1976-12". null if unknown.
       photo: "photos/jane.jpg",   // path into the /photos folder, or null for a placeholder
       notes: ""                   // free text, shown later in the detail panel
     },
     rels: {
       spouses:  ["id", ...],      // everyone this person married/partnered
       father:   "id",             // this person's father (omit if unknown)
       mother:   "id",             // this person's mother (omit if unknown)
       children: ["id", ...]       // this person's children
     }
   }

   RULES THAT KEEP THE TREE CORRECT:
   - Relationships must agree on BOTH ends. If Jack lists John as a child,
     John must list Jack as father. If Jack lists Jane as a spouse, Jane must
     list Jack as a spouse. Mismatches make people float or disappear.
   - A child's father/mother must point at real ids that also list that child
     under their `children`.
   - Second marriages: put BOTH spouses in the `spouses` array, in order.
     Children hang off whichever parents actually had them.

   GENDER NOTE: the library needs "M" or "F" to lay out couples. A few here are
   best-guesses from first names (flagged // GUESS). Correct any that are wrong.
   ========================================================================== */

window.FAMILY_DATA = [

  /* ---- UNION 1: Jack + Jane (married, divorced 1985) -> Juli, John ------- */
  {
    id: "jack",
    data: { gender: "M", "first name": "Jack", "last name": "Pruden",
            birthdate: "1945-01-05", photo: null, notes: "" },
    // Jack married twice: Jane first, then Peg. Kids under both.
    rels: { spouses: ["jane", "peg"], father: "jack-father", mother: "jack-mother",
            children: ["juli", "john", "kelly"] }
  },
  {
    id: "jane",
    data: { gender: "F", "first name": "Jane", "last name": "Robertson",
            birthdate: "1945-02-09", photo: null,
            notes: "Maiden name Werner; goes by Jane Robertson." },
    // Jane married twice: Jack first, then Gavin (Dec 1997). No kids with Gavin.
    // Her birth family (Werner/Rohrer) hangs below via her parents. See "JANE'S SIDE".
    rels: { father: "jack-werner", mother: "betty",
            spouses: ["jack", "gavin"], children: ["juli", "john"] }
  },
  {
    id: "juli",
    data: { gender: "F", "first name": "Juli", "last name": "Pruden",
            birthdate: "1973-09-29", photo: null, notes: "" },
    rels: { father: "jack", mother: "jane" }
  },
  {
    id: "john",
    data: { gender: "M", "first name": "John", "last name": "Pruden",
            birthdate: "1975-06-08", photo: null, notes: "" },
    rels: { father: "jack", mother: "jane",
            spouses: ["kim"], children: ["campbell", "emmett", "andrew"] }
  },

  /* ---- UNION 2: John + Kim -> Campbell, Emmett & Andrew (twins) ---------- */
  {
    id: "kim",
    data: { gender: "F", "first name": "Kim", "last name": "Plansker",
            birthdate: "1978-06-29", photo: null, notes: "" },
    // Kim's parents are Ed Plansker + Doris (Markham) — her side of the family
    // hangs below, joined to the tree through her. See "KIM'S SIDE" section.
    rels: { father: "ed", mother: "doris-markham",
            spouses: ["john"], children: ["campbell", "emmett", "andrew"] }
  },
  {
    id: "campbell",
    data: { gender: "F", "first name": "Campbell", "last name": "Pruden",
            birthdate: "2010-02-18", photo: null, notes: "" },
    rels: { father: "john", mother: "kim" }
  },
  {
    id: "emmett",
    data: { gender: "M", "first name": "Emmett", "last name": "Pruden",
            birthdate: "2013-05-23", photo: null, notes: "Twin with Andrew." },
    rels: { father: "john", mother: "kim" }
  },
  {
    id: "andrew",
    data: { gender: "M", "first name": "Andrew", "last name": "Pruden",
            birthdate: "2013-05-23", photo: null, notes: "Twin with Emmett." },
    rels: { father: "john", mother: "kim" }
  },

  /* ---- UNION 3: Jack + Peg (Jack's 2nd marriage) -> Kelly --------------- */
  {
    id: "peg",
    data: { gender: "F", "first name": "Peg", "last name": "Byrnes",
            birthdate: "1947-07-07", photo: null, notes: "" },
    // Peg married twice: Tom James first, then Jack. Kids under both.
    // Her birth family (the Byrnes) hangs below via her parents. See "PEG'S SIDE".
    rels: { father: "robert-byrnes", mother: "mary-byrnes",
            spouses: ["tom", "jack"], children: ["brian", "shannon", "kelly"] }
  },
  {
    id: "kelly",
    data: { gender: "F", "first name": "Kelly", "last name": "Pruden",
            birthdate: "1986-09-25", photo: null,
            notes: "Half-sibling to the Pruden kids (via Jack) and the James kids (via Peg)." },
    rels: { father: "jack", mother: "peg",
            spouses: ["mark"], children: ["fiona", "brigid"] }
  },

  /* ---- UNION 4: Kelly + Mark -> Fiona, Brigid -------------------------- */
  {
    id: "mark",
    data: { gender: "M", "first name": "Mark", "last name": "Grassi",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "lou-grassi", mother: "lois-grassi",
            spouses: ["kelly"], children: ["fiona", "brigid"] }
  },
  {
    id: "fiona",
    data: { gender: "F", "first name": "Fiona", "last name": "Grassi",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "mark", mother: "kelly" }
  },
  {
    id: "brigid",
    data: { gender: "F", "first name": "Brigid", "last name": "Grassi",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "mark", mother: "kelly" }
  },

  /* ---- MARK'S BIRTH FAMILY: Lou + Lois -> Mark & Craig; Craig + Jen -----
     Mark's parents and his brother Craig's family. Craig & Jen have 2
     children not yet named — omitted as records (see Sean's precedent),
     captured in Craig's notes until John has names. -------------------- */
  {
    id: "lou-grassi",
    data: { gender: "M", "first name": "Lou", "last name": "Grassi",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["lois-grassi"], children: ["mark", "craig-grassi"] }
  },
  {
    id: "lois-grassi",
    data: { gender: "F", "first name": "Lois", "last name": "Grassi",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["lou-grassi"], children: ["mark", "craig-grassi"] }
  },
  {
    id: "craig-grassi",
    data: { gender: "M", "first name": "Craig", "last name": "Grassi",
            birthdate: null, photo: null,
            notes: "Has 2 children (names to come later)." },
    rels: { father: "lou-grassi", mother: "lois-grassi", spouses: ["jen-grassi"] }
  },
  {
    id: "jen-grassi",
    data: { gender: "F", "first name": "Jen", "last name": "Grassi",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["craig-grassi"] }
  },

  /* ---- UNION 5: Tom + Peg (Peg's 1st marriage) -> Brian, Shannon --------
     Tom married twice: an unknown first wife (tom-ex) before Peg. Bob James &
     Katherine hang off that prior marriage (half-siblings to Brian & Shannon
     via Tom); Brian & Shannon hang off Peg. See "TOM'S PRIOR MARRIAGE". ----- */
  {
    id: "tom",
    data: { gender: "M", "first name": "Tom", "last name": "James",
            birthdate: null, photo: null, notes: "" },
    // Prior wife (tom-ex) first, then Peg. Kids hang off whichever marriage had them.
    rels: { spouses: ["tom-ex", "peg"],
            children: ["bob-james", "katherine", "brian", "shannon"] }
  },
  {
    id: "brian",
    data: { gender: "M", "first name": "Brian", "last name": "James",
            birthdate: "1976-12", photo: null, notes: "Birthdate: month only." },
    rels: { father: "tom", mother: "peg",
            spouses: ["katie"], children: ["aidan"] }
  },
  {
    id: "shannon",
    data: { gender: "F", "first name": "Shannon", "last name": "James",
            birthdate: "1979-02-14", photo: null, notes: "" },
    rels: { father: "tom", mother: "peg",
            spouses: ["jonathan"], children: ["cody", "cordelia", "emma", "gabriel"] }
  },

  /* ---- UNION 6: Brian + Katie -> Aidan --------------------------------- */
  {
    id: "katie",
    data: { gender: "F", "first name": "Katie", "last name": "Loder",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["brian"], children: ["aidan"] }
  },
  {
    id: "aidan",
    data: { gender: "M", "first name": "Aidan", "last name": "James",  // GUESS: gender
            birthdate: null, photo: null, notes: "" },
    rels: { father: "brian", mother: "katie" }
  },

  /* ---- UNION 7: Shannon + Jonathan -> Cody, Cordelia, Emma, Gabriel ----- */
  {
    id: "jonathan",
    data: { gender: "M", "first name": "Jonathan", "last name": "Last",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "last-parent",
            spouses: ["shannon"], children: ["cody", "cordelia", "emma", "gabriel"] }
  },
  {
    id: "cody",
    data: { gender: "M", "first name": "Cody", "last name": "Last",  // GUESS: gender
            birthdate: null, photo: null, notes: "" },
    rels: { father: "jonathan", mother: "shannon" }
  },
  {
    id: "cordelia",
    data: { gender: "F", "first name": "Cordelia", "last name": "Last",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "jonathan", mother: "shannon" }
  },
  {
    id: "emma",
    data: { gender: "F", "first name": "Emma", "last name": "Last",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "jonathan", mother: "shannon" }
  },
  {
    id: "gabriel",
    data: { gender: "M", "first name": "Gabriel", "last name": "Last",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "jonathan", mother: "shannon" }
  },

  /* ---- JONATHAN'S SISTER: Monica + Sean Dunbar -> Faith, Hannah ---------
     Jonathan & Monica's parents are unknown; last-parent is a single shared
     placeholder connector that groups them as siblings. -------------------- */
  {
    id: "last-parent",
    data: { gender: "M", "first name": "", "last name": "Last",
            birthdate: null, photo: null,
            notes: "Jonathan & Monica's parent; both parents unknown (placeholder connector; gender arbitrary).",
            placeholder: true },
    rels: { children: ["jonathan", "monica"] }
  },
  {
    id: "monica",
    data: { gender: "F", "first name": "Monica", "last name": "Dunbar",
            birthdate: null, photo: null,
            notes: "Maiden name Last; Jonathan's sister." },
    rels: { father: "last-parent", spouses: ["sean-dunbar"], children: ["faith", "hannah"] }
  },
  {
    id: "sean-dunbar",
    data: { gender: "M", "first name": "Sean", "last name": "Dunbar",
            birthdate: null, photo: null, notes: "(2nd Sean in tree.)" },
    rels: { spouses: ["monica"], children: ["faith", "hannah"] }
  },
  {
    id: "faith",
    data: { gender: "F", "first name": "Faith", "last name": "Dunbar",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "sean-dunbar", mother: "monica" }
  },
  {
    id: "hannah",
    data: { gender: "F", "first name": "Hannah", "last name": "Dunbar",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "sean-dunbar", mother: "monica" }
  },

  /* ---- TOM'S PRIOR MARRIAGE: Tom + tom-ex (before Peg) -> Bob James, Katherine
     Tom's first wife (tom-ex) is an unknown placeholder ghost. Their two kids
     are half-siblings to Brian & Shannon via Tom. --------------------------- */
  {
    id: "tom-ex",
    data: { gender: "F", "first name": "", "last name": "",
            birthdate: null, photo: null,
            notes: "Tom James's first wife (before Peg); mother of Bob & Katherine. Name unknown (placeholder).",
            placeholder: true },
    rels: { spouses: ["tom"], children: ["bob-james", "katherine"] }
  },
  {
    id: "bob-james",
    data: { gender: "M", "first name": "Bob", "last name": "James",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "tom", mother: "tom-ex" }
  },
  {
    id: "katherine",
    data: { gender: "F", "first name": "Katherine", "last name": "Wisniewski",
            birthdate: null, photo: null, notes: "Maiden name James." },
    rels: { father: "tom", mother: "tom-ex", spouses: ["paul"] }
  },
  {
    id: "paul",
    data: { gender: "M", "first name": "Paul", "last name": "Wisniewski",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["katherine"] }
  },

  /* ---- UNION 8: Jane + Gavin (Jane's remarriage, Dec 1997; no kids together)
     Gavin's 3 children are from his prior marriage to Sarah (sarah-robertson).
     Their families (the grandchildren) hang below in "GAVIN'S GRANDCHILDREN". - */
  {
    id: "gavin",
    data: { gender: "M", "first name": "Gavin", "last name": "Robertson",
            birthdate: "1932-09-17", photo: null,
            notes: "Married Jane Dec 1997; no children together." },
    // Prior wife (sarah-robertson) first, then Jane. Kids hang off the prior marriage.
    rels: { spouses: ["sarah-robertson", "jane"], children: ["sarah-way", "gordon", "bonnie"] }
  },
  {
    id: "sarah-robertson",
    data: { gender: "F", "first name": "Sarah", "last name": "Robertson",
            birthdate: null, photo: null,
            notes: "Gavin's first wife." },
    rels: { spouses: ["gavin"], children: ["sarah-way", "gordon", "bonnie"] }
  },
  {
    id: "sarah-way",
    data: { gender: "F", "first name": "Sarah", "last name": "Way",
            birthdate: null, photo: null,
            notes: "Gavin's daughter from prior marriage (oldest)." },
    rels: { father: "gavin", mother: "sarah-robertson",
            spouses: ["douglas-way"], children: ["gavin-way", "morgan-way"] }
  },
  {
    id: "gordon",
    data: { gender: "M", "first name": "Gordon", "last name": "Robertson",
            birthdate: null, photo: null,
            notes: "Gavin's son from prior marriage." },
    rels: { father: "gavin", mother: "sarah-robertson",
            spouses: ["paige"], children: ["natalie", "brooke", "susanna"] }
  },
  {
    id: "bonnie",
    data: { gender: "F", "first name": "Bonnie", "last name": "Robertson",
            birthdate: null, photo: null,
            notes: "Gavin's daughter from prior marriage (youngest)." },
    rels: { father: "gavin", mother: "sarah-robertson",
            spouses: ["joe-lobacki"], children: ["doug-lobacki", "may-lobacki"] }
  },

  /* ---- GAVIN'S GRANDCHILDREN --------------------------------------------
     Gavin & Sarah's 3 kids each have a family: Sarah Way + Douglas Way (the
     Ways), Bonnie + Joe Lobacki (divorced; the Lobackis), and Gordon + Paige
     (divorced; the Robertson granddaughters). Spouses marry in; children hang
     off whichever couple had them. --------------------------------------- */

  /* ---- SARAH WAY + DOUGLAS WAY -> Gavin, Morgan ------------------------ */
  {
    id: "douglas-way",
    data: { gender: "M", "first name": "Douglas", "last name": "Way",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["sarah-way"], children: ["gavin-way", "morgan-way"] }
  },
  {
    id: "gavin-way",
    data: { gender: "M", "first name": "Gavin", "last name": "Way",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "douglas-way", mother: "sarah-way" }
  },
  {
    id: "morgan-way",
    data: { gender: "M", "first name": "Morgan", "last name": "Way",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "douglas-way", mother: "sarah-way" }
  },

  /* ---- BONNIE + JOE LOBACKI (divorced) -> Douglas, Maynard ------------- */
  {
    id: "joe-lobacki",
    data: { gender: "M", "first name": "Joe", "last name": "Lobacki",
            birthdate: null, photo: null, notes: "Divorced from Bonnie." },
    rels: { spouses: ["bonnie"], children: ["doug-lobacki", "may-lobacki"] }
  },
  {
    id: "doug-lobacki",
    data: { gender: "M", "first name": "Douglas", "last name": "Lobacki",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "joe-lobacki", mother: "bonnie" }
  },
  {
    id: "may-lobacki",
    data: { gender: "F", "first name": "Maynard", "last name": "Lobacki",
            birthdate: null, photo: null,
            notes: "Goes by May." },
    rels: { father: "joe-lobacki", mother: "bonnie" }
  },

  /* ---- GORDON + PAIGE (divorced) -> Natalie, Brooke, Susanna ----------- */
  {
    id: "paige",
    data: { gender: "F", "first name": "Paige", "last name": "Robertson",
            birthdate: null, photo: null, notes: "Divorced from Gordon." },
    rels: { spouses: ["gordon"], children: ["natalie", "brooke", "susanna"] }
  },
  {
    id: "natalie",
    data: { gender: "F", "first name": "Natalie", "last name": "Robertson",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "gordon", mother: "paige" }
  },
  {
    id: "brooke",
    data: { gender: "F", "first name": "Brooke", "last name": "Robertson",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "gordon", mother: "paige" }
  },
  {
    id: "susanna",
    data: { gender: "F", "first name": "Susanna", "last name": "Robertson",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "gordon", mother: "paige" }
  },

  /* ---- JACK'S PATERNAL LINE (placeholders) --------------------------------
     Jack & Bob's parents + grandfather. Real names unknown; these are
     `placeholder: true` connector nodes, rendered as de-emphasized "ghost"
     cards (see cardInnerHtml in js/main.js and .ft-card-inner--ghost in CSS). - */
  {
    id: "jack-father",
    data: { gender: "M", "first name": "", "last name": "Pruden",
            birthdate: null, photo: null,
            notes: "Jack & Bob's father. Died young; name unknown (placeholder).",
            placeholder: true },
    rels: { spouses: ["jack-mother"], father: "pruden-grandfather",
            children: ["jack", "bob"] }
  },
  {
    id: "jack-mother",
    data: { gender: "F", "first name": "", "last name": "Pruden",
            birthdate: null, photo: null,
            notes: "Jack & Bob's mother. Name/maiden unknown (placeholder).",
            placeholder: true },
    rels: { spouses: ["jack-father"], children: ["jack", "bob"] }
  },
  {
    id: "pruden-grandfather",
    data: { gender: "M", "first name": "", "last name": "Pruden",
            birthdate: null, photo: null,
            notes: "Jack's paternal grandfather; connects Aunt Doris as sibling of Jack's father. Name unknown (placeholder). ASSUMPTION: Doris is on the PATERNAL side.",
            placeholder: true },
    rels: { children: ["jack-father", "doris"] }
  },

  /* ---- JACK'S BROTHER: Bob + Dolly -> Dan --------------------------------- */
  {
    id: "bob",
    data: { gender: "M", "first name": "Bob", "last name": "Pruden",
            birthdate: null, photo: null,
            notes: "~7 years younger than Jack (est. 1952)." },
    rels: { father: "jack-father", mother: "jack-mother",
            spouses: ["dolly"], children: ["dan"] }
  },
  {
    id: "dolly",
    data: { gender: "F", "first name": "Dolly", "last name": "Pruden",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["bob"], children: ["dan"] }
  },
  {
    id: "dan",
    data: { gender: "M", "first name": "Dan", "last name": "Pruden",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "bob", mother: "dolly" }
  },

  /* ---- JACK'S AUNT DORIS (paternal — assumption) + STARR BRANCH -----------
     Doris (maiden name Pruden) is a sibling of Jack's father, joined through
     pruden-grandfather. Descends: Jim -> Amy & Lionel -> Annabelle & Bode. --- */
  {
    id: "doris",
    data: { gender: "F", "first name": "Doris", "last name": "Starr",
            birthdate: null, photo: null,
            notes: "Jack's aunt (paternal — assumption). Maiden name Pruden." },
    rels: { father: "pruden-grandfather", spouses: ["frank"], children: ["jim-starr"] }
  },
  {
    id: "frank",
    data: { gender: "M", "first name": "Frank", "last name": "Starr",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["doris"], children: ["jim-starr"] }
  },
  {
    id: "jim-starr",
    data: { gender: "M", "first name": "Jim", "last name": "Starr",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "frank", mother: "doris",
            spouses: ["anne-starr", "janine"], children: ["amy", "lionel", "rachel-starr"] }
  },
  {
    id: "anne-starr",
    data: { gender: "F", "first name": "Anne", "last name": "Starr",
            birthdate: null, photo: null, notes: "Maiden name unknown." },
    rels: { spouses: ["jim-starr"], children: ["amy", "lionel"] }
  },
  {
    id: "amy",
    data: { gender: "F", "first name": "Amy", "last name": "Starr",
            birthdate: null, photo: null,
            notes: "Oldest. Has 2 daughters — omitted for now." },
    rels: { father: "jim-starr", mother: "anne-starr" }
  },
  {
    id: "lionel",
    data: { gender: "M", "first name": "Lionel", "last name": "Starr",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "jim-starr", mother: "anne-starr",
            spouses: ["martha"], children: ["annabelle", "bode"] }
  },
  {
    id: "martha",
    data: { gender: "F", "first name": "Martha", "last name": "Starr",
            birthdate: null, photo: null, notes: "Maiden name unknown." },
    rels: { spouses: ["lionel"], children: ["annabelle", "bode"] }
  },
  {
    id: "annabelle",
    data: { gender: "F", "first name": "Annabelle", "last name": "Starr",
            birthdate: null, photo: null,
            notes: "Age 18 as of 2026 (~2008)." },
    rels: { father: "lionel", mother: "martha" }
  },
  {
    id: "bode",
    data: { gender: "M", "first name": "Bode", "last name": "Starr",
            birthdate: null, photo: null,
            notes: "Age 16 as of 2026 (~2010)." },
    rels: { father: "lionel", mother: "martha" }
  },

  /* ---- JIM STARR'S 2ND WIFE: Janine -> Rachel + Jason -> Ben -------------
     Janine is Jim's second wife (after Anne). Their daughter Rachel is
     distinct from Rachael Monks — different spelling. -------------------- */
  {
    id: "janine",
    data: { gender: "F", "first name": "Janine", "last name": "Starr",
            birthdate: null, photo: null, notes: "Jim Starr's second wife." },
    rels: { spouses: ["jim-starr"], children: ["rachel-starr"] }
  },
  {
    id: "rachel-starr",
    data: { gender: "F", "first name": "Rachel", "last name": "Starr",
            birthdate: null, photo: null,
            notes: "Maiden name Starr. (Distinct from Rachael Monks — different spelling.)" },
    rels: { father: "jim-starr", mother: "janine", spouses: ["jason"], children: ["ben"] }
  },
  {
    id: "jason",
    data: { gender: "M", "first name": "Jason", "last name": "?",
            birthdate: null, photo: null, notes: "Rachel's husband; last name unknown." },
    rels: { spouses: ["rachel-starr"], children: ["ben"] }
  },
  {
    id: "ben",
    data: { gender: "M", "first name": "Ben", "last name": "?",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "jason", mother: "rachel-starr" }
  },

  /* ========================================================================
     KIM'S SIDE — THE PLANSKER FAMILY
     Kim (UNION 2, John's wife) is Ed Plansker's daughter. Her whole family
     joins the tree through her, so everyone below is reachable by tapping
     across from Kim. Ed married twice (Linda first, then Doris); Doris later
     remarried (Reed Markham). Half-siblings hang off whichever marriage had
     them. ID note: distinct ids where a name collides with the Pruden/Starr
     side — doris-markham, frank-plansker, jim-garrow, john-plansker.
     ===================================================================== */

  /* ---- PLANSKER GRANDPARENTS: Frank + Catherine -> Ed, John ------------- */
  {
    id: "frank-plansker",
    data: { gender: "M", "first name": "Frank", "last name": "Plansker",
            birthdate: "1905-10-13", photo: null, notes: "" },
    rels: { spouses: ["catherine"], children: ["ed", "john-plansker"] }
  },
  {
    id: "catherine",
    data: { gender: "F", "first name": "Catherine", "last name": "Grattenthaler",
            birthdate: "1904-09-30", photo: null, notes: "Maiden name Grattenthaler." },
    rels: { spouses: ["frank-plansker"], children: ["ed", "john-plansker"] }
  },
  {
    id: "john-plansker",
    data: { gender: "M", "first name": "John", "last name": "Plansker",
            birthdate: "1929-03-25", photo: null, notes: "" },
    rels: { father: "frank-plansker", mother: "catherine" }
  },

  /* ---- ED PLANSKER (Kim's father) + 2 marriages: Linda, then Doris ------
     Ed's photo auto-links from photos/ed.webp (id "ed"). Divorced Doris 1997. */
  {
    id: "ed",
    data: { gender: "M", "first name": "Ed", "last name": "Plansker",
            birthdate: "1941-09-15", photo: null, notes: "Divorced Doris 1997." },
    rels: { father: "frank-plansker", mother: "catherine",
            spouses: ["linda", "doris-markham"],
            children: ["laura", "sharon", "mike", "kim"] }
  },
  {
    id: "linda",
    data: { gender: "F", "first name": "Linda", "last name": "Thomas",
            birthdate: null, photo: null, notes: "Ed's first wife." },
    rels: { spouses: ["ed"], children: ["laura", "sharon"] }
  },
  {
    id: "doris-markham",
    data: { gender: "F", "first name": "Doris", "last name": "Markham",
            birthdate: "1947-03-16", photo: null,
            notes: "Maiden name Guenther. Married Ed Plansker (div. 1997), later Reed Markham (2006)." },
    rels: { father: "guenther-parent",
            spouses: ["ed", "reed"], children: ["mike", "kim"] }
  },

  /* ---- DORIS'S SISTER: Marion + Terry Latham (stub — more coming later) --
     Doris & Marion's parents are unknown; guenther-parent is a single shared
     placeholder connector that groups them as sisters. -------------------- */
  {
    id: "guenther-parent",
    data: { gender: "M", "first name": "", "last name": "Guenther",
            birthdate: null, photo: null,
            notes: "Doris & Marion's parent; both parents unknown (placeholder connector; gender arbitrary).",
            placeholder: true },
    rels: { children: ["doris-markham", "marion"] }
  },
  {
    id: "marion",
    data: { gender: "F", "first name": "Marion", "last name": "Latham",
            birthdate: "1943-5-27", photo: null,
            notes: "Maiden name Guenther; Doris Markham's sister. More family to be added later." },
    rels: { father: "guenther-parent", spouses: ["terry-latham"] }
  },
  {
    id: "terry-latham",
    data: { gender: "M", "first name": "Terry", "last name": "Latham",
            birthdate: null, photo: null, notes: "2nd Terry in tree." },
    rels: { spouses: ["marion"] }
  },

  /* ---- ED + LINDA -> Laura, Sharon (Kim's half-sisters) ---------------- */
  {
    id: "laura",
    data: { gender: "F", "first name": "Laura", "last name": "Garrow",
            birthdate: "1962-05-09", photo: null, notes: "Maiden name Plansker." },
    rels: { father: "ed", mother: "linda",
            spouses: ["jim-garrow"], children: ["renee"] }
  },
  {
    id: "jim-garrow",
    data: { gender: "M", "first name": "Jim", "last name": "Garrow",
            birthdate: "1963-12-07", photo: null, notes: "" },
    rels: { spouses: ["laura"], children: ["renee"] }
  },
  {
    id: "renee",
    data: { gender: "F", "first name": "Renee", "last name": "Garrow",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "jim-garrow", mother: "laura" }
  },
  {
    id: "sharon",
    data: { gender: "F", "first name": "Sharon", "last name": "Schlatter",
            birthdate: "1963-10-01", photo: null, notes: "Maiden name Plansker." },
    rels: { father: "ed", mother: "linda",
            spouses: ["richard"], children: ["marie"] }
  },
  {
    id: "richard",
    data: { gender: "M", "first name": "Richard", "last name": "Schlatter",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["sharon"], children: ["marie"] }
  },
  {
    id: "marie",
    data: { gender: "F", "first name": "Marie", "last name": "Schlatter",
            birthdate: "1991-12-01", photo: null, notes: "" },
    rels: { father: "richard", mother: "sharon" }
  },

  /* ---- ED + DORIS -> Mike (Kim's brother) ------------------------------ */
  {
    id: "mike",
    data: { gender: "M", "first name": "Mike", "last name": "Plansker",
            birthdate: "1974-12-09", photo: null, notes: "" },
    rels: { father: "ed", mother: "doris-markham",
            spouses: ["rachael"], children: ["sydney"] }
  },
  {
    id: "rachael",
    data: { gender: "F", "first name": "Rachael", "last name": "Monks",
            birthdate: "1974-10-22", photo: null, notes: "" },
    rels: { spouses: ["mike"], children: ["sydney"] }
  },
  {
    id: "sydney",
    data: { gender: "F", "first name": "Sydney", "last name": "Plansker",
            birthdate: "2013-09-08", photo: null, notes: "" },
    rels: { father: "mike", mother: "rachael" }
  },

  /* ---- DORIS'S 2ND MARRIAGE: Reed Markham (2006) -----------------------
     Reed's daughters (Suzie, Chrissy) are from his prior marriage (reed-ex,
     a placeholder). No children with Doris. ----------------------------- */
  {
    id: "reed",
    data: { gender: "M", "first name": "Reed", "last name": "Markham",
            birthdate: "1946-07-20", photo: null,
            notes: "Married Doris 12-28-2006." },
    rels: { spouses: ["reed-ex", "doris-markham"], children: ["suzie", "chrissy"] }
  },
  {
    id: "reed-ex",
    data: { gender: "F", "first name": "", "last name": "",
            birthdate: null, photo: null,
            notes: "Reed's prior wife; mother of Suzie & Chrissy. Name unknown (placeholder).",
            placeholder: true },
    rels: { spouses: ["reed"], children: ["suzie", "chrissy"] }
  },
  {
    id: "suzie",
    data: { gender: "F", "first name": "Suzie", "last name": "Markham",
            birthdate: null, photo: null,
            notes: "Reed's daughter from prior marriage." },
    rels: { father: "reed", mother: "reed-ex" }
  },
  {
    id: "chrissy",
    data: { gender: "F", "first name": "Chrissy", "last name": "Markham",
            birthdate: null, photo: null,
            notes: "Reed's daughter from prior marriage." },
    rels: { father: "reed", mother: "reed-ex" }
  },

  /* ========================================================================
     JANE'S SIDE — THE WERNER / ROHRER FAMILY
     Jane (UNION 1, John's mother) is Jack Werner's daughter. Her birth family
     joins the tree through her, so everyone below is reachable by tapping
     across from Jane. Her mother Betty married once before Jack Werner; that
     first marriage produced Jane's half-sister Carolyn (the Rohrer branch).
     Half-siblings hang off whichever marriage had them. ID note: distinct ids
     where a name collides with an existing person — jack-werner, betty-ex,
     bob-rohrer, anne-rohrer, mike-rohrer, ed-norton.
     ===================================================================== */

  /* ---- WERNER PARENTS: Jack Werner + Betty -> Jane ----------------------
     Betty married twice: an unknown first husband (betty-ex), then Jack
     Werner. Carolyn hangs off the first marriage; Jane off the second. ---- */
  {
    id: "jack-werner",
    data: { gender: "M", "first name": "Jack", "last name": "Werner",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["betty"], children: ["jane"] }
  },
  {
    id: "betty",
    data: { gender: "F", "first name": "Betty", "last name": "Werner",
            birthdate: null, photo: null, notes: "Married once before Jack Werner." },
    rels: { spouses: ["betty-ex", "jack-werner"], children: ["carolyn", "jane"] }
  },
  {
    id: "betty-ex",
    data: { gender: "M", "first name": "", "last name": "",
            birthdate: null, photo: null,
            notes: "Betty's first husband; Carolyn's father. Name unknown (placeholder).",
            placeholder: true },
    rels: { spouses: ["betty"], children: ["carolyn"] }
  },

  /* ---- JANE'S HALF-SISTER: Carolyn + Bob Rohrer -> Steve, Mike, Jan -----
     Carolyn is Betty's daughter from her first marriage (Jane's half-sister). */
  {
    id: "carolyn",
    data: { gender: "F", "first name": "Carolyn", "last name": "Rohrer",
            birthdate: null, photo: null,
            notes: "Betty's daughter from her first marriage; Jane's half-sister." },
    rels: { father: "betty-ex", mother: "betty",
            spouses: ["bob-rohrer"], children: ["steve", "mike-rohrer", "jan"] }
  },
  {
    id: "bob-rohrer",
    data: { gender: "M", "first name": "Bob", "last name": "Rohrer",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["carolyn"], children: ["steve", "mike-rohrer", "jan"] }
  },

  /* ---- CAROLYN + BOB'S CHILDREN: Steve, Mike, Jan ---------------------- */
  {
    id: "steve",
    data: { gender: "M", "first name": "Steve", "last name": "Rohrer",
            birthdate: null, photo: null,
            notes: "Has 2 daughters; second not yet named." },
    rels: { father: "bob-rohrer", mother: "carolyn", spouses: ["anne-rohrer"],
            children: ["jen-rohrer-clisson"] }
  },
  {
    id: "anne-rohrer",
    data: { gender: "F", "first name": "Anne", "last name": "Rohrer",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["steve"], children: ["jen-rohrer-clisson"] }
  },
  {
    id: "jen-rohrer-clisson",
    data: { gender: "F", "first name": "Jen", "last name": "Rohrer-Clisson",
            birthdate: null, photo: null,
            notes: "Daughter of Steve & Anne Rohrer." },
    rels: { father: "steve", mother: "anne-rohrer" }
  },
  {
    id: "mike-rohrer",
    data: { gender: "M", "first name": "Mike", "last name": "Rohrer",
            birthdate: null, photo: null, notes: "No children." },
    rels: { father: "bob-rohrer", mother: "carolyn", spouses: ["melissa"] }
  },
  {
    id: "melissa",
    data: { gender: "F", "first name": "Melissa", "last name": "Rohrer",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["mike-rohrer"] }
  },
  {
    id: "jan",
    data: { gender: "F", "first name": "Jan", "last name": "Norton",
            birthdate: null, photo: null,
            notes: "Maiden name Rohrer. No children with Ed; Ed has children from a prior marriage (omitted)." },
    rels: { father: "bob-rohrer", mother: "carolyn", spouses: ["ed-norton"] }
  },
  {
    id: "ed-norton",
    data: { gender: "M", "first name": "Ed", "last name": "Norton",
            birthdate: null, photo: null,
            notes: "Has children from a previous marriage — omitted for now." },
    rels: { spouses: ["jan"] }
  },

  /* ========================================================================
     PEG'S SIDE — THE BYRNES CLAN
     Peg (UNION 3/5, Jack's 2nd wife and mother of the James kids) is Robert &
     Mary Byrnes's daughter. Her whole birth family joins the tree through her,
     so everyone below is reachable by tapping across from Peg. Robert & Mary
     had four kids: Peg, Terry, Bob Sr., and Maryann ("Annie"). Each sibling's
     family is grouped in its own block below. ID note: distinct ids where a
     name collides with an existing person — bob-byrnes (4th Bob), kelly-byrnes
     (2nd Kelly), michael-byrnes, dan-karen (2nd Dan). Two placeholder ghosts:
     bob-byrnes-ex and karen-ex.
     ===================================================================== */

  /* ---- BYRNES GRANDPARENTS: Robert + Mary -> Peg, Terry, Bob Sr., Maryann - */
  {
    id: "robert-byrnes",
    data: { gender: "M", "first name": "Robert", "last name": "Byrnes",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["mary-byrnes"],
            children: ["peg", "terry", "bob-byrnes", "maryann"] }
  },
  {
    id: "mary-byrnes",
    data: { gender: "F", "first name": "Mary", "last name": "Byrnes",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["robert-byrnes"],
            children: ["peg", "terry", "bob-byrnes", "maryann"] }
  },

  /* ---- TERRY BYRNES (Peg's sibling) + Dianne -> Kevin, David, Kelly ------- */
  {
    id: "terry",
    data: { gender: "M", "first name": "Terry", "last name": "Byrnes",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "robert-byrnes", mother: "mary-byrnes",
            spouses: ["dianne"], children: ["kevin-byrnes", "david-byrnes", "kelly-byrnes"] }
  },
  {
    id: "dianne",
    data: { gender: "F", "first name": "Dianne", "last name": "Byrnes",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["terry"], children: ["kevin-byrnes", "david-byrnes", "kelly-byrnes"] }
  },
  {
    id: "kevin-byrnes",
    data: { gender: "M", "first name": "Kevin", "last name": "Byrnes",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "terry", mother: "dianne", spouses: ["laurie-byrnes"] }
  },
  {
    id: "laurie-byrnes",
    data: { gender: "F", "first name": "Laurie", "last name": "Byrnes",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["kevin-byrnes"] }
  },
  {
    id: "david-byrnes",
    data: { gender: "M", "first name": "David", "last name": "Byrnes",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "terry", mother: "dianne" }
  },
  {
    id: "kelly-byrnes",
    data: { gender: "F", "first name": "Kelly", "last name": "Byrnes",
            birthdate: null, photo: null,
            notes: "(2nd Kelly in tree.)" },
    rels: { father: "terry", mother: "dianne" }
  },

  /* ---- BOB BYRNES SR. (Peg's sibling; 2 marriages) ----------------------
     Married bob-byrnes-ex (placeholder ghost) first -> Bobby & Michael, then
     Cheryl -> Lauren. Half-siblings hang off whichever marriage had them. --- */
  {
    id: "bob-byrnes",
    data: { gender: "M", "first name": "Bob", "last name": "Byrnes",
            birthdate: null, photo: null, notes: "Bob Sr. (4th Bob in tree.)" },
    rels: { father: "robert-byrnes", mother: "mary-byrnes",
            spouses: ["bob-byrnes-ex", "cheryl"],
            children: ["bobby-byrnes", "michael-byrnes", "lauren"] }
  },
  {
    id: "bob-byrnes-ex",
    data: { gender: "F", "first name": "", "last name": "",
            birthdate: null, photo: null,
            notes: "Bob Byrnes Sr.'s first wife; mother of Bobby & Michael. Name unknown (placeholder).",
            placeholder: true },
    rels: { spouses: ["bob-byrnes"], children: ["bobby-byrnes", "michael-byrnes"] }
  },
  {
    id: "cheryl",
    data: { gender: "F", "first name": "Cheryl", "last name": "Byrnes",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["bob-byrnes"], children: ["lauren"] }
  },
  {
    id: "bobby-byrnes",
    data: { gender: "M", "first name": "Bobby", "last name": "Byrnes",
            birthdate: null, photo: null,
            notes: "Married with children — details unknown, omitted for now." },
    rels: { father: "bob-byrnes", mother: "bob-byrnes-ex" }
  },
  {
    id: "michael-byrnes",
    data: { gender: "M", "first name": "Michael", "last name": "Byrnes",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "bob-byrnes", mother: "bob-byrnes-ex",
            spouses: ["dana"],
            children: ["michael-byrnes-jr", "nicholas-byrnes", "rebecca-byrnes-patten"] }
  },
  {
    id: "dana",
    data: { gender: "F", "first name": "Dana", "last name": "Byrnes",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["michael-byrnes"],
            children: ["michael-byrnes-jr", "nicholas-byrnes", "rebecca-byrnes-patten"] }
  },
  {
    id: "michael-byrnes-jr",
    data: { gender: "M", "first name": "Michael", "last name": "Byrnes",
            birthdate: null, photo: null, notes: "Named after his father Michael." },
    rels: { father: "michael-byrnes", mother: "dana" }
  },
  {
    id: "nicholas-byrnes",
    data: { gender: "M", "first name": "Nicholas", "last name": "Byrnes",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "michael-byrnes", mother: "dana" }
  },
  {
    id: "rebecca-byrnes-patten",
    data: { gender: "F", "first name": "Rebecca", "last name": "Byrnes-Patten",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "michael-byrnes", mother: "dana" }
  },
  {
    id: "lauren",
    data: { gender: "F", "first name": "Lauren", "last name": "Roychoudhuri",
            birthdate: null, photo: null, notes: "Maiden name Byrnes." },
    rels: { father: "bob-byrnes", mother: "cheryl",
            spouses: ["rahul"], children: ["ava", "owen"] }
  },
  {
    id: "rahul",
    data: { gender: "M", "first name": "Rahul", "last name": "Roychoudhuri",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["lauren"], children: ["ava", "owen"] }
  },
  {
    id: "ava",
    data: { gender: "F", "first name": "Ava", "last name": "Roychoudhuri",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "rahul", mother: "lauren" }
  },
  {
    id: "owen",
    data: { gender: "M", "first name": "Owen", "last name": "Roychoudhuri",
            birthdate: null, photo: null, notes: "" },
    rels: { father: "rahul", mother: "lauren" }
  },

  /* ---- MARYANN "ANNIE" (Peg's sibling) + Fred Temple -> Kathy, Karen, Sean
     Karen was married before (karen-ex, placeholder ghost) -> Matthew, and is
     now married to Dan (dan-karen; last name unknown). ------------------- */
  {
    id: "maryann",
    data: { gender: "F", "first name": "Maryann", "last name": "Temple",
            birthdate: null, photo: null,
            notes: "Goes by Annie. Maiden name Byrnes." },
    rels: { father: "robert-byrnes", mother: "mary-byrnes",
            spouses: ["fred"], children: ["kathy-temple", "karen-temple", "sean-temple"] }
  },
  {
    id: "fred",
    data: { gender: "M", "first name": "Fred", "last name": "Temple",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["maryann"], children: ["kathy-temple", "karen-temple", "sean-temple"] }
  },
  {
    id: "kathy-temple",
    data: { gender: "F", "first name": "Kathy", "last name": "Temple",
            birthdate: null, photo: null, notes: "Never married; no children." },
    rels: { father: "fred", mother: "maryann" }
  },
  {
    id: "karen-temple",
    data: { gender: "F", "first name": "Karen", "last name": "Temple",
            birthdate: null, photo: null,
            notes: "Maiden name Temple. Son Matthew from her first marriage; now married to Dan (last name unknown)." },
    rels: { father: "fred", mother: "maryann",
            spouses: ["karen-ex", "dan-karen"], children: ["matthew-temple"] }
  },
  {
    id: "karen-ex",
    data: { gender: "M", "first name": "", "last name": "",
            birthdate: null, photo: null,
            notes: "Karen's first husband; Matthew's father. Name unknown (placeholder).",
            placeholder: true },
    rels: { spouses: ["karen-temple"], children: ["matthew-temple"] }
  },
  {
    id: "dan-karen",
    data: { gender: "M", "first name": "Dan", "last name": "?",
            birthdate: null, photo: null,
            notes: "Karen's current husband; last name unknown. (2nd Dan in tree.)" },
    rels: { spouses: ["karen-temple"] }
  },
  {
    id: "matthew-temple",
    data: { gender: "M", "first name": "Matthew", "last name": "Temple",
            birthdate: null, photo: null,
            notes: "Karen's son from her first marriage." },
    rels: { father: "karen-ex", mother: "karen-temple" }
  },
  {
    id: "sean-temple",
    data: { gender: "M", "first name": "Sean", "last name": "Temple",
            birthdate: null, photo: null,
            notes: "Has 2 children (a daughter and a son) — names unknown, omitted for now." },
    rels: { father: "fred", mother: "maryann", spouses: ["stephanie-temple"] }
  },
  {
    id: "stephanie-temple",
    data: { gender: "F", "first name": "Stephanie", "last name": "Temple",
            birthdate: null, photo: null, notes: "" },
    rels: { spouses: ["sean-temple"] }
  }

];
