export type MockMessage = {
  id: string;
  author: "me" | "them";
  body: string;
  time: string;
};

export type MockConversation = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
};

export const mockMessages: MockMessage[] = [
  { id: "m1", author: "them", body: "Bonjour, je voulais confirmer la livraison pour demain.", time: "09:12" },
  { id: "m2", author: "me", body: "Bonjour ! Oui bien sûr, on est sur 14h.", time: "09:14" },
  { id: "m3", author: "them", body: "Parfait, merci beaucoup.", time: "09:15" },
  { id: "m4", author: "me", body: "Je vous envoie le bon de livraison.", time: "09:16" }
];

export const mockConversations: MockConversation[] = [
  { id: "c1", name: "Aïda Diop", avatar: "AD", lastMessage: "Parfait, merci beaucoup.", time: "09:15", unread: 0 },
  { id: "c2", name: "Moussa Fall", avatar: "MF", lastMessage: "OK, je vous rappelle.", time: "hier", unread: 2 },
  { id: "c3", name: "Fatou Ndiaye", avatar: "FN", lastMessage: "La commande est prête.", time: "hier", unread: 0 },
  { id: "c4", name: "Cheikh Gueye", avatar: "CG", lastMessage: "Vous faites livraison ?", time: "lun", unread: 1 },
  { id: "c5", name: "Mariama Ba", avatar: "MB", lastMessage: "Merci beaucoup !", time: "lun", unread: 0 },
  { id: "c6", name: "Ibrahima Sow", avatar: "IS", lastMessage: "À demain, sans faute.", time: "dim", unread: 0 }
];
