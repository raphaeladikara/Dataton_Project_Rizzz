import unittest

import numpy as np

from late_fusion import fuse_probabilities, learn_nonnegative_weights


class LateFusionTests(unittest.TestCase):
    def test_equal_weight_average(self):
        result = fuse_probabilities(
            {"gaze": [0.2, 0.8], "head_face": [0.4, 0.6]},
            {"gaze": 1.0, "head_face": 1.0},
        )
        np.testing.assert_allclose(result.probability, [0.3, 0.7])
        np.testing.assert_array_equal(result.available_modalities, [2, 2])

    def test_missing_and_low_quality_modalities_are_renormalized(self):
        result = fuse_probabilities(
            {"gaze": [0.2, 0.8], "voice": [np.nan, 0.1]},
            {"gaze": 2.0, "voice": 1.0},
            quality={"gaze": [1.0, 1.0], "voice": [1.0, 0.2]},
        )
        np.testing.assert_allclose(result.probability, [0.2, 0.8])
        np.testing.assert_array_equal(result.available_modalities, [1, 1])

    def test_no_usable_modality_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "No usable modality"):
            fuse_probabilities({"gaze": [np.nan]}, {"gaze": 1.0})

    def test_learning_favors_informative_modality(self):
        labels = np.array([0, 0, 0, 1, 1, 1])
        weights = learn_nonnegative_weights(
            {
                "gaze": [0.05, 0.10, 0.20, 0.80, 0.90, 0.95],
                "voice": [0.45, 0.55, 0.50, 0.50, 0.45, 0.55],
            },
            labels,
        )
        self.assertGreater(weights["gaze"], 0.95)


if __name__ == "__main__":
    unittest.main()
