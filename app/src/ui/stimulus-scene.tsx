"use client";

import { geoprefNeedsMirror } from "../geopref/protocol";

type StimulusSceneProps = {
  visualCue: string;
  cueActive: boolean;
  ostensiveActive?: boolean;
  paused?: boolean;
  /** Path to the preferential-looking clip; absent until an asset is present. */
  geoprefSource?: string;
  /** Which half carries the geometric panel, counterbalanced per session. */
  geometricSide?: "left" | "right";
};

/** One identical target object, mirrored to both sides of the model.
    Identical objects remove object preference as a competing explanation for
    a left/right look, which is why the reference RJA paradigm uses them. */
function TargetToy({ side }: { side: "left" | "right" }) {
  return (
    <svg className={`stimulusToy stimulusToy${side === "left" ? "Left" : "Right"}`} viewBox="0 0 160 164" role="presentation">
      <ellipse className="toyShadow" cx="80" cy="156" rx="54" ry="8" />
      <path className="toyBlockA" d="M32 112h96v34a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8Z" />
      <path className="toyStudA" d="M52 100h20v14H52ZM88 100h20v14H88Z" />
      <path className="toyBlockB" d="M40 62h80v34a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8Z" />
      <path className="toyStudB" d="M58 50h18v14H58ZM86 50h18v14H86Z" />
      <path className="toyBlockC" d="M50 12h60v34a8 8 0 0 1-8 8H58a8 8 0 0 1-8-8Z" />
      <path className="toyStudC" d="M66 0h16v14H66ZM88 0h16v14H88Z" />
    </svg>
  );
}

/* A pointing hand needs a thumb and a finger that leaves the fist from the top
   edge. Centred on the fist with no thumb it reads as the wrong gesture. */
const HAND_PATH = [
  "M-14-26",
  "C-10-29-5-30 0-28",
  "C4-42 8-50 16-50",
  "C26-50 32-45 36-38",
  "C42-32 50-30 58-30",
  "L94-28",
  "C104-28 112-22 112-14",
  "C112-6 104 2 94 2",
  "L54 4",
  "C53 12 52 16 52 22",
  "C52 30 46 36 38 36",
  "L2 36",
  "C-6 36-14 32-14 26",
  "Z",
].join("");
/* Two curled-finger creases so the fist reads as a fist, not a mitten. */
const HAND_CREASES = "M50 14c-8 3-17 1-22-6M46 28c-8 3-17 1-22-6";

function PointingHand({ side }: { side: "left" | "right" }) {
  const flip = side === "left" ? 0.72 : -0.72;
  return (
    <g transform={`translate(${side === "left" ? "254 670" : "626 670"}) rotate(${side === "left" ? 99.5 : -99.5}) scale(${flip} -0.72)`}>
      <path className="handShape" d={HAND_PATH} />
      <path className="handCreases" d={HAND_CREASES} />
    </g>
  );
}

