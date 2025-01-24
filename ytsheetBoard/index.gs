const SHEET_IDS_TOP_POS = 4;
const CONFIG_SHEET_NAME = 'config';
const OUTPUT_SHEET_NAME = 'output';

function getUrl(url) {
  Utilities.sleep(3000);
  return UrlFetchApp.fetch(url).getContentText();
}

function getCharacterSheetJson(id, ytsheetUrl = 'https://yutorize.2-d.jp/ytsheet/sw2.5/') {
  return JSON.parse(getUrl(`${ytsheetUrl}?id=${id}&mode=json`));
}

function getCharacterSheetJsonWithRawLink(rawLink, ytsheetUrl = 'https://yutorize.2-d.jp/ytsheet/sw2.5/') {
  return getCharacterSheetJson(rawLink.replace('./?id=', ''), ytsheetUrl);
}

function getYtsheetUrl() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG_SHEET_NAME);
  return sheet.getRange(1, 2).getValue();
}

function getSheetRawLinks() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG_SHEET_NAME);
  const ids = sheet.getSheetValues(SHEET_IDS_TOP_POS, 1, sheet.getMaxRows(), 1).flat().flat().filter((d)=>{return d;});
  return ids;
}

function writeToSheet(array) {
  if(array.length === 0) { return; }
  const sheet = SpreadsheetApp.getActive().getSheetByName(OUTPUT_SHEET_NAME);
  const maxRow = sheet.getMaxRows();
  const emptyArray = Array(maxRow);
  emptyArray.fill(Array(array[0].length));
  sheet.getRange(2, 1, sheet.getMaxRows(), array[0].length).setValues(emptyArray);

  return sheet.getRange(2, 1, array.length, array[0].length).setValues(array);
}

function updateLastUpdate() {
  SpreadsheetApp.getActive().getSheets()[3].setName(`最終更新：${(new Date()).toLocaleString('jp-JP', { timeZone: 'JST' })}`);
}

function updateSheet() {
  const ytsheetUrl = getYtsheetUrl();
  const getTargetRowLinks = getSheetRawLinks();
  const rawJsons = getTargetRowLinks.map((rawLink)=>{ return getCharacterSheetJsonWithRawLink(rawLink, ytsheetUrl) });
  const resultArray = rawJsons.map((json)=>{
    return [
      json.playerName,
      json.characterName,
      io.github.shunshun94.trpg.sw2.ytsheet.countSession.countSession(json),
      json.level,
      json.sheetDescriptionS,
      json.updateTime,
      json.sheetURL,
      `https://shunshun94.github.io/shared/other/io/github/shunshun94/trpg/sw2/ytsheet/sessionCount/sameSessionCount.html?target=${encodeURIComponent(json.sheetURL)}`,
      `https://shunshun94.github.io/shared/other/io/github/shunshun94/trpg/sw2/ytsheet/validation/index.html?target=${encodeURIComponent(json.sheetURL)}`,
      json.lvSco || 0,
      json.lvSag || 0,
      json.lvRan || 0
    ];
  });
  const targetRange = writeToSheet(resultArray);
  updateLastUpdate();
  return targetRange.getValues();
}
