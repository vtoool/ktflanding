export const itinerary = {
  outbound: {
    headerDate: "Wed, Feb 11",
    totalDuration: "6h 50m",
    segments: [
      {
        carrierCode: "BA",
        carrierName: "British Airways",
        flightNumber: "1515",
        bookingClass: "J",
        cabin: "Business",
        status: "*SS1",
        fareBasis: "/DCBA",
        equipment: "Boeing 777-300ER",
        operatedBy: "Operated by American Airlines",
        depart: {
          time: "9:50 pm",
          airport: "New York John F Kennedy Intl",
          iata: "JFK",
          date: "Wed, Feb 11",
          gdsDayCode: "W"
        },
        arrive: {
          time: "9:40 am",
          airport: "London Heathrow",
          iata: "LHR",
          date: "Thu, Feb 12",
          gdsDayCode: "Q"
        },
        duration: "6h 50m",
        overnight: true,
        amenities: { wifi: true, bag: true, seat: true, power: true }
      }
    ]
  },
  inbound: {
    headerDate: "Thu, Feb 26",
    totalDuration: "8h 00m",
    segments: [
      {
        carrierCode: "BA",
        carrierName: "British Airways",
        flightNumber: "173",
        bookingClass: "J",
        cabin: "Business",
        status: "*SS1",
        fareBasis: "/DCBA",
        equipment: "Boeing 777",
        depart: {
          time: "11:20 am",
          airport: "London Heathrow",
          iata: "LHR",
          date: "Thu, Feb 26",
          gdsDayCode: "Q"
        },
        arrive: {
          time: "2:20 pm",
          airport: "New York John F Kennedy Intl",
          iata: "JFK",
          date: "Thu, Feb 26",
          gdsDayCode: "Q"
        },
        duration: "8h 00m",
        amenities: { wifi: true, bag: true, seat: true, power: true }
      }
    ]
  },
  logo: "https://content.r9cdn.net/rimg/provider-logos/airlines/v/BA.png?crop=false&width=108&height=92&fallback=default2.png&_v=865ecae53efd9f804cb9fea79226fe07"
};
