"use strict";

module.exports = {
  id: "wiki",
  contentKind: "pages",
  twoStage: true,
  prepare() {},
  build(pipeline) {
    require("../../../events/lib/doc_tree")(pipeline.ctx, pipeline);
  }
};
