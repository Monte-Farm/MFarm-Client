export const translateFieldName = (field: string): string => {
    const translations: Record<string, string> = {
        'originDetail': 'Detalle de origen',
        'breed': 'Raza',
        'observations': 'Observaciones',
        'status': 'Estado',
        'currentStage': 'Etapa',
        'sex': 'Sexo',
        'birthdate': 'Fecha de nacimiento',
        'code': 'Código',
        'origin': 'Origen',
        'arrivalDate': 'Fecha de llegada',
        'sourceFarm': 'Granja de origen'
    };

    return translations[field] || field.split(/(?=[A-Z])/).join(' ');
};