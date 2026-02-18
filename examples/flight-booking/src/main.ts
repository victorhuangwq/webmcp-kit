import { defineTool, jsonContent } from 'webmcp-kit';
import { enableDevMode } from 'webmcp-kit/devtools';
import { z } from 'zod';

enableDevMode();

type CabinClass = 'economy' | 'premium' | 'business';

interface FlightOption {
  id: string;
  from: string;
  to: string;
  date: string;
  departure: string;
  arrival: string;
  stops: number;
  basePrice: number;
  cabinOptions: CabinClass[];
}

interface Traveler {
  firstName: string;
  lastName: string;
  age: number;
}

interface BookingState {
  search?: {
    from: string;
    to: string;
    date: string;
    passengers: number;
    cabin: CabinClass;
  };
  results: FlightOption[];
  selectedFlight?: FlightOption;
  travelers: Traveler[];
  extras: {
    checkedBags: number;
    seatSelection: boolean;
    travelInsurance: boolean;
  };
}

const allFlights: FlightOption[] = [
  {
    id: 'SF301',
    from: 'SFO',
    to: 'JFK',
    date: '2026-04-14',
    departure: '08:10',
    arrival: '16:45',
    stops: 0,
    basePrice: 289,
    cabinOptions: ['economy', 'premium', 'business'],
  },
  {
    id: 'SF455',
    from: 'SFO',
    to: 'ORD',
    date: '2026-04-14',
    departure: '09:25',
    arrival: '15:15',
    stops: 1,
    basePrice: 208,
    cabinOptions: ['economy', 'premium'],
  },
  {
    id: 'SF522',
    from: 'LAX',
    to: 'SEA',
    date: '2026-04-14',
    departure: '13:05',
    arrival: '15:44',
    stops: 0,
    basePrice: 136,
    cabinOptions: ['economy', 'business'],
  },
  {
    id: 'SF888',
    from: 'JFK',
    to: 'MIA',
    date: '2026-04-14',
    departure: '17:15',
    arrival: '20:28',
    stops: 0,
    basePrice: 162,
    cabinOptions: ['economy', 'premium', 'business'],
  },
  {
    id: 'SF919',
    from: 'SFO',
    to: 'JFK',
    date: '2026-04-14',
    departure: '11:00',
    arrival: '19:32',
    stops: 1,
    basePrice: 254,
    cabinOptions: ['economy', 'premium'],
  },
];

const cabinMultiplier: Record<CabinClass, number> = {
  economy: 1,
  premium: 1.45,
  business: 2.2,
};

const bagFee = 45;
const seatSelectionFeePerTraveler = 19;
const insuranceFeePerTraveler = 24;

let booking: BookingState = {
  results: [],
  travelers: [],
  extras: {
    checkedBags: 0,
    seatSelection: false,
    travelInsurance: false,
  },
};

function computeTotal(): number {
  if (!booking.selectedFlight || !booking.search) {
    return 0;
  }

  const travelerCount = Math.max(booking.travelers.length, booking.search.passengers);
  const base = booking.selectedFlight.basePrice * cabinMultiplier[booking.search.cabin] * travelerCount;
  const bags = booking.extras.checkedBags * bagFee;
  const seats = booking.extras.seatSelection ? travelerCount * seatSelectionFeePerTraveler : 0;
  const insurance = booking.extras.travelInsurance ? travelerCount * insuranceFeePerTraveler : 0;

  return base + bags + seats + insurance;
}

function markStep(stepId: string, done: boolean): void {
  const el = document.getElementById(stepId);
  if (!el) return;

  el.classList.toggle('done', done);
}

