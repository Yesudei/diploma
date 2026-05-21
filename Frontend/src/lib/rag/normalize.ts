const expansionRules: Array<[RegExp, string]> = [
  [/\b(kik|kick)(\s+(ee|aa|iin|ni|n))?\b/i, 'kick кик цохилт'],
  [/\bsnare(\s+(aa|ee|iin|ni|n))?\b/i, 'snare clap снэйр цохилт'],
  [/\bclap\b/i, 'clap snare алга ташилт цохилт'],
  [/\bduugaar\s+n\s+tom\s+bolgoh\b/i, 'дуу томруулах чангаруулах presence'],
  [/\btom\s+bolgoh\b/i, 'дуу томруулах чангаруулах presence'],
  [/\bchangar(uulah|ah)?\b/i, 'чангаруулах volume gain presence'],
  [/\b808\b.*\b(murulduud|murulduh|dawhtsah|davhtsah)\b/i, '808 bass kick sidechain low frequency'],
  [/\b(murulduud|murulduh|dawhtsah|davhtsah)\b/i, 'давхцах frequency masking sidechain'],
  [/\bbpm\s+(yu|yuu)\s+ve\b/i, 'bpm tempo хурд'],
  [/\btempo\b/i, 'bpm tempo хурд'],
  [/\b(aylal|ayalguu|melody)\b/i, 'melody аялгуу'],
  [/\bduu\b/i, 'дуу audio sound'],
  [/\beq\b/i, 'eq equalizer давтамж'],
  [/\bcompress(or|ion)?\b/i, 'compression compressor динамик'],
  [/\breverb\b/i, 'reverb цуурай орон зай'],
  [/\bdelay\b/i, 'delay echo давталт'],
  [/\bhat|hihat|hi-hat\b/i, 'hi-hat хэмнэл'],
  [/\bchord\b/i, 'chord аккорд'],
  [/\bscale\b/i, 'scale хөг эгшиг'],
  [/\bexport\b/i, 'export render wav mp3'],
];

export function normalizeMongolianQuery(text: string) {
  const base = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const expansions = expansionRules
    .filter(([pattern]) => pattern.test(base))
    .map(([, keywords]) => keywords);

  return [...new Set([base, ...expansions])].join(' ').replace(/\s+/g, ' ').trim();
}
