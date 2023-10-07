const modes = [
  "discordOnly",
  "notionOnly",
  "fetchOnly",
  "addSkip",
  "updateSkip",
];

export const getModes = function () {
  return modes;
};
export const setOptions = function (options) {
  let result = true;

  if (options.mode != "default" && modes.indexOf(options.mode) === -1) {
    console.log("invalid mode: " + options.mode);
    result = false;
  }

  if (options.mode != "default") {
    console.log(options.mode + " mode");
  }

  let targetFrom = parseInt(options.from);
  let targetTo = parseInt(options.to);
  let targetLimit = parseInt(options.limit);

  if (targetLimit > 0 && targetTo == 0 && targetFrom == 0) {
    targetFrom = 0;
    targetTo = targetLimit;
  } else if (targetLimit == 0 && targetTo == 0 && targetFrom > 0) {
    targetTo = targetFrom;
  } else if (targetTo == 0 && targetLimit > 0) {
    targetTo = targetFrom + targetLimit - 1;
  } else if (targetTo - targetFrom < 0) {
    targetTo = NaN;
  } else if (targetLimit != 0 && targetTo - targetFrom > targetLimit) {
    targetTo = targetFrom + targetLimit - 1;
  }

  if (targetTo > 0) {
    console.log("from:" + targetFrom + " to:" + targetTo);
  }

  if (isNaN(targetTo)) {
    console.log(
      `oprion error from:${options.from} from:${options.from} limit:${options.limit}`
    );
    result = false;
  }

  return {
    result: result,
    from: targetFrom,
    to: targetTo,
  };
};
