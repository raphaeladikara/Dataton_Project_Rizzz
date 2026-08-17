export type GeoprefAsset = {
  id: string;
  title: string;
  path: string;
  durationSeconds: number;
  license: string;
  citation: string;
  /** True only for the 60s or 90s protocol the 69% threshold was derived on. */
  validatedProtocol: boolean;
  available: boolean;
};

export const GEOPREF_ASSETS: Record<string, GeoprefAsset> = {
  ccbyExcerpt: {
    id: "ccbyExcerpt",
    title: "GeoPref excerpt (Moore et al. 2018)",
    path: "/stimuli/geopref-social-geometric-ccby.mp4",
    durationSeconds: 16.75,
    license: "CC BY 4.0",
    citation: "Moore et al. 2018, Molecular Autism, doi:10.1186/s13229-018-0202-z",
    validatedProtocol: false,
    available: true,
  },
  ucsdComplexSocial: {
    id: "ucsdComplexSocial",
    title: "Complex Social GeoPref (UCSD, research use)",
    path: "/stimuli/geopref-complex-social-ucsd.mp4",
    durationSeconds: 90,
    license: "UCSD research-use licence",
    citation: "Wen et al. 2022, Molecular Autism",
    validatedProtocol: true,
    available: false,
  },
};

export function activeGeoprefAsset(): GeoprefAsset {
  return GEOPREF_ASSETS.ucsdComplexSocial.available
    ? GEOPREF_ASSETS.ucsdComplexSocial
    : GEOPREF_ASSETS.ccbyExcerpt;
}
