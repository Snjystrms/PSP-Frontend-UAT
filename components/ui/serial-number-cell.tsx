type SerialNumberCellProps = {
  serialNumber: number;
  className?: string;
};

export function SerialNumberCell({ serialNumber, className = "font-mono text-xs text-muted-foreground" }: SerialNumberCellProps) {
  return <span className={className}>{serialNumber}</span>;
}