function updateUi(): void {
  markStep('step-search', !!booking.search);
  markStep('step-select', !!booking.selectedFlight);
  markStep('step-travelers', booking.travelers.length > 0);
  markStep('step-extras', booking.extras.checkedBags > 0 || booking.extras.seatSelection || booking.extras.travelInsurance);
  markStep('step-purchase', !!booking.selectedFlight && booking.travelers.length > 0);

  const status = document.getElementById('booking-status');
  if (!status) return;

  if (!booking.search) {
    status.textContent = 'No booking started. Use searchFlights to begin.';
    return;
  }

  const searchText = `${booking.search.from} → ${booking.search.to} on ${booking.search.date} (${booking.search.cabin})`;
  const selectedText = booking.selectedFlight
    ? `${booking.selectedFlight.id} ${booking.selectedFlight.departure}-${booking.selectedFlight.arrival}`
    : 'none';

  const extrasParts: string[] = [];
  if (booking.extras.checkedBags > 0) extrasParts.push(`${booking.extras.checkedBags} bag(s)`);
  if (booking.extras.seatSelection) extrasParts.push('seat selection');
  if (booking.extras.travelInsurance) extrasParts.push('insurance');

  status.innerHTML = [
    `<div><strong>Search:</strong> ${searchText}</div>`,
    `<div><strong>Selected:</strong> ${selectedText}</div>`,
    `<div><strong>Travelers:</strong> ${booking.travelers.length}</div>`,
    `<div><strong>Extras:</strong> ${extrasParts.length > 0 ? extrasParts.join(', ') : 'none'}</div>`,
    `<div style="margin-top: 8px;"><strong>Estimated total:</strong> $${computeTotal().toFixed(2)}</div>`,
  ].join('');
}

const searchFlightsTool = defineTool({
  name: 'searchFlights',
  description: 'Search available flights by route, date, passenger count, and cabin class',
  inputSchema: z.object({
    from: z.string().length(3).describe('3-letter departure airport code, e.g., SFO'),
    to: z.string().length(3).describe('3-letter arrival airport code, e.g., JFK'),
    date: z.string().describe('Travel date in YYYY-MM-DD format'),
    passengers: z.number().int().min(1).max(6).describe('Number of passengers'),
    cabin: z.enum(['economy', 'premium', 'business']).default('economy'),
  }),
  execute: async ({ from, to, date, passengers, cabin }) => {
    const routeMatches = allFlights.filter(
      (flight) =>
        flight.from.toLowerCase() === from.toLowerCase() &&
        flight.to.toLowerCase() === to.toLowerCase() &&
        flight.date === date &&
        flight.cabinOptions.includes(cabin)
    );

    booking = {
      search: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        date,
        passengers,
        cabin,
      },
      results: routeMatches,
      selectedFlight: undefined,
      travelers: [],
      extras: {
        checkedBags: 0,
        seatSelection: false,
        travelInsurance: false,
      },
    };

    updateUi();

    return jsonContent({
      summary: `${routeMatches.length} flight(s) found`,
      flights: routeMatches.map((flight) => ({
        id: flight.id,
        from: flight.from,
        to: flight.to,
        date: flight.date,
        departure: flight.departure,
        arrival: flight.arrival,
        stops: flight.stops,
        pricePerTraveler: parseFloat((flight.basePrice * cabinMultiplier[cabin]).toFixed(2)),
      })),
    });
  },
});

const selectFlightTool = defineTool({
  name: 'selectFlight',
  description: 'Select one flight from the search results',
  inputSchema: z.object({
    flightId: z.string().describe('Flight ID returned by searchFlights (e.g., SF301)'),
  }),
  execute: async ({ flightId }) => {
    if (!booking.search) {
      return 'Run searchFlights first before selecting a flight.';
    }

    const selected = booking.results.find((flight) => flight.id === flightId.toUpperCase());
    if (!selected) {
      return `Flight ${flightId} is not in current search results. Available: ${booking.results.map((f) => f.id).join(', ') || 'none'}`;
    }

    booking.selectedFlight = selected;
    updateUi();

    return jsonContent({
      selectedFlight: {
        id: selected.id,
        route: `${selected.from}-${selected.to}`,
        departure: selected.departure,
        arrival: selected.arrival,
        stops: selected.stops,
      },
      note: 'Next step: add travelers with addTraveler.',
    });
  },
});

