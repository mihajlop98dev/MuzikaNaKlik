# MUZIKA NA KLIK — Tehnička specifikacija za izradu aplikacije

## 1. Opis proizvoda

Web platforma koja povezuje klijente (osobe koje organizuju proslave) sa muzičkim izvođačima
(pevači, bendovi, DJ-evi) za svadbe, rođendane, krštenja, korporativne događaje i druge proslave.
Klijenti pretražuju izvođače po gradu, datumu i vrsti događaja, pregledaju profile i šalju upit
direktno izvođaču. Izvođači se prijavljuju na platformu i plaćaju mesečnu pretplatu da bi bili
vidljivi/promovisani.

Model monetizacije: **mesečna pretplata izvođača** (nema provizije po rezervaciji, nema online
plaćanja na platformi — sav dogovor oko cene i plaćanja ide direktno između klijenta i izvođača).

## 2. Tehnički stek

| Sloj | Tehnologija |
|---|---|
| Frontend | Angular (najnovija stabilna verzija, standalone komponente) |
| Backend / API | Next.js (App Router, Route Handlers kao REST API) |
| Baza podataka, Auth, Storage | Supabase (Postgres + Supabase Auth + Supabase Storage) |
| Stilizacija | Tailwind CSS ili Angular Material sa custom temom (crno-zlatna, videti sekciju 6) |
| Hosting (predlog) | Frontend na Vercel/Netlify, Backend na Vercel, Supabase cloud |

Napomena za DeepSeek: Angular frontend komunicira sa Next.js backendom isključivo preko REST API
poziva (Next.js Route Handlers). Supabase Auth JWT token se prosleđuje u Authorization headeru.
Next.js backend koristi Supabase service role key za privilegovane operacije (odobravanje
izvođača, upravljanje pretplatama), a Angular frontend za javne read operacije može direktno
koristiti Supabase client (anon key) uz Row Level Security (RLS) politike — ovo treba definisati
eksplicitno u kodu da se izbegne mešanje pristupa.

## 3. Uloge korisnika

### 3.1 Klijent (Client)
- Registracija/prijava (email + lozinka, opciono Google OAuth)
- Pretraga izvođača (grad, datum, vrsta događaja, tip izvođača)
- Pregled profila izvođača
- Slanje upita izvođaču (ime, email, telefon, vrsta događaja, datum, lokacija, poruka)
- Pregled istorije poslatih upita u svom nalogu
- Ostavljanje recenzije nakon događaja (rating 1-5 + komentar) — samo ako je prethodno slao upit tom izvođaču

### 3.2 Izvođač (Performer)
- Registracija sa dodatnim poljima (naziv benda/umetničko ime, tip: pevač/bend/DJ, grad, žanrovi, opis "O nama", cene "od X €")
- Nalog je u statusu **"na čekanju"** dok ga admin ne odobri
- Nakon odobrenja: izvođač bira/plaća mesečnu pretplatu da bi profil bio **javno vidljiv**
- Upravljanje profilom: galerija slika, video (YouTube/Vimeo embed link), repertoar (lista pesama/žanrova), cenovnik
- Kalendar "slobodni termini" (izvođač označava zauzete/slobodne datume)
- Pregled primljenih upita (inbox) sa statusom (novi, pročitan, odgovoren)
- Pregled sopstvenih recenzija

### 3.3 Admin
- Odobravanje/odbijanje novoregistrovanih izvođača
- Pregled i upravljanje svim korisnicima (klijenti, izvođači)
- Upravljanje pretplatama izvođača (status: aktivna, istekla, otkazana) — pošto nema online plaćanja na platformi, admin ručno označava status pretplate nakon što izvođač uplati (banka/faktura) — ostaviti prostor da se kasnije doda automatsko plaćanje (Stripe i sl.)
- Moderacija recenzija (brisanje neprimerenih)
- Moderacija sadržaja profila izvođača (slike, opisi)
- Osnovna statistika (broj izvođača, broj klijenata, broj upita mesečno)

## 4. Struktura stranica (na osnovu priloženog dizajna)

### Javni deo
1. **Početna** — hero sekcija sa pretragom (grad, datum, vrsta događaja, tip izvođača), brzi filteri po tipu događaja (Svadba, Rođendan, Krštenje, Korporativni događaj, Maturska večer, Drugo), sekcija "Istaknuti izvođači" (kartice: slika, ime, grad, ocena, broj recenzija, cena "od X €"), sekcija "Kako funkcioniše" (3 koraka: Pretraži → Pošalji upit → Rezerviši), recenzije klijenata (karusel), CTA sekcija na dnu
2. **Izvođači** — lista/grid sa filterima u sidebar-u (grad, vrsta događaja, tip izvođača, opseg cene — slider), sortiranje (popularnost, cena, ocena), paginacija
3. **Profil izvođača** — tabovi: O nama, Galerija, Video, Repertoar, Recenzije, Slobodni termini; dugme "Pošalji upit" i "sačuvaj" (heart ikonica)
4. **Forma za upit** — ime, email, telefon, vrsta događaja, datum događaja, lokacija, poruka; sa strane preview kartice izabranog izvođača
5. **Kontakt**
6. **Prijava / Registracija** (sa izborom uloge: klijent ili izvođač)

