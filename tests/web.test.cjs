const test = require('node:test');
const assert = require('node:assert/strict');
const { analyze, parseCsv, toCsv } = require('../web/kpi.js');

test('routine demonstration result', () => {
  const result = analyze({task_id:'T1',target_identifier:'S1',primary_metric:25,secondary_metric:12,status_descriptor:'NOMINAL'});
  assert.equal(result.overall_urgency, 'ROUTINE');
  assert.equal(result.total_alerts, 0);
});

test('three independent rules and critical override', () => {
  const result = analyze({task_id:'T2',target_identifier:'S2',primary_metric:26,secondary_metric:13,status_descriptor:'discordant',is_critical_flag:'yes'});
  assert.equal(result.total_alerts, 3);
  assert.equal(result.critical_alerts_count, 1);
  assert.equal(result.overall_urgency, 'CRITICAL_STAT_PANIC');
});

test('invalid numbers and booleans rejected', () => {
  assert.throws(() => analyze({task_id:'a',target_identifier:'b',primary_metric:'Infinity'}), /finite/);
  assert.throws(() => analyze({task_id:'a',target_identifier:'b',primary_metric:''}), /required/);
  assert.throws(() => analyze({task_id:'a',target_identifier:'b',primary_metric:2,is_critical_flag:'maybe'}), /flag/);
});

test('CSV handles quotes, BOM and CRLF', () => {
  const rows = parseCsv('\uFEFFtask_id,target_identifier,primary_metric,status_descriptor\r\n"T,1",S1,25,"NOMINAL"\r\nT2,S2,30,ANOMALY\r\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].task_id, 'T,1');
  assert.equal(rows[1].total_alerts, 2);
  assert.equal(parseCsv(toCsv(rows)).length, 2);
});

test('malformed CSV and formula injection safeguards', () => {
  assert.throws(() => parseCsv('task_id,target_identifier,primary_metric\nT1,S1,5\nT2,S2,bad'), /row 3/);
  assert.throws(() => parseCsv('task_id,target_identifier,primary_metric\n"T1,S1,5'), /Unclosed/);
  const result = analyze({task_id:'=1+1',target_identifier:'S',primary_metric:3});
  assert.match(toCsv([result]), /"'=1\+1"/);
});
