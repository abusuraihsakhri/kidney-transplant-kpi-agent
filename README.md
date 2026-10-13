# Kidney Transplant KPI Agent

A Python CLI/API and static browser demonstration for evaluating **synthetic**, unitless measurements against threshold rules. The repository contains three historical Python entry points with distinct input schemas. The root CLI and agents package provide the main Docker/API workflow.

**Clinical limitation:** Despite legacy module names, these rules do **not** calculate Kidney Donor Profile Index (KDPI), estimate delayed graft function, classify Banff rejection, or implement KDIGO/KDOQI decision algorithms. They have not undergone clinical validation. Do not use outputs for medical decisions.

## Browser demonstration

Serve the repository root locally:

~~~sh
python -m http.server 8001
~~~

Then open http://localhost:8001/. The root index.html redirects to the browser demonstration in web/index.html.

The browser processes a synthetic task or an uploaded CSV with up to 1,000 rows (2 MB). It displays rule alerts and real session counts, and exports JSON/CSV. Calculations run in JavaScript without Python, Pyodide, a backend API, external libraries, or external font requests. No browser-side cryptographic audit log is generated. Browser results are not stored or sent to a server.

GitHub Pages compatibility is implemented using relative static paths. Live publication must be verified separately.

## Rule definitions

The following demonstration thresholds are **arbitrary** and unitless, not transplant-specific.

| Condition | Output |
| --- | --- |
| Primary metric greater than 25 | Elevated alert |
| Secondary metric greater than 12 | Elevated alert |
| Synthetic critical flag | Critical alert |
| Status contains DISCORDANT, ANOMALY, MUTANT, VIOLATION, FAIL, or REJECT | Elevated alert |
| No condition matches | Routine |

Legacy status labels are retained for compatibility, but they are not medical risk categories. Other historical Python modules use different thresholds.

## Python CLI and API

Requires Python 3.9 or newer. For the primary CLI and FastAPI service:

~~~sh
python -m pip install -e ".[api,test]"
export AUDIT_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_hex(32))')"
python cli.py audit --task-id DEMO-001 --target SAMPLE-001 --primary 26 --secondary 13 --status DISCORDANT
python cli.py batch -i sample.csv -o results.csv
python cli.py verify-audit
python cli.py serve --host 127.0.0.1 --port 8000
~~~

API endpoints are GET /health, GET /metrics, POST /api/audit, POST /api/chat, and GET /api/audit/logs. Implementation: agents/api.py. The API has **no built-in authentication** and must not be exposed publicly without additional controls.

For production API operation, set AUDIT_ENV=production and a strong secret AUDIT_SECRET_KEY. Audit initialization then fails if the key is absent. Development mode warns and uses a nonsecret fallback key; its signatures are not appropriate for production.

Run tests and Python syntax verification:

~~~sh
pytest -q
python -m compileall -q agents kidney_transplant_kpi_agent cli.py kidney_tx_sentinel.py enrichment.py
node --check web/app.js
node --check web/kpi.js
node --test tests/web.test.cjs
~~~

Node.js is needed only for JavaScript tests, not browser execution.

## Input schema

The primary Python CLI and browser accept task_id, target_identifier, and primary_metric (required). Optional fields are secondary_metric, status_descriptor, and is_critical_flag. CSV boolean values include true/false, yes/no, and 1/0. Use **synthetic identifiers only**.

The kidney_transplant_kpi_agent/ package and kidney_tx_sentinel.py remain for backward compatibility with their own CLI/API interfaces and tests.

## Privacy and security

- The browser retains evaluations only in tab memory; it parses CSV locally and exports only on request. Never enter real patient data.
- Python audit records are HMAC-SHA256 signed but remain in process memory; they are not durable or externally timestamped.
- Python's PHI pattern guard is **heuristic**, not validated de-identification and not evidence of HIPAA compliance.
- The mock model adapter performs no external model inference or clinical verification.
- Real-world API deployment would require authentication, TLS, access controls and independent clinical/security validation.

## Technologies and compatibility

Python 3.9+, Pydantic 2, FastAPI, Uvicorn, pytest; HTML/CSS, vanilla JavaScript and the Node.js built-in test runner. The browser demonstration targets current desktop and mobile browsers with JavaScript enabled. Docker support is provided by Dockerfile and docker-compose.yml.

## License

MIT — see [LICENSE](LICENSE).
