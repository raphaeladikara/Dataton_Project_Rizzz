/**
 * Preferential-looking assets, and which published cutoff each one licenses.
 *
 * The 69% geometric-fixation cutoff has been applied to two different tests,
 * and they do not share a precedent:
 *
 *  - The **original GeoPref**, 62.22 s, is the test Wen et al. 2022 validated at
 *    scale (n=1863, ages 12–48 months): sensitivity 17%, specificity 98%,
 *    PPV 81%, NPV 65%.
 *  - The **Complex Social GeoPref**, 90 s, is a different test. Moore et al.
 *    2018 carried the same 69% cutoff over to it "for consistency rather than
 *    optimized", and reported sensitivity 18%, specificity 97%, AUC 0.74 on a
 *    much smaller sample.
 *
 * Quoting Wen's n=1863 figures on a Complex Social session would be attaching
 * one test's evidence to another test's measurement, so every asset carries its
 * own precedent rather than a shared one.
 *
 * None of these have audio, and that is the protocol, not an omission: the
 * Moore et al. 2018 methods state plainly "There was no audio." Do not add a
 * soundtrack.
 */
export type GeoprefAsset = {
  id: string;
  title: string;
  path: string;
  durationSeconds: number;
  license: string;
  citation: string;
  /** The published operating point this asset licenses, or null when none does. */
  precedent: { sensitivity: number; specificity: number; source: string } | null;
  /** True only for a complete published protocol the 69% cutoff was applied to. */
  validatedProtocol: boolean;
  available: boolean;
};

export const GEOPREF_ASSETS: Record<string, GeoprefAsset> = {
  /**
   * One scene of the five-scene Complex Social example video published as
   * Additional file 2 of Moore et al. 2018, re-encoded to 640x360. It is an
   * illustration of the paradigm, not a presentation master: the panels sit in
   * a black surround and the excerpt runs a fifth of the published length.
   */
  ccbyExcerpt: {
    id: "ccbyExcerpt",
    title: "Cuplikan Complex Social GeoPref (Moore dkk. 2018, contoh publik)",
    path: "/stimuli/geopref-social-geometric-ccby.mp4",
    durationSeconds: 16.75,
    license: "CC BY 4.0",
    citation: "Moore et al. 2018, Molecular Autism 9:19, doi:10.1186/s13229-018-0202-z, Additional file 2",
    precedent: null,
    validatedProtocol: false,
    available: true,
  },
  /** The test Wen et al. 2022 validated at scale. The strongest evidence we could run. */
  ucsdOriginal: {
    id: "ucsdOriginal",
    title: "GeoPref asli 62,22 detik (UCSD, izin riset)",
    path: "/stimuli/geopref-original-ucsd.mp4",
    durationSeconds: 62.22,
    license: "UCSD research-use licence",
    citation: "Wen et al. 2022, Scientific Reports 12:4253, doi:10.1038/s41598-022-08102-6",
    precedent: { sensitivity: 0.17, specificity: 0.98, source: "Wen dkk. 2022, n=1.863, usia 12–48 bulan" },
    validatedProtocol: true,
    available: false,
  },
  ucsdComplexSocial: {
    id: "ucsdComplexSocial",
    title: "Complex Social GeoPref 90 detik (UCSD, izin riset)",
    path: "/stimuli/geopref-complex-social-ucsd.mp4",
    durationSeconds: 90,
    license: "UCSD research-use licence",
    citation: "Moore et al. 2018, Molecular Autism 9:19, doi:10.1186/s13229-018-0202-z",
    precedent: { sensitivity: 0.18, specificity: 0.97, source: "Moore dkk. 2018, AUC 0,74, sampel jauh lebih kecil" },
    validatedProtocol: true,
    available: false,
  },
};

/** Strongest available first: the large-sample original, then Complex Social, then the excerpt. */
export function activeGeoprefAsset(): GeoprefAsset {
  return GEOPREF_ASSETS.ucsdOriginal.available
    ? GEOPREF_ASSETS.ucsdOriginal
    : GEOPREF_ASSETS.ucsdComplexSocial.available
      ? GEOPREF_ASSETS.ucsdComplexSocial
      : GEOPREF_ASSETS.ccbyExcerpt;
}
