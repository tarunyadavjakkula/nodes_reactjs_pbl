export const parseReceiptText = (rawText) => {
  if (!rawText || !rawText.trim()) {
    return {
      merchant: 'Receipt Merchant',
      amount: 0.00,
      date: new Date().toISOString().split('T')[0],
      category: 'Other Expenses',
      payment_method: 'Cash',
      items: [],
      rawText: '',
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Merchant Detection
  // Common merchants dictionary
  const knownMerchants = [
    { name: 'Starbucks', category: 'Food & Dining' },
    { name: 'McDonald\'s', category: 'Food & Dining' },
    { name: 'Subway', category: 'Food & Dining' },
    { name: 'Dominos', category: 'Food & Dining' },
    { name: 'Swiggy', category: 'Food & Dining' },
    { name: 'Zomato', category: 'Food & Dining' },
    { name: 'Uber', category: 'Transportation & Travel' },
    { name: 'Ola', category: 'Transportation & Travel' },
    { name: 'Shell', category: 'Transportation & Travel' },
    { name: 'Indian Oil', category: 'Transportation & Travel' },
    { name: 'Walmart', category: 'Shopping & Retail' },
    { name: 'Amazon', category: 'Shopping & Retail' },
    { name: 'Target', category: 'Shopping & Retail' },
    { name: 'Apple Store', category: 'Shopping & Retail' },
    { name: 'D-Mart', category: 'Shopping & Retail' },
    { name: 'CVS Pharmacy', category: 'Healthcare & Medical' },
    { name: 'Apollo Pharmacy', category: 'Healthcare & Medical' },
    { name: 'Netflix', category: 'Entertainment & Leisure' },
    { name: 'Spotify', category: 'Entertainment & Leisure' },
  ];

  let detectedMerchant = '';
  let suggestedCategory = '';

  for (const km of knownMerchants) {
    if (new RegExp(km.name, 'i').test(rawText)) {
      detectedMerchant = km.name;
      suggestedCategory = km.category;
      break;
    }
  }

  if (!detectedMerchant && lines.length > 0) {
    // Pick the first line that is alphabetic and not just numbers or dates
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (/^[a-zA-Z\s&'.-]{3,35}$/.test(line) && !/receipt|invoice|tax|bill|order|cash|total/i.test(line)) {
        detectedMerchant = line;
        break;
      }
    }
  }
  if (!detectedMerchant) detectedMerchant = lines[0] || 'Merchant Store';

  // 2. Amount / Total Detection
  let detectedAmount = 0.00;
  // Look for total keywords: Total, Grand Total, Net, Amount, Balance Due
  const totalRegex = /(?:total|grand\s*total|net\s*amount|final\s*amount|balance\s*due|paid|amount\s*due|amount)\s*[:=]?\s*(?:[\$₹€£]|rs\.?|inr|usd)?\s*([0-9]+(?:[.,][0-9]{2})?)/i;

  for (const line of lines) {
    const match = line.match(totalRegex);
    if (match && match[1]) {
      const val = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(val) && val > 0) {
        detectedAmount = Math.max(detectedAmount, val);
      }
    }
  }

  // If no total keyword matched, find highest monetary pattern in receipt
  if (detectedAmount === 0) {
    const moneyMatches = rawText.match(/(?:[\$₹€£]|rs\.?|inr)?\s*([0-9]+\.[0-9]{2})/gi);
    if (moneyMatches) {
      for (const m of moneyMatches) {
        const num = parseFloat(m.replace(/[^0-9.]/g, ''));
        if (!isNaN(num) && num > detectedAmount) {
          detectedAmount = num;
        }
      }
    }
  }

  // 3. Date Detection
  let detectedDate = new Date().toISOString().split('T')[0];
  // Match YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY
  const datePatterns = [
    /\b(20\d{2}[-/](?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12]\d|3[01]))\b/,
    /\b((?:0[1-9]|[12]\d|3[01])[-/](?:0[1-9]|1[0-2])[-/](?:20\d{2}|\d{2}))\b/,
    /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+20\d{2})\b/i,
  ];

  for (const pattern of datePatterns) {
    const match = rawText.match(pattern);
    if (match && match[1]) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime())) {
        detectedDate = parsed.toISOString().split('T')[0];
        break;
      }
    }
  }

  // 4. Category Heuristics if not already matched
  if (!suggestedCategory) {
    const textLower = rawText.toLowerCase();
    if (/(coffee|burger|pizza|restaurant|cafe|food|dining|diner|kitchen|bakery|lunch|dinner|meal)/i.test(textLower)) {
      suggestedCategory = 'Food & Dining';
    } else if (/(taxi|fuel|petrol|diesel|gas|metro|rail|flight|airline|parking|toll|cab)/i.test(textLower)) {
      suggestedCategory = 'Transportation & Travel';
    } else if (/(clothing|apparel|footwear|mall|mart|grocery|supermarket|retail|store|fashion)/i.test(textLower)) {
      suggestedCategory = 'Shopping & Retail';
    } else if (/(book|course|tuition|exam|college|school|university|training|stationery)/i.test(textLower)) {
      suggestedCategory = 'Education & Books';
    } else if (/(cinema|movie|theatre|concert|game|arcade|club|amusement)/i.test(textLower)) {
      suggestedCategory = 'Entertainment & Leisure';
    } else if (/(pharmacy|hospital|clinic|doctor|dental|medicine|lab|health)/i.test(textLower)) {
      suggestedCategory = 'Healthcare & Medical';
    } else if (/(electricity|water|broadband|internet|recharge|mobile|utility|gas bill)/i.test(textLower)) {
      suggestedCategory = 'Bills & Utilities';
    } else {
      suggestedCategory = 'Other Expenses';
    }
  }

  // 5. Payment Method Detection
  let paymentMethod = 'Credit Card';
  if (/cash/i.test(rawText)) {
    paymentMethod = 'Cash';
  } else if (/upi|gpay|phonepe|paytm/i.test(rawText)) {
    paymentMethod = 'UPI / Online';
  } else if (/debit/i.test(rawText)) {
    paymentMethod = 'Debit Card';
  }

  // 6. Extracted Items
  const items = [];
  for (const line of lines) {
    const itemMatch = line.match(/^([a-zA-Z\s]{2,25})\s+.*?([0-9]+\.[0-9]{2})$/);
    if (itemMatch && !/total|subtotal|tax|discount|change/i.test(itemMatch[1])) {
      items.push({
        name: itemMatch[1].trim(),
        price: parseFloat(itemMatch[2]),
      });
    }
  }

  return {
    merchant: detectedMerchant,
    amount: detectedAmount,
    date: detectedDate,
    category: suggestedCategory,
    payment_method: paymentMethod,
    items,
    confidence: detectedAmount > 0 ? 0.92 : 0.65,
    rawText,
  };
};

