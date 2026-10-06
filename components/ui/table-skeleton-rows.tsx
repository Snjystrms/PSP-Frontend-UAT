import { Skeleton } from "@/components/ui/skeleton";

const cellWidths = [
  "w-8",
  "w-2/3",
  "w-1/2",
  "w-3/4",
  "w-1/2",
  "w-2/3",
  "w-3/4",
  "w-1/2",
  "w-8",
];

export function TableSkeletonRows({
  columns,
  rows = 5,
  cellClassName = "px-4 py-4",
}: {
  columns: number;
  rows?: number;
  cellClassName?: string;
}) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <tr key={rowIndex} aria-hidden="true">
      {Array.from({ length: columns }, (_, columnIndex) => (
        <td key={columnIndex} className={cellClassName}>
          <Skeleton
            className={`h-4 ${cellWidths[columnIndex % cellWidths.length]}`}
          />
        </td>
      ))}
    </tr>
  ));
}
