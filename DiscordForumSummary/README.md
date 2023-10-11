# フォーラムで行われた卓募集のサマリを Webhook に投げる GAS

## 利用しているプログラム類

### SharedCLITools

諸事情で単体では動かないので [SharedCLITools](https://github.com/Shunshun94/SharedCLITools) 掲載のツール群と連携させて動かす。

### DatetimePicker

[DatetimePicker](https://github.com/Shunshun94/shared/tree/master/other/io/github/shunshun94/util/DatetimePicker) で日付を取得している。

## 環境変数

### `BASE_URL`

[SharedCLITools](https://github.com/Shunshun94/SharedCLITools) 掲載のツール群が配置されている path

### `PASSWORD`

[SharedCLITools](https://github.com/Shunshun94/SharedCLITools) 掲載のツール群にアクセスするためのパスワード

### `FORUM_ID`

チェックするフォーラムの ID

### `GUILD_ID`

チェックするフォーラムの存在するギルドの ID

### `ICON_URL`

投稿されるサマリーのアイコン

### `GSS_ID`

Open なフォーラムの一覧を保存するために使う Google Sheets の ID

## 受け付けるフォーマット
### フォーラムのタイトル
フォーラムのタイトルは `【ステータス】開催日時 シナリオ名` のスタイルであること。   
ステータスは「募集中」ないし「締切」であること。多少の幅は持たせているがこれらであることを前提にしている。   
開催日時は [DatetimePicker](https://github.com/Shunshun94/shared/tree/master/other/io/github/shunshun94/util/DatetimePicker) のフォーマットに従うこと。
### フォーラムの本文
[オンセ募集用画像作成ツール  - TRPGギルド支部〈しゃちほこの尾びれ亭〉](https://syachi-hoko-maru.github.io/trpg-system/sw25/tool/bosyu/)のテキストフォーマットであること。   
ただし、備考欄に使用するツールを記載しておくとそれを反映する。

