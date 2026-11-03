import {
  FilesetResolver,
  PoseLandmarker,
  HandLandmarker,
  FaceLandmarker,
  type PoseLandmarkerResult,
  type HandLandmarkerResult,
  type FaceLandmarkerResult
} from "@mediapipe/tasks-vision";

export const BODY_INDICES = [0, 11, 12, 13, 14, 15, 16, 23, 24];
export const FACE_INDICES = [1, 33, 133, 159, 145, 362, 263, 386, 374, 70, 63, 105, 66, 336, 296, 334, 293, 300];
export const MOUTH_INDICES = [0, 17, 61, 291, 37, 267, 84, 314];

export const POSE_CONNECTIONS: [number, number][] = [
  [1, 2],
  [1, 3],
  [3, 5],
  [2, 4],
  [4, 6],
  [1, 7],
  [2, 8],
  [7, 8],
  [0, 1],
  [0, 2]
];

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17]
];

export type Keypoint4D = [number, number, number, number];

export interface FrameKeypoints {
  pose: Keypoint4D[];
  face: Keypoint4D[];
  mouth: Keypoint4D[];
  lh: Keypoint4D[];
  rh: Keypoint4D[];
}

export interface ExtractionProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  stage: "loading_models" | "extracting" | "completed";
}

export interface Detectors {
  poseDetector: PoseLandmarker;
  handDetector: HandLandmarker;
  faceDetector: FaceLandmarker;
}

let cachedDetectors: Detectors | null = null;
let globalTimestampTrackerMs = 0;

export async function getDetectors(): Promise<Detectors> {
  if (cachedDetectors) {
    return cachedDetectors;
  }

  let vision;
  try {
    vision = await FilesetResolver.forVisionTasks("/wasm");
  } catch {
    vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
    );
  }

  const createPose = async () => {
    try {
      return await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/pose_landmarker_lite.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1
      });
    } catch {
      try {
        return await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/pose_landmarker_lite.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
      } catch {
        return await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
      }
    }
  };

  const createHand = async () => {
    try {
      return await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
      });
    } catch {
      try {
        return await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/hand_landmarker.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });
      } catch {
        return await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });
      }
    }
  };

  const createFace = async () => {
    try {
      return await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/face_landmarker_v2_with_blendshapes.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false
      });
    } catch {
      try {
        return await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/face_landmarker_v2_with_blendshapes.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false
        });
      } catch {
        return await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false
        });
      }
    }
  };

  const [poseDetector, handDetector, faceDetector] = await Promise.all([
    createPose(),
    createHand(),
    createFace()
  ]);

  cachedDetectors = { poseDetector, handDetector, faceDetector };
  return cachedDetectors;
}

export function extractFrameKeypoints(
  poseResult: PoseLandmarkerResult,
  handResult: HandLandmarkerResult,
  faceResult: FaceLandmarkerResult
): FrameKeypoints {
  let pose: Keypoint4D[] = [];
  if (poseResult.landmarks && poseResult.landmarks.length > 0 && poseResult.landmarks[0].length >= 25) {
    const lms = poseResult.landmarks[0];
    pose = BODY_INDICES.map((idx) => {
      const lm = lms[idx];
      return lm ? [lm.x, lm.y, lm.z, lm.visibility ?? 1.0] : [0, 0, 0, 0];
    });
  }

  let face: Keypoint4D[] = [];
  let mouth: Keypoint4D[] = [];
  if (faceResult.faceLandmarks && faceResult.faceLandmarks.length > 0 && faceResult.faceLandmarks[0].length > 0) {
    const lms = faceResult.faceLandmarks[0];
    face = FACE_INDICES.map((idx) => {
      const lm = lms[idx];
      return lm ? [lm.x, lm.y, lm.z, 1.0] : [0, 0, 0, 0];
    });
    mouth = MOUTH_INDICES.map((idx) => {
      const lm = lms[idx];
      return lm ? [lm.x, lm.y, lm.z, 1.0] : [0, 0, 0, 0];
    });
  }

  let lh: Keypoint4D[] = [];
  let rh: Keypoint4D[] = [];
  if (handResult.landmarks && handResult.landmarks.length > 0) {
    handResult.landmarks.forEach((handLms, idx) => {
      const cat = handResult.handedness?.[idx]?.[0]?.categoryName;
      const coords: Keypoint4D[] = handLms.map((lm) => [lm.x, lm.y, lm.z, 1.0]);
      if (cat === "Left") {
        lh = coords;
      } else if (cat === "Right") {
        rh = coords;
      }
    });
  }

  return { pose, face, mouth, lh, rh };
}

