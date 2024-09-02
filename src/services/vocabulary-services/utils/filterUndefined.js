// * 過濾掉 undefined 的屬性
const filterUndefined = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

module.exports = {
  filterUndefined,
};
