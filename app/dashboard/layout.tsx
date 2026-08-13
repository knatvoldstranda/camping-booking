import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export const instant = false;

type StaffRole =
  | "admin"
  | "reception";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      role,
      active
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !profile.active
  ) {
    return (
      <AccessDeniedPage
        title="Ingen aktiv tilgang"
        message="Brukeren din har ikke aktiv tilgang til reservasjonsprogrammet."
      />
    );
  }

  const allowedRoles: StaffRole[] = [
    "admin",
    "reception",
  ];

  if (
    !allowedRoles.includes(
      profile.role as StaffRole
    )
  ) {
    return (
      <AccessDeniedPage
        title="Ugyldig brukerrolle"
        message="Brukeren din har en rolle som ikke er godkjent for reservasjonsprogrammet."
      />
    );
  }

  const role =
    profile.role as StaffRole;

  const isAdmin =
    role === "admin";

  const roleLabel =
    translateRole(role);

  const displayName =
    profile.full_name ||
    profile.email ||
    "Ansatt";

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      {/* DESKTOPMENY */}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col bg-[#18382a] px-4 py-6 text-white lg:flex">
        <div>
          <h2 className="m-0 text-[21px] font-extrabold">
            Camping Booking
          </h2>

          <div className="mb-7 mt-1 text-[11px] text-white/60">
            Reservasjonssystem
          </div>

          <Navigation
            isAdmin={isAdmin}
          />
        </div>

        <div className="mt-auto pt-8">
          <div className="border-t border-white/15 pt-4">
            <UserInfo
              displayName={
                displayName
              }
              email={
                profile.email
              }
              roleLabel={
                roleLabel
              }
              isAdmin={
                isAdmin
              }
            />

            <div className="mt-4">
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>

      {/* MOBIL / NETTBRETT TOPP */}

      <div className="sticky top-0 z-40 border-b border-black/10 bg-[#18382a] text-white lg:hidden">
        <div className="flex min-h-[64px] items-center justify-between gap-4 px-4">
          <div>
            <div className="text-[17px] font-extrabold">
              Camping Booking
            </div>

            <div className="text-[10px] text-white/60">
              {roleLabel}
            </div>
          </div>

          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15">
              ☰ Meny
            </summary>

            <div className="absolute right-0 top-[48px] w-[290px] max-w-[calc(100vw-24px)] rounded-xl border border-white/10 bg-[#18382a] p-3 shadow-2xl">
              <Navigation
                isAdmin={
                  isAdmin
                }
              />

              <div className="mt-4 border-t border-white/15 pt-4">
                <UserInfo
                  displayName={
                    displayName
                  }
                  email={
                    profile.email
                  }
                  roleLabel={
                    roleLabel
                  }
                  isAdmin={
                    isAdmin
                  }
                />

                <div className="mt-4">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* INNHOLD */}

      <main className="min-w-0 p-4 sm:p-5 md:p-6 lg:ml-[250px] lg:p-[30px]">
        <div className="mx-auto w-full max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}

function Navigation({
  isAdmin,
}: {
  isAdmin: boolean;
}) {
  return (
    <nav className="flex flex-col gap-2">
      <MenuLink
        href="/dashboard"
        label="Dashboard"
      />

      <MenuLink
        href="/dashboard/calendar"
        label="Kalender"
      />

      <MenuLink
        href="/dashboard/reservations"
        label="Reservasjoner"
      />

      <MenuLink
        href="/dashboard/guests"
        label="Gjester"
      />

      <MenuLink
        href="/dashboard/places"
        label="Plasser"
      />

      {isAdmin && (
        <>
          <div className="my-2 h-px bg-white/15" />

          <div className="px-3 text-[10px] uppercase tracking-[0.08em] text-white/55">
            Administrasjon
          </div>

          <MenuLink
            href="/dashboard/staff"
            label="Ansatte"
          />
        </>
      )}
    </nav>
  );
}

function MenuLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg bg-white/[0.08] px-3 py-3 text-[13px] font-bold text-white no-underline transition hover:bg-white/[0.15]"
    >
      {label}
    </Link>
  );
}

function UserInfo({
  displayName,
  email,
  roleLabel,
  isAdmin,
}: {
  displayName: string;
  email: string | null;
  roleLabel: string;
  isAdmin: boolean;
}) {
  return (
    <>
      <div className="text-[13px] font-extrabold">
        {displayName}
      </div>

      {email && (
        <div className="mt-1 break-words text-[10px] text-white/60">
          {email}
        </div>
      )}

      <div className="mt-2">
        <span
          className={
            isAdmin
              ? "inline-block rounded-full bg-[#d8b55b] px-2 py-1 text-[10px] font-extrabold text-[#3e310c]"
              : "inline-block rounded-full bg-white/15 px-2 py-1 text-[10px] font-extrabold text-white"
          }
        >
          {roleLabel}
        </span>
      </div>
    </>
  );
}

function AccessDeniedPage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f4f7f5] p-5">
      <div className="w-full max-w-[500px] rounded-[14px] border border-[#dbe4df] bg-white p-6">
        <h1 className="mb-2 mt-0 text-2xl font-bold">
          {title}
        </h1>

        <p className="leading-6">
          {message}
        </p>

        <p className="text-[13px] text-[#6b7a72]">
          Kontakt administrator hvis du mener
          dette er feil.
        </p>

        <div className="mt-5">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}

function translateRole(
  role: StaffRole
) {
  const roles: Record<
    StaffRole,
    string
  > = {
    admin:
      "Administrator",

    reception:
      "Resepsjon",
  };

  return roles[role];
}