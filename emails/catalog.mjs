import { emailHtml, emailText, variable as v } from "./layout.mjs";

const identities = {
  general: { from: "Rainbow Sanctuary <hello@rainbowsanctuary.life>", replyTo: "hello@rainbowsanctuary.life" },
  bookings: { from: "Rainbow Sanctuary Bookings <bookings@rainbowsanctuary.life>", replyTo: "bookings@rainbowsanctuary.life" },
  support: { from: "Rainbow Sanctuary Support <support@rainbowsanctuary.life>", replyTo: "support@rainbowsanctuary.life" },
  privacy: { from: "Rainbow Sanctuary Privacy <privacy@rainbowsanctuary.life>", replyTo: "privacy@rainbowsanctuary.life" }
};

function define({ alias, name, event, identity = "general", subject, variables, content }) {
  const rendered = content(v);
  return {
    alias,
    name,
    event,
    ...identities[identity],
    subject,
    variables: variables.map((key) => ({ key, type: "string" })),
    html: emailHtml(rendered),
    text: emailText(rendered)
  };
}

export const emailCatalog = [
  define({
    alias: "rs-enquiry-received", name: "RS · Enquiry received", event: "rs.enquiry.received",
    subject: "We received your Rainbow Sanctuary enquiry", variables: ["NAME", "ENQUIRY_TOPIC", "REFERENCE_ID"],
    content: (x) => ({ preheader: "Your message is safely with the Rainbow Sanctuary team.", eyebrow: "Enquiry received", heading: "Thank you for reaching out.", greeting: `Hello ${x("NAME")},`, paragraphs: ["Your message has arrived with our team. We will read it with care and respond through a human member of Rainbow Sanctuary.", "An enquiry does not create a booking or confirm a place. We will first make sure the next step is suitable and clear."], details: [{ label: "Topic", value: x("ENQUIRY_TOPIC") }, { label: "Reference", value: x("REFERENCE_ID") }], callout: "Please do not reply with medical records, financial information or unnecessary sensitive details. If we need anything further, we will explain why and provide an appropriate route." })
  }),
  define({
    alias: "rs-support-received", name: "RS · Support request received", event: "rs.support.received", identity: "support",
    subject: "Rainbow Sanctuary support request received", variables: ["NAME", "REFERENCE_ID"],
    content: (x) => ({ preheader: "Support has received your message.", eyebrow: "Support", heading: "We are looking into this.", greeting: `Hello ${x("NAME")},`, paragraphs: ["Your support request is now with the Rainbow Sanctuary team. We will review what happened and respond as soon as we can.", "Please keep the reference below when replying so we can follow the same conversation."], details: [{ label: "Reference", value: x("REFERENCE_ID") }], callout: "For an immediate medical or personal-safety emergency, contact the appropriate local emergency service. Rainbow Sanctuary support is not an emergency-response channel." })
  }),
  define({
    alias: "rs-privacy-request-received", name: "RS · Privacy request received", event: "rs.privacy.requested", identity: "privacy",
    subject: "We received your privacy request", variables: ["NAME", "REQUEST_TYPE", "REFERENCE_ID"],
    content: (x) => ({ preheader: "Your privacy request has been recorded for review.", eyebrow: "Privacy", heading: "Your request has been recorded.", greeting: `Hello ${x("NAME")},`, paragraphs: ["We have received your privacy request and will review it through our restricted privacy process.", "We may need to verify your identity before disclosing, correcting or deleting information. We will ask only for what is proportionate to the request."], details: [{ label: "Request", value: x("REQUEST_TYPE") }, { label: "Reference", value: x("REFERENCE_ID") }], callout: "Do not send identity documents by replying unless our privacy contact has first provided a secure and appropriate method." })
  }),
  define({
    alias: "rs-application-received", name: "RS · Application received", event: "rs.application.received",
    subject: "Your Rainbow Sanctuary application has arrived", variables: ["NAME", "PATHWAY", "REFERENCE_ID"],
    content: (x) => ({ preheader: "Your application is ready for a careful human review.", eyebrow: "Application received", heading: "We will review this with care.", greeting: `Hello ${x("NAME")},`, paragraphs: ["Thank you for sharing your application. It will be reviewed by the appropriate member of our team for scope, fit and the next responsible step.", "Submitting an application does not guarantee acceptance, scheduling or a place. We will contact you when the review is complete or if clarification is needed."], details: [{ label: "Pathway", value: x("PATHWAY") }, { label: "Reference", value: x("REFERENCE_ID") }], callout: "Please do not send additional health records or information about another person unless the team specifically requests it through an approved private channel." })
  }),
  define({
    alias: "rs-application-more-information", name: "RS · Application needs information", event: "rs.application.more_information",
    subject: "A little more information about your application", variables: ["NAME", "PATHWAY", "REQUESTED_INFORMATION", "RESPONSE_URL"],
    content: (x) => ({ preheader: "The team needs a little more information before completing its review.", eyebrow: "Application review", heading: "A little more clarity will help.", greeting: `Hello ${x("NAME")},`, paragraphs: [`We have begun reviewing your application for ${x("PATHWAY")}. Before we can complete the review, we need the information described below.`, "This is not a rejection or an acceptance. It simply helps the team understand whether the pathway and its scope are appropriate."], callout: x("REQUESTED_INFORMATION"), cta: { label: "Respond securely", url: x("RESPONSE_URL") } })
  }),
  define({
    alias: "rs-application-accepted", name: "RS · Application accepted", event: "rs.application.accepted",
    subject: "Your Rainbow Sanctuary application has been accepted", variables: ["NAME", "PATHWAY", "NEXT_STEP", "NEXT_STEP_URL"],
    content: (x) => ({ preheader: "Your application has been accepted and the next step is ready.", eyebrow: "Application accepted", heading: "We are ready for the next step.", greeting: `Hello ${x("NAME")},`, paragraphs: [`Following our review, we are pleased to confirm that your application for ${x("PATHWAY")} has been accepted.`, "Acceptance confirms fit for the stated next step. It does not replace the final scheduling, participation, consent or program-specific terms that may still be required."], callout: x("NEXT_STEP"), cta: { label: "Continue", url: x("NEXT_STEP_URL") } })
  }),
  define({
    alias: "rs-application-declined", name: "RS · Application declined or referred", event: "rs.application.declined",
    subject: "An update about your Rainbow Sanctuary application", variables: ["NAME", "PATHWAY", "GUIDANCE"],
    content: (x) => ({ preheader: "A thoughtful update from the Rainbow Sanctuary team.", eyebrow: "Application update", heading: "This pathway is not the right next step.", greeting: `Hello ${x("NAME")},`, paragraphs: [`After reviewing your application for ${x("PATHWAY")}, we are not able to offer this pathway as the right next step at this time.`, "This decision is about present scope and suitability; it is not a judgment of you or your experience."], callout: x("GUIDANCE") })
  }),
  define({
    alias: "rs-scheduling-invitation", name: "RS · Private scheduling invitation", event: "rs.scheduling.invited", identity: "bookings",
    subject: "Choose your Rainbow Sanctuary appointment", variables: ["NAME", "SERVICE_NAME", "SCHEDULING_URL", "EXPIRY_DATE"],
    content: (x) => ({ preheader: "Your private scheduling link is ready.", eyebrow: "Scheduling", heading: "Choose a suitable time.", greeting: `Hello ${x("NAME")},`, paragraphs: [`Your application for ${x("SERVICE_NAME")} has reached the scheduling stage. Use the private link below to choose from the currently available times.`, "The booking becomes final only when you receive a separate confirmation."], details: [{ label: "Link available until", value: x("EXPIRY_DATE") }], cta: { label: "Choose a time", url: x("SCHEDULING_URL") } })
  }),
  define({
    alias: "rs-booking-confirmed", name: "RS · Booking confirmed", event: "rs.group_healing.booked", identity: "bookings",
    subject: "Your Rainbow Sanctuary booking is confirmed", variables: ["NAME", "EVENT_TITLE", "EVENT_DATE", "EVENT_TIME", "TIMEZONE", "LOCATION", "CALENDAR_URL", "REFERENCE_ID"],
    content: (x) => ({ preheader: "Your place is confirmed. Here are the details.", eyebrow: "Booking confirmed", heading: "Your place is held.", greeting: `Hello ${x("NAME")},`, paragraphs: [`Your booking for ${x("EVENT_TITLE")} is confirmed. We look forward to holding this time with you.`, "Please review the time and timezone carefully. Access details, where applicable, are shared only through participant communications and should not be forwarded."], details: [{ label: "Date", value: x("EVENT_DATE") }, { label: "Time", value: x("EVENT_TIME") }, { label: "Timezone", value: x("TIMEZONE") }, { label: "Location", value: x("LOCATION") }, { label: "Reference", value: x("REFERENCE_ID") }], cta: { label: "Add to calendar", url: x("CALENDAR_URL") } })
  }),
  define({
    alias: "rs-booking-reminder-24h", name: "RS · Booking reminder 24 hours", event: "rs.group_healing.reminder.24h", identity: "bookings",
    subject: "Tomorrow: your Rainbow Sanctuary session", variables: ["NAME", "EVENT_TITLE", "EVENT_DATE", "EVENT_TIME", "TIMEZONE", "ACCESS_URL"],
    content: (x) => ({ preheader: "A calm reminder for tomorrow's session.", eyebrow: "24-hour reminder", heading: "We meet tomorrow.", greeting: `Hello ${x("NAME")},`, paragraphs: [`This is a reminder that ${x("EVENT_TITLE")} begins tomorrow.`, "If possible, arrive a few minutes early and choose a quiet place where you can participate without interruption."], details: [{ label: "Date", value: x("EVENT_DATE") }, { label: "Time", value: x("EVENT_TIME") }, { label: "Timezone", value: x("TIMEZONE") }], callout: "The session is educational and wellbeing-oriented. It is not emergency, medical or mental-health care.", cta: { label: "Open session access", url: x("ACCESS_URL") } })
  }),
  define({
    alias: "rs-booking-reminder-1h", name: "RS · Booking reminder 1 hour", event: "rs.group_healing.reminder.1h", identity: "bookings",
    subject: "Starting soon: your Rainbow Sanctuary session", variables: ["NAME", "EVENT_TITLE", "EVENT_TIME", "TIMEZONE", "ACCESS_URL"],
    content: (x) => ({ preheader: "Your session begins in approximately one hour.", eyebrow: "Starting soon", heading: "Your session begins shortly.", greeting: `Hello ${x("NAME")},`, paragraphs: [`${x("EVENT_TITLE")} begins in approximately one hour.`, "Settle somewhere quiet, bring water if helpful, and use the private access link below when you are ready."], details: [{ label: "Time", value: x("EVENT_TIME") }, { label: "Timezone", value: x("TIMEZONE") }], cta: { label: "Join the session", url: x("ACCESS_URL") } })
  }),
  define({
    alias: "rs-booking-changed", name: "RS · Booking changed", event: "rs.booking.changed", identity: "bookings",
    subject: "Important change to your Rainbow Sanctuary booking", variables: ["NAME", "EVENT_TITLE", "CHANGE_SUMMARY", "NEW_DATE", "NEW_TIME", "TIMEZONE", "DETAILS_URL"],
    content: (x) => ({ preheader: "An important booking detail has changed.", eyebrow: "Booking update", heading: "Please review this change.", greeting: `Hello ${x("NAME")},`, paragraphs: [`A detail for ${x("EVENT_TITLE")} has changed.`, "Please review the updated information below. If the change means you can no longer participate, reply to this email and the bookings team will help."], callout: x("CHANGE_SUMMARY"), details: [{ label: "Updated date", value: x("NEW_DATE") }, { label: "Updated time", value: x("NEW_TIME") }, { label: "Timezone", value: x("TIMEZONE") }], cta: { label: "Review booking", url: x("DETAILS_URL") } })
  }),
  define({
    alias: "rs-booking-cancelled", name: "RS · Booking cancelled", event: "rs.booking.cancelled", identity: "bookings",
    subject: "Your Rainbow Sanctuary booking has been cancelled", variables: ["NAME", "EVENT_TITLE", "CANCELLATION_NOTE", "SUPPORT_URL"],
    content: (x) => ({ preheader: "Confirmation that this booking is no longer active.", eyebrow: "Cancellation", heading: "Your booking has been cancelled.", greeting: `Hello ${x("NAME")},`, paragraphs: [`Your booking for ${x("EVENT_TITLE")} is no longer active.`, "Any payment or refund is handled under the terms that applied to this booking. Stripe sends the official financial receipt or refund confirmation separately."], callout: x("CANCELLATION_NOTE"), cta: { label: "Contact bookings", url: x("SUPPORT_URL") } })
  }),
  define({
    alias: "rs-session-follow-up", name: "RS · Session follow-up", event: "rs.session.follow_up", identity: "bookings",
    subject: "A gentle follow-up from Rainbow Sanctuary", variables: ["NAME", "SESSION_NAME", "INTEGRATION_NOTE", "FOLLOW_UP_URL"],
    content: (x) => ({ preheader: "A little space for reflection after your session.", eyebrow: "Integration", heading: "Let the experience settle.", greeting: `Hello ${x("NAME")},`, paragraphs: [`Thank you for joining ${x("SESSION_NAME")}. There is no need to force an interpretation or immediate result. Give yourself space to notice what is present.`, "Rest, hydration and simple grounding can be supportive. Seek appropriately qualified professional help for any health or mental-health concern."], callout: x("INTEGRATION_NOTE"), cta: { label: "Continue your reflection", url: x("FOLLOW_UP_URL") } })
  }),
  define({
    alias: "rs-retreat-application-received", name: "RS · Retreat application received", event: "rs.retreat.application.received", identity: "bookings",
    subject: "Your retreat application has arrived", variables: ["NAME", "RETREAT_NAME", "REFERENCE_ID"],
    content: (x) => ({ preheader: "Your retreat application is ready for confidential review.", eyebrow: "Retreat application", heading: "Thank you for applying thoughtfully.", greeting: `Hello ${x("NAME")},`, paragraphs: [`We have received your application for ${x("RETREAT_NAME")}. The team will review eligibility, scope, safety and practical fit before any place can be offered.`, "An application or payment alone does not confirm acceptance, medical suitability or participation."], details: [{ label: "Reference", value: x("REFERENCE_ID") }], callout: "Do not change or stop prescribed medication in order to attend. Any health and medication screening must be completed honestly through the approved confidential process." })
  }),
  define({
    alias: "rs-retreat-accepted", name: "RS · Retreat accepted", event: "rs.retreat.accepted", identity: "bookings",
    subject: "Your next step for the Rainbow Sanctuary retreat", variables: ["NAME", "RETREAT_NAME", "DATES", "LOCATION", "NEXT_STEP", "ENROLLMENT_URL"],
    content: (x) => ({ preheader: "Your retreat application has been accepted for the next enrollment step.", eyebrow: "Retreat application", heading: "You may continue to enrollment.", greeting: `Hello ${x("NAME")},`, paragraphs: [`Your application for ${x("RETREAT_NAME")} has been accepted for the next enrollment step.`, "Your place is not finally secured until the required agreements, payment and written confirmation are complete."], details: [{ label: "Dates", value: x("DATES") }, { label: "Location", value: x("LOCATION") }], callout: x("NEXT_STEP"), cta: { label: "Continue enrollment", url: x("ENROLLMENT_URL") } })
  }),
  define({
    alias: "rs-retreat-preparation", name: "RS · Retreat preparation", event: "rs.retreat.preparation", identity: "bookings",
    subject: "Preparing for your Rainbow Sanctuary retreat", variables: ["NAME", "RETREAT_NAME", "PREPARATION_STAGE", "PREPARATION_NOTE", "GUIDE_URL"],
    content: (x) => ({ preheader: "Your next preparation guidance is ready.", eyebrow: x("PREPARATION_STAGE"), heading: "Preparing with clarity and care.", greeting: `Hello ${x("NAME")},`, paragraphs: [`As ${x("RETREAT_NAME")} approaches, this is your next preparation step.`, "Read the guidance carefully and contact the team if anything has changed in your health, medication, travel or participation circumstances."], callout: x("PREPARATION_NOTE"), cta: { label: "Read preparation guide", url: x("GUIDE_URL") } })
  }),
  define({
    alias: "rs-retreat-follow-up", name: "RS · Retreat integration follow-up", event: "rs.retreat.follow_up", identity: "bookings",
    subject: "Continuing your retreat integration", variables: ["NAME", "RETREAT_NAME", "INTEGRATION_STAGE", "INTEGRATION_NOTE", "SUPPORT_URL"],
    content: (x) => ({ preheader: "A grounded integration check-in after your retreat.", eyebrow: x("INTEGRATION_STAGE"), heading: "Integration continues in daily life.", greeting: `Hello ${x("NAME")},`, paragraphs: [`This is a follow-up after ${x("RETREAT_NAME")}. Meaning often becomes clearer gradually through ordinary life rather than through urgency.`, "If you are experiencing distress, concerning physical symptoms or a mental-health crisis, seek appropriate qualified or emergency support rather than relying on this email channel."], callout: x("INTEGRATION_NOTE"), cta: { label: "Contact the support team", url: x("SUPPORT_URL") } })
  }),
  define({
    alias: "rs-program-enrollment-confirmed", name: "RS · Program enrollment confirmed", event: "rs.program.enrolled", identity: "bookings",
    subject: "Your Rainbow Sanctuary enrollment is confirmed", variables: ["NAME", "PROGRAM_NAME", "START_DATE", "FORMAT", "TIMEZONE", "PROGRAM_URL"],
    content: (x) => ({ preheader: "Your program enrollment is confirmed.", eyebrow: "Enrollment confirmed", heading: "Your learning journey is ready.", greeting: `Hello ${x("NAME")},`, paragraphs: [`Your enrollment in ${x("PROGRAM_NAME")} is confirmed. We will guide you through each required step without pressure to move faster than the program allows.`, "Program communications will contain the relevant schedule, preparation and participation expectations."], details: [{ label: "Begins", value: x("START_DATE") }, { label: "Format", value: x("FORMAT") }, { label: "Timezone", value: x("TIMEZONE") }], cta: { label: "Open program information", url: x("PROGRAM_URL") } })
  }),
  define({
    alias: "rs-program-session-reminder", name: "RS · Program session reminder", event: "rs.program.session.reminder", identity: "bookings",
    subject: "Your next Rainbow Sanctuary program session", variables: ["NAME", "PROGRAM_NAME", "SESSION_TITLE", "SESSION_DATE", "SESSION_TIME", "TIMEZONE", "ACCESS_URL"],
    content: (x) => ({ preheader: "Your next program session is approaching.", eyebrow: "Program reminder", heading: x("SESSION_TITLE"), greeting: `Hello ${x("NAME")},`, paragraphs: [`Your next session in ${x("PROGRAM_NAME")} is approaching.`, "Bring any requested materials and allow a few minutes to arrive before the session begins."], details: [{ label: "Date", value: x("SESSION_DATE") }, { label: "Time", value: x("SESSION_TIME") }, { label: "Timezone", value: x("TIMEZONE") }], cta: { label: "Open session", url: x("ACCESS_URL") } })
  }),
  define({
    alias: "rs-program-completed", name: "RS · Program completion", event: "rs.program.completed", identity: "bookings",
    subject: "Acknowledging your Rainbow Sanctuary program completion", variables: ["NAME", "PROGRAM_NAME", "COMPLETION_NOTE", "NEXT_PATH_URL"],
    content: (x) => ({ preheader: "A thoughtful acknowledgement of your program completion.", eyebrow: "Program completion", heading: "A chapter completed; integration continues.", greeting: `Hello ${x("NAME")},`, paragraphs: [`You have completed ${x("PROGRAM_NAME")}. We acknowledge the attention, practice and responsibility this has required.`, "Completion records participation in the stated Rainbow Sanctuary program. It does not create a regulated professional license or guarantee a particular personal or professional outcome."], callout: x("COMPLETION_NOTE"), cta: { label: "Explore the next pathway", url: x("NEXT_PATH_URL") } })
  })
];

export const emailByAlias = new Map(emailCatalog.map((template) => [template.alias, template]));
export const emailByEvent = new Map(emailCatalog.map((template) => [template.event, template]));
