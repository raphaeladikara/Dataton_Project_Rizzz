/**
 * Neurogaze illustration set — drawn vector scenes, not stacked CSS boxes.
 *
 * Every figure follows the drawing language of `stimulus-scene.tsx`: closed
 * silhouette paths, a warm skin ramp, a teal shirt ramp, no outlines, and
 * features (eye, brow, mouth) laid over the silhouette. Colour comes from
 * `tokens.css` through classNames so the palette stays tunable from CSS, and
 * geometry lives in a viewBox so the art scales instead of relying on
 * pixel-positioned elements.
 *
 * The two target objects are always identical, on every surface. The RJA
 * paradigm the session implements depends on that: two different-looking toys
 * would make object preference a competing explanation for a left/right look.
 *
 * Gradient ids are namespaced per component because several scenes can be on
 * screen at once.
 */

type GuideVisual = "seated" | "framed" | "no-pointing" | "character" | "pause" | "ready";

function ArtDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-skin`} x1="0.15" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor="#e2ab7a" />
        <stop offset="1" stopColor="#bc7b51" />
      </linearGradient>
      <linearGradient id={`${id}-hair`} x1="0.2" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor="#4d3b34" />
        <stop offset="1" stopColor="#2b201c" />
      </linearGradient>
      <linearGradient id={`${id}-shirt`} x1="0.14" y1="0" x2="0.92" y2="1">
        <stop offset="0" stopColor="#4d97a4" />
        <stop offset="0.52" stopColor="#3c818e" />
        <stop offset="1" stopColor="#295a66" />
      </linearGradient>
      <radialGradient id={`${id}-screen`} cx="0.5" cy="0.36" r="0.75">
        <stop offset="0" stopColor="#1d5f50" />
        <stop offset="1" stopColor="#06201a" />
      </radialGradient>
    </defs>
  );
}

/* ── The target object ─────────────────────────────────────────────────────
   Stacked blocks, matching the toy in the live stimulus scene. Rendered from
   one component so the left and right copies cannot drift apart. */
function TargetBlocks({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g className="artToy" transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect className="artToyStud" x="12" y="30" width="14" height="11" rx="3.5" />
      <rect className="artToyStud" x="34" y="30" width="14" height="11" rx="3.5" />
      <rect className="artToyBlock" x="0" y="38" width="60" height="36" rx="8" />
      <rect className="artToyStud" x="17" y="-8" width="13" height="11" rx="3.5" />
      <rect className="artToyStud" x="36" y="-8" width="13" height="11" rx="3.5" />
      <rect className="artToyBlock" x="6" y="0" width="48" height="34" rx="8" />
    </g>
  );
}

/* ── Child, profile, turned to the tablet ──────────────────────────────────
   A profile states the instruction instead of captioning it: the head is
   turned to the screen, so "screen level with the face" is simply visible. */
function ChildProfile({ id }: { id: string }) {
  return (
    <g className="artChild">
      {/* Neck first — the collar is cut out of the shirt so a real neck shows
          between chin and shoulders rather than a bare rectangle. */}
      <path className="artNeck" d="M404 188h42v52h-42Z" />
      <path className="artNeckShade" d="M404 188h42v18c-14 12-28 12-42 0Z" />

      <path
        className="artSkin"
        fill={`url(#${id}-skin)`}
        d="M426 82c-30 0-50 19-56 44-2 8-4 12-4 18-5 5-14 10-14 16 0 6 8 7 14 8 4 1 6 3 5 7-1 4-2 7 1 10 3 3 1 9 5 12 4 4 9 7 17 9 10 3 18 4 28 4 28 0 52-16 64-40 10-20 10-54-2-70-12-15-34-18-58-18Z"
      />

      <g className="artEar">
        <path className="artEarShape" d="M434 148c13-5 23 3 22 17-1 14-11 22-21 20 4-12 4-25-1-37Z" />
        <path className="artEarLine" d="M441 159c6-1 9 6 6 13" />
      </g>

      {/* The hair sits outside the skull curve; a hair path that tracks the
          silhouette exactly leaves a sliver of scalp along the crown. */}
      <path className="artHair" fill={`url(#${id}-hair)`} d="M366 128c4-30 26-52 60-53 34-1 62 18 68 47 4 21 3 40-2 58-1-25-7-46-21-59-16-15-41-19-62-12-16 5-30 11-43 19Z" />
      <path className="artHairLock" d="M370 122c13-16 30-25 48-27 9-1 18 0 25 3-16 1-31 6-43 15-12 8-22 12-30 9Z" />

      <g className="artFace">
        <ellipse className="artCheek" cx="396" cy="168" rx="14" ry="9" />
        <path className="artBrow" d="M366 131c7-6 18-8 26-4" />
        <g className="artEye">
          <ellipse className="artSclera" cx="382" cy="147" rx="10.5" ry="8.5" />
          <circle className="artIris" cx="377" cy="147" r="5.4" />
          <circle className="artPupil" cx="376" cy="147" r="2.8" />
          <circle className="artGlint" cx="380" cy="143" r="1.7" />
        </g>
        <circle className="artNostril" cx="362" cy="163" r="1.9" />
        <path className="artMouth" d="M366 177c5 5 13 5 18 0" />
      </g>

      <path
        className="artShirt"
        fill={`url(#${id}-shirt)`}
        d="M404 214c-22 6-38 18-48 38-12 25-18 66-20 128h188c-2-62-8-103-20-128-10-20-26-32-48-38-6 15-20 22-26 22s-20-7-26-22Z"
      />
      <path className="artShirtCollar" d="M404 214c6 15 20 22 26 22s20-7 26-22" />

      {/* Near arm: sleeve off the shoulder into a forearm resting forward. A
          torso with no arm reads as a slab. */}
      <path className="artSleeveChild" d="M386 254c-10 18-16 34-19 50" />
      <path className="artForearmChild" d="M366 310c-3 22-3 44 0 66" />
    </g>
  );
}

