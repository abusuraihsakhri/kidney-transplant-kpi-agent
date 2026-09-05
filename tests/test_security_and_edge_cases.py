"""
Focused tests for security enforcement, edge cases, and error handling.
"""
import sys
import os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from agents.base import PHIGuard, AuditLogger, SecurityException, AuditTrail


class TestPHIGuardEdgeCases:
    """Test PHI guard enforcement with various input patterns."""

    def test_ssn_pattern_blocked(self):
        with pytest.raises(SecurityException):
            PHIGuard.assert_no_phi("Patient SSN: 123-45-6789")

    def test_mrn_pattern_blocked(self):
        with pytest.raises(SecurityException):
            PHIGuard.assert_no_phi("MRN-12345678 clinical note")

    def test_phone_number_blocked(self):
        with pytest.raises(SecurityException):
            PHIGuard.assert_no_phi("Contact patient at 555-123-4567")

    def test_email_blocked(self):
        with pytest.raises(SecurityException):
            PHIGuard.assert_no_phi("Email patient at john@example.com")

    def test_dob_pattern_blocked(self):
        with pytest.raises(SecurityException):
            PHIGuard.assert_no_phi("DOB: 01/15/1985")

    def test_patient_name_blocked(self):
        with pytest.raises(SecurityException):
            PHIGuard.assert_no_phi("Patient Name: John Smith admitted")

    def test_john_doe_blocked(self):
        with pytest.raises(SecurityException):
            PHIGuard.assert_no_phi("Patient John Doe requires follow-up")

    def test_clean_text_passes(self):
        """Non-PHI text should pass without exception."""
        PHIGuard.assert_no_phi("Specimen KEY-001 analytical result nominal")
        PHIGuard.assert_no_phi("KDPI score 45.2 within normal range")

    def test_empty_string_passes(self):
        """Empty string should not raise."""
        PHIGuard.assert_no_phi("")

    def test_none_handled(self):
        """None input should not raise."""
        PHIGuard.assert_no_phi(None)

    def test_redact_phi_replaces_patterns(self):
        """PHI redaction should replace patterns with placeholder."""
        redacted = PHIGuard.redact_phi("Patient MRN-123456 has SSN 123-45-6789")
        assert "MRN-123456" not in redacted
        assert "123-45-6789" not in redacted
        assert "[REDACTED_IDENTIFIER]" in redacted


class TestAuditTrailIntegrity:
    """Test HMAC-SHA256 audit trail integrity."""

    def test_audit_trail_chaining(self):
        """Each audit entry should chain to the previous hash."""
        trail = AuditTrail(secret_key="test-key-123")
        trail.log("test_actor", "test_tier", "TEST_EVENT", {"data": "value1"})
        trail.log("test_actor", "test_tier", "TEST_EVENT", {"data": "value2"})

        assert len(trail.logs) == 2
        assert trail.logs[1]["prev_hash"] == trail.logs[0]["current_hash"]

    def test_audit_integrity_verification(self):
        """Audit trail should verify as intact."""
        trail = AuditTrail(secret_key="test-key-123")
        trail.log("actor", "tier", "EVENT", {"key": "value"})
        assert trail.verify_integrity() is True

    def test_audit_tamper_detection(self):
        """Tampered audit entry should fail verification."""
        trail = AuditTrail(secret_key="test-key-123")
        trail.log("actor", "tier", "EVENT", {"key": "value"})
        # Tamper with the entry
        trail.logs[0]["payload_hash"] = "tampered_hash"
        assert trail.verify_integrity() is False

    def test_audit_phi_blocked_in_log(self):
        """Audit log should reject PHI-containing details."""
        trail = AuditTrail(secret_key="test-key-123")
        with pytest.raises(SecurityException):
            trail.log("actor", "tier", "EVENT", {"note": "Patient MRN-123456"})


class TestSecurityRequirements:
    """Test security configuration requirements."""

    def test_audit_trail_requires_secret_key(self):
        """AuditTrail should require a secret key via env var or parameter."""
        original = os.environ.pop("AUDIT_SECRET_KEY", None)
        try:
            with pytest.raises(SecurityException):
                AuditTrail()
        finally:
            if original:
                os.environ["AUDIT_SECRET_KEY"] = original

    def test_audit_trail_accepts_env_var(self):
        """AuditTrail should accept key from environment variable."""
        os.environ["AUDIT_SECRET_KEY"] = "env-based-key-123"
        try:
            trail = AuditTrail()
            assert trail.secret_key == b"env-based-key-123"
        finally:
            os.environ.pop("AUDIT_SECRET_KEY", None)
