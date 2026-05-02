type HeroOtpMode = "mock" | "provider";

function normalizeMode(value: string | undefined): HeroOtpMode {
  const normalized = value?.trim().toLowerCase();
  return normalized === "provider" ? "provider" : "mock";
}

function normalizeTestOtp(value: string | undefined): string {
  const otp = value?.trim() || "123456";
  return /^\d{6}$/.test(otp) ? otp : "123456";
}

export const heroOtpConfig = {
  mode: normalizeMode(process.env.HERO_OTP_MODE),
  testOtp: normalizeTestOtp(process.env.HERO_TEST_OTP),
  expiresInSeconds: 300,
};
