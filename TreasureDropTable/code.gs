function getCheatModeDiceValue(option) {
  const regexp = /(\d+)$/;
  const cheatCode = PropertiesService.getScriptProperties().getProperty('CHEAT_CODE') || '';
  if(cheatCode && option.startsWith(cheatCode) && regexp.test(option)) {
    return regexp.exec(option)[1];
  }
  return false;
}

function getTable(tableName) {
  const tables = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  if(! tableName) {
    throw `表を ${tables.join(',')}の${tables.length}種類から指定してください`;
  }
  
  const colIndex = tables.indexOf(tableName);
  if(colIndex < 0) {
    throw `表${tableName}は存在しません。表は ${tables.join(',')}の${tables.length}種類から指定してください`;
  }
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName('トレジャードロップ表').getRange(1, colIndex + 1, 72).getValues().flat().filter((d)=>{return d});
}

function rollDice(num = 6) {
  return Math.floor(Math.random() * num);
}

function replacePlaceholder(text) {
  const phDice = /\$\{(\d+)d6\}/.exec(text);
  if(phDice) {
    const diceCount = Number(phDice[1]);
    let diceResult = 0;
    for(var i = 0; i < diceCount; i++) {
      diceResult += rollDice() + 1;
    }
    return text.replace(phDice[0], diceResult);
  }

  const phChoice = /\$\{choice\[(.*)\]\}/.exec(text);　
  if(phChoice) {
    const list = phChoice[1].split(',');
    const idx =  rollDice(list.length);
    return text.replace(phChoice[0], list[idx]);
  }

  return text;
}

function getRollResult(table, option) {
  const diceResult = Number(getCheatModeDiceValue(option) || rollDice(table.length));
  return replacePlaceholder(table[diceResult]);
}

function getRollResults(tableName, count, option) {
  const table = getTable(tableName);

  if(count === 1) {
    return `トレジャードロップ表（${tableName}） ＞ ${getRollResult(table, option)}`;
  }

  const result = [];
  for(var i = 0; i < count; i++) {
    result.push(`#${i + 1}`);
    result.push(`トレジャードロップ表（${tableName}） ＞ ${getRollResult(table, option)}`);
    result.push('');
  }
  return result.join('\n').trim();
}

function behavior() {
  console.log(getRollResults('B', 3, 'デバッグモード 12'));
}

function doGet(e) {
  const repeat = Number(e.parameter.repeat);
  const params = e.parameter.params.trim().replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  }).trim();

  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  const tableName = params[0];
  const options = params.slice(1).trim();
  try {
    const diceResult = getRollResults(tableName, repeat, options);
    output.setContent(JSON.stringify({
      ok: true,
      text: diceResult,
      secret: false,
    }));
  } catch (e) {
    console.error(e, `params = ${params}`, `repeat = ${repeat}`);
    output.setContent(JSON.stringify({
      ok: true,
      text: e,
      secret: false,
    }));
  }

  return output;
}
