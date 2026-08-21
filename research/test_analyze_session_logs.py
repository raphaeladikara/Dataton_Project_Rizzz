import json
import tempfile
import unittest
from pathlib import Path

from research.analyze_session_logs import load_logs


class ResearchConsentFilterTest(unittest.TestCase):
    def test_unconsented_field_operator_audit_is_rejected_before_analysis(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "field.json"
            path.write_text(json.dumps({
                "schemaVersion": 3,
                "sessionId": "field-1",
                "purpose": "target_population_research",
                "privacy": {
                    "researchConsent": False,
                    "derivedGazeExported": False,
                    "storage": "download_by_operator",
                    "retention": "operator_export",
                },
                "events": [{
                    "type": "audit.downloaded",
                    "data": {"purpose": "operator_audit"},
                }],
            }), encoding="utf-8")
            logs, rejected = load_logs([path])

        self.assertEqual(logs, [])
        self.assertEqual(len(rejected), 1)
        self.assertIn("research consent", rejected[0]["reason"].lower())

    def test_engineering_log_keeps_its_existing_protocol_path(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "gate-a.json"
            path.write_text(json.dumps({
                "schemaVersion": 3,
                "sessionId": "gate-a-1",
                "purpose": "gate_a_adult",
                "privacy": {"researchConsent": False},
                "events": [],
            }), encoding="utf-8")
            logs, rejected = load_logs([path])

        self.assertEqual(len(logs), 1)
        self.assertEqual(rejected, [])


if __name__ == "__main__":
    unittest.main()
