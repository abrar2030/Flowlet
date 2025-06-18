// Financial validation utilities
export const FinancialValidators = {
  // Validate credit card number using Luhn algorithm
  validateCreditCard: (cardNumber) => {
    const cleaned = cardNumber.replace(/\D/g, '');
    
    if (cleaned.length < 13 || cleaned.length > 19) {
      return { isValid: false, error: 'Invalid card number length' };
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    const isValid = sum % 10 === 0;
    const cardType = getCardType(cleaned);
    
    return {
      isValid,
      cardType,
      maskedNumber: maskCardNumber(cleaned),
      error: isValid ? null : 'Invalid card number'
    };
  },

  // Validate CVV
  validateCVV: (cvv, cardType = 'visa') => {
    const cleaned = cvv.replace(/\D/g, '');
    const expectedLength = cardType.toLowerCase() === 'amex' ? 4 : 3;
    
    const isValid = cleaned.length === expectedLength;
    
    return {
      isValid,
      error: isValid ? null : `CVV must be ${expectedLength} digits`
    };
  },

  // Validate expiry date
  validateExpiryDate: (month, year) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10);
    
    // Adjust year if it's 2-digit
    const fullYear = expYear < 100 ? 2000 + expYear : expYear;
    
    if (expMonth < 1 || expMonth > 12) {
      return { isValid: false, error: 'Invalid month' };
    }
    
    if (fullYear < currentYear || (fullYear === currentYear && expMonth < currentMonth)) {
      return { isValid: false, error: 'Card has expired' };
    }
    
    if (fullYear > currentYear + 20) {
      return { isValid: false, error: 'Invalid expiry year' };
    }
    
    return { isValid: true, error: null };
  },

  // Validate bank account number (IBAN)
  validateIBAN: (iban) => {
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    
    if (cleaned.length < 15 || cleaned.length > 34) {
      return { isValid: false, error: 'Invalid IBAN length' };
    }
    
    // Move first 4 characters to end
    const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
    
    // Replace letters with numbers
    let numericString = '';
    for (let char of rearranged) {
      if (char >= 'A' && char <= 'Z') {
        numericString += (char.charCodeAt(0) - 55).toString();
      } else {
        numericString += char;
      }
    }
    
    // Calculate mod 97
    let remainder = '';
    for (let i = 0; i < numericString.length; i++) {
      remainder += numericString[i];
      if (remainder.length >= 9) {
        remainder = (parseInt(remainder, 10) % 97).toString();
      }
    }
    
    const isValid = parseInt(remainder, 10) % 97 === 1;
    
    return {
      isValid,
      formatted: formatIBAN(cleaned),
      error: isValid ? null : 'Invalid IBAN'
    };
  },

  // Validate routing number (US)
  validateRoutingNumber: (routingNumber) => {
    const cleaned = routingNumber.replace(/\D/g, '');
    
    if (cleaned.length !== 9) {
      return { isValid: false, error: 'Routing number must be 9 digits' };
    }
    
    // ABA routing number checksum
    const digits = cleaned.split('').map(d => parseInt(d, 10));
    const checksum = (
      3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      (digits[2] + digits[5] + digits[8])
    ) % 10;
    
    const isValid = checksum === 0;
    
    return {
      isValid,
      error: isValid ? null : 'Invalid routing number'
    };
  },

  // Validate amount
  validateAmount: (amount, minAmount = 0.01, maxAmount = 999999.99) => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      return { isValid: false, error: 'Invalid amount format' };
    }
    
    if (numAmount < minAmount) {
      return { isValid: false, error: `Amount must be at least $${minAmount}` };
    }
    
    if (numAmount > maxAmount) {
      return { isValid: false, error: `Amount cannot exceed $${maxAmount}` };
    }
    
    // Check for more than 2 decimal places
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return { isValid: false, error: 'Amount cannot have more than 2 decimal places' };
    }
    
    return {
      isValid: true,
      formatted: formatCurrency(numAmount),
      error: null
    };
  },

  // Validate phone number
  validatePhoneNumber: (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length < 10 || cleaned.length > 15) {
      return { isValid: false, error: 'Invalid phone number length' };
    }
    
    const isValid = /^[\+]?[1-9][\d]{0,15}$/.test(cleaned);
    
    return {
      isValid,
      formatted: formatPhoneNumber(cleaned),
      error: isValid ? null : 'Invalid phone number format'
    };
  },

  // Validate email
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    return {
      isValid,
      error: isValid ? null : 'Invalid email format'
    };
  },

  // Validate SSN (US)
  validateSSN: (ssn) => {
    const cleaned = ssn.replace(/\D/g, '');
    
    if (cleaned.length !== 9) {
      return { isValid: false, error: 'SSN must be 9 digits' };
    }
    
    // Check for invalid patterns
    const invalidPatterns = [
      '000000000', '111111111', '222222222', '333333333',
      '444444444', '555555555', '666666666', '777777777',
      '888888888', '999999999'
    ];
    
    if (invalidPatterns.includes(cleaned)) {
      return { isValid: false, error: 'Invalid SSN pattern' };
    }
    
    // Check area number (first 3 digits)
    const areaNumber = cleaned.substring(0, 3);
    if (areaNumber === '000' || areaNumber === '666' || areaNumber.startsWith('9')) {
      return { isValid: false, error: 'Invalid SSN area number' };
    }
    
    // Check group number (middle 2 digits)
    const groupNumber = cleaned.substring(3, 5);
    if (groupNumber === '00') {
      return { isValid: false, error: 'Invalid SSN group number' };
    }
    
    // Check serial number (last 4 digits)
    const serialNumber = cleaned.substring(5, 9);
    if (serialNumber === '0000') {
      return { isValid: false, error: 'Invalid SSN serial number' };
    }
    
    return {
      isValid: true,
      formatted: formatSSN(cleaned),
      error: null
    };
  }
};

