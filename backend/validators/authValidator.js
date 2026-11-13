export const validateRegisterInput = (data) => {
  const errors = {};
  const { name, email, password } = data;

  if (!name || name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateLoginInput = (data) => {
  const errors = {};
  const { email, password } = data;

  if (!email || email.trim() === '') {
    errors.email = 'Email address is required.';
  }

  if (!password || password.trim() === '') {
    errors.password = 'Password is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

