export const itinerary = {
  title: "Simple roundtrip",
  meta: "Fri, Oct 04 · London Heathrow (LHR) — Sun, Oct 13 · London Heathrow (LHR)",
  logoUrl: "https://content.r9cdn.net/rimg/provider-logos/airlines/v/LH.png?crop=false&width=108&height=92&fallback=default2.png&_v=a1e3a69579474969d2b123789717863f",
  outbound: {
    headerDate: "Thu, Nov 6",
    totalDuration: "13h 25m",
    segments: [
      {
        carrierName: "Lufthansa", flightNumber: "439",
        equipment: "Airbus A330-300",
        cabin: "Business",
        depart: { time: "4:15 pm", airport: "Dallas/Fort Worth", iata: "DFW", date: "Thu, Nov 6" },
        arrive: { time: "9:05 am", airport: "Frankfurt am Main", iata: "FRA", date: "Fri, Nov 7" },
        duration: "9h 50m", overnight: true, amenities: { wifi: true, bag: true, seat: true, power: true }
      },
      { layover: true, text: "1h 45m • Change planes in Frankfurt am Main (FRA)" },
      {
        carrierName: "Lufthansa", flightNumber: "232",
        equipment: "Airbus A321-100/200",
        cabin: "Business",
        depart: { time: "10:50 am", airport: "Frankfurt am Main", iata: "FRA", date: "Fri, Nov 7" },
        arrive: { time: "12:40 pm", airport: "Rome Fiumicino", iata: "FCO", date: "Fri, Nov 7" },
        duration: "1h 50m", amenities: { wifi: true, bag: true, seat: true, power: true }
      }
    ]
  },
  inbound: {
    headerDate: "Thu, Nov 27",
    totalDuration: "14h 20m",
    segments: [
      {
        carrierName: "Lufthansa", flightNumber: "243",
        equipment: "Airbus A321-100/200",
        cabin: "Business",
        depart: { time: "7:05 am", airport: "Rome Fiumicino", iata: "FCO", date: "Thu, Nov 27" },
        arrive: { time: "9:00 am", airport: "Frankfurt am Main", iata: "FRA", date: "Thu, Nov 27" },
        duration: "1h 55m", amenities: { wifi: true, bag: true, seat: true, power: true }
      },
      { layover: true, text: "1h 10m • Change planes in Frankfurt am Main (FRA)" },
      {
        carrierName: "Lufthansa", flightNumber: "438",
        equipment: "Airbus A330-300",
        cabin: "Business",
        depart: { time: "10:10 am", airport: "Frankfurt am Main", iata: "FRA", date: "Thu, Nov 27" },
        arrive: { time: "2:25 pm", airport: "Dallas/Fort Worth", iata: "DFW", date: "Thu, Nov 27" },
        duration: "11h 15m", amenities: { wifi: true, bag: true, seat: true, power: true }
      }
    ]
  }
};

export const longLayoverItinerary = {
  title: "Long layover (Business)",
  meta: "Fri, Aug 14 · Chicago O'Hare Intl (ORD) — Sun, Aug 16 · Hong Kong Intl (HKG)",
  logoUrl: "https://content.r9cdn.net/rimg/provider-logos/airlines/v/TK.png?crop=false&width=108&height=92&fallback=default1.png&_v=830308383d7798b210f9140f018cdbaf",
  clipboardText: [
    " 1 TK 6C 14AUG F ORDIST*SS1 810P 250P 15AUG J /DCTK /E",
    " 2 TK 70C 16AUG S ISTHKG*SS1 135A 515P /DCTK /E",
  ].join("\n"),
  outbound: {
    headerDate: "Fri, Aug 14",
    totalDuration: "32h 05m",
    segments: [
      {
        carrierName: "Turkish Airlines", flightNumber: "6",
        equipment: "Boeing 777-300ER",
        cabin: "Business",
        depart: { time: "8:10 pm", airport: "Chicago O'Hare Intl", iata: "ORD", date: "Fri, Aug 14" },
        arrive: { time: "2:50 pm", airport: "Istanbul", iata: "IST", date: "Sat, Aug 15" },
        duration: "10h 40m", overnight: true, amenities: { wifi: true, bag: true, seat: true, power: true }
      },
      { layover: true, text: "10h 45m • Change planes in Istanbul (IST)\nLong layover" },
      {
        carrierName: "Turkish Airlines", flightNumber: "70",
        equipment: "Boeing 777-300ER",
        cabin: "Business",
        depart: { time: "1:35 am", airport: "Istanbul", iata: "IST", date: "Sun, Aug 16" },
        arrive: { time: "5:15 pm", airport: "Hong Kong Intl", iata: "HKG", date: "Sun, Aug 16" },
        duration: "10h 40m", amenities: { wifi: true, bag: true, seat: true, power: true }
      }
    ]
  }
};
