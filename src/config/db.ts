import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || 'clinic.db';
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS patients ( id TEXT PRIMARY KEY );
CREATE TABLE IF NOT EXISTS clinicians ( id TEXT PRIMARY KEY );

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  clinician_id TEXT NOT NULL,
  patient_id  TEXT NOT NULL,
  start TEXT NOT NULL,
  end   TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (clinician_id) REFERENCES clinicians(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id)  REFERENCES patients(id)  ON DELETE CASCADE
);

-- Touching endpoints allowed; only true overlaps blocked
CREATE TRIGGER IF NOT EXISTS trg_appt_no_overlap
BEFORE INSERT ON appointments
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.clinician_id = NEW.clinician_id
      AND NEW.start < a.end
      AND NEW.end   > a.start
  ) THEN RAISE(ABORT, 'overlap') END;
END;
`);