### Nalog klijenta
7. Moji upiti (istorija i status)
8. Podešavanja naloga

### Nalog izvođača
9. Dashboard (pregled: broj pregleda profila, broj upita, status pretplate)
10. Uređivanje profila (osnovni podaci, O nama, cenovnik)
11. Galerija (upload slika)
12. Video (embed linkovi)
13. Repertoar (lista pesama/žanrova)
14. Slobodni termini (kalendar)
15. Primljeni upiti (inbox)
16. Pretplata (status, istorija, dugme za produženje)

### Admin panel
17. Pregled izvođača na čekanju odobrenja
18. Svi korisnici
19. Pretplate
20. Recenzije (moderacija)
21. Statistika

## 5. Baza podataka — predlog šeme (Supabase / Postgres)

```sql
-- profiles (prošireni Supabase auth.users)
profiles (
  id uuid primary key references auth.users,
  role text check (role in ('client','performer','admin')),
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz default now()
)

-- performers (dodatni podaci samo za izvođače)
performers (
  id uuid primary key references profiles(id),
  stage_name text not null,
  type text check (type in ('pevac','bend','dj')),
  city text,
  genres text[],
  description text,
  price_from numeric,
  status text check (status in ('pending','approved','rejected')) default 'pending',
  subscription_status text check (subscription_status in ('none','active','expired')) default 'none',
  subscription_expires_at timestamptz,
  rating_avg numeric default 0,
  rating_count int default 0,
  created_at timestamptz default now()
)

-- performer_media (galerija i video)
performer_media (
  id uuid primary key default gen_random_uuid(),
  performer_id uuid references performers(id),
  type text check (type in ('image','video')),
  url text not null,
  sort_order int default 0
)

-- performer_availability (slobodni termini)
performer_availability (
  id uuid primary key default gen_random_uuid(),
  performer_id uuid references performers(id),
  date date not null,
  status text check (status in ('free','booked')) default 'free'
)

-- inquiries (upiti klijenata)
inquiries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id),
  performer_id uuid references performers(id),
  full_name text,
  email text,
  phone text,
  event_type text,
  event_date date,
  location text,
  message text,
  status text check (status in ('new','read','responded')) default 'new',
  created_at timestamptz default now()
)

-- reviews (recenzije)
reviews (
  id uuid primary key default gen_random_uuid(),
  performer_id uuid references performers(id),
  client_id uuid references profiles(id),
  rating int check (rating between 1 and 5),
  comment text,
  status text check (status in ('visible','hidden')) default 'visible',
  created_at timestamptz default now()
)

-- subscriptions (istorija pretplata izvođača)
subscriptions (
  id uuid primary key default gen_random_uuid(),
  performer_id uuid references performers(id),
  amount numeric,
  period_start date,
  period_end date,
  status text check (status in ('active','expired','cancelled')),
  marked_by_admin uuid references profiles(id),
  created_at timestamptz default now()
)
```

RLS napomena: `performers` sa `status = 'approved' AND subscription_status = 'active'` su jedini
javno vidljivi u pretrazi; izvođač vidi sopstveni profil bez obzira na status; admin vidi sve.

## 6. Dizajn smernice

- Tamna tema: pozadina skoro crna (#0B0B0D ili slično), akcentna boja zlatna/žuta (#D4A94A ili slično)
- Beli tekst za naslove, sivkasti za sekundarni tekst
- Zaobljeni uglovi na karticama, blagi border u tamno-zlatnoj nijansi
- Logo: ikonica slušalica sa notom, naziv "MUZIKA NA KLIK" (MUZIKA belo, NA KLIK zlatno)
- Kartice izvođača: slika, ime, grad, zvezdice + broj recenzija, cena "od X €", heart ikonica gore desno
- Responsive — mora raditi na mobilnom (posebno forme i lista izvođača)

## 7. Prioritet izrade (predlog faza za DeepSeek)

1. **Faza 1 — Setup:** Supabase projekat (šema iz sekcije 5 + RLS), Next.js backend skelet, Angular frontend skelet, Auth (registracija/prijava sa izborom uloge)
2. **Faza 2 — Javni deo:** Početna, lista izvođača sa filterima, profil izvođača, forma za upit
3. **Faza 3 — Nalog izvođača:** dashboard, uređivanje profila, galerija, video, repertoar, slobodni termini, inbox upita
4. **Faza 4 — Admin panel:** odobravanje izvođača, upravljanje pretplatama, moderacija recenzija
5. **Faza 5 — Doterivanje:** recenzije klijenata, statistika, responsive provera, SEO osnove

## 8. Otvorena pitanja / pretpostavke koje treba potvrditi pre starta

- Cena mesečne pretplate i da li postoje različiti paketi (npr. Basic/Istaknuto/Premium sa različitom vidljivošću) — trenutno pretpostavljeno da postoji jedan nivo pretplate, admin ručno aktivira
- Da li klijent mora biti registrovan da pošalje upit, ili može i kao gost (predlog: dozvoliti i gostima radi manje trenja, ali čuvati email radi praćenja)
- Da li recenziju može ostaviti bilo ko ili samo klijent koji je prethodno slao upit tom izvođaču (predlog iz sekcije 3.1: samo posle upita, radi verodostojnosti)