/**
 * DETERMINISTISK MAPPING: Morfologiske Dimensioner → Theory U Faser
 * 
 * Hver dimension har en vægtning for hver Theory U fase.
 * Score beregnes som: sum(dimension_weight * phase_score) / total_weights
 */

export type TheoryUPhase = 'downloading' | 'seeing' | 'sensing' | 'presencing' | 'crystallizing' | 'prototyping' | 'performing';

export interface PhaseScore {
  phase: TheoryUPhase;
  score: number;
  contributions: {
    dimension: string;
    value: string;
    contribution: number;
    reasoning: string;
  }[];
}

/**
 * Mapping Matrix: Hver dimension's værdi → phase scores
 */
const MORPHOLOGY_TO_PHASE_WEIGHTS: Record<string, Record<string, Record<TheoryUPhase, { score: number; reason: string }>>> = {
  // COMPLEXITY: Høj kompleksitet kræver dybere sensing/presencing
  complexity: {
    simple: {
      downloading: { score: 3, reason: 'Simpel kompleksitet tillader standardmetoder' },
      seeing: { score: 2, reason: 'Kræver stadig observation' },
      sensing: { score: 1, reason: 'Minimal behov for dyb sensing' },
      presencing: { score: 0, reason: 'Ikke nødvendigt for simple problemer' },
      crystallizing: { score: 2, reason: 'Kan hurtigt krystallisere løsning' },
      prototyping: { score: 3, reason: 'Let at prototype simple løsninger' },
      performing: { score: 3, reason: 'Hurtig implementering mulig' },
    },
    complicated: {
      downloading: { score: 2, reason: 'Noget nyt input nødvendigt' },
      seeing: { score: 3, reason: 'Vigtigt at se sammenhænge' },
      sensing: { score: 2, reason: 'Moderat behov for sensing' },
      presencing: { score: 1, reason: 'Minimal presencing behov' },
      crystallizing: { score: 2, reason: 'Kræver tid til at krystallisere' },
      prototyping: { score: 2, reason: 'Prototype af komplicerede dele' },
      performing: { score: 2, reason: 'Implementering kræver koordinering' },
    },
    complex: {
      downloading: { score: 0, reason: 'Gamle metoder virker ikke' },
      seeing: { score: 2, reason: 'Observation fra flere vinkler nødvendig' },
      sensing: { score: 4, reason: 'Dyb sensing af hele systemet kritisk' },
      presencing: { score: 3, reason: 'Presencing hjælper med at finde vej' },
      crystallizing: { score: 2, reason: 'Emergent krystallisering' },
      prototyping: { score: 1, reason: 'Eksperimentel prototyping' },
      performing: { score: 0, reason: 'For tidligt at implementere' },
    },
    chaotic: {
      downloading: { score: 0, reason: 'Kaos kræver helt nye tilgange' },
      seeing: { score: 1, reason: 'Svært at se mønstre i kaos' },
      sensing: { score: 3, reason: 'Sensing af svage signaler vigtigt' },
      presencing: { score: 4, reason: 'Presencing nødvendigt for at finde retning' },
      crystallizing: { score: 2, reason: 'Gradvis krystallisering af orden' },
      prototyping: { score: 1, reason: 'Hurtige eksperimenter i kaos' },
      performing: { score: 0, reason: 'Implementering for risikabelt' },
    },
  },

  // STAKEHOLDER: Konflikt kræver dyb dialog og sensing
  stakeholder: {
    unified: {
      downloading: { score: 2, reason: 'Enighed tillader standardprocesser' },
      seeing: { score: 2, reason: 'Moderat observation' },
      sensing: { score: 1, reason: 'Mindre behov for dyb lytning' },
      presencing: { score: 1, reason: 'Enighed reducerer presencing-behov' },
      crystallizing: { score: 3, reason: 'Let at krystallisere fælles vision' },
      prototyping: { score: 3, reason: 'Samarbejde om prototyper' },
      performing: { score: 3, reason: 'Hurtig implementering med enighed' },
    },
    cooperative: {
      downloading: { score: 1, reason: 'Behov for at lytte til hinanden' },
      seeing: { score: 2, reason: 'Se forskellige perspektiver' },
      sensing: { score: 2, reason: 'Sensing af fælles grund' },
      presencing: { score: 2, reason: 'Moderat presencing for samklang' },
      crystallizing: { score: 3, reason: 'Fælles krystallisering mulig' },
      prototyping: { score: 2, reason: 'Samarbejde om prototyper' },
      performing: { score: 2, reason: 'Koordineret implementering' },
    },
    competitive: {
      downloading: { score: 0, reason: 'Konkurrence kræver nye metoder' },
      seeing: { score: 3, reason: 'Vigtig at se alle positioner' },
      sensing: { score: 4, reason: 'Dyb sensing af konflikter nødvendig' },
      presencing: { score: 3, reason: 'Presencing for at finde fælles grund' },
      crystallizing: { score: 2, reason: 'Krystallisering gennem forhandling' },
      prototyping: { score: 1, reason: 'Svært at prototype sammen' },
      performing: { score: 0, reason: 'Implementering blokeret af konflikt' },
    },
    adversarial: {
      downloading: { score: 0, reason: 'Fjendtlighed kræver radikal ændring' },
      seeing: { score: 2, reason: 'Se fjendtlige positioner' },
      sensing: { score: 5, reason: 'Maksimal sensing af menneskelig dimension' },
      presencing: { score: 4, reason: 'Presencing kritisk for gensidig forståelse' },
      crystallizing: { score: 1, reason: 'Meget svært at krystallisere sammen' },
      prototyping: { score: 0, reason: 'Prototyping næsten umulig' },
      performing: { score: 0, reason: 'Implementering blokeret' },
    },
  },

  // KNOWLEDGE: Innovation kræver presencing og crystallizing
  knowledge: {
    routine: {
      downloading: { score: 4, reason: 'Rutine kan gentages' },
      seeing: { score: 2, reason: 'Minimal ny observation nødvendig' },
      sensing: { score: 0, reason: 'Ingen sensing nødvendig' },
      presencing: { score: 0, reason: 'Ikke relevant for rutine' },
      crystallizing: { score: 1, reason: 'Rutine allerede krystalliseret' },
      prototyping: { score: 2, reason: 'Standardprototyper' },
      performing: { score: 4, reason: 'Hurtig implementering' },
    },
    adaptive: {
      downloading: { score: 2, reason: 'Noget gentagelse mulig' },
      seeing: { score: 3, reason: 'Se nye mønstre' },
      sensing: { score: 2, reason: 'Moderat sensing af kontekst' },
      presencing: { score: 1, reason: 'Minimal presencing' },
      crystallizing: { score: 2, reason: 'Tilpas krystallisering' },
      prototyping: { score: 3, reason: 'Adaptiv prototyping' },
      performing: { score: 2, reason: 'Implementering med tilpasninger' },
    },
    innovative: {
      downloading: { score: 0, reason: 'Innovation kræver nyt' },
      seeing: { score: 2, reason: 'Se muligheder' },
      sensing: { score: 3, reason: 'Sensing af behov og muligheder' },
      presencing: { score: 3, reason: 'Forbindelse til nye idéer' },
      crystallizing: { score: 4, reason: 'Kritisk fase for innovation' },
      prototyping: { score: 3, reason: 'Innovativ prototyping' },
      performing: { score: 1, reason: 'Implementering kræver validering' },
    },
    breakthrough: {
      downloading: { score: 0, reason: 'Gennembrud kræver total nytænkning' },
      seeing: { score: 1, reason: 'Se hinsides det kendte' },
      sensing: { score: 4, reason: 'Dyb sensing af emerging future' },
      presencing: { score: 5, reason: 'Maksimal presencing for gennembrud' },
      crystallizing: { score: 4, reason: 'Krystallisering af radikalt nyt' },
      prototyping: { score: 2, reason: 'Eksperimentel prototyping' },
      performing: { score: 0, reason: 'For tidligt at implementere' },
    },
  },

  // CULTURAL: Cross-cultural kræver dyb sensing
  cultural: {
    mono: {
      downloading: { score: 3, reason: 'Fælles kultur tillader standarder' },
      seeing: { score: 2, reason: 'Moderat observation' },
      sensing: { score: 1, reason: 'Mindre behov for kulturel sensing' },
      presencing: { score: 1, reason: 'Minimal presencing i mono-kultur' },
      crystallizing: { score: 2, reason: 'Fælles krystallisering lettere' },
      prototyping: { score: 3, reason: 'Prototyping i fælles kultur' },
      performing: { score: 3, reason: 'Implementering med fælles forståelse' },
    },
    crossfunctional: {
      downloading: { score: 1, reason: 'Forskellige perspektiver kræver lytning' },
      seeing: { score: 3, reason: 'Se på tværs af funktioner' },
      sensing: { score: 2, reason: 'Sensing af funktionelle forskelle' },
      presencing: { score: 2, reason: 'Moderat presencing' },
      crystallizing: { score: 3, reason: 'Krystallisering på tværs' },
      prototyping: { score: 2, reason: 'Cross-functional prototyping' },
      performing: { score: 2, reason: 'Koordineret implementering' },
    },
    crossorg: {
      downloading: { score: 0, reason: 'Organisatoriske grænser kræver nyt' },
      seeing: { score: 3, reason: 'Se på tværs af organisationer' },
      sensing: { score: 4, reason: 'Dyb sensing af organisationskulturer' },
      presencing: { score: 3, reason: 'Presencing for fælles grund' },
      crystallizing: { score: 2, reason: 'Kompleks krystallisering' },
      prototyping: { score: 1, reason: 'Svært at prototype sammen' },
      performing: { score: 1, reason: 'Implementering kræver alignment' },
    },
    crosscultural: {
      downloading: { score: 0, reason: 'Kulturelle forskelle kræver radikal åbenhed' },
      seeing: { score: 2, reason: 'Se kulturelle perspektiver' },
      sensing: { score: 5, reason: 'Maksimal sensing af kulturelle nuancer' },
      presencing: { score: 4, reason: 'Presencing for kulturel bro' },
      crystallizing: { score: 2, reason: 'Krystallisering på tværs af kulturer' },
      prototyping: { score: 1, reason: 'Kulturel prototyping udfordrende' },
      performing: { score: 0, reason: 'Implementering meget kompleks' },
    },
  },

  // TEMPORAL: Transformation kræver dybere faser
  temporal: {
    sprint: {
      downloading: { score: 2, reason: 'Korte sprints kan bruge kendte metoder' },
      seeing: { score: 2, reason: 'Hurtig observation' },
      sensing: { score: 1, reason: 'Begrænset tid til sensing' },
      presencing: { score: 0, reason: 'Ikke tid til presencing' },
      crystallizing: { score: 2, reason: 'Hurtig krystallisering' },
      prototyping: { score: 4, reason: 'Prototyping er fokus i sprints' },
      performing: { score: 3, reason: 'Hurtig implementering' },
    },
    project: {
      downloading: { score: 1, reason: 'Projekter kræver noget nyt' },
      seeing: { score: 3, reason: 'Tid til ordentlig observation' },
      sensing: { score: 2, reason: 'Moderat sensing mulig' },
      presencing: { score: 1, reason: 'Begrænset presencing' },
      crystallizing: { score: 3, reason: 'Krystallisering af projektmål' },
      prototyping: { score: 3, reason: 'Prototyping i projekter' },
      performing: { score: 2, reason: 'Projektimplementering' },
    },
    program: {
      downloading: { score: 0, reason: 'Programmer kræver nytænkning' },
      seeing: { score: 2, reason: 'Programobservation' },
      sensing: { score: 3, reason: 'Sensing af programkompleksitet' },
      presencing: { score: 2, reason: 'Moderat presencing nødvendig' },
      crystallizing: { score: 3, reason: 'Programkrystallisering' },
      prototyping: { score: 2, reason: 'Program prototyping' },
      performing: { score: 1, reason: 'Lang implementering' },
    },
    transformation: {
      downloading: { score: 0, reason: 'Transformation kræver radikalt nyt' },
      seeing: { score: 2, reason: 'Se transformationsbehov' },
      sensing: { score: 4, reason: 'Dyb sensing af systemet' },
      presencing: { score: 5, reason: 'Maksimal presencing for transformation' },
      crystallizing: { score: 4, reason: 'Krystallisering af transformativ vision' },
      prototyping: { score: 2, reason: 'Transformativ prototyping' },
      performing: { score: 1, reason: 'Lang transformationsimplementering' },
    },
  },

  // ORGANIZATIONAL: Teal kræver presencing og crystallizing
  organizational: {
    red: {
      downloading: { score: 4, reason: 'Autoritær kontrol = standardmetoder' },
      seeing: { score: 1, reason: 'Minimal observation' },
      sensing: { score: 0, reason: 'Ingen sensing i red' },
      presencing: { score: 0, reason: 'Ikke relevant' },
      crystallizing: { score: 1, reason: 'Top-down krystallisering' },
      prototyping: { score: 2, reason: 'Kommanderet prototyping' },
      performing: { score: 4, reason: 'Hurtig eksekvering' },
    },
    amber: {
      downloading: { score: 3, reason: 'Processer og hierarki' },
      seeing: { score: 2, reason: 'Noget observation' },
      sensing: { score: 1, reason: 'Minimal sensing' },
      presencing: { score: 0, reason: 'Ikke del af amber' },
      crystallizing: { score: 2, reason: 'Hierarkisk krystallisering' },
      prototyping: { score: 2, reason: 'Proces-baseret prototyping' },
      performing: { score: 3, reason: 'Struktureret implementering' },
    },
    orange: {
      downloading: { score: 2, reason: 'Innovation tilladt indenfor rammer' },
      seeing: { score: 3, reason: 'Strategisk observation' },
      sensing: { score: 2, reason: 'Markedssensing' },
      presencing: { score: 1, reason: 'Minimal presencing' },
      crystallizing: { score: 3, reason: 'Strategisk krystallisering' },
      prototyping: { score: 3, reason: 'Innovativ prototyping' },
      performing: { score: 2, reason: 'Performance-fokuseret' },
    },
    green: {
      downloading: { score: 1, reason: 'Konsensus kræver lytning' },
      seeing: { score: 3, reason: 'Se alle perspektiver' },
      sensing: { score: 3, reason: 'Sensing af gruppeenergi' },
      presencing: { score: 2, reason: 'Moderat presencing i grupper' },
      crystallizing: { score: 3, reason: 'Konsensus-baseret krystallisering' },
      prototyping: { score: 2, reason: 'Kollaborativ prototyping' },
      performing: { score: 2, reason: 'Implementering med konsensus' },
    },
    teal: {
      downloading: { score: 0, reason: 'Teal = emergent evolution' },
      seeing: { score: 2, reason: 'Kollektiv observation' },
      sensing: { score: 4, reason: 'Distribueret sensing' },
      presencing: { score: 5, reason: 'Maksimal presencing i teal' },
      crystallizing: { score: 4, reason: 'Emergent krystallisering' },
      prototyping: { score: 3, reason: 'Evolutionær prototyping' },
      performing: { score: 2, reason: 'Self-management implementering' },
    },
  },

  // CHALLENGE: Adaptive challenges kræver sensing/presencing
  challenge: {
    technical: {
      downloading: { score: 3, reason: 'Tekniske løsninger kan genbruges' },
      seeing: { score: 2, reason: 'Observation af teknisk problem' },
      sensing: { score: 1, reason: 'Minimal sensing nødvendig' },
      presencing: { score: 0, reason: 'Ikke relevant for teknisk' },
      crystallizing: { score: 2, reason: 'Teknisk krystallisering' },
      prototyping: { score: 4, reason: 'Teknisk prototyping vigtig' },
      performing: { score: 3, reason: 'Teknisk implementering' },
    },
    social: {
      downloading: { score: 1, reason: 'Social kompleksitet kræver lytning' },
      seeing: { score: 3, reason: 'Se sociale dynamikker' },
      sensing: { score: 3, reason: 'Sensing af sociale felter' },
      presencing: { score: 2, reason: 'Moderat presencing' },
      crystallizing: { score: 3, reason: 'Social krystallisering' },
      prototyping: { score: 2, reason: 'Social prototyping' },
      performing: { score: 2, reason: 'Social implementering' },
    },
    political: {
      downloading: { score: 0, reason: 'Politik kræver radikalt nye tilgange' },
      seeing: { score: 3, reason: 'Se magtdynamikker' },
      sensing: { score: 4, reason: 'Dyb sensing af politiske strømme' },
      presencing: { score: 3, reason: 'Presencing for at transformere politik' },
      crystallizing: { score: 2, reason: 'Politisk krystallisering svær' },
      prototyping: { score: 1, reason: 'Politisk prototyping risikabel' },
      performing: { score: 1, reason: 'Implementering blokeret af politik' },
    },
    cognitive: {
      downloading: { score: 1, reason: 'Kognitive udfordringer kræver nytænkning' },
      seeing: { score: 3, reason: 'Se mentale modeller' },
      sensing: { score: 4, reason: 'Sensing af tankemønstre' },
      presencing: { score: 4, reason: 'Presencing for at transcendere tænkning' },
      crystallizing: { score: 3, reason: 'Krystallisering af ny tænkning' },
      prototyping: { score: 2, reason: 'Kognitiv prototyping' },
      performing: { score: 1, reason: 'Implementering kræver mental shift' },
    },
    adaptive: {
      downloading: { score: 0, reason: 'Adaptive challenges = intet svar endnu' },
      seeing: { score: 2, reason: 'Se adaptiv kompleksitet' },
      sensing: { score: 5, reason: 'Maksimal sensing af emerging reality' },
      presencing: { score: 5, reason: 'Maksimal presencing for adaptive løsning' },
      crystallizing: { score: 4, reason: 'Emergent krystallisering' },
      prototyping: { score: 2, reason: 'Adaptiv eksperimentering' },
      performing: { score: 0, reason: 'For tidligt at implementere' },
    },
  },

  // DEVELOPMENT: Being/Relating indikerer behov for sensing
  development: {
    being: {
      downloading: { score: 0, reason: 'Being kræver presencing' },
      seeing: { score: 1, reason: 'Minimal observation' },
      sensing: { score: 4, reason: 'Being udvikles gennem sensing' },
      presencing: { score: 5, reason: 'Maksimal presencing for being' },
      crystallizing: { score: 3, reason: 'Krystallisering af væren' },
      prototyping: { score: 1, reason: 'Svært at prototype being' },
      performing: { score: 0, reason: 'Being er ikke performance' },
    },
    thinking: {
      downloading: { score: 2, reason: 'Tænkning kan bruge kendt viden' },
      seeing: { score: 3, reason: 'Observation og analyse' },
      sensing: { score: 2, reason: 'Sensing af tænkemønstre' },
      presencing: { score: 2, reason: 'Moderat presencing' },
      crystallizing: { score: 3, reason: 'Krystallisering af idéer' },
      prototyping: { score: 3, reason: 'Prototype af koncepter' },
      performing: { score: 2, reason: 'Implementering af tænkning' },
    },
    relating: {
      downloading: { score: 1, reason: 'Relating kræver åbenhed' },
      seeing: { score: 3, reason: 'Se relationelle dynamikker' },
      sensing: { score: 4, reason: 'Sensing af relationer kritisk' },
      presencing: { score: 3, reason: 'Presencing for dybere relating' },
      crystallizing: { score: 2, reason: 'Krystallisering af relationer' },
      prototyping: { score: 2, reason: 'Relationel prototyping' },
      performing: { score: 1, reason: 'Implementering kræver tillid' },
    },
    collaborating: {
      downloading: { score: 1, reason: 'Samarbejde kræver lytning' },
      seeing: { score: 3, reason: 'Se samarbejdsmønstre' },
      sensing: { score: 3, reason: 'Sensing af gruppedynamik' },
      presencing: { score: 2, reason: 'Moderat presencing' },
      crystallizing: { score: 3, reason: 'Fælles krystallisering' },
      prototyping: { score: 3, reason: 'Kollaborativ prototyping' },
      performing: { score: 2, reason: 'Samarbejdende implementering' },
    },
    acting: {
      downloading: { score: 2, reason: 'Handling kan bruge kendt praksis' },
      seeing: { score: 2, reason: 'Observation af handling' },
      sensing: { score: 1, reason: 'Mindre sensing nødvendig' },
      presencing: { score: 1, reason: 'Minimal presencing' },
      crystallizing: { score: 3, reason: 'Krystallisering af handling' },
      prototyping: { score: 4, reason: 'Handling gennem prototyping' },
      performing: { score: 4, reason: 'Maksimal performance' },
    },
  },

  // RESOURCES: Scarcity kræver kreativitet (presencing/crystallizing)
  resources: {
    rich: {
      downloading: { score: 3, reason: 'Ressourcer tillader standardmetoder' },
      seeing: { score: 2, reason: 'Moderat observation' },
      sensing: { score: 1, reason: 'Mindre behov for sensing' },
      presencing: { score: 1, reason: 'Minimal presencing' },
      crystallizing: { score: 2, reason: 'Krystallisering med ressourcer' },
      prototyping: { score: 3, reason: 'Ressourcerig prototyping' },
      performing: { score: 4, reason: 'Hurtig implementering' },
    },
    balanced: {
      downloading: { score: 2, reason: 'Balance tillader noget gentagelse' },
      seeing: { score: 3, reason: 'Strategisk observation' },
      sensing: { score: 2, reason: 'Moderat sensing' },
      presencing: { score: 2, reason: 'Moderat presencing' },
      crystallizing: { score: 3, reason: 'Balanceret krystallisering' },
      prototyping: { score: 3, reason: 'Balanceret prototyping' },
      performing: { score: 2, reason: 'Kontrolleret implementering' },
    },
    constrained: {
      downloading: { score: 1, reason: 'Begrænsninger kræver kreativitet' },
      seeing: { score: 3, reason: 'Se muligheder i begrænsninger' },
      sensing: { score: 3, reason: 'Sensing af ressourcedynamik' },
      presencing: { score: 3, reason: 'Presencing for kreative løsninger' },
      crystallizing: { score: 4, reason: 'Kreativ krystallisering nødvendig' },
      prototyping: { score: 2, reason: 'Begrænset prototyping' },
      performing: { score: 1, reason: 'Implementering udfordrende' },
    },
    scarce: {
      downloading: { score: 0, reason: 'Knaphed kræver radikalt nyt' },
      seeing: { score: 2, reason: 'Se creative muligheder' },
      sensing: { score: 4, reason: 'Dyb sensing for at finde vej' },
      presencing: { score: 5, reason: 'Maksimal presencing for innovation' },
      crystallizing: { score: 4, reason: 'Krystallisering af frugale løsninger' },
      prototyping: { score: 2, reason: 'Minimal viable prototyping' },
      performing: { score: 0, reason: 'Implementering meget vanskelig' },
    },
  },

  // CHANGE: Transformational/Disruptive kræver presencing
  change: {
    incremental: {
      downloading: { score: 3, reason: 'Incremental = gentagelse' },
      seeing: { score: 2, reason: 'Observation af små ændringer' },
      sensing: { score: 1, reason: 'Minimal sensing' },
      presencing: { score: 0, reason: 'Ikke nødvendigt' },
      crystallizing: { score: 2, reason: 'Inkrementel krystallisering' },
      prototyping: { score: 3, reason: 'Små prototyper' },
      performing: { score: 4, reason: 'Hurtig implementering' },
    },
    transitional: {
      downloading: { score: 1, reason: 'Transition kræver nyt' },
      seeing: { score: 3, reason: 'Se fra-til tilstande' },
      sensing: { score: 2, reason: 'Sensing af transition' },
      presencing: { score: 2, reason: 'Moderat presencing' },
      crystallizing: { score: 3, reason: 'Krystallisering af fremtid' },
      prototyping: { score: 3, reason: 'Prototyping af ny tilstand' },
      performing: { score: 2, reason: 'Implementering af transition' },
    },
    transformational: {
      downloading: { score: 0, reason: 'Transformation kræver radikal nytænkning' },
      seeing: { score: 2, reason: 'Se transformativ mulighed' },
      sensing: { score: 4, reason: 'Dyb sensing af transformationsbehov' },
      presencing: { score: 5, reason: 'Maksimal presencing for transformation' },
      crystallizing: { score: 4, reason: 'Krystallisering af transformativ vision' },
      prototyping: { score: 2, reason: 'Transformativ prototyping' },
      performing: { score: 1, reason: 'Lang transformationsrejse' },
    },
    disruptive: {
      downloading: { score: 0, reason: 'Disruption = ingen gamle svar' },
      seeing: { score: 2, reason: 'Se disruptiv mulighed' },
      sensing: { score: 5, reason: 'Maksimal sensing af emerging future' },
      presencing: { score: 5, reason: 'Maksimal presencing for disruption' },
      crystallizing: { score: 4, reason: 'Krystallisering af disruptiv vision' },
      prototyping: { score: 3, reason: 'Radikal prototyping' },
      performing: { score: 0, reason: 'Implementering meget usikker' },
    },
  },

  // INFORMATION: Distributed kræver sensing af netværk
  information: {
    centralized: {
      downloading: { score: 4, reason: 'Centralisering = kontrol og standarder' },
      seeing: { score: 1, reason: 'Minimal observation nødvendig' },
      sensing: { score: 0, reason: 'Ingen sensing i centralisering' },
      presencing: { score: 0, reason: 'Ikke relevant' },
      crystallizing: { score: 2, reason: 'Top-down krystallisering' },
      prototyping: { score: 2, reason: 'Kontrolleret prototyping' },
      performing: { score: 4, reason: 'Hurtig central eksekvering' },
    },
    hierarchical: {
      downloading: { score: 3, reason: 'Hierarki tillader standardprocesser' },
      seeing: { score: 2, reason: 'Observation gennem hierarki' },
      sensing: { score: 1, reason: 'Minimal sensing' },
      presencing: { score: 0, reason: 'Ikke del af hierarki' },
      crystallizing: { score: 2, reason: 'Hierarkisk krystallisering' },
      prototyping: { score: 2, reason: 'Struktureret prototyping' },
      performing: { score: 3, reason: 'Hierarkisk implementering' },
    },
    network: {
      downloading: { score: 1, reason: 'Netværk kræver distribueret lytning' },
      seeing: { score: 3, reason: 'Se netværksmønstre' },
      sensing: { score: 3, reason: 'Sensing af netværksdynamik' },
      presencing: { score: 3, reason: 'Presencing i netværk' },
      crystallizing: { score: 3, reason: 'Emergent krystallisering' },
      prototyping: { score: 3, reason: 'Netværksprototyping' },
      performing: { score: 2, reason: 'Distribueret implementering' },
    },
    distributed: {
      downloading: { score: 0, reason: 'Distribution kræver emergent koordinering' },
      seeing: { score: 2, reason: 'Distribueret observation' },
      sensing: { score: 4, reason: 'Maksimal sensing af distribueret system' },
      presencing: { score: 4, reason: 'Kollektiv presencing' },
      crystallizing: { score: 4, reason: 'Emergent krystallisering' },
      prototyping: { score: 3, reason: 'Distribueret prototyping' },
      performing: { score: 2, reason: 'Self-organized implementering' },
    },
  },

  // RISK: High risk kræver presencing før action
  risk: {
    low: {
      downloading: { score: 3, reason: 'Lav risiko = standardmetoder ok' },
      seeing: { score: 2, reason: 'Moderat observation' },
      sensing: { score: 1, reason: 'Minimal sensing' },
      presencing: { score: 0, reason: 'Ikke nødvendigt' },
      crystallizing: { score: 2, reason: 'Hurtig krystallisering' },
      prototyping: { score: 3, reason: 'Tryg prototyping' },
      performing: { score: 4, reason: 'Hurtig implementering' },
    },
    moderate: {
      downloading: { score: 2, reason: 'Moderat risiko kræver omtanke' },
      seeing: { score: 3, reason: 'Observation af risici' },
      sensing: { score: 2, reason: 'Sensing af risikodynamik' },
      presencing: { score: 1, reason: 'Moderat presencing' },
      crystallizing: { score: 3, reason: 'Omhyggelig krystallisering' },
      prototyping: { score: 3, reason: 'Testning før implementering' },
      performing: { score: 2, reason: 'Kontrolleret implementering' },
    },
    high: {
      downloading: { score: 0, reason: 'Høj risiko = intet kendt svar' },
      seeing: { score: 3, reason: 'Grundig observation af risici' },
      sensing: { score: 4, reason: 'Dyb sensing før action' },
      presencing: { score: 4, reason: 'Presencing for at finde sikker vej' },
      crystallizing: { score: 3, reason: 'Omhyggelig krystallisering' },
      prototyping: { score: 2, reason: 'Forsigtig prototyping' },
      performing: { score: 1, reason: 'Implementering meget risikabel' },
    },
    extreme: {
      downloading: { score: 0, reason: 'Ekstrem risiko = total nytænkning' },
      seeing: { score: 2, reason: 'Se risici klart' },
      sensing: { score: 5, reason: 'Maksimal sensing af alle signaler' },
      presencing: { score: 5, reason: 'Maksimal presencing for klarhed' },
      crystallizing: { score: 4, reason: 'Meget omhyggelig krystallisering' },
      prototyping: { score: 1, reason: 'Minimal prototyping' },
      performing: { score: 0, reason: 'Implementering ekstremt farlig' },
    },
  },
};

