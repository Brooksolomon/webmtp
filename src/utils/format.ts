/**
 * Formats an MTP date string (YYYYMMDDTHHMMSS) to a more readable format
 * @param mtpDate - Date string in format YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSS.000
 * @returns Formatted date string (e.g., "Nov 23, 2025, 3:11:04 PM")
 */
export function formatMtpDate(mtpDate: string): string {
  if (!mtpDate) return '';
  
  try {
    // Extract the date parts from the MTP date string
    // Format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSS.000
    const year = parseInt(mtpDate.substring(0, 4));
    const month = parseInt(mtpDate.substring(4, 6)) - 1; // Months are 0-indexed in JS
    const day = parseInt(mtpDate.substring(6, 8));
    const hour = parseInt(mtpDate.substring(9, 11) || '0');
    const minute = parseInt(mtpDate.substring(11, 13) || '0');
    const second = parseInt(mtpDate.substring(13, 15) || '0');

    const date = new Date(year, month, day, hour, minute, second);
    
    // Format as "Month Day, Year, HH:MM:SS AM/PM"
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.warn('Error formatting MTP date:', error);
    return mtpDate; // Return original if parsing fails
  }
}

/**
 * Formats a number of bytes to a human-readable string
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted string (e.g., "1.23 MB")
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
