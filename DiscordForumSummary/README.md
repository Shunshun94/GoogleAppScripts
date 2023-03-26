# フォーラムで行われた卓募集のサマリを Webhook に投げる GAS

諸事情で単体では動かないので [SharedCLITools](https://github.com/Shunshun94/SharedCLITools) 掲載のツール群と連携させて動かす。

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
