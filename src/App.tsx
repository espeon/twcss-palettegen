import { useState, useEffect } from 'react';
import { oklch, formatRgb, formatHex, wcagContrast, serializeHex, parseHex, convertOklabToRgb } from 'culori';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AtSign, ClipboardCopyIcon, Dot, Headphones, Heart, HeartIcon, Music2, Share } from 'lucide-react';

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

console.info(
  '%c hello 👋 from nashville %c',
  'font-family: Figtree, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", Segoe UI Symbol, "Noto Color Emoji"; background-color: rgb(0, 9, 26); color: white; font-size: 2em;', 'color: unset'
);

console.info(
  '%c  (please hire me)%c',
  'color: rgb(91, 201, 222)', 'color: unset'
);

async function getColorName(hex) {
  try {
    if (hex.replace('#', '').length % 3 != 0 && hex.replace('#', '').length !== 8)
      return "Invalid color"
    if (hex.replace('#', '').length == 8)
      hex = hex.slice(0, -2);
    const response = await fetch(
      `https://api.color.pizza/v1/${hex.replace('#', '')}`
    );
    const data = await response.json();
    return data.colors[0].name;
  } catch (error) {
    console.error('Error fetching color name:', error);
    return null;
  }
}

function generatePalette(baseColor) {
  let base;
  try {
    base = oklch(baseColor);
    if (base.h === undefined) {
      base.h = 0
    }
  } catch (error) {
    console.error("Error converting base color:", error);
    return null;
  }

  if (!base) return null;

  const palette = {};

  SHADES.forEach((shade) => {
    let color;
    if (shade < 500) {
      color = oklch({
        l: base.l + (1 - base.l) * ((500 - shade) / 500),
        c: base.c * (shade / 400),
        h: base.h,
      });
    } else if (shade > 500) {
      color = oklch({
        l: base.l * ((1000 - shade) / 440) * .89,
        c: base.c + (0 - base.c) * (shade / 750) * .2,
        h: base.h,
      });
    } else {
      color = base;
    }
    palette[shade] = color;
  });
  return palette;
}

function generateTailwindJSON(palette, colorName = 'color') {
  const rgbColors = {};
  const oklchColors = {};
  Object.entries(palette).forEach(([shade, color]) => {

    if (color.h === undefined) {
      color.h = 69
    }
    rgbColors[shade] = formatHex(color);
    oklchColors[shade] = `oklch(${color.l.toFixed(3)} ${color.c.toFixed(
      3
    )} ${color.h.toFixed(3)})`;
  });
  let rgb = {};
  rgb[escapeUmlaut(colorName.toLowerCase().replace(/ /g, '-').replace(/’/g, ''))] = rgbColors;
  let oklch = {};
  oklch[escapeUmlaut(colorName.toLowerCase().replace(/ /g, '-').replace(/’/g, ''))] =
    oklchColors;
  return {
    name: colorName,
    base: palette[500],
    rgb: JSON.stringify(rgb, null, 2),
    oklch: JSON.stringify(oklch, null, 2),
  };
}

const genRanHex = (size) =>
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');

function clampLuminance(hexColor, minLuminance = 0.3, maxLuminance = 0.8) {
  // Convert hex color to OKLCH
  const colore = parseHex(hexColor)
  const colorOKLCH = oklch(colore)

  // Clamp the luminance value
  const clampedLuminance = Math.max(minLuminance, Math.min(maxLuminance, colorOKLCH.l));

  // Construct new OKLCH color with clamped luminance
  const clampedColorOKLCH = oklch({
    l: clampedLuminance,
    c: colorOKLCH.c,
    h: colorOKLCH.h ?? 0,
    mode: 'oklch'
  });

  // Convert clamped OKLCH color back to hex
  return formatHex(clampedColorOKLCH);
}