/* ── Tablet on a stand ─────────────────────────────────────────────────────
   The screen shows the real stimulus layout — one model, two identical
   objects — so the tutorial and the session look like the same product. */
function TabletOnStand({ id, dimmed = false }: { id: string; dimmed?: boolean }) {
  return (
    <g className={`artTablet${dimmed ? " isDimmed" : ""}`}>
      <ellipse className="artGroundShadow" cx="149" cy="322" rx="88" ry="11" />
      <path className="artStand" d="M133 250h32l12 62h-56Z" />
      <rect className="artStandFoot" x="91" y="304" width="116" height="15" rx="7.5" />

      <rect className="artTabletBody" x="20" y="58" width="258" height="202" rx="22" />
      <rect className="artTabletBezel" x="26" y="64" width="246" height="190" rx="17" />
      <rect className="artScreen" x="36" y="74" width="226" height="170" rx="11" fill={`url(#${id}-screen)`} />
      <circle className="artTabletLens" cx="149" cy="68" r="3.4" />

      <g className="artScreenContent">
        <TargetBlocks x={50} y={150} scale={0.72} />
        <TargetBlocks x={204} y={150} scale={0.72} />
        <g className="artScreenFigure">
          <path className="artScreenNeck" d="M141 158h16v22h-16Z" />
          <path className="artScreenSkin" fill={`url(#${id}-skin)`} d="M149 116c18 0 29 11 30 28 1 15-3 26-12 32-5 4-12 6-18 6s-13-2-18-6c-9-6-13-17-12-32 1-17 12-28 30-28Z" />
          <path className="artScreenHair" fill={`url(#${id}-hair)`} d="M119 145c-2-19 12-31 30-31s32 12 30 31c-5-12-15-18-30-18s-25 6-30 18Z" />
          <circle className="artScreenEye" cx="140" cy="145" r="2.7" />
          <circle className="artScreenEye" cx="158" cy="145" r="2.7" />
          <path className="artScreenShirt" fill={`url(#${id}-shirt)`} d="M138 176c-16 4-26 13-30 27-3 11-4 25-4 41h90c0-16-1-30-4-41-4-14-14-23-30-27-3 6-8 10-11 10s-8-4-11-10Z" />
        </g>
      </g>
    </g>
  );
}

/* ── Adult hand, pointing ──────────────────────────────────────────────────
   Fist + index + thumb, so the gesture cannot read as anything else. The
   tutorial only ever shows it struck through. */
function PointingHand() {
  return (
    <g className="artPointer">
      <path className="artSleeveAdult" d="M580 340 478 308" />
      <path className="artForearmAdult" d="M482 310 396 276" />
      {/* Rotated so the index actually lands on the screen: the gesture only
          reads as "pointing at the tablet" if the line of the finger does. */}
      <g transform="translate(362 254) rotate(25)">
        <rect className="artHandPart" x="-26" y="-24" width="54" height="48" rx="21" />
        <rect className="artHandPart" x="-74" y="-19" width="56" height="18" rx="9" />
        <rect className="artHandPart" x="-30" y="-33" width="36" height="16" rx="8" transform="rotate(-12)" />
        <path className="artHandCrease" d="M17 0c-8 4-17 3-23-3M15 14c-8 4-17 3-23-3" />
      </g>
    </g>
  );
}

