const { XMLParser } = require("fast-xml-parser");
var { v4: uuidv4 } = require("uuid");

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseAttributeValue: false,
  removeNSPrefix: true,
});

/**
 * Extracts the effective time period (low and high) from the given XML data.
 * @param {string} srcData - The XML data as a string.
 * @returns {Object} An object containing the low and high values of the effective time period.
 */
function extractEncounterTimePeriod(srcData) {
  const jsonObj = parser.parse(srcData);
  const effectiveTime = jsonObj.ClinicalDocument?.documentationOf?.serviceEvent?.effectiveTime;
  const low = effectiveTime?.low;
  const high = effectiveTime?.high;
  return { low, high };
}

/**
 * Checks whether the given XML data contains an encompassing encounter, and returns a UUID for it.
 * Otherwise, returns undefined.
 * @param {string} srcData - The XML data as a string.
 * @returns {string} A UUID for the encompassing encounter or undefined.
 */
function getEncompassingEncounterId(srcData) {
  const jsonObj = parser.parse(srcData);
  const encompassingEncounter = jsonObj.ClinicalDocument?.componentOf?.encompassingEncounter;
  if (encompassingEncounter) {
    return uuidv4();
  }
  return undefined;
}

module.exports.extractEncounterTimePeriod = extractEncounterTimePeriod;
module.exports.getEncompassingEncounterId = getEncompassingEncounterId;
