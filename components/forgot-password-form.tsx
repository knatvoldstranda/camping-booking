"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const redirectTo =
        `${window.location.origin}/auth/confirm?next=/auth/update-password`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo,
          }
        );

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Det oppstod en feil ved sending av e-post."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        className
      )}
      {...props}
    >
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Sjekk e-posten din
            </CardTitle>

            <CardDescription>
              Vi har sendt instruksjoner for å endre passordet.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Hvis e-postadressen finnes i systemet,
              vil du motta en lenke for å velge nytt passord.
            </p>

            <div className="mt-4 text-center text-sm">
              <Link
                href="/auth/login"
                className="underline underline-offset-4"
              >
                Tilbake til innlogging
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Glemt passord
            </CardTitle>

            <CardDescription>
              Skriv inn e-postadressen din, så sender vi
              en lenke for å velge nytt passord.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">
                    E-post
                  </Label>

                  <Input
                    id="email"
                    type="email"
                    placeholder="din@epost.no"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Sender..."
                    : "Send lenke"}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm">
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  Tilbake til innlogging
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}