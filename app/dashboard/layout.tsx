import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

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
    return (
      <div style={accessPageStyle}>
        <div style={accessCardStyle}>
          <h1>Ikke innlogget</h1>

          <p>
            Du må logge inn for å bruke
            reservasjonsprogrammet.
          </p>

          <Link
            href="/auth/login"
            style={primaryButtonStyle}
          >
            Gå til innlogging
          </Link>
        </div>
      </div>
    );
  }

  const {
    data: profile,
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
    !profile ||
    !profile.active
  ) {
    return (
      <div style={accessPageStyle}>
        <div style={accessCardStyle}>
          <h1>
            Ingen aktiv tilgang
          </h1>

          <p>
            Brukeren din har ikke
            aktiv tilgang til
            reservasjonsprogrammet.
          </p>

          <p
            style={{
              color: "#6b7a72",
              fontSize: "13px",
            }}
          >
            Kontakt administrator.
          </p>
        </div>
      </div>
    );
  }

  const roleLabel =
    translateRole(
      profile.role
    );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "250px 1fr",
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
          flexDirection:
            "column",
        }}
      >
        <div>
          <h2
            style={{
              marginBottom:
                "5px",
              fontSize:
                "21px",
              fontWeight:
                "800",
            }}
          >
            Camping Booking
          </h2>

          <div
            style={{
              fontSize:
                "11px",
              color:
                "rgba(255,255,255,.6)",
              marginBottom:
                "28px",
            }}
          >
            Reservasjonssystem
          </div>

          <nav
            style={{
              display: "flex",
              flexDirection:
                "column",
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

            {profile.role ===
              "admin" && (
              <>
                <div
                  style={{
                    height:
                      "1px",
                    background:
                      "rgba(255,255,255,.14)",
                    margin:
                      "12px 0 4px",
                  }}
                />

                <div
                  style={{
                    fontSize:
                      "10px",
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
                  style={
                    linkStyle
                  }
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
            marginTop:
              "auto",
            paddingTop:
              "30px",
          }}
        >
          <div
            style={{
              borderTop:
                "1px solid rgba(255,255,255,.15)",
              paddingTop:
                "16px",
            }}
          >
            <div
              style={{
                fontWeight:
                  "800",
                fontSize:
                  "13px",
              }}
            >
              {profile.full_name ||
                profile.email ||
                "Ansatt"}
            </div>

            {profile.email && (
              <div
                style={{
                  marginTop:
                    "3px",
                  fontSize:
                    "10px",
                  color:
                    "rgba(255,255,255,.58)",
                  wordBreak:
                    "break-word",
                }}
              >
                {profile.email}
              </div>
            )}

            <div
              style={{
                marginTop:
                  "9px",
              }}
            >
              <span
                style={{
                  display:
                    "inline-block",
                  padding:
                    "4px 8px",
                  borderRadius:
                    "999px",
                  background:
                    profile.role ===
                    "admin"
                      ? "#d8b55b"
                      : "rgba(255,255,255,.14)",
                  color:
                    profile.role ===
                    "admin"
                      ? "#3e310c"
                      : "white",
                  fontSize:
                    "10px",
                  fontWeight:
                    "800",
                }}
              >
                {roleLabel}
              </span>
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

function translateRole(
  role: string
) {
  const roles: Record<
    string,
    string
  > = {
    admin:
      "Administrator",

    reception:
      "Resepsjon",

    read_only:
      "Kun lesing",
  };

  return (
    roles[role] ??
    role
  );
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
  maxWidth: "500px",
  background: "white",
  border:
    "1px solid #dbe4df",
  borderRadius: "14px",
  padding: "25px",
};

const primaryButtonStyle = {
  display: "inline-block",
  marginTop: "15px",
  background: "#2f6f4e",
  color: "white",
  padding: "10px 14px",
  borderRadius: "9px",
  textDecoration: "none",
  fontWeight: "700",
};