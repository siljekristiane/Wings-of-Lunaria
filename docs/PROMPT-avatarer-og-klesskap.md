# Oppgave: Nye høyoppløste avatarer, redigerbart klesskap og riktig størrelse/kamera

Du jobber i repoet **Wings of Lunaria** (React + Three.js, Vite). Les først `README.md`, `src/three/characterRig.js`, `src/three/toon.js`, `src/three/GameScene3D.jsx`, `src/components/CharacterCreator.jsx`, `src/components/Wardrobe.jsx`, `src/components/AvatarPreview3D.jsx`, `src/data/gameData.js` og `src/data/defaultSave.js`, slik at du forstår hvordan avatar, garderobe, lagring og kamera henger sammen i dag.

Jobb i små steg, og sjekk i nettleseren (`npm run dev`) etter hvert steg at spillet starter, at gamle lagrede spill fortsatt lastes, og at ingenting annet er ødelagt. Commit etter hvert ferdige steg.

---

## 1. Mål

1. Bytt ut dagens enkle avatar (kapsler og kuler) med en **høyoppløst ("high poly") avatar** som fortsatt matcher spillets stil.
2. Spilleren skal kunne **redigere avataren sin selv inne i spillet**: frisyre, hårfarge, hud, øyne og klær.
3. Lag et **klesskap** med mange plagg man kan bytte mellom. Plagg skal kunne være **låst bak quests eller mynter**.
4. Gjør avataren **mindre**: under halvparten så høy som lyktestolpene.
5. Tilpass **kameraet** til den nye størrelsen, slik at man kan zoome helt inn på avataren.
6. Skriv koden slik at jeg enkelt kan gjøre **hyppige endringer** (nye plagg, nye frisyrer, nye quests, nye priser) uten å røre motor-koden.

---

## 2. Stil som må matches

- Myk, søt fantasy-stil med runde former. Ikke realistisk.
- Bruk **samme toon-shading** som i dag: `MeshToonMaterial` med den 8-trinns fargede rampen i `src/three/toon.js` (kjølig blå i skygge, varm gull i lys). Gjenbruk `toonMat()`.
- Legg til en **tynn mørk kontur** (inverted hull: en BackSide-kopi av meshet der vertexene skyves litt ut langs normalen, farge ca. `#1b1733`).
- Proporsjoner: litt stort, rundt hode (ca. 1/4 av kroppshøyden), tydelig hals, **små spisse alveører**, **store blanke øyne** (hvite, iris, pupill, to glanspunkter, vipper) som blunker, liten nese, lite smil, rosa kinn.
- Fargepalett: hold deg til fargene som allerede finnes i `gameData.js` (hudtoner, hårfarger, øyefarger, klesfarger) og UI-paletten (dypblå, lavendel, gull, måneskinn).
- Ingen tredjeparts-IP. Alt skal være originalt.

### Hva "high poly" betyr her

- Hode: glatt kule (ca. 96×72 segmenter) med litt smalere kjeve.
- Kropp og lemmer: glatte `LatheGeometry`-profiler med avrundede ender, ikke kapsler med få segmenter.
- Hår: mange separate hårlokker laget som `TubeGeometry` langs `CatmullRomCurve3`, som **smalner av mot tuppen**, oppå en hårkappe. Fletter skal være ekte flettede tråder.
- Klær: egne former, ikke bare innfarging av kroppen. For eksempel kåpe som åpner seg foran med kantbånd, kappe med hette, skjørt med bølgete fald, puffermer, vest med knapper, skjerf.

---

## 3. Størrelse

I dag er avataren ca. **1,48** enheter høy, mens lyktestolpene (`world.js`, stolpe 1,4 + lykt på ca. 1,5) er ca. **1,62** høye. Avataren er altså nesten like høy som lyktene.

- Ny avatarhøyde: **0,72 enheter** fra fotsåle til hodetopp (under halvparten av lyktestolpen).
- Definer høyden som **én konstant** (f.eks. `AVATAR_HEIGHT` i `src/three/avatar/proportions.js`). Alt annet som avhenger av størrelsen skal regnes ut fra den: fotplassering, kontaktskygge, kollisjonsradius, hoppehøyde, ganghastighet, kameraets fokuspunkt og kameraavstander. Jeg skal kunne endre ett tall og få alt til å følge med.
- Bygg modellen i en egen "modellskala" og skaler hele gruppen til `AVATAR_HEIGHT`. Regn ut fotens offset fra bounding box i stedet for et hardkodet tall (erstatt `GROUND_FOOT_OFFSET = 0.56`).
- NPC-ene (Elowen, Mira, Rowan) skal bruke samme avatarsystem og samme størrelse, slik at verden henger sammen.
- Juster ganghastighet og hopp slik at det fortsatt føles naturlig for en mindre figur (gjør det til konstanter jeg kan finjustere).

