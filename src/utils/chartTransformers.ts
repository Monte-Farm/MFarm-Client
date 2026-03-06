// Utilidades para transformar datos de API a formato de gráficas

export interface DataPoint {
    x: string | number;
    y: number;
}

export interface Serie {
    id: string;
    data: DataPoint[];
    color?: string;
}

/**
 * Transforma datos históricos de cantidad al formato de gráfica
 * @param data Array de objetos con { date, quantity }
 * @param serieId Nombre de la serie (default: "Datos")
 * @param color Color de la línea (default: "#0d6efd")
 */
export const transformQuantityData = (
    data: Array<{ date: string; quantity: number }> | null | undefined,
    serieId: string = "Datos",
    color: string = "#0d6efd"
): Serie[] => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return [];
    }
    
    return [{
        id: serieId,
        color: color,
        data: data.map(item => ({
            x: formatDateLabel(item.date),
            y: item.quantity || 0
        }))
    }];
};

/**
 * Transforma datos históricos de precio al formato de gráfica
 * @param data Array de objetos con { date, price }
 * @param serieId Nombre de la serie (default: "Precio")
 * @param color Color de la línea (default: "#dc3545")
 */
export const transformPriceData = (
    data: Array<{ date: string; price: number }> | null | undefined,
    serieId: string = "Precio",
    color: string = "#dc3545"
): Serie[] => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return [];
    }
    
    return [{
        id: serieId,
        color: color,
        data: data.map(item => ({
            x: formatDateLabel(item.date),
            y: item.price || 0
        }))
    }];
};

/**
 * Combina múltiples series de datos de precio en una sola estructura
 * @param series Array de objetos con { data, serieId, color }
 */
export const combinePriceSeries = (
    series: Array<{
        data: Array<{ date: string; price: number }> | null | undefined;
        serieId: string;
        color: string;
    }>
): Serie[] => {
    const result: Serie[] = [];
    
    series.forEach(({ data, serieId, color }) => {
        if (data && Array.isArray(data) && data.length > 0) {
            result.push({
                id: serieId,
                color: color,
                data: data.map(item => ({
                    x: formatDateLabel(item.date),
                    y: item.price || 0
                }))
            });
        }
    });
    
    return result;
};

/**
 * Formatea una fecha a una etiqueta corta (dd/mm)
 */
export const formatDateLabel = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es', { day: '2-digit', month: '2-digit' });
    } catch (error) {
        return dateString;
    }
};

/**
 * Formatea una fecha a etiqueta corta solo con mes
 */
export const formatDateShort = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es', { month: 'short' });
    } catch (error) {
        return dateString;
    }
};
