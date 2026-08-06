import { COMMUNITY_LEADERS, CommunityLeader } from './community-leaders';
import { COMMUNITY_BOOKS, CommunityBook, PAID_COMMUNITY_BOOKS, PaidCommunityBook } from './community-resources';
import { ManagedContent } from './models';

export function managedLeaders(records: readonly ManagedContent[]): CommunityLeader[] {
  const overrides = new Map(records.filter((item) => item.type === 'LEADER').map((item) => [item.key, item]));
  const defaults = COMMUNITY_LEADERS.flatMap((leader) => {
    const override = overrides.get(leader.id);
    overrides.delete(leader.id);
    if (override && override.status !== 'ACTIVE') return [];
    return [override ? leaderFrom(override, leader) : leader];
  });
  const custom = [...overrides.values()].filter((item) => item.status === 'ACTIVE').map((item) => leaderFrom(item));
  return [...defaults, ...custom];
}

export function managedBooks(records: readonly ManagedContent[]): { books: CommunityBook[]; paidBooks: PaidCommunityBook[] } {
  const overrides = new Map(records.filter((item) => item.type === 'BOOK').map((item) => [item.key, item]));
  const books = COMMUNITY_BOOKS.flatMap((book) => {
    const override = overrides.get(book.id); overrides.delete(book.id);
    if (override && override.status !== 'ACTIVE') return [];
    return [override ? freeBookFrom(override, book) : book];
  });
  const paidBooks = PAID_COMMUNITY_BOOKS.flatMap((book) => {
    const override = overrides.get(book.id); overrides.delete(book.id);
    if (override && override.status !== 'ACTIVE') return [];
    return [override ? paidBookFrom(override, book) : book];
  });
  for (const item of overrides.values()) {
    if (item.status !== 'ACTIVE') continue;
    if (item.category === 'PRINT') paidBooks.push(paidBookFrom(item));
    else books.push(freeBookFrom(item));
  }
  return { books: [...books], paidBooks: [...paidBooks] };
}

function leaderFrom(item: ManagedContent, base?: CommunityLeader): CommunityLeader {
  return {
    id: item.key, name: item.title, era: item.category === 'LEGACY' ? 'LEGACY' : 'CURRENT',
    role: item.byline, department: item.source || 'Community leadership',
    message: base?.message || item.details || item.summary, imageUrl: item.imageUrl,
    imagePosition: base?.imagePosition || '50% 30%', photoSourceLabel: base?.photoSourceLabel || 'Provided by administrator',
    photoSourceUrl: item.url || base?.photoSourceUrl || item.imageUrl, contribution: item.summary,
    overview: item.details || base?.overview || item.summary, highlights: base?.highlights || [], articles: base?.articles || []
  };
}

function freeBookFrom(item: ManagedContent, base?: CommunityBook): CommunityBook {
  return { id: item.key, title: item.title, author: item.byline, summary: item.summary,
    language: item.source || base?.language || 'English', source: item.details || base?.source || 'Community Library',
    pdfUrl: item.url, coverTone: base?.coverTone || 'BLUE' };
}

function paidBookFrom(item: ManagedContent, base?: PaidCommunityBook): PaidCommunityBook {
  return { id: item.key, title: item.title, author: item.byline, summary: item.summary,
    format: item.source || base?.format || 'Print edition', price: item.details || base?.price || 'See store',
    source: base?.source || 'Community Library', storeUrl: item.url, coverImageUrl: item.imageUrl };
}
