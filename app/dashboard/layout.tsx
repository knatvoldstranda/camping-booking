import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export const instant = false;

type StaffRole =
  | "admin"
  | "reception"
  | "read_only";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase =
    await createClient();

  // --------------------------------------------------
  // 1. KONTROLLER AT BRUKEREN ER INNLOGGET
  // --------------------------------------------------

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // --------------------------------------------------
  // 2. HENT ANSATTPROFIL
  // --------------------------------------------------

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

  // --------------------------------------------------
  // 3. KONTROLLER AT BRUKEREN HAR AKTIV TILGANG
  // --------------------------------------------------

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

  // --------------------------------------------------
  // 4. KONTROLLER AT ROLLEN ER GYLDIG
  // --------------------------------------------------

  const allowedRoles: StaffRole[] = [
    "admin",
    "reception",
    "read_only",
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

  const roleLabel =
    translateRole(role);

  const isAdmin =
    role === "admin";

  const isReadOnly =
    role === "read_only";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "250px minmax(0, 1fr)",
        minHeight: "100vh",
        background: "#f4f7f5",
      }}
    >
      <aside
        style={{
          background: "#18382a",
          color: "white",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              marginBottom: "5px",
              fontSize: "21px",
              fontWeight: "800",
            }}
          >
            Camping Booking
          </h2>

          <div
            style={{
              fontSize: "11px",
              color:
                "rgba(255,255,255,.6)",
              marginBottom: "28px",
            }}
          >
            Reservasjonssystem
          </div>

          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "9px",
            }}
          >
            <Link
              style={linkStyle}
              href="/dashboard"
            >
              Dashboard
            </Link>

            <Link
              style={linkStyle}
              href="/dashboard/calendar"
            >
              Kalender
            </Link>

            <Link
              style={linkStyle}
              href="/dashboard/reservations"
            >
              Reservasjoner
            </Link>

            <Link
              style={linkStyle}
              href="/dashboard/guests"
            >
              Gjester
            </Link>

            <Link
              style={linkStyle}
              href="/dashboard/places"
            >
              Plasser
            </Link>

            {isAdmin && (
              <>
                <div
                  style={{
                    height: "1px",
                    background:
                      "rgba(255,255,255,.14)",
                    margin:
                      "12px 0 4px",
                  }}
                />

                <div
                  style={{
                    fontSize: "10px",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      ".08em",
                    color:
                      "rgba(255,255,255,.55)",
                    padding:
                      "0 12px",
                  }}
                >
                  Administrasjon
                </div>

                <Link
                  style={linkStyle}
                  href="/dashboard/staff"
                >
                  Ansatte
                </Link>
              </>
            )}
          </nav>
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "30px",
          }}
        >
          {isReadOnly && (
            <div
              style={{
                background:
                  "rgba(255,255,255,.10)",
                border:
                  "1px solid rgba(255,255,255,.14)",
                borderRadius: "9px",
                padding: "10px",
                marginBottom: "14px",
                fontSize: "11px",
                lineHeight: "1.45",
              }}
            >
              <strong>
                Kun lesetilgang
              </strong>

              <div
                style={{
                  marginTop: "3px",
                  color:
                    "rgba(255,255,255,.7)",
                }}
              >
                Denne brukeren kan se data,
                men kan ikke opprette eller
                endre informasjon.
              </div>
            </div>
          )}

          <div
            style={{
              borderTop:
                "1px solid rgba(255,255,255,.15)",
              paddingTop: "16px",
            }}
          >
            <div
              style={{
                fontWeight: "800",
                fontSize: "13px",
              }}
            >
              {profile.full_name ||
                profile.email ||
                "Ansatt"}
            </div>

            {profile.email && (
              <div
                style={{
                  marginTop: "3px",
                  fontSize: "10px",
                  color:
                    "rgba(255,255,255,.58)",
                  wordBreak: "break-word",
                }}
              >
                {profile.email}
              </div>
            )}

            <div
              style={{
                marginTop: "9px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 8px",
                  borderRadius: "999px",
                  background:
                    isAdmin
                      ? "#d8b55b"
                      : "rgba(255,255,255,.14)",
                  color:
                    isAdmin
                      ? "#3e310c"
                      : "white",
                  fontSize: "10px",
                  fontWeight: "800",
                }}
              >
                {roleLabel}
              </span>
            </div>

            <div
              style={{
                marginTop: "14px",
              }}
            >
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>

      <main
        style={{
          padding: "30px",
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
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
    <div style={accessPageStyle}>
      <div style={accessCardStyle}>
        <h1
          style={{
            marginTop: 0,
            marginBottom: "10px",
          }}
        >
          {title}
        </h1>

        <p
          style={{
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>

        <p
          style={{
            color: "#6b7a72",
            fontSize: "13px",
          }}
        >
          Kontakt administrator hvis du mener
          dette er feil.
        </p>

        <div
          style={{
            marginTop: "18px",
          }}
        >
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

    read_only:
      "Kun lesing",
  };

  return roles[role];
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "12px",
  borderRadius: "8px",
  background:
    "rgba(255,255,255,0.08)",
  fontWeight: "700",
  fontSize: "13px",
};

const accessPageStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "#f4f7f5",
  padding: "20px",
};

const accessCardStyle = {
  width: "100%",
  maxWidth: "500px",
  background: "white",
  border:
    "1px solid #dbe4df",
  borderRadius: "14px",
  padding: "25px",
};