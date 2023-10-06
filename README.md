# notion-db-updater

A script to update particular Notion databases

## 開発環境 SETUP

### NOTION でワークスペースを作成

https://www.notion.so/ja-jp

### 作成したワークスペースでデータベースを作成

ページを追加 > テーブル > 新規データベース

```
カラム名:id 種類: テキスト
カラム名:name 種類: タイトル
カラム名:roles 種類: マルチセレクト
カラム名:icon 種類: ファイル＆メディア
カラム名:join 種類: 日付
カラム名:exit 種類: チェックボックス
```

作成したデータベースの URL は以下の通りになります。

```
https://www.notion.so/[ワークスペース名]/[データベース名]?v=3891d2debca84a359709e0697b99aa20
```

### notion api setting

https://programming-zero.net/notion-api-setting/

上記サイトを参考に以下２点の設定を行なってください。

```
・インテグレーションを作成しシークレットを取得
・インテグレーション作成後、上で作成したデータベースのAPI操作を許可
```

### discord bot 設定

https://discord.com/developers/docs/ja/getting-started

上記サイトを参考にアプリ・bot の作成を行なってください。

```
1.アプリを作成
2.左カラムの「Bot」メニューにて
    ・PUBLIC BOTのチェックを入れる
    ・Privileged Gateway Intentsの中のSERVER MEMBERS INTENT のチェックを入れる
    ・Tokenのリセットを行い生成されたtokenをメモしておいてください。(.envファイル「DISCORD_BOT_KEY」に記載します)
    ・「save changes」をクリックし変更を保存
3.左カラムの「OAuth > URL Generator」にて
    ・SCOPES欄の「bot」をチェック
    ・BOT PERMISSIONSの「Administrator」をチェック
    ・生成される「GENERATED URL」をコピー機しておいてください。
４.生成されたGENERATED URLにブラウザでアクセス
    ・botを追加するサーバを選択(管理者権限が必要です。)し「はい」をクリック
    ・「管理者」権限を与え与えることを確認し「はい」をクリック
```

### DISCORD_GUILD_ID を確認

ブラウザで discord にアクセスした際の URL が

```
https://discord.com/channels/[GUILD_ID]/[CHANNNEL_ID]
```

となっています。

[GUILD_ID]部分を.env ファイルの DISCORD_GUILD_ID に記載してください。

### .env ファイルを作成

.env.example をコピーして.env ファイルを作成し各環境変数を設定してください

```
DISCORD_BOT_KEY=[discordボットのキー]
DISCORD_GUILD_ID=[discordのguildID]
NOTION_API_KEY=[インテグレーションのシークレット]
NOTION_DATABASE_ID=[notionで作ったデータベース名]
```

### node_modules 取得

```
npm install
```

### スクリプト実行

```
node main.js
```

### オプション

```
Options:
  -m, --mode <optionValue>      set mode [discordOnly,notionOnly,fetchOnly,addSkip,updateSkip] (default: "default")
  -w, --waitTime <optionValue>  set waitTime [msec] (default: 0)
  -v, --verbose                 verbose (default: false)
  -s, --start                   direct start (default: false)
  -d, --dryRun                  dry run (default: false)
  -l, --limit <optionValue>     set limit (default: 0)
  -f, --from <optionValue>      set from (default: 0)
  -t, --to <optionValue>        set to (default: 0)
  -h, --help                    display help for command
```
