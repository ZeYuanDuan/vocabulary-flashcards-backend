const formatResponse = (status, userId, vocStorage, data) => {
  return {
    status,
    userId,
    vocStorage: Number(vocStorage),
    data,
  };
};

module.exports = {
  formatResponse,
};
