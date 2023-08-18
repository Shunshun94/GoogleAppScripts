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
  const activeForums = getForum(getForumId());
  const groupedForums = groupingForums(activeForums);
  console.log(groupedForums);
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

function handleNewForumIds(newIdList = [], fileId = getFileId(), sheetId = 'DiscordForumSummary_forumIds') {
  const pastList = getPastForumIds();
  const hasNewForum = newIdList.some((d)=>{ return ! pastList.includes(d); });
  if(hasNewForum) {
    return {
      isUpdated: true,
      forumList: updateForumIds(newIdList, fileId, sheetId)
    };
  } else {
    return {
      isUpdated: false,
      forumList: pastList
    };
  }
}

function handleUpdatedForumIds(newIdList = [], fileId = getFileId(), sheetId = 'DiscordForumSummary_forumIds') {
  const pastList = getPastForumIds();
  const isUpdated = newIdList.sort().join() !== pastList.sort().join();
  if(isUpdated) {
    return {
      isUpdated: true,
      forumList: updateForumIds(newIdList, fileId, sheetId)
    };
  } else {
    return {
      isUpdated: false,
      forumList: pastList
    };
  }
}

function access() {
  const url = 'https://hiyo-hitsu.sakura.ne.jp/ytsheets/ytsheet2_sw2.5/sw2.5/rolltail/browser.cgi';
    try {
      const response = UrlFetchApp.fetch(url, {
        'method': 'get',
        'headers': {
          'User-Agent': 'hiyoko'
        },
        'muteHttpExceptions': true
      });
      console.log(response.getContentText());
    } catch(e) {
      return e;
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
      if(forumId) {
        return requestResult.threads.filter((t)=>{return t.parent_id === forumId;});
      } else {
        return requestResult.threads;
      }
      
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
  console.log(JSON.stringify(result));
  return result;
};

function getSessionParamRegExps() {
  return {
    'ツール': {
      exec: (body)=>{
        const regexp = /使用ツール\s*[:：]\s*(.*)\n/.exec(body);
        if(regexp) {return regexp;}
        const toolList = {
          'ccfolia': 'ココフォリア',
          'ココフォ': 'ココフォリア',
          'ここふぉ': 'ココフォリア',
          'udonarium': 'ユドナリウム',
          'ユドナ': 'ユドナリウム',
          'ゆどな': 'ユドナリウム',
          'tekey': 'Tekey',
          'ゆとチャ':'ゆとチャットAdv',
          'むせる': 'どどんとふむせる'
        }
        const note = body.split('備考:').at(-1).replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
          return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        }).trim().toLowerCase();
        for(var key in toolList) { if(note.includes(key)) {return [key,toolList[key]];} }
        return false;
      }
    },
    '所要時間': /[予所][定要]時間\s*[:：]\s*(.*)\n/,
    '形式': /セッション形式\s*[:：]\s*(.*)\n/,
  };
}

function buildWebhookParam(groupedForums) {
  if(groupedForums.open.length === 0) {
    return {
      username: '卓募集状況',
      avatar_url: getIconUrl(),
      content: '現在募集中の卓はありません'
    };
  }
  return {
    username: '卓募集状況',
    avatar_url: getIconUrl(),
    content: '# 現在募集中の卓\n' + groupedForums.open.map((f)=>{
        const rawTitle = f.name;
        const parsedTitle = io.github.shunshun94.util.DateTimePicker.pick(rawTitle.replace(/【.+】/, ''));
        const title = ['日時未定', '日時すり合わせ', '日程未定', '日程すり合わせ', '日付すり合わせ', '日付未定'].reduce((current, target)=>{return current.replace(target, '')}, parsedTitle.datetimeRevmoed).trim();
        const datetime = parsedTitle.text || '日時未定';

        const headPost = getForumFirstPost(f.id);
        const regexps = getSessionParamRegExps();
        const params = [];
        for(var column in regexps) {
          const execResult = regexps[column].exec(headPost.content);
          if(execResult) { params.push(`${column}: ${execResult[1]}`); }
        }

        return `## ${title} (開催日時：${datetime})\nhttps://discord.com/channels/${getGuildId()}/${f.id}\n　${params.join('\n　')}`;
      }).join('\n\n')
  };
}

function isUpdated(groupedForums) {
  const openIds = groupedForums.open.map((f)=>{return f.id});
  const handleResult = handleUpdatedForumIds(openIds);
  return handleResult.isUpdated;
}

function hasNew(groupedForums) {
  const openIds = groupedForums.open.map((f)=>{return f.id});
  const handleResult = handleNewForumIds(openIds);
  return handleResult.isUpdated;
}

function hasOpenForum(groupedForums) {
  return groupedForums.open.length;
}

function updatePost() {
  exec({
    shouldPost: isUpdated
  });
}

function dailyPost() {
  exec({
    shouldPost: hasOpenForum
  });
}

function exec(functions) {
  try {
    const shouldPost = functions.shouldPost || hasNew;
    const post = functions.post || postWebhook;
    const activeForums = getForum(getForumId());
    console.log(`${activeForums.length} threads are exists`);
    const groupedForums = groupingForums(activeForums);
    if(shouldPost(groupedForums)) {
      const requestBody = buildWebhookParam(groupedForums);
      post(requestBody);
    }
  } catch (e) {
    console.error(e);
  }
}