export default function Component() {
  const searchParams = new URLSearchParams(document.location.search);
  const currentPath = document.location.origin + document.location.pathname
  const [inputColor, setInputColor] = useState(searchParams.get('hex') ?? '#' + genRanHex(6));
  const [palette, setPalette] = useState(null);
  const [tailwindJSON, setTailwindJSON] = useState({
    name: '',
    base: { mode: 'oklch', l: 0.6991092307279034, c: 0.16593864178819528, h: 56.58153717382657 },
    rgb: '',
    oklch: '',
  });
  const [shareUrlIsGreen, setShareUrlIsGreen] = useState(false)
  const [rgbGreen, setRgbGreen] = useState(false)
  const [oklchGreen, setOklchGreen] = useState(false)
  const { toast } = useToast();

  useEffect(() => {
    // wait 2.5 seconds and change back to false
    setTimeout(() => { setShareUrlIsGreen(false); setRgbGreen(false); setOklchGreen(false) }, 1000 * 1.5)
  }, [shareUrlIsGreen, rgbGreen, oklchGreen]);

  useEffect(() => {
    async function updatePalette() {
      const newPalette = generatePalette(inputColor);
      setPalette(newPalette);
      if (newPalette) {
        const colorName = await getColorName(inputColor);
        setTailwindJSON(generateTailwindJSON(newPalette, colorName));
      }
    }
    updatePalette();
  }, [inputColor]);

  const copyToClipboard = (text) => {

    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied!',
        description: `${text} has been copied to clipboard.`,
        duration: 2000,
      });
    });
  };

  return (
    <div className="min-h-screen max-w-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-screen-xl mx-auto space-y-6">
        <span className="text-3xl">twpal</span>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0">
          <div className="flex-grow flex items-center justify-center">
            {!inputColor.startsWith('#') && <div className="pr-0.5 pl-1">#</div>}
            <Input
              type="text"
              value={inputColor}
              onChange={(e) => setInputColor(e.target.value)}
              placeholder="Enter color (e.g., #3b82f6)"
              className={`flex-grow rounded-xl dark:text-black ${!inputColor.startsWith('#') && "pl-1"}`}
            />
          </div>
          <div className="flex space-x-4">
            <Button
              variant="secondary"
              onClick={() => setInputColor(clampLuminance(genRanHex(6)))}
              className="md:ml-5 rounded-xl px-6 flex-grow"
            >
              Random
            </Button>
            <Button
              className={`rounded-xl aspect-square p-0 bg-blue-300 ${shareUrlIsGreen && 'bg-green-500 hover:bg-green-300'}`}
              // TODO: use an actual JS 'URL' for this
              onClick={() => { copyToClipboard(currentPath + "?hex=" + inputColor.replace("#", "")); setShareUrlIsGreen(true) }}
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {palette ? (
          <>
            <div className="w-full h-[50rem] lg:h-[25vh] rounded-lg overflow-clip shadow-lg">
              <div className="flex h-full flex-col lg:flex-row">
                {Object.entries(palette).map(([shade, color]) => (
                  <div
                    key={shade}
                    className="flex-1 relative group transition-all duration-300 ease-in-out hover:flex-[2] items-center justify-center first:rounded-t-xl last:rounded-b-xl lg:first:rounded-l-xl lg:first:rounded-tr-none lg:last:rounded-r-xl lg:last:rounded-bl-none"
                    style={{ backgroundColor: formatRgb(color) }}
                  >
                    <button
                      className={`absolute inset-0 min-w-max w-full h-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-0 ${wcagContrast('white', color) < 4.5
                          ? 'text-black'
                          : 'text-white'
                        } text-xs sm:text-sm lg:text-xs xl:text-sm`}
                    >
                      <span className="font-bold mb-1">{shade}</span>
                      <span className={`mb-1 text-center transition-all duration-300 ease-in-out px-2 hover:font-bold ${wcagContrast('white', color) < 4.5
                          ? 'text-black hover:text-purple-600'
                          : 'text-white hover:text-blue-300'
                        }`} onClick={() => copyToClipboard(`oklch(${tailwindJSON.base.l.toFixed(2)} ${tailwindJSON.base.c.toFixed(2)} ${tailwindJSON.base.h.toFixed(2)})`)}>
                        OKLCH: {color.l.toFixed(2)}, {color.c.toFixed(2)},{' '}
                        {color.h.toFixed(2)}
                      </span>
                      <span className={`mb-1 text-center transition-all duration-300 ease-in-out px-2 hover:font-bold ${wcagContrast('white', color) < 4.5
                          ? 'text-black hover:text-purple-600'
                          : 'text-white hover:text-blue-300'
                        }`} onClick={() => copyToClipboard(formatRgb(color))} >RGB: {formatRgb(color)}</span>
                      <span className={`mb-1 text-center transition-all duration-300 ease-in-out px-2 hover:font-bold ${wcagContrast('white', color) < 4.5
                          ? 'text-black hover:text-purple-600'
                          : 'text-white hover:text-blue-300'
                        }`} onClick={() => copyToClipboard(formatHex(color))}> {formatHex(color)} </span>
                      <ClipboardCopyIcon className={`w-4 h-4 mb-1 text-center transition-all duration-300 ease-in-out hover:scale-110 ${wcagContrast('white', color) < 4.5
                          ? 'text-black hover:text-purple-600'
                          : 'text-white hover:text-blue-300'
                        }`} onClick={() => copyToClipboard(formatRgb(color))}  />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded-xl shadow-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">TailwindCSS JSON</h3>
                <div className="text-sm" style={{ color: `oklch(${tailwindJSON.base.l.toFixed(2)} ${tailwindJSON.base.c.toFixed(2)} ${tailwindJSON.base.h.toFixed(2)})` }}>
                  <a href={`https://github.com/meodai/color-names`} target="_blank" rel="noopener noreferrer" className="text-blue-400">Color name: </a>
                  {tailwindJSON.name || 'Loading...'}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 rounded-3xl">
                <div>
                  <h4 className="text-md font-semibold mb-2">RGB (Hex)</h4>
                  <div className="relative">
                    <pre className="border p-4 rounded-xl overflow-x-auto text-sm h-[340px] overflow-y-auto">
                      {tailwindJSON.rgb}
                    </pre>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`absolute top-2 right-2 rounded-[0.50rem] ${rgbGreen && "bg-green-500 hover:bg-green-300"}`}
                      onClick={() => { copyToClipboard(tailwindJSON.rgb); setRgbGreen(true) }}
                    >
                      <ClipboardCopyIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-semibold mb-2">OKLCH</h4>
                  <div className="relative">
                    <pre className="border p-4 rounded-xl overflow-x-auto text-sm h-[340px] overflow-y-auto">
                      {tailwindJSON.oklch}
                    </pre>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`absolute top-2 right-2 rounded-[0.50rem] ${oklchGreen && "bg-green-500 hover:bg-green-300"}`}
                      onClick={() => { copyToClipboard(tailwindJSON.oklch); setOklchGreen(true) }}
                    >
                      <ClipboardCopyIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-[30vh] sm:h-[20vh] md:h-[25vh]" />
        )}
        <div>made with <HeartIcon className="inline text-red-500 h-5 mb-0.5" /> and <a href="https://last.fm/user/kanb"><Music2 className="inline text-slate-500 h-5 mb-0.5" /></a> by nat <AtSign className='inline h-5 mb-0.5 text-blue-500' /> <a className="text-blue-300" href="https://natalie.sh?ref=twpal">natalie.sh</a></div>
      </div>
    </div>
  );
}

// Taken from https://github.com/tjaska/umlaut-escape/blob/master/src/index.ts

function escapeUmlaut(input: string) {
  return input
    .split("")
    .map((character) => specialCharMap[character] || character)
    .join("");
}

const specialCharMap: Record<string, string> = {
  Ÿ: "Y",
  ÿ: "y",
  Ü: "U",
  ü: "u",
  Ö: "O",
  ö: "o",
  Ï: "I",
  ï: "i",
  Ë: "E",
  ë: "e",
  Ä: "A",
  ä: "a",
  À: "A",
  Á: "A",
  Â: "A",
  Ã: "A",
  Å: "A",
  Æ: "AE",
  Ç: "C",
  È: "E",
  É: "E",
  Ê: "E",
  Ì: "I",
  Í: "I",
  Î: "I",
  Ð: "D",
  Ñ: "N",
  Ò: "O",
  Ó: "O",
  Ô: "O",
  Õ: "O",
  Ø: "O",
  Œ: "OE",
  Ù: "U",
  Ú: "U",
  Û: "U",
  Ý: "Y",
  Þ: "TH",
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  å: "a",
  æ: "ae",
  ç: "c",
  è: "e",
  é: "e",
  ê: "e",
  ì: "i",
  í: "i",
  ð: "d",
  ñ: "n",
  ò: "o",
  ó: "o",
  ô: "o",
  õ: "o",
  ø: "o",
  œ: "oe",
  ù: "u",
  ú: "u",
  û: "u",
  ý: "y",
  þ: "th",
  Š: "S",
  š: "s",
  Č: "C",
  č: "c",
};
