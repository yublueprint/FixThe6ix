export const STORE_CATEGORIES: Record<string, string> = {
  "Walmart": "Grocery", "Target": "Grocery", "Kroger": "Grocery",
  "Costco": "Grocery", "Whole Foods": "Grocery", "Safeway": "Grocery",
  "Trader Joe's": "Grocery", "McDonald's": "Fast Food", "Starbucks": "Fast Food",
  "Subway": "Fast Food", "Chipotle": "Fast Food", "Panera Bread": "Fast Food",
  "Dunkin'": "Fast Food", "Taco Bell": "Fast Food", "Chick-fil-A": "Fast Food",
  "Olive Garden": "Fast Food", "Old Navy": "Clothing", "Gap": "Clothing",
  "TJ Maxx": "Clothing", "Kohl's": "Clothing", "Macy's": "Clothing",
  "Amazon": "Other", "CVS Pharmacy": "Other", "Best Buy": "Other",
  "Home Depot": "Other",
}

export const CATEGORY_RAW: Record<string, string> = {
  "Grocery":   "#22c55e",
  "Fast Food": "#f97316",
  "Clothing":  "#8b5cf6",
  "Other":     "#3b82f6",
}

export function TreemapCell(props: any) {
  const { x, y, width, height, name, category, remaining } = props
  if (!width || !height || width < 2 || height < 2) return null
  const color = CATEGORY_RAW[category] ?? "#6b7280"
  const showText = width > 45 && height > 28
  const showValue = width > 70 && height > 48

  return (
    <g>
      <rect
        x={x + 1} y={y + 1}
        width={width - 2} height={height - 2}
        fill={color} fillOpacity={0.85}
        rx={6} ry={6}
        stroke="white" strokeWidth={2}
      />
      {showText && (
        <text
          x={x + width / 2}
          y={y + height / 2 + (showValue ? -8 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={Math.min(12, width / 6)}
          fontWeight={600}
          style={{ pointerEvents: "none" }}
        >
          {name}
        </text>
      )}
      {showValue && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.8)"
          fontSize={10}
          style={{ pointerEvents: "none" }}
        >
          ${remaining?.toFixed(0)}
        </text>
      )}
    </g>
  )
}