export function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.005) {
      resolve();
      return;
    }
    let resolved = false;
    const onSeeked = () => {
      if (!resolved) {
        resolved = true;
        video.removeEventListener("seeked", onSeeked);
        resolve();
      }
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
    setTimeout(onSeeked, 300);
  });
}

export async function extractVideoKeypoints(
  video: HTMLVideoElement,
  trimStart: number,
  trimEnd: number,
  onProgress: (progress: ExtractionProgress) => void,
  abortSignal?: { aborted: boolean },
  onFrameExtracted?: (frame: FrameKeypoints, frameIdx: number) => void
): Promise<FrameKeypoints[]> {
  onProgress({
    currentFrame: 0,
    totalFrames: 0,
    percentage: 0,
    stage: "loading_models"
  });

  const detectors = await getDetectors();
  const totalFrames = Math.max(1, Math.round((trimEnd - trimStart) * 30));

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1080;
  canvas.height = video.videoHeight || 1080;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const sequenceKeypoints: FrameKeypoints[] = [];

  for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
    if (abortSignal?.aborted) {
      break;
    }

    const targetTime = trimStart + frameIdx / 30;
    await seekVideo(video, targetTime);

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    globalTimestampTrackerMs += 33;
    const timestampMs = globalTimestampTrackerMs;
    const inputSource = ctx ? canvas : video;

    const poseResult = detectors.poseDetector.detectForVideo(inputSource, timestampMs);
    const handResult = detectors.handDetector.detectForVideo(inputSource, timestampMs);
    const faceResult = detectors.faceDetector.detectForVideo(inputSource, timestampMs);

    const frameData = extractFrameKeypoints(poseResult, handResult, faceResult);
    sequenceKeypoints.push(frameData);

    if (onFrameExtracted) {
      onFrameExtracted(frameData, frameIdx);
    }

    onProgress({
      currentFrame: frameIdx + 1,
      totalFrames,
      percentage: Math.round(((frameIdx + 1) / totalFrames) * 100),
      stage: "extracting"
    });

    await new Promise((r) => setTimeout(r, 0));
  }

  onProgress({
    currentFrame: sequenceKeypoints.length,
    totalFrames,
    percentage: 100,
    stage: "completed"
  });

  return sequenceKeypoints;
}