// Helper functions
function getCardType(cardNumber) {
  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
    diners: /^3[0689]/,
    jcb: /^35/
  };
  
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cardNumber)) {
      return type;
    }
  }
  
  return 'unknown';
}

function maskCardNumber(cardNumber) {
  if (cardNumber.length < 4) return cardNumber;
  const lastFour = cardNumber.slice(-4);
  const masked = '*'.repeat(cardNumber.length - 4);
  return masked + lastFour;
}

function formatIBAN(iban) {
  return iban.replace(/(.{4})/g, '$1 ').trim();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function formatPhoneNumber(phone) {
  if (phone.length === 10) {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  }
  return phone;
}

function formatSSN(ssn) {
  return `${ssn.slice(0, 3)}-${ssn.slice(3, 5)}-${ssn.slice(5)}`;
}

// Form validation utilities
export const FormValidators = {
  // Required field validator
  required: (value, fieldName = 'Field') => {
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
    return {
      isValid: !isEmpty,
      error: isEmpty ? `${fieldName} is required` : null
    };
  },

  // Minimum length validator
  minLength: (value, minLen, fieldName = 'Field') => {
    const length = value ? value.toString().length : 0;
    const isValid = length >= minLen;
    return {
      isValid,
      error: isValid ? null : `${fieldName} must be at least ${minLen} characters`
    };
  },

  // Maximum length validator
  maxLength: (value, maxLen, fieldName = 'Field') => {
    const length = value ? value.toString().length : 0;
    const isValid = length <= maxLen;
    return {
      isValid,
      error: isValid ? null : `${fieldName} cannot exceed ${maxLen} characters`
    };
  },

  // Pattern validator
  pattern: (value, regex, errorMessage) => {
    const isValid = regex.test(value || '');
    return {
      isValid,
      error: isValid ? null : errorMessage
    };
  },

  // Compose multiple validators
  compose: (...validators) => {
    return (value, ...args) => {
      for (const validator of validators) {
        const result = validator(value, ...args);
        if (!result.isValid) {
          return result;
        }
      }
      return { isValid: true, error: null };
    };
  }
};

export default { FinancialValidators, FormValidators };