/**
 * Beregn Theory U position baseret på morfologiske dimensioner
 */
export function calculateTheoryUPosition(morphology: Record<string, string>): PhaseScore[] {
  const phaseScores: Record<TheoryUPhase, { total: number; contributions: any[] }> = {
    downloading: { total: 0, contributions: [] },
    seeing: { total: 0, contributions: [] },
    sensing: { total: 0, contributions: [] },
    presencing: { total: 0, contributions: [] },
    crystallizing: { total: 0, contributions: [] },
    prototyping: { total: 0, contributions: [] },
    performing: { total: 0, contributions: [] },
  };

  // Gennemgå hver dimension i morfologien
  for (const [dimension, value] of Object.entries(morphology)) {
    const dimensionWeights = MORPHOLOGY_TO_PHASE_WEIGHTS[dimension];
    if (!dimensionWeights || !value) continue;

    const valueWeights = dimensionWeights[value];
    if (!valueWeights) continue;

    // Tilføj hver dimensions bidrag til hver fase
    for (const phase of Object.keys(phaseScores) as TheoryUPhase[]) {
      const weight = valueWeights[phase];
      phaseScores[phase].total += weight.score;
      phaseScores[phase].contributions.push({
        dimension,
        value,
        contribution: weight.score,
        reasoning: weight.reason,
      });
    }
  }

  // Sorter faser efter score (højest først)
  const rankedPhases: PhaseScore[] = (Object.entries(phaseScores) as [TheoryUPhase, typeof phaseScores[TheoryUPhase]][])
    .map(([phase, data]) => ({
      phase,
      score: data.total,
      contributions: data.contributions.filter(c => c.contribution > 0).sort((a, b) => b.contribution - a.contribution),
    }))
    .sort((a, b) => b.score - a.score);

  return rankedPhases;
}

/**
 * Get the most likely current phase based on morphology
 */
export function getDominantPhase(morphology: Record<string, string>): {
  phase: TheoryUPhase;
  score: number;
  confidence: number;
  evidence: string[];
} {
  const rankedPhases = calculateTheoryUPosition(morphology);
  const topPhase = rankedPhases[0];
  const secondPhase = rankedPhases[1];

  // Beregn confidence baseret på forskel mellem top 2
  const scoreDiff = topPhase.score - secondPhase.score;
  const maxPossibleScore = Object.keys(morphology).length * 5; // Max 5 points per dimension
  const confidence = Math.min(0.95, 0.5 + (scoreDiff / maxPossibleScore) * 0.5);

  // Saml evidens fra top bidrag
  const topContributions = topPhase.contributions.slice(0, 5);
  const evidence = topContributions.map(c => 
    `${c.dimension} (${c.value}): ${c.reasoning}`
  );

  return {
    phase: topPhase.phase,
    score: topPhase.score,
    confidence,
    evidence,
  };
}
