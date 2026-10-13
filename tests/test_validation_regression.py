"""Regression coverage for synthetic-input validation and audit security."""
import pytest
from pydantic import ValidationError

from agents.base import AuditTrail, SecurityException
from agents.models import SystemTaskPayload
from agents.supervisor import SystemSupervisor


@pytest.mark.parametrize("bad", [float("nan"), float("inf"), float("-inf")])
def test_nonfinite_metrics_rejected(bad):
    with pytest.raises(ValidationError):
        SystemTaskPayload(task_id="T1", target_identifier="S1", primary_metric=bad)


def test_empty_identifiers_rejected():
    with pytest.raises(ValidationError):
        SystemTaskPayload(task_id="", target_identifier="S1", primary_metric=1)


def test_phi_in_nested_attributes_rejected(monkeypatch):
    monkeypatch.setenv("AUDIT_SECRET_KEY", "test-key-12345678")
    payload = SystemTaskPayload(
        task_id="T1", target_identifier="S1", primary_metric=1,
        attributes={"nested": {"note": "MRN-123456"}}
    )
    with pytest.raises(SecurityException):
        SystemSupervisor().process_task(payload)


def test_audit_export_is_a_defensive_copy():
    trail = AuditTrail(secret_key="test-key-12345678")
    trail.log("actor", "tier", "EVENT", {"example": True})
    exported = trail.get_trail()
    exported[0]["payload_hash"] = "modified"
    assert trail.verify_integrity()
    assert trail.get_trail()[0]["payload_hash"] != "modified"


def test_production_fails_closed_without_secret(monkeypatch):
    monkeypatch.delenv("AUDIT_SECRET_KEY", raising=False)
    monkeypatch.setenv("AUDIT_ENV", "production")
    with pytest.raises(ValueError, match="required in production"):
        AuditTrail()

def test_concurrent_audit_appends_preserve_chain():
    from concurrent.futures import ThreadPoolExecutor
    trail = AuditTrail(secret_key="test-key-12345678")
    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(lambda n: trail.log("actor", "tier", "EVENT", {"n": n}), range(100)))
    assert len(trail.get_trail()) == 100
    assert trail.verify_integrity()
