export type AudioMetrics = {
  durationSec: number;
  sampleRate: number;
  channels: number;
  peakDb: number;
  rmsDb: number;
  clippingPercent: number;
  crestFactor: number;
};

export type AudioFixResult = {
  input: AudioMetrics;
  output: AudioMetrics;
  diagnostics: string[];
  coachingPrompt: string;
  processedBlob: Blob;
  processedFileName: string;
};

const TARGET_PEAK_DB = -1;
const MAX_OFFLINE_SAMPLES = 8 * 60 * 48_000;

function linearToDb(value: number) {
  if (value <= 0) return -120;
  return 20 * Math.log10(value);
}

function dbToLinear(db: number) {
  return 10 ** (db / 20);
}

function sanitizeFileName(name: string) {
  const dotIndex = name.lastIndexOf('.');
  const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  return `${base}-fixed.wav`;
}

function analyzeBuffer(buffer: AudioBuffer): AudioMetrics {
  const channels = buffer.numberOfChannels;
  const totalFrames = buffer.length;
  const sampleRate = buffer.sampleRate;
  const durationSec = buffer.duration;
  const stride = Math.max(1, Math.floor(totalFrames / 500_000));

  let peak = 0;
  let sumSquares = 0;
  let inspected = 0;
  let clipped = 0;

  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel);

    for (let i = 0; i < data.length; i += stride) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
      if (abs >= 0.99) clipped += 1;
      sumSquares += abs * abs;
      inspected += 1;
    }
  }

  const rms = inspected > 0 ? Math.sqrt(sumSquares / inspected) : 0;
  const crestFactor = rms > 0 ? peak / rms : 1;

  return {
    durationSec,
    sampleRate,
    channels,
    peakDb: linearToDb(peak),
    rmsDb: linearToDb(rms),
    clippingPercent: inspected > 0 ? (clipped / inspected) * 100 : 0,
    crestFactor,
  };
}

function normalizePeak(buffer: AudioBuffer, targetPeakLinear: number) {
  let peak = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
  }

  if (peak <= 0) {
    return { gain: 1, peakBefore: peak };
  }

  const gain = targetPeakLinear / peak;
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) {
      data[i] *= gain;
    }
  }

  return { gain, peakBefore: peak };
}

function interleaveChannels(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;

  if (channels === 1) {
    return buffer.getChannelData(0);
  }

  const interleaved = new Float32Array(length * channels);
  const channelData = Array.from({ length: channels }, (_, idx) => buffer.getChannelData(idx));

  let offset = 0;
  for (let i = 0; i < length; i += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      interleaved[offset] = channelData[channel][i];
      offset += 1;
    }
  }

  return interleaved;
}

function writeWavHeader(view: DataView, sampleRate: number, channels: number, frames: number) {
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = frames * blockAlign;

  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);
}

function audioBufferToWav(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels;
  const frames = buffer.length;
  const sampleRate = buffer.sampleRate;
  const interleaved = interleaveChannels(buffer);

  const bytesPerSample = 2;
  const dataSize = interleaved.length * bytesPerSample;
  const output = new ArrayBuffer(44 + dataSize);
  const view = new DataView(output);

  writeWavHeader(view, sampleRate, channels, frames);

  let offset = 44;
  for (let i = 0; i < interleaved.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, interleaved[i]));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  return output;
}

function buildDiagnostics(input: AudioMetrics, output: AudioMetrics) {
  const diagnostics: string[] = [];

  if (input.clippingPercent >= 0.2) {
    diagnostics.push('Clipping их байна. Limiter хийхээс өмнө mix-bus/input gain-ээ бууруул.');
  } else if (input.clippingPercent >= 0.02) {
    diagnostics.push('Бага зэрэг clipping байна. Limiter threshold эсвэл clipper drive-аа зөөллөөрэй.');
  }

  if (input.rmsDb < -23) {
    diagnostics.push('Track ерөнхийдөө сул байна. Final limiting-ээс өмнө gain staging-ээ сайжруул.');
  } else if (input.rmsDb > -8) {
    diagnostics.push('Track хэт нягт/чанга байна. Dynamics сэргээхийн тулд compression-ээ зөөллөөрэй.');
  }

  if (input.crestFactor > 12) {
    diagnostics.push('Transient ба body-ийн зай их байна. Илүү зөөлөн bus compression ашиглаж cohesion нэм.');
  } else if (input.crestFactor < 4) {
    diagnostics.push('Crest factor маш бага байна. Mix хэт compressed байж магадгүй.');
  }

  if (input.peakDb > -0.5) {
    diagnostics.push('Peak 0 dBFS-д хэт ойр байна. True peak-ээ -1 dBFS орчимд барь.');
  }

  diagnostics.push(
    `Auto-fix хийсэн: high-pass cleanup, mud control EQ, gentle high-shelf, compressor, peak normalization ${TARGET_PEAK_DB} dBFS хүртэл.`,
  );
  diagnostics.push(
    `Үр дүнгийн level: peak ${output.peakDb.toFixed(1)} dBFS, RMS ${output.rmsDb.toFixed(1)} dBFS.`,
  );

  return diagnostics;
}

