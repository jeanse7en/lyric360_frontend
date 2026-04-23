const MP4_EPOCH_OFFSET_S = 2082844800; // seconds between Jan 1 1904 and Jan 1 1970
const SCAN_SIZE = 524288; // 512KB — enough for moov at either end

/**
 * Returns the video recording START time from an MP4 file's mvhd box.
 * Cameras that write moov at the end store creation_time as the END time,
 * so we compute: start = creation_time − duration.
 * Searches both the first and last 512KB to handle both moov-first and moov-last files.
 */
export async function getMp4StartTime(file: File): Promise<Date | null> {
  const chunks: ArrayBuffer[] = [];

  // Always read the start
  chunks.push(await file.slice(0, SCAN_SIZE).arrayBuffer());

  // Also read the end if file is large enough that moov might be there
  if (file.size > SCAN_SIZE * 2) {
    chunks.push(await file.slice(file.size - SCAN_SIZE).arrayBuffer());
  }

  for (const buffer of chunks) {
    const result = parseMvhd(buffer);
    if (result) return result;
  }
  return null;
}

function parseMvhd(buffer: ArrayBuffer): Date | null {
  const view = new DataView(buffer);
  const len = buffer.byteLength;
  const target = [0x6d, 0x76, 0x68, 0x64]; // 'mvhd'

  for (let i = 0; i < len - 32; i++) {
    if (
      view.getUint8(i)     !== target[0] ||
      view.getUint8(i + 1) !== target[1] ||
      view.getUint8(i + 2) !== target[2] ||
      view.getUint8(i + 3) !== target[3]
    ) continue;

    const base = i + 4; // skip 'mvhd'
    const version = view.getUint8(base);

    let creationTimeSec: number;
    let durationUnits: number;
    let timescale: number;

    if (version === 1) {
      const hiC = view.getUint32(base + 4);
      const loC = view.getUint32(base + 8);
      creationTimeSec = hiC * 4294967296 + loC;
      timescale = view.getUint32(base + 20);
      const hiD = view.getUint32(base + 24);
      const loD = view.getUint32(base + 28);
      durationUnits = hiD * 4294967296 + loD;
    } else {
      creationTimeSec = view.getUint32(base + 4);
      timescale = view.getUint32(base + 12);
      durationUnits = view.getUint32(base + 16);
    }

    if (creationTimeSec === 0 || timescale === 0) return null;

    const durationSec = durationUnits / timescale;
    // creation_time is end time on cameras that write moov last; subtract duration to get start
    const startUnixMs = (creationTimeSec - MP4_EPOCH_OFFSET_S - durationSec) * 1000;
    const date = new Date(startUnixMs);

    if (date.getFullYear() < 2010 || date.getFullYear() > 2040) return null;
    return date;
  }
  return null;
}