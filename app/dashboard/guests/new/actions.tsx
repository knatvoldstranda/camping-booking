"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createGuest(formData: FormData) {
  const supabase = await createClient();

  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const country = String(formData.get("country") || "").trim();
  const vehicleReg = String(formData.get("vehicle_reg") || "").trim();

  if (!firstName || !lastName) {
    redirect("/dashboard/guests/new?error=Navn mangler");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("guests").insert({
    first_name: firstName,
    last_name: lastName,
    email: email || null,
    phone: phone || null,
    country: country || null,
    vehicle_reg: vehicleReg || null,
    created_by: user?.id ?? null,
  });

  if (error) {
    redirect(
      `/dashboard/guests/new?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/dashboard/guests");
}