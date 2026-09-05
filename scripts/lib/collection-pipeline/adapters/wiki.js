"use strict";

module.exports = {
  id: "wiki",
  config: Object.freeze({
    collection: Object.freeze({
      hero: true,
      routeStart: false,
      navigationTree: true,
      listing: Object.freeze(["priority", "order"])
    }),
    page: Object.freeze({ listingPriority: false })
  }),
  contentKind: "pages",
  twoStage: true,
  prepare() {},
  build(pipeline) {
    require("../../../events/lib/doc_tree")(pipeline.ctx, pipeline);
  }
};
