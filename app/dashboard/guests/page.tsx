import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function GuestsPage() {
  const supabase = await createClient();

  const { data: guests, error } = await supabase
    .from("guests")
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      country,
      vehicle_reg,
      reservations (
        id,
        arrival_date,
        departure_date
      )
    `)
    .order("last_name");

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: "30px", fontWeight: "800" }}>
          Gjester
        </h1>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f8dddd",
            borderRadius: "10px",
          }}
        >
          Feil ved henting av gjester: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "25px" }}>
        <h1
          style={{
            fontSize: "30px",
            fontWeight: "800",
            marginBottom: "5px",
          }}
        >
          Gjester
<Link
  href="/dashboard/guests/new"
  style={{
    display: "inline-block",
    background: "#2f6f4e",
    color: "white",
    padding: "10px 14px",
    borderRadius: "9px",
    textDecoration: "none",
    fontWeight: "700",
    marginBottom: "20px",
  }}
>
  + Ny gjest
</Link>
        </h1>

        <p style={{ color: "#6b7a72" }}>
          Oversikt over registrerte gjester
        </p>
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid #dbe4df",
          borderRadius: "14px",
          padding: "18px",
        }}
      >
        <div
          style={{
            marginBottom: "18px",
            fontWeight: "700",
          }}
        >
          Antall gjester: {guests?.length ?? 0}
        </div>

        {guests && guests.length > 0 ? (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={headerStyle}>Navn</th>
                <th style={headerStyle}>Telefon</th>
                <th style={headerStyle}>E-post</th>
                <th style={headerStyle}>Land</th>
                <th style={headerStyle}>Bilnummer</th>
                <th style={headerStyle}>Besøk</th>
              </tr>
            </thead>

            <tbody>
              {guests.map((guest) => (
                <tr key={guest.id}>
                  <td style={cellStyle}>
                    <Link
  href={`/dashboard/guests/${guest.id}`}
  style={{
    color: "#2f6f4e",
    fontWeight: "800",
    textDecoration: "none",
  }}
>
  {guest.first_name} {guest.last_name}
</Link>
                  </td>

                  <td style={cellStyle}>
                    {guest.phone || "–"}
                  </td>

                  <td style={cellStyle}>
                    {guest.email || "–"}
                  </td>

                  <td style={cellStyle}>
                    {guest.country || "–"}
                  </td>

                  <td style={cellStyle}>
                    {guest.vehicle_reg || "–"}
                  </td>

                  <td style={cellStyle}>
                    {guest.reservations?.length ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "#6b7a72",
            }}
          >
            Ingen gjester er registrert ennå.
          </div>
        )}
      </div>
    </div>
  );
}

const headerStyle = {
  textAlign: "left" as const,
  padding: "10px",
  borderBottom: "1px solid #dbe4df",
  fontSize: "12px",
  color: "#6b7a72",
};

const cellStyle = {
  padding: "12px 10px",
  borderBottom: "1px solid #e5ebe8",
};