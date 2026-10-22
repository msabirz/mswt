import { z } from "zod";

export const SUBJECTS = ["donation", "help", "volunteer", "other"] as const;

/** Server-side validation for the contact form. Error codes map to Contact.errors.* messages. */
export const ContactSchema = z.object({
  name: z.string().trim().min(1, "name").max(120, "name"),
  email: z.string().trim().max(200, "email").pipe(z.email("email")),
  phone: z
    .string()
    .trim()
    .max(20, "phone")
    .refine((v) => v === "" || /^\+?[0-9 ()-]{7,20}$/.test(v), "phone"),
  subject: z.enum(SUBJECTS, "subject"),
  message: z.string().trim().min(10, "message").max(5000, "message"),
});

export type ContactInput = z.infer<typeof ContactSchema>;
export type ContactField = keyof ContactInput;
export type ContactErrorCode = ContactField | "captcha" | "rate" | "server";
