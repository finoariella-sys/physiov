/**
 * Pose calculation and rendering utilities for PhysioV
 * Designed for orthopedic recovery tracking (knee, hip, ankle angles)
 */

export const SKELETON_CONNECTIONS = [
  // Upper body
  [11, 12], // shoulders
  [11, 13], // left shoulder to elbow
  [13, 15], // left elbow to wrist
  [12, 14], // right shoulder to elbow
  [14, 16], // right elbow to wrist

  // Torso
  [11, 23], // left shoulder to hip
  [12, 24], // right shoulder to hip
  [23, 24], // hips

  // Lower body (Key for Knee/Hip rehab)
  [23, 25], // left hip to knee
  [25, 27], // left knee to ankle
  [27, 29], // left ankle to heel
  [27, 31], // left ankle to foot index
  [24, 26], // right hip to knee
  [26, 28], // right knee to ankle
  [28, 30], // right ankle to heel
  [28, 32], // right ankle to foot index
];

/**
 * Calculates 2D interior angle between three keypoints (A -> B -> C) in degrees.
 * Vertex is point B.
 */
export function calculateAngle(a, b, c) {
  if (!a || !b || !c) return 180;

  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }

  return Math.round(angle);
}

/**
 * Maps normalized video coordinates [0, 1] to mirrored canvas container pixels
 * taking object-fit: cover into account.
 */
export function mapLandmarkToCanvas(lm, cw, ch, vw, vh, isMirrored = true) {
  if (!lm || !cw || !ch || !vw || !vh) {
    return { x: 0, y: 0, visibility: 0 };
  }

  // Scale computation for object-fit: cover
  const scale = Math.max(cw / vw, ch / vh);
  const rw = vw * scale; // rendered video width
  const rh = vh * scale; // rendered video height

  // Center offsets
  const offsetX = (cw - rw) / 2;
  const offsetY = (ch - rh) / 2;

  const unmirroredX = offsetX + lm.x * rw;
  const canvasY = offsetY + lm.y * rh;

  // Mirror horizontally if video is scaled with scaleX(-1)
  const canvasX = isMirrored ? cw - unmirroredX : unmirroredX;

  return {
    x: canvasX,
    y: canvasY,
    visibility: lm.visibility ?? 1,
  };
}

/**
 * Draws the high-contrast sage green / mint skeleton on canvas
 */
export function drawSkeleton(ctx, mappedLandmarks, primaryAngle = 151, jointLabel = "KNEE") {
  if (!mappedLandmarks || mappedLandmarks.length === 0) return;

  ctx.save();

  // 1. Draw Bones / Connections
  ctx.strokeStyle = "#4EBA87"; // Sage green / mint
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(78, 186, 135, 0.4)";
  ctx.shadowBlur = 8;

  for (const [startIndex, endIndex] of SKELETON_CONNECTIONS) {
    const p1 = mappedLandmarks[startIndex];
    const p2 = mappedLandmarks[endIndex];

    if (!p1 || !p2) continue;
    if ((p1.visibility ?? 1) < 0.35 || (p2.visibility ?? 1) < 0.35) continue;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // 2. Draw Joints (Titik Sendi)
  for (let i = 11; i < mappedLandmarks.length; i++) {
    const pt = mappedLandmarks[i];
    if (!pt || (pt.visibility ?? 1) < 0.35) continue;

    const isKeyJoint = i === 25 || i === 26 || i === 23 || i === 24; // Knees & Hips

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, isKeyJoint ? 7 : 5, 0, 2 * Math.PI);
    ctx.fillStyle = isKeyJoint ? "rgba(78, 186, 135, 0.4)" : "rgba(255, 255, 255, 0.25)";
    ctx.fill();

    // Core point
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, isKeyJoint ? 5 : 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = isKeyJoint ? "#FFFFFF" : "#4EBA87";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#121E31";
    ctx.stroke();
  }

  // 3. Highlighted Joint Callout (Lutut untuk Squat/Knee Extension, Panggul untuk Hip Abduction/Stretch, Bahu untuk Shoulder Raise)
  let targetJointPt = null;
  if (jointLabel === "HIP") {
    targetJointPt = mappedLandmarks[24] || mappedLandmarks[23];
  } else if (jointLabel === "SHOULDER") {
    targetJointPt = mappedLandmarks[12] || mappedLandmarks[11];
  } else {
    // Default KNEE
    targetJointPt = mappedLandmarks[26] || mappedLandmarks[25];
  }

  if (targetJointPt && (targetJointPt.visibility ?? 1) > 0.4) {
    // Pulsing accent ring
    ctx.beginPath();
    ctx.arc(targetJointPt.x, targetJointPt.y, 11, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(78, 186, 135, 0.35)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(targetJointPt.x, targetJointPt.y, 7, 0, 2 * Math.PI);
    ctx.fillStyle = "#4EBA87";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();

    // Callout Tag Badge
    const tagX = targetJointPt.x + 22;
    const tagY = targetJointPt.y - 12;
    const text = `${primaryAngle}°`;

    ctx.font = "bold 13px -apple-system, sans-serif";
    const textMetrics = ctx.measureText(text);
    const boxW = textMetrics.width + 16;
    const boxH = 24;

    // Badge background
    ctx.fillStyle = "rgba(18, 30, 49, 0.85)";
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, boxW, boxH, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Badge text
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, tagX + 8, tagY + 16);
  }

  ctx.restore();
}
