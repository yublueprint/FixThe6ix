/**
 * Maps the Prisma StoreCategory enum to a human-readable display label.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  FAST_FOOD: "Fast Food",
  GROCERY: "Grocery",
  CLOTHING: "Clothing",
  RESTAURANT: "Restaurant",
  PHARMACY: "Pharmacy",
  ELECTRONICS: "Electronics",
  HOME_GOODS: "Home Goods",
  ONLINE: "Online",
  OTHER: "Other",
}

/**
 * Returns a human-readable category label for a DB enum value.
 */
export function categoryLabel(dbCategory: string): string {
  return CATEGORY_LABELS[dbCategory] ?? "Other"
}

export const CATEGORY_RAW: Record<string, string> = {
  "Grocery":     "#22c55e",
  "Fast Food":   "#f97316",
  "Clothing":    "#8b5cf6",
  "Restaurant":  "#ef4444",
  "Pharmacy":    "#06b6d4",
  "Electronics": "#3b82f6",
  "Home Goods":  "#f59e0b",
  "Online":      "#8b5cf6",
  "Other":       "#3b82f6",
}

// 5 curated grayscale shades that dynamically adapt between light and dark modes
const GRAY_SHADES = [
  "fill-zinc-200/90 dark:fill-zinc-800/90 hover:fill-zinc-300 dark:hover:fill-zinc-700",
  "fill-zinc-100 dark:fill-zinc-900 hover:fill-zinc-200 dark:hover:fill-zinc-850",
  "fill-zinc-300/80 dark:fill-zinc-700/80 hover:fill-zinc-400/80 dark:hover:fill-zinc-650",
  "fill-muted dark:fill-zinc-850 hover:fill-muted/80 dark:hover:fill-zinc-800",
  "fill-secondary dark:fill-secondary/80 hover:fill-secondary/70 dark:hover:fill-secondary/60",
]

export function TreemapCell(props: any) {
  const { x, y, width, height, name, remaining, index } = props
  if (!width || !height || width < 2 || height < 2) return null

  const showText = width > 45 && height > 28
  const showValue = width > 70 && height > 48
  const shadeClass = GRAY_SHADES[(index ?? 0) % GRAY_SHADES.length]

  return (
    <g className="transition-all duration-150">
      <rect
        x={x + 1}
        y={y + 1}
        width={width - 2}
        height={height - 2}
        rx={6}
        ry={6}
        className={`${shadeClass} stroke-border cursor-pointer transition-colors`}
        strokeWidth={1.5}
      />
      {showText && (
        <text
          x={x + width / 2}
          y={y + height / 2 + (showValue ? -8 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          stroke="none"
          strokeWidth={0}
          fontSize={Math.min(13, Math.max(10, width / 7))}
          fontWeight={600}
          className="fill-foreground font-semibold tracking-tight select-none pointer-events-none"
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
          stroke="none"
          strokeWidth={0}
          fontSize={11}
          fontWeight={500}
          className="fill-muted-foreground font-medium select-none pointer-events-none"
        >
          $${remaining != null ? Number(remaining).toFixed(0) : "0"}
        </text>
      )}
    </g>
  )
}
