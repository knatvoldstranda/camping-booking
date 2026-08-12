import { createClient } from "@/lib/supabase/server";

export default async function PlacesPage() {
  const supabase = await createClient();

  const { data: places, error } = await supabase
    .from("places")
    .select("id, code, name, place_type, capacity, has_power, active")
    .order("code");

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: "700" }}>
          Plasser
        </h1>

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f8dddd",
            borderRadius: "10px",
          }}
        >
          Feil ved henting av plasser: {error.message}
        </div>
      </div>
    );
  }

  const motorhomePlaces =
    places?.filter((place) => place.place_type === "motorhome_caravan") ?? [];

  const tentPlaces =
    places?.filter((place) => place.place_type === "tent") ?? [];

  const cabins =
    places?.filter((place) => place.place_type === "cabin") ?? [];

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
          Plasser
        </h1>

        <p style={{ color: "#6b7a72" }}>
          Oversikt over alle reserverbare plasser
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "15px",
          marginBottom: "25px",
        }}
      >
        <StatCard title="Totalt" value={places?.length ?? 0} />
        <StatCard title="Bobil / Campingvogn" value={motorhomePlaces.length} />
        <StatCard title="Teltplasser" value={tentPlaces.length} />
        <StatCard title="Hytter" value={cabins.length} />
      </div>

      <PlaceSection
        title="Bobil / Campingvogn"
        places={motorhomePlaces}
      />

      <PlaceSection
        title="Teltplasser"
        places={tentPlaces}
      />

      <PlaceSection
        title="Hytter"
        places={cabins}
      />
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
          color: "#6b7a72",
          fontSize: "13px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "30px",
          fontWeight: "800",
          marginTop: "5px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PlaceSection({
  title,
  places,
}: {
  title: string;
  places: any[];
}) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #dbe4df",
        borderRadius: "14px",
        padding: "18px",
        marginBottom: "20px",
      }}
    >
      <h2
        style={{
          fontSize: "20px",
          fontWeight: "700",
          marginBottom: "15px",
        }}
      >
        {title}
      </h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={headerStyle}>Kode</th>
            <th style={headerStyle}>Navn</th>
            <th style={headerStyle}>Kapasitet</th>
            <th style={headerStyle}>Strøm</th>
            <th style={headerStyle}>Status</th>
          </tr>
        </thead>

        <tbody>
          {places.map((place) => (
            <tr key={place.id}>
              <td style={cellStyle}>{place.code}</td>
              <td style={cellStyle}>
                <strong>{place.name}</strong>
              </td>
              <td style={cellStyle}>{place.capacity} personer</td>
              <td style={cellStyle}>
                {place.has_power ? "Ja" : "Nei"}
              </td>
              <td style={cellStyle}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "5px 9px",
                    borderRadius: "20px",
                    background: place.active
                      ? "#dff1e7"
                      : "#eeeeee",
                    color: place.active
                      ? "#235b3d"
                      : "#666666",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  {place.active ? "Aktiv" : "Inaktiv"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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