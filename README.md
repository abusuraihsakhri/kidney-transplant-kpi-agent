# Kidney Transplant KPI Agent

> **Domain:** Nephrology & Renal Replacement Protocols
> **Reference Guidelines & Standards:** `KDIGO & KDOQI Clinical Guidelines`

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB.svg?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg?logo=fastapi&logoColor=white)
![Audit Trail](https://img.shields.io/badge/Audit-HMAC--SHA256_Tamper--Evident-brightgreen.svg)
![Zero-PHI Guard](https://img.shields.io/badge/Guard-Zero--PHI_Outbound-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)

</div>

---

## What It Does

**Kidney Transplant KPI Agent** is an advanced analytical and computational platform implementing KDPI Donor Scoring, Delayed Graft Function & Banff Staging. It provides a multi-agent evaluation system with cryptographic audit trails and PHI protection.

---

## Key Capabilities & Algorithmic Modules

### Core Algorithmic & Evaluation Engines

- **`Severity`** — dedicated module for severity evaluation and state verification.
- **`DomainKnowledgeRegistry`**: Enterprise domain rules, guideline matrices, and evidence benchmarks.
- **`AgentAlert`** — dedicated module for agent alert evaluation and state verification.
- **`KDPIProfileCalculatorAgent`**: Specialized Sub-Agent 1 for kidney-transplant-kpi-agent
- **`DGFRiskForecasterAgent`**: Specialized Sub-Agent 2 for kidney-transplant-kpi-agent
- **`BanffBiopsyClassifierAgent`**: Specialized Sub-Agent 3 for kidney-transplant-kpi-agent

---

## Installation

```bash
# Clone the repository
git clone https://github.com/abusuraihsakhri/kidney-transplant-kpi-agent.git
cd kidney-transplant-kpi-agent

# Install dependencies
pip install fastapi uvicorn pydantic pytest

# Set up environment configuration
cp .env.example .env
# Edit .env and set a secure AUDIT_SECRET_KEY
```

---

## CLI Quickstart & Usage

### 1. Single Task Evaluation
```bash
python cli.py audit --task-id TASK-001 --primary 28.5 --secondary 14.2 --critical --status DISCORDANT
```

### 2. System Query Chat
```bash
python cli.py chat "What is the system status?"
```

### 3. Batch CSV Processing
```bash
python cli.py batch -i sample.csv -o results.csv
```

### 4. Verify Audit Trail Integrity
```bash
python cli.py verify-audit
```

### 5. Launch REST API Server
```bash
python cli.py serve --host 127.0.0.1 --port 8000
```

### Parameter Reference
- `--task-id`: Unique task/case identifier
- `--target`: Entity or target identifier
- `--primary`: Primary measurement value (float)
- `--secondary`: Secondary measurement value (float)
- `--critical`: Flag for critical/emergency status
- `--status`: Status descriptor (e.g., NOMINAL, DISCORDANT)
- `-i/--input`: Input CSV file path for batch processing
- `-o/--output`: Output CSV file path for batch processing

### Input Data Schema (CSV)

| Field | Description | Requirement |
|:------|:------------|:------------|
| `task_id` | Task identifier | Required |
| `target_identifier` | Target entity identifier | Required |
| `primary_metric` | Primary measurement value | Required |
| `secondary_metric` | Secondary measurement value | Required |
| `status_descriptor` | Status code descriptor | Required |
| `is_critical_flag` | Emergency escalation flag | Optional |

---

## REST API Endpoints

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus-style metrics |
| POST | `/api/audit` | Submit task for evaluation |
| POST | `/api/chat` | Query the supervisory chat |
| GET | `/api/audit/logs` | Retrieve audit trail |

---

## Security & Enterprise Architecture

* **Zero-PHI Outbound Interceptor:** Active AST and regex inspection blocking SSNs, MRNs, phone numbers, and patient identifiers.
* **Tamper-Evident HMAC-SHA256 Audit Trail:** Chained, cryptographically signed logs for every evaluation and state transition.
* **Air-Gapped LLM Reasoning Adapter:** Agnostic integration for local Ollama instances (`llama3`, `mistral`), Claude 3.5 Sonnet, GPT-4o, and deterministic test mocks.
* **Active Learning Bayesian Calibration:** Dynamic tracker updating worker reliability weights and monitoring Brier calibration drift.
* **FastAPI & Prometheus Telemetry:** Exposes OpenAPI 3.1 REST endpoints and operational Prometheus metrics (`/metrics`).

---

## Testing & Verification

Run the automated test suite:

```bash
AUDIT_SECRET_KEY=test-key pytest -v
```

Execute high-throughput batch simulation benchmarks:

```bash
AUDIT_SECRET_KEY=test-key python simulator.py --tasks 1000 --concurrency 8
```

---

## Container Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or manually with Docker
docker build -t kidney-transplant-kpi-agent .
docker run -p 8000:8000 -e AUDIT_SECRET_KEY=your-secret-key kidney-transplant-kpi-agent
```

---

## Project Structure

```
kidney-transplant-kpi-agent/
├── agents/                      # Core agent modules
│   ├── __init__.py
│   ├── api.py                   # FastAPI REST server
│   ├── base.py                  # Security, PHI guard, audit trail
│   ├── learning.py              # Bayesian calibration engine
│   ├── llm_factory.py           # LLM provider factory
│   ├── metrics.py               # Prometheus metrics exporter
│   ├── models.py                # Pydantic data models
│   ├── streamer.py              # WebSocket telemetry
│   ├── supervisor.py            # Supervisor orchestrator
│   └── workers.py               # Domain worker agents
├── tests/                       # Test suite
├── kidney_transplant_kpi_agent/ # Alternative package structure
├── web/                         # Web dashboard
├── cli.py                       # Command-line interface
├── enrichment.py                # Enrichment feature engines
├── simulator.py                 # Load testing simulator
├── pyproject.toml               # Project configuration
├── Dockerfile                   # Docker build
└── docker-compose.yml           # Docker Compose configuration
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