---

## 4. Kamera

Dagens kamera er laget for en stor figur (`CAMERA_PRESETS` med avstand 3,1–13, fokus på `groundY + 1.1`, near-plane 0,1, gulvgrense `+ 0.6`).

- Fokuspunkt: ca. `AVATAR_HEIGHT * 0.6` over bakken (rundt brystet), ikke 1,1.
- Skaler alle presets ut fra `AVATAR_HEIGHT`.
- **Kontinuerlig zoom** med musehjul og to-finger-klyp på mobil, fra helt nært (ca. 0,3 enheter, så ansiktet fyller skjermen) til langt unna (ca. 10). Når man zoomer helt inn, skal fokuset gli opp mot ansiktet.
- Sett `camera.near` til ca. 0,01 så avataren ikke klippes bort på nært hold.
- Gulvgrensen (`floorY + 0.6`) må skaleres ned (ca. 0,12), ellers kan kameraet ikke komme lavt nok.
- Avstandsglideren i pausemenyen skal fortsatt virke, men med det nye området.
- Lagre zoomnivået i `save` som i dag.

---

## 5. Kodestruktur (viktig: lett å endre)

All avatarkode skal være **datadrevet**. Å legge til et nytt plagg skal normalt bare kreve én ny oppføring i en datafil.

Foreslått struktur (juster om du ser noe bedre):

```
src/three/avatar/
  proportions.js     // AVATAR_HEIGHT og alle mål/forhold på ett sted
  materials.js       // toon-materialer med cache, konturmateriale
  geometry.js        // hjelpere: limb(), lathe(), strand() med avsmalning, extrude-former
  body.js            // kropp, armer, bein, hender
  head.js            // hode, ører, øyne, bryn, munn, kinn
  hair/index.js      // register: { long, bob, ponytail, crown, curly } -> byggefunksjon
  clothing/index.js  // register over plaggtyper (patterns): coat, cloak, tunic, blouse, vest, skirt, pants, boots, scarf, circlet, pin ...
  wings/index.js     // register over vingestiler (for senere)
  buildAvatar.js     // setter alt sammen fra et "appearance"-objekt
  animateAvatar.js   // idle, gange, løp, hopp, emotes, blunking, hår/skjørt som svaier
src/data/wardrobe.js // KATALOG over alle plagg (bare data)
src/data/unlocks.js  // regler for hva som er låst opp
```

Prinsipper:

- **Plagg = data + mønster.** Hvert plagg i katalogen peker på en plaggtype (`pattern`) og gir parametere (farger, lengde, detaljer). Mønsteret bygger geometrien. Nye plagg med eksisterende mønster krever ingen ny kode.
- **Spor (slots):** `hair`, `top`, `outer` (kåpe/kappe over toppen), `bottom`, `shoes`, `headAccessory`, `bodyAccessory`, `wings` (tomt inntil videre, bruk eksisterende `wingSlot`). Et plagg kan erklære at det dekker andre spor (f.eks. en kjole som dekker både `top` og `bottom`).
- **Én funksjon** `buildAvatar(appearance, { detail })` brukes overalt: i spillet, i karakterskaperen, i klesskapet og for NPC-er.
- **Detaljnivå (LOD):** `detail: 'high' | 'medium' | 'low'`. Høyest i karakterskaper og klesskap og når kameraet er helt nært, medium for spilleren i verden, lav for NPC-er langt unna. Antall hårlokker og segmenter styres av detaljnivået.
- **Ytelse:** slå sammen hårlokker og andre små deler til én geometri per materiale (`BufferGeometryUtils.mergeGeometries`), del materialer, og **dispose** gamle geometrier ved bytte av klær. Mål: jevn bildefrekvens på en mellomklasse-mobil. Rettesnor: spiller i verden ≤ ca. 120 000 trekanter, NPC ≤ ca. 40 000, forhåndsvisning i klesskap kan gå mye høyere.
- **Bytte av klær skal ikke bygge hele avataren på nytt** hvis det kan unngås: bytt bare ut gruppen for det aktuelle sporet.
- Ingen magiske tall spredt rundt i koden. Mål, farger og priser ligger i data- eller konstantfiler med korte kommentarer.

### Eksempel på en katalogoppføring

```js
{
  id: 'outer_lavender_coat',
  name: 'Lavendelkåpe',
  slot: 'outer',
  pattern: 'coat',
  params: { color: '#a89bd9', trim: '#d9b45c', belt: '#7a5ea8', length: 'knee' },
  colorVariants: ['#a89bd9', '#5e8f6f', '#3f4a6b'],   // valgfritt: spilleren kan velge farge
  unlock: { type: 'coins', cost: 40 },
  tags: ['magisk', 'høst'],
}
```

