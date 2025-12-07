# Felhasználói Szerepek és Jogosultságok

**User Roles and Permissions Matrix** / **Felhasználói Szerepek és Jogosultság Mátrix**

---

## 📋 Szerepkörök Áttekintése / Roles Overview

### Szerepkör Hierarchia / Role Hierarchy

```
🔴 ADMIN (Legmagasabb)
├── 🟡 ANALYST (Középső)
└── 🟢 USER (Alapértelmezett)
```

### Szerepkör Leírások / Role Descriptions

#### 🔴 Admin / Rendszergazda
- **Teljes hozzáférés** a rendszer minden funkciójához
- **Felhasználó kezelés** és jogosultságok beállítása
- **Rendszer konfiguráció** és karbantartás
- **Biztonsági beállítások** kezelése

#### 🟡 Analyst / Elemző
- **Predikciók létrehozása** és elemzése
- **Háttérfeladatok kezelése** és monitorozása
- **Részletes analytics** hozzáférés
- **Modellek megtekintése** (korlátozott)

#### 🟢 User / Felhasználó
- **Predikciók megtekintése** (csak olvasás)
- **Alapvető statisztikák** böngészése
- **Csapatok, meccsek, bajnokságok** feltárása
- **Saját profil** szerkesztése

---

## 🗂️ Részletes Jogosultsági Mátrix / Detailed Permission Matrix

### Funkciók Szerepkör Szerint / Features by Role

| Funkció / Feature | 🔴 Admin | 🟡 Analyst | 🟢 User | Leírás / Description |
|---|---|---|---|---|
| **🏠 Főoldal / Homepage** | ✅ | ✅ | ✅ | Nyilvános tartalom |
| **🔐 Bejelentkezés / Login** | ✅ | ✅ | ✅ | Alapvető funkció |
| **📝 Regisztráció / Signup** | ✅ | ✅ | ✅ | Új fiók létrehozása |
| **📊 Irányítópult / Dashboard** | ✅ | ✅ | ✅ | Személyes statisztikák |
| **🔮 Predikciók / Predictions** | ✅ | ✅ | ✅ | Megtekintés |
| **🆕 Új predikció / New Prediction** | ✅ | ✅ | ✅ | Létrehozás |
| **📈 Elemzések / Analytics** | ✅ | ✅ | 📖 | Részletes adatok |
| **⚽ Meccsek / Matches** | ✅ | ✅ | ✅ | Böngészés, szűrés |
| **👥 Csapatok / Teams** | ✅ | ✅ | ✅ | Részletes adatok |
| **🏆 Bajnokságok / Leagues** | ✅ | ✅ | ✅ | Bajnokság adatok |
| **⚙️ Modellek / Models** | ✅ | 📖 | 📖 | Model management |
| **📋 Háttérfeladatok / Jobs** | ✅ | ✅ | ❌ | Feladat kezelés |
| **📱 Monitorozás / Monitoring** | ✅ | ✅ | ❌ | Rendszer állapot |
| **🌐 Cross-League / CrossLeague** | ✅ | ✅ | 📖 | Bajnokságok között |
| **🚀 Phase 9 / Phase9** | ✅ | ✅ | 📖 | Haladó funkciók |
| **👤 Profil szerkesztés / Profile Edit** | ✅ | ✅ | ✅ | Saját adatok |
| **🔧 Rendszer beállítások / System Settings** | ✅ | ❌ | ❌ | Admin funkciók |
| **👥 Felhasználók kezelése / User Management** | ✅ | ❌ | ❌ | Admin funkciók |

### Jelmagyarázat / Legend

- ✅ **Teljes hozzáférés** / Full access
- 📖 **Csak olvasás** / Read-only
- ❌ **Nincs hozzáférés** / No access

---

## 🛣️ Útvonalak Szerepkör Szerint / Routes by Role

### Nyilvános Útvonalak / Public Routes
*(Nincs auth szükséges)*

```
🏠 / - Főoldal
🔐 /login - Bejelentkezés
📝 /signup - Regisztráció
```

### Demo Útvonalak / Demo Routes
*(Írásvédett minden szerepkörnek)*

```
🔮 /predictions - Predikciók listája
⚽ /matches - Meccsek böngészése
🏆 /leagues - Bajnokságok
👥 /teams - Csapatok
```

### Védett Útvonalak / Protected Routes
*(Auth szükséges)*

#### Minden szerepkörnek / All Roles
```
📊 /dashboard - Irányítópult
🆕 /predictions/new - Új predikció
👤 /profile - Profil szerkesztés
```

#### Admin és Analyst / Admin & Analyst
```
📋 /jobs - Háttérfeladatok
📈 /analytics - Részletes elemzések
📱 /monitoring - Rendszer monitorozás
🌐 /crossleague - Cross-league elemzés
🚀 /phase9 - Haladó funkciók
```