export function GuideScene({ visual }: { visual: GuideVisual }) {
  const id = "guide";

  return (
    <svg
      className={`guideArt visual-${visual}`}
      viewBox="0 0 560 380"
      preserveAspectRatio="xMidYMid meet"
      role="presentation"
      aria-hidden="true"
    >
      <ArtDefs id={id} />

      <ellipse className="artGroundShadow" cx="440" cy="370" rx="126" ry="14" />
      <TabletOnStand id={id} dimmed={visual === "pause"} />
      <ChildProfile id={id} />

      {/* 01 — eye level and distance, the two things a caregiver gets wrong. */}
      <g className="artLayer artLayerSeated">
        <path className="artSightLine" d="M286 150H344" />
        <g className="artDimension">
          <path d="M290 145l-6 5 6 5M340 145l6 5-6 5" />
          <text className="artLabel" x="315" y="130" textAnchor="middle">40–50 cm</text>
        </g>
      </g>

      {/* 02 — the framing bracket the camera check actually draws. */}
      <g className="artLayer artLayerFramed">
        <rect className="artFaceBox" x="344" y="70" width="166" height="164" rx="32" />
        <path className="artFaceCorner" d="M344 104V98a28 28 0 0 1 28-28h6M482 70h6a28 28 0 0 1 28 28v6M510 200v6a28 28 0 0 1-28 28h-6M378 234h-6a28 28 0 0 1-28-28v-6" />
      </g>

      {/* 03 — pointing, struck through. */}
      <g className="artLayer artLayerNoPointing">
        <PointingHand />
        <g className="artProhibit">
          <circle cx="330" cy="232" r="58" />
          <path d="M289 191l82 82" />
        </g>
      </g>

      {/* 04 — the objects move on their own; the child only watches. */}
      <g className="artLayer artLayerCharacter">
        <path className="artGazeArc" d="M362 146c-42-14-80-2-132 26" />
        <circle className="artGazeDot" cx="230" cy="174" r="6" />
      </g>

      {/* 05 / 06 — session state, shown on the screen the child is facing. */}
      <g className="artLayer artLayerPause">
        <circle className="artBadge artBadgePause" cx="149" cy="159" r="42" />
        <rect className="artPauseBar" x="137" y="142" width="8" height="34" rx="4" />
        <rect className="artPauseBar" x="153" y="142" width="8" height="34" rx="4" />
      </g>

      <g className="artLayer artLayerReady">
        <circle className="artBadge artBadgeReady" cx="149" cy="159" r="42" />
        <path className="artCheck" d="M130 159l13 14 25-28" />
      </g>
    </svg>
  );
}

/* ── Feature card 01 — camera framing ─────────────────────────────────────── */
export function CameraFramingArt() {
  const id = "cam";
  return (
    <svg className="featureArt featureArtCamera" viewBox="0 0 320 240" role="presentation" aria-hidden="true">
      <ArtDefs id={id} />
      <g className="artFrontChild">
        <path className="artNeck" d="M142 152h36v34h-36Z" />
        <path className="artNeckShade" d="M142 152h36v14c-12 9-24 9-36 0Z" />
        <path
          className="artShirt"
          fill={`url(#${id}-shirt)`}
          d="M139 174c-27 6-45 21-54 43-6 15-9 33-10 55h170c-1-22-4-40-10-55-9-22-27-37-54-43-5 13-14 20-21 20s-16-7-21-20Z"
        />
        <path className="artShirtCollar" d="M139 174c5 13 14 20 21 20s16-7 21-20" />
        <path className="artSkin" fill={`url(#${id}-skin)`} d="M107 106c-11-4-19 5-16 19 3 13 11 17 20 11ZM213 106c11-4 19 5 16 19-3 13-11 17-20 11Z" />
        <path
          className="artSkin"
          fill={`url(#${id}-skin)`}
          d="M160 50c31 0 53 19 57 51 3 24-1 48-13 62-11 13-26 21-44 21s-33-8-44-21c-12-14-16-38-13-62 4-32 26-51 57-51Z"
        />
        <path className="artHair" fill={`url(#${id}-hair)`} d="M103 110c-3-36 24-60 57-60s60 24 57 60c-7-23-28-36-57-36s-50 13-57 36Z" />
        <g className="artFace">
          <ellipse className="artCheek" cx="126" cy="142" rx="12" ry="8" />
          <ellipse className="artCheek" cx="194" cy="142" rx="12" ry="8" />
          <path className="artBrow" d="M124 102c6-6 17-8 25-4M196 102c-6-6-17-8-25-4" />
          <g className="artEye">
            <ellipse className="artSclera" cx="137" cy="120" rx="15" ry="12" />
            <circle className="artIris" cx="137" cy="120" r="7.4" />
            <circle className="artPupil" cx="137" cy="120" r="3.9" />
            <circle className="artGlint" cx="140" cy="116" r="2.2" />
          </g>
          <g className="artEye">
            <ellipse className="artSclera" cx="183" cy="120" rx="15" ry="12" />
            <circle className="artIris" cx="183" cy="120" r="7.4" />
            <circle className="artPupil" cx="183" cy="120" r="3.9" />
            <circle className="artGlint" cx="186" cy="116" r="2.2" />
          </g>
          <ellipse className="artNose" cx="160" cy="140" rx="7" ry="5" />
          <path className="artMouth" d="M147 157c7 10 19 10 26 0" />
        </g>
      </g>

      <g className="artViewfinder">
        <rect x="64" y="30" width="192" height="190" rx="42" />
        <path className="artViewfinderCorner" d="M64 72V62a32 32 0 0 1 32-32h10M214 30h10a32 32 0 0 1 32 32v10M256 178v10a32 32 0 0 1-32 32h-10M106 220H96a32 32 0 0 1-32-32v-10" />
      </g>
      <g className="artEyeTick artEyeTickLeft"><circle cx="137" cy="120" r="6" /></g>
      <g className="artEyeTick artEyeTickRight"><circle cx="183" cy="120" r="6" /></g>
    </svg>
  );
}

