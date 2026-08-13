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
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [error, setError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const router =
    useRouter();

  const handleUpdatePassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError(null);

    if (
      password.length < 8
    ) {
      setError(
        "Passordet må være minst 8 tegn."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passordene er ikke like."
      );

      return;
    }

    setIsLoading(true);

    try {
      const supabase =
        createClient();

      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        throw error;
      }

      router.push(
        "/dashboard"
      );

      router.refresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Det oppstod en feil ved lagring av nytt passord."
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
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Velg nytt passord
          </CardTitle>

          <CardDescription>
            Skriv inn det nye passordet ditt nedenfor.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={
              handleUpdatePassword
            }
          >
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">
                  Nytt passord
                </Label>

                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minst 8 tegn"
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">
                  Gjenta nytt passord
                </Label>

                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={
                    confirmPassword
                  }
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
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
                  ? "Lagrer..."
                  : "Lagre nytt passord"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}