Låsetyper:

```js
unlock: { type: 'free' }
unlock: { type: 'coins', cost: 60 }
unlock: { type: 'quest', questId: 'mainQuest' }            // låses opp når questen er fullført
unlock: { type: 'questAndCoins', questId: 'dragonflyQuest', cost: 30 }  // blir kjøpbart etter quest
unlock: { type: 'hidden' }                                   // vises ikke før det er låst opp
```

- All logikk for låsing ligger i `src/data/unlocks.js`: `getItemState(item, save)` returnerer `'owned' | 'buyable' | 'locked' | 'hidden'` pluss en lesbar grunn ("Fullfør «Det falmede stjernekartet»", "40 mynter").
- Quest-belønninger peker på plagg-id-er i `QUESTS`-registeret, så en quest kan låse opp plagg uten egen kode.
- **Mynter:** bruk den eksisterende valutaen `stardust` i lagringen. Visningsnavnet (f.eks. «mynter» eller «stjernestøv») skal ligge i én konstant så jeg kan bytte det.
- Legg inn et **utviklerflagg** (f.eks. `?unlockAll` i URL-en eller en konstant) som låser opp alt, så jeg kan teste plagg uten å spille gjennom quests.

---

## 6. Klesskapet (in-game)

Åpnes fra speilet/skapet på rommet i Asterwyn Academy som i dag, men bygges om:

- Stor **3D-forhåndsvisning** av avataren som kan roteres med dra og zoomes med hjul/klyp helt inn til ansiktet.
- Faner per spor: Hår, Topp, Ytterplagg, Underdel, Sko, Tilbehør (og Vinger, skjult inntil videre).
- Hår-fanen lar spilleren endre frisyre og hårfarge. Egen seksjon (eller knapp) for hud og øyne, så hele utseendet kan redigeres etter at karakteren er laget.
- Hvert plagg vises som et kort med navn, liten fargeprøve og tilstand:
  - **Eid:** klikk for å prøve på.
  - **Kan kjøpes:** viser pris, knapp «Kjøp» (grå hvis man ikke har nok mynter).
  - **Låst:** hengelås og grunnen («Fullfør «Det falmede stjernekartet»»).
  - **Skjult:** vises ikke.
- Fargevarianter vises som små prikker under plagget når det finnes.
- Man kan prøve på låste plagg i forhåndsvisningen (tydelig merket «Prøver»), men ikke lagre dem.
- Knappene «Lagre antrekk» og «Avbryt». Escape lukker som i dag.
- (Fint å ha:) 3 lagrede antrekk-plasser spilleren kan bytte mellom.
- Teksten i UI-et skal være på norsk, som resten av spillet.

Karakterskaperen skal bruke samme komponenter og samme `buildAvatar`, og tilby de fire startantrekkene under som ferdige valg, pluss fri tilpasning.

---

## 7. De fire startavatarene (presets)

Bygg disse som `appearance`-oppsett (data), og gjør dem valgbare i karakterskaperen. Alle plagg her skal være gratis/eid fra start for den som velger presetet.

**Stjernekartisten** (drømmende og klok)
- Hud `#ffe0c2`, hår `#e8e3d9` (mørkere tone `#b8b0a2`), øyne `#7a5ea8`
- Frisyre: langt og bølgete, lokker over skuldrene, pannelugg
- Lavendelkåpe (`#a89bd9`) til knærne, åpen foran med gullkant (`#d9b45c`), lilla belte med stjernespenne. Lyse underplagg (`#eef0f7`).
- Reisebukser (`#6b5b4a`), Stjernesandaler (`#d9b45c`)
- Månediadem: tynn gullring rundt hodet med en liten månesigd foran

**Skogvokteren** (modig og rolig)
- Hud `#b0743f`, hår `#a8672b` (mørkere `#7a4a1c`), øyne `#5ea87d`
- Frisyre: flettet krone (tre flettede tråder rundt hodet), hår strøket bakover
- Reisetunika (`#8fb3c9`) med utsvingt nederkant og brunt belte
- Skogkappe (`#5e8f6f`) over skuldrene med hette og gullspenner, bølgete nederkant
- Skumringsbukser (`#3f4a6b`), Mosesko (`#5e8f6f`)
- Liten bladspenne i håret

**Måneskinnsdrømmeren** (leken og nysgjerrig)
- Hud `#f3c99e`, hår `#4a7fae` (mørkere `#2f5d86`), øyne `#4a7fae`
- Frisyre: høy hestehale med lavendel hårstrikk, pannelugg
- Måneskinnsbluse (`#eef0f7`) med puffermer og liten lavendel sløyfe
- Flytende skjørt (`#7a5ea8`) med bølgete fald
- Høye Vandrestøvler (`#5a4632`)
- Stjernenål på brystet

