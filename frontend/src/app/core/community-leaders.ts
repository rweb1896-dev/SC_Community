export type LeaderEra = 'CURRENT' | 'LEGACY';

export interface CommunityLeader {
  id: string;
  name: string;
  era: LeaderEra;
  role: string;
  department: string;
  message: string;
  imageUrl: string;
  imagePosition: string;
  photoSourceLabel: string;
  photoSourceUrl: string;
  contribution: string;
  overview: string;
  highlights: readonly { label: string; text: string }[];
  articles: readonly { title: string; summary: string; body: readonly string[] }[];
}

export const COMMUNITY_LEADERS: readonly CommunityLeader[] = [
  {
    id: 'br-ambedkar',
    name: 'Dr. B. R. Ambedkar',
    era: 'LEGACY',
    role: 'First Law Minister of India',
    department: 'Constitution, law and social justice',
    message: 'Cultivation of mind should be the ultimate aim of human existence.',
    imageUrl: '/assets/leaders/br-ambedkar.jpg',
    imagePosition: '50% 20%',
    photoSourceLabel: 'Wikimedia Commons',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Dr_Ambedkar.jpg',
    contribution: 'Architect of constitutional safeguards and one of India\'s most influential thinkers on equality, education and democratic citizenship.',
    overview: 'Ambedkar combined scholarship, legal practice, institution building and public leadership. His work placed liberty, equality and fraternity at the centre of India\'s constitutional democracy and challenged caste exclusion in public life.',
    highlights: [
      { label: 'Constitution', text: 'Chaired the Drafting Committee of the Constituent Assembly.' },
      { label: 'Public policy', text: 'Advanced labour protections, representation and social safeguards.' },
      { label: 'Education', text: 'Built organisations and journals that made knowledge a tool of emancipation.' }
    ],
    articles: [
      { title: 'Why constitutional morality still matters', summary: 'A reading guide to Ambedkar\'s idea of democracy as a social practice.', body: ['For Ambedkar, democratic institutions could not survive on elections alone. Public life also needed habits of equality, reasoned disagreement and respect for constitutional methods.', 'That makes constitutional morality an everyday responsibility. It asks citizens and institutions to protect equal dignity even when prejudice or majoritarian pressure makes that difficult.'] },
      { title: 'Education as public power', summary: 'How study, organisation and representation reinforce one another.', body: ['Education in Ambedkar\'s public work was more than individual advancement. It created the confidence and capacity required to participate in institutions.', 'The lesson for community networks is practical: learning opportunities should connect to mentorship, civic participation and durable collective support.'] }
    ]
  },
  {
    id: 'jagjivan-ram',
    name: 'Babu Jagjivan Ram',
    era: 'LEGACY',
    role: 'Former Deputy Prime Minister of India',
    department: 'Parliament, labour, agriculture and defence',
    message: 'Public service becomes meaningful when equality reaches everyday life.',
    imageUrl: '/assets/leaders/jagjivan-ram.jpg',
    imagePosition: '50% 24%',
    photoSourceLabel: 'Babu Jagjivan Ram Foundation',
    photoSourceUrl: 'https://jagjivanramfoundation.nic.in/bio-1.htm',
    contribution: 'A long-serving parliamentarian whose national work crossed labour, communications, food and agriculture, defence and social equality.',
    overview: 'Jagjivan Ram brought administrative experience and a sustained commitment to social equality into national public life. His career demonstrates how representation can be paired with institution-level responsibility across many departments.',
    highlights: [
      { label: 'Labour', text: 'Worked on labour welfare and fairer conditions for workers.' },
      { label: 'Agriculture', text: 'Held responsibility for food and agriculture during major national challenges.' },
      { label: 'Parliament', text: 'Sustained a public career spanning several decades and portfolios.' }
    ],
    articles: [
      { title: 'Representation inside institutions', summary: 'What a long administrative career teaches about durable change.', body: ['Political representation becomes durable when it also develops administrative competence. Jagjivan Ram\'s career connected social equality with the detailed work of government.', 'His example invites a useful question for present-day leadership: how can public institutions be made more responsive while continuing to deliver at national scale?'] },
      { title: 'Public service across portfolios', summary: 'A concise look at leadership that moved between labour, food and defence.', body: ['Different ministries demand different expertise, yet each affects dignity and opportunity. Work, food security and national service are connected through the lives of ordinary citizens.', 'A broad public career can therefore be read as one continuous task: making state capacity answerable to people.'] }
    ]
  },
  {
    id: 'kanshi-ram',
    name: 'Manyavar Kanshi Ram',
    era: 'LEGACY',
    role: 'Founder, Bahujan Samaj Party',
    department: 'Bahujan organisation and political representation',
    message: 'Organised participation can turn social awareness into lasting public power.',
    imageUrl: '/assets/leaders/kanshi-ram.jpg',
    imagePosition: '72% 50%',
    photoSourceLabel: 'Wikimedia Commons',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Kanshiram.jpg',
    contribution: 'Built organisations that expanded Bahujan political consciousness, cadre development and independent electoral representation.',
    overview: 'Kanshi Ram focused on organisation: identifying shared interests, training workers and translating social awareness into a durable political presence. His methods changed the language and structure of Bahujan participation in North Indian politics.',
    highlights: [
      { label: 'Organisation', text: 'Developed networks for employees, activists and political workers.' },
      { label: 'Representation', text: 'Made independent Bahujan political power a national conversation.' },
      { label: 'Cadre', text: 'Emphasised disciplined, long-term community organisation.' }
    ],
    articles: [
      { title: 'The patient work of organisation', summary: 'Why durable movements are built through people, training and local networks.', body: ['Kanshi Ram treated organisation as infrastructure. Meetings, travel, political education and local responsibility were not supporting activities; they were the movement itself.', 'Digital communities can learn from that discipline by turning visibility into local relationships, documented knowledge and accountable follow-through.'] },
      { title: 'From awareness to representation', summary: 'Understanding the institutional direction of Bahujan politics.', body: ['Social awareness can identify injustice, but representation determines who shapes policy and public priorities. Kanshi Ram concentrated on connecting these two stages.', 'The result was a model in which community confidence, political education and electoral strategy strengthened one another.'] }
    ]
  },
  {
    id: 'mayawati',
    name: 'Mayawati',
    era: 'CURRENT',
    role: 'Former Chief Minister of Uttar Pradesh',
    department: 'Bahujan leadership and public administration',
    message: 'Representation must create dignity, security and opportunity for every family.',
    imageUrl: '/assets/leaders/mayawati.jpg',
    imagePosition: '50% 32%',
    photoSourceLabel: 'Wikimedia Commons',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Mayawati_in_2016.jpg',
    contribution: 'Expanded Dalit and Bahujan representation in executive government and became the first Scheduled Caste woman to serve as a state chief minister in India.',
    overview: 'Mayawati\'s career represents a major shift from movement politics to executive authority. Her leadership placed questions of representation, public administration, law and order, and symbolic recognition into the centre of state politics.',
    highlights: [
      { label: 'Executive office', text: 'Served multiple terms as Chief Minister of Uttar Pradesh.' },
      { label: 'Representation', text: 'Became a nationally recognised Dalit woman political leader.' },
      { label: 'Administration', text: 'Connected Bahujan politics with the responsibilities of state government.' }
    ],
    articles: [
      { title: 'When representation reaches executive office', summary: 'Why holding office changes the possibilities and pressures of social movements.', body: ['Executive power brings visibility and the ability to direct administration, but it also creates sharper tests of delivery, coalition and public accountability.', 'Mayawati\'s career is therefore important not only as a political milestone, but as a case study in how movement-based representation operates within government.'] },
      { title: 'Symbols, institutions and public memory', summary: 'How public space participates in struggles over recognition.', body: ['Public monuments and memorials are debates about who belongs in shared history. For communities excluded from conventional public memory, visibility can carry unusual political weight.', 'The strongest reading considers both dimensions together: symbolic recognition and material public administration.'] }
    ]
  },
  {
    id: 'chandrashekhar-azad',
    name: 'Chandrashekhar Azad',
    era: 'CURRENT',
    role: 'Member of Parliament, Nagina',
    department: '18th Lok Sabha and social justice advocacy',
    message: 'Education, constitutional rights and fearless representation move society forward.',
    imageUrl: '/assets/leaders/chandrashekhar-azad.jpg',
    imagePosition: '50% 20%',
    photoSourceLabel: 'Wikimedia Commons',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Chandrashekhar_Azad_Ravan_(cropped).jpg',
    contribution: 'Connects grassroots rights advocacy, educational mobilisation and parliamentary representation for the Nagina constituency.',
    overview: 'Chandrashekhar Azad emerged through grassroots mobilisation around caste violence, education and constitutional rights. His move into Parliament brings activist methods into a formal national institution.',
    highlights: [
      { label: 'Grassroots', text: 'Built public visibility through rights advocacy and local mobilisation.' },
      { label: 'Education', text: 'Promoted community learning and constitutional awareness.' },
      { label: 'Parliament', text: 'Represents Nagina in the Lok Sabha.' }
    ],
    articles: [
      { title: 'From street advocacy to Parliament', summary: 'The opportunities and obligations created by institutional entry.', body: ['Grassroots mobilisation can move quickly around urgent injustice, while parliamentary work requires negotiation, procedure and sustained policy attention.', 'The transition is significant because it tests whether movement energy can remain accountable to local communities while operating inside national institutions.'] },
      { title: 'Constitutional language in youth politics', summary: 'Why rights education has become central to a new generation of organising.', body: ['Constitutional vocabulary gives local experiences of discrimination a shared public framework. It helps people connect personal harm with enforceable rights and institutional duties.', 'For young organisers, that language can make public action both more confident and more precise.'] }
    ]
  },
  {
    id: 'tika-ram-jully',
    name: 'Tika Ram Jully',
    era: 'CURRENT',
    role: 'Leader of Opposition, Rajasthan Assembly',
    department: 'MLA, Alwar Rural (SC) and legislative affairs',
    message: 'Democracy grows stronger when vulnerable voices are heard at the centre of power.',
    imageUrl: '/assets/leaders/tika-ram-jully.jpg',
    imagePosition: '50% 28%',
    photoSourceLabel: 'Wikimedia Commons',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Tika_Ram_Jully.jpg',
    contribution: 'Brings Scheduled Caste representation into Rajasthan\'s legislative leadership, with experience in social justice administration and constituency work.',
    overview: 'Tika Ram Jully\'s public career connects constituency representation, ministerial responsibility and opposition leadership. His work offers a contemporary view of how social justice priorities are argued through state institutions.',
    highlights: [
      { label: 'Legislature', text: 'Represents Alwar Rural in the Rajasthan Legislative Assembly.' },
      { label: 'Leadership', text: 'Serves in the Assembly\'s opposition leadership.' },
      { label: 'Social justice', text: 'Has held state responsibility connected to social justice and empowerment.' }
    ],
    articles: [
      { title: 'Why strong opposition matters', summary: 'Accountability, scrutiny and representation inside a state legislature.', body: ['An opposition does more than disagree with government. It examines policy, raises constituency concerns and keeps alternative priorities visible in public debate.', 'For underrepresented communities, that scrutiny is particularly important because administrative averages can hide unequal outcomes.'] },
      { title: 'Local constituencies, statewide questions', summary: 'How local representation can reveal wider policy needs.', body: ['Constituency work begins with specific roads, schools, services and grievances. Patterns across those cases can expose statewide questions of access and implementation.', 'Effective legislative leadership carries evidence from local experience into broader oversight and policy debate.'] }
    ]
  }
];
