import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { updateStaff } from "./actions";

export const instant = false;

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}) {
  const params =
    await searchParams;

  const supabase =
    await createClient();

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

  const {
    data: staff,
    error,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      role,
      active,
      created_at
    `)
    .order(
      "created_at",
      {
        ascending: true,
      }
    );

  if (error) {
    return (
      <div>
        <h1 style={titleStyle}>
          Ansatte
        </h1>

        <div style={errorStyle}>
          Klarte ikke hente ansatte:{" "}
          {error.message}
        </div>
      </div>
    );
  }

  const list =
    staff ?? [];

  const activeStaff =
    list.filter(
      (person) =>
        person.active
    ).length;

  const admins =
    list.filter(
      (person) =>
        person.active &&
        person.role ===
          "admin"
    ).length;

  const reception =
    list.filter(
      (person) =>
        person.active &&
        person.role ===
          "reception"
    ).length;

  return (
    <div>
      <div style={topStyle}>
        <div>
          <h1 style={titleStyle}>
            Ansatte
          </h1>

          <p style={subtitleStyle}>
            Administrer roller og tilgang til reservasjonsprogrammet
          </p>
        </div>
      </div>

      {params.success && (
        <div style={successStyle}>
          Endringen er lagret.
        </div>
      )}

      {params.error && (
        <div style={errorStyle}>
          ⚠ {params.error}
        </div>
      )}

      <div style={statsGridStyle}>
        <StatCard
          title="Aktive ansatte"
          value={activeStaff}
        />

        <StatCard
          title="Administratorer"
          value={admins}
        />

        <StatCard
          title="Resepsjon"
          value={reception}
        />
      </div>

      <div
        style={{
          ...cardStyle,
          marginBottom:
            "20px",
        }}
      >
        <h2 style={sectionTitleStyle}>
          Roller
        </h2>

        <div style={roleGridStyle}>
          <RoleInfo
            title="Administrator"
            text="Full tilgang til systemet. Kan administrere ansatte og endre roller."
          />

          <RoleInfo
            title="Resepsjon"
            text="Kan håndtere kalender, gjester, reservasjoner, betalinger og vanlig daglig drift."
          />
        </div>
      </div>

      <div style={cardStyle}>
        <div style={sectionTopStyle}>
          <div>
            <h2 style={sectionTitleStyle}>
              Registrerte ansatte
            </h2>

            <p style={subtitleStyle}>
              {list.length} brukere
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: "14px",
          }}
        >
          {list.map(
            (person) => (
              <form
                key={
                  person.id
                }
                action={
                  updateStaff
                }
                style={
                  staffCardStyle
                }
              >
                <input
                  type="hidden"
                  name="staff_id"
                  value={
                    person.id
                  }
                />

                <div>
                  <label style={labelStyle}>
                    Navn

                    <input
                      name="full_name"
                      defaultValue={
                        person.full_name ||
                        ""
                      }
                      style={inputStyle}
                    />
                  </label>

                  <div
                    style={{
                      marginTop:
                        "6px",
                      color:
                        "#6b7a72",
                      fontSize:
                        "12px",
                    }}
                  >
                    {person.email ||
                      "Ingen e-post registrert"}
                  </div>
                </div>

                <label style={labelStyle}>
                  Rolle

                  <select
                    name="role"
                    defaultValue={
                      person.role ===
                      "admin"
                        ? "admin"
                        : "reception"
                    }
                    style={inputStyle}
                  >
                    <option value="admin">
                      Administrator
                    </option>

                    <option value="reception">
                      Resepsjon
                    </option>
                  </select>
                </label>

                <label
                  style={
                    activeStyle
                  }
                >
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={
                      person.active
                    }
                  />

                  Aktiv bruker
                </label>

                <button
                  type="submit"
                  style={
                    saveButtonStyle
                  }
                >
                  Lagre
                </button>
              </form>
            )
          )}
        </div>
      </div>

      <div
        style={{
          ...infoStyle,
          marginTop:
            "20px",
        }}
      >
        <strong>
          Nye ansatte
        </strong>

        <div
          style={{
            marginTop: "5px",
          }}
        >
          Nye brukere opprettes foreløpig via
          Supabase → Authentication → Users.
          Deretter kan Administrator velge
          hvilken rolle brukeren skal ha her.
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div style={cardStyle}>
      <div style={statLabelStyle}>
        {title}
      </div>

      <div style={statValueStyle}>
        {value}
      </div>
    </div>
  );
}

function RoleInfo({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div style={roleCardStyle}>
      <strong>
        {title}
      </strong>

      <div
        style={{
          color:
            "#6b7a72",
          fontSize:
            "12px",
          marginTop:
            "5px",
          lineHeight:
            "1.5",
        }}
      >
        {text}
      </div>
    </div>
  );
}

const topStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  marginBottom:
    "25px",
};

const titleStyle = {
  fontSize: "30px",
  fontWeight: "800",
  marginBottom: "5px",
};

const subtitleStyle = {
  color: "#6b7a72",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0,1fr))",
  gap: "15px",
  marginBottom: "20px",
};

const cardStyle = {
  background: "white",
  border:
    "1px solid #dbe4df",
  borderRadius: "14px",
  padding: "18px",
};

const statLabelStyle = {
  color: "#6b7a72",
  fontSize: "13px",
};

const statValueStyle = {
  fontSize: "28px",
  fontWeight: "800",
  marginTop: "5px",
};

const sectionTopStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  marginBottom:
    "15px",
};

const sectionTitleStyle = {
  fontSize: "20px",
  fontWeight: "800",
};

const roleGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0,1fr))",
  gap: "12px",
  marginTop: "15px",
};

const roleCardStyle = {
  padding: "14px",
  background: "#f7faf8",
  border:
    "1px solid #dbe4df",
  borderRadius: "10px",
};

const staffCardStyle = {
  display: "grid",
  gridTemplateColumns:
    "2fr 1fr auto auto",
  gap: "15px",
  alignItems: "end",
  padding: "15px",
  background: "#f7faf8",
  border:
    "1px solid #dbe4df",
  borderRadius: "11px",
};

const labelStyle = {
  display: "flex",
  flexDirection:
    "column" as const,
  gap: "6px",
  fontSize: "12px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  padding: "9px",
  border:
    "1px solid #cfd9d4",
  borderRadius: "8px",
  background: "white",
};

const activeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  fontWeight: "700",
  fontSize: "12px",
  minHeight: "39px",
};

const saveButtonStyle = {
  border: "none",
  background: "#2f6f4e",
  color: "white",
  padding: "10px 14px",
  borderRadius: "8px",
  fontWeight: "700",
  cursor: "pointer",
};

const infoStyle = {
  background: "#e8f2ec",
  color: "#315944",
  padding: "14px",
  border:
    "1px solid #c9ded2",
  borderRadius: "10px",
};

const successStyle = {
  background: "#dff1e7",
  color: "#235b3d",
  padding: "12px",
  borderRadius: "10px",
  marginBottom: "15px",
};

const errorStyle = {
  background: "#f8dddd",
  color: "#812d2d",
  padding: "12px",
  borderRadius: "10px",
  marginBottom: "15px",
};