function buildCoachingPrompt(fileName: string, input: AudioMetrics, output: AudioMetrics, diagnostics: string[]) {
  return [
    `Энэ mix/master-аа сайжруулахад зөвлөгөө өгнө үү. Би "${fileName}" файлыг upload хийсэн.`,
    'FL Studio дээр хэрэгжүүлэхэд амар, продюсер маягийн товч зөвлөгөө өг.',
    '',
    'Техникийн scan:',
    `- Урт: ${input.durationSec.toFixed(1)}s, Channels: ${input.channels}, Sample rate: ${input.sampleRate} Hz`,
    `- Засахаас өмнө: peak ${input.peakDb.toFixed(1)} dBFS, RMS ${input.rmsDb.toFixed(1)} dBFS, clipping ${input.clippingPercent.toFixed(3)}%, crest factor ${input.crestFactor.toFixed(2)}`,
    `- Зассаны дараа: peak ${output.peakDb.toFixed(1)} dBFS, RMS ${output.rmsDb.toFixed(1)} dBFS`,
    '',
    'Илэрсэн асуудал:',
    ...diagnostics.map((item) => `- ${item}`),
    '',
    'Хариулт:',
    '1) 3-5 өгүүлбэртэй оношлол',
    '2) plugin/menu нэртэй яг 3 тодорхой FL Studio action',
    '3) нэг богино A/B сонсох checklist',
  ].join('\n');
}

export async function processAudioForCoaching(file: File): Promise<AudioFixResult> {
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Browser Web Audio API дэмжихгүй байна.');
  }

  const inputBuffer = await file.arrayBuffer();
  const decoderContext = new AudioContextClass();
  const decoded = await decoderContext.decodeAudioData(inputBuffer.slice(0));
  await decoderContext.close();

  if (decoded.length > MAX_OFFLINE_SAMPLES) {
    throw new Error('Аудио browser дээр боловсруулахад хэт урт байна. 8 минутаас богино аудио ашиглана уу.');
  }

  const inputMetrics = analyzeBuffer(decoded);
  const offline = new OfflineAudioContext(decoded.numberOfChannels, decoded.length, decoded.sampleRate);

  const source = offline.createBufferSource();
  source.buffer = decoded;

  const highPass = offline.createBiquadFilter();
  highPass.type = 'highpass';
  highPass.frequency.value = 30;
  highPass.Q.value = 0.707;

  const mudCut = offline.createBiquadFilter();
  mudCut.type = 'peaking';
  mudCut.frequency.value = 280;
  mudCut.Q.value = 1.1;
  mudCut.gain.value = -2.2;

  const airShelf = offline.createBiquadFilter();
  airShelf.type = 'highshelf';
  airShelf.frequency.value = 8500;
  airShelf.gain.value = 1.5;

  const compressor = offline.createDynamicsCompressor();
  compressor.threshold.value = -22;
  compressor.knee.value = 14;
  compressor.ratio.value = 2.2;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.24;

  source.connect(highPass);
  highPass.connect(mudCut);
  mudCut.connect(airShelf);
  airShelf.connect(compressor);
  compressor.connect(offline.destination);
  source.start(0);

  const rendered = await offline.startRendering();
  normalizePeak(rendered, dbToLinear(TARGET_PEAK_DB));
  const outputMetrics = analyzeBuffer(rendered);
  const diagnostics = buildDiagnostics(inputMetrics, outputMetrics);
  const coachingPrompt = buildCoachingPrompt(file.name, inputMetrics, outputMetrics, diagnostics);

  const wavBuffer = audioBufferToWav(rendered);
  const processedBlob = new Blob([wavBuffer], { type: 'audio/wav' });

  return {
    input: inputMetrics,
    output: outputMetrics,
    diagnostics,
    coachingPrompt,
    processedBlob,
    processedFileName: sanitizeFileName(file.name),
  };
}
