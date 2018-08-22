export const pascalToCamel = string => string.replace(/\w/, c => c.toLowerCase());
export const camelToPascal = string => string.replace(/\w/, c => c.toUpperCase());
