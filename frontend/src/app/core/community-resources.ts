export interface CommunityBook {
  id: string;
  title: string;
  author: string;
  summary: string;
  language: string;
  source: string;
  pdfUrl: string;
  coverTone: 'BLUE' | 'TEAL' | 'GOLD' | 'CORAL' | 'INK' | 'GREEN';
}

export interface PaidCommunityBook {
  title: string;
  author: string;
  summary: string;
  format: string;
  price: string;
  source: string;
  storeUrl: string;
  coverImageUrl: string;
}

export interface SocialWorker {
  name: string;
  role: string;
  focus: string;
  profileUrl: string;
}

export interface CommunityOrganisation {
  name: string;
  type: string;
  focus: string;
  websiteUrl: string;
}

export interface CommunityNotice {
  label: string;
  title: string;
  summary: string;
  tone: 'BLUE' | 'GREEN' | 'AMBER';
}

export const COMMUNITY_BOOKS: readonly CommunityBook[] = [
  {
    id: 'ambedkar-volume-01',
    title: 'Annihilation of Caste and Other Writings',
    author: 'Dr. B. R. Ambedkar',
    summary: 'Volume 1 of the official collected writings, including Castes in India and Annihilation of Caste.',
    language: 'English',
    source: 'Ministry of External Affairs',
    pdfUrl: 'https://www.mea.gov.in/images/CPV/Volume1.pdf',
    coverTone: 'BLUE'
  },
  {
    id: 'ambedkar-volume-03',
    title: 'Dr. Babasaheb Ambedkar: Writings and Speeches, Vol. 3',
    author: 'Dr. B. R. Ambedkar',
    summary: 'An official volume from the Government of India digital collection of Ambedkar writings and speeches.',
    language: 'English',
    source: 'Ministry of External Affairs',
    pdfUrl: 'https://www.mea.gov.in/images/CPV/Volume3.pdf',
    coverTone: 'TEAL'
  },
  {
    id: 'ambedkar-volume-07',
    title: 'Who Were the Shudras? / The Untouchables',
    author: 'Dr. B. R. Ambedkar',
    summary: 'Volume 7 brings together two major historical studies of caste and untouchability.',
    language: 'English',
    source: 'Ministry of External Affairs',
    pdfUrl: 'https://www.mea.gov.in/images/CPV/Volume7.pdf',
    coverTone: 'GOLD'
  },
  {
    id: 'ambedkar-volume-17-01',
    title: 'Dr. B. R. Ambedkar and His Egalitarian Revolution',
    author: 'Government of Maharashtra',
    summary: 'Speeches, correspondence and source material documenting Ambedkar\'s work for an equal society.',
    language: 'English',
    source: 'Ministry of External Affairs',
    pdfUrl: 'https://www.mea.gov.in/images/CPV/Volume17_Part_I.pdf',
    coverTone: 'CORAL'
  },
  {
    id: 'constitution-2024',
    title: 'The Constitution of India, 2024 Edition',
    author: 'Legislative Department, Government of India',
    summary: 'The official constitutional text for reading fundamental rights, duties and democratic safeguards.',
    language: 'English',
    source: 'Legislative Department',
    pdfUrl: 'https://lddashboard.legislative.gov.in/sites/default/files/coi/COI_2024.pdf',
    coverTone: 'INK'
  },
  {
    id: 'jagjivan-ram-profile',
    title: 'Selected Speeches of Babu Jagjivan Ram, Vol. 7',
    author: 'Babu Jagjivan Ram',
    summary: 'A verified public PDF volume of speeches and parliamentary perspectives from Jagjivan Ram\'s public life.',
    language: 'English',
    source: 'Ministry of External Affairs',
    pdfUrl: 'https://www.mea.gov.in/images/CPV/VolumeH7.pdf',
    coverTone: 'GREEN'
  }
];