const addTravelerTool = defineTool({
  name: 'addTraveler',
  description: 'Add a traveler profile to the current booking',
  inputSchema: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    age: z.number().int().min(0).max(120),
  }),
  execute: async ({ firstName, lastName, age }) => {
    if (!booking.search || !booking.selectedFlight) {
      return 'Search and select a flight before adding travelers.';
    }

    if (booking.travelers.length >= booking.search.passengers) {
      return `Traveler limit reached (${booking.search.passengers}).`;
    }

    booking.travelers.push({ firstName, lastName, age });
    updateUi();

    return jsonContent({
      travelers: booking.travelers,
      remaining: booking.search.passengers - booking.travelers.length,
    });
  },
});

const addExtrasTool = defineTool({
  name: 'addExtras',
  description: 'Configure add-on options like checked bags, seat selection, and insurance',
  inputSchema: z.object({
    checkedBags: z.number().int().min(0).max(6).optional().describe('Total checked bags for the booking'),
    seatSelection: z.boolean().optional().describe('Reserve preferred seats for all travelers'),
    travelInsurance: z.boolean().optional().describe('Add trip insurance for all travelers'),
  }),
  execute: async ({ checkedBags, seatSelection, travelInsurance }) => {
    if (!booking.search || !booking.selectedFlight) {
      return 'Search and select a flight before adding extras.';
    }

    if (checkedBags !== undefined) booking.extras.checkedBags = checkedBags;
    if (seatSelection !== undefined) booking.extras.seatSelection = seatSelection;
    if (travelInsurance !== undefined) booking.extras.travelInsurance = travelInsurance;

    updateUi();

    return jsonContent({
      extras: booking.extras,
      estimatedTotal: parseFloat(computeTotal().toFixed(2)),
    });
  },
});

const reviewBookingTool = defineTool({
  name: 'reviewBooking',
  description: 'Review current booking details and estimated total price',
  inputSchema: z.object({}),
  execute: async () => {
    if (!booking.search || !booking.selectedFlight) {
      return jsonContent({ message: 'No active booking. Run searchFlights to begin.' });
    }

    return jsonContent({
      search: booking.search,
      selectedFlight: booking.selectedFlight,
      travelers: booking.travelers,
      extras: booking.extras,
      estimatedTotal: parseFloat(computeTotal().toFixed(2)),
    });
  },
});

const purchaseFlightTool = defineTool({
  name: 'purchaseFlight',
  description: 'Finalize and purchase the current booking. Requires confirmation.',
  inputSchema: z.object({
    paymentMethod: z.enum(['card', 'wallet', 'points']).default('card'),
    email: z.string().email().describe('Booking confirmation email address'),
  }),
  execute: async ({ paymentMethod, email }, agent) => {
    if (!booking.search || !booking.selectedFlight) {
      return 'No active booking. Search and select a flight first.';
    }

    if (booking.travelers.length !== booking.search.passengers) {
      return `Traveler details incomplete. Added ${booking.travelers.length}/${booking.search.passengers}.`;
    }

    const total = computeTotal();
    const confirmation = await agent.requestUserInteraction({
      type: 'confirmation',
      prompt: `Confirm purchase for $${total.toFixed(2)}?\nFlight: ${booking.selectedFlight.id} (${booking.selectedFlight.from}-${booking.selectedFlight.to})\nTravelers: ${booking.travelers.length}\nPayment: ${paymentMethod}\nEmail: ${email}`,
    });

    if (!confirmation.confirmed) {
      return 'Purchase cancelled.';
    }

    const bookingRef = `BK${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const response = jsonContent({
      status: 'confirmed',
      bookingReference: bookingRef,
      totalPaid: parseFloat(total.toFixed(2)),
      paymentMethod,
      email,
      message: `Booking confirmed. Reference: ${bookingRef}`,
    });

    booking = {
      results: [],
      travelers: [],
      extras: {
        checkedBags: 0,
        seatSelection: false,
        travelInsurance: false,
      },
    };

    updateUi();
    return response;
  },
});

searchFlightsTool.register();
selectFlightTool.register();
addTravelerTool.register();
addExtrasTool.register();
reviewBookingTool.register();
purchaseFlightTool.register();

updateUi();

console.log('✈️ Flight Booking tools registered! Open the WebMCP DevTools panel to interact.');
