const { pool } = require("../config/database");

async function createIngestionRun(source) {
  const query = `
    INSERT INTO ingestion_runs (source, status, started_at)
    VALUES ($1, $2, NOW())
    RETURNING *;
  `;

  const values = [source, "RUNNING"];
  const result = await pool.query(query, values);

  return result.rows[0];
}

async function markIngestionRunSuccess(id, recordsFetched, recordsInserted, durationMs) {
  const query = `
    UPDATE ingestion_runs
    SET 
      status = $1,
      ended_at = NOW(),
      duration_ms = $2,
      records_fetched = $3,
      records_inserted = $4,
      error_message = NULL
    WHERE id = $5
    RETURNING *;
  `;

  const values = ["SUCCESS", durationMs, recordsFetched, recordsInserted, id];
  const result = await pool.query(query, values);

  return result.rows[0];
}

async function markIngestionRunFailed(id, errorMessage, durationMs) {
  const query = `
    UPDATE ingestion_runs
    SET 
      status = $1,
      ended_at = NOW(),
      duration_ms = $2,
      error_message = $3
    WHERE id = $4
    RETURNING *;
  `;

  const values = ["FAILED", durationMs, errorMessage, id];
  const result = await pool.query(query, values);

  return result.rows[0];
}

async function findLatestIngestionRuns(limit = 20) {
  const query = `
    SELECT *
    FROM ingestion_runs
    ORDER BY started_at DESC
    LIMIT $1;
  `;

  const result = await pool.query(query, [limit]);
  return result.rows;
}

async function findFailedIngestionRuns(limit = 20) {
  const query = `
    SELECT *
    FROM ingestion_runs
    WHERE status = 'FAILED'
    ORDER BY started_at DESC
    LIMIT $1;
  `;

  const result = await pool.query(query, [limit]);
  return result.rows;
}

async function findIngestionRunById(id) {
  const query = `
    SELECT *
    FROM ingestion_runs
    WHERE id = $1;
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
}

module.exports = {
  createIngestionRun,
  markIngestionRunSuccess,
  markIngestionRunFailed,
  findLatestIngestionRuns,
  findFailedIngestionRuns,
  findIngestionRunById,
};