**Skumringseventyreren** (sprudlende og tøff)
- Hud `#7a4a2b`, hår `#c96b8a` (mørkere `#9a4867`), øyne `#c9a13b`
- Frisyre: kort bob med tykk, ujevn lugg
- Gyllen vest (`#d9b45c`) åpen foran med knapper, over lyseblå skjorte (`#8fb3c9`) med oppbrettede ermer
- Skumringsbukser (`#3f4a6b`), Vandrestøvler (`#5a4632`)
- Tåkeskjerf (`#a89bd9`) rundt halsen med to haler

Bruk `docs/avatar-referanse.html` som visuell og teknisk referanse: den inneholder en fungerende Three.js-versjon av disse fire avatarene med hårlokker, øyne, klær og vinger. Hent byggeteknikkene derfra, men organiser koden etter strukturen over.

---

## 8. Startkatalog for klesskapet

Behold alle plaggene som finnes i `CLOTHING_CATALOG` i dag (samme id-er, så gamle lagringer fungerer), flytt dem over i den nye katalogen og gi dem riktig `pattern`. Legg i tillegg til noen nye, slik at skapet føles fullt. Forslag (priser og låser er lette å endre senere):

| Spor | Plagg | Lås |
|---|---|---|
| Topp | Reisetunika | Gratis |
| Topp | Måneskinnsbluse | 55 mynter |
| Topp | Gyllen vest (med skjorte) | 60 mynter |
| Topp | Ugleullgenser (myk strikk, høy hals) | 45 mynter |
| Ytterplagg | Lavendelkåpe | 40 mynter |
| Ytterplagg | Skogkappe | Quest: Rowans øyenstikker-oppdrag |
| Ytterplagg | Stjernekartkåpe (mørkeblå med små lysende stjerner) | Quest: Det falmede stjernekartet |
| Underdel | Reisebukser | Gratis |
| Underdel | Flytende skjørt | 45 mynter |
| Underdel | Skumringsbukser | 45 mynter |
| Underdel | Kronbladshorts | 35 mynter |
| Hel drakt | Nattskykjole (dekker topp + underdel) | 80 mynter |
| Sko | Vandrestøvler | Gratis |
| Sko | Stjernesandaler | 30 mynter |
| Sko | Mosesko | 30 mynter |
| Hodetilbehør | Månediadem | 70 mynter |
| Hodetilbehør | Blomsterkrans | 25 mynter |
| Hodetilbehør | Bladspenne | Gratis |
| Kroppstilbehør | Stjernenål | 25 mynter |
| Kroppstilbehør | Tåkeskjerf | 35 mynter |
| Kroppstilbehør | Stjernekartists brosje | Quest-belønning (finnes allerede) |
| Vinger | (tomt nå, men systemet skal støtte det) | Skjult |

Frisyrer (langt og bølgete, kort bob, flettet krone, høy hestehale, krøllete løs) er gratis. Hver frisyre skal ha sin egen form; i dag ser flere av dem like ut.

---

## 9. Lagring og bakoverkompatibilitet

- Utvid `save` med det nye utseendet (`appearance`: frisyre, farger, utstyr per spor, valgte fargevarianter) og eventuelle lagrede antrekk.
- Oppdater `normalizeSave()` slik at gamle lagringer (med `player.outfit`, `equippedOutfit` og `ownedClothing`) konverteres automatisk. Ingen spiller skal miste plagg eller utseende.
- Øk `version` og legg migreringen ett sted, med en kort kommentar.

---

## 10. Ferdig når

- [ ] Avataren er høyoppløst, i spillets toon-stil, med kontur, store øyne, spisse ører og ekte hårlokker.
- [ ] Avataren er 0,72 høy (under halvparten av lyktestolpene), står riktig på bakken og har riktig skygge. NPC-ene har samme størrelse.
- [ ] Kameraet følger den nye størrelsen og kan zoomes kontinuerlig fra ansiktsnært til langt unna, på PC og mobil.
- [ ] Klesskapet viser alle plagg med riktig tilstand (eid, kan kjøpes, låst, skjult), og kjøp trekker mynter.
- [ ] Å fullføre en quest låser opp plaggene den er koblet til.
- [ ] Hud, øyne, frisyre og hårfarge kan endres i spillet etter at karakteren er laget.
- [ ] De fire startavatarene kan velges i karakterskaperen.
- [ ] Et nytt plagg kan legges til ved å skrive én oppføring i `src/data/wardrobe.js`, og en ny pris eller lås endres der eller i `unlocks.js`. Skriv en kort seksjon i `README.md` som forklarer hvordan man legger til plagg, frisyrer og låser.
- [ ] Gamle lagringer lastes uten feil.
- [ ] Spillet kjører jevnt, og det er ingen feil i konsollen.
