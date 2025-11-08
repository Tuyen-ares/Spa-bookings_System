/**
 * Date utility functions for consistent date formatting across the application
 * All dates should be displayed in DD-MM-YYYY format
 */

/**
 * Format date to DD-MM-YYYY
 * @param date - Date object or date string
 * @returns Formatted date string in DD-MM-YYYY format, or empty string if invalid
 */
export const formatDateDDMMYYYY = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

/**
 * Parse DD-MM-YYYY string to YYYY-MM-DD (for date input)
 * @param dateStr - Date string in DD-MM-YYYY format
 * @returns Date string in YYYY-MM-DD format, or empty string if invalid
 */
export const parseDDMMYYYYToYYYYMMDD = (dateStr: string): string => {
    if (!dateStr || dateStr.length !== 10) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    
    // Validate
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return '';
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) return '';
    
    // Convert to YYYY-MM-DD
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Format date to DD-MM-YYYY HH:mm (with time)
 * @param date - Date object or date string
 * @returns Formatted date string with time in DD-MM-YYYY HH:mm format
 */
export const formatDateTimeDDMMYYYY = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
};

