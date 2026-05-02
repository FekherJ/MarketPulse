const { pool } = require("../config/database");

async function saveDataQualityCheck(
  ingestionRunId,
  checkName,
  status,
  errorMessage = null,
) {
  const query = `
    INSERT INTO data_quality_checks (
      ingestion_run_id,
      check_name,
      status,
      error_message
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const values = [ingestionRunId, checkName, status, errorMessage];
  const result = await pool.query(query, values);

  return result.rows[0];
}

async function saveDataQualityChecks(checks) {
  const savedChecks = [];

  for (const check of checks) {
    const saved = await saveDataQualityCheck(
      check.ingestionRunId,
      check.checkName,
      check.status,
      check.errorMessage || null,
    );

    savedChecks.push(saved);
  }

  return savedChecks;
}

async function findQualityChecksByIngestionRunId(ingestionRunId) {
  const query = `
    SELECT *
    FROM data_quality_checks
    WHERE ingestion_run_id = $1
    ORDER BY checked_at ASC;
  `;

  const result = await pool.query(query, [ingestionRunId]);
  return result.rows;
}

async function findFailedQualityChecks(limit = 20) {
  const query = `
    SELECT *
    FROM data_quality_checks
    WHERE status = 'FAILED'
    ORDER BY checked_at DESC
    LIMIT $1;
  `;

  const result = await pool.query(query, [limit]);
  return result.rows;
}

module.exports = {
  saveDataQualityCheck,
  saveDataQualityChecks,
  findQualityChecksByIngestionRunId,
  findFailedQualityChecks,
};
