/**
 * Calibration character.
 *
 * The copy promises "5 gambar menarik" and the screen used to show a dot — and
 * the dot lost even its small silhouette at the moment it became active, which
 * is exactly when a 24-month-old is supposed to look at it. A face holds a
 * toddler's gaze where a dot does not, so the target is a face: high contrast
 * against the dark board, blinking on its own, and at least 2 degrees wide at a
 * normal tablet distance (72 CSS px at ~50 cm).
 */
export function CalibrationCharacter({ active }: { active: boolean }) {
  return (
    <svg
      className="calibrationCharacter"
      viewBox="0 0 64 64"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      data-active={active ? "true" : "false"}
    >
      <circle cx="32" cy="32" r="30" className="ccFace" />
      <g className="ccEyes">
        <circle cx="22" cy="28" r="6.5" className="ccEyeWhite" />
        <circle cx="42" cy="28" r="6.5" className="ccEyeWhite" />
        <circle cx="22" cy="28.5" r="3.6" className="ccPupil" />
        <circle cx="42" cy="28.5" r="3.6" className="ccPupil" />
        <circle cx="23.4" cy="26.6" r="1.2" className="ccGlint" />
        <circle cx="43.4" cy="26.6" r="1.2" className="ccGlint" />
      </g>
      <path d="M23 42 Q32 50 41 42" className="ccSmile" />
      <circle cx="13" cy="39" r="4" className="ccBlush" />
      <circle cx="51" cy="39" r="4" className="ccBlush" />
    </svg>
  );
}
