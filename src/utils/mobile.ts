import { ApiError } from "./api-error";

const indianMobileRegex = /^[6-9][0-9]{9}$/;

export function normalizeIndianMobileNumber(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return digits;
}

export function parseIndianMobileNumber(value: string, fieldName = "mobileNumber"): string {
  const mobileNumber = normalizeIndianMobileNumber(value);

  if (!indianMobileRegex.test(mobileNumber)) {
    throw new ApiError(400, `${fieldName} must be a valid 10-digit Indian mobile number.`);
  }

  return mobileNumber;
}
