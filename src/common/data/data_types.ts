

export type ColumnType = "text" | "number" | "date" | "currency";
export type Column<T> = {
  header: string;
  accessor: keyof T;
  type?: ColumnType;
  render?: (value: any, row: T) => React.ReactNode;
  isFilterable?: boolean;
};
