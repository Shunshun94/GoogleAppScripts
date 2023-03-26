function getFileId() {
  return PropertiesService.getScriptProperties().getProperty('GSS_ID');
}

function getBaseURL() {
  return PropertiesService.getScriptProperties().getProperty('BASE_URL');
}

function getIconUrl() {
  return PropertiesService.getScriptProperties().getProperty('ICON_URL');
}

function getPassword() {
  return PropertiesService.getScriptProperties().getProperty('PASSWORD');
}

function getGuildId() {
  return PropertiesService.getScriptProperties().getProperty('GUILD_ID');
}

function getForumId() {
  return PropertiesService.getScriptProperties().getProperty('FORUM_ID');
}

function behaviorCheck() {
  console.log(updateForumIds([1,2,3]));
}

function updateForumIds(idList = [], fileId = getFileId(), sheetId = 'DiscordForumSummary_forumIds') {
  const sheet = SpreadsheetApp.openById(fileId).getSheetByName(sheetId);
  const sheetHeight = sheet.getMaxRows();
  const listLength = idList.length;
  if(listLength > sheetHeight) {
    sheet.insertRows( listLength - sheetHeight );
  }
  sheet.clear();
  const contents = idList.map((id)=>{return [id]});

  sheet.getRange(1, 1, listLength).setValues(contents);
  return getPastForumIds(fileId, sheetId);
}

function getPastForumIds(fileId = getFileId(), sheetId = 'DiscordForumSummary_forumIds') {
  return SpreadsheetApp.openById(fileId).getSheetByName(sheetId).getDataRange().getValues().flat();
}

function handleForumIds(newIdList = [], fileId = getFileId(), sheetId = 'DiscordForumSummary_forumIds') {
  const pastList = getPastForumIds();
  const hasNewForum = newIdList.some((d)=>{ return ! pastList.includes(d); });
  if(hasNewForum) {
    return {
      hasNewForum: true,
      forumList:   updateForumIds(newIdList, fileId, sheetId)
    };
  } else {
    return {
      hasNewForum: false,
      forumList:   pastList
    };
  }
}

function getForum(forumId) {
    const url = `${getBaseURL()}activeThreads.cgi`;
    try {
      const response = UrlFetchApp.fetch(url, {
        'method': 'get',
        'headers': {
          'X-Auth-Token': getPassword()
        },
        'muteHttpExceptions': true
      });
      const requestResult = JSON.parse(response.getContentText());
      if(requestResult.error) {
        throw requestResult.error;
      }
      return requestResult.threads.filter((t)=>{return t.parent_id === forumId;});
    } catch(e) {
      return e;
    }
}

function getForumFirstPost(channelId) {
  const url = `${getBaseURL()}messages.cgi?channel=${channelId}&limit=1&after=1`;
  try {
    const response = UrlFetchApp.fetch(url, {
      'method': 'get',
      'headers': {
        'X-Auth-Token': getPassword()
      },
      'muteHttpExceptions': true
    });
    const requestResult = JSON.parse(response.getContentText());
    if(requestResult.error) {
      throw requestResult.error;
    }
    return requestResult[0];
  } catch(e) {
    return e;
  }
}

function postWebhook(param) {
  const url = `${getBaseURL()}post.cgi`;
  const response = UrlFetchApp.fetch(url, {
    'method': 'post',
    'headers': {
      'X-Auth-Token': getPassword()
    },
    'payload': JSON.stringify(param),
    'muteHttpExceptions': true,
    'contentType': 'application/json'
  });
  if(response.getResponseCode() !== 200) {
    console.error(`failed to post to webhook with error code ${response.getResponseCode()}`, `param = ${JSON.stringify(param)}`, response.getContentText());
    throw response.getContent();
  }
}

function groupingForums(activeForums) {
  const result = {
    open: [],
    closed: [],
    finished: [],
    unknown: []
  };
  const FORUM_NAME_PREFIX_REGEXP = /【(.+)】/;
  activeForums.forEach((forum)=>{
    const prefix = FORUM_NAME_PREFIX_REGEXP.test(forum.name) ? FORUM_NAME_PREFIX_REGEXP.exec(forum.name)[1] : forum.name;
    if(       ['終了', '流卓', 'END'].some((word)=>{ return forum.name.includes(word);})) {
      result.finished.push(forum);
    } else if(['〆', '締'].some((word)=>{ return forum.name.includes(word);})) {
      result.closed.push(forum);
    } else if(['募集', '立卓', '@'].some((word)=>{ return forum.name.includes(word);})) {
      result.open.push(forum);
    } else {
      result.unknown.push(forum);
    }
  });
  return result;
};

