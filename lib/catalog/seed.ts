import type { Industry, Product } from "./types";

// Seed catalog. SKUs ending in -TBC are placeholders until the owner confirms model numbers.
const UPDATED = "2026-10-11";
const pcs = { units: ["pcs" as const], minQty: null };

export const industries: Industry[] = [
  {
    slug: "fan",
    name: "Fan",
    headline: "Components for fan manufacturers.",
    intro:
      "Motors, capacitors and bearings for ceiling, pedestal and exhaust fan assemblies. Confirm the exact rating for your design with our team.",
    guidance: [
      {
        title: "Electrical requirements",
        body: "Supply voltage, motor type, capacitance and duty for the actual assembly.",
      },
      {
        title: "Physical fit",
        body: "Shaft size, mounting pattern and space inside the motor housing.",
      },
      {
        title: "Supply requirements",
        body: "Quantity, packaging and the date you need parts on the line.",
      },
    ],
  },
  {
    slug: "washing-machine",
    name: "Washing machine",
    headline: "Components for washing machine manufacturers.",
    intro:
      "Timers, switches, capacitors and bearings for washer assemblies. Share your current part or drawing and we will confirm compatibility.",
    guidance: [
      {
        title: "Electrical requirements",
        body: "Contact rating, timing range and terminal arrangement.",
      },
      {
        title: "Physical fit",
        body: "Panel cut-out, shaft length and mounting bracket.",
      },
      {
        title: "Supply requirements",
        body: "Monthly volume, packaging and delivery schedule.",
      },
    ],
  },
  {
    slug: "cooler",
    name: "Cooler",
    headline: "Components for cooler manufacturers.",
    intro:
      "Pumps and mini motor options for your assembly. Confirm the exact specification with our team.",
    guidance: [
      {
        title: "Electrical requirements",
        body: "Voltage, power and duty for the actual assembly.",
      },
      {
        title: "Physical fit",
        body: "Mounting, outlet and space constraints.",
      },
      {
        title: "Supply requirements",
        body: "Quantity, packaging and required date.",
      },
    ],
  },
  {
    slug: "heater",
    name: "Heater",
    headline: "Components for heater manufacturers.",
    intro:
      "Heater rods and geyser elements for space and water heaters. Ratings and dimensions are confirmed per order.",
    guidance: [
      {
        title: "Electrical requirements",
        body: "Wattage, voltage and terminal type.",
      },
      {
        title: "Physical fit",
        body: "Length, sheath diameter, flange or thread size.",
      },
      {
        title: "Supply requirements",
        body: "Quantity, order unit and delivery date.",
      },
    ],
  },
  {
    slug: "kitchen-appliance",
    name: "Kitchen appliance",
    headline: "Components for kitchen appliance manufacturers.",
    intro:
      "Induction cooker supply and related parts. Tell us whether you need complete units or spare parts.",
    guidance: [
      {
        title: "Electrical requirements",
        body: "Power rating, supply voltage and control type.",
      },
      {
        title: "Physical fit",
        body: "Glass size, coil diameter and housing dimensions.",
      },
      {
        title: "Supply requirements",
        body: "Complete units or spares, quantity and date.",
      },
    ],
  },
];

