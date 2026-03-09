import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

type EmailRequest = z.infer<typeof api.email.send.input>;

export function useSendEmailReport() {
  return useMutation({
    mutationFn: async (data: EmailRequest) => {
      const validated = api.email.send.input.parse(data);
      const res = await fetch(api.email.send.path, {
        method: api.email.send.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.email.send.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to send email');
      }
      
      return api.email.send.responses[200].parse(await res.json());
    },
  });
}
