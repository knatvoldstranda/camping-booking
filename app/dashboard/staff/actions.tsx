"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateStaff(
  formData: FormData
) {
  const supabase =
    await createClient();

  const targetId =
    String(
      formData.get(
        "staff_id"
      ) || ""
    );

  const fullName =
    String(
      formData.get(
        "full_name"
      ) || ""
    ).trim();

  const role =
    String(
      formData.get(
        "role"
      ) || ""
    );

  const active =
    formData.get(
      "active"
    ) === "on";

  const validRoles = [
    "admin",
    "reception",
  ];

  if (
    !targetId ||
    !validRoles.includes(
      role
    )
  ) {
    redirect(
      "/dashboard/staff?error=" +
        encodeURIComponent(
          "Ugyldige ansattdata."
        )
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/auth/login"
    );
  }

  const {
    data: currentProfile,
  } = await supabase
    .from("profiles")
    .select(
      "role, active"
    )
    .eq(
      "id",
      user.id
    )
    .single();

  if (
    !currentProfile ||
    !currentProfile.active ||
    currentProfile.role !==
      "admin"
  ) {
    redirect(
      "/dashboard"
    );
  }

  if (
    targetId === user.id &&
    (
      role !== "admin" ||
      !active
    )
  ) {
    redirect(
      "/dashboard/staff?error=" +
        encodeURIComponent(
          "Du kan ikke fjerne din egen administratorrolle eller deaktivere din egen bruker."
        )
    );
  }

  const { error } =
    await supabase
      .from("profiles")
      .update({
        full_name:
          fullName || null,

        role,

        active,
      })
      .eq(
        "id",
        targetId
      );

  if (error) {
    redirect(
      "/dashboard/staff?error=" +
        encodeURIComponent(
          error.message
        )
    );
  }

  revalidatePath(
    "/dashboard/staff"
  );

  revalidatePath(
    "/dashboard",
    "layout"
  );

  redirect(
    "/dashboard/staff?success=1"
  );
}