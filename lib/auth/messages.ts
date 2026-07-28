const knownMessages: Record<string, { en: string; es: string }> = {
  email_not_confirmed: {
    en: "Confirm your email before signing in.",
    es: "Confirmá tu correo antes de iniciar sesión.",
  },
  invalid_credentials: {
    en: "The email or password is incorrect.",
    es: "El correo o la contraseña no son correctos.",
  },
  user_already_exists: {
    en: "An account with this email already exists.",
    es: "Ya existe una cuenta con este correo.",
  },
  weak_password: {
    en: "Choose a stronger password.",
    es: "Elegí una contraseña más segura.",
  },
  over_email_send_rate_limit: {
    en: "Too many emails were requested. Try again later.",
    es: "Se solicitaron demasiados correos. Intentá nuevamente más tarde.",
  },
  over_request_rate_limit: {
    en: "Too many attempts. Try again later.",
    es: "Hubo demasiados intentos. Intentá nuevamente más tarde.",
  },
};

export function authErrorMessage(code: string | undefined, language: "en" | "es") {
  const message = code ? knownMessages[code] : undefined;
  return message?.[language] ?? (language === "es"
    ? "No pudimos completar la operación. Revisá los datos e intentá nuevamente."
    : "We could not complete the request. Check your details and try again.");
}

