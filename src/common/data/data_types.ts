

export type ColumnType = "text" | "number" | "date" | "currency" | "action";

export type Column<T> = {
  header: string;
  accessor: keyof T;
  type?: ColumnType;
  render?: (value: any, row: T, isSelected?: boolean, onFieldChange?: (field: keyof T, value: any) => void) => React.ReactNode;
  isFilterable?: boolean;
};