from prospective_evaluation import eligible_thresholds, endpoint_summary, threshold_metrics


def test_endpoint_summary_keeps_abstentions_in_denominator():
    result = endpoint_summary([0, 0, 1, 1], [.1, .2, .8, .9], [True, False, True, True])
    assert result["denominator"] == 4
    assert result["coverage"] == .75
    assert result["abstentionRate"] == .25


def test_threshold_metrics_supports_local_prevalence_and_capacity_filter():
    row = threshold_metrics([0, 0, 1, 1], [.1, .3, .7, .9], .5, prevalence=.01)
    assert row["sensitivity"] == 1
    assert row["specificity"] == 1
    assert row["ppv"] == 1
    assert eligible_thresholds([0, 0, 1, 1], [.1, .3, .7, .9], minimum_sensitivity=.9, maximum_referral_rate=.5)
