(function personaLedFaqs() {
  const q = (question, answer) => ({ question, answer });
  const config = window.RAINBOW_SANCTUARY_CONFIG || {};
  const price = (key) => config.pricing?.[key] || "The fee has not yet been confirmed for publication. Please enquire before making a decision; we will not ask you to commit without the price being clear.";
  const priceAnswer = (key, detail = "") => `The currently published fee is ${price(key)}.${detail ? ` ${detail}` : ""} Confirmed dates, inclusions, and payment terms are shared before enrollment.`;

  const foundations = [
    q("Do I need previous experience with meditation or energy work?", "No. The work is explained in accessible language and you can begin without adopting a new identity or belief system. Where a program has prerequisites, they are stated before enrollment."),
    q("Do I have to believe everything Rainbow Sanctuary believes?", "No. You are invited to approach the practices with curiosity and discernment. Your agency, questions, boundaries, and existing worldview remain your own."),
    q("Is this medical care, psychotherapy, or a replacement for either?", "No. Rainbow Sanctuary offers spiritual, educational, and experiential wellbeing practices. Continue appropriate medical or mental-health care and use qualified emergency services when needed."),
    q("What if I am interested but unsure which path fits?", "Use the Help Me Choose enquiry. Share what you are navigating, your experience level, and what you hope to change. The team can recommend a starting point—or tell you honestly when another kind of support may be more appropriate."),
    q("Will I be pressured to continue into another program?", "No. Each decision should stand on its own. A next step may be suggested when relevant, but participation does not require an open-ended commitment to the full pathway."),
  ];

  const booking = [
    q("How are dates and availability confirmed?", "The Events calendar shows public dates. Cohorts or private availability that are not yet published are confirmed directly after an enquiry. Please do not arrange travel until you receive written confirmation."),
    q("What happens after I enquire?", "You provide your email and WhatsApp number, describe what you are looking for, and accept the relevant policies. The team reviews the request and follows up with fit, availability, next steps, and any missing commercial details."),
    q("Where can I review cancellations, privacy, and wellbeing boundaries?", "The footer links to the Terms, Privacy Policy, Wellbeing Disclaimer, and Children & Family Safeguarding Policy. These become part of the consent step when you submit an enquiry."),
  ];

  const programCommon = [
    q("What results should I realistically expect?", "The intended outcome is greater awareness, useful practices, and clearer choices—not a guaranteed cure or instant transformation. What changes depends on your context, participation, support system, and integration over time."),
    q("What if difficult emotions come up?", "You remain in charge of your pace and can pause or opt out of an exercise. Tell the facilitator what you need. If the material exceeds the program’s scope, the responsible next step may be qualified clinical or crisis support."),
    ...foundations,
    ...booking,
  ];

  const practitionerCommon = [
    q("Does certification give me a regulated professional licence?", "No regulated licensure is claimed. Before enrolling, ask for the exact certificate title, assessment requirements, practicum, recognition, permitted scope, and any jurisdiction-specific limitations."),
    q("Will this guarantee that I can earn an income?", "No. Training can build skill, structure, and community, but income depends on competence, legal scope, positioning, ethics, business development, and market demand. Ask what post-training support is actually included."),
    q("Can I keep my own approach rather than copying Stephanie?", "Yes. The aim is responsible practice and discernment, not personality imitation. You should understand the framework deeply while retaining your own voice, appropriate methods, and professional boundaries."),
    q("Is there support after the training ends?", "The long-term practitioner-community model is part of the vision, but the exact mentorship, supervision, directory, and graduate support attached to each intake must be confirmed before enrollment."),
    ...foundations.slice(0, 4),
    ...booking,
  ];

  const pages = {
    "Home.dc.html": [
      q("Where should I begin if I feel exhausted or emotionally overwhelmed?", "Begin with the accessible Online Group Healing session or explore Spiral I. If your situation is highly personal, you can enquire about Private Healing. The best first step should reduce overwhelm, not create another large commitment."),
      q("I have already done years of inner work. Is everything here beginner-level?", "No. Spiral II and III, intuitive-development programs, and practitioner routes are designed for people seeking greater depth. Use Help Me Choose so previous experience can be considered rather than automatically starting over."),
      q("Can I come here because I want to support my child?", "Yes. Children & Family Programs clearly separates a guided experience for a child from professional training for adults who want to support children."),
      q("Can this become a professional pathway?", "Potentially. Practitioner Certification introduces the current training routes, their responsibilities, and the questions you should confirm before investing."),
      q("What if I am interested in regenerative community rather than personal healing?", "Go directly to Bigger Vision or the Earth Healing Zone. Those pages distinguish the work happening now from the longer-term Planetary Symbiosis Network vision."),
      ...foundations,
    ],
    "About-Stephanie.dc.html": [
      q("Who is Stephanie Wu?", "Stephanie Wu, also introduced to Chinese-speaking communities as Teacher Rongrong, is the founder and primary field facilitator of Rainbow Sanctuary. Her work focuses on consciousness practice, collective facilitation, and translating inner change into everyday life."),
      q("What qualifies her to lead this work?", "The site presents her lived experience, long-term practice, facilitation role, and the framework she has developed. It does not substitute spiritual authority for regulated clinical credentials. Ask directly about the experience or training relevant to the program you are considering."),
      q("Is Rainbow Sanctuary centred on dependency on one teacher?", "The stated aim is the opposite: to help people develop agency, discernment, and the capacity to contribute. Stephanie anchors the current work, while the wider vision includes a responsible network of facilitators and community stewards."),
      q("What does ‘high frequency’ mean here?", "It is spiritual language for qualities such as clarity, compassion, steadiness, responsibility, and reduced reactivity. It is not a clinical measurement or proof of superiority."),
      q("Can I ask challenging questions about the method?", "Yes. Thoughtful questions are part of informed consent and discernment. You should understand the format, scope, costs, facilitator role, and boundaries before deciding."),
      ...foundations.slice(1),
    ],
    "Workshops.dc.html": [
      q("What is the difference between Programs, Workshops, and Certification?", "Programs is the orientation hub. Adult Workshops are focused experiential learning. Children & Family includes a child pathway. Practitioner Certification is for adults preparing to facilitate responsibly."),
      q("Which adult workshop is best for burnout or low vitality?", "ReGeneration is the closest match for restoration and sustainable vitality. Holographic Healing takes a broader whole-person reflection approach. If you feel overwhelmed by choice, enquire before enrolling."),
      q("Which program is best for intuition or spiritual perception?", "Intuitive Perception Training focuses on sensitivity and discernment. Rainbow Light Codes and Crystal Healing use more specific contemplative tools. None asks you to abandon evidence, boundaries, or critical thinking."),
      q("Can an experienced practitioner join without starting at the beginning?", "Possibly. Some focused workshops can be entered directly. Spiral placement and advanced training depend on prior experience and readiness, so direct conversation is the appropriate route."),
      q("Are these one-off experiences or part of a longer journey?", "Both options exist. A workshop can be taken for its own focus, while some participants later choose the Spiral Journey or a practitioner route. Progression is never automatic."),
      ...programCommon,
    ],
    "Children-Family.dc.html": [
      q("Is this page for my child—or for me as an adult?", "It contains two separate routes. Unlock the Potential is the guided children’s program. Children’s Potential Coach Certification is professional training for adults. Choose based on who will participate."),
      q("What kinds of concerns might bring a family here?", "Parents often ask about confidence, attention, emotional expression, imagination, or tension around daily routines. The program does not diagnose a child or treat a medical, learning, or mental-health condition."),
      q("What actually happens in a children’s session?", "The approach uses age-appropriate explanation, choice, rapport, sensory or creative activities, reflection, and simple home practices. Final format, group size, caregiver involvement, and schedule are confirmed before enrollment."),
      q("What if my child does not want to participate?", "A child’s assent matters. The team should explain the activity in age-appropriate language and respect refusal, discomfort, or the need to pause. A parent’s interest does not remove the child’s right to choice."),
      q("Will you tell my child that something is wrong with them?", "No. The stated approach begins with strengths, context, needs, and safety—not labels or the idea that a child is a problem to be fixed."),
      q("How are parents or caregivers involved?", "Caregivers receive appropriate context and simple continuity practices while the child’s dignity and privacy are respected. Exact communication boundaries are agreed before participation."),
      q("Can this replace tutoring, paediatric care, or therapy?", "No. It may sit alongside appropriate educational, medical, or psychological support. If a child needs specialist assessment or treatment, families should use qualified providers."),
      q("Can I speak with the team before involving my child?", "Yes. A low-pressure parent enquiry is the recommended first step. You can ask about fit, safeguarding, facilitator experience, format, and what the child will be told."),
      ...booking,
    ],
    "Unlock-The-Potential.dc.html": [
      q("What age group is Unlock the Potential designed for?", "The current persona and source material centre primarily on children around ages 7–14, but the confirmed age range for a particular intake should be requested before enrollment."),
      q("What is the difference between Level I and Level II?", "Level I is the entry experience and Level II is intended to deepen the work. Exact curriculum, duration, prerequisites, and package structure must be confirmed for the next cohort."),
      q("Will this improve school performance or attention?", "The program may explore attention, confidence, emotional language, and supportive routines, but it cannot guarantee grades, test performance, or a particular behavioural result."),
      q("What if my child is shy, anxious, neurodivergent, or has additional needs?", "Share relevant access and support needs during the parent conversation without reducing the child to a label. The team must confirm whether the format is suitable and whether qualified specialist support should also be involved."),
      q("Do you use tests or diagnose learning difficulties?", "No. This is not a diagnostic or clinical assessment service. Observations from the program should not be presented as a diagnosis."),
      q("What will I know about what happens in sessions?", "Caregiver communication, child privacy, safeguarding, and any home practices should be agreed in advance. Ask exactly what is reported, what remains private, and how concerns are escalated."),
      q("What does it cost?", priceAnswer("unlock-the-potential")),
      ...foundations.slice(1, 5),
      ...booking,
    ],
    "Practitioner-Certification.dc.html": [
      q("Who are the certification pathways for?", "They are for coaches, educators, wellbeing practitioners, experienced students, and others who want structured preparation for responsible facilitation. They are not shortcuts around regulated professional training."),
      q("Can I apply without completing every Spiral level?", "Possibly, depending on the pathway and your prior experience. Direct-entry assessment, prerequisites, and any required foundation work must be confirmed before admission."),
      q("What should I verify before paying for a certification?", "Ask for the certificate title, total hours, live practice, assessment, practicum, facilitator qualifications, scope, recognition, post-training support, full fee, and refund terms in writing."),
      q("Will I practise with real people during training?", "Practicum and supervised practice are important expectations, but the exact requirement varies by pathway and must be confirmed for the intake you are considering."),
      ...practitionerCommon,
    ],
    "Childrens-Potential-Coach-Certification.dc.html": [
      q("What does the Children’s Potential Coach training prepare me to do?", "It is intended to develop child-centred session design, family communication, consent, safeguarding, scope, and reflective practice. The exact graduate role and permitted services must be confirmed before enrollment."),
      q("Do I need to be a parent, teacher, or therapist?", "Not necessarily, but relevant experience with children, maturity, communication skill, and safeguarding readiness matter. Admission criteria and background checks, if required, should be confirmed for each cohort."),
      q("Does this qualify me to diagnose or treat children?", "No. It does not confer clinical authority or permission to diagnose learning, developmental, medical, or mental-health conditions."),
      q("How is safeguarding taught and assessed?", "The curriculum should include child assent, caregiver consent, professional boundaries, privacy, reporting concerns, referral, and safe communication. Ask how these areas are assessed in practice."),
      q("What is the current price?", priceAnswer("childrens-potential-coach-certification", "Confirm whether the package includes all levels, assessment, practicum, materials, and post-training support.")),
      ...practitionerCommon,
    ],
    "Spiral-Journey.dc.html": [
      q("Do I have to complete all four Spirals?", "No. The sequence is designed to build progressively, but each enrollment is a separate decision. You can pause, integrate, or decide not to continue."),
      q("Can I enter Spiral II or III directly?", "Experienced practitioners may be considered for direct entry after a fit conversation. Placement should reflect actual foundations and readiness, not status or spiritual vocabulary."),
      q("How is the Spiral Journey different from a collection of workshops?", "The Spiral is sequential: foundations, relationships, purpose and discernment, then leadership and service. Workshops focus on a narrower theme and may be taken independently."),
      q("How much time should I leave between levels?", "Integration matters, but the site does not prescribe one universal interval. Cohort timing, personal capacity, and readiness should guide the decision."),
      q("What if I am already in therapy or another spiritual practice?", "You can continue appropriate care and may retain other practices. Discuss possible conflicts, emotional load, and scheduling so the combined commitment remains sustainable."),
      ...programCommon,
    ],
    "Spiral-I.dc.html": [
      q("Is Spiral I the right start if I feel burned out or disconnected?", "It is the main foundational route for people wanting a structured introduction to awareness, emotional signals, and everyday integration. Online Group Healing is a smaller first step if a multi-day program feels too large."),
      q("Will Spiral I fix my sleep, fatigue, or health condition?", "No result is guaranteed and the program is not medical treatment. It may help you observe patterns and practise supportive routines alongside appropriate professional care."),
      q("How intensive is the emotional work?", "The intention is a paced foundation, not forced disclosure or catharsis. You remain responsible for communicating limits and using additional support when needed."),
      q("What is the current fee?", priceAnswer("spiral-i")),
      ...programCommon,
    ],
    "Spiral-II.dc.html": [
      q("What is Spiral II mainly about?", "Spiral II explores recurring emotional, relational, and family-system patterns, then practises clearer needs, boundaries, communication, and repair."),
      q("Do I need to complete Spiral I first?", "Usually Spiral I provides the foundation. Experienced applicants may discuss direct placement, but readiness is considered rather than assumed."),
      q("Will I have to confront family members or disclose private history?", "No. Reflection and communication practice should respect privacy, consent, and safety. The program cannot require another person to participate or change."),
      q("What is the current fee?", priceAnswer("spiral-ii")),
      ...programCommon,
    ],
    "Spiral-III.dc.html": [
      q("Is Spiral III only for people who identify as intuitive?", "No. It is for people exploring discernment, purpose, and subtle perception without treating every impression as fact."),
      q("How do you distinguish intuition from fear or imagination?", "The program compares internal impressions with emotion, conditioning, context, and observable evidence. Responsible discernment welcomes uncertainty rather than claiming infallibility."),
      q("Will the program tell me my life purpose?", "No. It offers a framework for examining values, gifts, responsibilities, and possible directions. You remain responsible for real-world testing and decisions."),
      q("What is the current fee?", priceAnswer("spiral-iii")),
      ...programCommon,
    ],
    "Spiral-IV.dc.html": [
      q("Is Spiral IV a certification?", "Spiral IV is an integration, leadership, and service level. It may lead toward practitioner training, but completing it is not the same as receiving a professional credential."),
      q("Do I have to become a facilitator afterward?", "No. Leadership can mean living and contributing with greater coherence in your existing family, profession, or community."),
      q("How does Spiral IV connect to the Bigger Vision?", "It creates a bridge from personal integration toward responsible service, Earth Healing, practitioner development, and potentially the Planetary Symbiosis Network."),
      q("What is the current fee?", priceAnswer("spiral-iv")),
      ...programCommon,
    ],
    "ReGeneration.dc.html": [
      q("Who is ReGeneration for?", "It is for adults seeking a more sustainable relationship with rest, vitality, and restoration, including people who feel depleted after prolonged stress."),
      q("Is this a retreat or an adult workshop?", "ReGeneration can appear as an optional retreat branch after Spiral II. The exact delivery format, location, and cohort dates must be confirmed for the offering you are considering."),
      q("What is the difference between Level I and Level II?", "The source material identifies two levels, with Level II intended as a deeper continuation. Request the confirmed curriculum, prerequisites, duration, and inclusions before enrolling."),
      q("What does it cost?", priceAnswer("regeneration")),
      ...programCommon,
    ],
    "Rainbow-Light-Codes.dc.html": [
      q("What are ‘Rainbow Light Codes’ in practical terms?", "The page uses this as spiritual and creative language for colour, breath, imagery, attention, and reflective practice—not as a scientifically established code or medical intervention."),
      q("Is this suitable if I am skeptical of metaphysical language?", "You can engage with the exercises as symbolic or contemplative practices. You are not required to interpret imagery as objective fact."),
      q("Is this a standalone course or included elsewhere?", "The supplied pricing material describes Rainbow Light Code Healing as included within Earth Healing. A standalone product and fee have not been confirmed."),
      q("What does it cost?", priceAnswer("rainbow-light-codes")),
      ...programCommon,
    ],
    "Crystal-Healing.dc.html": [
      q("Do I need to own crystals before joining?", "Do not purchase materials until the team confirms what is needed. Any required or optional crystals should be listed with the final cohort details."),
      q("Are crystals presented as medical treatment?", "No. They are used as intentional objects within reflection, meditation, and space-setting—not as substitutes for diagnosis, medicine, or qualified care."),
      q("Can I join if I already work with crystals?", "Yes. Experienced participants should ask about depth and learning outcomes so the program does not simply repeat material they already know."),
      q("What is the current fee?", priceAnswer("crystal-healing")),
      ...programCommon,
    ],
    "Intuitive-Perception-Training.dc.html": [
      q("What is the goal of intuitive perception training?", "To develop sensitivity while strengthening discernment, consent, uncertainty tolerance, and the habit of checking impressions against context and evidence."),
      q("Will I be taught that every impression is true?", "No. Responsible practice distinguishes intuition from projection, fear, wishful thinking, memory, and observable information."),
      q("Can I use these skills professionally afterward?", "The workshop alone should not be treated as unrestricted professional authorization. Ask what the course covers, what competence is assessed, and what additional training or legal duties apply."),
      q("What is the current fee?", priceAnswer("intuitive-perception-training")),
      ...programCommon,
    ],
    "Holographic-Healing.dc.html": [
      q("What does ‘holographic’ mean on this page?", "It describes a whole-person map: body, emotion, attention, relationships, environment, and daily habits are considered together. It is a reflective framework, not a diagnostic technology."),
      q("Is this appropriate for a diagnosed health condition?", "It can only be considered as educational wellbeing support alongside qualified care. Do not delay assessment or treatment in order to attend."),
      q("Will I receive a diagnosis or personalised treatment plan?", "No. You may develop observations and questions that can be discussed with appropriate professionals."),
      q("What does it cost?", priceAnswer("holographic-healing")),
      ...programCommon,
    ],
    "Adult-Potential-Development.dc.html": [
      q("Is this a manifestation course?", "It explores beliefs, self-worth, direction, and practical action. It does not promise that intention alone controls external events or guarantees wealth."),
      q("Will this help me choose a career or business direction?", "It may help you clarify values, assumptions, experiments, and next steps. Professional, financial, or legal decisions still require appropriate expertise and real-world validation."),
      q("Is this only for people who feel unsuccessful?", "No. It can also suit people whose external life looks successful but feels misaligned, stagnant, or disconnected from their values."),
      q("What is the current fee?", priceAnswer("adult-potential-development")),
      ...programCommon,
    ],
    "Earth-Healer-Training.dc.html": [
      q("Is Earth Healer Training spiritual practice, ecological training, or certification?", "It is presented as a service-oriented pathway combining spiritual/ecological attention, place relationship, facilitation, reciprocity, and community practice. Ask for the exact credential and practical curriculum before enrolling."),
      q("Does the program involve real environmental work?", "The intention includes practical stewardship, but the precise fieldwork, service hours, partners, and assessment for each intake must be confirmed."),
      q("How does this connect to the Earth Healing Zone?", "The Earth Healing Zone is the accessible community practice. Earth Healer Training is the deeper learning route for people preparing to facilitate or steward related work responsibly."),
      q("What is the current fee?", priceAnswer("earth-healer-training")),
      ...practitionerCommon,
    ],
    "Group-Healing.dc.html": [
      q("What happens during Online Group Healing?", "You join at the published time through Zoom, settle in a private space, and follow the guided audio or live instructions. The session uses rest, attention, imagery, and reflection within a shared spiritual-wellbeing setting."),
      q("Do I have to speak or share personal information with the group?", "No personal disclosure should be required. Exact participation expectations are provided before the session, and you remain free to keep your camera or microphone use within the stated event rules."),
      q("Is the session live or prerecorded?", "The current model may use a prerecorded guided audio played during a fixed shared time, with the possibility of live guidance as the community grows. The booking card should state the format for each date."),
      q("What if I feel emotional or uncomfortable during the session?", "Pause the audio, ground yourself, leave the call if needed, and use appropriate personal or professional support. A group session cannot provide individual crisis care."),
      q("Is this the same as Spiral I?", "No. Group Healing is a lower-cost, lower-commitment introduction. Spiral I is a structured multi-day foundation program."),
      q("What does it cost?", priceAnswer("group-healing")),
      ...foundations,
      ...booking,
    ],
    "1-1-Sessions.dc.html": [
      q("How do I choose among the three Private Healing sessions?", "Choose by the pattern you want to explore: recurring personal and relational patterns, the atmosphere and dynamics of home, or inherited stories and inner possibility. The team reviews fit before scheduling."),
      q("Why is Private Healing application-only?", "The review protects scope, consent, privacy, and suitability. Applying does not guarantee acceptance, and the team may recommend a different kind of support."),
      q("Why do you request a recent headshot?", "The team describes it as part of its spiritual review process. It is not used for diagnosis or identity verification. Upload collection remains unavailable until secure storage, access, retention, and deletion procedures are confirmed."),
      q("Does the session happen while I am asleep?", "If accepted, the distance session is scheduled for an agreed rest or sleep period. You receive instructions beforehand and a written practitioner reflection afterward."),
      q("What is included after the session?", "The stated process includes a written reflection describing the practitioner’s work and suggested integration. Any follow-up session is a separate recommendation and decision."),
      q("What do Private Healing sessions cost?", priceAnswer("one-to-one-sessions")),
      ...foundations,
      ...booking,
    ],
    "Personal-Karma-Reconciliation.dc.html": [
      q("What does ‘karma’ mean in this session?", "It is the practitioner’s spiritual framework for recurring patterns, unresolved regret, resentment, attachment, and relational themes. It is not a factual determination of guilt, past lives, or why harm occurred."),
      q("Will you tell me that I caused everything that happened to me?", "No. Spiritual language must never be used to blame someone for abuse, illness, loss, or injustice. The focus is your present relationship with patterns and choices."),
      q("Do I need to contact or forgive someone from my past?", "No. Reconciliation does not require unsafe contact, forced forgiveness, or removing appropriate boundaries. The session is centred on your own reflection and integration."),
      q("Can the practitioner verify a past life?", "No objective verification is claimed. Any past-life imagery should be treated as spiritual or symbolic material rather than established fact."),
      q("What does it cost?", priceAnswer("personal-karma-reconciliation")),
      ...foundations,
      ...booking,
    ],
    "Family-Information-Field-Restoration.dc.html": [
      q("Does my whole family need to participate?", "No. The current offer is framed as a private session for an adult reflecting on home and family patterns. It cannot promise to change another person without their participation."),
      q("What is a ‘family information field’?", "It is Rainbow Sanctuary’s spiritual language for the accumulated atmosphere, memories, habits, emotions, and relational patterns associated with a home and family."),
      q("Will this resolve conflict without communication or practical change?", "No. A spiritual session may support reflection and intention, but relationships also require boundaries, communication, accountability, and sometimes qualified family or individual support."),
      q("Can I submit information or photos of relatives without consent?", "Avoid unnecessary personal data about other people. The application should focus on your experience and what you are authorised to share."),
      q("What does it cost?", priceAnswer("family-information-field-restoration")),
      ...foundations,
      ...booking,
    ],
    "DNA-Activation.dc.html": [
      q("Does DNA Activation alter my biological DNA?", "No biological alteration, genetic testing, or medical treatment is claimed. ‘DNA activation’ is used symbolically within a spiritual practice about inherited stories, self-limiting beliefs, vitality, creativity, and possibility."),
      q("Can it treat genetic disease or repair damaged genes?", "No. Genetic or health concerns require qualified medical assessment. Do not replace or delay evidence-based care."),
      q("What might I explore during the session?", "Themes may include family narratives, learned limitations, confidence, intuition, creativity, and the relationship between past conditioning and present choices."),
      q("Will it unlock supernatural abilities?", "No guaranteed abilities or extraordinary outcomes are promised. Experiences are personal and should be integrated with discernment."),
      q("What does it cost?", priceAnswer("dna-activation")),
      ...foundations,
      ...booking,
    ],
    "Events-Retreats.dc.html": [
      q("Which dates on the calendar are confirmed?", "Only events with published date, location, status, and registration or interest instructions should be treated as public. Private cohorts and unconfirmed ideas are not shown as bookable events."),
      q("What does ‘Register interest’ mean?", "It means the event is collecting enquiries rather than accepting automatic admission or payment. Screening, legal readiness, capacity, and final terms may still need confirmation."),
      q("Can I filter events by audience?", "Yes. The calendar distinguishes group sessions, adult programs, family events, retreats, and community gatherings when dates exist."),
      q("Should I book travel as soon as I submit the form?", "No. Wait for written acceptance and confirmed venue, schedule, payment, cancellation terms, and travel guidance."),
      q("How will online event times be shown?", "Each event should display its time zone. Verify the converted time for your location before booking."),
      ...booking,
    ],
    "Awakening-Your-Inner-Light-2026.dc.html": [
      q("Is this retreat open for automatic booking?", "No. The current page collects interest only. Admission, payment, and travel should wait until the team completes the required legal, medical-safety, facilitator, venue, and emergency-readiness checks."),
      q("When and where is the retreat planned?", "The supplied brochure lists 1–7 October 2026 in Bocas del Toro, Panama, for seven days and six nights. The final venue and arrival instructions must be confirmed in writing."),
      q("What is the price?", "The supplied brochure lists USD 3,500 per person, or USD 3,000 early bird with a 50% deposit before 1 September 2026. Do not pay until the team issues final written terms and an authorised payment route."),
      q("Does the retreat include ayahuasca or other plant-medicine ceremonies?", "The supplied retreat material includes plant-medicine and ayahuasca ceremony language. Participation requires explicit informed consent, lawful and authorised provision, contraindication screening, and the right to decline any practice."),
      q("Who should not participate in plant-medicine ceremonies?", "Suitability depends on health history, medication, mental-health history, pregnancy status, and other factors that require qualified screening. Never stop prescribed medication to attend. The organisers must provide the final contraindication and escalation protocol."),
      q("Can I attend the retreat but decline a ceremony?", "The final consent model must make this clear. No one should be pressured into a psychoactive, ceremonial, or body-based practice. Ask what alternatives and support are available."),
      q("What support is provided before and after?", "The brochure describes preparation and integration, but exact calls, facilitator availability, emergency support, and follow-up duration must be confirmed before acceptance."),
      q("When should I arrange flights?", "Only after written acceptance, final venue confirmation, payment and cancellation terms, legal-readiness confirmation, and explicit travel instructions."),
      ...booking,
    ],
    "Earth-Healing-Zone.dc.html": [
      q("What is the Earth Healing Zone?", "It is a community space for shared-time guided spiritual practice and practical stewardship. The current model may use a recorded meditation at a fixed daily time, with live gatherings developing later."),
      q("Do I have to be in China or join from a particular place?", "No. The shared-time practice is designed for remote participation. Each gathering should state its time zone and access method."),
      q("Is this only meditation, or does it include practical environmental action?", "Both dimensions matter. The page connects inner practice with tangible care for land, water, community, and everyday ecological responsibility."),
      q("Can I train to facilitate Earth Healing?", "Earth Healer Training is the deeper route. Ask about prerequisites, curriculum, practicum, scope, and the exact relationship between graduates and future community gatherings."),
      q("Is there a fee to join the Earth Healing Zone?", "The current page does not publish a participation fee. Any contribution, membership, or event-specific price should be clear before registration."),
      ...foundations,
      ...booking,
    ],
    "Bigger-Vision.dc.html": [
      q("What is the Planetary Symbiosis Network?", "It is the longer-term vision for interconnected regenerative anchor communities combining ecological stewardship, education, wellbeing, community systems, and appropriate technology."),
      q("What exists today, and what is still aspirational?", "Rainbow Sanctuary programs, community practices, and the emerging Earth Healing pathway exist as the present bridge. The full Twelve Anchors network remains a developing vision rather than completed global infrastructure."),
      q("Is this an intentional community I can move into now?", "No current residential application or move-in process is published. Do not interpret the vision page as an offer of housing, land access, residency, or investment."),
      q("How can I contribute skills rather than join a healing program?", "Use the mission-aligned enquiry and name your concrete capabilities—land, governance, food systems, education, healing, infrastructure, technology, finance, or community operations."),
      q("Are you currently accepting investment or land contributions?", "No public investment, securities, donation, or land-transfer offer is made on the site. Any future arrangement would require appropriate legal structure, due diligence, governance, and written terms."),
      q("How will the network avoid becoming an isolated utopian project?", "The stated aim is intelligent interdependence: communities connected to local cultures, ecosystems, economies, and one another—not withdrawal from responsibility or scrutiny."),
      q("What is the most concrete first step for a mission-aligned builder?", "Read the current model, review Earth Healer Training, and submit a skills-based expression of interest. The team should then distinguish genuine near-term work from longer-horizon ideas."),
      ...foundations.slice(1, 4),
    ],
    "Community-Stories.dc.html": [
      q("Who is the Rainbow Sanctuary community for?", "It includes first-time participants, experienced practitioners, parents, facilitators, and mission-aligned contributors. You do not need to present yourself as spiritually advanced to belong."),
      q("Are the stories on this page guaranteed outcomes?", "No. They are individual experiences. They can illustrate what someone noticed, but they cannot predict what another person will experience."),
      q("How are testimonials selected and consented?", "Only stories with appropriate publication permission should be attributed. Sensitive details, children’s identities, and health information require particular care."),
      q("Can I participate quietly without sharing my story publicly?", "Yes. Community participation and marketing consent are separate. You should never have to provide a testimonial in order to receive a service."),
      q("How can I meet others in the community?", "Public events, group sessions, Earth Healing gatherings, and future practitioner activities are the clearest routes. Availability is shown through the Events page."),
      ...foundations.slice(1, 5),
    ],
    "Book-Consultation.dc.html": [
      q("Is this form a booking or an enquiry?", "It is an enquiry and fit request. Public group dates may offer direct registration, while private work, retreats, and some programs require review before scheduling."),
      q("Why are both email and WhatsApp required?", "Email provides a formal written record and policy links; WhatsApp helps the team follow up promptly across countries. Use an international number you actively monitor."),
      q("What should I write in my message?", "Describe your present situation, what you hope to change or learn, your relevant experience, and any practical timing or accessibility needs. Avoid unnecessary medical records or private information about other people."),
      q("How will my information be used?", "It is used to review fit and respond to the enquiry under the Privacy Policy. Sensitive photo collection remains disabled until secure handling and retention procedures are confirmed."),
      q("Does submitting the form guarantee acceptance?", "No. The team may accept, request more information, recommend another pathway, or decline when the scope or timing is not appropriate."),
      q("Can I ask questions without committing to buy?", "Yes. The conversation is for clarification and fit. Prices, format, dates, policies, and expectations should be clear before any payment decision."),
      ...booking.slice(2),
    ],
  };

  function dedupe(items) {
    const seen = new Set();
    return items.filter((item) => item?.question && item?.answer && !seen.has(item.question) && seen.add(item.question));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
  }

  function addStructuredData(items) {
    const existing = document.querySelector('script[data-rs-faq-schema]');
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.rsFaqSchema = "true";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer.replace(/<[^>]*>/g, "") },
      })),
    });
    document.head.appendChild(script);
  }

  function mount() {
    const file = location.pathname.split("/").pop() || "Home.dc.html";
    const items = dedupe(pages[file] || []);
    if (!items.length || document.querySelector("[data-rs-persona-faq]")) return;
    const main = document.querySelector("main");
    if (!main) return;

    const section = document.createElement("section");
    section.id = "frequently-asked-questions";
    section.className = "rs-persona-faq";
    section.dataset.rsPersonaFaq = "true";
    section.setAttribute("aria-labelledby", "rs-faq-title");
    section.innerHTML = `<div class="rs-persona-faq__shell"><header class="rs-persona-faq__heading"><span class="rs-persona-faq__eyebrow">Questions people ask before choosing</span><h2 id="rs-faq-title">Clear answers, before you decide.</h2><p class="rs-persona-faq__intro">Your questions are part of discernment—not an obstacle to enrollment. Start with what matters most to you.</p></header><div class="rs-persona-faq__list">${items.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("")}</div></div>`;

    const legacy = main.querySelector("#questions");
    const finalCta = legacy || [...main.children].reverse().find((child) => child.querySelector?.(".rs-offer-cta"));
    if (finalCta) main.insertBefore(section, finalCta);
    else main.appendChild(section);

    if (legacy) {
      legacy.querySelector(".rs-section-heading")?.remove();
      legacy.querySelector(".rs-faq")?.remove();
      if (!legacy.querySelector(".rs-offer-cta")) legacy.remove();
    }

    section.querySelectorAll("details").forEach((detail) => {
      detail.addEventListener("toggle", () => {
        if (!detail.open) return;
        section.querySelectorAll("details[open]").forEach((other) => {
          if (other !== detail) other.open = false;
        });
      });
    });
    addStructuredData(items);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
  new MutationObserver(mount).observe(document.documentElement, { childList: true, subtree: true });
})();
