/**
 * SVG Window Diagram — renders a schematic of curtain windows with measurement labels.
 * Used in both the live preview (Step 2) and the PDF (Step 3).
 */
import { WindowEntry } from "@/context/AppContext";
import { confeccionLabel } from "@/lib/calculations";

interface Props {
  windows: WindowEntry[];
}

/**
 * Renders up to 12 diagrams in a 3-column grid as SVG elements
 */
export function WindowDiagramGrid({ windows }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {windows.map((w) => (
        <WindowDiagram key={w.id} entry={w} />
      ))}
    </div>
  );
}

export function WindowDiagram({ entry }: { entry: WindowEntry }) {
  const { config: cfg, result } = entry;
  const W = 200; // SVG rectangle width
  const H = 140; // SVG rectangle height
  const PADDING = 40;
  const LABEL_H = 28;
  const BELOW_H = result.rotation?.hayQueGirar ? 28 : 0;

  const totalH = LABEL_H + PADDING + H + PADDING + BELOW_H;
  const totalW = W + PADDING * 2;

  const numHojas = cfg.numHojas;

  // Confección label per leaf
  function leafLabel(idx: number) {
    const hoja = result.hojas[idx];
    if (!hoja) return "";
    if (cfg.tipoConfeccion === 'wave60' && hoja.ganchos !== undefined) {
      return `${hoja.ganchos}G / ${Math.round(hoja.telaCm)}cm`;
    }
    if ((cfg.tipoConfeccion === 'frunce_simple' || cfg.tipoConfeccion === 'frunce_doble' || cfg.tipoConfeccion === 'frunce_triple')
      && hoja.espacios !== undefined) {
      return `E:${hoja.espacios} C:${hoja.crestas}`;
    }
    return `${Math.round(hoja.telaCm)}cm`;
  }

  function leafBottom(idx: number) {
    const hoja = result.hojas[idx];
    if (!hoja) return "";
    return `${Math.round(hoja.telaCm)} cm`;
  }

  const svgWidth = totalW;
  const svgHeight = totalH;

  const rectX = PADDING;
  const rectY = LABEL_H + PADDING / 2;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="text-foreground"
        style={{ maxWidth: "100%" }}
      >
        {/* Reference label */}
        <text
          x={totalW / 2}
          y={16}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fontFamily="Satoshi, sans-serif"
          fill="currentColor"
        >
          {cfg.referencia || "Sin referencia"}
        </text>

        {/* Width label above rect */}
        <text
          x={rectX + W / 2}
          y={rectY - 6}
          textAnchor="middle"
          fontSize="9"
          fill="currentColor"
          opacity="0.7"
        >
          {cfg.anchoCm} cm
        </text>

        {/* Height label right of rect */}
        <text
          x={rectX + W + 14}
          y={rectY + H / 2 + 4}
          textAnchor="start"
          fontSize="9"
          fill="currentColor"
          opacity="0.7"
          transform={`rotate(-90, ${rectX + W + 18}, ${rectY + H / 2})`}
        >
          {cfg.altoCm} cm
        </text>

        {/* Main rectangle */}
        <rect
          x={rectX}
          y={rectY}
          width={W}
          height={H}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Vertical divider for 2 leaves */}
        {numHojas === 2 && (
          <line
            x1={rectX + W / 2}
            y1={rectY + 8}
            x2={rectX + W / 2}
            y2={rectY + H - 8}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.5"
          />
        )}

        {/* Leaf info — top */}
        {numHojas === 1 ? (
          <text
            x={rectX + W / 2}
            y={rectY + 22}
            textAnchor="middle"
            fontSize="9"
            fontFamily="Satoshi, sans-serif"
            fill="currentColor"
            opacity="0.85"
          >
            {leafLabel(0)}
          </text>
        ) : (
          <>
            <text
              x={rectX + W / 4}
              y={rectY + 22}
              textAnchor="middle"
              fontSize="8"
              fontFamily="Satoshi, sans-serif"
              fill="currentColor"
              opacity="0.85"
            >
              {leafLabel(0)}
            </text>
            <text
              x={rectX + (3 * W) / 4}
              y={rectY + 22}
              textAnchor="middle"
              fontSize="8"
              fontFamily="Satoshi, sans-serif"
              fill="currentColor"
              opacity="0.85"
            >
              {leafLabel(1)}
            </text>
          </>
        )}

        {/* Confección type label — center */}
        <text
          x={rectX + W / 2}
          y={rectY + H / 2 + 4}
          textAnchor="middle"
          fontSize="8"
          fill="currentColor"
          opacity="0.5"
          fontFamily="Satoshi, sans-serif"
        >
          {confeccionLabel(cfg.tipoConfeccion)}
        </text>

        {/* Leaf info — bottom (tela cm) */}
        {numHojas === 1 ? (
          <text
            x={rectX + W / 2}
            y={rectY + H - 10}
            textAnchor="middle"
            fontSize="9"
            fontFamily="Satoshi, sans-serif"
            fill="currentColor"
            opacity="0.85"
          >
            {leafBottom(0)}
          </text>
        ) : (
          <>
            <text
              x={rectX + W / 4}
              y={rectY + H - 10}
              textAnchor="middle"
              fontSize="8"
              fontFamily="Satoshi, sans-serif"
              fill="currentColor"
              opacity="0.85"
            >
              {leafBottom(0)}
            </text>
            <text
              x={rectX + (3 * W) / 4}
              y={rectY + H - 10}
              textAnchor="middle"
              fontSize="8"
              fontFamily="Satoshi, sans-serif"
              fill="currentColor"
              opacity="0.85"
            >
              {leafBottom(1)}
            </text>
          </>
        )}

        {/* Rotation/caídas below rect — per leaf */}
        {result.rotation.hayQueGirar && result.hojas.some(h => h.caidasFormatted) && (
          <text
            x={totalW / 2}
            y={rectY + H + PADDING / 2 + 12}
            textAnchor="middle"
            fontSize="9"
            fill="currentColor"
            opacity="0.7"
            fontFamily="Satoshi, sans-serif"
          >
            ↻ Girar — {result.hojas.length === 1
              ? result.hojas[0].caidasFormatted
              : result.hojas.map((h, i) => `H${i+1}: ${h.caidasFormatted}`).join(' / ')
            }
          </text>
        )}
      </svg>
    </div>
  );
}
