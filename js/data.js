export const db = {
  fields: [
    {
      id: 'ia',
      name: 'Intelligence Artificielle',
      icon: 'fa-brain',
      description: 'Techniques d’IA, Big Data, machine learning, data science.'  // adjust desc as you like
    },
    {
      id: 'casi',
      name: 'Cybersécurité et audit des systèmes d’information',
      icon: 'fa-shield-alt',
      description: 'Sécurité des réseaux, cryptographie, audit SI et protection des données.'
    },
    {
      id: 'insem',
      name: 'Industrie Navale : Systèmes Électriques et Maintenance',
      icon: 'fa-ship',
      description: 'Électricité navale, maintenance, propulsion, instrumentation marine.'
    },
    {
      id: 'idd',
      name: 'Informatique & Développement Digital',
      icon: 'fa-laptop-code',
      description: 'Dév. web, Big Data, cloud, digitalisation, IA et numérique.'
    }
  ],

  semesters: ['S1', 'S2', 'S3', 'S4'],

  modules: {
    // Intelligence Artificielle
    'ia-S1': [
      { id: 'ia_m1', name: 'Architecture des ordinateurs & Systèmes d’exploitation' },
      { id: 'ia_m2', name: 'Algorithmes & Programmation Python' },
      { id: 'ia_m3', name: 'Mathématiques pour l’apprentissage automatique' },
      { id: 'ia_m4', name: 'Réseaux & Sécurité Informatique' },
      { id: 'ia_m5', name: 'Probabilités & Statistiques pour Data Science' },
      { id: 'ia_m6', name: 'Langues étrangères 1' },
      { id: 'ia_m7', name: 'Méthodologie de travail universitaire' }
    ],
    'ia-S2': [
      { id: 'ia_m8', name: 'Introduction à l’Intelligence Artificielle' },
      { id: 'ia_m9', name: 'Algorithmes & Structures de Données' },
      { id: 'ia_m10', name: 'Bases de Données & Systèmes d’Information' },
      { id: 'ia_m11', name: 'Mathématiques Appliquées à l’IA 2' },
      { id: 'ia_m12', name: 'Introduction à DevOps' },
      { id: 'ia_m13', name: 'Langues étrangères 2' },
      { id: 'ia_m14', name: 'Culture Digitale' }
    ],
    'ia-S3': [
      { id: 'ia_m15', name: 'Techniques Web & Architectures Distribuées' },
      { id: 'ia_m16', name: 'Big Data & NoSQL' },
      { id: 'ia_m17', name: 'Science des Données' },
      { id: 'ia_m18', name: 'Apprentissage Automatique (Machine Learning)' },
      { id: 'ia_m19', name: 'MLOps: CI/CD pour IA' },
      { id: 'ia_m20', name: 'Langues étrangères 3' },
      { id: 'ia_m21', name: 'Culture & Arts' }
    ],
    'ia-S4': [
      { id: 'ia_m22', name: 'Apprentissage Profond (Deep Learning)' },
      { id: 'ia_m23', name: 'Vision par Ordinateur' },
      { id: 'ia_m24', name: 'Cloud Computing & Informatique en Nuage' },
      { id: 'ia_m25', name: 'Langues étrangères 4' },
      { id: 'ia_m26', name: 'Développement Personnel' },
      { id: 'ia_m27', name: 'Projet de Fin d’Études (PFE)' }
    ],

    // Cybersécurité (CASI)
    'casi-S1': [
      { id: 'casi_m1', name: 'Mathématiques pour la Cybersécurité' },
      { id: 'casi_m2', name: 'Algorithmes & Programmation Python' },
      { id: 'casi_m3', name: 'Réseaux & Protocoles Sécurisés' },
      { id: 'casi_m4', name: 'SGBD / Bases de Données' },
      { id: 'casi_m5', name: 'Architecture des Ordinateurs & OS' },
      { id: 'casi_m6', name: 'Langues & Techniques de Communication 1' },
      { id: 'casi_m7', name: 'Méthodologie de Travail Universitaire' }
    ],
    'casi-S2': [
      { id: 'casi_m8', name: 'Programmation C' },
      { id: 'casi_m9', name: 'Cryptographie appliquée' },
      { id: 'casi_m10', name: 'Administration Windows Server' },
      { id: 'casi_m11', name: 'Programmation Python Orientée Objet' },
      { id: 'casi_m12', name: 'Sécurité des Réseaux' },
      { id: 'casi_m13', name: 'Langues & Communication 2' },
      { id: 'casi_m14', name: 'Culture Digitale / Power Skills' }
    ],
    'casi-S3': [
      { id: 'casi_m15', name: 'Tests d’intrusion (Pen-testing)' },
      { id: 'casi_m16', name: 'Analyse de Logs' },
      { id: 'casi_m17', name: 'Sécurité des Applications Web' },
      { id: 'casi_m18', name: 'SOC & Supervision de Sécurité' },
      { id: 'casi_m19', name: 'Audit des SI – Méthodologies & Outils' },
      { id: 'casi_m20', name: 'Introduction à la Gestion d’Entreprise' },
      { id: 'casi_m21', name: 'Culture & Art Skills' }
    ],
    'casi-S4': [
      { id: 'casi_m22', name: 'Veille Technologique & Innovation Numérique' },
      { id: 'casi_m23', name: 'Cloud Sécurisé & Sauvegardes' },
      { id: 'casi_m24', name: 'Introduction à l’IA' },
      { id: 'casi_m25', name: 'Développement Personnel' },
      { id: 'casi_m26', name: 'Projet de Fin d’Études (PFE)' }
    ],

    // Industrie Navale (INSEM)
    'insem-S1': [
      { id: 'insem_m1', name: 'Mathématiques I' },
      { id: 'insem_m2', name: 'Bases de l’électricité' },
      { id: 'insem_m3', name: 'Physique I' },
      { id: 'insem_m4', name: 'Physique II' },
      { id: 'insem_m5', name: 'Environnement maritime & Architecture navale' },
      { id: 'insem_m6', name: 'Langues étrangères 1' },
      { id: 'insem_m7', name: 'Méthodologie de Travail Universitaire' }
    ],
    'insem-S2': [
      { id: 'insem_m8', name: 'Électrotechnique' },
      { id: 'insem_m9', name: 'Hydraulique & Pneumatique' },
      { id: 'insem_m10', name: 'Mathématiques II' },
      { id: 'insem_m11', name: 'Électronique' },
      { id: 'insem_m12', name: 'Conception Assistée par Ordinateur (CAO)' },
      { id: 'insem_m13', name: 'Algorithmique & Programmation' },
      { id: 'insem_m14', name: 'Langues étrangères 2' }
    ],
    'insem-S3': [
      { id: 'insem_m15', name: 'Informatique Industrielle & Automatisme' },
      { id: 'insem_m16', name: 'Électronique de Puissance & Automatique' },
      { id: 'insem_m17', name: 'Systèmes de Propulsion' },
      { id: 'insem_m18', name: 'Électricité à Bord' },
      { id: 'insem_m19', name: 'Maintenance des Systèmes Électriques' },
      { id: 'insem_m20', name: 'Compétences Culturelles & Artistiques' },
      { id: 'insem_m21', name: 'Langues étrangères 3' }
    ],
    'insem-S4': [
      { id: 'insem_m22', name: 'Gestion de la Maintenance & GMAO' },
      { id: 'insem_m23', name: 'Réseau Électrique Naval & Sécurité' },
      { id: 'insem_m24', name: 'Sécurité Maritime & Normes' },
      { id: 'insem_m25', name: 'Compétences Professionnelles' },
      { id: 'insem_m26', name: 'Langues étrangères 4' }
    ],

    // Informatique & Dév Digital (IDD)
    'idd-S1': [
      { id: 'idd_m1', name: 'Langues & Techniques de Communication 1' },
      { id: 'idd_m2', name: 'Python 1: Algorithmes & Programmation' },
      { id: 'idd_m3', name: 'Architecture des ordinateurs & Systèmes d’exploitation' },
      { id: 'idd_m4', name: 'Réseaux & Sécurité Informatique' },
      { id: 'idd_m5', name: 'Intro aux Statistiques & Probabilités' },
      { id: 'idd_m6', name: 'Mathématiques pour ML' },
      { id: 'idd_m7', name: 'Culture Digitale' }
    ],
    'idd-S2': [
      { id: 'idd_m8', name: 'Python 2: Structures de données & Algorithmes' },
      { id: 'idd_m9', name: 'Bases de Données & SGBD Relationnel' },
      { id: 'idd_m10', name: 'Visualisation de Données' },
      { id: 'idd_m11', name: 'Introduction à l’IA' },
      { id: 'idd_m12', name: 'Introduction à DevOps' },
      { id: 'idd_m13', name: 'Langues & Techniques de Communication 2' },
      { id: 'idd_m14', name: 'Programmation C/C++' }
    ],
    'idd-S3': [
      { id: 'idd_m15', name: 'Gestion de Projets Data & UML' },
      { id: 'idd_m16', name: 'Fondamentaux Big Data' },
      { id: 'idd_m17', name: 'Introduction à la Réalité Virtuelle / Augmentée' },
      { id: 'idd_m18', name: 'Techniques Web & Architectures Distribuées' },
      { id: 'idd_m19', name: 'IA Avancée' },
      { id: 'idd_m20', name: 'Bases de Données Avancées' },
      { id: 'idd_m21', name: 'Entrepreneuriat & Digitalisation' }
    ],
    'idd-S4': [
      { id: 'idd_m22', name: 'Informatique Décisionnelle' },
      { id: 'idd_m23', name: 'Fondamentaux Cloud Computing' },
      { id: 'idd_m24', name: 'Applications de l’IA' },
      { id: 'idd_m25', name: 'Analyse Web' },
      { id: 'idd_m26', name: 'Projet de Fin d’Études (PFE)' },
      { id: 'idd_m27', name: 'Stage Technique' }
    ]
  },

  // (You can add resources section later if you have links to courses, TDs, exams, etc.)
  resources: {
    // e.g. 'ia_m1': [ ... ], 'casi_m1': [ ... ], etc.
  }
};
