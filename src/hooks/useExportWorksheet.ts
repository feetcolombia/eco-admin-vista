import * as XLSX from 'xlsx';

export interface WorksheetData {
  header: { [key: string]: any };
  table: any[];
}

/**
 * A hook to prepare worksheet data and export it as an Excel file.
 * @returns exportWorksheet: function that accepts worksheet data, a desired filename,
 *         and an optional array of table header labels to use.
 */
export const useExportWorksheet = () => {

  /**
   * Prepares an array of arrays from the worksheet data.
   * The first rows show header key/value pairs,
   * then a blank row,
   * then a table header row (using provided labels or keys from the first table row),
   * and finally all table rows.
   * 
   * @param data The data object containing header and table.
   * @param tableHeaders Optional array of column labels for the table.
   * @returns an array of arrays ready to be converted to a worksheet.
   */
  const prepareWorksheetData = (data: WorksheetData, tableHeaders?: string[]): any[][] => {
    const ws_data: any[][] = [];
    
    // Add header rows from the header object (skip trasferencia_total if present)
    Object.entries(data.header)
      .filter(([key]) => key !== "trasferencia_total")
      .forEach(([key, value]) => {
        ws_data.push([key, value]);
      });
    
    // Add an empty row as a separator
    ws_data.push([]);
    
    // Determine table header row
    if (tableHeaders && tableHeaders.length) {
      ws_data.push(tableHeaders);
    } else if (data.table.length > 0) {
      // Use keys from the first data row as header if no tableHeaders are provided
      ws_data.push(Object.keys(data.table[0]));
    } else {
      ws_data.push([]);
    }
    
    // Add table rows
    data.table.forEach((row) => {
      if (tableHeaders && tableHeaders.length) {
        const rowData = tableHeaders.map((label) => {
          // Special mapping if trasferencia_total exists in header
          if (data.header.hasOwnProperty("trasferencia_total")) {
            if (label === "Bodega Origen") {
              return row["bodega_origen_nombre"] || row["id_bodega_origen"] || "";
            }
            if (label === "Bodega Destino") {
              return row["bodega_destino_nombre"] || row["id_bodega_destino"] || "";
            }
            if (label === "SKU") {
              return row["sku"] || row["id_producto"] || "";
            }
          }
          const lowerLabel = label.toLowerCase();
          if (lowerLabel === "bodega"  && data.header.hasOwnProperty("Tipo") === false) {
            return row["bodega_nombre"] || "";
          }
          return row[lowerLabel] || row[label] || "";
        });
        ws_data.push(rowData);
      } else {
        ws_data.push(Object.values(row));
      }
    });
    
    return ws_data;
  };

  /**
   * Exports the provided worksheet data as an Excel file.
   *
   * @param data The worksheet data with header and table.
   * @param fileName Desired filename for the exported Excel file.
   * @param tableHeaders Optional array of column labels for the table.
   */
  const exportWorksheet = (
    data: WorksheetData,
    fileName: string,
    tableHeaders?: string[]
  ): void => {
    // Create first sheet using the primary table
    const ws_data = prepareWorksheetData(data, tableHeaders);
    const worksheet = XLSX.utils.aoa_to_sheet(ws_data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hoja 1");
    
    // If the header contains "tipo" and a secondary table (tableDos) exists, create a second sheet
    if (data.header.hasOwnProperty("Tipo") && (data as any).tableDos) {
      const worksheetDataDos: WorksheetData = {
        header: data.header,
        table: (data as any).tableDos,
      };
      const ws_data2 = prepareWorksheetData(worksheetDataDos, tableHeaders);
      const worksheet2 = XLSX.utils.aoa_to_sheet(ws_data2);
      XLSX.utils.book_append_sheet(workbook, worksheet2, "Hoja 2");
    }
    
    XLSX.writeFile(workbook, fileName);
  };

  return { prepareWorksheetData, exportWorksheet };
};