#### Csak Admin / Admin Only
```
⚙️ /models - Modellek kezelése
🔧 /admin - Rendszer beállítások
👥 /admin/users - Felhasználók kezelése
```

---

## 🔐 API Jogosultságok / API Permissions

### Endpoint Hozzáférések / Endpoint Access

#### Predikciók / Predictions API

| Endpoint | Method | Admin | Analyst | User | Leírás |
|---|---|---|---|---|---|
| `/api/predictions` | GET | ✅ | ✅ | ✅ | Predikciók listája |
| `/api/predictions` | POST | ✅ | ✅ | ✅ | Új predikció |
| `/api/predictions/:id` | PUT | ✅ | ✅ | 📖 | Predikció módosítása |
| `/api/predictions/:id` | DELETE | ✅ | ❌ | ❌ | Predikció törlése |

#### Háttérfeladatok / Jobs API

| Endpoint | Method | Admin | Analyst | User | Leírás |
|---|---|---|---|---|---|
| `/api/jobs` | GET | ✅ | ✅ | ❌ | Feladatok listája |
| `/api/jobs/:id/trigger` | POST | ✅ | ✅ | ❌ | Feladat indítása |
| `/api/jobs/:id/toggle` | PUT | ✅ | ✅ | ❌ | Feladat engedélyezése |
| `/api/jobs/:id/logs` | GET | ✅ | ✅ | ❌ | Feladat naplói |

#### Modellek / Models API

| Endpoint | Method | Admin | Analyst | User | Leírás |
|---|---|---|---|---|---|
| `/api/models` | GET | ✅ | 📖 | 📖 | Modellek listája |
| `/api/models` | POST | ✅ | ❌ | ❌ | Új modell |
| `/api/models/:id` | PUT | ✅ | ❌ | ❌ | Modell módosítása |
| `/api/models/:id/promote` | POST | ✅ | ❌ | ❌ | Modell előléptetése |

---

## 📊 Szerepkör Specifikus Funkciók / Role-Specific Features

### 🔴 Admin Funkciók / Admin Features

#### Felhasználó Kezelés / User Management
```
👥 Felhasználók listázása
📝 Szerepkör módosítása
🔐 Jelszó reset (admin)
📊 Felhasználói statisztikák
🚫 Fiók felfüggesztés
```

#### Rendszer Konfiguráció / System Configuration
```
⚙️ Rendszer paraméterek
🔧 API kulcsok kezelése
📊 Monitorozás beállításai
🔒 Biztonsági szabályok
📧 Email konfiguráció
```

#### Model Menedzsment / Model Management
```
🤖 Modellek regisztrálása
📊 Teljesítmény értékelés
🔄 Modellek cseréje
📈 A/B tesztek
🗑️ Modellek törlése
```

### 🟡 Analyst Funkciók / Analyst Features

#### Predikció Menedzsment / Prediction Management
```
🔮 Új predikciók létrehozása
📊 Predikciók elemzése
🎯 Konfidencia beállítás
📈 Statisztikák generálása
🔄 Predikciók módosítása
```

#### Háttérfeladatok / Background Jobs
```
📋 Feladatok listázása
▶️ Manuális indítás
⏸️ Feladat szüneteltetése
📊 Teljesítmény monitorozás
📝 Naplók megtekintése
```

#### Elemzések / Analytics
```
📈 Részletes statisztikák
🎯 Pontossági metrikák
📊 Trend elemzések
🏆 Bajnokság összehasonlítás
📋 Riport generálás
```

### 🟢 User Funkciók / User Features

#### Alapvető Hozzáférés / Basic Access
```
🔮 Predikciók megtekintése
⚽ Meccsek böngészése
👥 Csapat adatok
🏆 Bajnokság információk
📊 Alap statisztikák
```

#### Személyes Funkciók / Personal Features
```
👤 Profil szerkesztése
🔐 Jelszó módosítása
📊 Saját statisztikák
🔮 Kedvenc csapatok (hamarosan)
📱 Értesítések (hamarosan)
```

---

## 🔄 Szerepkör Váltás / Role Changes

### Szerepkör Módosítása / Role Modification

#### Admin által / By Admin

```sql
-- Elemzővé léptetés
UPDATE user_profiles 
SET role = 'analyst' 
WHERE email = 'user@example.com';

-- Adminná léptetés
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'user@example.com';

-- Felhasználóvá minősítés
UPDATE user_profiles 
SET role = 'user' 
WHERE email = 'user@example.com';
```

#### Automatikus Szerepkörök / Automatic Roles

```
🆕 Új regisztráció → 'user' (alapértelmezett)
📊 10+ predikció/hét → 'analyst' (automatikus felajánlás)
🏆 90%+ pontosság → 'admin' (manuális jóváhagyás)
```

---

## 🛡️ Biztonsági Megfontolások / Security Considerations

### Hozzáférés Ellenőrzése / Access Control

