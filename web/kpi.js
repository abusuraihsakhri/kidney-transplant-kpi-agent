/* Generic threshold-rule demonstration; not a KDPI, DGF or Banff model. */
(function (root) {
  'use strict';
  const FLAGS = ['DISCORDANT', 'ANOMALY', 'MUTANT', 'VIOLATION', 'FAIL', 'REJECT'];
  const COLUMNS = ['task_id', 'target_identifier', 'primary_metric', 'secondary_metric', 'status_descriptor', 'is_critical_flag'];

  function validText(value, field) {
    if (typeof value !== 'string' || !value.trim() || value.length > 200)
      throw new Error(field + ' must contain 1–200 characters.');
    return value.trim();
  }

  function finiteNumber(value, field) {
    if (value === null || value === undefined || String(value).trim() === '')
      throw new Error(field + ' is required.');
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(field + ' must be a finite number.');
    return number;
  }

  function booleanValue(value) {
    if (value === true || value === false) return value;
    const normalized = String(value ?? '').trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalized)) return true;
    if (['false', '0', 'no', ''].includes(normalized)) return false;
    throw new Error('is_critical_flag must be true/false, yes/no, or 1/0.');
  }

  function statusText(value) {
    const text = String(value).trim();
    if (text.length > 200) throw new Error('status_descriptor must contain at most 200 characters.');
    return text;
  }

  function analyze(input) {
    if (!input || typeof input !== 'object') throw new Error('A task is required.');
    const task = {
      task_id: validText(input.task_id, 'task_id'),
      target_identifier: validText(input.target_identifier, 'target_identifier'),
      primary_metric: finiteNumber(input.primary_metric, 'primary_metric'),
      secondary_metric: finiteNumber(input.secondary_metric ?? 0, 'secondary_metric'),
      status_descriptor: statusText(input.status_descriptor ?? 'NOMINAL'),
      is_critical_flag: booleanValue(input.is_critical_flag ?? false)
    };
    const alerts = [];
    if (task.primary_metric > 25) alerts.push({
      worker: 'InvariantQCWorker', urgency: 'ELEVATED_RISK',
      summary: 'Primary metric above demonstration threshold (25)'
    });
    if (task.is_critical_flag || task.secondary_metric > 12) alerts.push({
      worker: 'SafetyEscalationWorker',
      urgency: task.is_critical_flag ? 'CRITICAL_STAT_PANIC' : 'ELEVATED_RISK',
      summary: 'Critical flag set or secondary metric above demonstration threshold (12)'
    });
    if (FLAGS.some(flag => task.status_descriptor.toUpperCase().includes(flag))) alerts.push({
      worker: 'ProtocolConformanceWorker', urgency: 'ELEVATED_RISK',
      summary: 'Status descriptor contains a demonstration alert keyword'
    });
    const isCritical = alerts.some(alert => alert.urgency === 'CRITICAL_STAT_PANIC');
    const isElevated = alerts.length > 0;
    return {
      ...task,
      overall_urgency: isCritical ? 'CRITICAL_STAT_PANIC' : isElevated ? 'ELEVATED_RISK' : 'ROUTINE',
      integrity_status: isCritical ? 'RECALIBRATION_REQUIRED' : isElevated ? 'DISCORDANT_ANOMALY' : 'VALIDATED_OPTIMAL',
      total_alerts: alerts.length,
      critical_alerts_count: alerts.filter(alert => alert.urgency === 'CRITICAL_STAT_PANIC').length,
      alerts,
      model: 'Generic demonstration thresholds only; not clinically validated.'
    };
  }

  function parseCsv(text) {
    if (typeof text !== 'string' || text.length > 2000000)
      throw new Error('CSV must be text of at most 2 MB.');
    const rows = [];
    let row = [], value = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') { value += '"'; i++; }
        else if (char === '"') quoted = false;
        else value += char;
      } else if (char === '"') {
        if (value.length !== 0) throw new Error('Invalid quoted CSV field.');
        quoted = true;
      } else if (char === ',') {
        row.push(value); value = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[i + 1] === '\n') i++;
        row.push(value); value = '';
        if (row.some(cell => cell.trim() !== '')) rows.push(row);
        row = [];
      } else value += char;
    }
    if (quoted) throw new Error('Unclosed quoted CSV field.');
    row.push(value);
    if (row.some(cell => cell.trim() !== '')) rows.push(row);
    if (rows.length === 0) throw new Error('CSV is empty.');
    const headers = rows.shift().map(h => h.replace(/^\uFEFF/, '').trim());
    if (headers.length !== new Set(headers).size) throw new Error('Duplicate CSV headings.');
    for (const field of ['task_id', 'target_identifier', 'primary_metric'])
      if (!headers.includes(field)) throw new Error('CSV missing column: ' + field);
    if (rows.length > 1000) throw new Error('CSV exceeds the 1,000-row limit.');
    return rows.map((cells, index) => {
      if (cells.length !== headers.length) throw new Error('CSV row ' + (index + 2) + ' has the wrong column count.');
      const data = Object.fromEntries(headers.map((key, column) => [key, cells[column]]));
      try { return analyze(data); }
      catch (error) { throw new Error('CSV row ' + (index + 2) + ': ' + error.message); }
    });
  }

  function toCsv(results) {
    const fields = [...COLUMNS, 'overall_urgency', 'integrity_status', 'total_alerts', 'critical_alerts_count'];
    const quote = value => {
      const text = String(value ?? '');
      const safe = typeof value === 'string' && /^[=+@\t\r-]/.test(text) ? "'" + text : text;
      return '"' + safe.replace(/"/g, '""') + '"';
    };
    return [fields.join(','), ...results.map(row => fields.map(key => quote(row[key])).join(','))].join('\r\n');
  }
  const api = Object.freeze({ analyze, parseCsv, toCsv });
  root.KidneyKpi = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