export function StimulusScene({ visualCue, cueActive, ostensiveActive = false, paused = false, geoprefSource, geometricSide = "left" }: StimulusSceneProps) {
  const state = [
    "stimulusScene",
    `visual-${visualCue}`,
    ostensiveActive ? "ostensive" : "",
    cueActive ? "cue-active" : "",
    paused ? "paused" : "",
  ].filter(Boolean).join(" ");

  // The preferential-looking block replaces the vector actor entirely: the
  // measure is where the child looks on a side-by-side geometric/social video,
  // so nothing else may compete for attention.
  if (visualCue === "geopref" && geoprefSource) {
    return (
      <div className={`${state} geoprefStage`} data-mirrored={String(geoprefNeedsMirror(geometricSide))} aria-hidden="true">
        <video
          className="geoprefVideo"
          src={geoprefSource}
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
        />
      </div>
    );
  }

  return (
    <div className={state} aria-hidden="true">
      <svg className="stimulusPerson" viewBox="0 0 880 900" preserveAspectRatio="xMidYMid meet" role="presentation">
        <defs>
          <linearGradient id="stimulus-shirt" x1="0.14" y1="0" x2="0.92" y2="1">
            <stop offset="0" stopColor="#4d97a4" />
            <stop offset="0.52" stopColor="#3c818e" />
            <stop offset="1" stopColor="#295a66" />
          </linearGradient>
          <linearGradient id="stimulus-skin" x1="0.2" y1="0" x2="0.85" y2="1">
            <stop offset="0" stopColor="#d5945f" />
            <stop offset="1" stopColor="#b3714a" />
          </linearGradient>
          <clipPath id="stimulus-eye-left"><ellipse cx="382" cy="222" rx="40" ry="31" /></clipPath>
          <clipPath id="stimulus-eye-right"><ellipse cx="498" cy="222" rx="40" ry="31" /></clipPath>
        </defs>

        <g className="personFigure">
          {/* Both arms are always present. Pointing is a rotation about the
              shoulder and elbow; at rest the hands are below the table edge,
              exactly as in the reference recordings. */}
          <g className="arm armLeft">
            <path className="upperArm" d="M326 456 272 562" />
            <path className="armSleeve" d="M326 458 300 514" />
            <g className="forearmGroup forearmLeft">
              <path className="forearm" d="M272 562 254 670" />
              <PointingHand side="left" />
            </g>
          </g>
          <g className="arm armRight">
            <path className="upperArm" d="M554 456 608 562" />
            <path className="armSleeve" d="M554 458 580 514" />
            <g className="forearmGroup forearmRight">
              <path className="forearm" d="M608 562 626 670" />
              <PointingHand side="right" />
            </g>
          </g>

          <g className="personBody">
            <g className="neckGroup">
              <path className="neck" d="M404 350h72v126h-72Z" />
              <path className="neckShade" d="M404 350h72v28c-24 17-48 17-72 0Z" />
            </g>
            {/* The collar is cut out of the shirt so a real neck shows between
                chin and shoulders — the head no longer sits straight on a slab. */}
            <path className="shirt" d="M396 414C374 418 358 426 348 434 318 452 300 480 292 516 280 580 270 730 266 900h348c-4-170-14-320-26-384-8-36-26-64-56-82-10-8-26-16-48-20-4 26-22 40-44 40s-40-14-44-40Z" />
            <path className="shirtCollar" d="M396 414c4 26 22 40 44 40s40-14 44-40" />
          </g>

          <g className="personHead">
            <path className="ear leftEar" d="M303 196c-30-8-47 16-40 52 7 32 30 43 51 27Z" />
            <path className="ear rightEar" d="M577 196c30-8 47 16 40 52-7 32-30 43-51 27Z" />
            <path className="headShape" d="M440 62c76 0 134 48 145 128 8 58-3 118-32 155-27 34-65 53-113 53s-86-19-113-53c-29-37-40-97-32-155C306 110 364 62 440 62Z" />
            <path className="hair" d="M295 196c-6-84 58-134 145-134s151 50 145 134c-18-52-72-80-145-80s-127 28-145 80Z" />
            <path className="hairSheen" d="M348 138c24-18 54-28 88-28" />

            <g className="faceFeatures">
              <ellipse className="cheek" cx="338" cy="298" rx="25" ry="16" />
              <ellipse className="cheek" cx="542" cy="298" rx="25" ry="16" />
              <g className="eyes">
                <g className="eyeAperture eyeApertureLeft">
                  <g className="eyeBlink eyeBlinkLeft">
                    <ellipse className="sclera" cx="382" cy="222" rx="40" ry="31" />
                    <g clipPath="url(#stimulus-eye-left)">
                      <g className="eyeball eyeballLeft">
                        <circle className="iris" cx="382" cy="222" r="19" />
                        <circle className="pupil" cx="382" cy="222" r="10" />
                        <circle className="eyeGlint" cx="389" cy="213" r="5" />
                      </g>
                    </g>
                  </g>
                </g>
                <g className="eyeAperture eyeApertureRight">
                  <g className="eyeBlink eyeBlinkRight">
                    <ellipse className="sclera" cx="498" cy="222" rx="40" ry="31" />
                    <g clipPath="url(#stimulus-eye-right)">
                      <g className="eyeball eyeballRight">
                        <circle className="iris" cx="498" cy="222" r="19" />
                        <circle className="pupil" cx="498" cy="222" r="10" />
                        <circle className="eyeGlint" cx="505" cy="213" r="5" />
                      </g>
                    </g>
                  </g>
                </g>
                <path className="brow browLeft" d="M348 172c14-14 40-18 60-10" />
                <path className="brow browRight" d="M532 172c-14-14-40-18-60-10" />
              </g>
              <ellipse className="nose" cx="440" cy="272" rx="17" ry="12" />
              <path className="mouth" d="M398 312c11 22 71 22 84 0" />
            </g>
          </g>
        </g>
      </svg>

      <div className="stimulusTable" />
      <TargetToy side="left" />
      <TargetToy side="right" />

      <div className="stimulusAttention"><span /><i /><b /></div>
    </div>
  );
}
