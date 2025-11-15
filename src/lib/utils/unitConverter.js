// utils/coordinateConverter.js

/**
 * Parse DMS string and extract values
 * Handles: "6°10'31.36"S" or "6°10'31.36\"S" or "6° 10' 31.36\" S"
 * @param {string} dmsString
 */
function parseDMSString(dmsString) {
  if (!dmsString || typeof dmsString !== 'string') {
    return null;
  }

  // Remove extra spaces and normalize quotes
  const cleaned = dmsString.trim().replace(/\s+/g, '');
  
  // Regex to extract: degrees° minutes' seconds" direction
  const regex = /^(-?\d+(?:\.\d+)?)[°d](\d+(?:\.\d+)?)[''′](\d+(?:\.\d+)?)[""″]?([NSEW])$/i;
  const matches = cleaned.match(regex);

  if (!matches) {
    return null;
  }

  return {
    degrees: Math.abs(parseFloat(matches[1])),
    minutes: parseFloat(matches[2]),
    seconds: parseFloat(matches[3]),
    direction: matches[4].toUpperCase()
  };
}

/**
 * Validate DMS string format
 * @param {string} dmsString
 */
export function validateDMS(dmsString) {
  const parsed = parseDMSString(dmsString);
  
  if (!parsed) {
    return { 
      valid: false, 
      message: 'Format tidak valid\nContoh: 6°10\'31.36"S atau 106°49\'37.26"E' 
    };
  }

  // Check minutes and seconds range
  if (parsed.minutes >= 60 || parsed.seconds >= 60) {
    return { 
      valid: false, 
      message: 'Menit dan detik tidak boleh >= 60' 
    };
  }

  // Check max values based on direction
  const decimal = parsed.degrees + parsed.minutes / 60 + parsed.seconds / 3600;
  if ((parsed.direction === 'N' || parsed.direction === 'S') && decimal > 90) {
    return { valid: false, message: 'Latitude tidak boleh lebih dari 90°' };
  }
  if ((parsed.direction === 'E' || parsed.direction === 'W') && decimal > 180) {
    return { valid: false, message: 'Longitude tidak boleh lebih dari 180°' };
  }

  return { valid: true };
}

/**
 * Validate decimal coordinate
 * @param {string} decimal
 * @param {boolean} isLatitude
 */
export function validateDecimal(decimal, isLatitude) {
  const num = parseFloat(decimal);
  
  if (isNaN(num)) {
    return { valid: false, message: 'Input harus berupa angka' };
  }

  const maxValue = isLatitude ? 90 : 180;
  if (num < -maxValue || num > maxValue) {
    return { 
      valid: false, 
      message: `Nilai harus antara -${maxValue} dan ${maxValue}` 
    };
  }

  return { valid: true };
}

/**
 * Convert DMS string to Decimal
 * @param {string} dmsString - e.g., "6°10'31.36"S"
 * @returns {number|null} - Decimal value or null if invalid
 */
export function dmsToDecimal(dmsString) {
  const parsed = parseDMSString(dmsString);
  if (!parsed) {
    return null;
  }

  const { degrees, minutes, seconds, direction } = parsed;
  let decimal = degrees + minutes / 60 + seconds / 3600;

  if (direction === 'S' || direction === 'W') {
    decimal *= -1;
  }

  return decimal;
}

/**
 * Convert Decimal to DMS string
 * @param {number} decimal - Decimal coordinate
 * @param {boolean} isLatitude - true for lat, false for lon
 * @param {number} precision - decimal places for seconds (default: 2)
 * @returns {string|null} - DMS string like "6°10'31.36"S" or null if invalid
 */
export function decimalToDMS(decimal, isLatitude, precision = 2) {
  // Validate input
  if (isNaN(decimal) || decimal === null || decimal === undefined) {
    return null;
  }

  const maxValue = isLatitude ? 90 : 180;
  if (decimal < -maxValue || decimal > maxValue) {
    return null;
  }

  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesDecimal = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = (minutesDecimal - minutes) * 60;

  let direction;
  if (isLatitude) {
    direction = decimal >= 0 ? 'N' : 'S';
  } else {
    direction = decimal >= 0 ? 'E' : 'W';
  }

  return `${degrees}°${minutes}'${seconds.toFixed(precision)}"${direction}`;
}

/**
 * Parse DMS components from string (if you need individual values)
 * @param {string} dmsString
 * @returns {object|null} - {degrees, minutes, seconds, direction} or null
 */
export function getDMSComponents(dmsString) {
  return parseDMSString(dmsString);
}