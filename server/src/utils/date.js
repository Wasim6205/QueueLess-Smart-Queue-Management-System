/**
 * Returns today's date key in YYYY-MM-DD format using server local time.
 * @param {Date} [d=new Date()]
 * @returns {string}
 */
function todayKey(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = {
  todayKey,
};

