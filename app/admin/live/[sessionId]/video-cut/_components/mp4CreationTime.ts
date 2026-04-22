/**
 * Read the creation_time field from an MP4 file's mvhd box.
 * This survives file transfers unlike filesystem timestamps.
 * Returns null if not found or not an MP4.
 */
export async function getMp4CreationTime(file: File): Promise<Date | null> {
  // Read first 128KB — mvhd is always near the start of a valid MP4
  const buffer = await file.slice(0, 131072).arrayBuffer();
  const view = new DataView(buffer);
  const len = buffer.byteLength;

  // Scan for the 4-byte sequence 'm','v','h','d'
  for (let i = 4; i < len - 16; i++) {
    if (
      view.getUint8(i)     === 0x6d && // m
      view.getUint8(i + 1) === 0x76 && // v
      view.getUint8(i + 2) === 0x68 && // h
      view.getUint8(i + 3) === 0x64    // d
    ) {
      // Box layout after the 4-byte type:
      //   1 byte  version
      //   3 bytes flags
      //   then creation_time: 4 bytes (version 0) or 8 bytes (version 1)
      const version = view.getUint8(i + 4);

      let creationTimeSec: number;
      if (version === 1) {
        // 64-bit — JS can't do uint64 exactly, but high word is tiny for dates < 2038
        const hi = view.getUint32(i + 8);
        const lo = view.getUint32(i + 12);
        creationTimeSec = hi * 4294967296 + lo;
      } else {
        creationTimeSec = view.getUint32(i + 8);
      }

      if (creationTimeSec === 0) return null;

      // MP4 epoch = Jan 1 1904; Unix epoch = Jan 1 1970 → offset 2082844800 s
      const unixMs = (creationTimeSec - 2082844800) * 1000;
      const date = new Date(unixMs);

      // Sanity check: must be between 2010 and 2040
      if (date.getFullYear() < 2010 || date.getFullYear() > 2040) return null;
      return date;
    }
  }
  return null;
}