#### Frontend Védelem / Frontend Protection
```
🚪 AuthGate komponens
🔐 Session validáció
📱 Token frissítés
🔄 Route guardok
```

#### Backend Védelem / Backend Protection
```
🛡️ Row Level Security (RLS)
🔑 API kulcsok
📊 Request validáció
🚫 Rate limiting
```

### Naplózás és Audit / Logging and Audit

#### Audit Trail
```
📝 Bejelentkezések naplózása
🔐 Szerepkör változások
🔮 Predikció módosítások
⚙️ Rendszer változások
```

#### Biztonsági Események / Security Events
```
🚫 Többszörös sikertelen bejelentkezés
🌐 Gyanús IP címek
🔐 Jogosultsági kísérletek
📊 Anomália detekció
```

---

## 📋 Gyors Referencia / Quick Reference

### Szerepkör Összehasonlítás / Role Comparison

| Kategória / Category | Admin | Analyst | User |
|---|---|---|---|
| **Predikciók** | Létrehoz, módosít, töröl | Létrehoz, módosít | Megtekint |
| **Feladatok** | Kezel, monitoroz | Kezel, monitoroz | Nincs hozzáférés |
| **Modellek** | Teljes kontroll | Megtekint | Megtekint (korlátozott) |
| **Felhasználók** | Kezel | Nincs hozzáférés | Nincs hozzáférés |
| **Rendszer** | Konfigurál | Monitoroz | Nincs hozzáférés |
| **Analytics** | Teljes | Részletes | Alap |

### Gyors Döntési Fa / Quick Decision Tree

```
🤔 Milyen hozzáférés szükséges?
├── 🔧 Rendszer beállítások → ADMIN
├── 📋 Háttérfeladatok kezelése → ANALYST vagy ADMIN
├── 🔮 Predikciók létrehozása → BÁRMELYIK (auth szükséges)
└── 👀 Csak megtekintés → USER vagy vendég
```

---

## 🚀 Jövőbeli Fejlesztések / Future Developments

### Tervezett Szerepkörök / Planned Roles

#### 🟦 Premium User (Premium felhasználó)
```
📊 Haladó analytics
🔮 Korlátlan predikciók
📱 Mobileszköz alkalmazás
🎯 Személyre szabás
```

#### 🟪 Data Scientist (Adattudós)
```
🤖 Model fejlesztés
📊 Adat exportálás
🔬 Kutatási hozzáférés
📪 API hozzáférés
```

#### 🟧 Partner (Partner)
```
🔗 API integráció
📊 White label hozzáférés
👥 Többfelhasználós kezelés
🎪 Egyedi funkciók
```

### Haladó Jogosultságok / Advanced Permissions

#### Granuláris Kontroll / Granular Control
```
📊 Projekt szintű hozzáférés
🏆 Bajnokság specifikus jogok
👥 Csapat szintű korlátozások
📅 Időkorlátos hozzáférés
```

#### Dinamikus Jogosultságok / Dynamic Permissions
```
📈 Teljesítmény alapú bővítés
🎯 Képesség alapú jogosultságok
📊 Használat alapú korlátozások
🔄 Automatikus szerepkör frissítés
```

---

## 📞 Támogatás / Support

### Jogosultsági Problémák / Permission Issues

#### Gyors Megoldások / Quick Solutions

1. **"Nincs hozzáférem"**
   - Ellenőrizze bejelentkezést
   - Ellenőrizze szerepkört
   - Kapcsolja fel a rendszergazdát

2. **"Szerepkör módosítás szükséges"**
   - Vegye fel a kapcsolatot adminnal
   - Indokolja a kérést
   - Várjon jóváhagyásra

3. **"API hozzáférés megtagadva"**
   - Ellenőrizze token érvényességét
   - Ellenőrizze jogosultságokat
   - Próbálja meg újra bejelentkezni

#### Kapcsolat / Contact

```
📧 Email: support@winmix.hu
📱 Chat: (hamarosan)
📖 Dokumentáció: /docs
🎮 Demo: /demo
```

---

## ✅ Ellenőrző Lista / Checklist

### Admin Ellenőrzés / Admin Checklist

```
✅ Felhasználói szerepkörök beállítva
✅ Rendszer konfiguráció kész
✅ Biztonsági beállítások aktiválva
✅ Monitorozás működik
✅ Backup rendszer aktív
```

### Analyst Ellenőrzés / Analyst Checklist

```
✅ Predikció létrehozás tesztelve
✅ Háttérfeladatok elérhetők
✅ Analytics működik
✅ Szűrők működnek
✅ Exportálás tesztelve
```

### User Ellenőrzés / User Checklist

```
✅ Bejelentkezés sikeres
✅ Predikciók megtekinthetők
✅ Profil szerkeszthető
✅ Alap funkciók elérhetők
✅ Mobil nézet működik
```

---

*Utolsó frissítés: 2024. november* / *Last updated: November 2024*
