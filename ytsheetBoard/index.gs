const SHEET_IDS_TOP_POS = 4;
const CONFIG_SHEET_NAME = 'config';
const OUTPUT_SHEET_NAME = 'output';
const PLINFO_SHEET_NAME = 'PLinfo';

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

function writeToSheet(characterList, sheetName) {
  if(characterList.length === 0) { return; }
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  const maxRow = sheet.getMaxRows();
  const emptyArray = Array(maxRow);
  emptyArray.fill(Array(characterList[0].length));
  sheet.getRange(2, 1, sheet.getMaxRows(), characterList[0].length).setValues(emptyArray);

  return sheet.getRange(2, 1, characterList.length, characterList[0].length).setValues(characterList);
}

function updateLastUpdate() {
  const count = SpreadsheetApp.getActive().getSheets().length;
  SpreadsheetApp.getActive().getSheets()[count - 1].setName(`最終更新：${(new Date()).toLocaleString('jp-JP', { timeZone: 'JST' })}`);
}

function generatePlReport(list) {
  const resultMap = {};
  const resultSeed = [];
  list.forEach((character)=>{
    if(! resultMap[character[0]]) {
      resultMap[character[0]] = { count:0, sheets:[] };
      resultSeed.push(character[0]);
    }
    resultMap[character[0]].count += Number(character[2]);
    resultMap[character[0]].sheets.push(`${character[1]}\n${character[9]}`);
  });
  let maxColumnCount = 0;
  return resultSeed.map((pl)=>{
    const result = [pl, resultMap[pl].count, resultMap[pl].sheets].flat();
    if(result.length > maxColumnCount) { maxColumnCount = result.length; }
    return result;
  }).map((d)=>{
    if(d.length < maxColumnCount) {
      for(var i = d.length; i < maxColumnCount; i++) {
        d.push('');
      }
    }
    return d;
  }).sort((a, b)=>{ return b[1] - a[1]; });
}

function updateSheet() {
  const ytsheetUrl = getYtsheetUrl();
  const getTargetRowLinks = getSheetRawLinks();
  const rawJsons = getTargetRowLinks.map((rawLink)=>{ return getCharacterSheetJsonWithRawLink(rawLink, ytsheetUrl) });
  const pcReport = rawJsons.map((json)=>{
    return [
      json.playerName,
      json.characterName,
      io.github.shunshun94.trpg.sw2.ytsheet.countSession.countSession(json),
      json.level,
      json.historyExpTotal,
      json.historyMoneyTotal,
      json.historyHonorTotal,
      json.sheetDescriptionS,
      json.updateTime,
      json.sheetURL,
      `https://shunshun94.github.io/shared/other/io/github/shunshun94/trpg/sw2/ytsheet/sessionCount/sameSessionCount.html?target=${encodeURIComponent(json.sheetURL)}`,
      `https://shunshun94.github.io/shared/other/io/github/shunshun94/trpg/sw2/ytsheet/validation/index.html?target=${encodeURIComponent(json.sheetURL)}`,
      json.lvSco || 0,
      json.lvSag || 0,
      json.lvRan || 0
    ];
  }).filter((data)=>{ return data[2]; });
  const plReport = generatePlReport(pcReport);
  const pcListRange = writeToSheet(pcReport, OUTPUT_SHEET_NAME);
  const plListRange = writeToSheet(plReport, PLINFO_SHEET_NAME);
  updateLastUpdate();
  return pcListRange.getValues();
}
