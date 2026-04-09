// utils/matchSkills.js

/**
 * matchSkills
 *
 * Finds users who can participate in a mutual skill exchange with currentUser.
 *
 * A match exists when:
 *   - The other user offers at least one skill the currentUser wants, OR
 *   - The other user wants at least one skill the currentUser offers.
 *
 * Each match entry includes which specific skills caused the match,
 * split into two directions so the UI can display both sides of the exchange.
 *
 * @param {Object} currentUser  - Populated user doc (skillsOffered, skillsWanted as ObjectId arrays or populated docs)
 * @param {Object[]} users      - Array of other populated user docs
 * @returns {{ user: Object, matchedSkills: { theyOffer: string[], theyWant: string[] } }[]}
 */
const matchSkills = (currentUser, users) => {
  const toIdSet = (arr) =>
    new Set(arr.map((s) => (s._id ? s._id.toString() : s.toString())));

  const toNameMap = (arr) =>
    arr.reduce((acc, s) => {
      const id = s._id ? s._id.toString() : s.toString();
      acc[id] = s.name || s.title || id;
      return acc;
    }, {});

  const myWantedIds  = toIdSet(currentUser.skillsWanted  || []);
  const myOfferedIds = toIdSet(currentUser.skillsOffered || []);

  const myWantedNames  = toNameMap(currentUser.skillsWanted  || []);
  const myOfferedNames = toNameMap(currentUser.skillsOffered || []);

  const matches = [];

  for (const user of users) {
    if (user._id.toString() === currentUser._id.toString()) continue;

    const theirOfferedIds = toIdSet(user.skillsOffered || []);
    const theirWantedIds  = toIdSet(user.skillsWanted  || []);

    // Skills they offer that I want
    const theyOffer = [...theirOfferedIds]
      .filter((id) => myWantedIds.has(id))
      .map((id) => myWantedNames[id] || id);

    // Skills they want that I offer
    const theyWant = [...theirWantedIds]
      .filter((id) => myOfferedIds.has(id))
      .map((id) => myOfferedNames[id] || id);

    if (theyOffer.length > 0 || theyWant.length > 0) {
      matches.push({
        user,
        matchedSkills: { theyOffer, theyWant },
      });
    }
  }

  // Rank: most total matching skills first
  matches.sort(
    (a, b) =>
      b.matchedSkills.theyOffer.length + b.matchedSkills.theyWant.length -
      (a.matchedSkills.theyOffer.length + a.matchedSkills.theyWant.length)
  );

  return matches;
};

module.exports = { matchSkills };