export const products: Product[] = [
  {
    slug: "water-cooler-pump-lh1020",
    family: "Water cooler pump",
    name: "Water cooler pump",
    model: "LH1020",
    modelNote: "LH1020",
    summary: "Submersible pump for evaporative air coolers.",
    description:
      "A compact submersible pump that circulates water to the cooler pads. Supplied in branded retail boxes, ready for assembly lines and spares counters.",
    cardSpecs: ["25 W", "Hmax 1.8 m", "Qmax 1,000 L/h"],
    specs: [
      { label: "Power", value: "25 W" },
      { label: "Maximum head", value: "1.8 m" },
      { label: "Maximum flow", value: "1,000 L/h" },
      { label: "Supply voltage", value: null },
      { label: "Outlet size", value: null },
      { label: "Cable length", value: null },
      { label: "Minimum order", value: null },
      { label: "Lead time", value: null },
    ],
    specNote: "Ratings as printed on the LH1020 packaging.",
    industries: ["cooler"],
    variants: [{ sku: "LH1020", name: "LH1020", ...pcs }],
    updatedAt: UPDATED,
  },
  {
    slug: "mini-fan-motor-dc-geared",
    family: "Mini fan motor",
    name: "Mini fan motor, DC geared",
    model: null,
    modelNote: "Exact model to confirm",
    summary: "DC geared motor for cooler louvres and small fan drives.",
    description:
      "A 12 V DC motor with a reduction gearbox and flanged mounting, used to drive cooler louvres and slow-turning fan mechanisms.",
    cardSpecs: ["DC geared", "12 V DC", "Flange mount"],
    specs: [
      { label: "Motor type", value: "DC geared" },
      { label: "Rated voltage", value: "12 V DC" },
      { label: "Output speed", value: null },
      { label: "Shaft size", value: null },
      { label: "Minimum order", value: null },
      { label: "Lead time", value: null },
    ],
    specNote: null,
    industries: ["fan", "cooler"],
    variants: [{ sku: "MFM-DC-TBC", name: "DC geared", ...pcs }],
    updatedAt: UPDATED,
  },
  {
    slug: "mini-fan-motor-ac-synchronous",
    family: "Mini fan motor",
    name: "Mini fan motor, AC synchronous",
    model: null,
    modelNote: "Exact model to confirm",
    summary: "AC synchronous motor for oscillation and louvre drives.",
    description:
      "A low-speed 220 V synchronous motor for fan oscillation and cooler louvre drives. Compact round body with two mounting ears.",
    cardSpecs: ["AC 220 V", "4 W", "2.5–3 RPM"],
    specs: [
      { label: "Motor type", value: "AC synchronous" },
      { label: "Rated voltage", value: "AC 220 V, 50/60 Hz" },
      { label: "Power", value: "4 W" },
      { label: "Output speed", value: "2.5–3 RPM" },
      { label: "Rotation", value: null },
      { label: "Minimum order", value: null },
      { label: "Lead time", value: null },
    ],
    specNote: null,
    industries: ["fan", "cooler"],
    variants: [{ sku: "MFM-AC-TBC", name: "AC synchronous", ...pcs }],
    updatedAt: UPDATED,
  },
  {
    slug: "washing-machine-timer",
    family: "Washing machine timer",
    name: "Washing machine timer",
    model: null,
    modelNote: "Model to confirm",
    summary: "Mechanical wash timer for semi-automatic washers.",
    description:
      "Rotary wash timer. Terminals and the timing mechanism are confirmed against your current part before any cutaway is published.",
    cardSpecs: [
      "Timing range to confirm",
      "Terminals to confirm",
      "Mounting to confirm",
    ],
    specs: [
      { label: "Timing range", value: null },
      { label: "Terminals", value: null },
      { label: "Contact rating", value: null },
      { label: "Mounting", value: null },
      { label: "Minimum order", value: null },
      { label: "Lead time", value: null },
    ],
    specNote: null,
    industries: ["washing-machine"],
    variants: [{ sku: "WMT-TBC", name: "Standard", ...pcs }],
    updatedAt: UPDATED,
  },
  {
    slug: "induction-cooker",
    family: "Induction cooker",
    name: "Induction cooker",
    model: null,
    modelNote: "Model and scope of supply to confirm",
    summary:
      "Induction cooker supply: complete units or spare parts, to be confirmed.",
    description:
      "We confirm whether your enquiry is for complete appliances or spare parts. Only the parts shown here are offered for discussion, and each is confirmed before supply.",
    cardSpecs: [
      "Complete unit or spares",
      "Power to confirm",
      "Model to confirm",
    ],
    specs: [
      { label: "Scope of supply", value: null },
      { label: "Rated power", value: null },
      { label: "Supply voltage", value: null },
      { label: "Glass size", value: null },
      { label: "Minimum order", value: null },
      { label: "Lead time", value: null },
    ],
    specNote: null,
    industries: ["kitchen-appliance"],
    variants: [{ sku: "IC-TBC", name: "To confirm", ...pcs }],
    updatedAt: UPDATED,
  },
  {
    slug: "ball-bearings",
    family: "Ball bearings",
    name: "Ball bearings",
    model: null,
    modelNote: "Size to confirm",
    summary: "Deep groove ball bearings for motors and appliances.",
    description:
      "Bearing designation, dimensions, ball count and seal type are confirmed per order. The drawing shows a general deep groove layout.",
    cardSpecs: [
      "Designation to confirm",
      "Dimensions to confirm",
      "Seal type to confirm",
    ],
    specs: [
      { label: "Designation", value: null },
      { label: "Bore × OD × width", value: null },
      { label: "Seal type", value: null },
      { label: "Ball count", value: null },
      { label: "Minimum order", value: null },
      { label: "Lead time", value: null },
    ],
    specNote: null,
    industries: ["fan", "washing-machine", "cooler"],
    variants: [{ sku: "BB-TBC", name: "To confirm", ...pcs }],
    updatedAt: UPDATED,
  },
  {
    slug: "heater-rod",
    family: "Heater rod",
    name: "Heater rod",
    model: null,
    modelNote: "Rating to confirm",
    summary: "Curved infrared heating tube for room heaters.",
    description:
      "A coiled heating element sealed inside a clear quartz glass tube, bent to an arc, with ceramic end caps and insulated leads. It fits curved-reflector room heaters. Wattage, voltage, tube length and bend are confirmed against your heater before supply.",
    cardSpecs: [
      "Curved quartz tube",
      "Wattage to confirm",
      "Length to confirm",
    ],
    specs: [
      { label: "Construction", value: "Coiled element in a curved quartz glass tube, ceramic end caps" },
      { label: "Wattage", value: null },
      { label: "Voltage", value: null },
      { label: "Tube length and bend", value: null },
      { label: "Lead and terminal type", value: null },
      { label: "Minimum order", value: null },
    ],
    specNote: null,
    industries: ["heater"],
    variants: [{ sku: "HR-TBC", name: "To confirm", ...pcs }],
    updatedAt: UPDATED,
  },
  {
    slug: "geyser-element",
    family: "Geyser element",
    name: "Geyser element",
    model: null,
    modelNote: "Fitting to confirm",
    summary: "Immersion heating element for water geysers.",
    description:
      "Element, mounting flange and terminals. Internal construction is not shown without supplier evidence. Fit and rating are confirmed per enquiry.",
    cardSpecs: [
      "Thread size to confirm",
      "Voltage to confirm",
      "Wattage to confirm",
    ],
    specs: [
      { label: "Wattage", value: null },
      { label: "Voltage", value: null },
      { label: "Flange or thread size", value: null },
      { label: "Element length", value: null },
      { label: "Minimum order", value: null },
      { label: "Lead time", value: null },
    ],
    specNote: null,
    industries: ["heater"],
    variants: [{ sku: "GE-TBC", name: "To confirm", ...pcs }],
    updatedAt: UPDATED,
  },
  {
    slug: "washer-buttons-and-switches",
    family: "Washer buttons and switches",
    name: "Washer buttons and switches",
    model: null,
    modelNote: "Variant to confirm",
    summary:
      "Rocker switches for washer control panels, 2-position and 3-position.",
    description:
      "Two separate variants: 2-position and 3-position. The drawing shows the shared rocker layout; the 3-position rocker geometry is confirmed before supply.",
    cardSpecs: ["2-position", "3-position", "Rating to confirm"],
    specs: [
      {
        label: "Positions",
        value: "2-position or 3-position (separate variants)",
      },
      { label: "Contact rating", value: null },
      { label: "Panel cut-out", value: null },
      { label: "Terminals", value: null },
      { label: "Minimum order", value: null },
      { label: "Lead time", value: null },
    ],
    specNote: null,
    industries: ["washing-machine"],
    variants: [
      { sku: "SW2-TBC", name: "2-position", ...pcs },
      { sku: "SW3-TBC", name: "3-position", ...pcs },
    ],
    updatedAt: UPDATED,
  },
  {
    slug: "capacitors",
    family: "Capacitors",
    name: "Capacitors",
    model: null,
    modelNote: "Rating to confirm",
    summary: "Motor run capacitors for fans, coolers and washers.",
    description:
      "Capacitance, voltage and capacitor type are confirmed before supply. The section view shows a typical film winding inside a sealed case.",
    cardSpecs: [
      "Capacitance to confirm",
      "Voltage to confirm",
      "Dimensions to confirm",
    ],
    specs: [
      { label: "Capacitance", value: null },
      { label: "Rated voltage", value: null },
      { label: "Capacitor type", value: null },
      { label: "Dimensions", value: null },
      { label: "Terminals", value: null },
      { label: "Minimum order", value: null },
    ],
    specNote: null,
    industries: ["fan", "washing-machine", "cooler"],
    variants: [{ sku: "CAP-TBC", name: "To confirm", ...pcs }],
    updatedAt: UPDATED,
  },
];
