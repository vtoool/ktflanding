export const itinerary = {
  outbound: {
    headerDate: "Thu, Nov 6",
    totalDuration: "13h 25m",
    segments: [
      {
        carrierName: "Lufthansa", flightNumber: "439",
        equipment: "Airbus A330-300",
        depart: { time: "4:15 pm", airport: "Dallas/Fort Worth", iata: "DFW", date: "Thu, Nov 6" },
        arrive: { time: "9:05 am", airport: "Frankfurt am Main", iata: "FRA", date: "Fri, Nov 7" },
        duration: "9h 50m", overnight: true, amenities: { wifi: true, bag: true, seat: true, power: true }
      },
      { layover: true, text: "1h 45m • Change planes in Frankfurt am Main (FRA)" },
      {
        carrierName: "Lufthansa", flightNumber: "232",
        equipment: "Airbus A321-100/200",
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
        depart: { time: "7:05 am", airport: "Rome Fiumicino", iata: "FCO", date: "Thu, Nov 27" },
        arrive: { time: "9:00 am", airport: "Frankfurt am Main", iata: "FRA", date: "Thu, Nov 27" },
        duration: "1h 55m", amenities: { wifi: true, bag: true, seat: true, power: true }
      },
      { layover: true, text: "1h 10m • Change planes in Frankfurt am Main (FRA)" },
      {
        carrierName: "Lufthansa", flightNumber: "438",
        equipment: "Airbus A330-300",
        depart: { time: "10:10 am", airport: "Frankfurt am Main", iata: "FRA", date: "Thu, Nov 27" },
        arrive: { time: "2:25 pm", airport: "Dallas/Fort Worth", iata: "DFW", date: "Thu, Nov 27" },
        duration: "11h 15m", amenities: { wifi: true, bag: true, seat: true, power: true }
      }
    ]
  },
  logoLH: "https://content.r9cdn.net/rimg/provider-logos/airlines/v/LH.png?crop=false&width=108&height=92&fallback=default2.png&_v=a1e3a69579474969d2b123789717863f"
};
