// the user fields the frontend is allowed to see
export default function publicUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    isGuest: u.isGuest,
    isPro: u.isPro(),
    proUntil: u.proUntil,
  };
}