/* ── Feature card 02 — natural watching ───────────────────────────────────── */
export function NaturalWatchingArt() {
  const id = "watch";
  return (
    <svg className="featureArt featureArtWatch" viewBox="0 0 320 240" role="presentation" aria-hidden="true">
      <ArtDefs id={id} />
      <ellipse className="artGroundShadow" cx="160" cy="230" rx="80" ry="11" />
      <ellipse className="artGroundShadow" cx="46" cy="186" rx="30" ry="6" />
      <ellipse className="artGroundShadow" cx="274" cy="186" rx="30" ry="6" />

      <g className="artToyGroup artToyGroupLeft"><TargetBlocks x={24} y={126} scale={0.72} /></g>
      <g className="artToyGroup artToyGroupRight"><TargetBlocks x={252} y={126} scale={0.72} /></g>

      <g className="artFrontChild">
        <path className="artNeck" d="M147 126h26v26h-26Z" />
        <path className="artNeckShade" d="M147 126h26v11c-9 7-17 7-26 0Z" />
        <path
          className="artShirt"
          fill={`url(#${id}-shirt)`}
          d="M144 144c-21 5-35 17-42 34-5 12-7 26-8 46h132c-1-20-3-34-8-46-7-17-21-29-42-34-4 10-11 16-16 16s-12-6-16-16Z"
        />
        <path className="artShirtCollar" d="M144 144c4 10 11 16 16 16s12-6 16-16" />
        <path className="artSkin" fill={`url(#${id}-skin)`} d="M117 86c-9-3-15 4-13 15 3 10 9 14 16 9ZM203 86c9-3 15 4 13 15-3 10-9 14-16 9Z" />
        <path
          className="artSkin"
          fill={`url(#${id}-skin)`}
          d="M160 40c25 0 43 16 46 42 3 19-1 39-11 51-9 11-21 17-35 17s-26-6-35-17c-10-12-14-32-11-51 3-26 21-42 46-42Z"
        />
        <path className="artHair" fill={`url(#${id}-hair)`} d="M113 89c-3-30 21-49 47-49s50 19 47 49c-6-19-23-30-47-30s-41 11-47 30Z" />
        <g className="artFace">
          <ellipse className="artCheek" cx="133" cy="118" rx="10" ry="6" />
          <ellipse className="artCheek" cx="187" cy="118" rx="10" ry="6" />
          <g className="artEye">
            <ellipse className="artSclera" cx="143" cy="98" rx="12.5" ry="10" />
            <circle className="artIris artIrisTracking" cx="143" cy="98" r="6.2" />
            <circle className="artPupil artPupilTracking" cx="143" cy="98" r="3.3" />
          </g>
          <g className="artEye">
            <ellipse className="artSclera" cx="177" cy="98" rx="12.5" ry="10" />
            <circle className="artIris artIrisTracking" cx="177" cy="98" r="6.2" />
            <circle className="artPupil artPupilTracking" cx="177" cy="98" r="3.3" />
          </g>
          <ellipse className="artNose" cx="160" cy="115" rx="6" ry="4" />
          <path className="artMouth" d="M149 129c6 9 16 9 22 0" />
        </g>
      </g>

      {/* The look travels out to an object on its own — nobody points at it. */}
      <path className="artGazeArc" d="M196 92c24-9 44-1 58 22" />
      <circle className="artGazeDot" cx="257" cy="118" r="5.5" />
    </svg>
  );
}
