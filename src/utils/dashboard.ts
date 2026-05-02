const CUSTOMER_MARKERS = new Set(["CUSTOMER", "UT_CUSTOMER"]);

export function isCustomerUserType(input: { sCode?: string | null; sName?: string | null }): boolean {
  const normalizedCode = input.sCode?.trim().toUpperCase();
  const normalizedName = input.sName?.trim().toUpperCase();

  if (normalizedCode && CUSTOMER_MARKERS.has(normalizedCode)) {
    return true;
  }

  if (normalizedName === "CUSTOMER") {
    return true;
  }

  return false;
}
