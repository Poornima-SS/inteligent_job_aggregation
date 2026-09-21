function toPublicUser(user) {
  if (!user) return null;
  const obj = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete obj.passwordHash;
  return obj;
}

module.exports = { toPublicUser };
