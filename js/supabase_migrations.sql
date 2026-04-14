-- Table pathologies patient (onglet dossier)
create table if not exists patient_pathologies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  patient_id uuid references patients(id) on delete cascade,
  pharmacist_id uuid references auth.users(id),
  nom text not null,
  date_diagnostic date,
  severite text,
  traitements text,
  notes text
);
alter table patient_pathologies enable row level security;
create policy "own" on patient_pathologies using (auth.uid() = pharmacist_id);

-- Table pathologies globales (référentiel pharmacien)
create table if not exists pathologies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  pharmacist_id uuid references auth.users(id),
  nom text not null,
  categorie text,
  description text,
  traitements_reference text,
  vigilance text
);
alter table pathologies enable row level security;
create policy "own" on pathologies using (auth.uid() = pharmacist_id);

-- Table entretiens pharmaceutiques
create table if not exists entretiens (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  pharmacist_id uuid references auth.users(id),
  patient_nom text,
  type text,
  date date,
  duree integer default 30,
  notes text,
  facturation text default 'Non facturé',
  montant numeric(8,2),
  prochain_entretien date
);
alter table entretiens enable row level security;
create policy "own" on entretiens using (auth.uid() = pharmacist_id);
