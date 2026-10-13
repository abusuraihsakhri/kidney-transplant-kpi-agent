(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const entries = [];
  let currentResults = [];
  const updateTotals = () => {
    $('tasks').textContent = String(entries.length);
    $('alerts').textContent = String(entries.reduce((total, item) => total + item.total_alerts, 0));
    $('critical').textContent = String(entries.filter(item => item.overall_urgency === 'CRITICAL_STAT_PANIC').length);
  };
  const report = (message, isError = false) => {
    $('message').textContent = message;
    $('message').classList.toggle('error', isError);
  };
  const show = results => {
    currentResults = results;
    $('result').textContent = JSON.stringify(results.length === 1 ? results[0] : results, null, 2);
    $('export-json').disabled = false;
    $('export-csv').disabled = false;
    updateTotals();
  };
  const download = (content, filename, mime) => {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  $('audit-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const result = KidneyKpi.analyze({
        task_id: $('task_id').value,
        target_identifier: $('target_identifier').value,
        primary_metric: $('primary_metric').value,
        secondary_metric: $('secondary_metric').value,
        status_descriptor: $('status_descriptor').value,
        is_critical_flag: $('is_critical_flag').checked
      });
      entries.push(result);
      show([result]);
      report('Local demonstration completed. No data were uploaded or stored.');
    } catch (error) { report(error.message, true); }
  });

  $('csv-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 2000000) throw new Error('CSV exceeds the 2 MB limit.');
      const results = KidneyKpi.parseCsv(await file.text());
      if (!results.length) throw new Error('CSV contains no data rows.');
      entries.push(...results);
      show(results);
      report('Processed ' + results.length + ' rows locally. No data were uploaded or stored.');
    } catch (error) { report(error.message, true); }
    finally { event.target.value = ''; }
  });

  $('export-json').addEventListener('click', () => download(JSON.stringify(currentResults, null, 2), 'kpi-demonstration.json', 'application/json'));
  $('export-csv').addEventListener('click', () => download(KidneyKpi.toCsv(currentResults), 'kpi-demonstration.csv', 'text/csv'));
  $('clear').addEventListener('click', () => {
    entries.length = 0;
    currentResults = [];
    $('result').textContent = 'No evaluation yet.';
    $('export-json').disabled = true;
    $('export-csv').disabled = true;
    updateTotals();
    report('Session cleared.');
  });
})();
