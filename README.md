# notion-db-updater
A script to update particular Notion databases

## 開発環境SETUP

### NOTIONでワークスペースを作成
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
作成したデータベースのURLは以下の通りになります。
https://www.notion.so/[ワークスペース名]/[データベース名]?v=3891d2debca84a359709e0697b99aa20

### notion api setting
https://programming-zero.net/notion-api-setting/
上記サイトを参考に以下２点の設定を行なってください。
・インテグレーションを作成しシークレットを取得
・インテグレーション作成後、上で作成したデータベースのAPI操作を許可

### .envファイルを作成
.env.exampleをコピーして.envファイルを作成し各環境変数を設定してください
```
DISCORD_BOT_KEY=[discordボットのキー]
DISCORD_GUILD_ID=[discordのguildID]
NOTION_API_KEY=[インテグレーションのシークレット]
NOTION_DATABASE_ID=[notionで作ったデータベース名]
```

### node_modules取得
```
npm install
```

### スクリプト実行
```
node main.js
```