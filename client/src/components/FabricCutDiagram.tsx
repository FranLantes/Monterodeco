import { FabricLayout, FabricLayoutRow } from "@/lib/upholsteryCalculations";

interface FabricCutDiagramProps {
  layout: FabricLayout;
}

// ============================================================
// SVG Fabric Cut Diagram
// Shows how pieces are cut from a fabric roll
// ============================================================
export function FabricCutDiagram({ layout }: FabricCutDiagramProps) {
  if (!layout || layout.rows.length === 0) return null;

  const SCALE = 0.45; // pixels per cm
  const PADDING = 12;
  const LABEL_H = 18; // height for top/bottom labels
  const ROW_GAP = 4; // gap between rows in cm

  const fabricWidthPx = layout.fabricWidthCm * SCALE;

  // Calculate total height needed
  const totalFabricCm = layout.rows.reduce((s, r) => s + r.rowHeightCm + ROW_GAP, 0);
  const fabricHeightPx = totalFabricCm * SCALE;

  const svgWidth = fabricWidthPx + PADDING * 2 + 40; // extra for left label
  const svgHeight = fabricHeightPx + PADDING * 2 + LABEL_H * 2;

  const LEFT_OFFSET = 40; // space for row height labels

  let currentY = PADDING + LABEL_H;

  // Render rows
  const renderedRows: React.ReactNode[] = [];

  for (let ri = 0; ri < layout.rows.length; ri++) {
    const row = layout.rows[ri];
    const rowHeightPx = row.rowHeightCm * SCALE;
    let currentX = LEFT_OFFSET + PADDING;

    const rowPieces: React.ReactNode[] = [];

    // Row background (fabric)
    rowPieces.push(
      <rect
        key={`row-bg-${ri}`}
        x={LEFT_OFFSET + PADDING}
        y={currentY}
        width={fabricWidthPx}
        height={rowHeightPx}
        fill="#f5f0e8"
        stroke="#c8b97a"
        strokeWidth={0.5}
      />
    );

    // Height label on left
    rowPieces.push(
      <text
        key={`row-h-${ri}`}
        x={LEFT_OFFSET + PADDING - 4}
        y={currentY + rowHeightPx / 2}
        fontSize={8}
        fill="#7B949C"
        textAnchor="end"
        dominantBaseline="middle"
      >
        {row.rowHeightCm}cm
      </text>
    );

    for (let pi = 0; pi < row.pieces.length; pi++) {
      const piece = row.pieces[pi];
      const pieceWidthPx = piece.widthCm * SCALE;
      const pieceHeightPx = piece.heightCm * SCALE;

      // Piece rectangle
      rowPieces.push(
        <rect
          key={`piece-${ri}-${pi}`}
          x={currentX}
          y={currentY}
          width={pieceWidthPx}
          height={pieceHeightPx}
          fill={piece.color + "55"} // semi-transparent
          stroke={piece.color}
          strokeWidth={1}
        />
      );

      // Dimension labels
      const labelX = currentX + pieceWidthPx / 2;
      const labelY = currentY + pieceHeightPx / 2;

      rowPieces.push(
        <text
          key={`piece-lbl-${ri}-${pi}`}
          x={labelX}
          y={labelY - 5}
          fontSize={6.5}
          fill="#172140"
          textAnchor="middle"
          dominantBaseline="middle"
          fontWeight="bold"
        >
          {piece.label.length > 12 ? piece.label.slice(0, 12) + '…' : piece.label}
        </text>
      );

      rowPieces.push(
        <text
          key={`piece-dim-${ri}-${pi}`}
          x={labelX}
          y={labelY + 5}
          fontSize={6}
          fill="#7B949C"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {piece.widthCm}×{piece.heightCm}cm
        </text>
      );

      currentX += pieceWidthPx;
    }

    renderedRows.push(...rowPieces);

    currentY += rowHeightPx + ROW_GAP * SCALE;
  }

  return (
    <div className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="max-w-full"
        style={{ minWidth: Math.min(svgWidth, 300) }}
      >
        {/* Fabric width label */}
        <text
          x={LEFT_OFFSET + PADDING + fabricWidthPx / 2}
          y={PADDING + LABEL_H - 4}
          fontSize={9}
          fill="#172140"
          textAnchor="middle"
          fontWeight="bold"
        >
          Ancho tela: {layout.fabricWidthCm}cm
        </text>

        {/* Width arrow line */}
        <line
          x1={LEFT_OFFSET + PADDING}
          y1={PADDING + LABEL_H - 6}
          x2={LEFT_OFFSET + PADDING + fabricWidthPx}
          y2={PADDING + LABEL_H - 6}
          stroke="#7B949C"
          strokeWidth={0.5}
          markerEnd="url(#arrow)"
          markerStart="url(#arrow)"
        />

        {/* Arrow marker */}
        <defs>
          <marker id="arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
            <path d="M0,0 L4,2 L0,4 L1,2 Z" fill="#7B949C" />
          </marker>
        </defs>

        {/* Pieces */}
        {renderedRows}

        {/* Total meters label at bottom */}
        <text
          x={LEFT_OFFSET + PADDING + fabricWidthPx / 2}
          y={svgHeight - 6}
          fontSize={9}
          fill="#172140"
          textAnchor="middle"
          fontWeight="bold"
        >
          Total: {layout.totalMetros} metros
        </text>
      </svg>
    </div>
  );
}
