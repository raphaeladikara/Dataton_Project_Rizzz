import json
import re
import unittest
from pathlib import Path

from research.export_readiness_matrix import build as build_readiness_matrix


ROOT = Path(__file__).resolve().parent.parent
POSITIVE_CONTROL = ROOT / "research" / "hasil" / "kontrol_positif" / "ringkasan.json"
PUBLIC_EVIDENCE = ROOT / "app" / "public" / "validation" / "gate-b-public.json"

PUBLIC_SURFACES = (
    ROOT / "README.md",
    ROOT / "docs" / "README.md",
    ROOT / "docs" / "arah_pitch.md",
    ROOT / "docs" / "pitch_10_menit.md",
    ROOT / "docs" / "pitch_7_menit.md",
    ROOT / "docs" / "skenario_panggung.md",
    ROOT / "docs" / "dampak_dan_adopsi.md",
    ROOT / "docs" / "bingkai_ai.md",
    ROOT / "docs" / "keputusan_ilmiah.md",
    ROOT / "paper" / "sumber" / "paper_final.tex",
    ROOT / "app" / "app" / "validation" / "page.tsx",
    ROOT / "app" / "public" / "validation" / "gate-b-public.json",
)


class ReadinessMatrixTest(unittest.TestCase):
    def test_matrix_locks_the_five_competition_readiness_states(self) -> None:
        matrix = build_readiness_matrix()
        states = {item["id"]: item["status"] for item in matrix["capabilities"]}
        self.assertEqual(matrix["schema"], "neurogaze-readiness-matrix-v1")
        self.assertEqual(states, {
            "on_device_measurement_chain": "ready_for_engineering_demo",
            "adult_responsivity": "demonstrated",
            "automatic_toddler_referral": "withheld",
            "kader_usability": "not_tested",
            "indonesian_toddler_validity": "not_tested",
        })
        self.assertFalse(matrix["clinicalClaimsAvailable"])

    def test_public_evidence_embeds_the_canonical_matrix(self) -> None:
        public = json.loads(PUBLIC_EVIDENCE.read_text(encoding="utf-8"))
        self.assertEqual(public["readiness"], build_readiness_matrix())
        self.assertEqual(public["headline"]["metric"], "adult_positive_control")


class PositiveControlClaimTest(unittest.TestCase):
    def test_complete_denominators_are_preserved(self) -> None:
        summary = json.loads(POSITIVE_CONTROL.read_text(encoding="utf-8"))
        self.assertEqual(summary["participants"], 12)
        self.assertEqual(summary["sessionsRecorded"], 23)
        self.assertEqual(summary["sessionsUsable"], 15)
        self.assertEqual(summary["attritionByCondition"]["biasa"], {
            "direkam": 11, "dipakai": 9, "ditahan": 2,
        })
        self.assertEqual(summary["attritionByCondition"]["produksi"], {
            "direkam": 12, "dipakai": 6, "ditahan": 6,
        })
        self.assertEqual(summary["compositeRule"]["demonstrasi"]["fired"], {
            "biasa": 0, "produksi": 4,
        })

    def test_public_evidence_calls_this_responsivity_not_clinical_accuracy(self) -> None:
        public = json.loads(PUBLIC_EVIDENCE.read_text(encoding="utf-8"))
        control = public["positiveControl"]
        self.assertEqual(control["sessions"], {"recorded": 23, "qualityPass": 15})
        self.assertEqual(control["conditions"]["ordinary"], {"usable": 9, "recorded": 11, "ruleFired": 0})
        self.assertEqual(control["conditions"]["produced"], {"usable": 6, "recorded": 12, "ruleFired": 4})
        self.assertEqual(control["interpretation"], "adult_manipulation_check")
        self.assertFalse(control["emitsReferral"])
        source = json.loads(POSITIVE_CONTROL.read_text(encoding="utf-8"))
        self.assertEqual(
            [item["nearestGap"] for item in control["signals"]],
            [item["margin"] for item in source["signals"]],
        )


class ProhibitedClaimTest(unittest.TestCase):
    def test_main_surfaces_do_not_ship_known_misreadings(self) -> None:
        prohibited = {
            "56-month delay localized to Indonesia": re.compile(
                r"di\s+Indonesia.{0,70}(?:diagnosis.{0,30})?56\s+bulan|rata-rata\s+diagnosis\s+(?:ASD\s+)?di\s+Indonesia.{0,30}56\s+bulan",
                re.IGNORECASE | re.DOTALL,
            ),
            "Carette called clinically validated": re.compile(
                r"Carette.{0,100}(?:tervalidasi klinis|validasi klinis|clinically validated)",
                re.IGNORECASE | re.DOTALL,
            ),
            "Gate B called ground truth or gold standard": re.compile(
                r"Gate\s*B\s+(?:adalah|menggunakan|memakai)\s+(?:ground truth|gold standard)",
                re.IGNORECASE | re.DOTALL,
            ),
            "temporal drift sold as 42x": re.compile(
                r"(?:42\s*(?:x|×|kali)|empat puluh dua kali).{0,120}(?:akurasi|robust|tahan|arsitektur|fitur)|(?:akurasi|robust|tahan|arsitektur|fitur).{0,120}(?:42\s*(?:x|×|kali)|empat puluh dua kali)",
                re.IGNORECASE | re.DOTALL,
            ),
            "ethics reduced to a signature": re.compile(
                r"(?:cukup|hanya (?:butuh|membutuhkan)|selesai dengan)\s+(?:satu|1)\s+tanda tangan|only needs? one signature",
                re.IGNORECASE,
            ),
            "cost per case presented as observed": re.compile(
                r"menemukan satu kasus dengan (?:NeuroGaze|Neurogaze) harganya|(?:biaya|harga) (?:NeuroGaze|Neurogaze) per kasus (?:adalah|sebesar)",
                re.IGNORECASE | re.DOTALL,
            ),
        }
        failures = []
        for path in PUBLIC_SURFACES:
            text = path.read_text(encoding="utf-8")
            for label, pattern in prohibited.items():
                if pattern.search(text):
                    failures.append(f"{path.relative_to(ROOT)}: {label}")
        self.assertEqual(failures, [], "\n".join(failures))

    def test_core_surfaces_state_the_current_readiness_boundary(self) -> None:
        required = {
            ROOT / "README.md": ("23 sesi", "15 lulus mutu", "rujukan otomatis balita ditahan"),
            ROOT / "docs" / "pitch_10_menit.md": ("9 dari 11", "6 dari 12", "acuan klinis buta"),
            ROOT / "paper" / "sumber" / "paper_final.tex": ("23 sesi direkam", "15 lulus mutu", "Rujukan otomatis balita ditahan"),
            ROOT / "app" / "app" / "validation" / "page.tsx": ("positiveControl.sessions.recorded", "Rujukan otomatis balita masih ditahan"),
        }
        missing = []
        for path, phrases in required.items():
            text = path.read_text(encoding="utf-8")
            for phrase in phrases:
                if phrase.casefold() not in text.casefold():
                    missing.append(f"{path.relative_to(ROOT)}: {phrase}")
        self.assertEqual(missing, [], "\n".join(missing))


if __name__ == "__main__":
    unittest.main()
