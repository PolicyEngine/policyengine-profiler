import unittest
from types import SimpleNamespace

from backend import profile_core


class ProfileCoreSecurityTests(unittest.TestCase):
    def test_environment_details_redacts_internal_state(self):
        details = profile_core.environment_details()

        self.assertEqual(details, {"pythonVersion": profile_core.sys.version.split()[0]})
        self.assertNotIn("python", details)
        self.assertNotIn("paths", details)
        self.assertNotIn("policyengineVersion", details)
        self.assertNotIn("policyengineCoreVersion", details)
        self.assertNotIn("policyengineUsVersion", details)
        self.assertNotIn("policyengineUkVersion", details)

    def test_json_error_uses_redacted_environment(self):
        error = profile_core.json_error("boom", payload={"country": "us"})

        self.assertFalse(error["ok"])
        self.assertEqual(error["environment"], {"pythonVersion": profile_core.sys.version.split()[0]})
        self.assertEqual(error["request"], {"country": "us"})

    def test_build_top_functions_redacts_absolute_paths(self):
        stats = SimpleNamespace(
            stats={
                ("/tmp/work/backend/profile_core.py", 12, "do_work"): (
                    2,
                    4,
                    0.125,
                    0.5,
                    {},
                ),
            }
        )

        rows = profile_core.build_top_functions(stats)

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["label"], "do_work (profile_core.py:12)")
        self.assertNotIn("file", rows[0])
        self.assertNotIn("/tmp", rows[0]["label"])


if __name__ == "__main__":
    unittest.main()