export const PAID_COMMUNITY_BOOKS: readonly PaidCommunityBook[] = [
  {
    title: 'Caste Matters',
    author: 'Suraj Yengde',
    summary: 'A personal and analytical account of caste, power, resilience and modern Dalit life.',
    format: 'Hardback · 304 pages',
    price: '₹599',
    source: 'Penguin Random House India',
    storeUrl: 'https://www.penguin.co.in/book/caste-matters/',
    coverImageUrl: '/assets/books/caste-matters.jpg'
  },
  {
    title: 'Annihilation of Caste: The Annotated Critical Edition',
    author: 'B. R. Ambedkar',
    summary: 'Ambedkar\'s foundational text with annotations and an introduction by Arundhati Roy.',
    format: 'Paperback · 415 pages',
    price: '₹450',
    source: 'Navayana Publishing',
    storeUrl: 'https://navayana.org/products/annihilation-of-caste/?v=14169eaccff3',
    coverImageUrl: '/assets/books/annihilation-critical.jpg'
  },
  {
    title: 'Riddles in Hinduism',
    author: 'B. R. Ambedkar',
    summary: 'An annotated critical selection introduced by Kancha Ilaiah Shepherd.',
    format: 'Paperback',
    price: '₹399',
    source: 'Navayana Publishing',
    storeUrl: 'https://navayana.org/products/riddles-in-hinduism/?v=14169eaccff3',
    coverImageUrl: '/assets/books/riddles-in-hinduism.jpg'
  },
  {
    title: 'Against the Madness of Manu',
    author: 'B. R. Ambedkar · Selected by Sharmila Rege',
    summary: 'Selected writings on Brahmanical patriarchy, gender justice and social equality.',
    format: 'Paperback',
    price: '₹399',
    source: 'Navayana Publishing',
    storeUrl: 'https://navayana.org/products/against-the-madness-of-manu/?v=14169eaccff3',
    coverImageUrl: '/assets/books/against-madness-of-manu.jpg'
  }
];

export const SOCIAL_WORKERS: readonly SocialWorker[] = [
  {
    name: 'Bezwada Wilson',
    role: 'Convenor, Safai Karmachari Andolan',
    focus: 'Ending manual scavenging and securing dignity for sanitation workers.',
    profileUrl: 'https://www.safaikarmachariandolan.org/people'
  },
  {
    name: 'Ruth Manorama',
    role: 'Founder, National Federation of Dalit Women',
    focus: 'Dalit women\'s rights, domestic workers and communities in informal settlements.',
    profileUrl: 'https://en.wikipedia.org/wiki/Ruth_Manorama'
  },
  {
    name: 'Martin Macwan',
    role: 'Founder, Navsarjan Trust',
    focus: 'Human rights education, non-violent action and grassroots leadership.',
    profileUrl: 'https://navsarjantrust.wordpress.com/navsarjans-history/'
  },
  {
    name: 'Manjula Pradeep',
    role: 'Founder and Chairperson, WAYVE Foundation',
    focus: 'Caste and gender justice, legal empowerment, women and youth leadership.',
    profileUrl: 'https://www.wayve.net.in/'
  }
];

export const COMMUNITY_ORGANISATIONS: readonly CommunityOrganisation[] = [
  {
    name: 'National Campaign on Dalit Human Rights',
    type: 'Rights network',
    focus: 'Justice, accountability and protection of Dalit human rights.',
    websiteUrl: 'https://www.ncdhr.org.in/'
  },
  {
    name: 'Safai Karmachari Andolan',
    type: 'People\'s movement',
    focus: 'Eradication of manual scavenging and rehabilitation with dignity.',
    websiteUrl: 'https://www.safaikarmachariandolan.org/movement'
  },
  {
    name: 'Navsarjan Trust',
    type: 'Social action organisation',
    focus: 'Human rights, education and community-led action against discrimination.',
    websiteUrl: 'https://navsarjantrust.wordpress.com/navsarjans-history/'
  },
  {
    name: 'Dalit Foundation',
    type: 'Grant-making NGO',
    focus: 'Grassroots organisations, fellowships and future community leadership.',
    websiteUrl: 'https://www.dalitfoundation.org/about-us/'
  },
  {
    name: 'National Confederation of Dalit Organisations',
    type: 'Civil society network',
    focus: 'Policy participation, equal access to services and movement capacity.',
    websiteUrl: 'https://nacdor.org/site/about-us.html'
  }
];

export const COMMUNITY_NOTICES: readonly CommunityNotice[] = [
  {
    label: 'New resource',
    title: 'Digital reading library is now available',
    summary: 'Open the Books tab to read selected public PDFs from government and institutional sources.',
    tone: 'BLUE'
  },
  {
    label: 'Membership',
    title: 'New accounts require verification',
    summary: 'Keep your invite code and a shareable government ID proof link ready before sign-up.',
    tone: 'GREEN'
  },
  {
    label: 'Account safety',
    title: 'Never share passwords or OTPs',
    summary: 'Community administrators will not ask for your password or verification code.',
    tone: 'AMBER'
  },
  {
    label: 'Community standard',
    title: 'Share respectful and verified information',
    summary: 'Protect member privacy, cite reliable sources and report harmful or misleading posts.',
    tone: 'BLUE'
  }
];
