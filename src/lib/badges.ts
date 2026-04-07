export interface Badge {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  icon: string;
}

export const BADGES: Badge[] = [
  {
    id: 'first_post',
    name: { en: 'First Post', es: 'Primer post', de: 'Erster Beitrag', fr: 'Premier post', pt: 'Primeiro post' },
    description: { en: 'Shared your first story', es: 'Compartiste tu primera historia', de: 'Deine erste Geschichte geteilt', fr: 'Partagé votre première histoire', pt: 'Compartilhou sua primeira história' },
    icon: '✍️',
  },
  {
    id: 'five_posts',
    name: { en: '5 Stories', es: '5 Historias', de: '5 Geschichten', fr: '5 Histoires', pt: '5 Histórias' },
    description: { en: 'Shared 5 stories', es: 'Compartiste 5 historias', de: '5 Geschichten geteilt', fr: 'Partagé 5 histoires', pt: 'Compartilhou 5 histórias' },
    icon: '📝',
  },
  {
    id: 'ten_posts',
    name: { en: '10 Stories', es: '10 Historias', de: '10 Geschichten', fr: '10 Histoires', pt: '10 Histórias' },
    description: { en: 'Shared 10 stories', es: 'Compartiste 10 historias', de: '10 Geschichten geteilt', fr: 'Partagé 10 histoires', pt: 'Compartilhou 10 histórias' },
    icon: '🏆',
  },
  {
    id: 'ten_reactions',
    name: { en: 'Appreciated', es: 'Apreciado', de: 'Geschätzt', fr: 'Apprécié', pt: 'Apreciado' },
    description: { en: 'Received 10 reactions', es: 'Recibiste 10 reacciones', de: '10 Reaktionen erhalten', fr: 'Reçu 10 réactions', pt: 'Recebeu 10 reações' },
    icon: '❤️',
  },
  {
    id: 'commenter',
    name: { en: 'Commenter', es: 'Comentarista', de: 'Kommentator', fr: 'Commentateur', pt: 'Comentarista' },
    description: { en: 'Left 5 comments', es: 'Dejaste 5 comentarios', de: '5 Kommentare hinterlassen', fr: 'Laissé 5 commentaires', pt: 'Deixou 5 comentários' },
    icon: '💬',
  },
];

export interface UserBadgeData {
  postCount: number;
  totalReactionsReceived: number;
  commentCount: number;
}

export function computeBadges(data: UserBadgeData): string[] {
  const earned: string[] = [];
  if (data.postCount >= 1) earned.push('first_post');
  if (data.postCount >= 5) earned.push('five_posts');
  if (data.postCount >= 10) earned.push('ten_posts');
  if (data.totalReactionsReceived >= 10) earned.push('ten_reactions');
  if (data.commentCount >= 5) earned.push('commenter');
  return earned;
}
