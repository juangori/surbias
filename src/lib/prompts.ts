const PROMPTS: Record<string, string[]> = {
  en: [
    "Tell us about a project that failed spectacularly.",
    "What career move do you regret the most?",
    "Share a business idea that went nowhere.",
    "What exam or test crushed your confidence?",
    "Tell us about a relationship that taught you the wrong lesson.",
    "What financial decision haunts you?",
    "Share the moment you realized it wasn't going to work out.",
    "What's your 'almost made it' story?",
    "Tell us about a time you were publicly wrong.",
    "What opportunity did you miss that still stings?",
  ],
  es: [
    "Contanos de un proyecto que fracasó espectacularmente.",
    "¿Qué movimiento de carrera es el que más lamentás?",
    "Compartí una idea de negocio que no fue a ningún lado.",
    "¿Qué examen destruyó tu confianza?",
    "Contanos de una relación que te enseñó la lección equivocada.",
    "¿Qué decisión financiera te persigue?",
    "Compartí el momento en que te diste cuenta de que no iba a funcionar.",
    "¿Cuál es tu historia de 'casi lo logro'?",
    "Contanos de una vez que estuviste públicamente equivocado.",
    "¿Qué oportunidad dejaste pasar y todavía duele?",
  ],
  de: [
    "Erzähle uns von einem Projekt, das spektakulär gescheitert ist.",
    "Welche Karriereentscheidung bereust du am meisten?",
    "Teile eine Geschäftsidee, die nirgendwohin führte.",
    "Welche Prüfung hat dein Selbstvertrauen zerstört?",
    "Erzähle von einer Beziehung, die dir die falsche Lektion beigebracht hat.",
    "Welche finanzielle Entscheidung verfolgt dich?",
    "Teile den Moment, als du wusstest, dass es nicht klappen würde.",
    "Was ist deine 'Fast geschafft'-Geschichte?",
    "Erzähle von einem Mal, als du öffentlich falsch lagst.",
    "Welche verpasste Chance schmerzt noch immer?",
  ],
  fr: [
    "Racontez-nous un projet qui a échoué spectaculairement.",
    "Quel choix de carrière regrettez-vous le plus ?",
    "Partagez une idée d'entreprise qui n'a mené nulle part.",
    "Quel examen a brisé votre confiance ?",
    "Parlez d'une relation qui vous a enseigné la mauvaise leçon.",
    "Quelle décision financière vous hante ?",
    "Partagez le moment où vous avez réalisé que ça n'allait pas marcher.",
    "Quelle est votre histoire de 'j'y étais presque' ?",
    "Racontez une fois où vous aviez publiquement tort.",
    "Quelle opportunité manquée vous fait encore mal ?",
  ],
  pt: [
    "Conte-nos sobre um projeto que fracassou espetacularmente.",
    "Qual decisão de carreira você mais se arrepende?",
    "Compartilhe uma ideia de negócio que não deu em nada.",
    "Qual prova destruiu sua confiança?",
    "Conte sobre um relacionamento que ensinou a lição errada.",
    "Qual decisão financeira te assombra?",
    "Compartilhe o momento em que percebeu que não ia funcionar.",
    "Qual é sua história de 'quase consegui'?",
    "Conte sobre uma vez que estava publicamente errado.",
    "Qual oportunidade perdida ainda dói?",
  ],
};

export function getWeeklyPrompt(locale: string): string {
  const prompts = PROMPTS[locale] || PROMPTS['en'];
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return prompts[weekNumber % prompts.length];
}
