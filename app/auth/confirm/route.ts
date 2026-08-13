import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest
) {
  const { searchParams } =
    new URL(request.url);

  const tokenHash =
    searchParams.get("token_hash");

  const type =
    searchParams.get("type") as
      | EmailOtpType
      | null;

  const next =
    searchParams.get("next") ||
    "/dashboard";

  const redirectTo =
    request.nextUrl.clone();

  redirectTo.pathname = next;

  redirectTo.searchParams.delete(
    "token_hash"
  );

  redirectTo.searchParams.delete(
    "type"
  );

  redirectTo.searchParams.delete(
    "next"
  );

  if (
    tokenHash &&
    type
  ) {
    const supabase =
      await createClient();

    const { error } =
      await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

    if (!error) {
      return NextResponse.redirect(
        redirectTo
      );
    }

    const errorUrl =
      request.nextUrl.clone();

    errorUrl.pathname =
      "/auth/error";

    errorUrl.search =
      "";

    errorUrl.searchParams.set(
      "error",
      error.message
    );

    return NextResponse.redirect(
      errorUrl
    );
  }

  const errorUrl =
    request.nextUrl.clone();

  errorUrl.pathname =
    "/auth/error";

  errorUrl.search =
    "";

  errorUrl.searchParams.set(
    "error",
    "Manglende eller ugyldig bekreftelsestoken."
  );

  return NextResponse.redirect(
    errorUrl
  );
}