-- ============================================================
-- Migration : table posologies (schémas posologiques patient)
-- À exécuter dans Supabase → SQL Editor
-- ============================================================

create table if not exists posologies (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  patient_id       uuid references patients(id) on delete cascade,
  pharmacist_id    uuid references auth.users(id),

  -- Médicament
  medicament       text not null,
  dosage           text,           -- ex: "500 mg", "1 comprimé"
  voie             text,           -- Orale, Injectable, Topique…

  -- Schéma posologique
  frequence        text,           -- ex: "3 fois/jour", "toutes les 8h"
  horaires         text,           -- ex: "Matin, Midi, Soir", "08h-14h-20h"
  conditions_prise text,           -- ex: "Pendant les repas", "À jeun"
  duree            text,           -- ex: "7 jours", "3 mois", "Traitement chronique"

  -- Période
  date_debut       date,
  date_fin         date,

  -- Suivi
  statut           text default 'En cours',  -- En cours | Terminé | Suspendu | À surveiller
  effets_surveiller text,          -- Effets indésirables à surveiller
  prescripteur     text,
  notes            text
);

-- Sécurité par ligne
alter table posologies enable row level security;
create policy "pharmacist_own_posologies"
  on posologies
  using (auth.uid() = pharmacist_id);

-- Index pour performances
create index if not exists posologies_patient_id_idx      on posologies(patient_id);
create index if not exists posologies_pharmacist_id_idx   on posologies(pharmacist_id);
