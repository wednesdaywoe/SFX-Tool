// 16-bit PCM mono WAV serializer. Standard RIFF/WAVE layout:
//   RIFF<filesize-8>WAVE
//   fmt <chunksize=16><PCM=1><channels=1><sampleRate><byteRate><blockAlign=2><bps=16>
//   data<chunksize><samples...>
//
// Float samples are clipped to [-1, 1] then mapped to int16 range.
export function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1
  const bitsPerSample = 16
  const sampleRate = buffer.sampleRate
  const samples = buffer.getChannelData(0)
  const dataBytes = samples.length * (bitsPerSample / 8)
  const headerBytes = 44

  const out = new ArrayBuffer(headerBytes + dataBytes)
  const view = new DataView(out)
  let p = 0

  const writeStr = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(p++, s.charCodeAt(i))
  }
  const writeU32 = (v: number) => {
    view.setUint32(p, v, true)
    p += 4
  }
  const writeU16 = (v: number) => {
    view.setUint16(p, v, true)
    p += 2
  }

  // RIFF header
  writeStr('RIFF')
  writeU32(36 + dataBytes)
  writeStr('WAVE')

  // fmt chunk
  writeStr('fmt ')
  writeU32(16) // PCM chunk size
  writeU16(1) // PCM format
  writeU16(numChannels)
  writeU32(sampleRate)
  writeU32(sampleRate * numChannels * (bitsPerSample / 8)) // byte rate
  writeU16(numChannels * (bitsPerSample / 8)) // block align
  writeU16(bitsPerSample)

  // data chunk
  writeStr('data')
  writeU32(dataBytes)

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    // map [-1, 1] → [-32768, 32767]; positive vs negative scaled to keep symmetry
    const int16 = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff)
    view.setInt16(p, int16, true)
    p += 2
  }

  return out
}

export function downloadBlob(data: BlobPart, filename: string, mime: string) {
  const blob = new Blob([data], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Defer revoke to next tick so the browser has a chance to use the URL.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
