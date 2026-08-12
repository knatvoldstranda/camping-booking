import { createClient } from "@/lib/supabase/server";

export default async function PlacesPage() {
  const supabase = await createClient();

  const { data: places, error } = await supabase
    .from("places")
    .select("id, code, name, place_type, capacity, has_power, active")
    .order("code");

  if (error) {
    return (
      <main style={{ padding: "30px" }}>
        <h1>Feil ved henting av plasser</h1>
        <pre>{error.message}</pre>
      </main>
    );
  }

  return (
    <main style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>Campingplasser</h1>

      <p>Antall plasser: {places?.length ?? 0}</p>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th style={cellStyle}>Kode</th>
            <th style={cellStyle}>Navn</th>
            <th style={cellStyle}>Type</th>
            <th style={cellStyle}>Kapasitet</th>
            <th style={cellStyle}>Strøm</th>
            <th style={cellStyle}>Aktiv</th>
          </tr>
        </thead>

        <tbody>
          {places?.map((place) => (
            <tr key={place.id}>
              <td style={cellStyle}>{place.code}</td>
              <td style={cellStyle}>{place.name}</td>
              <td style={cellStyle}>{place.place_type}</td>
              <td style={cellStyle}>{place.capacity}</td>
              <td style={cellStyle}>{place.has_power ? "Ja" : "Nei"}</td>
              <td style={cellStyle}>{place.active ? "Ja" : "Nei"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

const cellStyle = {
  border: "1px solid #ccc",
  padding: "10px",
  textAlign: "left" as const,
};