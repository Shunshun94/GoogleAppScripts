const convertMarkToNumber = (mark) => {
  const list = [
    ['?', '？'],
    ['✕', '☓', '×', '✗', '✘', 'x', 'X'],
    ['△', '▲'],
    ['◯', '○', '❍'],
    ['◎'],
    ['★','☆']
  ];
  for(var i = 0; i < list.length; i++) {
    if( list[i].includes(mark) ) { return i; }
  }
  return -1;
};

const getName = (sheet) => {
  return sheet.getRange(1, 2).getValue();
};

const getOwnPartnerTable = (rangeValues) => {
  const result = {};
  rangeValues.forEach((row)=>{
    result[row[0]] = {
      own: convertMarkToNumber(row[1]),
      partner: convertMarkToNumber(row[2])
    };
  });
  return result;
};

const getParts = (sheet) => {
  return getOwnPartnerTable(sheet.getRange(13, 3, 23, 3).getValues());
};

const getAct = (sheet) => {
  return getOwnPartnerTable(sheet.getRange(13, 8, 30, 3).getValues());
};

const getNotCategorized = (sheet) => {
  return getOwnPartnerTable(sheet.getRange(13, 26, 24, 3).getValues());
};

const getSituation = (sheet) => {
  return getOwnPartnerTable(sheet.getRange(38, 26, 11, 3).getValues());
};

const getOther = (sheet) => {
  return getOwnPartnerTable(sheet.getRange(50, 26, 3, 3).getValues());
};

const getMachingTable = (rangeValues, isNoteExist) => {
  const result = {};
  const columnList = [];
  rangeValues.slice(1).forEach((row)=>{
    const columnName = row[0].trim();
    result[columnName] = {};
    columnList.push(columnName);
    if(isNoteExist) {
      result[columnName].note = row.at(-1).trim();
    }
  });
  rangeValues.slice(1).forEach((row, rowId)=>{
    const targetList = (isNoteExist) ? row.slice(1, -1) : row.slice(1);
    targetList.forEach((value, columnId)=>{
      result[columnList[rowId]][columnList[columnId]] = convertMarkToNumber(value);
    });
  });
  return result;
};

const getSexRace = (sheet, isNoteExist) => {
  return getMachingTable(sheet.getRange(11, 13, 11, 12).getValues(), isNoteExist);
};

const getAgeVisual = (sheet, isNoteExist) => {
  return getMachingTable(sheet.getRange(25, 13, 11, 12).getValues(), isNoteExist);
};

const getSheet = (sheetId) => {
  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName('基本コンセンサス');
  return {
    '名前': getName(sheet),
    '部位': getParts(sheet),
    '行為': getAct(sheet),
    '性別・種族': getSexRace(sheet, true),
    '年齢・容姿': getAgeVisual(sheet, true),
    '未分類': getNotCategorized(sheet),
    'シチュエーション': getSituation(sheet),
    'その他': getOther(sheet)
  };
};

const compareRObjectRecursive = (a, b) => {
  const result = {};
  for(var key in a) {
    if( typeof a[key] === 'object' ) {
      if( b[key] ) {
        result[key] = compareRObjectRecursive(a[key], b[key]);
      } else {
        result[key] = -1;
      }
    } else if( typeof a[key] === 'number' ) {
      result[key] = Math.min(a[key], b[key]);
    } else {
      result[key] = `${a[key]} vs ${b[key]}`;
    }
  }
  return result;
};

const compareTwoSheets = (offense, receive) => {
  console.log(offense, receive);
  const offenseInfo = getSheet(offense);
  const receiveInfo = getSheet(receive, true);
  return compareRObjectRecursive(offenseInfo, receiveInfo);
};

const generateReturnValue = (params, body) => {
  const output = ContentService.createTextOutput();
  if(params.callback) {
      output.setMimeType(ContentService.MimeType.JAVASCRIPT);
      output.setContent(`${params.callback}(${JSON.stringify(body)})`);
  } else {
      output.setMimeType(ContentService.MimeType.JSON);
      output.setContent(JSON.stringify(body));
  }
  return output;
};

function doGet(e) {
  if(e.parameter.compare) {
    const ids = e.parameter.compare.split(',');
    return generateReturnValue(e.parameter, compareTwoSheets(ids[0], ids[1]));
  } else if(e.parameter.sheet) {
    return generateReturnValue(e.parameter, getSheet(e.parameter.sheet));
  } else {
    return HtmlService.createTemplateFromFile('index').evaluate();
  }
}
