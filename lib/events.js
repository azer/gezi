var pubsub = require("pubsub");

module.exports = {
  navigate: pubsub(),
  load: pubsub(),
  showSearch: pubsub(),
  select: pubsub()
};
