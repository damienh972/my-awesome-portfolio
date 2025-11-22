interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Quel est le principal avantage de la blockchain ?",
    options: [
      "Vitesse de transaction maximale",
      "Immuabilité et traçabilité des données",
      "Stockage illimité gratuit",
      "Confidentialité totale des données"
    ],
    correctAnswer: 1
  },
  {
    id: 2,
    question: "Qu'est-ce qu'un hash dans la blockchain ?",
    options: [
      "Un mot de passe crypté",
      "Une empreinte numérique unique d'un bloc",
      "Le nombre de transactions validées",
      "Un token de sécurité"
    ],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "Comment les blocs sont-ils reliés dans une blockchain ?",
    options: [
      "Par ordre alphabétique",
      "Par leur date de création uniquement",
      "Chaque bloc contient le hash du bloc précédent",
      "Par un serveur central"
    ],
    correctAnswer: 2
  }
];