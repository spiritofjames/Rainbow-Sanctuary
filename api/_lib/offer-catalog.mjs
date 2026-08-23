const MONEY_PATTERN = /^[a-z0-9][a-z0-9-]{2,79}$/;

export const PAYMENT_PROCESSING_ALLOWANCE = Object.freeze({
  rateBasisPoints: 400,
  fixedMinor: 50,
  label: "Payment processing included"
});

export function feeInclusiveAmountMinor(
  baseAmountMinor,
  { rateBasisPoints = 400, fixedMinor = 50, roundingMinor = 500 } = {}
) {
  if (
    !Number.isInteger(baseAmountMinor) ||
    baseAmountMinor <= 0 ||
    !Number.isInteger(rateBasisPoints) ||
    rateBasisPoints < 0 ||
    rateBasisPoints >= 10_000 ||
    !Number.isInteger(fixedMinor) ||
    fixedMinor < 0 ||
    !Number.isInteger(roundingMinor) ||
    roundingMinor <= 0
  ) {
    throw new Error("A valid internal pricing allowance is required.");
  }
  const gross = Math.ceil((baseAmountMinor + fixedMinor) / (1 - rateBasisPoints / 10_000));
  return Math.ceil(gross / roundingMinor) * roundingMinor;
}

const variant = ({
  id,
  name,
  baseAmountUsd,
  amountUsd,
  sessionId,
  policy = "program-purchase",
  internalPaymentTest = false,
  stripePriceEnvironmentKey = "",
  stripePriceId = ""
}) => Object.freeze({
  id,
  name,
  baseAmountMinor: baseAmountUsd * 100,
  amountMinor: amountUsd * 100,
  currency: "usd",
  internalPaymentTest,
  stripePriceEnvironmentKey,
  stripePriceId,
  sessionId,
  policy
});

const offer = ({ id, name, pagePath, priceKey, variants }) => Object.freeze({
  id,
  name,
  pagePath,
  priceKey,
  variants: Object.freeze(variants)
});

