// * 進行單字分頁
const calculatePagination = (query, totalRecords) => {
  let start = parseInt(query.start, 10) || 0;
  let end = parseInt(query.end, 10) || -1;

  if (isNaN(start) || start < 0) {
    start = 0;
  }

  if (isNaN(end) || end < 0 || end >= totalRecords) {
    end = totalRecords - 1;
  }

  const limit = end - start + 1;
  return { start, end, limit };
};

module.exports = {
  calculatePagination,
};
