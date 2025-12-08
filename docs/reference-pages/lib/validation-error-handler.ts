import type { ZodError } from "zod";

export const handleValidationError = (error: ZodError) => {
  const fieldErrors = error.flatten().fieldErrors;
  return Object.entries(fieldErrors).reduce((acc, [field, errors]) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    acc[field] = errors && errors.length > 0 ? errors[0] ?? "Invalid input" : "Invalid input";
    return acc;
  }, {} as Record<string, string>);
};

export type ValidationErrorMap = ReturnType<typeof handleValidationError>;