export const OFFER_CATALOG = Object.freeze([
  offer({
    id: "group-healing",
    name: "Online Group Healing",
    // Payments begin on the specific booking page. Returning here after a
    // cancelled checkout preserves the selected-session journey rather than
    // sending a visitor back to the overview.
    pagePath: "/online-group-healing",
    priceKey: "group-healing",
    variants: [
      variant({
        id: "group-healing",
        name: "Group Healing — single session",
        baseAmountUsd: 20,
        amountUsd: 22,
        sessionId: "group-healing-2026-08-18",
        policy: "group-healing",
        // This persistent Price enables product-scoped promotion codes while
        // server checkout keeps the chosen session in its metadata.
        stripePriceEnvironmentKey: "STRIPE_GROUP_HEALING_PRICE_ID",
        stripePriceId: "price_1U5T0nHrqlaOfUb7gorSAoaJ"
      })
    ]
  }),
  offer({
    id: "regeneration-maintenance",
    name: "Regeneration Maintenance",
    pagePath: "/144-stages-maintenance",
    priceKey: "regeneration-maintenance",
    variants: [
      variant({
        id: "regeneration-maintenance-monthly",
        name: "ReGeneration Maintenance — Four-Week Opening Cycle",
        baseAmountUsd: 210,
        amountUsd: 210,
        sessionId: "regeneration-maintenance-2026-08-17-monthly",
        policy: "regeneration-maintenance",
        stripePriceEnvironmentKey: "STRIPE_REGENERATION_MAINTENANCE_MONTHLY_PRICE_ID"
      }),
      variant({
        id: "regeneration-maintenance-three-month",
        name: "ReGeneration Maintenance — Twelve-Week Opening Cycle",
        baseAmountUsd: 630,
        amountUsd: 630,
        sessionId: "regeneration-maintenance-2026-08-17-three-month",
        policy: "regeneration-maintenance",
        stripePriceEnvironmentKey: "STRIPE_REGENERATION_MAINTENANCE_THREE_MONTH_PRICE_ID"
      })
    ]
  }),
  offer({
    id: "kids-weekly-practice",
    name: "Children’s Weekly Practice",
    pagePath: "/children-weekly-practice",
    priceKey: "kids-weekly-practice",
    variants: [
      variant({
        id: "kids-weekly-practice-four-week",
        name: "Children’s Weekly Practice — 4-Week Cycle",
        baseAmountUsd: 80,
        amountUsd: 80,
        sessionId: "kids-weekly-practice-2026-08-29-four-week",
        policy: "kids-weekly-practice",
        stripePriceEnvironmentKey: "STRIPE_KIDS_WEEKLY_PRACTICE_FOUR_WEEK_PRICE_ID",
        stripePriceId: "price_1U7UcLHrqlaOfUb78mDMP5Wm"
      }),
      variant({
        id: "kids-weekly-practice-twelve-week",
        name: "Children’s Weekly Practice — 12-Week Cycle",
        baseAmountUsd: 240,
        amountUsd: 240,
        sessionId: "kids-weekly-practice-2026-08-29-twelve-week",
        policy: "kids-weekly-practice",
        stripePriceEnvironmentKey: "STRIPE_KIDS_WEEKLY_PRACTICE_TWELVE_WEEK_PRICE_ID",
        stripePriceId: "price_1U7UilHrqlaOfUb7fcNcrEnu"
      })
    ]
  }),
  offer({
    id: "internal-payment-test",
    name: "Internal checkout verification",
    pagePath: "/group-healing",
    priceKey: "internal-payment-test",
    variants: [
      variant({
        id: "internal-payment-test",
        name: "Rainbow Sanctuary internal checkout test",
        baseAmountUsd: 1,
        amountUsd: 1,
        sessionId: "internal-payment-test-2026-08-10",
        policy: "internal-test",
        internalPaymentTest: true
      })
    ]
  }),
  offer({
    id: "awakening-inner-light-retreat-2026",
    name: "Awakening Your Inner Light Retreat 2026",
    pagePath: "/awakening-your-inner-light-2026",
    priceKey: "awakening-inner-light-retreat-2026",
    variants: [
      variant({
        id: "awakening-inner-light-retreat-2026-early-bird",
        name: "Awakening Your Inner Light Retreat 2026 — Early Bird",
        baseAmountUsd: 3000,
        amountUsd: 3000,
        sessionId: "awakening-inner-light-retreat-2026",
        policy: "retreat-booking"
      }),
      variant({
        id: "awakening-inner-light-retreat-2026-standard",
        name: "Awakening Your Inner Light Retreat 2026 — Standard",
        baseAmountUsd: 3500,
        amountUsd: 3500,
        sessionId: "awakening-inner-light-retreat-2026",
        policy: "retreat-booking"
      })
    ]
  }),
  offer({
    id: "spiral-i",
    name: "Spiral I — Foundations",
    pagePath: "/spiral-i",
    priceKey: "spiral-i",
    variants: [
      variant({ id: "spiral-i-standard", name: "Spiral I — Standard enrollment", baseAmountUsd: 1399, amountUsd: 1460, sessionId: "program-spiral-i-standard" }),
      variant({ id: "spiral-i-early-bird", name: "Spiral I — Early Bird enrollment", baseAmountUsd: 999, amountUsd: 1045, sessionId: "program-spiral-i-early-bird" })
    ]
  }),
  offer({
    id: "spiral-ii",
    name: "Spiral II — Relationships",
    pagePath: "/spiral-ii",
    priceKey: "spiral-ii",
    variants: [
      variant({ id: "spiral-ii-standard", name: "Spiral II — Standard enrollment", baseAmountUsd: 1599, amountUsd: 1670, sessionId: "program-spiral-ii-standard" }),
      variant({ id: "spiral-ii-early-bird", name: "Spiral II — Early Bird enrollment", baseAmountUsd: 1299, amountUsd: 1355, sessionId: "program-spiral-ii-early-bird" })
    ]
  }),
  offer({
    id: "spiral-iii",
    name: "Spiral III — Direction",
    pagePath: "/spiral-iii",
    priceKey: "spiral-iii",
    variants: [
      variant({ id: "spiral-iii-standard", name: "Spiral III — Standard enrollment", baseAmountUsd: 1599, amountUsd: 1670, sessionId: "program-spiral-iii-standard" }),
      variant({ id: "spiral-iii-early-bird", name: "Spiral III — Early Bird enrollment", baseAmountUsd: 1399, amountUsd: 1460, sessionId: "program-spiral-iii-early-bird" })
    ]
  }),
  offer({
    id: "spiral-iv",
    name: "Spiral IV — Leadership",
    pagePath: "/spiral-iv",
    priceKey: "spiral-iv",
    variants: [
      variant({ id: "spiral-iv-standard", name: "Spiral IV — Standard enrollment", baseAmountUsd: 1599, amountUsd: 1670, sessionId: "program-spiral-iv-standard" }),
      variant({ id: "spiral-iv-early-bird", name: "Spiral IV — Early Bird enrollment", baseAmountUsd: 1399, amountUsd: 1460, sessionId: "program-spiral-iv-early-bird" })
    ]
  }),
  offer({
    id: "regeneration",
    name: "ReGeneration",
    pagePath: "/regeneration",
    priceKey: "regeneration",
    variants: [
      variant({ id: "regeneration-level-i", name: "ReGeneration — Level I", baseAmountUsd: 2999, amountUsd: 3125, sessionId: "program-regeneration-level-i" }),
      variant({ id: "regeneration-level-ii", name: "ReGeneration — Level II", baseAmountUsd: 2399, amountUsd: 2500, sessionId: "program-regeneration-level-ii" })
    ]
  }),
  offer({
    id: "earth-healer-training",
    name: "Earth Healer Training",
    pagePath: "/earth-healer-training",
    priceKey: "earth-healer-training",
    variants: [
      variant({ id: "earth-healer-level-i", name: "Earth Healer Training — Level I", baseAmountUsd: 500, amountUsd: 525, sessionId: "program-earth-healer-level-i" }),
      variant({ id: "earth-healer-level-ii", name: "Earth Healer Training — Level II", baseAmountUsd: 699, amountUsd: 730, sessionId: "program-earth-healer-level-ii" })
    ]
  }),
  offer({
    id: "crystal-healing",
    name: "Crystal Healing",
    pagePath: "/crystal-healing",
    priceKey: "crystal-healing",
    variants: [
      variant({ id: "crystal-healing", name: "Crystal Healing", baseAmountUsd: 899, amountUsd: 940, sessionId: "program-crystal-healing" })
    ]
  }),
  offer({
    id: "intuitive-perception-training",
    name: "Intuitive Perception Training",
    pagePath: "/intuitive-perception-training",
    priceKey: "intuitive-perception-training",
    variants: [
      variant({ id: "intuitive-perception-training", name: "Intuitive Perception Training", baseAmountUsd: 899, amountUsd: 940, sessionId: "program-intuitive-perception-training" })
    ]
  }),
  offer({
    id: "adult-potential-development",
    name: "Adult Potential Development",
    pagePath: "/adult-potential-development",
    priceKey: "adult-potential-development",
    variants: [
      variant({ id: "adult-potential-development", name: "Adult Potential Development", baseAmountUsd: 1599, amountUsd: 1670, sessionId: "program-adult-potential-development" })
    ]
  }),
  offer({
    id: "childrens-potential-coach-certification",
    name: "Children's Potential Coach Certification",
    pagePath: "/childrens-potential-coach-certification",
    priceKey: "childrens-potential-coach-certification",
    variants: [
      variant({ id: "childrens-potential-coach-certification", name: "Children's Potential Coach Certification", baseAmountUsd: 7399, amountUsd: 7710, sessionId: "program-childrens-potential-coach-certification" })
    ]
  })
]);

export const OFFER_BY_ID = new Map(OFFER_CATALOG.map((entry) => [entry.id, entry]));
export const VARIANT_BY_ID = new Map(
  OFFER_CATALOG.flatMap((entry) => entry.variants.map((entryVariant) => [entryVariant.id, {
    ...entryVariant,
    offer: entry
  }]))
);

export function resolveOfferVariant(id) {
  if (!MONEY_PATTERN.test(String(id || ""))) throw new Error("Invalid offer identifier.");
  const resolved = VARIANT_BY_ID.get(id);
  if (!resolved) throw new Error("This payment option is not available.");
  return resolved;
}
