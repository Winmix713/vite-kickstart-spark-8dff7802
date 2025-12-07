# WinMix TipsterHub - Teljes Felhasználói Útmutató

**Comprehensive End-to-End User Guide** / Részletes Felhasználói Útmutató

---

## Tartalomjegyzék / Table of Contents

1. [Bevezetés és Első Lépések](#1-bevezetés-és-első-lépések)
2. [Navigáció és Fő Folyamatok](#2-navigáció-és-fő-folyamatok)
3. [Adatok és Modellek](#3-adatok-és-modellek)
4. [CSV Importálás (Hamarosan)](#4-csv-importálás-hamarosan)
5. [Háttérfolyamatok és Feladatok](#5-háttérfolyamatok-és-feladatok)
6. [Monitorozás és Hibaelhárítás](#6-monitorozás-és-hibaelhárítás)
7. [Biztonság és Adatvédelem](#7-biztonság-és-adatvédelem)
8. [Gyakran Ismételt Kérdések](#8-gyakran-ismételt-kérdések)

---

## 1. Bevezetés és Első Lépések

### Rendszer Áttekintése / System Overview

**English Summary:** WinMix TipsterHub is an AI-powered football analytics platform that provides predictions, match analysis, and collaborative intelligence features across multiple phases of development.

A WinMix TipsterHub egy MI-alapú labdarúgás elemzési platform, amely:
- Predikciókat generál meccsekre
- Valós idejű elemzéseket nyújt
- Szerepkör-alapú hozzáférést biztosít
- Közösségi intelligenciát használ

### Terminológia / Key Terms

| Magyar / Hungarian | English | Leírás / Description |
|---|---|---|
| Jóslat | Prediction | AI által generált meccseredmény |
| Konfidencia | Confidence | Predikció megbízhatósági szintje |
| CSS Score | CSS Score | Custom Scoring System értékelés |
| Szerepkör | Role | Felhasználói jogosultsági szint |
| Háttérfeladat | Background Job | Automatizált rendszerfolyamat |

### Hozzáférés és Regisztráció / Access and Registration

#### Regisztráció Lépései / Sign-up Steps

1. **Látogasson el** a `/signup` oldalra
2. **Adja meg** email címét és jelszavát
   - Minimum 6 karakter hosszúságú jelszó
   - Érvényes email formátum
3. **Kattintson** a "Regisztráció" gombra
4. **Ellenőrizze** email fiókját a megerősítő linkért
5. **Jelentkezzen be** a `/login` oldalon

**English Summary:** Users can register with email/password, with automatic profile creation and optional email verification.

#### Bejelentkezés / Sign-in Process

```
📧 Email: user@example.com
🔐 Jelszó: ********
✅ Emlékezz rám: [X]
🔑 Bejelentkezés gomb
```

### Szerepkörök és Jogosultságok / Roles and Permissions

#### Szerepkör Mátrix / Role Matrix

| Funkció / Feature | Admin | Elemző / Analyst | Felhasználó / User |
|---|---|---|---|
| 📊 Irányítópult / Dashboard | ✅ | ✅ | ✅ |
| 🔍 Predikciók létrehozása / Create predictions | ✅ | ✅ | ✅ |
| 📈 Elemzések / Analytics | ✅ | ✅ | ✅ |
| ⚙️ Modellek / Models | ✅ | ✅ | ❌ (csak olvasás) |
| 📋 Háttérfeladatok / Jobs | ✅ | ✅ | ❌ |
| 🌐 Bajnokságok / Leagues | ✅ | ✅ | ✅ |
| 👥 Csapatok / Teams | ✅ | ✅ | ✅ |
| 📱 Monitorozás / Monitoring | ✅ | ✅ | ❌ |

**English Summary:** Three-tier role system with Admin having full access, Analyst able to create predictions and manage jobs, and User having read-only access to most features.

---

## 2. Navigáció és Fő Folyamatok

### Útvonal Struktúra / Route Structure

#### Nyilvános Oldalak / Public Pages (Nincs auth szükséges)

```
🏠 / - Főoldal
🔐 /login - Bejelentkezés
📝 /signup - Regisztráció
```

#### Demo Oldalak / Demo Pages (Írásvédett vendégeknek)

```
⚽ /predictions - Predikciók megtekintése
📅 /matches - Meccsek böngészése
👥 /teams - Csapatok listája
🏆 /leagues - Bajnokságok
```

#### Védett Útvonalak / Protected Routes (Auth szükséges)

```
📊 /dashboard - Főirányítópult
🔮 /predictions/new - Új predikció
📈 /analytics - Elemzések
⚙️ /models - Modellek
📱 /monitoring - Monitorozás
🌐 /crossleague - Bajnokságok közötti elemzés
🚀 /phase9 - Haladó funkciók
```

#### Szerepkör-korlátozott / Role-Restricted

```
📋 /jobs - Háttérfeladatok (Admin, Elemző)
```

### Navigációs Folyamatok / Navigation Flows

#### 1. Predikció Létrehozása / Creating Prediction

```
📍 /predictions/new
├── 1. Válasszon 8 meccset
├── 2. Adja meg predikciókat
├── 3. Állítsa be konfidenciát
└── 4. Mentés és elemzés
```

#### 2. Elemzések Megtekintése / Viewing Analytics

```
📍 /analytics
├── 📊 Teljesítmény grafikonok
├── 🎯 Pontossági mutatók
├── 📈 Trend elemzések
└── 🏆 Bajnokságonkénti bontás
```

#### 3. Monitorozás / Monitoring

```
📍 /monitoring
├── 💚 Rendszer állapot
├── 📊 Teljesítmény metrikák
├── ⚠️ Riasztások
└── 📝 Rendszer naplók
```

---

## 3. Adatok és Modellek

### Adatfrissesség / Data Freshness

#### Frissítési Ciklusok / Update Cadence

| Adat Típus / Data Type | Frissítés / Update | Forrás / Source |
|---|---|---|
| Meccsek / Matches | Naponta / Daily | API feed |
| Eredmények / Results | Valós időben / Real-time | Match events |
| Predikciók / Predictions | Automatikus / Auto | AI models |
| Statisztikák / Statistics | Óránként / Hourly | Computed |

### Predikció Generálás / Prediction Generation

#### Folyamat / Process

1. **Adatgyűjtés** - Meccs adatok, statisztikák
2. **Elemzés** - Form elemzés, head-to-record
3. **Model futtatás** - AI algoritmusok
4. **Konfidencia számítás** - Megbízhatóság értékelés
5. **Predikció mentés** - Adatbázisba tárolás

**English Summary:** Predictions are generated using AI models that analyze team form, historical data, and various statistical factors to produce confidence-scored predictions.

### Phase 9 Funkciók / Phase 9 Features

#### 9.1 Közösségi Intelligencia / Collaborative Intelligence

```
👥 Felhasználói predikciók
📊 Tömeges bölcsesség elemzés
🎯 Model vs felhasználó összehasonlítás
```

#### 9.2 Piaci Integráció / Market Integration

```
💰 Bookmaker oddsok
📈 Value bet detekció
🎰 Kelly Criterion alkalmazás
```

#### 9.3 Időbeli Lemondás / Temporal Decay

```
⏰ Információ frissesség
📉 Exponenciális csökkenés
🔄 Automatikus adatfrissítés
```

#### 9.4 Önfejlesztő Rendszer / Self-Improving

```
🧪 Feature kísérletek
📊 A/B tesztelés
🔄 Folyamatos tanulás
```

---

## 4. CSV Importálás (Hamarosan)

### Tervezett Funkcionalitás / Planned Features

#### Szezonok Feltöltése / Season Upload

```
📁 CSV formátum
├── Dátum / Date
├── Hazai csapat / Home Team
├── Vendég csapat / Away Team
├── Eredmény / Result
└── Statisztikák / Statistics
```

#### Validációs Szabályok / Validation Rules

- **Kötelező mezők:** Dátum, csapatnevek
- **Formátum:** CSV, UTF-8 kódolás
- **Méret:** Maximum 10MB per fájl
- **Struktúra:** Előre definiált oszlopnevek

#### Jelentés Generálás / Reports Generation

```
✅ Sikeres importálás
⚠️ Figyelmeztetések
❌ Hibák és javaslatok
📊 Összesítő riport
```

---

## 5. Háttérfolyamatok és Feladatok

### Létező Háttérfeladatok / Existing Background Jobs

#### Automatizált Folyamatok / Automated Processes

| Feladat / Job | Ütemezés / Schedule | Leírás / Description |
|---|---|---|
| Adatgyűjtés / Data Collection | Napi / Daily | Meccs adatok frissítése |
| Predikció generálás / Prediction Generation | Óra / Hourly | Új predikciók készítése |
| Statisztika számítás / Statistics | Naponta / Daily | Teljesítmény metrikák |
| Rendszer karbantartás / Maintenance | Heti / Weekly | Adattisztítás, optimalizáció |

### Feladatok Monitorozása / Monitoring Jobs

#### /jobs Oldal Funkciói / Jobs Page Features

```
📋 Feladatlista
├── 🟢 Aktív feladatok
├── ⏸️ Szüneteltetett
├── ❌ Hibás
└── 📊 Utolsó futás ideje
```

#### Műveletek / Operations

- **Manuális indítás** - Azonnali futtatás
- **Engedélyezés/tiltás** - Feladat vezérlés
- **Naplók megtekintése** - Részletes logok
- **Újraindítás** - Hibás feladatok újrapróbálása

### Gyori Hibák és Megoldások / Common Errors and Solutions

#### Gyakori Problémák / Common Issues

1. **"Adatgyűjtés sikertelen"**
   - Ellenőrizze internetkapcsolatot
   - API limit ellenőrzése
   - Manuális újraindítás

2. **"Predikció generálás időtúllépés"**
   - Adatbázis teljesítmény ellenőrzése
   - Memória használat vizsgálata
   - Feladat paraméterek módosítása

3. **"Rendszer karbantartás hiba"**
   - Lemezterület ellenőrzése
   - Adatbázis kapcsolat tesztelése
   - Logok részletes vizsgálata

---

## 6. Monitorozás és Hibaelhárítás

### /monitoring Oldal Használata / Using the Monitoring Page

#### Rendszer Állapot Kártyák / System Health Cards

```
💚 Zöld - Minden rendben
🟡 Sárga - Figyelmeztetés
❌ Piros - Kritikus hiba
```

#### Metrikák Megértése / Understanding Metrics

| Metrika / Metric | Jelentés / Meaning | Normál Tartomány / Normal Range |
|---|---|---|
| Válaszidő / Response Time | API válasz sebessége | < 500ms |
| CPU használat / CPU Usage | Processzor terhelés | < 80% |
| Memória / Memory | RAM használat | < 85% |
| Hiba ráta / Error Rate | Sikertelen kérések aránya | < 1% |

### Diagramok és Grafikonok / Charts and Graphs

#### Teljesítmény Grafikonok / Performance Charts

- **Idősoros adatok** - Trend elemzés
- **Összehasonlítás** - Időszakok között
- **Riasztási küszöbök** - Automatikus jelzések

### Hibaelhárítási Lépések / Troubleshooting Steps

#### 1. Ellenőrzés / Check

```
🔍 Rendszer állapot
📊 Teljesítmény metrikák
⚠️ Riasztások listája
📝 Rendszer naplók
```

#### 2. Diagnózis / Diagnose

```
❓ Hiba forrásának azonosítása
📈 Hatás mértékének felmérése
🔗 Kapcsolódó komponensek vizsgálata
```

#### 3. Megoldás / Resolve

```
🔧 Automatikus javítás (ha lehetséges)
👨‍💔 Manuális beavatkozás
📞 Csapat értesítése (ha szükséges)
```

### Hiba Jelentések / Error Reporting

#### Hibajegy Létrehozása / Creating Bug Report

1. **Rendszer:** /monitoring oldalon keresztül
2. **Leírás:** Részletes hiba leírás
3. **Lépések:** Reprodukálási lépések
4. **Környezet:** Böngésző, operációs rendszer
5. **Logok:** Rendszer naplók csatolása

---

## 7. Biztonság és Adatvédelem

### Tárolt Adatok / Stored Data

#### Felhasználói Adatok / User Data

- **Email cím** - Bejelentkezéshez
- **Név** - Opcionális megjelenítési név
- **Szerepkör** - Jogosultsági szint
- **Predikciók** - Felhasználói jóslatok

#### Rendszer Adatok / System Data

- **Meccs adatok** - Nyilvános információk
- **Predikciók** - AI generált jóslatok
- **Statisztikák** - Összesített adatok
- **Rendszer logok** - Működési adatok

### Row Level Security (RLS) / Sor Szintű Biztonság

**English Summary:** The system uses Row Level Security policies to ensure users can only access data they're authorized to see.

#### RLS Szabályok / RLS Policies

```sql
-- Felhasználók csak saját adataikat láthatják
CREATE POLICY user_data ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- Predikciók olvashatók mindenki számára
CREATE POLICY public_predictions ON predictions
  FOR SELECT USING (true);
```

### Biztonsági Tippek / Security Tips

#### Felhasználók Számára / For Users

1. **Erős jelszó** - Minimum 8 karakter, számok és szimbólumok
2. **Biztonságos kapcsolat** - HTTPS használata mindig
3. **Kijelentkezés** - Nyilvános gépeken mindig
4. **Adatmegosztás** - Ne ossza meg hozzáférési adatait

#### Adminok Számára / For Admins

1. **Rendszer frissítések** - Rendszeres biztonsági frissítések
2. **Hozzáférés kezelése** - Szerepkörök gondos beállítása
3. **Monitorozás** - Gyanús tevékenységek figyelése
4. **Backup** - Rendszeres adatmentés

---

## 8. Gyakran Ismételt Kérdések

### Általános Kérdések / General Questions

**Q: Milyen gyakran frissülnek a predikciók?**
A: Predikciók óránként frissülnek automatikusan, de meccsnapokon gyakrabban.

**Q: Pontosak a predikciók?**
A: A predikciók pontossága változó, általában 60-75% között mozog. Konfidencia score segít a megbízhatóság felmérésében.

**Q: Hozzáferek más felhasználók predikcióihoz?**
A: Igen, a rendszer támogatja a közösségi intelligenciát, de anonimizált formában.

### Technikai Kérdések / Technical Questions

**Q: Milyen böngésző támogatott?**
A: Modern böngészők: Chrome, Firefox, Safari, Edge (legfrissebb verziók).

**Q: Működik mobil eszközökön?**
A: Igen, a rendszer reszponzív dizájnnal rendelkezik.

**Q: Szükséges telepíteni valamit?**
A: Nem, web-alapú rendszer, elég egy modern böngésző.

### Hibaelhárítás / Troubleshooting

**Q: Nem tudok bejelentkezni**
A: Ellenőrizze email címet és jelszót. Ha továbbra sem megy, használja a "Elfelejtett jelszó" funkciót.

**Q: Lassú a rendszer**
A: Ellenőrizze internetkapcsolatot. Próbálja meg böngésző gyorsítótár ürítését.

**Q: Hiányzó adatok**
A: Az adatok frissítése időbe telhet. Ellenőrizze a /monitoring oldalon a rendszer állapotát.

### Gyorsbillentyűk / Shortcuts

| Billentyű / Key | Funkció / Function |
|---|---|
| `Ctrl + K` | Gyorskeresés |
| `Ctrl + /` | Billentyűzet segédlet |
| `Esc` | Modal bezárása |
| `F5` | Oldal frissítése |

### Kapcsolat és Támogatás / Contact and Support

#### Segítség Kérése / Getting Help

1. **Dokumentáció** - Olvassa el ezt az útmutatót
2. **Monitorozás** - Ellenőrizze a /monitoring oldalt
3. **Csapat** - Vegye fel a kapcsolatot a fejlesztői csapattal
4. **Közösség** - Csatlakozzon a felhasználói közösséghez

#### Hasznos Linkek / Useful Links

- [📖 Fő dokumentáció](../README.md)
- [🔐 Auth útmutató](../AUTHENTICATION.md)
- [🚀 Phase 9 implementáció](../PHASE9_IMPLEMENTATION.md)
- [🧩 Komponens lista](../WinMix_TipsterHub_Phase_3-9_Components_EN.md)

---

## Összefoglalás / Summary

A WinMix TipsterHub egy komplex, MI-alapú labdarúgás elemzési platform, amely szerepkör-alapú hozzáféréssel, valós idejű predikciókkal és közösségi intelligenciával rendelkezik. A rendszer tervezése során a felhasználói élmény, a biztonság és a megbízhatóság volt a fókuszban.

**English Summary:** WinMix TipsterHub is a comprehensive AI-powered football analytics platform featuring role-based access control, real-time predictions, and collaborative intelligence. The system prioritizes user experience, security, and reliability in its design.

---

*Utolsó frissítés: 2024. november* / *Last updated: November 2024*
