export const CURRENCY_SYMBOLS = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'AU$',
  JPY: '¥',
  CNY: '¥',
};

export const getCurrencySymbol = (currency = 'INR') => {
  return CURRENCY_SYMBOLS[currency?.toUpperCase()] || currency || '₹';
};

export const formatCurrency = (amount, currency = 'INR') => {
  const value = Number(amount) || 0;
  const curr = (currency || 'INR').toUpperCase();

  const localeMap = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    CAD: 'en-CA',
    AUD: 'en-AU',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
  };

  const locale = localeMap[curr] || 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (error) {
    const symbol = getCurrencySymbol(curr);
    return `${symbol}${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