export function drawSkeletonOverlay(
  canvas: HTMLCanvasElement,
  frame: FrameKeypoints | null
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  if (!frame) return;

  if (frame.pose && frame.pose.length === 9) {
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const p1 = frame.pose[startIdx];
      const p2 = frame.pose[endIdx];
      if (p1 && p2 && (p1[3] > 0.1 || p2[3] > 0.1)) {
        ctx.beginPath();
        ctx.moveTo(p1[0] * width, p1[1] * height);
        ctx.lineTo(p2[0] * width, p2[1] * height);
        ctx.stroke();
      }
    });

    frame.pose.forEach((p, idx) => {
      if (p[3] > 0.1) {
        ctx.fillStyle = idx === 0 ? "#f97316" : "#38bdf8";
        ctx.beginPath();
        ctx.arc(p[0] * width, p[1] * height, idx === 0 ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
  }

  if (frame.face && frame.face.length > 0) {
    ctx.fillStyle = "#06b6d4";
    frame.face.forEach((p) => {
      if (p[0] !== 0 || p[1] !== 0) {
        ctx.beginPath();
        ctx.arc(p[0] * width, p[1] * height, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  if (frame.mouth && frame.mouth.length > 0) {
    ctx.fillStyle = "#f43f5e";
    frame.mouth.forEach((p) => {
      if (p[0] !== 0 || p[1] !== 0) {
        ctx.beginPath();
        ctx.arc(p[0] * width, p[1] * height, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  const drawHand = (handPoints: Keypoint4D[], boneColor: string, jointColor: string) => {
    if (!handPoints || handPoints.length !== 21) return;

    ctx.strokeStyle = boneColor;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const p1 = handPoints[startIdx];
      const p2 = handPoints[endIdx];
      if (p1 && p2 && (p1[0] !== 0 || p1[1] !== 0) && (p2[0] !== 0 || p2[1] !== 0)) {
        ctx.beginPath();
        ctx.moveTo(p1[0] * width, p1[1] * height);
        ctx.lineTo(p2[0] * width, p2[1] * height);
        ctx.stroke();
      }
    });

    ctx.fillStyle = jointColor;
    handPoints.forEach((p, idx) => {
      if (p[0] !== 0 || p[1] !== 0) {
        ctx.beginPath();
        ctx.arc(p[0] * width, p[1] * height, idx === 0 ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  drawHand(frame.lh, "#f59e0b", "#fde047");
  drawHand(frame.rh, "#10b981", "#6ee7b7");
}

export function flipKeypointsX(sequence: FrameKeypoints[]): FrameKeypoints[] {
  return sequence.map((frame) => {
    const flipPt = (pt: Keypoint4D): Keypoint4D => {
      if (pt[0] === 0 && pt[1] === 0 && pt[2] === 0 && pt[3] === 0) {
        return [0, 0, 0, 0];
      }
      return [1.0 - pt[0], pt[1], pt[2], pt[3]];
    };

    return {
      pose: frame.pose.map(flipPt),
      face: frame.face.map(flipPt),
      mouth: frame.mouth.map(flipPt),
      lh: frame.lh.map(flipPt),
      rh: frame.rh.map(flipPt)
    };
  });
}

export function normalizeKeypointsSequence(sequence: FrameKeypoints[]): {
  normalized: FrameKeypoints[];
  scale: number;
  center: { x: number; y: number; z: number };
} {
  const shoulderDistances: number[] = [];

  for (const frame of sequence) {
    if (frame.pose && frame.pose.length >= 3) {
      const left = frame.pose[1];
      const right = frame.pose[2];
      if (left && right && left[3] > 0.1 && right[3] > 0.1) {
        const dx = left[0] - right[0];
        const dy = left[1] - right[1];
        const dist = Math.hypot(dx, dy);
        if (dist > 1e-4) {
          shoulderDistances.push(dist);
        }
      }
    }
  }

  let scale = 1.0;
  if (shoulderDistances.length > 0) {
    shoulderDistances.sort((a, b) => a - b);
    const mid = Math.floor(shoulderDistances.length / 2);
    scale = shoulderDistances.length % 2 === 0
      ? (shoulderDistances[mid - 1] + shoulderDistances[mid]) / 2
      : shoulderDistances[mid];
    if (scale < 1e-6) {
      scale = 1.0;
    }
  }

  const centersX: number[] = [];
  const centersY: number[] = [];
  const centersZ: number[] = [];

  for (const frame of sequence) {
    if (frame.pose && frame.pose.length >= 3) {
      const left = frame.pose[1];
      const right = frame.pose[2];
      if (left && right && left[3] > 0.1 && right[3] > 0.1) {
        centersX.push((left[0] + right[0]) / 2);
        centersY.push((left[1] + right[1]) / 2);
        centersZ.push((left[2] + right[2]) / 2);
      }
    }
  }

  const fallbackCenterX = centersX.length > 0 ? centersX.reduce((a, b) => a + b, 0) / centersX.length : 0.5;
  const fallbackCenterY = centersY.length > 0 ? centersY.reduce((a, b) => a + b, 0) / centersY.length : 0.5;
  const fallbackCenterZ = centersZ.length > 0 ? centersZ.reduce((a, b) => a + b, 0) / centersZ.length : 0.0;

  const normalized = sequence.map((frame) => {
    let centerX = fallbackCenterX;
    let centerY = fallbackCenterY;
    let centerZ = fallbackCenterZ;

    if (frame.pose && frame.pose.length >= 3) {
      const left = frame.pose[1];
      const right = frame.pose[2];
      if (left && right && left[3] > 0.1 && right[3] > 0.1) {
        centerX = (left[0] + right[0]) / 2;
        centerY = (left[1] + right[1]) / 2;
        centerZ = (left[2] + right[2]) / 2;
      }
    }

    const normPt = (pt: Keypoint4D): Keypoint4D => {
      if (pt[0] === 0 && pt[1] === 0 && pt[2] === 0 && pt[3] === 0) {
        return [0, 0, 0, 0];
      }
      return [
        (pt[0] - centerX) / scale,
        (pt[1] - centerY) / scale,
        (pt[2] - centerZ) / scale,
        pt[3]
      ];
    };

    return {
      pose: frame.pose.map(normPt),
      face: frame.face.map(normPt),
      mouth: frame.mouth.map(normPt),
      lh: frame.lh.map(normPt),
      rh: frame.rh.map(normPt)
    };
  });

  return {
    normalized,
    scale,
    center: { x: fallbackCenterX, y: fallbackCenterY, z: fallbackCenterZ }
  };
}