function pickDateTimeFromTitle(input) {
    const text = input.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    }).trim();
    const dateRegexpResult = /([01]?[0-9])\s*[\/／月\-・]\s*([0-3]?[0-9])\s*日?\s*[日月火水木金土\s\　]*/.exec(text);
    const textRemovedDate = (dateRegexpResult ? text.replace(dateRegexpResult[0], '') : text).trim();

    const timeRegexpResult = /([012]?[0-9])\s*[\:：時]\s*([0-5][0-9])?\s*[分～~]*/.exec(textRemovedDate);
    const textRemovedTime = (timeRegexpResult ? textRemovedDate.replace(timeRegexpResult[0], '') : textRemovedDate).trim();

    if(timeRegexpResult && dateRegexpResult) {
        if(timeRegexpResult[2]) {
            return {
                dateRegExp: dateRegexpResult,
                timeRegExp: timeRegexpResult,
                text: `${dateRegexpResult[1].padStart(2, 0)}/${dateRegexpResult[2].padStart(2, 0)} ${timeRegexpResult[1].padStart(2, 0)}:${timeRegexpResult[2].padStart(2, 0)}`,
                datetimeRevmoed: textRemovedTime
            };
        } else {
            return {
                dateRegExp: dateRegexpResult,
                timeRegExp: timeRegexpResult,
                text: `${dateRegexpResult[1].padStart(2, 0)}/${dateRegexpResult[2].padStart(2, 0)} ${timeRegexpResult[1].padStart(2, 0)}:00`,
                datetimeRevmoed: textRemovedTime
            };
        }
    }
    if(dateRegexpResult) {
        return {
            dateRegExp: dateRegexpResult,
            timeRegExp: timeRegexpResult,
            text: `${dateRegexpResult[1].padStart(2, 0)}/${dateRegexpResult[2].padStart(2, 0)}`,
            datetimeRevmoed: textRemovedTime
        };
    }
    return {
        dateRegExp: dateRegexpResult,
        timeRegExp: timeRegexpResult,
        text: '',
        datetimeRevmoed: textRemovedTime
    };
}

function getSessionParamRegExps() {
  return {
    'ツール':   /使用ツール\s*[:：]\s*(.*)\n/,
    '所要時間': /予定時間\s*[:：]\s*(.*)\n/,
    '形式':  /セッション形式\s*[:：]\s*(.*)\n/,
  };
}

function buildWebhookParam(groupedForums) {
    return {
      username: '卓募集状況',
      avatar_url: getIconUrl(),
      content: '現在募集中の卓は以下のとおりです\n' + groupedForums.open.map((f)=>{
          const rawTitle = f.name;
          const parsedTitle = pickDateTimeFromTitle(rawTitle.replace(/【.+】/, ''));
          const title = ['日時未定', '日時すり合わせ', '日程未定', '日程すり合わせ'].reduce((current, target)=>{return current.replace(target, '')}, parsedTitle.datetimeRevmoed).trim();
          const datetime = parsedTitle.text || '日時未定';

          const headPost = getForumFirstPost(f.id);
          const regexps = getSessionParamRegExps();
          const params = [];
          for(var column in regexps) {
            const execResult = regexps[column].exec(headPost.content);
            if(execResult) { params.push(`${column}: ${execResult[1]}`); }
          }

          return `**${title}** (開催日時：${datetime})\nhttps://discord.com/channels/${getGuildId()}/${f.id}\n　${params.join('\n　')}`;
        }).join('\n\n')
    };
}

function exec() {
  try {
    const activeForums = getForum(getForumId());
    const groupedForums = groupingForums(activeForums);
    if(groupedForums.open.length) {
      const openIds = groupedForums.open.map((f)=>{return f.id});
      const handleResult = handleForumIds(openIds);
      if(handleResult.hasNewForum) {
        const requestBody = buildWebhookParam(groupedForums);
        postWebhook(requestBody);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
